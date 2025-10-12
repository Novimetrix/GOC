/**
 * fix-menu.js â€” Re-init Blocksy/Elementor bindings after HTTrack export.
 * Safe no-op if objects arenâ€™t present.
 */
(function () {
  function reinit() {
    try {
      if (window.ctDrawer && typeof window.ctDrawer.init === 'function') {
        window.ctDrawer.init();
      }
    } catch (e) {}

    // Elementor frontend (if present)
    try {
      if (typeof elementorFrontend !== 'undefined' && elementorFrontend && typeof elementorFrontend.init === 'function') {
        elementorFrontend.init();
      }
    } catch (e) {}

    // Minimal generic fallback: togglers that specify a target via data-toggle-target
    try {
      document.querySelectorAll('[data-toggle-target]').forEach(function(btn){
        btn.__gocBound || btn.addEventListener('click', function(e){
          var sel = btn.getAttribute('data-toggle-target');
          if (!sel) return;
          var target = document.querySelector(sel);
          if (!target) return;
          target.classList.toggle('is-open');
          document.body.classList.toggle('goc-menu-open');
        });
        btn.__gocBound = true;
      });
    } catch(e) {}
  }

  var debouncing;
  function debounce(fn, wait){
    return function(){
      clearTimeout(debouncing);
      debouncing = setTimeout(fn, wait);
    };
  }

  document.addEventListener('DOMContentLoaded', reinit);
  window.addEventListener('load', reinit);
  window.addEventListener('resize', debounce(reinit, 200));
})();
