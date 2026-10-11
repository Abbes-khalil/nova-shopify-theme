if (!customElements.get('nova-product')) {
  customElements.define('nova-product', class extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      this.requestVersion = 0;
      const options = { signal: this.controller.signal };
      this.addEventListener('change', (event) => {
        if (event.target.matches('[data-variant-select], [data-variant-radio]')) this.selectVariant(event.target.value);
        if (event.target.matches('[data-option-position]')) {
          const controls=[...this.querySelectorAll('[data-option-position]')];
          const variants=JSON.parse(this.querySelector('[data-option-variants]').textContent);
          const values=controls.map(control=>control.value);
          const variant=variants.find(item=>item.options.every((value,index)=>value===values[index]));
          if(variant){this.selectVariant(String(variant.id),event.target.dataset.optionPosition);}else{
            this.pending?.abort();++this.requestVersion;
            this.querySelector('[data-product-submit]').disabled=true;
            this.querySelector('[data-product-stock]').textContent=window.Nova.strings.unavailable;
            this.querySelector('[data-variant-status]').textContent=window.Nova.strings.unavailable;
            this.querySelector('[data-product-purchase]').removeAttribute('aria-busy');
          }
        }
        if (event.target.matches('[name="selling_plan"]')) this.updatePlanPrice();
      }, options);
      this.addEventListener('click', async (event) => {
        const step = event.target.closest('[data-quantity-step]');
        if (step) {
          const input = step.parentElement.querySelector('input');
          if (Number(step.dataset.quantityStep) > 0) input.stepUp(); else input.stepDown();
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const target = event.target.closest('[data-media-target]');
        if (target) {
          event.preventDefault();
          this.showMedia(target.dataset.mediaTarget, true);
        }
        if (event.target.closest('[data-share]')) {
          try { await navigator.clipboard.writeText(this.dataset.productUrl ? new URL(location.href).href : location.href); this.querySelector('[data-share-status]').textContent = window.Nova.strings.copied; } catch { this.querySelector('[data-share-status]').textContent = location.href; }
        }
      }, options);
      this.enhance();
      const params = new URL(location.href).searchParams;
      const selected = this.querySelector('[data-variant-select]')?.selectedOptions[0];
      if (selected) this.showMedia(this.dataset.selectedMediaId);
      if (params.has('variant') && selected) this.dataset.selectedVariant = selected.value;
    }
    updatePlanPrice() {
      const option = this.querySelector('[name="selling_plan"]')?.selectedOptions[0];
      if (!option) return;
      this.querySelector('[data-product-price]').textContent = option.dataset.planPrice;
      const compare = this.querySelector('[data-product-compare]');
      compare.textContent = option.dataset.planCompare || '';
      compare.hidden = !option.dataset.planCompare;
    }
    enhance() {
      this.updatePlanPrice();
      const radios = this.querySelector('[data-variant-radios]');
      const optionControls=this.querySelector('[data-option-controls]');
      if(optionControls){optionControls.hidden=false;const select=this.querySelector('[data-variant-select]');select.hidden=true;this.querySelector('label[for="'+select.id+'"]').hidden=true;}
      if (radios) {
        radios.hidden = false;
        const select = this.querySelector('[data-variant-select]');
        select.hidden = true;
        this.querySelector('label[for="' + select.id + '"]').hidden = true;
      }
      for (const button of this.querySelectorAll('[data-quantity-step]')) button.hidden = false;
      if (navigator.clipboard) for (const button of this.querySelectorAll('[data-share]')) button.hidden = false;
      if (this.querySelector('[data-gallery]')?.classList.contains('nova-product-gallery--thumbnails')) this.querySelector('[data-gallery]').classList.add('is-enhanced');
    }
    showMedia(id, focus = false) {
      const gallery = this.querySelector('[data-gallery]');
      if (!gallery?.classList.contains('is-enhanced')) return;
      const media = id ? gallery.querySelector('[data-media-id="' + id + '"]') : gallery.querySelector('[data-media-id]');
      if (!media) return;
      for (const other of gallery.querySelectorAll('[data-media-id]')) {
        other.hidden = other !== media;
        if (other !== media) for (const video of other.querySelectorAll('video')) video.pause();
      }
      for (const link of gallery.querySelectorAll('[data-media-target]')) {
        if (link.dataset.mediaTarget === media.dataset.mediaId) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      }
      if (focus) media.focus({ preventScroll: true });
    }
    async selectVariant(id, position) {
      const version = ++this.requestVersion;
      this.pending?.abort();
      this.pending = new AbortController();
      const purchase = this.querySelector('[data-product-purchase]');
      const button = purchase.querySelector('[data-product-submit]');
      button.disabled = true;
      purchase.setAttribute('aria-busy', 'true');
      const url = new URL(this.dataset.productUrl, location.origin);
      url.searchParams.set('variant', id);
      url.searchParams.set('section_id', this.dataset.sectionId);
      try {
        const response = await fetch(url, { signal: this.pending.signal });
        if (!response.ok) throw new Error('Variant render failed');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (version !== this.requestVersion || !this.isConnected) return;
        const next = doc.querySelector('[data-product-purchase]');
        if (!next || next.querySelector('[data-variant-select]')?.value !== String(id)) throw new Error('Variant unavailable');
        const previousQuantity = purchase.querySelector('[name="quantity"]')?.value;
        const previousPlan = purchase.querySelector('[name="selling_plan"]')?.value;
        purchase.replaceWith(next);
        const nextQuantity = next.querySelector('[name="quantity"]');
        if (nextQuantity?.type === 'number' && previousQuantity) {
          const minimum = Number(nextQuantity.min) || 1;
          const increment = Number(nextQuantity.step) || 1;
          const maximum = Number(nextQuantity.max) || Infinity;
          nextQuantity.value = Math.min(maximum, minimum + Math.max(0, Math.floor((Number(previousQuantity) - minimum) / increment)) * increment);
        }
        const nextPlan = next.querySelector('[name="selling_plan"]');
        if (nextPlan && [...nextPlan.options].some((option) => option.value === previousPlan)) nextPlan.value = previousPlan;
        this.enhance();
        const focusTarget = (position ? next.querySelector('[data-option-position="'+position+'"]') : null) || next.querySelector('[data-variant-radio][value="' + id + '"]') || next.querySelector('[data-variant-select]');
        focusTarget.focus({ preventScroll: true });
        const mediaId = doc.querySelector('nova-product')?.dataset.selectedMediaId;
        if (mediaId) this.showMedia(mediaId);
        const current = new URL(location.href);
        current.searchParams.set('variant', id);
        history.replaceState({}, '', current);
        this.querySelector('[data-variant-status]').textContent = next.querySelector('[data-product-stock]').textContent + ' — ' + next.querySelector('[data-product-price]').textContent;
      } catch (error) {
        if (error.name === 'AbortError') return;
        // A read-only full-page render keeps variant selection usable if section rendering fails.
        url.searchParams.delete('section_id');
        location.assign(url);
      } finally {
        if (version === this.requestVersion) this.querySelector('[data-product-purchase]')?.removeAttribute('aria-busy');
      }
    }
    disconnectedCallback() { this.controller?.abort(); this.pending?.abort(); }
  });
}
