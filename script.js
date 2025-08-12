(function(){
  // Theme handling
  const body = document.body;
  const themeBtn = document.getElementById('flipTheme');
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

  // Scanline toggle
  const scanToggle = document.getElementById('scanToggle');
  scanToggle?.addEventListener('click',()=>{
    const off = body.classList.toggle('no-scan');
    scanToggle.setAttribute('aria-pressed', String(!off));
    scanToggle.textContent = off?'CRT Off':'CRT';
  });

  // Year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Respect system when no manual selection
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', e=>{
    if(!localStorage.getItem('retro-theme')){
      setTheme(e.matches?'light':'dark');
    }
  });
})();
