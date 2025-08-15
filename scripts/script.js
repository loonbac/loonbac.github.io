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

  // GLOBO DE TEXTO
  const avatarFrame = document.getElementById('avatarFrame');
  const speechBubble = document.getElementById('speechBubble');
  
  const messages = ['¡Hola!', '¡Hey!', '¿Qué tal?', 'Saludos', '¡Hi!', 'Eyyy', '¡Buenas!'];
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

  // ==================== TERMINAL ARREGLADO - SIN CLEARTERM ANTICIPADO ==================== 
  const terminalText = document.getElementById('terminalText');
  const terminalOutput = document.getElementById('terminalOutput');
  const executedCommand = document.getElementById('executedCommand');
  const commandResult = document.getElementById('commandResult');
  const terminalContainer = document.getElementById('terminalContainer');
  
  let currentInput = '';
  let isTyping = false;
  let commandBuffer = [];
  let historyIndex = -1;
  
  // Test visual inicial
  setTimeout(() => {
    console.log('🧪 TEST: Expandiendo terminal por 3 segundos...');
    if(terminalOutput) {
      terminalOutput.classList.add('show');
      if(executedCommand) executedCommand.textContent = 'TEST';
      if(commandResult) commandResult.textContent = 'Terminal funcionando correctamente';
      
      setTimeout(() => {
        terminalOutput.classList.remove('show');
        console.log('🧪 TEST: Terminal colapsado');
      }, 3000);
    }
  }, 1000);
  
  // Sistema de comandos cifrado
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
  
  // Comandos secretos cifrados
  commands.set(encrypt('get files'), () => {
    window.open('https://github.com/loonbac', '_blank');
    clearTerminalOnly(); // Solo limpiar input, no ocultar output
  });
  
  commands.set(encrypt('admin'), () => {
    window.open('vlsm.html', '_self');
    clearTerminalOnly();
  });
  
  commands.set(encrypt('secret'), () => {
    window.open('https://cybersen.online/secret', '_blank');
    clearTerminalOnly();
  });
  
  commands.set(encrypt('matrix'), () => {
    document.body.style.animation = 'matrix-rain 2s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
      clearTerminalOnly();
    }, 2000);
  });
  
  commands.set(encrypt('konami'), () => {
    triggerKonamiEffect();
    clearTerminalOnly();
  });
  
  commands.set(encrypt('clear'), () => {
    clearTerminalAndOutput(); // Este sí oculta todo
  });
  
  commands.set(encrypt('help'), () => {
    showCommandOutput('help', 'Terminal activa. Busca los comandos ocultos...');
  });
  
  // SEPARÉ LAS FUNCIONES DE LIMPIAR
  function clearTerminalOnly() {
    // Solo limpia el input, NO oculta el output
    if(terminalText) {
      terminalText.textContent = '';
      currentInput = '';
      isTyping = false;
    }
  }
  
  function clearTerminalAndOutput() {
    // Limpia todo Y oculta el output
    clearTerminalOnly();
    hideOutput();
  }
  
  function showCommandOutput(command, output) {
    console.log('🚀 === EJECUTANDO COMANDO ===');
    console.log('Comando:', command);
    console.log('Output:', output);
    
    if(!executedCommand || !commandResult || !terminalOutput) {
      console.error('❌ ERROR: Elementos del terminal no encontrados');
      return;
    }
    
    // Mostrar comando ejecutado
    executedCommand.textContent = command;
    console.log('✅ Comando asignado:', command);
    
    // Limpiar resultado anterior
    commandResult.textContent = '';
    console.log('✅ Resultado limpiado');
    
    // EXPANDIR el terminal
    terminalOutput.classList.add('show');
    console.log('✅ Clase "show" añadida - terminal debe expandirse');
    
    // Delay para que se vea la expansión
    setTimeout(() => {
      console.log('⌨️ Empezando escritura...');
      // Escribir resultado letra por letra
      let i = 0;
      function typeChar() {
        if(i < output.length) {
          commandResult.textContent += output.charAt(i);
          i++;
          setTimeout(typeChar, 30);
        } else {
          console.log('✅ Escritura completada - esperando 5 segundos');
          // Ocultar después de 5 segundos
          setTimeout(() => {
            hideOutput();
            console.log('🔄 Terminal ocultado después de 5 segundos');
          }, 5000);
        }
      }
      typeChar();
    }, 500);
  }
  
  function hideOutput() {
    if(terminalOutput) {
      console.log('🔄 Ocultando terminal');
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
    console.log('🎯 EJECUTANDO COMANDO:', normalizedCmd);
    
    // Buscar comando cifrado
    for(let [encryptedCmd, action] of commands) {
      if(decrypt(encryptedCmd) === normalizedCmd) {
        action();
        return true;
      }
    }
    
    // Comandos públicos - QUITADO clearTerminal() de aquí
    if(normalizedCmd === 'date') {
      showCommandOutput('date', new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      clearTerminalOnly(); // Solo limpiar input
      return true;
    }
    
    if(normalizedCmd === 'whoami') {
      showCommandOutput('whoami', 'loonbac');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'pwd') {
      showCommandOutput('pwd', '/home/loonbac');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'ls') {
      showCommandOutput('ls', 'index.html  vlsm.html  styles/  scripts/  img/  ico.png');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'uname') {
      showCommandOutput('uname', 'Linux drix 5.15.0-loonbac #1 SMP x86_64 GNU/Linux');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'ps') {
      showCommandOutput('ps', 'PID TTY    TIME CMD\n2021 pts/0  00:00:00 bash\n2045 pts/0  00:00:00 ps');
      clearTerminalOnly();
      return true;
    }
    
    if(normalizedCmd === 'test') {
      showCommandOutput('test', '¡El terminal funciona perfectamente!');
      clearTerminalOnly();
      return true;
    }
    
    // Comando no encontrado
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
  
  // Event listeners para el terminal
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
      clearTerminalAndOutput(); // Este sí oculta todo
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
  
  // Click en terminal para focus
  if(terminalContainer) {
    terminalContainer.addEventListener('click', function(e) {
      terminalContainer.style.outline = '2px solid var(--c-accent)';
      setTimeout(() => {
        terminalContainer.style.outline = '';
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
})();
