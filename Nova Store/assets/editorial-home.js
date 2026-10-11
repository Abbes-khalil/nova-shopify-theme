/* Header stays readable outside the first campaign. No scroll-jacking. */
(() => {
  const header = () => document.querySelector('.nova-header-section');
  let queued = false;
  const update = () => {
    queued = false;
    const node = header();
    if (!node) return;
    const hero = document.querySelector('#MainContent > .shopify-section:first-child .nova-hero--campaign');
    const bounds = hero?.getBoundingClientRect();
    const hasImage = !!hero?.querySelector('.nova-hero__image');
    node.dataset.overlay = String(hasImage && bounds.top <= node.offsetHeight && bounds.bottom > node.offsetHeight);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('shopify:section:load', schedule);
  document.addEventListener('shopify:section:reorder', schedule);
  update();
})();
