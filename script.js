(function(){
  const body = document.body;
  const themeBtn = document.getElementById('flipTheme');
  const scanToggle = document.getElementById('scanToggle');

  function getTheme(){return document.documentElement.getAttribute('data-theme')||'dark';}
  function setTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    body.classList.add('theme-flip');
    setTimeout(()=>body.classList.remove('theme-flip'),450);
    const label = themeBtn?.querySelector('.theme-name');
    if(label) label.textContent = t==='dark'?'Dark':'Light';
    try{localStorage.setItem('retro-theme',t);}catch(e){}
  }

  const saved = localStorage.getItem('retro-theme');
  setTheme(saved || 'dark');

  themeBtn?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark'));

  scanToggle?.addEventListener('click',()=>{
    const off = body.classList.toggle('no-scan');
    scanToggle.setAttribute('aria-pressed', String(!off));
    scanToggle.textContent = off?'CRT Off':'CRT';
  });

  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // System preference sync if no manual choice
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', e=>{
    if(!localStorage.getItem('retro-theme')){
      setTheme(e.matches?'light':'dark');
    }
  });

  // Optional: if quieres que el panel intro llene un mínimo de la pantalla:
  // document.getElementById('intro').style.minHeight = 'clamp(320px, 60vh, 620px)';
})();
