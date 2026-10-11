(() => {
  if (window.NovaCart) return;
  const config = window.Nova;
  let busy = false;
  let opener = null;
  const status = (message, form) => {
    const targets = form ? [form.querySelector('[data-form-status]')] : document.querySelectorAll('[data-cart-status]');
    for (const target of targets) if (target) target.textContent = message;
  };
  const sections = () => [...new Set([...document.querySelectorAll('[data-cart-region]')].map((node) => node.dataset.sectionId))].slice(0, 5);
  const regions = () => document.querySelectorAll('[data-cart-region]');
  const setBusy = (value) => {
    busy = value;
    for (const region of regions()) {
      region.setAttribute('aria-busy', String(value));
      for (const control of region.querySelectorAll('input, textarea, button')) {
        if (value) { control.dataset.wasDisabled = String(control.disabled); control.disabled = true; }
        else if (control.dataset.wasDisabled !== undefined) { control.disabled = control.dataset.wasDisabled === 'true'; delete control.dataset.wasDisabled; }
      }
    }
  };
  const getCart = async () => {
    const response = await fetch(config.routes.cart + '.js', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(config.strings.cartError);
    return response.json();
  };
  const getSections = async (ids) => {
    const url = new URL(config.routes.cart, location.origin);
    url.searchParams.set('sections', ids.join(','));
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(config.strings.refreshError);
    return response.json();
  };
  const render = (markup) => {
    if (!markup) return false;
    const updates = [];
    for (const region of regions()) {
      const html = markup[region.dataset.sectionId];
      if (!html) return false;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const next = doc.querySelector('[data-cart-region]');
      if (!next) return false;
      updates.push([region, next.innerHTML]);
    }
    for (const [region, html] of updates) region.innerHTML = html;
    return true;
  };
  const announce = (cart) => {
    for (const count of document.querySelectorAll('.nova-header__count')) count.textContent = String(cart.item_count);
    for (const link of document.querySelectorAll('.nova-header__cart')) link.setAttribute('aria-label', config.strings.cartCount.replace('__COUNT__', cart.item_count));
    status(config.strings.updated.replace('__COUNT__', cart.item_count));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
  };
  const open = (trigger) => {
    const dialog = document.getElementById('NovaCartDialog');
    if (!dialog?.showModal) return false;
    opener = trigger || document.activeElement;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-cart-close]')?.focus();
    return true;
  };
  const close = () => {
    const dialog = document.getElementById('NovaCartDialog');
    if (dialog?.open) dialog.close();
  };
  const mutate = async (endpoint, payload, form = null) => {
    if (busy) return false;
    const ids = sections();
    const focused = document.activeElement;
    const focusId = focused?.id;
    const line = focused?.closest('[data-line-key]')?.dataset.lineKey;
    setBusy(true);
    let succeeded = false;
    try {
      const response = await fetch(endpoint + '.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...payload, sections: ids, sections_url: config.routes.cart }) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.description === 'string' ? result.description : config.strings.cartError);
      succeeded = true;
      const cart = endpoint === config.routes.add ? await getCart() : result;
      let markup = result.sections;
      if (!markup || ids.some((id) => !markup[id])) markup = await getSections(ids);
      if (!render(markup)) throw new Error(config.strings.refreshError);
      announce(cart);
      if (form) { status(config.strings.added, form); open(form.querySelector('[type="submit"]')); }
      else if (focusId) {
        const next = document.getElementById(focusId);
        if (next && (!line || next.closest('[data-line-key]')?.dataset.lineKey === line)) next.focus({ preventScroll: true });
        else document.querySelector('#NovaCartDialog[open] [data-cart-status], [data-cart-page] + [data-cart-status]')?.focus({ preventScroll: true });
      }
      return true;
    } catch (error) {
      // Never replay a mutation after a network/section failure; it may have succeeded.
      try {
        const cart = await getCart();
        render(await getSections(ids));
        announce(cart);
      } catch { /* Keep the native cart link available for authoritative recovery. */ }
      status(succeeded ? config.strings.refreshError : (error.message || config.strings.cartError), form);
      if (succeeded && form) open(form.querySelector('[type="submit"]'));
      return false;
    } finally { setBusy(false); }
  };
  window.NovaCart = { get: getCart, add: (id, quantity = 1) => mutate(config.routes.add, { items: [{ id, quantity }] }), update: (key, quantity) => mutate(config.routes.change, { id: key, quantity }), remove: (key) => mutate(config.routes.change, { id: key, quantity: 0 }), open, close };
  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (form.matches('[data-nova-add]')) {
      event.preventDefault();
      if (busy || form.dataset.pending) return;
      const data = new FormData(form);
      const button = form.querySelector('[type="submit"]');
      const buttonText = button?.textContent;
      form.dataset.pending = 'true';
      form.setAttribute('aria-busy', 'true');
      if (button) { button.disabled = true; button.textContent = config.strings.adding; }
      const item = { id: data.get('id'), quantity: Number(data.get('quantity') || 1) };
      if (data.get('selling_plan')) item.selling_plan = data.get('selling_plan');
      item.properties = {};
      for (const [key, value] of data) if (key.startsWith('properties[')) item.properties[key.slice(11, -1)] = value;
      try { await mutate(config.routes.add, { items: [item] }, form); }
      finally { if (button) { button.disabled = false; button.textContent = buttonText; } delete form.dataset.pending; form.removeAttribute('aria-busy'); }
    } else if (form.matches('[data-cart-form]') && event.submitter?.name !== 'checkout') {
      event.preventDefault();
      const updates = {};
      for (const line of form.querySelectorAll('[data-line-key]')) updates[line.dataset.lineKey] = Number(line.querySelector('[data-cart-quantity]').value);
      await mutate(config.routes.update, { updates, note: form.querySelector('[name="note"]').value });
    }
  });
  document.addEventListener('change', (event) => {
    if (!event.target.matches('[data-cart-quantity]')) return;
    const value = Number(event.target.value);
    const minimum = Number(event.target.dataset.quantityMin) || 1;
    const increment = Number(event.target.dataset.quantityIncrement) || 1;
    const validRule = value === 0 || (value >= minimum && (value - minimum) % increment === 0);
    event.target.setCustomValidity(validRule ? '' : config.strings.quantityError);
    if (!event.target.reportValidity()) return;
    const line = event.target.closest('[data-line-key]');
    mutate(config.routes.change, { id: line.dataset.lineKey, quantity: Number(event.target.value) });
  });
  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-cart-remove]');
    if (remove) { event.preventDefault(); if (!busy) mutate(config.routes.change, { id: remove.closest('[data-line-key]').dataset.lineKey, quantity: 0 }); return; }
    const trigger = event.target.closest('.nova-header__cart');
    if (trigger && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0 && open(trigger)) { event.preventDefault(); return; }
    if (event.target.closest('[data-cart-close]')) close();
    const dialog = document.getElementById('NovaCartDialog');
    if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); }
  });
  window.addEventListener('pageshow', async (event) => {
    if (!event.persisted || busy) return;
    try { const cart = await getCart(); const markup = await getSections(sections()); if (render(markup)) announce(cart); } catch { status(config.strings.refreshError); }
  });
  document.getElementById('NovaCartDialog')?.addEventListener('close', () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
})();
