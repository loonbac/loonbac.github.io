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
  
  const messages = ['¡Hola!', '¡EY EY EY!', 'Ressy tiene funciones ocultas', 'Im NOT old', 'Undertale/Deltarune Fan', 'Minecraft Player', '¡Bienvenido!'];
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
    }, 3000);
  }
  
  if(avatarFrame){
    avatarFrame.addEventListener('click', function(e){
      e.preventDefault();
      showBubble();
    });
  }

  const terminalText = document.getElementById('terminalText');
  const terminalOutput = document.getElementById('terminalOutput');
  const executedCommand = document.getElementById('executedCommand');
  const commandResult = document.getElementById('commandResult');
  const terminalContainer = document.getElementById('terminalContainer');
  
  let currentInput = '';
  let isTyping = false;
  let commandBuffer = [];
  let historyIndex = -1;
  
  const commands = new Map();
  
  function encrypt(str) {
    return btoa(str.replace(/[a-zA-Z]/g, function(c) {
      return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    }));
  }
  
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
  
  commands.set(encrypt('cybersen'), () => {
    window.open('https://cybersen.online/', '_blank');
    clearTerminalOnly();
  });
  
  
  commands.set(encrypt('konami'), () => {
    triggerKonamiEffect();
    clearTerminalOnly();
  });
  
  function clearTerminalOnly() {
    if(terminalText) {
      terminalText.textContent = '';
      currentInput = '';
      isTyping = false;
    }
  }
  
  function clearTerminalAndOutput() {
    clearTerminalOnly();
    hideOutput();
  }
  
  function showCommandOutput(command, output) {
    
    if(!executedCommand || !commandResult || !terminalOutput) {
      return;
    }
    
    executedCommand.textContent = command;
    
    commandResult.textContent = '';
    
    terminalOutput.classList.add('show');
    
    setTimeout(() => {
      let i = 0;
      function typeChar() {
        if(i < output.length) {
          commandResult.textContent += output.charAt(i);
          i++;
          setTimeout(typeChar, 30);
        } else {
          setTimeout(() => {
            hideOutput();
          }, 5000);
        }
      }
      typeChar();
    }, 500);
  }
  
  function hideOutput() {
    if(terminalOutput) {
      terminalOutput.classList.remove('show');
    }
  }
  
  function updateTerminalDisplay() {
    if(terminalText && !isTyping) {
      terminalText.textContent = currentInput;
    }
  }
  
  function executeCommand(cmd) {
    const normalizedCmd = cmd.toLowerCase().trim();
    
    for(let [encryptedCmd, action] of commands) {
      if(decrypt(encryptedCmd) === normalizedCmd) {
        action();
        return true;
      }
    }
    
    if(normalizedCmd === 'date') {
      showCommandOutput('date', new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'whoami') {
      showCommandOutput('whoami', 'loonbac21');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'pwd') {
      showCommandOutput('pwd', '/home/loonbac');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'ls') {
      showCommandOutput('ls', 'index.html  vlsm.html  styles/  scripts/  img/');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'playlist') {
      if(window.musicWindow && !window.musicWindow.isClosed()) {
        showCommandOutput('playlist', 'El reproductor ya está abierto');
      } else {
        window.musicWindow?.show();
        showCommandOutput('playlist', 'Reproductor de música abierto');
      }
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'ps') {
      showCommandOutput('ps', 'PID TTY    TIME CMD\n2021 pts/0  00:00:00 bash\n2045 pts/0  00:00:00 ps');
      clearTerminalOnly();
      return true;
    }
    
    showCommandOutput(normalizedCmd, `bash: ${normalizedCmd}: command not found`);
    clearTerminalOnly();
    return true;
  }
  
  function triggerKonamiEffect() {
    document.body.style.transform = 'rotate(360deg)';
    document.body.style.transition = 'transform 1s ease-in-out';
    setTimeout(() => {
      document.body.style.transform = '';
      document.body.style.transition = '';
    }, 1000);
  }
  
  document.addEventListener('keydown', function(e) {
    if(isTyping) return;
    
    if(e.key === 'Enter') {
      e.preventDefault();
      if(currentInput.trim()) {
        commandBuffer.push(currentInput);
        historyIndex = commandBuffer.length;
        executeCommand(currentInput);
      }
      return;
    }
    
    if(e.key === 'Escape') {
      clearTerminalAndOutput();
      return;
    }
    
    if(e.key === 'Backspace') {
      e.preventDefault();
      currentInput = currentInput.slice(0, -1);
      updateTerminalDisplay();
      return;
    }
    
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
    
    if(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if(currentInput.length < 50) {
        currentInput += e.key;
        updateTerminalDisplay();
      }
    }
  });
  
  if(terminalContainer) {
    terminalContainer.addEventListener('click', function(e) {
      terminalContainer.style.outline = '2px solid var(--c-accent)';
      setTimeout(() => {
        terminalContainer.style.outline = '';
      }, 200);
    });
  }


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
      showCommandOutput('konami', '¡Código Konami activado!');
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

  // ==================== VENTANA FLOTANTE DE MÚSICA ====================
  class FloatingWindow {
    constructor() {
      this.window = document.getElementById('musicWindow');
      this.closeBtn = document.getElementById('closeBtn');
      this.minimizeBtn = document.getElementById('minimizeBtn');
      this.header = this.window?.querySelector('.window-header');
      
      this.isDragging = false;
      this.isMinimized = false;
      this.closed = false;
      this.startX = 0;
      this.startY = 0;
      this.initialX = 0;
      this.initialY = 0;
      
      this.init();
    }
    
    init() {
      if (!this.window) return;
      
      // Eventos de botones
      this.closeBtn?.addEventListener('click', () => this.hide());
      this.minimizeBtn?.addEventListener('click', () => this.toggleMinimize());
      
      // Eventos de arrastre optimizados
      this.header?.addEventListener('mousedown', (e) => this.startDrag(e));
      document.addEventListener('mousemove', (e) => this.drag(e), { passive: true });
      document.addEventListener('mouseup', () => this.stopDrag());
      
      // Eventos táctiles para móvil
      this.header?.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
      document.addEventListener('touchmove', (e) => this.drag(e.touches[0]), { passive: true });
      document.addEventListener('touchend', () => this.stopDrag());
      
      // Mostrar automáticamente al cargar la página
      setTimeout(() => {
        this.closed = true; // Marcar como cerrada inicialmente
        this.show();
      }, 1000);
    }
    
    isClosed() {
      return this.closed;
    }
    
    setInitialPosition() {
      const rect = this.window.getBoundingClientRect();
      this.initialX = window.innerWidth - rect.width - 20;
      this.initialY = window.innerHeight - rect.height - 20;
      
      this.window.style.left = this.initialX + 'px';
      this.window.style.top = this.initialY + 'px';
    }
    
    show() {
      this.closed = false;
      this.window.classList.remove('hidden');
      this.setInitialPosition();
      
      // Animación de entrada más suave
      this.window.style.transform = 'scale(0.9) translateY(20px)';
      this.window.style.opacity = '0';
      
      requestAnimationFrame(() => {
        this.window.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        this.window.style.transform = 'scale(1) translateY(0)';
        this.window.style.opacity = '1';
        
        setTimeout(() => {
          this.window.style.transition = '';
        }, 300);
      });
    }
    
    hide() {
      this.closed = true;
      
      // Animación de salida más rápida
      this.window.style.transition = 'all 0.2s ease-in';
      this.window.style.transform = 'scale(0.95) translateY(10px)';
      this.window.style.opacity = '0';
      
      setTimeout(() => {
        this.window.classList.add('hidden');
        this.window.style.transition = '';
        this.isMinimized = false;
        this.window.classList.remove('minimized');
      }, 200);
    }
    
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      this.window.classList.toggle('minimized', this.isMinimized);
      
      // Cambiar icono del botón
      this.minimizeBtn.textContent = this.isMinimized ? '□' : '−';
      this.minimizeBtn.title = this.isMinimized ? 'Restaurar' : 'Minimizar';
    }
    
    startDrag(e) {
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      
      const rect = this.window.getBoundingClientRect();
      this.initialX = rect.left;
      this.initialY = rect.top;
      
      this.window.style.cursor = 'grabbing';
      this.header.style.cursor = 'grabbing';
      
      e.preventDefault();
    }
    
    drag(e) {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;
      
      let newX = this.initialX + deltaX;
      let newY = this.initialY + deltaY;
      
      // Limitar a los bordes de la ventana
      const rect = this.window.getBoundingClientRect();
      newX = Math.max(0, Math.min(window.innerWidth - rect.width, newX));
      newY = Math.max(0, Math.min(window.innerHeight - rect.height, newY));
      
      // Usar transform para mejor rendimiento
      this.window.style.transform = `translate(${newX - this.initialX}px, ${newY - this.initialY}px)`;
    }
    
    stopDrag() {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      
      // Aplicar posición final y limpiar transform
      const transform = this.window.style.transform;
      if (transform) {
        const matrix = new DOMMatrix(getComputedStyle(this.window).transform);
        const finalX = this.initialX + matrix.m41;
        const finalY = this.initialY + matrix.m42;
        
        this.window.style.left = finalX + 'px';
        this.window.style.top = finalY + 'px';
        this.window.style.transform = '';
      }
      
      this.window.style.cursor = '';
      this.header.style.cursor = 'move';
    }
  }
  
  // Inicializar ventana flotante y hacerla accesible globalmente
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.musicWindow = new FloatingWindow();
    });
  } else {
    window.musicWindow = new FloatingWindow();
  }
})();
