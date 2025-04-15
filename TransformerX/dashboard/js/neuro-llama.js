/**
 * NeuroLLaMA Module - Integration between neural signals and LLaMA model
 * Transforms EEG features into language model interactions
 */

// Core NeuroLLaMA state
const neuroLLaMA = {
    active: false,
    processingInterval: null,
    processingDelay: 1000, // ms between updates
    threshold: 0.75, // confidence threshold for neural triggers
    currentPrompt: "",
    lastResponse: "",
    promptHistory: [],
    responseHistory: [],
    neuralFeatures: {},
    modelConfig: {
        contextLength: 2048,
        temperature: 0.7,
        model: "llama-neuro-7b", // default model
        maxTokens: 100,
        useAttentionWeighting: true,
        neuralGuidance: true
    },
    uiState: {
        thinking: false,
        streamingResponse: false,
        error: null
    },
    connectionStatus: {
        apiConnected: false,
        neuralConnected: false,
        lastApiPing: 0,
        lastNeuralUpdate: 0
    }
};

// Elements cache
let elements = {};

// Maps neural activity patterns to semantic concepts
const NEURAL_CONCEPT_MAPPING = {
    "Left Hand": ["move", "left", "backward", "previous", "negative"],
    "Right Hand": ["advance", "right", "forward", "next", "positive"],
    "Feet": ["stop", "down", "decrease", "reduce", "negative"],
    "Tongue": ["select", "up", "increase", "enhance", "positive"],
    "Rest": ["pause", "neutral", "wait", "hold", "maintain"]
};

// Action verbs that can be triggered by neural patterns
const ACTION_VERBS = {
    "navigate": {
        confidence: 0,
        direction: null,
        active: false
    },
    "select": {
        confidence: 0,
        active: false
    },
    "modify": {
        confidence: 0,
        direction: null,
        active: false
    },
    "create": {
        confidence: 0,
        topic: null,
        active: false
    },
    "delete": {
        confidence: 0,
        active: false
    }
};

/**
 * Initialize the NeuroLLaMA component
 */
function initNeuroLLaMA() {
    console.log("Initializing NeuroLLaMA integration...");
    
    // Cache DOM elements
    cacheElements();
    
    // Initialize UI
    initializeUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Try to establish connection to LLaMA API
    checkAPIConnection();
    
    // Initialize integration with neural processor
    initNeuralIntegration();
}

/**
 * Cache DOM elements for faster access
 */
function cacheElements() {
    elements = {
        container: document.getElementById('neuro-llama-container'),
        outputArea: document.getElementById('llama-output-area'),
        promptInput: document.getElementById('llama-prompt-input'),
        sendButton: document.getElementById('llama-send-button'),
        modelSelector: document.getElementById('llama-model-selector'),
        clearButton: document.getElementById('llama-clear-button'),
        tempSlider: document.getElementById('llama-temp-slider'),
        tempValue: document.getElementById('llama-temp-value'),
        loadingIndicator: document.getElementById('llama-loading'),
        connectionIndicator: document.getElementById('llama-connection-status'),
        toggleNeuralButton: document.getElementById('llama-toggle-neural'),
        attentionVisualizer: document.getElementById('llama-attention-viz'),
        neuralMappingList: document.getElementById('neural-mapping-list'),
        conceptPanel: document.getElementById('neural-concept-panel'),
        actionStatePanel: document.getElementById('action-state-panel')
    };
}

/**
 * Set up event listeners for UI interactions
 */
function setupEventListeners() {
    if (!elements.container) {
        console.error("NeuroLLaMA container not found. UI initialization failed.");
        return;
    }
    
    // Send button
    elements.sendButton.addEventListener('click', () => {
        sendPromptToLLaMA();
    });
    
    // Enter key in prompt input
    elements.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPromptToLLaMA();
        }
    });
    
    // Clear button
    elements.clearButton.addEventListener('click', () => {
        clearConversation();
    });
    
    // Model selector
    elements.modelSelector.addEventListener('change', (e) => {
        neuroLLaMA.modelConfig.model = e.target.value;
        console.log(`Model changed to ${neuroLLaMA.modelConfig.model}`);
    });
    
    // Temperature slider
    elements.tempSlider.addEventListener('input', (e) => {
        neuroLLaMA.modelConfig.temperature = parseFloat(e.target.value);
        elements.tempValue.textContent = neuroLLaMA.modelConfig.temperature.toFixed(1);
    });
    
    // Toggle neural integration button
    elements.toggleNeuralButton.addEventListener('click', () => {
        toggleNeuralIntegration();
    });
    
    // Listen for theme changes
    document.addEventListener('themeChanged', updateTheme);
}

/**
 * Initialize the UI components
 */
function initializeUI() {
    if (!elements.container) {
        console.error("NeuroLLaMA container not found. UI initialization failed.");
        return;
    }
    
    // Initialize temperature display
    elements.tempValue.textContent = neuroLLaMA.modelConfig.temperature.toFixed(1);
    elements.tempSlider.value = neuroLLaMA.modelConfig.temperature;
    
    // Initialize model selector
    const defaultModel = neuroLLaMA.modelConfig.model;
    Array.from(elements.modelSelector.options).forEach(option => {
        if (option.value === defaultModel) {
            option.selected = true;
        }
    });
    
    // Initialize neural concept mapping display
    updateNeuralConceptMapping();
    
    // Update the connection status display
    updateConnectionStatus();
    
    // Apply current theme
    updateTheme();
}

/**
 * Update the theme for NeuroLLaMA components
 */
function updateTheme() {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (elements.attentionVisualizer) {
        // If we have a visualization component, update its theme
        // This would depend on the visualization library used
    }
}

/**
 * Initialize integration with neural signal processor
 */
function initNeuralIntegration() {
    // Listen for neural processor events
    document.addEventListener('processor:features-extracted', handleNeuralFeatures);
    document.addEventListener('processor:classification-updated', handleNeuralClassification);
    
    console.log("Neural integration initialized, listening for neural signals");
    
    // Notify the neural processor that we're ready
    document.dispatchEvent(new CustomEvent('neuro-llama:ready', {
        detail: {
            conceptMapping: NEURAL_CONCEPT_MAPPING,
            actionVerbs: Object.keys(ACTION_VERBS)
        }
    }));
}

/**
 * Handle extracted features from the neural processor
 */
function handleNeuralFeatures(event) {
    if (!neuroLLaMA.active) return;
    
    // Update last neural update timestamp
    neuroLLaMA.connectionStatus.lastNeuralUpdate = Date.now();
    neuroLLaMA.connectionStatus.neuralConnected = true;
    updateConnectionStatus();
    
    // Extract and store features
    if (event.detail && event.detail.features) {
        neuroLLaMA.neuralFeatures = event.detail.features;
        
        // Process attention weights if available to influence LLaMA attention
        if (neuroLLaMA.neuralFeatures.attentionMatrix && 
            neuroLLaMA.modelConfig.useAttentionWeighting) {
            processAttentionWeights(neuroLLaMA.neuralFeatures.attentionMatrix);
        }
        
        // Update action states based on neural features
        updateActionStates();
    }
}

/**
 * Handle classification results from the neural processor
 */
function handleNeuralClassification(event) {
    if (!neuroLLaMA.active) return;
    
    // Update last neural update timestamp
    neuroLLaMA.connectionStatus.lastNeuralUpdate = Date.now();
    neuroLLaMA.connectionStatus.neuralConnected = true;
    updateConnectionStatus();
    
    if (event.detail && event.detail.class) {
        const classification = event.detail.class;
        const confidence = event.detail.confidence || 0;
        
        console.log(`Received classification: ${classification} (${(confidence * 100).toFixed(1)}%)`);
        
        // Update neural concepts based on classification
        updateNeuralConcepts(classification, confidence);
        
        // Update action states based on classification
        updateActionStates(classification, confidence);
        
        // Consider triggering an action if confidence is high enough
        if (confidence >= neuroLLaMA.threshold) {
            considerTriggeringAction(classification, confidence);
        }
    }
}

/**
 * Update neural concepts based on classification
 */
function updateNeuralConcepts(classification, confidence) {
    // Get concepts for this classification
    const concepts = NEURAL_CONCEPT_MAPPING[classification] || [];
    
    if (concepts.length > 0) {
        // Filter concepts based on confidence
        const scaledConfidence = Math.min(1, confidence * 1.25); // Boost low confidences slightly
        const activeConcepts = confidence > 0.35 ? concepts : ['neutral'];
        
        // Update concept panel
        updateConceptPanel(classification, activeConcepts, confidence);
        
        // Store active concepts for later use
        neuroLLaMA.activeConcepts = {
            class: classification,
            concepts: activeConcepts,
            confidence: confidence,
            timestamp: Date.now()
        };
    } else {
        // Fall back to neutral state if no concepts for this classification
        updateConceptPanel('Rest', ['neutral'], 0);
    }
}

/**
 * Update the concept panel in the UI
 */
function updateConceptPanel(classification, concepts, confidence) {
    if (!elements.conceptPanel) return;
    
    // Update confidence pill
    const confidencePill = elements.conceptPanel.querySelector('.confidence-pill');
    if (confidencePill) {
        confidencePill.textContent = `${Math.round(confidence * 100)}%`;
        confidencePill.style.opacity = Math.max(0.3, confidence);
        
        // Apply color based on confidence
        if (confidence > 0.75) {
            confidencePill.style.backgroundColor = 'var(--success-color)';
        } else if (confidence > 0.5) {
            confidencePill.style.backgroundColor = 'var(--primary-color)';
        } else {
            confidencePill.style.backgroundColor = 'var(--text-secondary)';
        }
    }
    
    // Update active class
    const classValue = elements.conceptPanel.querySelector('.class-value');
    if (classValue) {
        classValue.textContent = classification;
    }
    
    // Update concept tags
    const conceptList = elements.conceptPanel.querySelector('.concept-list');
    if (conceptList) {
        // Clear existing concepts
        conceptList.innerHTML = '';
        
        // Add new concept tags
        concepts.forEach(concept => {
            const conceptTag = document.createElement('div');
            conceptTag.className = 'concept-tag';
            conceptTag.textContent = concept;
            conceptTag.style.opacity = Math.max(0.5, confidence);
            conceptList.appendChild(conceptTag);
        });
    }
}

/**
 * Update action states based on neural classification
 */
function updateActionStates(classification, confidence) {
    // Reset all action confidences first (they decay over time)
    for (const action in ACTION_VERBS) {
        // Apply decay
        ACTION_VERBS[action].confidence *= 0.9;
    }
    
    // Update specific actions based on classification
    switch (classification) {
        case 'Left Hand':
            // Left hand controls navigation backward
            ACTION_VERBS.navigate.confidence = Math.max(ACTION_VERBS.navigate.confidence, confidence);
            ACTION_VERBS.navigate.direction = 'backward';
            break;
        
        case 'Right Hand':
            // Right hand controls navigation forward
            ACTION_VERBS.navigate.confidence = Math.max(ACTION_VERBS.navigate.confidence, confidence);
            ACTION_VERBS.navigate.direction = 'forward';
            break;
        
        case 'Feet':
            // Feet controls modification (decrease values)
            ACTION_VERBS.modify.confidence = Math.max(ACTION_VERBS.modify.confidence, confidence);
            ACTION_VERBS.modify.direction = 'decrease';
            break;
        
        case 'Tongue':
            // Tongue controls selection and modification (increase values)
            ACTION_VERBS.select.confidence = Math.max(ACTION_VERBS.select.confidence, confidence);
            ACTION_VERBS.modify.confidence = Math.max(ACTION_VERBS.modify.confidence, confidence * 0.8);
            ACTION_VERBS.modify.direction = 'increase';
            break;
        
        case 'Rest':
            // Rest state slowly decreases all confidences
            for (const action in ACTION_VERBS) {
                ACTION_VERBS[action].confidence *= 0.8;
            }
            break;
    }
    
    // Active state is set when confidence exceeds 0.6
    for (const action in ACTION_VERBS) {
        ACTION_VERBS[action].active = ACTION_VERBS[action].confidence > 0.6;
    }
    
    // Update UI
    updateActionStatePanel();
}

/**
 * Process attention weights from neural processor
 */
function processAttentionWeights(attentionMatrix) {
    // In a real system, these would be used to influence LLM attention
    // For demonstration, we just visualize them
    visualizeAttentionMatrix(attentionMatrix);
}

/**
 * Visualize attention matrix in the UI
 */
function visualizeAttentionMatrix(matrix) {
    const canvas = elements.attentionVisualizer;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Normalize matrix size to fit canvas
    const size = Math.min(matrix.length, 8); // Limit to 8x8 for visualization
    const cellSize = Math.floor(canvas.width / size);
    const padding = 1;
    
    // Set gradient colors
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const lowColor = isDarkTheme ? [30, 30, 70] : [220, 220, 255];
    const highColor = isDarkTheme ? [80, 140, 240] : [0, 90, 220];
    
    // Calculate position offset to center the matrix
    const offsetX = Math.floor((canvas.width - cellSize * size) / 2);
    const offsetY = Math.floor((canvas.height - cellSize * size) / 2);
    
    // Find min and max values for normalization
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const value = matrix[i][j];
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    }
    
    // Draw matrix
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // Normalize value between 0 and 1
            const value = (matrix[i][j] - min) / (max - min || 1);
            
            // Interpolate color
            const r = Math.floor(lowColor[0] + value * (highColor[0] - lowColor[0]));
            const g = Math.floor(lowColor[1] + value * (highColor[1] - lowColor[1]));
            const b = Math.floor(lowColor[2] + value * (highColor[2] - lowColor[2]));
            
            // Draw cell
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(
                offsetX + j * cellSize + padding,
                offsetY + i * cellSize + padding,
                cellSize - padding * 2,
                cellSize - padding * 2
            );
        }
    }
    
    // Add a subtle pulse animation to show it's live
    canvas.style.boxShadow = '0 0 10px rgba(80, 140, 240, 0.5)';
    setTimeout(() => {
        canvas.style.boxShadow = 'none';
    }, 500);
}

/**
 * Consider triggering an action based on neural classification
 */
function considerTriggeringAction(classification, confidence) {
    console.log(`Considering action for ${classification} with confidence ${confidence}`);
    
    // Find the action with the highest confidence above threshold
    let highestConfidence = 0;
    let actionToTrigger = null;
    
    for (const actionName in ACTION_VERBS) {
        const actionState = ACTION_VERBS[actionName];
        
        if (actionState.confidence > highestConfidence && actionState.confidence >= neuroLLaMA.threshold) {
            highestConfidence = actionState.confidence;
            actionToTrigger = actionName;
        }
    }
    
    // Only trigger if we have an action and it's been at least 2 seconds since last trigger
    if (actionToTrigger) {
        const actionState = ACTION_VERBS[actionToTrigger];
        const now = Date.now();
        const lastTriggered = actionState.lastTriggered || 0;
        
        if (now - lastTriggered > 2000) {
            console.log(`Triggering action: ${actionToTrigger}`);
            triggerAction(actionToTrigger, actionState);
            
            // Mark as triggered and update last triggered time
            actionState.triggered = true;
            actionState.lastTriggered = now;
            
            // Update UI
            updateActionStatePanel();
        } else {
            console.log(`Action ${actionToTrigger} ignored (too soon since last trigger)`);
        }
    }
}

/**
 * Trigger an action based on neural signal
 */
function triggerAction(action, actionState) {
    // Play a subtle sound effect for feedback
    const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAANTU1NTU1NTU1NTU1NTVVVVVVVVVVVVVVVVVVVVf39/f39/f39/f39/f3+fn5+fn5+fn5+fn5+fv7+/v7+/v7+/v7+/v7//////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCkAAAAAAAAAGwOH0QvgAAAAAAAAAAAAAAAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAMAAAGwADU1NTU1NTU1NTU1NTU1VVVVVVVVVVVVVVVVVVVVf39/f39/f39/f39/f39/n5+fn5+fn5+fn5+fn5+/v7+/v7+/v7+/v7+/v/////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAkApAAAAAAAAABsDh9EL4AAAAAAAAAAAAAAAD/4zjAAAPoAAAAAMiEjP//lP///ui0azTbZ1DOqqqR3JyOUFtZsrIUPUMRDk6QAIAMiIAABgA7XS2kUDkoE4iImIOgdmjRMDiaNIJA7FQJw08UDoFBlDMQiDBAMABQXhxO4fCrzwNxI8WTssfhQEhf3e7u3nZmYTMzCBdw4bf4YXAQy3f4cB/fywJBzBYwcFAvJ/v9X//8a3/+6f+1f/LQEgf5aAkPbf+WB/v65c/5aA5P+SwJ//8tiQ//+Sv/5bBAAAYA0JZM8k4Jwy0SMmZGC8K5oQCBZnIUCcDCwCDgAAX2k1QiYEAQM8w+qr2srrNQPVA+UDwH+qB6oHdRd1F95V4/+VO/78//xdGNE3L////73//t/+3XKHT/////////////1H/////////9/6j///6dkK4f7P/pu/pNn9JsnpdmDUkjUeqP/nZZ9/Y3/kZP///9j////0M///8SCAOQnUNUn//1f/+////WQ//2f//bP///1f/+//9yB5uJ////////////////////////////////ZfNMDDYMXDcPQfBKIEgkiAQA4DISALOHICRMjQRJixYRxYQP2H33ZYA4eqVAAAAGS5jYxlDDpxDI+Zxp9ABi2C2OLsWYLnGCRBp0BiEYb1YGGahklipNOcgY7ABlIgHRs7TUAEAMj5AJnzLbM7RnmDTFQpgQAKAFAGAUjxgmTZp23bdbGBJBJLNk0BAgEFkKcCkBcgOBl0MQchoaCPxcPCw6sRldABDQfj3MSkZFGvdvCh5KJSXTqPwxbI5OmvK7j1JUStbN//SLo1v16N8fDhqcbw0Xdy3OnF1Z6uzqRMyyRz6n7kKmUW3zfYRVAGDTA0YMEYy5LjqH6iqjNauxGKHqQAAAAuMNRxsxD5jQNDwaHCWXrDl23///aU///1OTk7///0//p3///7P///9nh3u+G7ZmZmZ4bpnZZZnDUNnmZn///+zPsz7JJAGIYGKwUGQZhIRmAgrCIbVVAAAEAgAEAFgP+z//7VV/1f+yjIHQegoAg9b//7Kf/hcIP//5cIP/xeEH/6////+4QaEoAABGGGwEGCgFGAgEGLwsHLw0AAACf5P8rKaQkGKyv5P/+T/KU/uQon/8nJ///5P//+T////lKACxsGLhsGIBgGIBj4MQFYqCEAAArZVHMqlVSqVAAiUALwQLBwsCoKJUJCSiQRQKIiRgQwICN/+pTl/41///+o///+f/////z//y8f/L//5////y4f9XD///8uP//+Xj//////////////////////////yg');
    if (audio) {
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio feedback not supported'));
    }
    
    switch(action) {
        case 'navigate':
            // Navigate forward or backward in conversation
            if (actionState.direction === 'forward') {
                // Forward might suggest a prompt or continue
                if (elements.promptInput.value === '') {
                    suggestPrompt();
                } else {
                    // Add a forward bias to the temperature
                    adjustTemperature(0.1);
                }
            } else if (actionState.direction === 'backward') {
                // Backward might clear or adjust temperature down
                if (elements.promptInput.value !== '') {
                    // If there's text, just adjust temperature down
                    adjustTemperature(-0.1);
                } else {
                    // If no text, consider clearing recent history
                    clearRecentHistory();
                }
            }
            break;
            
        case 'select':
            // Selection triggers sending the current prompt
            if (elements.promptInput.value !== '') {
                sendPromptToLLaMA();
            } else {
                // If no prompt, suggest one
                suggestPrompt();
            }
            break;
            
        case 'modify':
            // Modification adjusts temperature
            if (actionState.direction === 'increase') {
                adjustTemperature(0.2);
            } else if (actionState.direction === 'decrease') {
                adjustTemperature(-0.2);
            }
            break;
            
        case 'create':
            // For 'create', we might suggest a creative prompt
            suggestPrompt('creative');
            break;
            
        case 'delete':
            // For 'delete', we clear the conversation
            clearConversation();
            break;
    }
    
    // Provide visual feedback by flashing the input
    if (elements.promptInput) {
        elements.promptInput.classList.add('highlighted');
        setTimeout(() => {
            elements.promptInput.classList.remove('highlighted');
        }, 500);
    }
}

/**
 * Append text to the current prompt
 */
function appendToPrompt(text) {
    const currentPrompt = elements.promptInput.value;
    if (currentPrompt.trim() === "") {
        elements.promptInput.value = text;
    } else {
        elements.promptInput.value = `${currentPrompt} ${text}`;
    }
}

/**
 * Clear recent history items
 */
function clearRecentHistory() {
    // Remove the last exchange from history
    if (neuroLLaMA.promptHistory.length > 0) {
        neuroLLaMA.promptHistory.pop();
        neuroLLaMA.responseHistory.pop();
        
        // Update the display
        updateConversationDisplay();
    }
}

/**
 * Adjust the temperature setting
 */
function adjustTemperature(delta) {
    // Calculate new temperature with bounds
    const newTemp = Math.min(Math.max(neuroLLaMA.modelConfig.temperature + delta, 0.1), 1.5);
    
    // Update model config
    neuroLLaMA.modelConfig.temperature = newTemp;
    
    // Update UI
    elements.tempSlider.value = newTemp;
    elements.tempValue.textContent = newTemp.toFixed(1);
}

/**
 * Suggest a prompt based on neural patterns
 */
function suggestPrompt(type) {
    // Get active classification
    const classification = neuroLLaMA.neuralFeatures.classificationResult;
    
    // Default prompt templates
    const promptTemplates = [
        "Can you explain how {{concept}} relates to brain-computer interfaces?",
        "What's the relationship between {{concept}} and neural signal processing?",
        "How does {{concept}} apply to motor imagery classification?",
        "Generate a short paragraph about {{concept}} in neuroscience.",
        "What are the latest developments in {{concept}} for BCI applications?"
    ];
    
    // Get concepts for this classification
    const concepts = NEURAL_CONCEPT_MAPPING[classification] || ["neural signals", "brain activity", "motor imagery"];
    
    // Choose a random concept and template
    const concept = concepts[Math.floor(Math.random() * concepts.length)];
    const template = promptTemplates[Math.floor(Math.random() * promptTemplates.length)];
    
    // Create the prompt and set it
    const prompt = template.replace("{{concept}}", concept);
    elements.promptInput.value = prompt;
    
    // Provide visual feedback
    elements.promptInput.classList.add('highlighted');
    setTimeout(() => {
        elements.promptInput.classList.remove('highlighted');
    }, 1000);
}

/**
 * Toggle neural integration on/off
 */
function toggleNeuralIntegration() {
    neuroLLaMA.active = !neuroLLaMA.active;
    neuroLLaMA.modelConfig.neuralGuidance = neuroLLaMA.active;
    
    console.log(`Neural integration ${neuroLLaMA.active ? 'enabled' : 'disabled'}`);
    
    // Update button text and style
    if (elements.toggleNeuralButton) {
        elements.toggleNeuralButton.innerHTML = `
            <i class="fas fa-brain"></i> 
            Neural Guidance: ${neuroLLaMA.active ? 'ON' : 'OFF'}
        `;
        
        // Update button style
        if (neuroLLaMA.active) {
            elements.toggleNeuralButton.classList.add('btn-primary');
            elements.toggleNeuralButton.classList.remove('btn-outlined');
        } else {
            elements.toggleNeuralButton.classList.remove('btn-primary');
            elements.toggleNeuralButton.classList.add('btn-outlined');
        }
    }
    
    // Update connection status
    if (elements.connectionIndicator) {
        if (neuroLLaMA.active) {
            elements.connectionIndicator.classList.remove('disconnected');
            elements.connectionIndicator.classList.add('connected');
            elements.connectionIndicator.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Connected</span>
            `;
            
            // Send activation event to neural processor
            document.dispatchEvent(new CustomEvent('neuro-llama:activation', {
                detail: {
                    active: true,
                    timestamp: Date.now()
                }
            }));
            
            // Check connection to neural processor
            checkNeuralProcessorConnection();
        } else {
            elements.connectionIndicator.classList.remove('connected');
            elements.connectionIndicator.classList.add('disconnected');
            elements.connectionIndicator.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <span>Disconnected</span>
            `;
            
            // Send deactivation event to neural processor
            document.dispatchEvent(new CustomEvent('neuro-llama:activation', {
                detail: {
                    active: false,
                    timestamp: Date.now()
                }
            }));
        }
    }
    
    // Reset the action states when toggling
    for (const action in ACTION_VERBS) {
        ACTION_VERBS[action].confidence = 0;
        ACTION_VERBS[action].active = false;
        ACTION_VERBS[action].triggered = false;
    }
    
    // Update UI
    updateActionStatePanel();
    
    // Provide feedback to the user
    if (neuroLLaMA.active) {
        // Add a temporary highlight to the neural panels
        const panels = [
            elements.conceptPanel,
            elements.actionStatePanel,
            elements.neuralMappingList,
            elements.attentionVisualizer
        ];
        
        panels.forEach(panel => {
            if (panel) {
                panel.style.transition = 'box-shadow 0.5s ease-in-out';
                panel.style.boxShadow = '0 0 15px rgba(66, 153, 225, 0.6)';
                
                setTimeout(() => {
                    panel.style.boxShadow = '';
                }, 1000);
            }
        });
        
        // Add a subtle highlight to the input
        if (elements.promptInput) {
            elements.promptInput.classList.add('highlighted');
            setTimeout(() => {
                elements.promptInput.classList.remove('highlighted');
            }, 800);
        }
    }
}

/**
 * Check connection to neural processor
 */
function checkNeuralProcessorConnection() {
    console.log("Checking connection to Neural Signal Processor...");
    
    // Create a timeout promise that resolves after 2 seconds
    const timeout = new Promise(resolve => {
        setTimeout(() => {
            resolve({
                connected: false,
                reason: 'timeout'
            });
        }, 2000);
    });
    
    // Create a connection check promise
    const checkConnection = new Promise(resolve => {
        // Set up a one-time event listener for the response
        const handleResponse = (event) => {
            document.removeEventListener('processor:connection-response', handleResponse);
            
            if (event.detail && event.detail.status === 'connected') {
                resolve({
                    connected: true,
                    features: event.detail.features || []
                });
            } else {
                resolve({
                    connected: false,
                    reason: 'rejected'
                });
            }
        };
        
        document.addEventListener('processor:connection-response', handleResponse, { once: true });
        
        // Send connection request event
        document.dispatchEvent(new CustomEvent('neuro-llama:connection-request', {
            detail: {
                timestamp: Date.now(),
                clientId: 'neuro-llama-' + Math.random().toString(36).substring(2, 10)
            }
        }));
    });
    
    // Race the timeout against the connection check
    Promise.race([timeout, checkConnection]).then(result => {
        if (result.connected) {
            console.log("Successfully connected to Neural Signal Processor");
            neuroLLaMA.connectionStatus.neuralConnected = true;
            
            // Update available features if provided
            if (result.features && result.features.length > 0) {
                console.log("Available features:", result.features);
            }
        } else {
            console.warn(`Failed to connect to Neural Signal Processor: ${result.reason}`);
            neuroLLaMA.connectionStatus.neuralConnected = false;
        }
        
        // Update connection status in UI
        updateConnectionStatus();
    });
}

/**
 * Update neural concept mapping display
 */
function updateNeuralConceptMapping() {
    if (!elements.neuralMappingList) return;
    
    let mappingHTML = '';
    
    for (const [classification, concepts] of Object.entries(NEURAL_CONCEPT_MAPPING)) {
        mappingHTML += `
            <div class="mapping-item">
                <div class="mapping-class">${classification}</div>
                <div class="mapping-concepts">
                    ${concepts.map(concept => 
                        `<span class="concept-item" data-concept="${concept}">${concept}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    elements.neuralMappingList.innerHTML = mappingHTML;
}

/**
 * Send current prompt to LLaMA
 */
function sendPromptToLLaMA() {
    const prompt = elements.promptInput.value.trim();
    if (prompt === "") return;
    
    // Update UI to show we're processing
    setProcessingState(true);
    
    // Store prompt in history
    neuroLLaMA.promptHistory.push(prompt);
    neuroLLaMA.currentPrompt = prompt;
    
    // Clear input area
    elements.promptInput.value = "";
    
    // Update conversation display with the new prompt
    updateConversationDisplay();
    
    // In a real implementation, this would call the LLaMA API
    // For now, simulate a response with a timeout
    simulateLLaMAResponse(prompt);
}

/**
 * Set the processing state and update UI accordingly
 */
function setProcessingState(isProcessing) {
    neuroLLaMA.uiState.thinking = isProcessing;
    
    if (isProcessing) {
        elements.loadingIndicator.style.display = 'block';
        elements.sendButton.disabled = true;
    } else {
        elements.loadingIndicator.style.display = 'none';
        elements.sendButton.disabled = false;
    }
}

/**
 * Simulate a response from LLaMA model
 */
function simulateLLaMAResponse(prompt) {
    // Generate a simple response based on the prompt
    const neuralConcepts = getCurrentNeuralConcepts();
    
    // Simple responses based on prompt content
    let responseText = "";
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes("hello") || promptLower.includes("hi")) {
        responseText = "Hello! I'm NeuroLLaMA, an integration of neural signals and language models. How can I help you today?";
    } else if (promptLower.includes("neural") || promptLower.includes("brain") || promptLower.includes("eeg")) {
        responseText = "Neural signals are fascinating! They represent electrical activity in the brain that can be measured using EEG. In brain-computer interfaces, these signals are processed and classified to control external devices or software.";
    } else if (promptLower.includes("llama") || promptLower.includes("language model")) {
        responseText = "LLaMA is a family of large language models developed by Meta AI. By integrating neural signals with language models like LLaMA, we can create more intuitive brain-computer interfaces that translate neural patterns into rich semantic content.";
    } else if (promptLower.includes("how") && promptLower.includes("work")) {
        responseText = "NeuroLLaMA works by mapping neural signal patterns to semantic concepts and actions. When your brain generates patterns associated with specific motor imagery classes, these are translated into concepts that guide my responses. This creates a bidirectional interface between your neural activity and language generation.";
    } else {
        // Default response incorporating neural concepts
        responseText = `I notice your neural signals are showing patterns associated with concepts like ${neuralConcepts.join(", ")}. `;
        responseText += `Based on your question about "${prompt}", I think you might be interested in how these concepts relate to brain-computer interfaces and neural signal processing. `;
        responseText += `The field of neural engineering continues to advance, with new methods for decoding intention and thought from brain activity. Would you like me to elaborate on any particular aspect?`;
    }
    
    // Simulate typing effect
    simulateTypingEffect(responseText);
}

/**
 * Get current neural concepts based on active classification
 */
function getCurrentNeuralConcepts() {
    const classification = neuroLLaMA.neuralFeatures.classificationResult || "Rest";
    return NEURAL_CONCEPT_MAPPING[classification] || ["neural signals", "brain activity"];
}

/**
 * Simulate a typing effect for the response
 */
function simulateTypingEffect(text) {
    neuroLLaMA.uiState.streamingResponse = true;
    
    let currentResponse = "";
    const responseElement = document.createElement('div');
    responseElement.className = 'llama-response typing';
    
    // Add a placeholder to the output area
    elements.outputArea.appendChild(responseElement);
    
    // Auto-scroll to bottom
    elements.outputArea.scrollTop = elements.outputArea.scrollHeight;
    
    // Set up character-by-character typing effect
    let charIndex = 0;
    const typingInterval = setInterval(() => {
        if (charIndex < text.length) {
            currentResponse += text.charAt(charIndex);
            responseElement.textContent = currentResponse;
            
            // Auto-scroll as typing happens
            elements.outputArea.scrollTop = elements.outputArea.scrollHeight;
            
            charIndex++;
        } else {
            // Done typing
            clearInterval(typingInterval);
            responseElement.classList.remove('typing');
            
            // Store in history
            neuroLLaMA.responseHistory.push(text);
            neuroLLaMA.lastResponse = text;
            
            // Reset states
            neuroLLaMA.uiState.streamingResponse = false;
            setProcessingState(false);
        }
    }, 20);
}

/**
 * Update the conversation display with history
 */
function updateConversationDisplay() {
    // Clear output area
    elements.outputArea.innerHTML = '';
    
    // Add all history items
    for (let i = 0; i < neuroLLaMA.promptHistory.length; i++) {
        // Add prompt
        const promptElement = document.createElement('div');
        promptElement.className = 'llama-prompt';
        promptElement.textContent = neuroLLaMA.promptHistory[i];
        elements.outputArea.appendChild(promptElement);
        
        // Add response if available
        if (i < neuroLLaMA.responseHistory.length) {
            const responseElement = document.createElement('div');
            responseElement.className = 'llama-response';
            responseElement.textContent = neuroLLaMA.responseHistory[i];
            elements.outputArea.appendChild(responseElement);
        }
    }
    
    // Auto-scroll to bottom
    elements.outputArea.scrollTop = elements.outputArea.scrollHeight;
}

/**
 * Clear the conversation history
 */
function clearConversation() {
    // Clear history arrays
    neuroLLaMA.promptHistory = [];
    neuroLLaMA.responseHistory = [];
    
    // Clear display
    elements.outputArea.innerHTML = '';
    
    // Reset current states
    neuroLLaMA.currentPrompt = "";
    neuroLLaMA.lastResponse = "";
    
    console.log("Conversation cleared");
}

/**
 * Check API connection status
 */
function checkAPIConnection() {
    // In a real implementation, this would ping the LLaMA API
    // For demonstration, simulate a successful connection
    setTimeout(() => {
        neuroLLaMA.connectionStatus.apiConnected = true;
        neuroLLaMA.connectionStatus.lastApiPing = Date.now();
        updateConnectionStatus();
    }, 1000);
}

/**
 * Update connection status display
 */
function updateConnectionStatus() {
    if (!elements.connectionIndicator) return;
    
    const apiConnected = neuroLLaMA.connectionStatus.apiConnected;
    const neuralConnected = neuroLLaMA.connectionStatus.neuralConnected;
    
    // Update connection indicator
    if (apiConnected && neuralConnected) {
        elements.connectionIndicator.className = 'connection-status connected';
        elements.connectionIndicator.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Fully Connected</span>
        `;
    } else if (apiConnected) {
        elements.connectionIndicator.className = 'connection-status partial';
        elements.connectionIndicator.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>API Connected, Neural Disconnected</span>
        `;
    } else if (neuralConnected) {
        elements.connectionIndicator.className = 'connection-status partial';
        elements.connectionIndicator.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>Neural Connected, API Disconnected</span>
        `;
    } else {
        elements.connectionIndicator.className = 'connection-status disconnected';
        elements.connectionIndicator.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>Disconnected</span>
        `;
    }
}

/**
 * Update the action state panel in the UI
 */
function updateActionStatePanel() {
    if (!elements.actionStatePanel) return;
    
    // Find all action state elements
    const actionElements = {};
    elements.actionStatePanel.querySelectorAll('.action-state').forEach(element => {
        const actionName = element.querySelector('.action-name')?.textContent;
        if (actionName) {
            actionElements[actionName] = element;
        }
    });
    
    // Update or create elements for each action
    for (const action in ACTION_VERBS) {
        const actionState = ACTION_VERBS[action];
        const confidence = actionState.confidence;
        
        // Get the element or create if not exists
        let actionElement = actionElements[action];
        
        if (!actionElement) {
            // Create new element if it doesn't exist
            actionElement = document.createElement('div');
            actionElement.className = 'action-state';
            actionElement.innerHTML = `
                <div class="action-header">
                    <span class="action-name">${action}</span>
                    <span class="action-confidence">0%</span>
                </div>
                <div class="action-progress">
                    <div class="action-bar" style="width: 0%"></div>
                </div>
            `;
            elements.actionStatePanel.appendChild(actionElement);
        }
        
        // Update the element with current state
        const confidenceElement = actionElement.querySelector('.action-confidence');
        const progressBar = actionElement.querySelector('.action-bar');
        
        if (confidenceElement) {
            confidenceElement.textContent = `${Math.round(confidence * 100)}%`;
        }
        
        if (progressBar) {
            progressBar.style.width = `${confidence * 100}%`;
        }
        
        // Add or remove active class
        if (actionState.active) {
            actionElement.classList.add('active');
        } else {
            actionElement.classList.remove('active');
        }
        
        // Add triggered class briefly if action was triggered
        if (actionState.triggered) {
            actionElement.classList.add('triggered');
            
            // Remove triggered state after animation
            setTimeout(() => {
                actionElement.classList.remove('triggered');
                actionState.triggered = false;
            }, 1000);
        }
        
        // Update direction or other details if present
        let detailElement = actionElement.querySelector('.action-detail');
        
        if (actionState.direction) {
            if (!detailElement) {
                detailElement = document.createElement('div');
                detailElement.className = 'action-detail';
                actionElement.appendChild(detailElement);
            }
            detailElement.textContent = `Direction: ${actionState.direction}`;
        } else if (actionState.topic) {
            if (!detailElement) {
                detailElement = document.createElement('div');
                detailElement.className = 'action-detail';
                actionElement.appendChild(detailElement);
            }
            detailElement.textContent = `Topic: ${actionState.topic}`;
        } else if (detailElement) {
            // Remove detail element if no details to show
            detailElement.remove();
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initNeuroLLaMA, 1000); // Slight delay to ensure other components are loaded
}); 