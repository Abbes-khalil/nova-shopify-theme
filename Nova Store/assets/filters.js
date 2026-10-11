(() => {
  const init = (root = document) => {
    for (const range of root.querySelectorAll('[data-price-range]')) {
      if (range.dataset.ready) continue;
      range.dataset.ready = 'true';
      const min = range.querySelector('[data-price-min]');
      const max = range.querySelector('[data-price-max]');
      const minSlider = range.querySelector('[data-slider-min]');
      const maxSlider = range.querySelector('[data-slider-max]');
      range.querySelector('.nova-price-sliders').hidden = false;
      const sync = () => {
        minSlider.value = min.value || '0';
        maxSlider.value = max.value || max.max;
        min.setCustomValidity(max.value && Number(min.value) > Number(max.value) ? window.Nova.strings.priceError : '');
      };
      sync();
      min.addEventListener('input', sync);
      max.addEventListener('input', sync);
      minSlider.addEventListener('input', () => { min.value = Math.min(Number(minSlider.value), Number(maxSlider.value)); sync(); });
      maxSlider.addEventListener('input', () => { max.value = Math.max(Number(maxSlider.value), Number(minSlider.value)); sync(); });
    }
  };
  init();
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();

(() => {
 const init=(root=document)=>{
  for(const section of root.querySelectorAll('[data-filter-section]')){
   if(section.dataset.drawerReady)continue;
   const dialog=section.querySelector('[data-filter-dialog]'),form=section.querySelector('[data-filter-form]'),anchor=section.querySelector('[data-filter-anchor]'),host=section.querySelector('[data-filter-host]'),button=section.querySelector('[data-filter-open]');
   if(!dialog?.showModal||!form)continue;
   section.dataset.drawerReady='true';
   const mq=matchMedia('(max-width: 749px)');
   const sync=()=>{if(dialog.open)dialog.close();if(mq.matches){host.append(form);button.hidden=false;}else{anchor.after(form);button.hidden=true;}};
   button.addEventListener('click',()=>{dialog.showModal();button.setAttribute('aria-expanded','true');});
   section.querySelector('[data-filter-close]').addEventListener('click',()=>dialog.close());
   dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');if(mq.matches)button.focus();});
   dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
   mq.addEventListener('change',sync);
   section.addEventListener('shopify:section:unload',()=>mq.removeEventListener('change',sync),{once:true});
   sync();
  }
 };
 init();document.addEventListener('shopify:section:load',event=>init(event.target));
})();
