(function(){
  function log(){ try{ console.log.apply(console, ['[menu-fix]'].concat([].slice.call(arguments))); }catch(e){} }
  function badge(msg){
    if (!/debug=1/.test(location.search)) return;
    var b=document.getElementById('menu-fix-badge'); if(!b){ 
      b=document.createElement('div'); b.id='menu-fix-badge';
      b.style.cssText='position:fixed;bottom:8px;left:8px;z-index:10000;background:#111;color:#0f0;padding:6px 8px;font:12px/1.3 system-ui,Arial;border-radius:6px;opacity:.9';
      document.body.appendChild(b);
    }
    b.textContent=msg;
  }

  // Try common Blocksy/Gutenberg selectors
  var btn = document.querySelector('[data-type="offcanvas"], .menu-toggle, .ct-trigger, [data-toggle="offcanvas"], .ct-header [data-toggle], .ct-header [data-id*=\"offcanvas\"]');
  if(!btn){
    var maybe = document.querySelector('[aria-controls]');
    if(maybe && document.getElementById(maybe.getAttribute('aria-controls'))) btn = maybe;
  }
  var panel = document.querySelector('#offcanvas, .ct-offcanvas, .offcanvas, .offcanvas-nav, [data-offcanvas], .ct-drawer, .ct-header [data-area=\"offcanvas\"], .ct-panel');

  if(!btn || !panel){ log('btn or panel not found', !!btn, !!panel); badge('btn/panel not found'); return; }

  // Overlay
  var overlay = document.querySelector('.ct-offcanvas-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className='ct-offcanvas-overlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:none;pointer-events:auto;';
    document.body.appendChild(overlay);
  }

  // Panel baseline styles (safe even if theme already sets these)
  var leftSide = panel.classList.contains('left') || /left/i.test(panel.id||'') || (getComputedStyle(panel).left === '0px' && getComputedStyle(panel).right === 'auto');
  panel.style.position='fixed';
  panel.style.top='0';
  if(leftSide){ panel.style.left='0'; panel.style.right='auto'; } else { panel.style.right='0'; panel.style.left='auto'; }
  panel.style.height='100vh';
  panel.style.maxWidth='420px';
  panel.style.width='100%';
  panel.style.background=panel.style.background||'#fff';
  panel.style.transform='translateX(' + (leftSide?'-100%':'100%') + ')';
  panel.style.transition=panel.style.transition||'transform .25s ease';
  panel.style.zIndex='9999';
  panel.style.pointerEvents='auto';

  function open(){
    panel.classList.add('is-open');
    panel.style.transform='translateX(0)';
    overlay.style.display='block';
    document.body.style.overflow='hidden';
    btn.setAttribute('aria-expanded','true');
    badge('opened');
  }
  function close(){
    panel.classList.remove('is-open');
    var left = (panel.style.left && panel.style.left!=='auto');
    panel.style.transform='translateX(' + (left?'-100%':'100%') + ')';
    overlay.style.display='none';
    document.body.style.overflow='';
    btn.setAttribute('aria-expanded','false');
    badge('closed');
  }

  btn.addEventListener('click', function(e){ e.preventDefault(); open(); }, {passive:false});
  overlay.addEventListener('click', function(e){ e.preventDefault(); close(); }, {passive:false});
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });

  // Close after clicking any link/button inside
  panel.addEventListener('click', function(e){
    var t = e.target.closest('a,button,[role=\"button\"]');
    if(t){ setTimeout(close,0); }
  }, true);

  // Debug
  log('wired');
  badge('wired ok');
})();
