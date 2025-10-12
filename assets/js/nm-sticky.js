(function(){
  function setPad(){
    var h = document.querySelector('.ct-header, header.site-header');
    if(!h) return;
    var hh = h.getBoundingClientRect().height || 64;
    document.body.style.paddingTop = hh + 'px';
  }
  setPad();
  window.addEventListener('resize', function(){ setPad(); }, {passive:true});
  document.addEventListener('DOMContentLoaded', setPad);
})();
