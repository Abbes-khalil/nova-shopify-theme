if (!customElements.get('nova-recommendations')) {
  customElements.define('nova-recommendations', class extends HTMLElement {
    connectedCallback() {
      if (this.querySelector('.nova-product-grid')) return;
      this.controller = new AbortController();
      this.observer = new IntersectionObserver(async (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer.disconnect();
        try {
          const response = await fetch(this.dataset.url, { signal: this.controller.signal });
          if (!response.ok) return;
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          const content = doc.querySelector('nova-recommendations .nova-section');
          if (content && this.isConnected) this.replaceChildren(content);
        } catch { /* Recommendations are optional; never block the purchase form. */ }
      }, { rootMargin: '200px' });
      this.observer.observe(this);
    }
    disconnectedCallback() { this.observer?.disconnect(); this.controller?.abort(); }
  });
}
