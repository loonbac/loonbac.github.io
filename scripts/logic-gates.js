// ==================== TIPOS Y CONSTANTES ====================
const GateType = {
    INPUT: 'INPUT',
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    NAND: 'NAND',
    NOR: 'NOR',
    XOR: 'XOR',
    XNOR: 'XNOR'
};

const GATE_WIDTH = 80;
const GATE_HEIGHT = 60;
const PIN_RADIUS = 6; // Tamaño visual de los pines

// ==================== CLASES ====================
class Pin {
    constructor(x, y, isInput, gate) {
        this.x = x;
        this.y = y;
        this.isInput = isInput;
        this.gate = gate;
        this.value = 0;
        this.connectedFrom = null;
        this.id = `pin_${Date.now()}_${Math.random()}`;
    }
    
    getAbsolutePos() {
        return {
            x: this.gate.x + this.x,
            y: this.gate.y + this.y
        };
    }
}

class Connection {
    constructor(outputPin, inputPin) {
        this.outputPin = outputPin;
        this.inputPin = inputPin;
        this.id = `conn_${Date.now()}_${Math.random()}`;
    }
}

class Gate {
    constructor(x, y, gateType) {
        this.x = x;
        this.y = y;
        this.gateType = gateType;
        this.selected = false;
        this.inputPins = [];
        this.outputPins = [];
        this.value = 0; // Para compuertas INPUT
        this.id = `gate_${Date.now()}_${Math.random()}`;
        this.setupPins();
    }
    
    setupPins() {
        this.inputPins = [];
        this.outputPins = [];
        
        if (this.gateType === GateType.INPUT) {
            this.outputPins.push(new Pin(GATE_WIDTH, GATE_HEIGHT / 2, false, this));
        } else if (this.gateType === GateType.NOT) {
            this.inputPins.push(new Pin(0, GATE_HEIGHT / 2, true, this));
            this.outputPins.push(new Pin(GATE_WIDTH, GATE_HEIGHT / 2, false, this));
        } else {
            // Compuertas de múltiples entradas
            this.inputPins.push(new Pin(0, GATE_HEIGHT / 3, true, this));
            this.inputPins.push(new Pin(0, 2 * GATE_HEIGHT / 3, true, this));
            this.outputPins.push(new Pin(GATE_WIDTH, GATE_HEIGHT / 2, false, this));
        }
    }
    
    addInputPin() {
        if (this.gateType !== GateType.NOT && this.gateType !== GateType.INPUT && this.inputPins.length < 8) {
            this.redistributeInputPins();
        }
    }
    
    redistributeInputPins() {
        const numPins = this.inputPins.length + 1;
        this.inputPins.push(new Pin(0, 0, true, this));
        
        for (let i = 0; i < this.inputPins.length; i++) {
            this.inputPins[i].y = GATE_HEIGHT * (i + 1) / (numPins + 1);
        }
    }
    
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + GATE_WIDTH &&
               y >= this.y && y <= this.y + GATE_HEIGHT;
    }
    
    getPinAtPosition(x, y) {
        // NOTA: Esta función ya no se usa - los pines usan eventos directos
        return null;
    }
    
    updateInputValues() {
        for (const pin of this.inputPins) {
            if (pin.connectedFrom) {
                pin.value = pin.connectedFrom.value;
            } else {
                pin.value = 0;
            }
        }
    }
    
    calculateOutput() {
        if (this.gateType === GateType.INPUT) {
            // Para INPUT gates, siempre usar el valor interno
            this.outputPins[0].value = this.value;
        } else if (this.gateType === GateType.AND) {
            this.outputPins[0].value = this.inputPins.length > 0 && 
                                      this.inputPins.every(pin => pin.value === 1) ? 1 : 0;
        } else if (this.gateType === GateType.OR) {
            this.outputPins[0].value = this.inputPins.some(pin => pin.value === 1) ? 1 : 0;
        } else if (this.gateType === GateType.NOT) {
            this.outputPins[0].value = this.inputPins.length > 0 ? 
                                      (this.inputPins[0].value === 1 ? 0 : 1) : 0;
        } else if (this.gateType === GateType.NAND) {
            const andResult = this.inputPins.length > 0 && 
                             this.inputPins.every(pin => pin.value === 1) ? 1 : 0;
            this.outputPins[0].value = andResult === 1 ? 0 : 1;
        } else if (this.gateType === GateType.NOR) {
            const orResult = this.inputPins.some(pin => pin.value === 1) ? 1 : 0;
            this.outputPins[0].value = orResult === 1 ? 0 : 1;
        } else if (this.gateType === GateType.XOR) {
            const onesCount = this.inputPins.reduce((sum, pin) => sum + pin.value, 0);
            this.outputPins[0].value = onesCount % 2 === 1 ? 1 : 0;
        } else if (this.gateType === GateType.XNOR) {
            const onesCount = this.inputPins.reduce((sum, pin) => sum + pin.value, 0);
            this.outputPins[0].value = onesCount % 2 === 0 ? 1 : 0;
        }
    }
}

// ==================== SIMULADOR PRINCIPAL ====================
class LogicGatesSimulator {
    constructor() {
        this.gates = [];
        this.connections = [];
        this.selectedGate = null;
        this.selectedConnection = null;
        this.connectingFrom = null;
        this.dragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.canvas = document.getElementById('logicCanvas');
        this.gatesLayer = document.getElementById('gatesLayer');
        this.connectionsLayer = document.getElementById('connectionsLayer');
        this.tempConnection = document.getElementById('tempConnection');
        
        this.initializeEventListeners();
        this.initializeControls();
        this.initializeTheme();
    }
    
    initializeEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Gate buttons
        document.querySelectorAll('.gate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const gateType = btn.dataset.gate;
                this.addGate(gateType, 400, 200);
            });
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
    }
    
    initializeControls() {
        // Inicializar controles adicionales si es necesario
    }
    
    initializeTheme() {
        // Tema
        const saved = localStorage.getItem('retro-theme');
        this.setTheme(saved || 'dark');
        
        const themeBtn = document.getElementById('flipTheme');
        themeBtn?.addEventListener('click', () => {
            this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
        });
    }
    
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.add('theme-flip');
        setTimeout(() => document.body.classList.remove('theme-flip'), 450);
        
        const themeBtn = document.getElementById('flipTheme');
        if (themeBtn) {
            const label = themeBtn.querySelector('.theme-name');
            if (label) label.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
        
        try {
            localStorage.setItem('retro-theme', theme);
        } catch (e) {}
    }
    
    // ==================== GESTIÓN DE COMPUERTAS ====================
    addGate(gateType, x, y) {
        const gate = new Gate(x, y, gateType);
        this.gates.push(gate);
        console.log('Adding gate:', gateType, 'at', x, y); // Debug
        this.renderGate(gate);
        // NO llamar updateTruthTable aquí para evitar bucles
        console.log('Gate added successfully, total gates:', this.gates.length); // Debug
        return gate;
    }
    
    removeGate(gate) {
        // Eliminar conexiones relacionadas
        this.connections = this.connections.filter(conn => {
            if (conn.outputPin.gate === gate || conn.inputPin.gate === gate) {
                if (conn.inputPin.gate !== gate) {
                    conn.inputPin.connectedFrom = null;
                }
                this.removeConnectionElement(conn);
                return false;
            }
            return true;
        });
        
        // Eliminar compuerta
        this.gates = this.gates.filter(g => g !== gate);
        this.removeGateElement(gate);
        this.updateTruthTable();
    }
    
    // ==================== GESTIÓN DE CONEXIONES ====================
    addConnection(outputPin, inputPin) {
        if (outputPin.isInput && !outputPin.connectedFrom) {
            console.log('Failed: Input pin without connection cannot be source'); // Debug
            return false; // Pin de entrada sin valor no puede ser fuente
        }
        
        if (!inputPin.isInput) {
            console.log('Failed: Cannot connect to output pin'); // Debug
            return false; // No se puede conectar a pin de salida
        }
        
        // Verificar si ya existe la conexión
        if (this.connections.some(conn => 
            conn.outputPin === outputPin && conn.inputPin === inputPin)) {
            console.log('Failed: Connection already exists'); // Debug
            return false;
        }
        
        // Eliminar conexión anterior si existe
        if (inputPin.connectedFrom) {
            const oldConn = this.connections.find(conn => conn.inputPin === inputPin);
            if (oldConn) {
                console.log('Removing old connection'); // Debug
                this.removeConnection(oldConn);
            }
        }
        
        // Crear nueva conexión
        const connection = new Connection(outputPin, inputPin);
        this.connections.push(connection);
        inputPin.connectedFrom = outputPin;
        
        console.log('Connection created successfully from', outputPin.isInput ? 'input' : 'output', 'to input');
        this.renderConnection(connection);
        
        // Actualizar el valor del pin de entrada inmediatamente
        inputPin.value = outputPin.value;
        
        // Recalcular y actualizar la compuerta de entrada
        inputPin.gate.calculateOutput();
        this.updateGateDisplay(inputPin.gate);
        
        // Propagar cambios desde la compuerta conectada
        if (inputPin.gate.outputPins.length > 0) {
            this.propagateSimple(inputPin.gate.outputPins[0]);
        }
        
        this.updateTruthTable();
        return true;
    }
    
    removeConnection(connection) {
        console.log('Removing connection:', connection.id);
        
        // Limpiar referencias
        connection.inputPin.connectedFrom = null;
        connection.inputPin.value = 0; // Resetear valor del pin de entrada
        
        // Eliminar de la lista de conexiones
        this.connections = this.connections.filter(conn => conn !== connection);
        
        // Eliminar elemento visual
        this.removeConnectionElement(connection);
        
        // Recalcular la compuerta afectada
        connection.inputPin.gate.calculateOutput();
        this.updateGateDisplay(connection.inputPin.gate);
        
        // Propagar cambios desde la compuerta afectada
        if (connection.inputPin.gate.outputPins.length > 0) {
            this.propagateSimple(connection.inputPin.gate.outputPins[0]);
        }
        
        // Deseleccionar si era la conexión seleccionada
        if (this.selectedConnection === connection) {
            this.selectedConnection = null;
        }
        
        this.updateTruthTable();
        console.log('Connection removed successfully');
    }
    
    // ==================== EVENTOS DE MOUSE ====================
    handleMouseDown(event) {
        // Si el evento viene de un pin, no procesarlo aquí
        if (event.target && event.target.classList.contains('logic-pin')) {
            console.log('Mouse down on pin - ignoring canvas handler');
            return;
        }
        
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 600 / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        console.log('Mouse down at:', x, y);
        
        // Los pines se manejan con sus propios eventos, aquí solo manejamos compuertas y espacio vacío
        
        // Verificar click en compuerta
        const gate = this.getGateAtPosition(x, y);
        if (gate) {
            console.log('Gate clicked:', gate.gateType);
            this.selectGate(gate);
            this.dragging = true;
            this.dragOffset = {
                x: x - gate.x,
                y: y - gate.y
            };
        } else {
            console.log('Empty space clicked');
            this.deselectAll();
            
            // Cancelar conexión si está en progreso
            if (this.connectingFrom) {
                this.connectingFrom = null;
                this.tempConnection.style.opacity = '0';
            }
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 600 / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        if (this.connectingFrom) {
            this.updateTempConnection(x, y);
            console.log('Mouse move: cursor at', event.clientX - rect.left, event.clientY - rect.top, 'SVG coords:', x, y);
        }
        
        if (this.dragging && this.selectedGate) {
            const newX = Math.max(0, Math.min(1000 - GATE_WIDTH, x - this.dragOffset.x));
            const newY = Math.max(0, Math.min(600 - GATE_HEIGHT, y - this.dragOffset.y));
            
            this.selectedGate.x = newX;
            this.selectedGate.y = newY;
            
            this.updateGatePosition(this.selectedGate);
            this.updateConnections();
        }
    }
    
    handleMouseUp(event) {
        this.dragging = false;
    }
    
    handleRightClick(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 600 / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        console.log('=== CANVAS RIGHT CLICK ===');
        console.log('Right click at:', x, y);
        
        const gate = this.getGateAtPosition(x, y);
        if (gate) {
            console.log('Right clicked gate:', gate.gateType, 'ID:', gate.id, 'current value:', gate.value); // Debug
            
            if (gate.gateType === GateType.INPUT) {
                console.log('Calling toggleInputValue from canvas handler'); // Debug
                this.toggleInputValue(gate);
            } else if (gate.gateType !== GateType.NOT && gate.gateType !== GateType.INPUT) {
                if (gate.inputPins.length < 8) {
                    console.log('Adding input pin to:', gate.gateType); // Debug
                    gate.addInputPin();
                    this.updateGateElement(gate);
                }
            }
        } else {
            console.log('Right click on empty space'); // Debug
        }
    }
    
    handleKeyDown(event) {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (this.selectedConnection) {
                console.log('Deleting selected connection');
                this.removeConnection(this.selectedConnection);
                this.selectedConnection = null;
            } else if (this.selectedGate) {
                console.log('Deleting selected gate');
                this.removeGate(this.selectedGate);
                this.selectedGate = null;
            }
        }
    }
    
    // ==================== MANEJO DE PINES ====================
    handlePinClick(pin, event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('Pin clicked:', pin.isInput ? 'input' : 'output', 'ID:', pin.id);
        
        if (this.connectingFrom === null) {
            // Solo empezar conexión desde pines de salida
            if (!pin.isInput) {
                this.connectingFrom = pin;
                console.log('Starting connection from output pin:', pin.id);
                
                // Mostrar línea temporal
                const pos = pin.getAbsolutePos();
                this.updateTempConnection(pos.x, pos.y);
                
                console.log('Waiting for input pin click...');
            }
        } else {
            // Solo completar conexión en pines de entrada
            if (pin.isInput) {
                console.log('Completing connection to input pin:', pin.id);
                this.addConnection(this.connectingFrom, pin);
            }
            
            // Limpiar estado de conexión
            this.connectingFrom = null;
            this.tempConnection.style.opacity = '0';
        }
    }
    
    // ==================== FUNCIONES AUXILIARES ====================
    toggleInputValue(gate) {
        console.log('=== toggleInputValue START ===');
        console.log('toggleInputValue called for gate:', gate.gateType, 'ID:', gate.id, 'current value:', gate.value);
        
        if (gate.gateType !== GateType.INPUT) {
            console.log('Not an INPUT gate, returning');
            return;
        }
        
        // Verificar que la compuerta existe en el array
        const gateExists = this.gates.find(g => g.id === gate.id);
        if (!gateExists) {
            console.log('Gate not found in gates array!');
            return;
        }
        
        // Cambiar valor directamente
        const oldValue = gate.value;
        gate.value = gate.value === 1 ? 0 : 1;
        console.log('Changed INPUT value from', oldValue, 'to', gate.value);
        
        // Actualizar el pin de salida
        if (gate.outputPins && gate.outputPins.length > 0) {
            gate.outputPins[0].value = gate.value;
            console.log('Updated output pin value to:', gate.outputPins[0].value);
        }
        
        // Actualizar SOLO el elemento visual de esta compuerta
        const gateElement = this.gatesLayer.querySelector(`[data-gate-id="${gate.id}"]`);
        if (gateElement) {
            const valueText = gateElement.querySelector('.gate-value');
            if (valueText) {
                valueText.textContent = gate.value;
                console.log('Updated value text in DOM to:', gate.value);
            } else {
                console.log('Value text element not found!');
            }
            
            // Actualizar color del pin de salida usando data-pin-id
            if (gate.outputPins && gate.outputPins.length > 0) {
                const outputPin = gateElement.querySelector(`[data-pin-id="${gate.outputPins[0].id}"]`);
                if (outputPin) {
                    outputPin.classList.remove('high', 'low');
                    outputPin.classList.add(gate.value === 1 ? 'high' : 'low');
                    console.log('Updated output pin color for value:', gate.value);
                } else {
                    console.log('Output pin element not found!');
                }
            }
        } else {
            console.log('Gate element not found in DOM!');
        }
        
        // Propagar cambios SOLO a través de conexiones directas
        if (gate.outputPins && gate.outputPins.length > 0) {
            this.propagateSimple(gate.outputPins[0]);
        }
        
        console.log('=== toggleInputValue COMPLETED ===');
    }
    
    propagateSimple(sourcePin) {
        console.log('Simple propagation from pin with value:', sourcePin.value);
        
        // Encontrar conexiones que salen de este pin
        const connectionsFromPin = this.connections.filter(conn => conn.outputPin === sourcePin);
        console.log('Found', connectionsFromPin.length, 'connections to update');
        
        for (const connection of connectionsFromPin) {
            console.log('Updating connection:', connection.id, 'from value', connection.inputPin.value, 'to', sourcePin.value);
            
            // Actualizar valor del pin de entrada conectado
            connection.inputPin.value = sourcePin.value;
            
            // Recalcular salida de la compuerta conectada
            connection.inputPin.gate.calculateOutput();
            
            // Actualizar color de la conexión
            const connectionElement = this.connectionsLayer.querySelector(`[data-connection-id="${connection.id}"]`);
            if (connectionElement) {
                const color = sourcePin.value === 1 ? '#00ff00' : '#333333';
                connectionElement.setAttribute('stroke', color);
                console.log('Updated connection color to:', color);
            } else {
                console.log('Connection element not found for:', connection.id);
            }
            
            // Actualizar visualización de los pines de la compuerta conectada
            const gateElement = this.gatesLayer.querySelector(`[data-gate-id="${connection.inputPin.gate.id}"]`);
            if (gateElement) {
                // Actualizar todos los pines de la compuerta
                [...connection.inputPin.gate.inputPins, ...connection.inputPin.gate.outputPins].forEach(pin => {
                    const pinElement = gateElement.querySelector(`[data-pin-id="${pin.id}"]`);
                    if (pinElement) {
                        pinElement.classList.remove('high', 'low');
                        pinElement.classList.add(pin.value === 1 ? 'high' : 'low');
                    }
                });
            }
            
            // Actualizar visualización de la compuerta conectada
            this.updateGateDisplay(connection.inputPin.gate);
            
            // Si hay más salidas, propagar recursivamente (solo una vez)
            if (connection.inputPin.gate.outputPins.length > 0) {
                this.propagateSimple(connection.inputPin.gate.outputPins[0]);
            }
        }
        
        console.log('Simple propagation completed');
    }
    
    propagateChanges(sourcePin) {
        console.log('Propagating changes from pin with value:', sourcePin.value); // Debug
        
        // Encontrar todas las conexiones que salen de este pin
        const connectionsFromPin = this.connections.filter(conn => conn.outputPin === sourcePin);
        console.log('Found', connectionsFromPin.length, 'connections from this pin'); // Debug
        
        for (const connection of connectionsFromPin) {
            // Actualizar el valor del pin de entrada
            connection.inputPin.value = sourcePin.value;
            console.log('Updated connected input pin to value:', connection.inputPin.value); // Debug
            
            // Recalcular la salida de la compuerta conectada
            connection.inputPin.gate.calculateOutput();
            console.log('Recalculated output for gate:', connection.inputPin.gate.gateType); // Debug
            
            // Actualizar visualización de la conexión
            const connectionElement = this.connectionsLayer.querySelector(`[data-connection-id="${connection.id}"]`);
            if (connectionElement) {
                connectionElement.classList.remove('high', 'low');
                connectionElement.classList.add(sourcePin.value === 1 ? 'high' : 'low');
            }
            
            // Actualizar visualización de los pines de la compuerta conectada
            [...connection.inputPin.gate.inputPins, ...connection.inputPin.gate.outputPins].forEach(pin => {
                const pinElement = this.gatesLayer.querySelector(`[data-pin-id="${pin.id}"]`);
                if (pinElement) {
                    pinElement.classList.remove('high', 'low');
                    pinElement.classList.add(pin.value === 1 ? 'high' : 'low');
                }
            });
            
            // Si la compuerta conectada tiene salidas, propagar recursivamente
            if (connection.inputPin.gate.outputPins.length > 0) {
                this.propagateChanges(connection.inputPin.gate.outputPins[0]);
            }
        }
    }
    
    // ==================== UTILIDADES ====================
    getGateAtPosition(x, y) {
        return this.gates.find(gate => gate.containsPoint(x, y));
    }
    
    getPinAtPosition(x, y) {
        // NOTA: Esta función ya no se usa - los pines usan eventos directos
        console.log('getPinAtPosition called but not used - pins use direct events');
        return null;
    }
    
    selectGate(gate) {
        this.deselectAll();
        this.selectedGate = gate;
        gate.selected = true;
        this.updateGateSelection(gate);
    }
    
    deselectAll() {
        // Deseleccionar compuerta
        if (this.selectedGate) {
            this.selectedGate.selected = false;
            this.updateGateSelection(this.selectedGate);
            this.selectedGate = null;
        }
        
        // Deseleccionar conexión
        if (this.selectedConnection) {
            const connectionElement = this.connectionsLayer.querySelector(`[data-connection-id="${this.selectedConnection.id}"]`);
            if (connectionElement) {
                connectionElement.setAttribute('stroke-width', '2');
                connectionElement.style.opacity = '1';
            }
            this.selectedConnection = null;
        }
    }
    
    updateCircuit() {
        // Solo recalcular compuertas que no son INPUT (las INPUT mantienen su valor manual)
        console.log('updateCircuit called');
        
        // Actualizar valores de entrada para compuertas no-INPUT
        for (const gate of this.gates) {
            if (gate.gateType !== GateType.INPUT) {
                gate.updateInputValues();
            }
        }
        
        // Calcular salidas para compuertas no-INPUT
        for (const gate of this.gates) {
            if (gate.gateType !== GateType.INPUT) {
                gate.calculateOutput();
            }
        }
        
        // TEMPORAL: Comentar para evitar bucles infinitos
        // this.updateAllPins();
        // this.updateAllConnections();
    }
    
    reset() {
        this.gates = [];
        this.connections = [];
        this.selectedGate = null;
        this.connectingFrom = null;
        this.dragging = false;
        
        this.gatesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.tempConnection.style.opacity = '0';
        
        this.updateTruthTable();
    }
    
    // ==================== RENDERIZADO SVG ====================
    renderGate(gate) {
        console.log('Rendering gate:', gate.gateType, 'with ID:', gate.id); // Debug
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('logic-gate');
        group.setAttribute('data-gate-id', gate.id);
        
        // Cuerpo de la compuerta con evento de click derecho
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('gate-body');
        rect.setAttribute('x', gate.x);
        rect.setAttribute('y', gate.y);
        rect.setAttribute('width', GATE_WIDTH);
        rect.setAttribute('height', GATE_HEIGHT);
        rect.setAttribute('rx', '4');
        
        // Crear una función de manejo de eventos específica para esta compuerta
        const handleRightClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Right click on gate:', gate.gateType, 'ID:', gate.id, 'current value:', gate.value); // Debug
            
            if (gate.gateType === GateType.INPUT) {
                console.log('Calling toggleInputValue for gate ID:', gate.id); // Debug
                this.toggleInputValue(gate);
            } else if (gate.gateType !== GateType.NOT && gate.gateType !== GateType.INPUT) {
                if (gate.inputPins.length < 8) {
                    console.log('Adding input pin to:', gate.gateType); // Debug
                    gate.addInputPin();
                    this.updateGateElement(gate);
                }
            }
        };
        
        // Agregar evento de click derecho al rectángulo
        rect.addEventListener('contextmenu', handleRightClick);
        group.appendChild(rect);
        
        // Texto de la compuerta con evento de click derecho también
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('gate-text');
        text.setAttribute('x', gate.x + GATE_WIDTH / 2);
        text.setAttribute('y', gate.y + GATE_HEIGHT / 2);
        text.textContent = gate.gateType;
        text.style.pointerEvents = 'none'; // Evitar interferencia con eventos
        group.appendChild(text);
        
        // Agregar evento de click derecho también al grupo completo
        group.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Right click on gate group:', gate.gateType, 'current value:', gate.value); // Debug
            
            if (gate.gateType === GateType.INPUT) {
                this.toggleInputValue(gate);
            } else if (gate.gateType !== GateType.NOT && gate.gateType !== GateType.INPUT) {
                if (gate.inputPins.length < 8) {
                    console.log('Adding input pin to:', gate.gateType); // Debug
                    gate.addInputPin();
                    this.updateGateElement(gate);
                }
            }
        });
        
        // Valor para INPUT gates - SIEMPRE crear el elemento
        if (gate.gateType === GateType.INPUT) {
            const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valueText.classList.add('gate-value');
            valueText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            valueText.setAttribute('y', gate.y - 10);
            valueText.textContent = gate.value;
            valueText.style.pointerEvents = 'none';
            group.appendChild(valueText);
            console.log('Created value text for INPUT gate:', gate.value); // Debug
        }
        
        // Contador de pines para compuertas de múltiples entradas
        if (gate.inputPins.length > 2 && gate.gateType !== GateType.INPUT) {
            const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            countText.classList.add('pin-count');
            countText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            countText.setAttribute('y', gate.y - 10);
            countText.textContent = `(${gate.inputPins.length})`;
            countText.style.pointerEvents = 'none';
            group.appendChild(countText);
        }
        
        // Pines
        [...gate.inputPins, ...gate.outputPins].forEach(pin => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.classList.add('logic-pin');
            circle.classList.add(pin.isInput ? 'input' : 'output');
            const pos = pin.getAbsolutePos();
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', PIN_RADIUS);
            circle.setAttribute('data-pin-id', pin.id);
            
            // Agregar evento de click directamente al pin para mejor detección
            circle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Pin clicked directly:', pin.isInput ? 'input' : 'output');
                this.handlePinClick(pin, e);
            });
            
            // Agregar click derecho para desconectar pines de entrada
            if (pin.isInput) {
                circle.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Right click on input pin');
                    
                    if (pin.connectedFrom) {
                        console.log('Disconnecting input pin');
                        const connection = this.connections.find(conn => conn.inputPin === pin);
                        if (connection) {
                            this.removeConnection(connection);
                        }
                    }
                });
            }
            
            // Actualizar clase de pin según su valor inicial
            circle.classList.add(pin.value === 1 ? 'high' : 'low');
            
            group.appendChild(circle);
        });
        
        this.gatesLayer.appendChild(group);
        console.log('Gate rendered successfully:', gate.gateType, 'ID:', gate.id); // Debug
    }
    
    renderConnection(connection) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('logic-connection');
        line.setAttribute('data-connection-id', connection.id);
        
        const startPos = connection.outputPin.getAbsolutePos();
        const endPos = connection.inputPin.getAbsolutePos();
        
        line.setAttribute('x1', startPos.x);
        line.setAttribute('y1', startPos.y);
        line.setAttribute('x2', endPos.x);
        line.setAttribute('y2', endPos.y);
        
        // Establecer color según el valor del pin de salida
        const color = connection.outputPin.value === 1 ? '#00ff00' : '#333333';
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '2');
        
        // Agregar eventos para desconectar
        line.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Right click on connection, disconnecting...');
            this.removeConnection(connection);
        });
        
        // También permitir click normal para seleccionar y luego delete
        line.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Connection selected for deletion');
            this.selectedConnection = connection;
            // Resaltar la conexión seleccionada
            line.setAttribute('stroke-width', '4');
            line.style.opacity = '0.7';
        });
        
        this.connectionsLayer.appendChild(line);
        console.log('Connection rendered with color:', color, 'for value:', connection.outputPin.value);
    }
    
    updateGatePosition(gate) {
        const group = this.gatesLayer.querySelector(`[data-gate-id="${gate.id}"]`);
        if (!group) return;
        
        const rect = group.querySelector('.gate-body');
        rect.setAttribute('x', gate.x);
        rect.setAttribute('y', gate.y);
        
        const text = group.querySelector('.gate-text');
        text.setAttribute('x', gate.x + GATE_WIDTH / 2);
        text.setAttribute('y', gate.y + GATE_HEIGHT / 2);
        
        const valueText = group.querySelector('.gate-value');
        if (valueText) {
            valueText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            valueText.setAttribute('y', gate.y - 10);
        }
        
        const countText = group.querySelector('.pin-count');
        if (countText) {
            countText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            countText.setAttribute('y', gate.y - 10);
        }
        
        [...gate.inputPins, ...gate.outputPins].forEach(pin => {
            const circle = group.querySelector(`[data-pin-id="${pin.id}"]`);
            if (circle) {
                const pos = pin.getAbsolutePos();
                circle.setAttribute('cx', pos.x);
                circle.setAttribute('cy', pos.y);
            }
        });
    }
    
    updateGateSelection(gate) {
        const group = this.gatesLayer.querySelector(`[data-gate-id="${gate.id}"]`);
        if (!group) return;
        
        const rect = group.querySelector('.gate-body');
        if (gate.selected) {
            rect.classList.add('selected');
        } else {
            rect.classList.remove('selected');
        }
    }
    
    updateGateDisplay(gate) {
        const group = this.gatesLayer.querySelector(`[data-gate-id="${gate.id}"]`);
        if (!group) {
            console.log('Gate group not found for display update'); // Debug
            return;
        }
        
        console.log('Updating gate display for:', gate.gateType, 'value:', gate.value); // Debug
        
        // Actualizar texto de valor para INPUT gates
        if (gate.gateType === GateType.INPUT) {
            let valueText = group.querySelector('.gate-value');
            if (!valueText) {
                console.log('Value text element not found, creating new one'); // Debug
                // Crear elemento de texto si no existe
                valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                valueText.classList.add('gate-value');
                valueText.style.pointerEvents = 'none';
                group.appendChild(valueText);
            }
            
            // Forzar actualización de posición y contenido
            valueText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            valueText.setAttribute('y', gate.y - 10);
            valueText.textContent = gate.value.toString();
            
            // Forzar re-render eliminando y recreando el elemento
            const parent = valueText.parentNode;
            parent.removeChild(valueText);
            
            const newValueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            newValueText.classList.add('gate-value');
            newValueText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            newValueText.setAttribute('y', gate.y - 10);
            newValueText.textContent = gate.value.toString();
            newValueText.style.pointerEvents = 'none';
            parent.appendChild(newValueText);
            
            console.log('Updated value text to:', gate.value, 'at position:', gate.x + GATE_WIDTH / 2, gate.y - 10); // Debug
        }
        
        // Actualizar contador de pines para compuertas de múltiples entradas
        if (gate.inputPins && gate.inputPins.length > 2 && gate.gateType !== GateType.INPUT) {
            let countText = group.querySelector('.pin-count');
            if (!countText) {
                countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                countText.classList.add('pin-count');
                countText.setAttribute('x', gate.x + GATE_WIDTH / 2);
                countText.setAttribute('y', gate.y - 10);
                countText.style.pointerEvents = 'none';
                group.appendChild(countText);
            }
            countText.textContent = `(${gate.inputPins.length})`;
            countText.setAttribute('x', gate.x + GATE_WIDTH / 2);
            countText.setAttribute('y', gate.y - 10);
        }
    }
    
    updateGateElement(gate) {
        // Guardar el estado de selección
        const wasSelected = gate.selected;
        
        this.removeGateElement(gate);
        this.renderGate(gate);
        
        if (wasSelected) {
            gate.selected = true;
            this.updateGateSelection(gate);
        }
        
        // TEMPORAL: Comentar para evitar bucles
        // this.updateCircuit();
    }
    
    removeGateElement(gate) {
        const group = this.gatesLayer.querySelector(`[data-gate-id="${gate.id}"]`);
        if (group) {
            group.remove();
        }
    }
    
    removeConnectionElement(connection) {
        const line = this.connectionsLayer.querySelector(`[data-connection-id="${connection.id}"]`);
        if (line) {
            line.remove();
        }
    }
    
    updateConnections() {
        this.connections.forEach(connection => {
            const line = this.connectionsLayer.querySelector(`[data-connection-id="${connection.id}"]`);
            if (line) {
                const startPos = connection.outputPin.getAbsolutePos();
                const endPos = connection.inputPin.getAbsolutePos();
                
                line.setAttribute('x1', startPos.x);
                line.setAttribute('y1', startPos.y);
                line.setAttribute('x2', endPos.x);
                line.setAttribute('y2', endPos.y);
            }
        });
    }
    
    updateAllPins() {
        console.log('updateAllPins called'); // Debug
        this.gates.forEach(gate => {
            [...gate.inputPins, ...gate.outputPins].forEach(pin => {
                const circle = this.gatesLayer.querySelector(`[data-pin-id="${pin.id}"]`);
                if (circle) {
                    circle.classList.remove('high', 'low');
                    circle.classList.add(pin.value === 1 ? 'high' : 'low');
                    console.log('Updated pin', pin.id, 'to value', pin.value); // Debug
                } else {
                    console.log('Pin element not found for', pin.id); // Debug
                }
            });
        });
    }
    
    updateAllConnections() {
        console.log('updateAllConnections called, connections:', this.connections.length); // Debug
        this.connections.forEach(connection => {
            const line = this.connectionsLayer.querySelector(`[data-connection-id="${connection.id}"]`);
            if (line) {
                line.classList.remove('high', 'low');
                const value = connection.outputPin.value;
                line.classList.add(value === 1 ? 'high' : 'low');
                console.log('Updated connection', connection.id, 'to value', value); // Debug
            } else {
                console.log('Connection element not found for', connection.id); // Debug
            }
        });
    }
    
    updateTempConnection(x, y) {
        if (this.connectingFrom) {
            const startPos = this.connectingFrom.getAbsolutePos();
            this.tempConnection.setAttribute('x1', startPos.x);
            this.tempConnection.setAttribute('y1', startPos.y);
            this.tempConnection.setAttribute('x2', x);
            this.tempConnection.setAttribute('y2', y);
            this.tempConnection.style.opacity = '0.8'; // Hacer más visible
            this.tempConnection.setAttribute('stroke-width', '3'); // Línea más gruesa
            console.log('Temp connection updated from', startPos.x, startPos.y, 'to', x, y);
        }
    }
    
    // ==================== TABLA DE VERDAD ====================
    updateTruthTable() {
        const container = document.getElementById('truthTable');
        const inputGates = this.gates.filter(gate => gate.gateType === GateType.INPUT);
        const outputGates = this.gates.filter(gate => 
            gate.gateType !== GateType.INPUT && 
            gate.outputPins.some(pin => !this.connections.some(conn => conn.outputPin === pin))
        );
        
        if (inputGates.length === 0 || outputGates.length === 0) {
            container.innerHTML = '<p class="mono truth-table-hint">Conecta compuertas INPUT a otras compuertas para generar la tabla de verdad</p>';
            return;
        }
        
        // Generar tabla de verdad
        const numInputs = inputGates.length;
        const numRows = Math.pow(2, numInputs);
        
        let html = '<table class="truth-table"><thead><tr>';
        
        // Headers para inputs
        inputGates.forEach((gate, index) => {
            html += `<th>I${index + 1}</th>`;
        });
        
        // Headers para outputs
        outputGates.forEach((gate, index) => {
            html += `<th>O${index + 1}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // Guardar valores originales
        const originalValues = inputGates.map(gate => gate.value);
        
        // Generar filas
        for (let i = 0; i < numRows; i++) {
            html += '<tr>';
            
            // Valores de entrada
            for (let j = 0; j < numInputs; j++) {
                const bit = (i >> (numInputs - 1 - j)) & 1;
                html += `<td class="${bit === 1 ? 'high' : 'low'}">${bit}</td>`;
            }
            
            // Simular con estos valores
            inputGates.forEach((gate, index) => {
                const inputValue = (i >> (numInputs - 1 - index)) & 1;
                gate.value = inputValue;
                gate.outputPins[0].value = inputValue;
            });
            
            // Propagar cambios manualmente para tabla de verdad
            this.propagateForTruthTable();
            
            // Valores de salida
            outputGates.forEach(gate => {
                const value = gate.outputPins[0].value;
                html += `<td class="${value === 1 ? 'high' : 'low'}">${value}</td>`;
            });
            
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // Restaurar valores originales
        inputGates.forEach((gate, index) => {
            gate.value = originalValues[index];
            gate.outputPins[0].value = originalValues[index];
        });
        
        // Propagar valores originales
        this.propagateForTruthTable();
    }
    
    propagateForTruthTable() {
        // Propagar valores a través de todas las conexiones
        const maxIterations = 10; // Evitar bucles infinitos
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let changed = false;
            
            // Para cada conexión, propagar el valor
            for (const connection of this.connections) {
                const outputValue = connection.outputPin.value;
                if (connection.inputPin.value !== outputValue) {
                    connection.inputPin.value = outputValue;
                    changed = true;
                }
            }
            
            // Calcular salidas de todas las compuertas (excepto INPUT)
            for (const gate of this.gates) {
                if (gate.gateType !== GateType.INPUT) {
                    const oldOutput = gate.outputPins[0].value;
                    gate.updateInputValues();
                    gate.calculateOutput();
                    if (gate.outputPins[0].value !== oldOutput) {
                        changed = true;
                    }
                }
            }
            
            // Si no hubo cambios, la propagación está completa
            if (!changed) break;
        }
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    window.logicSimulator = new LogicGatesSimulator();
});
