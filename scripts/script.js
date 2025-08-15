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

  // ==================== TERMINAL SIMPLIFICADO SIN SOLAPAMIENTO ====================
  const terminalText = document.getElementById('terminalText');
  const topBar = document.querySelector('.top-bar');
  
  let currentInput = '';
  let isTyping = false;
  let commandBuffer = [];
  let historyIndex = -1;
  
  // Sistema de comandos cifrado
  const commands = new Map();
  
  // Función para cifrar comandos (ROT13 + Base64)
  function encrypt(str) {
    return btoa(str.replace(/[a-zA-Z]/g, function(c) {
      return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    }));
  }
  
  // Función para descifrar comandos
  function decrypt(str) {
    try {
      const decoded = atob(str);
      return decoded.replace(/[a-zA-Z]/g, function(c) {
        return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
      });
    } catch(e) {
      return '';
    }
  }
  
  // Comandos secretos cifrados
  commands.set(encrypt('get files'), () => {
    window.open('https://github.com/loonbac', '_blank');
    clearTerminal();
  });
  
  commands.set(encrypt('admin'), () => {
    window.open('vlsm.html', '_self');
    clearTerminal();
  });
  
  commands.set(encrypt('secret'), () => {
    window.open('https://cybersen.online/secret', '_blank');
    clearTerminal();
  });
  
  commands.set(encrypt('matrix'), () => {
    document.body.style.animation = 'matrix-rain 2s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
      clearTerminal();
    }, 2000);
  });
  
  commands.set(encrypt('konami'), () => {
    triggerKonamiEffect();
    clearTerminal();
  });
  
  commands.set(encrypt('clear'), () => {
    clearTerminal();
  });
  
  commands.set(encrypt('help'), () => {
    typeMessage('Terminal activa. Busca los comandos ocultos...');
    setTimeout(clearTerminal, 3000);
  });
  
  function clearTerminal() {
    if(terminalText) {
      terminalText.textContent = '';
      currentInput = '';
      isTyping = false;
    }
  }
  
  function typeMessage(msg, speed = 50) {
    if(isTyping || !terminalText) return;
    
    isTyping = true;
    terminalText.textContent = '';
    terminalText.style.color = 'var(--c-accent)';
    currentInput = ''; // Limpiar input durante typing
    
    let i = 0;
    function typeChar() {
      if(i < msg.length) {
        terminalText.textContent += msg.charAt(i);
        i++;
        setTimeout(typeChar, speed);
      } else {
        isTyping = false;
        setTimeout(() => {
          terminalText.style.color = '';
        }, 100);
      }
    }
    typeChar();
  }
  
  function updateTerminalDisplay() {
    if(terminalText && !isTyping) {
      terminalText.textContent = currentInput;
    }
  }
  
  function executeCommand(cmd) {
    const normalizedCmd = cmd.toLowerCase().trim();
    
    // Buscar comando cifrado
    for(let [encryptedCmd, action] of commands) {
      if(decrypt(encryptedCmd) === normalizedCmd) {
        action();
        return true;
      }
    }
    
    // Comandos públicos simples
    if(normalizedCmd === 'date') {
      typeMessage(new Date().toLocaleString());
      setTimeout(clearTerminal, 2000);
      return true;
    }
    
    if(normalizedCmd === 'whoami') {
      typeMessage('loonbac');
      setTimeout(clearTerminal, 2000);
      return true;
    }
    
    if(normalizedCmd === 'pwd') {
      typeMessage('/home/loonbac');
      setTimeout(clearTerminal, 2000);
      return true;
    }
    
    if(normalizedCmd === 'ls') {
      typeMessage('index.html  vlsm.html  styles/  scripts/  img/');
      setTimeout(clearTerminal, 2500);
      return true;
    }
    
    return false;
  }
  
  function triggerKonamiEffect() {
    document.body.style.transform = 'rotate(360deg)';
    document.body.style.transition = 'transform 1s ease-in-out';
    setTimeout(() => {
      document.body.style.transform = '';
      document.body.style.transition = '';
    }, 1000);
  }
  
  // Event listeners para el terminal
  document.addEventListener('keydown', function(e) {
    if(isTyping) return; // No permitir input mientras se escribe
    
    // Enter - ejecutar comando
    if(e.key === 'Enter') {
      e.preventDefault();
      if(currentInput.trim()) {
        commandBuffer.push(currentInput);
        historyIndex = commandBuffer.length;
        
        if(!executeCommand(currentInput)) {
          typeMessage(`bash: ${currentInput}: command not found`);
          setTimeout(clearTerminal, 1500);
        }
      }
      return;
    }
    
    // Escape - limpiar
    if(e.key === 'Escape') {
      clearTerminal();
      return;
    }
    
    // Backspace
    if(e.key === 'Backspace') {
      e.preventDefault();
      currentInput = currentInput.slice(0, -1);
      updateTerminalDisplay();
      return;
    }
    
    // Flecha arriba/abajo - historial
    if(e.key === 'ArrowUp') {
      e.preventDefault();
      if(historyIndex > 0) {
        historyIndex--;
        currentInput = commandBuffer[historyIndex] || '';
        updateTerminalDisplay();
      }
      return;
    }
    
    if(e.key === 'ArrowDown') {
      e.preventDefault();
      if(historyIndex < commandBuffer.length - 1) {
        historyIndex++;
        currentInput = commandBuffer[historyIndex] || '';
      } else {
        historyIndex = commandBuffer.length;
        currentInput = '';
      }
      updateTerminalDisplay();
      return;
    }
    
    // Caracteres normales
    if(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if(currentInput.length < 50) { // Límite de caracteres
        currentInput += e.key;
        updateTerminalDisplay();
      }
    }
  });
  
  // Click en la barra superior para activar el terminal
  if(topBar) {
    topBar.addEventListener('click', function(e) {
      // Focus visual en la terminal
      topBar.style.outline = '2px solid var(--c-accent)';
      setTimeout(() => {
        topBar.style.outline = '';
      }, 200);
    });
  }

  // Secuencia Konami
  let konamiSequence = [];
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  
  document.addEventListener('keydown', function(e) {
    konamiSequence.push(e.code);
    
    if(konamiSequence.length > konamiCode.length) {
      konamiSequence.shift();
    }
    
    if(konamiSequence.length === konamiCode.length && 
       konamiSequence.every((key, i) => key === konamiCode[i])) {
      triggerKonamiEffect();
      typeMessage('¡Código Konami activado!');
      setTimeout(clearTerminal, 2000);
      konamiSequence = [];
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
