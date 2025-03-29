/**
 * Neural Signal Processor Module
 * Handles EEG signal processing, feature extraction, and classification
 */

// Initialize variables
let processorActive = false;
let processorIntervalId;
let processorData = {
    classificationResult: 'Idle',
    confidence: 0,
    activeElectrodes: ['C3', 'C4', 'Cz', 'Fz', 'Pz', 'P3', 'P4', 'O1', 'O2'],
    frequencyBands: {
        delta: generateRandomBandPowers(0.5, 4),
        theta: generateRandomBandPowers(4, 8),
        alpha: generateRandomBandPowers(8, 13),
        beta: generateRandomBandPowers(13, 30),
        gamma: generateRandomBandPowers(30, 50)
    },
    decodedOutputHistory: [],
    attentionWeights: generateRandomAttentionMatrix(8),
    // Add decoder-related properties
    decoderFeatures: null,
    movementParameters: {
        x: 0,
        y: 0,
        velocity: 0
    }
};

// Event for decoder integration
const PROCESSOR_EVENTS = {
    CLASSIFICATION_UPDATED: 'processor:classification-updated',
    FEATURES_EXTRACTED: 'processor:features-extracted',
    DECODER_READY: 'processor:decoder-ready'
};

// Charts
let frequencyBandChart;
let decodedOutputChart;
let attentionHeatmapChart;

// Configuration
const CONFIG = {
    updateInterval: 500, // ms
    maxHistoryPoints: 50,
    classLabels: ['Left Hand', 'Right Hand', 'Feet', 'Tongue', 'Rest'],
    colorMap: [
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)'
    ],
    // Bridge configuration for decoder integration
    decoderBridge: {
        enabled: true,
        featureExtractionMethod: 'transformer', // 'transformer' or 'traditional'
        classToMovementMap: {
            'Left Hand': { x: -1, y: 0 },
            'Right Hand': { x: 1, y: 0 },
            'Feet': { x: 0, y: -1 },
            'Tongue': { x: 0, y: 1 },
            'Rest': { x: 0, y: 0 }
        }
    }
};

/**
 * Initialize the Neural Signal Processor
 */
function initNeuralSignalProcessor() {
    console.log("Initializing Neural Signal Processor...");
    
    // Setup control event listeners
    setupControlEventListeners();
    
    // Initialize visualization charts
    initFrequencyBandChart();
    initDecodedOutputChart();
    initAttentionHeatmap();
    
    // Setup configuration panel
    setupConfigPanel();
    
    // Start with inactive processor
    updateProcessorStatus(false);
    
    // Initial UI update
    updateUI();
    
    // Initialize decoder bridge
    initDecoderBridge();
    
    // Setup integration with other components
    setupComponentIntegration();
}

/**
 * Setup event listeners for control buttons
 */
function setupControlEventListeners() {
    // Start button
    document.getElementById('processor-start-btn').addEventListener('click', () => {
        startProcessor();
    });
    
    // Stop button
    document.getElementById('processor-stop-btn').addEventListener('click', () => {
        stopProcessor();
    });
    
    // Reset button
    document.getElementById('processor-reset-btn').addEventListener('click', () => {
        resetProcessor();
    });
    
    // Export results button
    document.getElementById('processor-export-btn').addEventListener('click', () => {
        exportProcessorResults();
    });
    
    // Fullscreen button
    document.getElementById('processor-fullscreen-btn').addEventListener('click', () => {
        toggleFullscreen(document.querySelector('.neural-processor-card'));
    });
    
    // Attention layer selector
    document.getElementById('attention-layer-select').addEventListener('change', (e) => {
        updateAttentionHeatmap(parseInt(e.target.value));
    });
}

/**
 * Setup the configuration panel
 */
function setupConfigPanel() {
    // Embedding dimension
    document.getElementById('embedding-dim').addEventListener('change', (e) => {
        console.log(`Embedding dimension changed to ${e.target.value}`);
        // Reconfigure model (would be implemented in a real system)
    });
    
    // Attention heads
    document.getElementById('attention-heads').addEventListener('change', (e) => {
        console.log(`Attention heads changed to ${e.target.value}`);
        // Update attention visualization
        processorData.attentionWeights = generateRandomAttentionMatrix(parseInt(e.target.value));
        updateAttentionHeatmap(0);
    });
    
    // Transformer layers
    document.getElementById('transformer-layers').addEventListener('change', (e) => {
        console.log(`Transformer layers changed to ${e.target.value}`);
        // Update layer selector options
        updateLayerSelector(parseInt(e.target.value));
    });
    
    // Kalman filter
    document.getElementById('kalman-filter').addEventListener('change', (e) => {
        console.log(`Kalman filter ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
}

/**
 * Update layer selector options based on number of layers
 */
function updateLayerSelector(numLayers) {
    const selector = document.getElementById('attention-layer-select');
    selector.innerHTML = '';
    
    for (let i = 0; i < numLayers; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Layer ${i+1}`;
        selector.appendChild(option);
    }
}

/**
 * Initialize frequency band power chart
 */
function initFrequencyBandChart() {
    const ctx = document.getElementById('frequency-band-chart').getContext('2d');
    
    frequencyBandChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
            datasets: [{
                label: 'Band Power',
                data: [
                    average(processorData.frequencyBands.delta),
                    average(processorData.frequencyBands.theta),
                    average(processorData.frequencyBands.alpha),
                    average(processorData.frequencyBands.beta),
                    average(processorData.frequencyBands.gamma)
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            animation: {
                duration: 300
            }
        }
    });
}

/**
 * Initialize decoded output chart
 */
function initDecodedOutputChart() {
    const ctx = document.getElementById('decoded-output-chart').getContext('2d');
    
    // Initialize with empty data
    processorData.decodedOutputHistory = [];
    for (let i = 0; i < CONFIG.maxHistoryPoints; i++) {
        processorData.decodedOutputHistory.push({
            time: -i * (CONFIG.updateInterval / 1000),
            values: CONFIG.classLabels.map(() => Math.random() * 10)
        });
    }
    
    // Prepare datasets
    const datasets = CONFIG.classLabels.map((label, idx) => {
        return {
            label: label,
            data: processorData.decodedOutputHistory.map(point => ({
                x: point.time,
                y: point.values[idx]
            })),
            borderColor: CONFIG.colorMap[idx],
            backgroundColor: CONFIG.colorMap[idx].replace('0.7', '0.1'),
            tension: 0.4,
            pointRadius: 0
        };
    });
    
    decodedOutputChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Time (s)'
                    },
                    min: -10,
                    max: 0
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Activation'
                    }
                }
            },
            animation: {
                duration: 0
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

/**
 * Initialize attention heatmap
 */
function initAttentionHeatmap() {
    const ctx = document.getElementById('attention-heatmap').getContext('2d');
    
    // Get initial data
    const attentionData = processorData.attentionWeights[0]; // First layer
    
    attentionHeatmapChart = new Chart(ctx, {
        type: 'heatmap',
        data: {
            datasets: [{
                data: attentionData.flatMap((row, i) => 
                    row.map((value, j) => ({
                        x: j,
                        y: i,
                        v: value
                    }))
                ),
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.2)',
                backgroundColor: ({ raw }) => {
                    const value = raw.v;
                    // Color scale from blue to red
                    const r = Math.floor(255 * value);
                    const b = Math.floor(255 * (1 - value));
                    return `rgba(${r}, 0, ${b}, 0.7)`;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5,
                    max: attentionData[0].length - 0.5,
                    ticks: {
                        callback: function(value) {
                            return `T${value}`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Query'
                    }
                },
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: attentionData.length - 0.5,
                    ticks: {
                        callback: function(value) {
                            return `T${value}`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Key'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const item = context[0];
                            return `Query T${item.parsed.x} -> Key T${item.parsed.y}`;
                        },
                        label: function(context) {
                            return `Attention: ${(context.parsed.v * 100).toFixed(1)}%`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Update the attention heatmap with new data
 */
function updateAttentionHeatmap(layerIndex) {
    const attentionData = processorData.attentionWeights[layerIndex];
    
    // Update chart data
    attentionHeatmapChart.data.datasets[0].data = attentionData.flatMap((row, i) => 
        row.map((value, j) => ({
            x: j,
            y: i,
            v: value
        }))
    );
    
    // Update scales
    attentionHeatmapChart.options.scales.x.max = attentionData[0].length - 0.5;
    attentionHeatmapChart.options.scales.y.max = attentionData.length - 0.5;
    
    attentionHeatmapChart.update();
}

/**
 * Start the neural signal processor
 */
function startProcessor() {
    if (!processorActive) {
        processorActive = true;
        updateProcessorStatus(true);
        processorIntervalId = setInterval(processorTick, CONFIG.updateInterval);
        console.log("Neural Signal Processor started");
    }
}

/**
 * Stop the neural signal processor
 */
function stopProcessor() {
    if (processorActive) {
        processorActive = false;
        updateProcessorStatus(false);
        clearInterval(processorIntervalId);
        console.log("Neural Signal Processor stopped");
    }
}

/**
 * Reset the neural signal processor
 */
function resetProcessor() {
    console.log("Neural Signal Processor reset");
    
    // Stop if running
    if (processorActive) {
        stopProcessor();
    }
    
    // Reset data
    processorData.classificationResult = 'Idle';
    processorData.confidence = 0;
    processorData.frequencyBands = {
        delta: generateRandomBandPowers(0.5, 4),
        theta: generateRandomBandPowers(4, 8),
        alpha: generateRandomBandPowers(8, 13),
        beta: generateRandomBandPowers(13, 30),
        gamma: generateRandomBandPowers(30, 50)
    };
    
    // Reset charts
    updateUI();
}

/**
 * Export processor results
 */
function exportProcessorResults() {
    console.log("Exporting Neural Signal Processor results");
    
    // Create export data
    const exportData = {
        timestamp: new Date().toISOString(),
        classification: processorData.classificationResult,
        confidence: processorData.confidence,
        activeElectrodes: processorData.activeElectrodes,
        frequencyBands: processorData.frequencyBands,
        decodedOutputHistory: processorData.decodedOutputHistory,
        attentionWeights: processorData.attentionWeights,
        config: {
            embeddingDim: document.getElementById('embedding-dim').value,
            attentionHeads: document.getElementById('attention-heads').value,
            transformerLayers: document.getElementById('transformer-layers').value,
            kalmanFilter: document.getElementById('kalman-filter').checked
        }
    };
    
    // Create and download a JSON file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `neural-processor-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Processor tick - update data and UI
 */
function processorTick() {
    if (!processorActive) return;
    
    // Simulate signal processing and classification
    simulateSignalProcessing();
    
    // Update UI
    updateUI();
}

/**
 * Simulate signal processing and classification
 */
function simulateSignalProcessing() {
    // Simulate frequency band changes
    updateFrequencyBands();
    
    // Simulate classification
    simulateClassification();
    
    // Update decoded output history
    updateDecodedOutputHistory();
    
    // Random attention weight changes
    if (Math.random() < 0.3) {
        const numHeads = parseInt(document.getElementById('attention-heads').value);
        processorData.attentionWeights = generateRandomAttentionMatrix(numHeads);
        const currentLayer = parseInt(document.getElementById('attention-layer-select').value);
        updateAttentionHeatmap(currentLayer);
    }
    
    // Extract and send features to decoder
    if (CONFIG.decoderBridge.enabled) {
        sendFeaturesToDecoder();
    }
}

/**
 * Update frequency bands with small random changes
 */
function updateFrequencyBands() {
    for (const band in processorData.frequencyBands) {
        processorData.frequencyBands[band] = processorData.frequencyBands[band].map(value => {
            // Add small random change
            const change = (Math.random() - 0.5) * 10;
            return Math.max(0, Math.min(100, value + change));
        });
    }
}

/**
 * Simulate classification results
 */
function simulateClassification() {
    // Randomly change classification occasionally
    if (Math.random() < 0.1) {
        const classIndex = Math.floor(Math.random() * CONFIG.classLabels.length);
        processorData.classificationResult = CONFIG.classLabels[classIndex];
        processorData.confidence = 0.5 + Math.random() * 0.5; // 50-100%
        
        // Notify about classification update
        document.dispatchEvent(new CustomEvent(PROCESSOR_EVENTS.CLASSIFICATION_UPDATED, {
            detail: {
                class: processorData.classificationResult,
                confidence: processorData.confidence,
                timestamp: Date.now()
            }
        }));
    } else {
        // Small changes in confidence
        processorData.confidence = Math.min(1, Math.max(0.5, 
            processorData.confidence + (Math.random() - 0.5) * 0.1
        ));
    }
}

/**
 * Update decoded output history
 */
function updateDecodedOutputHistory() {
    // Shift time values
    const timeStep = CONFIG.updateInterval / 1000;
    processorData.decodedOutputHistory = processorData.decodedOutputHistory.map(point => ({
        time: point.time + timeStep,
        values: point.values
    }));
    
    // Remove old points
    while (processorData.decodedOutputHistory.length > 0 && 
           processorData.decodedOutputHistory[0].time > 0) {
        processorData.decodedOutputHistory.shift();
    }
    
    // Add new point
    const classIndex = CONFIG.classLabels.indexOf(processorData.classificationResult);
    const newValues = CONFIG.classLabels.map((_, idx) => {
        if (idx === classIndex) {
            return 7 + Math.random() * 3; // 7-10 for the classified class
        } else {
            return Math.random() * 5; // 0-5 for other classes
        }
    });
    
    processorData.decodedOutputHistory.push({
        time: -timeStep,
        values: newValues
    });
    
    // Update chart datasets
    CONFIG.classLabels.forEach((label, idx) => {
        decodedOutputChart.data.datasets[idx].data = processorData.decodedOutputHistory.map(point => ({
            x: point.time,
            y: point.values[idx]
        }));
    });
    
    decodedOutputChart.update();
}

/**
 * Update the processor status indicators
 */
function updateProcessorStatus(active) {
    const statusIndicator = document.getElementById('processor-status-indicator');
    const statusText = document.getElementById('processor-status-text');
    
    if (active) {
        statusIndicator.classList.remove('status-inactive');
        statusIndicator.classList.add('status-active');
        statusText.textContent = 'Active';
    } else {
        statusIndicator.classList.remove('status-active');
        statusIndicator.classList.add('status-inactive');
        statusText.textContent = 'Inactive';
    }
}

/**
 * Update the UI with current processor data
 */
function updateUI() {
    // Update classification result
    document.getElementById('classification-result').textContent = processorData.classificationResult;
    
    // Update confidence bar
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceValue = document.getElementById('confidence-value');
    confidenceBar.style.width = `${processorData.confidence * 100}%`;
    confidenceValue.textContent = `${Math.round(processorData.confidence * 100)}%`;
    
    // Update frequency band chart
    frequencyBandChart.data.datasets[0].data = [
        average(processorData.frequencyBands.delta),
        average(processorData.frequencyBands.theta),
        average(processorData.frequencyBands.alpha),
        average(processorData.frequencyBands.beta),
        average(processorData.frequencyBands.gamma)
    ];
    frequencyBandChart.update();
}

/**
 * Toggle fullscreen for an element
 */
function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

/**
 * Helper function to calculate average of array
 */
function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Generate random band powers for EEG frequency bands
 */
function generateRandomBandPowers(minFreq, maxFreq) {
    const numPoints = 10; // Number of electrodes
    return Array(numPoints).fill().map(() => 20 + Math.random() * 60); // 20-80 power
}

/**
 * Generate random attention matrix
 */
function generateRandomAttentionMatrix(numHeads) {
    const sequenceLength = 16; // Typical transformer sequence length
    
    // Generate matrices for each attention head
    return Array(numHeads).fill().map(() => {
        // Create a matrix of attention weights
        return Array(sequenceLength).fill().map(() => {
            return Array(sequenceLength).fill().map(() => Math.random());
        }).map(row => {
            // Normalize row to sum to 1 (softmax)
            const sum = row.reduce((a, b) => a + b, 0);
            return row.map(v => v / sum);
        });
    });
}

/**
 * Initialize decoder bridge
 */
function initDecoderBridge() {
    if (!CONFIG.decoderBridge.enabled) return;
    
    console.log("Initializing Neural Signal Processor to Decoder bridge...");
    
    // Add bridge toggle to config panel
    addDecoderBridgeToggle();
    
    // Listen for decoder-related events
    document.addEventListener('decoder:ready', handleDecoderReady);
    
    // Dispatch an event to notify that the processor is ready
    document.dispatchEvent(new CustomEvent(PROCESSOR_EVENTS.DECODER_READY, {
        detail: {
            electrodes: processorData.activeElectrodes,
            supportedClasses: CONFIG.classLabels
        }
    }));
}

/**
 * Add decoder bridge toggle to config panel
 */
function addDecoderBridgeToggle() {
    // Check if the toggle already exists
    if (document.getElementById('decoder-bridge-toggle')) return;
    
    // Find the config options container
    const configOptions = document.querySelector('.config-options');
    if (!configOptions) return;
    
    // Create the toggle
    const configItem = document.createElement('div');
    configItem.className = 'config-item';
    configItem.innerHTML = `
        <label for="decoder-bridge-toggle">Connect to Decoder:</label>
        <input type="checkbox" id="decoder-bridge-toggle" ${CONFIG.decoderBridge.enabled ? 'checked' : ''}>
    `;
    
    // Append to config options
    configOptions.appendChild(configItem);
    
    // Add event listener
    document.getElementById('decoder-bridge-toggle').addEventListener('change', (e) => {
        CONFIG.decoderBridge.enabled = e.target.checked;
        console.log(`Decoder bridge ${CONFIG.decoderBridge.enabled ? 'enabled' : 'disabled'}`);
        
        // If enabled, re-initialize the bridge
        if (CONFIG.decoderBridge.enabled) {
            initDecoderBridge();
        }
    });
}

/**
 * Handle decoder ready event
 */
function handleDecoderReady(event) {
    console.log("Decoder ready, establishing connection...", event.detail);
    
    // If there's any initialization needed based on decoder capabilities
    if (event.detail && event.detail.supportedFeatures) {
        // Configure processor based on decoder capabilities
        // This is placeholder logic
        if (event.detail.supportedFeatures.includes('attentionWeights')) {
            console.log("Decoder supports attention weights, enabling feature extraction");
        }
    }
}

/**
 * Extract features for decoder from current processor state
 */
function extractFeaturesForDecoder() {
    if (!CONFIG.decoderBridge.enabled) return null;
    
    // Feature extraction based on configured method
    let features;
    
    if (CONFIG.decoderBridge.featureExtractionMethod === 'transformer') {
        // Use attention weights and band powers to create feature vector
        features = {
            attentionMatrix: processorData.attentionWeights[0], // Use first attention head
            bandPowers: {
                alpha: average(processorData.frequencyBands.alpha),
                beta: average(processorData.frequencyBands.beta)
            },
            classificationResult: processorData.classificationResult,
            confidence: processorData.confidence
        };
    } else {
        // Traditional feature extraction (band powers only)
        features = {
            delta: average(processorData.frequencyBands.delta),
            theta: average(processorData.frequencyBands.theta),
            alpha: average(processorData.frequencyBands.alpha),
            beta: average(processorData.frequencyBands.beta),
            gamma: average(processorData.frequencyBands.gamma),
            classificationResult: processorData.classificationResult,
            confidence: processorData.confidence
        };
    }
    
    // Save features to processor data
    processorData.decoderFeatures = features;
    
    // Map classification to movement parameters
    updateMovementParameters();
    
    return features;
}

/**
 * Update movement parameters based on classification
 */
function updateMovementParameters() {
    const classification = processorData.classificationResult;
    const confidence = processorData.confidence;
    
    // Default movement (no movement)
    let movement = { x: 0, y: 0 };
    
    // If we have a mapping for this classification
    if (CONFIG.decoderBridge.classToMovementMap[classification]) {
        movement = CONFIG.decoderBridge.classToMovementMap[classification];
    }
    
    // Scale by confidence
    movement.x *= confidence;
    movement.y *= confidence;
    
    // Calculate simple velocity (magnitude of movement vector)
    const velocity = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
    
    // Update processor data
    processorData.movementParameters = {
        x: movement.x,
        y: movement.y,
        velocity: velocity
    };
}

/**
 * Send features to decoder
 */
function sendFeaturesToDecoder() {
    if (!CONFIG.decoderBridge.enabled) return;
    
    // Extract features
    const features = extractFeaturesForDecoder();
    if (!features) return;
    
    // Dispatch event with features
    document.dispatchEvent(new CustomEvent(PROCESSOR_EVENTS.FEATURES_EXTRACTED, {
        detail: {
            features: features,
            movementParameters: processorData.movementParameters,
            timestamp: Date.now()
        }
    }));
    
    console.log("Sent features to decoder:", features);
}

/**
 * Set up component integration
 */
function setupComponentIntegration() {
    console.log("Setting up neural processor integration with other components");
    
    // Listen for NeuroLLaMA ready and connection requests
    document.addEventListener('neuro-llama:ready', handleLLaMAReady);
    document.addEventListener('neuro-llama:connection-request', handleLLaMAConnectionRequest);
    document.addEventListener('neuro-llama:activation', handleLLaMAActivation);
    
    // Listen for decoder ready events
    document.addEventListener('decoder:ready', handleDecoderReady);
    
    // Broadcast that the processor is ready
    document.dispatchEvent(new CustomEvent('processor:ready', {
        detail: {
            features: ['classification', 'eeg_features', 'frequency_bands', 'attention'],
            classificationTypes: ['motor_imagery', 'mental_state', 'alertness'],
            version: '1.2.0'
        }
    }));
    
    console.log("Neural processor integration setup complete");
}

/**
 * Handle connection request from NeuroLLaMA
 */
function handleLLaMAConnectionRequest(event) {
    console.log("Received connection request from NeuroLLaMA", event.detail);
    
    // Get processor status
    const isActive = document.querySelector('.processor-status-indicator').classList.contains('active');
    
    // Respond with current status
    document.dispatchEvent(new CustomEvent('processor:connection-response', {
        detail: {
            status: isActive ? 'connected' : 'standby',
            features: ['classification', 'eeg_features', 'frequency_bands', 'attention'],
            timestamp: Date.now(),
            clientId: event.detail ? event.detail.clientId : null
        }
    }));
}

/**
 * Handle activation/deactivation requests from NeuroLLaMA
 */
function handleLLaMAActivation(event) {
    if (event.detail && typeof event.detail.active === 'boolean') {
        console.log(`NeuroLLaMA ${event.detail.active ? 'activated' : 'deactivated'} connection`);
        
        // Update UI if needed
        const connectionIndicator = document.querySelector('.processor-connection-status');
        if (connectionIndicator) {
            if (event.detail.active) {
                connectionIndicator.classList.add('connected');
                connectionIndicator.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Connected to NeuroLLaMA</span>
                `;
            } else {
                connectionIndicator.classList.remove('connected');
                connectionIndicator.innerHTML = `
                    <i class="fas fa-times-circle"></i>
                    <span>Disconnected from NeuroLLaMA</span>
                `;
            }
        }
        
        // Set a flag to start sending brain data to LLaMA
        processorData.connectedToLLaMA = event.detail.active;
    }
}

/**
 * Handle NeuroLLaMA ready event
 */
function handleLLaMAReady(event) {
    console.log("NeuroLLaMA component is ready", event.detail);
    
    // Store concept mapping for reference
    if (event.detail && event.detail.conceptMapping) {
        processorData.llamaConceptMapping = event.detail.conceptMapping;
    }
    
    // Update UI to show LLaMA is available
    const connectionIndicator = document.querySelector('.processor-connection-status');
    if (connectionIndicator) {
        connectionIndicator.innerHTML = `
            <i class="fas fa-plug"></i>
            <span>NeuroLLaMA Available</span>
        `;
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof Chart !== 'undefined') {
        initNeuralSignalProcessor();
    } else {
        console.error('Chart.js is required but not loaded!');
    }
});

// Add event listener for theme changes
document.addEventListener('themeChanged', function() {
    if (frequencyBandChart) frequencyBandChart.update();
    if (decodedOutputChart) decodedOutputChart.update();
    if (attentionHeatmapChart) attentionHeatmapChart.update();
});

/**
 * Process incoming EEG data
 */
function processEEGData(eegData) {
    // ... existing code ...
    
    // Extract features from EEG data
    const features = extractFeatures(eegData);
    
    // Update feature visualizations
    updateFeatureVisualizations(features);
    
    // Update the processor state
    neuralProcessor.features = features;
    
    // Broadcast features to other components
    processExtractedFeatures(features);
    
    // ... existing code ...
}

/**
 * Update classification based on current features
 */
function updateClassification() {
    // ... existing code ...
    
    // Apply the selected classification algorithm to the features
    const result = classifyFeatures(neuralProcessor.features);
    
    // Update the classification result display
    updateClassificationDisplay(result.className, result.confidence);
    
    // Broadcast classification result to other components
    broadcastClassificationResult(result.className, result.confidence);
    
    // ... existing code ...
}

/**
 * Process extracted features and broadcast to other components
 */
function processExtractedFeatures(features) {
    // Dispatch features-extracted event for other components to use
    document.dispatchEvent(new CustomEvent('processor:features-extracted', {
        detail: {
            features: features,
            timestamp: Date.now(),
            source: 'neural-processor'
        }
    }));
}

/**
 * Send classification result to other components
 */
function broadcastClassificationResult(className, confidence) {
    // Broadcast classification event for other components to use
    document.dispatchEvent(new CustomEvent('processor:classification-updated', {
        detail: {
            class: className,
            confidence: confidence,
            timestamp: Date.now()
        }
    }));
} 