/**
 * Integration with Neural Signal Processor
 */
const NEURAL_PROCESSOR_BRIDGE = {
    enabled: true,
    initialized: false,
    lastUpdateTimestamp: 0,
    processorData: null,
    useProcessorInput: false  // When true, use neural processor input instead of simulated data
};

/**
 * Initialize integration with the Neural Signal Processor
 */
function initNeuralProcessorIntegration() {
    if (!NEURAL_PROCESSOR_BRIDGE.enabled) return;
    
    console.log("Initializing Neural Signal Processor integration in Decoder Visualization...");
    
    // Listen for processor events
    document.addEventListener('processor:decoder-ready', handleProcessorReady);
    document.addEventListener('processor:features-extracted', handleProcessorFeatures);
    document.addEventListener('processor:classification-updated', handleProcessorClassification);
    
    // Set up processor integration controls
    setupProcessorIntegrationControls();
    
    // Dispatch ready event for the processor to pick up
    document.dispatchEvent(new CustomEvent('decoder:ready', {
        detail: {
            supportedFeatures: ['bandPowers', 'attentionWeights', 'classification'],
            trajectoryTypes: ['circular', 'figure8', 'reaching'],
            decoderTypes: ['TransformerX-Decoder', 'RNN-Decoder', 'Transformer-Hybrid']
        }
    }));
    
    NEURAL_PROCESSOR_BRIDGE.initialized = true;
}

/**
 * Setup processor integration controls
 */
function setupProcessorIntegrationControls() {
    // Create a toggle for using processor input
    const decoderControls = document.querySelector('.decoder-controls');
    if (!decoderControls) return;
    
    // Check if the control already exists
    if (document.getElementById('processor-input-toggle')) return;
    
    // Create the control group
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    controlGroup.innerHTML = `
        <label for="processor-input-toggle">Use Neural Processor:</label>
        <input type="checkbox" id="processor-input-toggle" ${NEURAL_PROCESSOR_BRIDGE.useProcessorInput ? 'checked' : ''}>
    `;
    
    // Add to decoder controls
    decoderControls.appendChild(controlGroup);
    
    // Add event listener for the toggle
    document.getElementById('processor-input-toggle').addEventListener('change', (e) => {
        NEURAL_PROCESSOR_BRIDGE.useProcessorInput = e.target.checked;
        console.log(`Decoder using neural processor input: ${NEURAL_PROCESSOR_BRIDGE.useProcessorInput ? 'enabled' : 'disabled'}`);
        
        // Update connection status accordingly
        updateProcessorConnectionStatus(e.target.checked);
        
        // Update visualization to reflect the change
        updateDecoderVisualization();
    });
}

/**
 * Handle processor ready event
 */
function handleProcessorReady(event) {
    console.log("Neural Signal Processor is ready:", event.detail);
    
    if (event.detail) {
        // Store processor capabilities/information if needed
        NEURAL_PROCESSOR_BRIDGE.processorConfig = event.detail;
        
        // Update connection status
        updateProcessorConnectionStatus(true);
    }
}

/**
 * Handle processor features event
 */
function handleProcessorFeatures(event) {
    // Store the processor data
    NEURAL_PROCESSOR_BRIDGE.processorData = event.detail;
    NEURAL_PROCESSOR_BRIDGE.lastUpdateTimestamp = Date.now();
    
    // If we're using processor input, update the decoder
    if (NEURAL_PROCESSOR_BRIDGE.useProcessorInput) {
        updateDecoderWithProcessorData(event.detail);
    }
}

/**
 * Handle processor classification event
 */
function handleProcessorClassification(event) {
    console.log("Classification updated:", event.detail);
    
    // You might want to do something specific when the classification changes
    // For example, highlight the active movement direction
    if (NEURAL_PROCESSOR_BRIDGE.useProcessorInput) {
        highlightMotorImageryClass(event.detail.class);
    }
}

/**
 * Update decoder with processor data
 */
function updateDecoderWithProcessorData(data) {
    if (!data || !data.movementParameters) return;
    
    // Extract movement parameters
    const { x, y, velocity } = data.movementParameters;
    
    // Update trajectory with these parameters
    updateDecoderTrajectory(x, y, velocity);
    
    // Update performance metrics based on processor confidence
    if (data.features && data.features.confidence) {
        updateDecoderMetricsWithConfidence(data.features.confidence);
    }
}

/**
 * Update decoder trajectory with movement parameters
 */
function updateDecoderTrajectory(x, y, velocity) {
    // This function would update the trajectory visualization
    // The actual implementation depends on how the trajectory is visualized
    
    // For example, if you're using a cursor position:
    if (typeof updateCursorPosition === 'function') {
        updateCursorPosition(x, y);
    }
    
    // If you're tracking velocity
    if (typeof updateVelocityProfile === 'function') {
        updateVelocityProfile(velocity);
    }
    
    // Here we're just logging the updates
    console.log(`Decoder trajectory updated: x=${x.toFixed(2)}, y=${y.toFixed(2)}, v=${velocity.toFixed(2)}`);
}

/**
 * Update decoder metrics based on confidence
 */
function updateDecoderMetricsWithConfidence(confidence) {
    // Scale some of the metrics based on confidence
    // This simulates how a real decoder's performance would vary with input quality
    
    // Update accuracy (85-95% range, scaled by confidence)
    const accuracy = 85 + (confidence * 10);
    document.getElementById('decoder-accuracy').textContent = `${accuracy.toFixed(1)}%`;
    
    // Update MSE (0.05-0.01 range, inversely scaled by confidence)
    const mse = 0.05 - (confidence * 0.04);
    document.getElementById('decoder-mse').textContent = mse.toFixed(3);
    
    // Update R² score (0.7-0.9 range, scaled by confidence)
    const r2 = 0.7 + (confidence * 0.2);
    document.getElementById('decoder-r2').textContent = r2.toFixed(2);
    
    // Update correlation (0.8-0.95 range, scaled by confidence)
    const correlation = 0.8 + (confidence * 0.15);
    document.getElementById('decoder-correlation').textContent = correlation.toFixed(2);
    
    // Update bit rate (scaled strongly by confidence)
    const bitRate = 80 + (confidence * confidence * 100);
    document.getElementById('decoder-bitrate').textContent = `${bitRate.toFixed(1)} bits/s`;
}

/**
 * Highlight motor imagery class in the UI
 */
function highlightMotorImageryClass(className) {
    // Find all motor imagery class elements
    const motorImageryClasses = document.querySelectorAll('.motor-imagery-class');
    
    // Remove active class from all
    motorImageryClasses.forEach(element => {
        element.classList.remove('active');
    });
    
    // Add active class to the matching element
    const activeElement = document.querySelector(`.motor-imagery-class[data-class="${className}"]`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
    
    console.log(`Highlighting motor imagery class: ${className}`);
}

/**
 * Update processor connection status
 */
function updateProcessorConnectionStatus(connected) {
    const indicator = document.getElementById('processor-connection-indicator');
    const text = document.getElementById('processor-connection-text');
    
    if (connected) {
        indicator.classList.add('active');
        text.textContent = 'Neural Processor: Connected';
    } else {
        indicator.classList.remove('active');
        text.textContent = 'Neural Processor: Not Connected';
    }
}

// Decoder Visualization - Displays neural-to-movement decoding results
let movementChart;
let trajectoryChart;
let velocityChart;
let currentDecoderData = {
    actual: [],
    predicted: [],
    timestamps: [],
    velocities: {
        actual: [],
        predicted: []
    },
    accuracy: 0.85,
    metrics: {
        mse: 0.025,
        r2: 0.78,
        correlation: 0.89,
        decodeTime: 5.2, // ms
        bitrate: 128.4   // bits/sec
    },
    trajectoryType: 'circular'
};

// Initialize the decoder visualization when DOM is ready
document.addEventListener('DOMContentLoaded', initDecoderVisualization);

// Handle theme changes
window.addEventListener('themeChange', (e) => {
    const isDark = e.detail.isDark;
    updateDecoderTheme(isDark);
});

// Public interface for the decoder visualization
window.decoderVisualization = {
    // Update the decoder data
    updateDecoderData: function(data) {
        if (data) {
            currentDecoderData = {...currentDecoderData, ...data};
            
            // If trajectory type changed, regenerate demo data
            if (data.trajectoryType && data.trajectoryType !== currentDecoderData.trajectoryType) {
                generateDemoDecoderData(data.trajectoryType);
            }
        }
        updateDecoderCharts();
        return currentDecoderData;
    },
    
    // Add a new decoded position to the trajectory
    addDecodedPosition: function(actual, predicted, timestamp, actualVelocity, predictedVelocity) {
        // Add new data point
        currentDecoderData.actual.push(actual);
        currentDecoderData.predicted.push(predicted);
        currentDecoderData.timestamps.push(timestamp);
        
        // Add velocity data if provided
        if (actualVelocity && predictedVelocity) {
            currentDecoderData.velocities.actual.push(actualVelocity);
            currentDecoderData.velocities.predicted.push(predictedVelocity);
        } else {
            // Calculate velocities from positions if not provided
            if (currentDecoderData.actual.length > 1) {
                const prevActual = currentDecoderData.actual[currentDecoderData.actual.length - 2];
                const prevPredicted = currentDecoderData.predicted[currentDecoderData.predicted.length - 2];
                const prevTime = currentDecoderData.timestamps[currentDecoderData.timestamps.length - 2];
                const deltaTime = (timestamp - prevTime) / 1000; // convert to seconds
                
                // Calculate velocity as distance / time
                const actualVel = [
                    (actual[0] - prevActual[0]) / deltaTime,
                    (actual[1] - prevActual[1]) / deltaTime
                ];
                const predictedVel = [
                    (predicted[0] - prevPredicted[0]) / deltaTime,
                    (predicted[1] - prevPredicted[1]) / deltaTime
                ];
                
                currentDecoderData.velocities.actual.push(actualVel);
                currentDecoderData.velocities.predicted.push(predictedVel);
            } else {
                currentDecoderData.velocities.actual.push([0, 0]);
                currentDecoderData.velocities.predicted.push([0, 0]);
            }
        }
        
        // Keep only the last 100 points
        if (currentDecoderData.actual.length > 100) {
            currentDecoderData.actual.shift();
            currentDecoderData.predicted.shift();
            currentDecoderData.timestamps.shift();
            currentDecoderData.velocities.actual.shift();
            currentDecoderData.velocities.predicted.shift();
        }
        
        updateDecoderCharts();
    },
    
    // Update decoder metrics
    updateMetrics: function(metrics) {
        currentDecoderData.metrics = {...currentDecoderData.metrics, ...metrics};
        updateDecoderMetricsDisplay();
    },
    
    // Change trajectory type
    setTrajectoryType: function(type) {
        currentDecoderData.trajectoryType = type;
        generateDemoDecoderData(type);
        updateDecoderCharts();
        return type;
    }
};

// Initialize the visualization
function initDecoderVisualization() {
    // Check if the decoder visualization container exists
    const trajectoryContainer = document.getElementById('trajectory-visualization');
    const movementContainer = document.getElementById('movement-over-time');
    const velocityContainer = document.getElementById('velocity-visualization');
    
    if (!trajectoryContainer || !movementContainer) return;
    
    // Initialize the trajectory chart
    initTrajectoryChart(trajectoryContainer);
    
    // Initialize the movement over time chart
    initMovementOverTimeChart(movementContainer);
    
    // Initialize velocity chart if container exists
    if (velocityContainer) {
        initVelocityChart(velocityContainer);
    }
    
    // Initialize trajectory type selector
    initTrajectoryTypeSelector();
    
    // Generate initial demo data
    generateDemoDecoderData(currentDecoderData.trajectoryType);
    
    // Initialize metrics display
    updateDecoderMetricsDisplay();
    
    // Start data updates for demo
    startDemoUpdates();
    
    // Add this line at the end:
    initNeuralProcessorIntegration();
}

// Initialize trajectory type selector
function initTrajectoryTypeSelector() {
    const selector = document.getElementById('trajectory-type-selector');
    if (selector) {
        selector.addEventListener('change', function() {
            window.decoderVisualization.setTrajectoryType(this.value);
        });
    }
}

// Initialize trajectory visualization (2D movement plot)
function initTrajectoryChart(container) {
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    if (!container.querySelector('canvas')) {
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    trajectoryChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Actual Movement',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',  // Blue
                    borderColor: 'rgba(59, 130, 246, 1)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'Predicted Movement',
                    data: [],
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',  // Red
                    borderColor: 'rgba(239, 68, 68, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Target',
                    data: [], // Will be populated for reaching tasks
                    backgroundColor: 'rgba(16, 185, 129, 0.9)',  // Green
                    borderColor: 'rgba(16, 185, 129, 1)',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -1.2,
                    max: 1.2,
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    },
                    title: {
                        display: true,
                        text: 'X Position',
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                },
                y: {
                    min: -1.2,
                    max: 1.2,
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    },
                    title: {
                        display: true,
                        text: 'Y Position',
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize movement over time chart
function initMovementOverTimeChart(container) {
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    if (!container.querySelector('canvas')) {
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    movementChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual X',
                    data: [],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Predicted X',
                    data: [],
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Actual Y',
                    data: [],
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Predicted Y',
                    data: [],
                    borderColor: 'rgba(245, 158, 11, 1)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (ms)',
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Position',
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    min: -1.2,
                    max: 1.2,
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                }
            }
        }
    });
}

// Initialize velocity chart
function initVelocityChart(container) {
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    if (!container.querySelector('canvas')) {
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    velocityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual Velocity',
                    data: [],
                    borderColor: 'rgba(99, 102, 241, 1)', // Indigo
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Predicted Velocity',
                    data: [],
                    borderColor: 'rgba(236, 72, 153, 1)', // Pink
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (ms)',
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Velocity (units/s)',
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                }
            }
        }
    });
}

// Update the decoder theme based on the current theme
function updateDecoderTheme(isDark) {
    // Update trajectory chart
    if (trajectoryChart) {
        trajectoryChart.options.scales.x.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        trajectoryChart.options.scales.y.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        trajectoryChart.options.scales.x.title.color = isDark ? '#e2e8f0' : '#334155';
        trajectoryChart.options.scales.y.title.color = isDark ? '#e2e8f0' : '#334155';
        trajectoryChart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#334155';
        trajectoryChart.update();
    }
    
    // Update movement chart
    if (movementChart) {
        movementChart.options.scales.x.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        movementChart.options.scales.y.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        movementChart.options.scales.x.title.color = isDark ? '#e2e8f0' : '#334155';
        movementChart.options.scales.y.title.color = isDark ? '#e2e8f0' : '#334155';
        movementChart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#334155';
        movementChart.update();
    }
    
    // Update velocity chart
    if (velocityChart) {
        velocityChart.options.scales.x.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        velocityChart.options.scales.y.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        velocityChart.options.scales.x.title.color = isDark ? '#e2e8f0' : '#334155';
        velocityChart.options.scales.y.title.color = isDark ? '#e2e8f0' : '#334155';
        velocityChart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#334155';
        velocityChart.update();
    }
}

// Update decoder charts with current data
function updateDecoderCharts() {
    if (!trajectoryChart || !movementChart) return;
    
    // Update trajectory chart
    trajectoryChart.data.datasets[0].data = currentDecoderData.actual.map(point => ({ x: point[0], y: point[1] }));
    trajectoryChart.data.datasets[1].data = currentDecoderData.predicted.map(point => ({ x: point[0], y: point[1] }));
    
    // Handle target display for reaching tasks
    if (currentDecoderData.trajectoryType === 'reaching' && currentDecoderData.targets) {
        trajectoryChart.data.datasets[2].data = currentDecoderData.targets.map(point => ({ x: point[0], y: point[1] }));
    } else {
        trajectoryChart.data.datasets[2].data = [];
    }
    
    trajectoryChart.update();
    
    // Update movement over time chart
    movementChart.data.labels = currentDecoderData.timestamps;
    
    // X coordinates
    movementChart.data.datasets[0].data = currentDecoderData.actual.map(point => point[0]);
    movementChart.data.datasets[1].data = currentDecoderData.predicted.map(point => point[0]);
    
    // Y coordinates
    movementChart.data.datasets[2].data = currentDecoderData.actual.map(point => point[1]);
    movementChart.data.datasets[3].data = currentDecoderData.predicted.map(point => point[1]);
    
    movementChart.update();
    
    // Update velocity chart if it exists
    if (velocityChart && currentDecoderData.velocities) {
        velocityChart.data.labels = currentDecoderData.timestamps;
        
        // Calculate velocity magnitudes
        const actualVelMagnitudes = currentDecoderData.velocities.actual.map(vel => 
            Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1])
        );
        const predictedVelMagnitudes = currentDecoderData.velocities.predicted.map(vel => 
            Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1])
        );
        
        velocityChart.data.datasets[0].data = actualVelMagnitudes;
        velocityChart.data.datasets[1].data = predictedVelMagnitudes;
        
        velocityChart.update();
    }
}

// Update metrics display
function updateDecoderMetricsDisplay() {
    const accuracyEl = document.getElementById('decoder-accuracy');
    const mseEl = document.getElementById('decoder-mse');
    const r2El = document.getElementById('decoder-r2');
    const correlationEl = document.getElementById('decoder-correlation');
    const decodeTimeEl = document.getElementById('decoder-decode-time');
    const bitrateEl = document.getElementById('decoder-bitrate');
    
    if (accuracyEl) accuracyEl.textContent = `${(currentDecoderData.accuracy * 100).toFixed(1)}%`;
    if (mseEl) mseEl.textContent = currentDecoderData.metrics.mse.toFixed(3);
    if (r2El) r2El.textContent = currentDecoderData.metrics.r2.toFixed(2);
    if (correlationEl) correlationEl.textContent = currentDecoderData.metrics.correlation.toFixed(2);
    if (decodeTimeEl) decodeTimeEl.textContent = `${currentDecoderData.metrics.decodeTime.toFixed(1)} ms`;
    if (bitrateEl) bitrateEl.textContent = `${currentDecoderData.metrics.bitrate.toFixed(1)} bits/s`;
}

// Generate demo decoder data
function generateDemoDecoderData(trajectoryType = 'circular') {
    currentDecoderData.actual = [];
    currentDecoderData.predicted = [];
    currentDecoderData.timestamps = [];
    currentDecoderData.velocities = {
        actual: [],
        predicted: []
    };
    currentDecoderData.trajectoryType = trajectoryType;
    
    const steps = 50;
    const radius = 0.8;
    
    switch (trajectoryType) {
        case 'circular':
            // Generate a circular trajectory with some noise
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                const time = i * 20; // milliseconds
                
                // Actual position (perfect circle)
                const actualX = radius * Math.cos(angle);
                const actualY = radius * Math.sin(angle);
                
                // Predicted position (with noise)
                const noise = 0.1;
                const predictedX = actualX + (Math.random() - 0.5) * noise;
                const predictedY = actualY + (Math.random() - 0.5) * noise;
                
                // Velocities
                const actualVelX = -radius * Math.sin(angle) * 0.1; // scaled for visualization
                const actualVelY = radius * Math.cos(angle) * 0.1;
                const predictedVelX = actualVelX + (Math.random() - 0.5) * noise * 0.1;
                const predictedVelY = actualVelY + (Math.random() - 0.5) * noise * 0.1;
                
                currentDecoderData.actual.push([actualX, actualY]);
                currentDecoderData.predicted.push([predictedX, predictedY]);
                currentDecoderData.timestamps.push(time);
                currentDecoderData.velocities.actual.push([actualVelX, actualVelY]);
                currentDecoderData.velocities.predicted.push([predictedVelX, predictedVelY]);
            }
            break;
            
        case 'figure8':
            // Generate a figure-8 trajectory
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                const time = i * 20; // milliseconds
                
                // Figure-8 parametric equations
                const actualX = radius * Math.sin(angle);
                const actualY = radius * Math.sin(angle) * Math.cos(angle);
                
                // Predicted position (with noise)
                const noise = 0.1;
                const predictedX = actualX + (Math.random() - 0.5) * noise;
                const predictedY = actualY + (Math.random() - 0.5) * noise;
                
                // Velocities (derivatives of parametric equations)
                const actualVelX = radius * Math.cos(angle) * 0.1;
                const actualVelY = radius * (Math.cos(angle) * Math.cos(angle) - Math.sin(angle) * Math.sin(angle)) * 0.1;
                const predictedVelX = actualVelX + (Math.random() - 0.5) * noise * 0.1;
                const predictedVelY = actualVelY + (Math.random() - 0.5) * noise * 0.1;
                
                currentDecoderData.actual.push([actualX, actualY]);
                currentDecoderData.predicted.push([predictedX, predictedY]);
                currentDecoderData.timestamps.push(time);
                currentDecoderData.velocities.actual.push([actualVelX, actualVelY]);
                currentDecoderData.velocities.predicted.push([predictedVelX, predictedVelY]);
            }
            break;
            
        case 'reaching':
            // Generate a center-out reaching task with targets
            const targets = [
                [0.8, 0],    // Right
                [0.56, 0.56], // Top-right
                [0, 0.8],    // Top
                [-0.56, 0.56], // Top-left
                [-0.8, 0],   // Left
                [-0.56, -0.56], // Bottom-left
                [0, -0.8],   // Bottom
                [0.56, -0.56]  // Bottom-right
            ];
            
            currentDecoderData.targets = targets;
            
            // For each target, generate a reaching movement from center
            for (let t = 0; t < targets.length; t++) {
                const targetX = targets[t][0];
                const targetY = targets[t][1];
                const reachSteps = Math.floor(steps / targets.length);
                
                for (let i = 0; i < reachSteps; i++) {
                    // Smooth reaching movement with sigmoidal profile
                    const progress = i / (reachSteps - 1);
                    const smoothProgress = 1 / (1 + Math.exp(-12 * (progress - 0.5)));
                    const time = t * reachSteps * 20 + i * 20;
                    
                    // Actual position (smooth reaching)
                    const actualX = targetX * smoothProgress;
                    const actualY = targetY * smoothProgress;
                    
                    // Predicted position (with noise)
                    const noise = 0.1 * (1 - smoothProgress); // More noise at the beginning
                    const predictedX = actualX + (Math.random() - 0.5) * noise;
                    const predictedY = actualY + (Math.random() - 0.5) * noise;
                    
                    // Velocities (derivative of sigmoidal function)
                    const actualVelFactor = 12 * smoothProgress * (1 - smoothProgress);
                    const actualVelX = targetX * actualVelFactor * 0.05;
                    const actualVelY = targetY * actualVelFactor * 0.05;
                    const predictedVelX = actualVelX + (Math.random() - 0.5) * noise * 0.05;
                    const predictedVelY = actualVelY + (Math.random() - 0.5) * noise * 0.05;
                    
                    currentDecoderData.actual.push([actualX, actualY]);
                    currentDecoderData.predicted.push([predictedX, predictedY]);
                    currentDecoderData.timestamps.push(time);
                    currentDecoderData.velocities.actual.push([actualVelX, actualVelY]);
                    currentDecoderData.velocities.predicted.push([predictedVelX, predictedVelY]);
                }
            }
            break;
            
        default:
            // Default to circular if unknown type
            generateDemoDecoderData('circular');
    }
}

// Simulate real-time decoding with data updates
function startDemoUpdates() {
    // Start point
    let angle = 0;
    let time = currentDecoderData.timestamps.length > 0 ? 
        currentDecoderData.timestamps[currentDecoderData.timestamps.length - 1] : 0;
    
    // Reaching task variables
    let currentTargetIndex = 0;
    let reachProgress = 0;
    
    setInterval(() => {
        // Different update logic based on trajectory type
        switch (currentDecoderData.trajectoryType) {
            case 'circular':
                // Update the angle for circular movement
                angle += 0.1;
                time += 20;
                
                // Calculate new position (circle trajectory)
                const radius = 0.8;
                const actualX = radius * Math.cos(angle);
                const actualY = radius * Math.sin(angle);
                
                // Velocities
                const actualVelX = -radius * Math.sin(angle) * 0.1;
                const actualVelY = radius * Math.cos(angle) * 0.1;
                
                // Add some noise to predicted position
                const noise = 0.1;
                const predictedX = actualX + (Math.random() - 0.5) * noise;
                const predictedY = actualY + (Math.random() - 0.5) * noise;
                const predictedVelX = actualVelX + (Math.random() - 0.5) * noise * 0.1;
                const predictedVelY = actualVelY + (Math.random() - 0.5) * noise * 0.1;
                
                // Add new point to the decoder visualization
                window.decoderVisualization.addDecodedPosition(
                    [actualX, actualY],
                    [predictedX, predictedY],
                    time,
                    [actualVelX, actualVelY],
                    [predictedVelX, predictedVelY]
                );
                break;
                
            case 'figure8':
                // Update the angle for figure-8 movement
                angle += 0.1;
                time += 20;
                
                // Figure-8 parametric equations
                const radius8 = 0.8;
                const actualX8 = radius8 * Math.sin(angle);
                const actualY8 = radius8 * Math.sin(angle) * Math.cos(angle);
                
                // Velocities (derivatives of parametric equations)
                const actualVelX8 = radius8 * Math.cos(angle) * 0.1;
                const actualVelY8 = radius8 * (Math.cos(angle) * Math.cos(angle) - Math.sin(angle) * Math.sin(angle)) * 0.1;
                
                // Add some noise to predicted position
                const noise8 = 0.1;
                const predictedX8 = actualX8 + (Math.random() - 0.5) * noise8;
                const predictedY8 = actualY8 + (Math.random() - 0.5) * noise8;
                const predictedVelX8 = actualVelX8 + (Math.random() - 0.5) * noise8 * 0.1;
                const predictedVelY8 = actualVelY8 + (Math.random() - 0.5) * noise8 * 0.1;
                
                // Add new point to the decoder visualization
                window.decoderVisualization.addDecodedPosition(
                    [actualX8, actualY8],
                    [predictedX8, predictedY8],
                    time,
                    [actualVelX8, actualVelY8],
                    [predictedVelX8, predictedVelY8]
                );
                break;
                
            case 'reaching':
                // Update the reaching progress
                time += 20;
                reachProgress += 0.05;
                
                // If we completed reaching to the current target
                if (reachProgress >= 1) {
                    currentTargetIndex = (currentTargetIndex + 1) % currentDecoderData.targets.length;
                    reachProgress = 0;
                }
                
                // Get current target
                const targetX = currentDecoderData.targets[currentTargetIndex][0];
                const targetY = currentDecoderData.targets[currentTargetIndex][1];
                
                // Smooth reaching movement with sigmoidal profile
                const smoothProgress = 1 / (1 + Math.exp(-12 * (reachProgress - 0.5)));
                
                // Actual position (smooth reaching)
                const actualXr = targetX * smoothProgress;
                const actualYr = targetY * smoothProgress;
                
                // Velocities (derivative of sigmoidal function)
                const actualVelFactor = 12 * smoothProgress * (1 - smoothProgress);
                const actualVelXr = targetX * actualVelFactor * 0.05;
                const actualVelYr = targetY * actualVelFactor * 0.05;
                
                // Predicted position (with noise)
                const noiseR = 0.1 * (1 - smoothProgress); // More noise at the beginning
                const predictedXr = actualXr + (Math.random() - 0.5) * noiseR;
                const predictedYr = actualYr + (Math.random() - 0.5) * noiseR;
                const predictedVelXr = actualVelXr + (Math.random() - 0.5) * noiseR * 0.05;
                const predictedVelYr = actualVelYr + (Math.random() - 0.5) * noiseR * 0.05;
                
                // Add new point to the decoder visualization
                window.decoderVisualization.addDecodedPosition(
                    [actualXr, actualYr],
                    [predictedXr, predictedYr],
                    time,
                    [actualVelXr, actualVelYr],
                    [predictedVelXr, predictedVelYr]
                );
                break;
        }
        
        // Occasionally update metrics
        if (Math.random() < 0.2) {
            // Add some variation based on trajectory type
            let metrics = {};
            
            switch (currentDecoderData.trajectoryType) {
                case 'circular':
                    metrics = {
                        mse: 0.02 + Math.random() * 0.02,
                        r2: 0.75 + Math.random() * 0.1,
                        correlation: 0.85 + Math.random() * 0.1,
                        decodeTime: 5.0 + Math.random() * 1.0,
                        bitrate: 125 + Math.random() * 10
                    };
                    break;
                case 'figure8':
                    metrics = {
                        mse: 0.03 + Math.random() * 0.03,
                        r2: 0.65 + Math.random() * 0.15,
                        correlation: 0.80 + Math.random() * 0.15,
                        decodeTime: 6.0 + Math.random() * 1.5,
                        bitrate: 110 + Math.random() * 15
                    };
                    break;
                case 'reaching':
                    metrics = {
                        mse: 0.01 + Math.random() * 0.02,
                        r2: 0.80 + Math.random() * 0.1,
                        correlation: 0.88 + Math.random() * 0.08,
                        decodeTime: 4.0 + Math.random() * 1.0,
                        bitrate: 135 + Math.random() * 12
                    };
                    break;
            }
            
            window.decoderVisualization.updateMetrics(metrics);
        }
    }, 500); // Update every 500ms
} 