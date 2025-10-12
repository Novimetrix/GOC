(function(){
  if (document.getElementById('nm-menu-btn')) return;
  var btn=document.createElement('button'); btn.id='nm-menu-btn'; btn.type='button'; btn.textContent=' Menu';
  document.body.appendChild(btn);

  var ov=document.createElement('div'); ov.id='nm-drawer-overlay'; document.body.appendChild(ov);
  var dr=document.createElement('div'); dr.id='nm-drawer';
  dr.innerHTML = '<header><span>Menu</span><button id="nm-close" type="button" aria-label="Close">âœ•</button></header><nav id="nm-drawer-nav"></nav>';
  document.body.appendChild(dr);

  function collectLinks(){
    var candidates = Array.from(document.querySelectorAll('nav, .menu, .ct-menu, .wp-block-navigation'));
    var best=null;
    for (var i=0;i<candidates.length;i++){
      var links = candidates[i].querySelectorAll('a[href]');
      if (links.length>=3){ best=candidates[i]; break; }
    }
    return best ? Array.from(best.querySelectorAll('a[href]')) : Array.from(document.querySelectorAll('a[href]'));
  }
  var links = collectLinks();
  var seen = new Set(), items=[];
  links.forEach(function(a){
    var href = a.getAttribute('href'); if(!href) return;
    if (/^(tel:|mailto:|#)/i.test(href)) return;
    if (seen.has(href)) return; seen.add(href);
    var label = (a.textContent||'').trim(); if (!label) label = href.replace(/https?:\/\/|\/$/g,'');
    items.push({href: href, label: label});
  });
  var nav = document.getElementById('nm-drawer-nav');
  if (items.length === 0) { nav.innerHTML = '<a href="/">Home</a>'; }
  else {
    nav.innerHTML = items.map(function(it){ return '<a href="'+it.href+'">'+it.label+'</a>'; }).join('');
  }

  function open(){ dr.classList.add('open'); ov.style.display='block'; document.body.style.overflow='hidden'; }
  function close(){ dr.classList.remove('open'); ov.style.display='none'; document.body.style.overflow=''; }

  btn.addEventListener('click', function(e){ e.preventDefault(); open(); }, {passive:false});
  document.getElementById('nm-close').addEventListener('click', function(e){ e.preventDefault(); close(); }, {passive:false});
  ov.addEventListener('click', function(e){ e.preventDefault(); close(); }, {passive:false});
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });

  nav.addEventListener('click', function(e){ var t=e.target.closest('a'); if(t) setTimeout(close,0); }, true);
})();
