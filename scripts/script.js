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

  const avatarFrame = document.getElementById('avatarFrame');
  const speechBubble = document.getElementById('speechBubble');
  
  const messages = ['¡Holaa!', '¡Im NOT OLD!', 'Bienvenido :D', 'Me gusta el Pollo a la Brasa', '¡Ressy tiene funciones ocultas!', 'EY EY EY', 'Soy Minecraft Player'];
  let isShowing = false;
  
  function showBubble(){
    if(!speechBubble || !avatarFrame || isShowing) return;
    
    isShowing = true;
    
    const rect = avatarFrame.getBoundingClientRect();
    const avatarCenterX = rect.left + rect.width / 2;
    const avatarBottom = rect.bottom;
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    speechBubble.querySelector('.bubble-content').textContent = randomMessage;
    
    speechBubble.style.left = avatarCenterX + 'px';
    speechBubble.style.top = (avatarBottom + 20) + 'px';
    
    requestAnimationFrame(() => {
      speechBubble.classList.add('show');
    });
    
    setTimeout(() => {
      speechBubble.classList.remove('show');
      isShowing = false;
    }, 1500);
  }
  
  if(avatarFrame){
    avatarFrame.addEventListener('click', function(e){
      e.preventDefault();
      showBubble();
    });
  }

  // ==================== CONSOLA FUNCIONAL ====================
  const topBar = document.getElementById('topBar');
  const consoleInput = document.getElementById('consoleInput');
  const promptSpan = document.getElementById('promptSpan');
  const blipCursor = document.getElementById('blipCursor');
  
  // Base64 encoded commands para ofuscar
  const hiddenCommands = {
    // "get files" -> btoa("get files") = "Z2V0IGZpbGVz"
    'Z2V0IGZpbGVz': 'https://github.com/loonbac/site/tree/main',
    // "admin panel" -> btoa("admin panel") = "YWRtaW4gcGFuZWw="
    'YWRtaW4gcGFuZWw': 'https://cybersen.online/admin',
    // "secret" -> btoa("secret") = "c2VjcmV0"
    'c2VjcmV0': 'https://github.com/loonbac',
    // "source" -> btoa("source") = "c291cmNl"
    'c291cmNl': 'https://github.com/loonbac/site',
    // "twitch" -> btoa("twitch") = "dHdpdGNo"
    'dHdpdGNo': 'https://twitch.tv/loonbac21',
    // "discord" -> btoa("discord") = "ZGlzY29yZA=="
    'ZGlzY29yZA==': 'https://discord.gg/cybersen'
  };

  let consoleActive = false;

  function activateConsole() {
    if (consoleActive) return;
    consoleActive = true;
    topBar.classList.add('console-mode');
    consoleInput.classList.add('active');
    consoleInput.focus();
    promptSpan.style.opacity = '0.7';
  }

  function deactivateConsole() {
    consoleActive = false;
    topBar.classList.remove('console-mode');
    consoleInput.classList.remove('active');
    consoleInput.value = '';
    consoleInput.blur();
    promptSpan.style.opacity = '1';
  }

  function processCommand(cmd) {
    const trimmed = cmd.trim().toLowerCase();
    if (!trimmed) return;

    // Encode command to base64 for lookup
    const encoded = btoa(trimmed);
    
    if (hiddenCommands[encoded]) {
      // Show loading animation
      topBar.classList.add('console-loading');
      
      setTimeout(() => {
        window.open(hiddenCommands[encoded], '_blank');
        deactivateConsole();
        topBar.classList.remove('console-loading');
      }, 800);
    } else {
      // Invalid command - shake animation
      topBar.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        topBar.style.animation = '';
        deactivateConsole();
      }, 500);
    }
  }

  // Event listeners
  if (topBar && consoleInput) {
    topBar.addEventListener('click', (e) => {
      if (e.target === consoleInput) return;
      activateConsole();
    });

    consoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        processCommand(consoleInput.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        deactivateConsole();
      }
    });

    consoleInput.addEventListener('blur', (e) => {
      // Small delay to allow click events to process
      setTimeout(() => {
        if (document.activeElement !== consoleInput) {
          deactivateConsole();
        }
      }, 100);
    });

    // Prevent default click behavior on console input
    consoleInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Add shake animation to CSS if not exists
  if (!document.querySelector('#shake-style')) {
    const shakeStyle = document.createElement('style');
    shakeStyle.id = 'shake-style';
    shakeStyle.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(shakeStyle);
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
