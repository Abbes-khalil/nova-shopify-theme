if (!customElements.get('nova-search')) {
  customElements.define('nova-search', class extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      this.input = this.querySelector('[data-search-input]');
      this.results = this.querySelector('[data-search-results]');
      this.status = this.querySelector('[data-search-status]');
      const options = { signal: this.controller.signal };
      this.input.addEventListener('input', () => {
        clearTimeout(this.timer);
        this.pending?.abort();
        this.queryVersion = (this.queryVersion || 0) + 1;
        const query = this.input.value.trim();
        this.hide();
        if (query.length < 2) { this.status.textContent = ''; return; }
        this.timer = setTimeout(() => this.suggest(query, this.queryVersion), 250);
      }, options);
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { this.pending?.abort(); clearTimeout(this.timer); this.hide(); this.input.focus(); return; }
        if (!['ArrowDown', 'ArrowUp'].includes(event.key) || this.results.hidden) return;
        const links = [...this.results.querySelectorAll('a')];
        if (!links.length) return;
        event.preventDefault();
        const current = links.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1;
        if (next < 0 || next >= links.length) this.input.focus(); else links[next].focus();
      }, options);
      document.addEventListener('click', (event) => { if (!this.contains(event.target)) this.hide(); }, options);
      this.addEventListener('focusout', (event) => { if (event.relatedTarget && !this.contains(event.relatedTarget)) this.hide(); }, options);
    }
    hide() { this.results.hidden = true; this.input.setAttribute('aria-expanded', 'false'); }
    async suggest(query, version) {
      this.pending = new AbortController();
      this.status.textContent = window.Nova.strings.searchLoading;
      const url = new URL(window.Nova.routes.search, location.origin);
      url.searchParams.set('q', query);
      url.searchParams.set('resources[type]', 'product,collection,article,page');
      url.searchParams.set('resources[limit]', '4');
      url.searchParams.set('section_id', 'predictive-search');
      try {
        const response = await fetch(url, { signal: this.pending.signal });
        if (!response.ok) throw new Error('Suggestions unavailable');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (version !== this.queryVersion || query !== this.input.value.trim() || !this.isConnected) return;
        const content = doc.querySelector('[data-predictive-content]');
        if (!content) throw new Error('Suggestions unavailable');
        this.results.replaceChildren(content);
        this.results.hidden = false;
        this.input.setAttribute('aria-expanded', 'true');
        this.status.textContent = '';
      } catch (error) {
        if (error.name === 'AbortError') return;
        this.hide();
        this.status.textContent = window.Nova.strings.searchError;
      }
    }
    disconnectedCallback() { clearTimeout(this.timer); this.controller?.abort(); this.pending?.abort(); }
  });
}
