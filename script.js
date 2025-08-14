(function(){
  const body = document.body;
  const themeBtn = document.getElementById('flipTheme');

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

  // GLOBO DE TEXTO - VERSIÓN ARREGLADA SIN SALTOS
  const avatarFrame = document.getElementById('avatarFrame');
  const speechBubble = document.getElementById('speechBubble');
  
  const messages = ['¡Hola!', '¡Hey!', '¿Qué tal?', 'Saludos', '¡Hi!', 'Eyyy', '¡Buenas!'];
  let isShowing = false; // Prevenir clicks múltiples
  
  function showBubble(){
    if(!speechBubble || !avatarFrame || isShowing) return;
    
    isShowing = true;
    
    // Calcular posición ANTES de mostrar
    const rect = avatarFrame.getBoundingClientRect();
    const avatarCenterX = rect.left + rect.width / 2;
    const avatarBottom = rect.bottom;
    
    // Mensaje aleatorio
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    speechBubble.querySelector('.bubble-content').textContent = randomMessage;
    
    // PRIMERO: Posicionar el globo (mientras está invisible)
    speechBubble.style.left = avatarCenterX + 'px';
    speechBubble.style.top = (avatarBottom + 20) + 'px';
    
    // LUEGO: Usar requestAnimationFrame para asegurar que la posición se aplique
    requestAnimationFrame(() => {
      // DESPUÉS: Mostrar con animación
      speechBubble.classList.add('show');
    });
    
    console.log('Globo mostrado:', randomMessage, 'en posición fija:', avatarCenterX, avatarBottom + 20);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      speechBubble.classList.remove('show');
      isShowing = false;
      console.log('Globo ocultado');
    }, 3000);
  }
  
  // Event listener con debounce simple
  if(avatarFrame){
    avatarFrame.addEventListener('click', function(e){
      e.preventDefault();
      console.log('Click en avatar detectado');
      showBubble();
    });
  }

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
