// ==================== FUNCIONES DE VALIDACIÓN ====================
function validarIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

function validarPrefijo(prefijo) {
    return prefijo >= 1 && prefijo <= 30;
}

function calcularPrefijoDesdeHosts(numHosts) {
    return 32 - Math.ceil(Math.log2(numHosts + 2));
}

function calcularWildcard(mascara) {
    const partes = mascara.split('.').map(Number);
    return partes.map(parte => 255 - parte).join('.');
}

// ==================== FUNCIONES DE CONVERSIÓN IP ====================
function ipToInt(ip) {
    const partes = ip.split('.').map(Number);
    return (partes[0] << 24) | (partes[1] << 16) | (partes[2] << 8) | partes[3];
}

function intToIP(int) {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
}

function calcularMascara(prefijo) {
    const mask = (0xFFFFFFFF << (32 - prefijo)) >>> 0;
    return intToIP(mask);
}

// ==================== CÁLCULO VLSM ====================
function calcularVLSM() {
    const ipBase = document.getElementById('vlsm-ip').value.trim();
    const prefijoStr = document.getElementById('vlsm-prefix').value.trim();
    const hostsInput = document.getElementById('vlsm-hosts').value.trim();
    const resultsDiv = document.getElementById('vlsm-results');
    
    // Validaciones
    if (!ipBase || !prefijoStr || !hostsInput) {
        mostrarError(resultsDiv, '⚠️ Por favor completa todos los campos');
        return;
    }
    
    if (!validarIP(ipBase)) {
        mostrarError(resultsDiv, '❌ La dirección IP no es válida');
        return;
    }
    
    const prefijoPrincipal = parseInt(prefijoStr);
    if (!validarPrefijo(prefijoPrincipal)) {
        mostrarError(resultsDiv, '❌ El prefijo debe estar entre 1 y 30');
        return;
    }
    
    const hosts = hostsInput.split(',')
        .map(h => parseInt(h.trim()))
        .filter(h => h > 0)
        .sort((a, b) => b - a);
    
    if (hosts.length === 0) {
        mostrarError(resultsDiv, '❌ Ingresa al menos una cantidad de hosts válida');
        return;
    }
    
    try {
        const resultado = procesarVLSM(ipBase, prefijoPrincipal, hosts);
        if (typeof resultado === 'string') {
            mostrarError(resultsDiv, resultado);
        } else {
            mostrarResultadosVLSM(resultado, resultsDiv);
        }
    } catch (error) {
        mostrarError(resultsDiv, '❌ Error en el cálculo: ' + error.message);
    }
}

function procesarVLSM(ipBase, prefijoPrincipal, hosts) {
    const redPrincipalInt = ipToInt(ipBase) & (0xFFFFFFFF << (32 - prefijoPrincipal));
    const redPrincipal = intToIP(redPrincipalInt);
    const tamanoPrincipal = Math.pow(2, 32 - prefijoPrincipal);
    
    const subredes = [];
    let redActualInt = redPrincipalInt;
    
    for (let i = 0; i < hosts.length; i++) {
        const numHosts = hosts[i];
        const prefijo = calcularPrefijoDesdeHosts(numHosts);
        const tamanoSubred = Math.pow(2, 32 - prefijo);
        
        // Verificar que la subred cabe en la red principal
        if (redActualInt + tamanoSubred > redPrincipalInt + tamanoPrincipal) {
            return `❌ Error: No hay suficiente espacio para ${numHosts} hosts en la red ${redPrincipal}/${prefijoPrincipal}`;
        }
        
        const redSubred = intToIP(redActualInt);
        const mascara = calcularMascara(prefijo);
        const wildcard = calcularWildcard(mascara);
        const broadcast = intToIP(redActualInt + tamanoSubred - 1);
        const primerHost = intToIP(redActualInt + 1);
        const ultimoHost = intToIP(redActualInt + tamanoSubred - 2);
        const hostsDisponibles = tamanoSubred - 2;
        
        subredes.push({
            subred: `Subred ${i + 1}`,
            direccionRed: redSubred,
            mascara: mascara,
            wildcard: wildcard,
            prefijo: `/${prefijo}`,
            rangoHosts: `${primerHost} - ${ultimoHost}`,
            broadcast: broadcast,
            hostsNecesarios: numHosts,
            hostsDisponibles: hostsDisponibles
        });
        
        redActualInt += tamanoSubred;
    }
    
    return subredes;
}

// ==================== CÁLCULO ENLACES ====================
function calcularEnlaces() {
    const ipBase = document.getElementById('enlaces-ip').value.trim();
    const prefijoStr = document.getElementById('enlaces-prefix').value.trim();
    const enlacesStr = document.getElementById('enlaces-count').value.trim();
    const resultsDiv = document.getElementById('enlaces-results');
    
    // Validaciones
    if (!ipBase || !prefijoStr || !enlacesStr) {
        mostrarError(resultsDiv, '⚠️ Por favor completa todos los campos');
        return;
    }
    
    if (!validarIP(ipBase)) {
        mostrarError(resultsDiv, '❌ La dirección IP no es válida');
        return;
    }
    
    const prefijoPrincipal = parseInt(prefijoStr);
    if (!validarPrefijo(prefijoPrincipal)) {
        mostrarError(resultsDiv, '❌ El prefijo debe estar entre 1 y 30');
        return;
    }
    
    const numEnlaces = parseInt(enlacesStr);
    if (numEnlaces < 1 || numEnlaces > 1000) {
        mostrarError(resultsDiv, '❌ El número de enlaces debe estar entre 1 y 1000');
        return;
    }
    
    try {
        const resultado = procesarEnlaces(ipBase, prefijoPrincipal, numEnlaces);
        if (typeof resultado === 'string') {
            mostrarError(resultsDiv, resultado);
        } else {
            mostrarResultadosEnlaces(resultado, resultsDiv);
        }
    } catch (error) {
        mostrarError(resultsDiv, '❌ Error en el cálculo: ' + error.message);
    }
}

function procesarEnlaces(ipBase, prefijoPrincipal, numEnlaces) {
    const redPrincipalInt = ipToInt(ipBase) & (0xFFFFFFFF << (32 - prefijoPrincipal));
    const redPrincipal = intToIP(redPrincipalInt);
    const tamanoPrincipal = Math.pow(2, 32 - prefijoPrincipal);
    
    const enlaces = [];
    let redActualInt = redPrincipalInt;
    const tamanoEnlace = 4; // /30 = 4 IPs
    
    for (let i = 0; i < numEnlaces; i++) {
        // Verificar que el enlace cabe en la red principal
        if (redActualInt + tamanoEnlace > redPrincipalInt + tamanoPrincipal) {
            return `❌ Error: No hay suficiente espacio para ${numEnlaces} enlaces en la red ${redPrincipal}/${prefijoPrincipal}`;
        }
        
        const redEnlace = intToIP(redActualInt);
        const mascara = "255.255.255.252";
        const wildcard = "0.0.0.3";
        const broadcast = intToIP(redActualInt + 3);
        const ip1 = intToIP(redActualInt + 1);
        const ip2 = intToIP(redActualInt + 2);
        
        enlaces.push({
            enlace: `Enlace ${i + 1}`,
            direccionRed: redEnlace,
            mascara: mascara,
            wildcard: wildcard,
            prefijo: "/30",
            ipsUtilizables: `${ip1} - ${ip2}`,
            broadcast: broadcast
        });
        
        redActualInt += tamanoEnlace;
    }
    
    return enlaces;
}

// ==================== FUNCIONES DE INTERFAZ ====================
function mostrarError(container, mensaje) {
    container.innerHTML = `
        <div class="error-message">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${mensaje}</span>
        </div>
    `;
}

function mostrarResultadosVLSM(subredes, container) {
    let html = `
        <div class="results-header">
            <span class="results-icon">📊</span>
            <h3 class="results-title">Resultados VLSM</h3>
            <span class="results-count">${subredes.length} subredes generadas</span>
        </div>
        <div class="results-grid">
    `;
    
    subredes.forEach((subred, index) => {
        html += `
            <div class="result-card vlsm-card">
                <div class="card-header">
                    <span class="card-number">${index + 1}</span>
                    <h4 class="card-title">${subred.subred}</h4>
                    <span class="card-badge">${subred.hostsNecesarios} hosts</span>
                </div>
                <div class="card-content">
                    <div class="result-row">
                        <span class="result-label">Red:</span>
                        <span class="result-value network">${subred.direccionRed}${subred.prefijo}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Máscara:</span>
                        <span class="result-value">${subred.mascara}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Wildcard:</span>
                        <span class="result-value">${subred.wildcard}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Hosts:</span>
                        <span class="result-value range">${subred.rangoHosts}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Broadcast:</span>
                        <span class="result-value broadcast">${subred.broadcast}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Disponibles:</span>
                        <span class="result-value available">${subred.hostsDisponibles} hosts</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function mostrarResultadosEnlaces(enlaces, container) {
    let html = `
        <div class="results-header">
            <span class="results-icon">🔗</span>
            <h3 class="results-title">Enlaces de Router</h3>
            <span class="results-count">${enlaces.length} enlaces generados</span>
        </div>
        <div class="results-grid">
    `;
    
    enlaces.forEach((enlace, index) => {
        html += `
            <div class="result-card enlace-card">
                <div class="card-header">
                    <span class="card-number">${index + 1}</span>
                    <h4 class="card-title">${enlace.enlace}</h4>
                    <span class="card-badge">/30</span>
                </div>
                <div class="card-content">
                    <div class="result-row">
                        <span class="result-label">Red:</span>
                        <span class="result-value network">${enlace.direccionRed}${enlace.prefijo}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Máscara:</span>
                        <span class="result-value">${enlace.mascara}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Wildcard:</span>
                        <span class="result-value">${enlace.wildcard}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">IPs útiles:</span>
                        <span class="result-value range">${enlace.ipsUtilizables}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Broadcast:</span>
                        <span class="result-value broadcast">${enlace.broadcast}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function limpiarVLSM() {
    document.getElementById('vlsm-ip').value = '';
    document.getElementById('vlsm-prefix').value = '';
    document.getElementById('vlsm-hosts').value = '';
    document.getElementById('vlsm-results').innerHTML = '';
}

function limpiarEnlaces() {
    document.getElementById('enlaces-ip').value = '';
    document.getElementById('enlaces-prefix').value = '';
    document.getElementById('enlaces-count').value = '';
    document.getElementById('enlaces-results').innerHTML = '';
}

// ==================== SISTEMA DE TABS ====================
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.tab-pane');
    const slider = document.getElementById('tab-slider');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // Activar el clickeado
            tab.classList.add('active');
            const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Mover slider
            slider.style.left = `${index * 50}%`;
        });
    });
}

// ==================== SISTEMA DE TEMAS ====================
function getTheme(){return document.documentElement.getAttribute('data-theme')||'dark';}
function setTheme(t){
    document.documentElement.setAttribute('data-theme',t);
    document.body.classList.add('theme-flip');
    setTimeout(()=>document.body.classList.remove('theme-flip'),450);
    const themeBtn = document.getElementById('flipTheme');
    if(themeBtn){
        const label = themeBtn.querySelector('.theme-name');
        if(label) label.textContent = t==='dark'?'Dark':'Light';
        const isDark = t==='dark';
        themeBtn.setAttribute('aria-pressed', String(isDark));
        themeBtn.setAttribute('aria-label', isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    }
    try{localStorage.setItem('retro-theme',t);}catch(e){}
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    
    // Inicializar tema
    const saved = localStorage.getItem('retro-theme');
    setTheme(saved || 'dark');
    
    const themeBtn = document.getElementById('flipTheme');
    themeBtn?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark'));
    
    // Ejemplos rápidos
    document.getElementById('vlsm-ip').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '192.168.1.0';
        }
    });
    
    document.getElementById('vlsm-prefix').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '24';
        }
    });
    
    document.getElementById('vlsm-hosts').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '100, 50, 25, 10';
        }
    });
    
    document.getElementById('enlaces-ip').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '10.0.0.0';
        }
    });
    
    document.getElementById('enlaces-prefix').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '16';
        }
    });
    
    document.getElementById('enlaces-count').addEventListener('focus', function() {
        if (!this.value) {
            this.value = '5';
        }
    });
});
