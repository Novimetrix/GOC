(function(){
  var btn=document.querySelector('.menu-toggle,[data-toggle="offcanvas"],.ct-trigger');
  var panel=document.querySelector('.ct-offcanvas,.offcanvas,.offcanvas-nav,[data-offcanvas]');
  if(!btn||!panel){ console.warn('menu-fix: missing btn or panel'); return; }
  var o=document.querySelector('.ct-offcanvas-overlay'); 
  if(!o){ o=document.createElement('div'); o.className='ct-offcanvas-overlay'; Object.assign(o.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,.45)',zIndex:'9998',display:'none'}); document.body.appendChild(o); }
  Object.assign(panel.style,{position:'fixed',top:0,right:0,height:'100vh',maxWidth:'420px',width:'100%',background:'#fff',transform:'translateX(100%)',transition:'transform .25s',zIndex:9999});
  function open(){ panel.classList.add('is-open'); panel.style.transform='translateX(0)'; o.style.display='block'; document.body.style.overflow='hidden'; }
  function close(){ panel.classList.remove('is-open'); panel.style.transform='translateX(100%)'; o.style.display='none'; document.body.style.overflow=''; }
  btn.addEventListener('click',function(e){ e.preventDefault(); open(); },{passive:false});
  var x=document.querySelector('.ct-close,.close-offcanvas'); if(x) x.addEventListener('click',function(e){ e.preventDefault(); close(); },{passive:false});
  o.addEventListener('click',function(e){ e.preventDefault(); close(); },{passive:false});
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
  panel.addEventListener('click',function(e){ if(e.target.closest('a,button')) setTimeout(close,0); },true);
  console.log('menu-fix loaded');
})();
