(function(){
  const body = document.body;
  const themeBtn = document.getElementById('flipTheme');
  const avatarFrame = document.getElementById('avatarFrame');
  const speechBubble = document.getElementById('speechBubble');

  // Array de mensajes aleatorios para el globo
  const messages = [
    '¡Hola!',
    '¡Hey!',
    '¿Qué tal?',
    'Saludos',
    '¡Hi!',
    'Eyyy',
    'Holaaa'
  ];

  function getTheme(){return document.documentElement.getAttribute('data-theme')||'dark';}
  function setTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    body.classList.add('theme-flip');
    setTimeout(()=>body.classList.remove('theme-flip'),450);
    if(themeBtn){
      const label = themeBtn.querySelector('.theme-name');
      if(label) label.textContent = t==='dark'?'Dark':'Light';
      const isDark = t==='dark';
      themeBtn.setAttribute('aria-pressed', String(isDark));
      themeBtn.setAttribute('aria-label', isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    }
    try{localStorage.setItem('retro-theme',t);}catch(e){}
  }

  // Función para mostrar el globo de texto
  function showSpeechBubble(){
    if(speechBubble.classList.contains('show')) return; // No mostrar si ya está visible
    
    // Seleccionar mensaje aleatorio
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    speechBubble.querySelector('.bubble-content').textContent = randomMessage;
    
    // Mostrar globo
    speechBubble.classList.add('show');
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
      speechBubble.classList.remove('show');
    }, 2000);
  }

  // Event listeners para el avatar
  avatarFrame?.addEventListener('click', showSpeechBubble);
  avatarFrame?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      showSpeechBubble();
    }
  });

  const saved = localStorage.getItem('retro-theme');
  setTheme(saved || 'dark');

  themeBtn?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark'));

  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', e=>{
    if(!localStorage.getItem('retro-theme')){
      setTheme(e.matches?'light':'dark');
    }
  });
})();
