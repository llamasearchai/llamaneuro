// Metrics Visualization using Chart.js
let charts = {};
let metricsData = {
    training: {
        loss: [],
        accuracy: [],
        learningRate: [],
        epochs: []
    },
    validation: {
        loss: [],
        accuracy: [],
        precision: [],
        recall: [],
        f1Score: []
    },
    attention: {
        entropyValues: [],
        headImportance: []
    },
    performance: {
        inferenceTime: [],
        memoryUsage: [],
        throughput: []
    }
};

// Current view state
let currentMetricView = 'loss';
let currentModel = 'model1';
let currentAttentionHead = 'head1';

// Configuration
const CONFIG = {
    colors: {
        primary: '#6366f1',     // indigo
        secondary: '#8b5cf6',   // purple
        tertiary: '#ec4899',    // pink
        success: '#22c55e',     // green
        danger: '#ef4444',      // red
        warning: '#f97316',     // orange
        info: '#3b82f6',        // blue
        light: '#e2e8f0',       // slate-200
        dark: '#334155'         // slate-700
    },
    chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                bodySpacing: 4,
                padding: 12,
                boxWidth: 10,
                usePointStyle: true,
                boxPadding: 3,
                cornerRadius: 8
            }
        }
    }
};

// Public interface for metrics visualization
window.metricsVisualization = {
    // Update the attention visualization with the selected head
    updateAttentionVisualization: function(headId) {
        currentAttentionHead = headId;
        
        // Generate new attention data for the selected head
        const attentionData = generateAttentionData(headId);
        
        // Update the attention heatmap
        if (document.getElementById('attention-visualization')) {
            drawAttentionHeatmap(
                document.getElementById('attention-visualization'),
                attentionData
            );
        }
        
        return headId;
    },
    
    // Update charts with data for the selected model
    updateModelData: function(modelId) {
        currentModel = modelId;
        
        // Generate new data for the selected model
        generateRandomData(modelId);
        
        // Update all charts with the new data
        updateAllCharts();
        
        return modelId;
    },
    
    // Update the metric view (loss, accuracy, f1)
    updateMetricView: function(metric) {
        currentMetricView = metric;
        
        // Update the performance chart to show the selected metric
        if (charts.performanceChart) {
            // Update chart data based on selected metric
            if (metric === 'loss') {
                charts.performanceChart.data.datasets[0].data = metricsData.training.loss;
                charts.performanceChart.data.datasets[0].label = 'Training Loss';
                charts.performanceChart.data.datasets[1].data = metricsData.validation.loss;
                charts.performanceChart.data.datasets[1].label = 'Validation Loss';
            } else if (metric === 'accuracy') {
                charts.performanceChart.data.datasets[0].data = metricsData.training.accuracy || [];
                charts.performanceChart.data.datasets[0].label = 'Training Accuracy';
                charts.performanceChart.data.datasets[1].data = metricsData.validation.accuracy;
                charts.performanceChart.data.datasets[1].label = 'Validation Accuracy';
            } else if (metric === 'f1') {
                charts.performanceChart.data.datasets[0].data = [];
                charts.performanceChart.data.datasets[0].label = '';
                charts.performanceChart.data.datasets[1].data = metricsData.validation.f1Score;
                charts.performanceChart.data.datasets[1].label = 'F1 Score';
            }
            
            charts.performanceChart.update();
        }
        
        return metric;
    }
};

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', initCharts);

// Respond to theme changes
window.addEventListener('themeChange', (e) => {
    updateChartsTheme(e.detail.isDark);
});

// Initialize all charts
function initCharts() {
    // Training Progress Charts
    initTrainingProgressChart();
    
    // Validation Metrics Charts
    initValidationMetricsChart();
    
    // Attention Visualization
    initAttentionVisualizationChart();
    
    // Performance Metrics
    initPerformanceChart();
    
    // Generate random initial data
    generateRandomData();
    
    // Update all charts with initial data
    updateAllCharts();
}

// Update charts theme based on dark/light mode
function updateChartsTheme(isDark) {
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#e2e8f0' : '#334155';
    
    // Update global Chart.js options
    Chart.defaults.color = textColor;
    Chart.defaults.scale.grid.color = gridColor;
    
    // Update each chart
    Object.values(charts).forEach(chart => {
        // Update grid and text colors
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                scale.grid.color = gridColor;
                scale.ticks.color = textColor;
            });
        }
        
        // Update tooltip styles
        if (chart.options.plugins && chart.options.plugins.tooltip) {
            chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            chart.options.plugins.tooltip.titleColor = isDark ? '#e2e8f0' : '#334155';
            chart.options.plugins.tooltip.bodyColor = isDark ? '#e2e8f0' : '#334155';
            chart.options.plugins.tooltip.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        }
        
        // Update legend styles
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        
        chart.update();
    });
}

// Initialize Training Progress Chart (Line Chart)
function initTrainingProgressChart() {
    const ctx = document.getElementById('training-progress-chart');
    if (!ctx) return;
    
    charts.trainingProgress = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Training Loss',
                    data: [],
                    borderColor: CONFIG.colors.danger,
                    backgroundColor: hexToRgba(CONFIG.colors.danger, 0.1),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Validation Loss',
                    data: [],
                    borderColor: CONFIG.colors.warning,
                    backgroundColor: hexToRgba(CONFIG.colors.warning, 0.1),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Accuracy',
                    data: [],
                    borderColor: CONFIG.colors.success,
                    backgroundColor: hexToRgba(CONFIG.colors.success, 0.1),
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...CONFIG.chartOptions,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Epochs'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Loss'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(3);
                        }
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Accuracy'
                    },
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(1) + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Initialize Validation Metrics Chart (Radar Chart)
function initValidationMetricsChart() {
    const ctx = document.getElementById('validation-metrics-chart');
    if (!ctx) return;
    
    charts.validationMetrics = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC'],
            datasets: [
                {
                    label: 'Current Model',
                    data: [0, 0, 0, 0, 0],
                    borderColor: CONFIG.colors.primary,
                    backgroundColor: hexToRgba(CONFIG.colors.primary, 0.2),
                    borderWidth: 2,
                    pointBackgroundColor: CONFIG.colors.primary
                },
                {
                    label: 'Baseline Model',
                    data: [0, 0, 0, 0, 0],
                    borderColor: CONFIG.colors.secondary,
                    backgroundColor: hexToRgba(CONFIG.colors.secondary, 0.2),
                    borderWidth: 2,
                    pointBackgroundColor: CONFIG.colors.secondary
                }
            ]
        },
        options: {
            ...CONFIG.chartOptions,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 1,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        },
                        backdropColor: 'transparent'
                    }
                }
            }
        }
    });
}

// Initialize Attention Visualization Chart (Heatmap)
function initAttentionVisualizationChart() {
    const ctx = document.getElementById('attention-heatmap-chart');
    if (!ctx) return;
    
    // Create a placeholder for the attention heatmap
    // We'll use a custom rendering approach for this
    const attentionData = Array(8).fill().map(() => Array(8).fill(0));
    
    charts.attentionHeatmap = {
        canvas: ctx,
        data: attentionData,
        update: function() {
            drawAttentionHeatmap(this.canvas, this.data);
        }
    };
}

// Draw the attention heatmap
function drawAttentionHeatmap(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    const rows = data.length;
    const cols = data[0].length;
    
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    // Draw the heatmap cells
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const value = data[i][j];
            
            // Color gradient from blue to red
            const r = Math.floor(255 * value);
            const g = 50;
            const b = Math.floor(255 * (1 - value));
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            
            // Draw cell border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            
            // Draw cell value
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(2), j * cellWidth + cellWidth / 2, i * cellHeight + cellHeight / 2);
        }
    }
    
    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Draw title
    ctx.font = '14px Arial';
    ctx.fillText('Attention Weights Heatmap', width / 2, height + 25);
}

// Initialize Performance Chart (Mixed Chart - Bar and Line)
function initPerformanceChart() {
    const ctx = document.getElementById('performance-metrics-chart');
    if (!ctx) return;
    
    charts.performanceMetrics = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Inference Time (ms)',
                    data: [],
                    backgroundColor: hexToRgba(CONFIG.colors.primary, 0.7),
                    borderColor: CONFIG.colors.primary,
                    borderWidth: 1
                },
                {
                    label: 'Memory Usage (GB)',
                    data: [],
                    backgroundColor: hexToRgba(CONFIG.colors.info, 0.7),
                    borderColor: CONFIG.colors.info,
                    borderWidth: 1,
                    yAxisID: 'y1' 
                },
                {
                    label: 'Throughput (samples/sec)',
                    data: [],
                    type: 'line',
                    backgroundColor: 'transparent',
                    borderColor: CONFIG.colors.success,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: CONFIG.colors.success,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            ...CONFIG.chartOptions,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Batch Size'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Inference Time (ms)'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Memory Usage (GB)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                y2: {
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Throughput (samples/sec)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Update all charts with current data
function updateAllCharts() {
    // Update training progress chart
    if (charts.trainingProgress) {
        charts.trainingProgress.data.labels = metricsData.training.epochs;
        charts.trainingProgress.data.datasets[0].data = metricsData.training.loss;
        charts.trainingProgress.data.datasets[1].data = metricsData.validation.loss;
        charts.trainingProgress.data.datasets[2].data = metricsData.validation.accuracy;
        charts.trainingProgress.update();
    }
    
    // Update validation metrics chart (radar)
    if (charts.validationMetrics) {
        const currentMetrics = [
            metricsData.validation.accuracy[metricsData.validation.accuracy.length - 1] || 0,
            metricsData.validation.precision[metricsData.validation.precision.length - 1] || 0,
            metricsData.validation.recall[metricsData.validation.recall.length - 1] || 0,
            metricsData.validation.f1Score[metricsData.validation.f1Score.length - 1] || 0,
            Math.random() * 0.2 + 0.8 // Random AUC value for demonstration
        ];
        
        // Baseline metrics (slightly worse than current for demonstration)
        const baselineMetrics = currentMetrics.map(val => Math.max(0, val - (Math.random() * 0.15)));
        
        charts.validationMetrics.data.datasets[0].data = currentMetrics;
        charts.validationMetrics.data.datasets[1].data = baselineMetrics;
        charts.validationMetrics.update();
    }
    
    // Update attention heatmap
    if (charts.attentionHeatmap) {
        // Generate random attention weights for demonstration
        const attentionData = Array(8).fill().map(() => 
            Array(8).fill().map(() => Math.random())
        );
        
        // Normalize the weights to make them sum to 1 in each row
        for (let i = 0; i < attentionData.length; i++) {
            const row = attentionData[i];
            const sum = row.reduce((a, b) => a + b, 0);
            attentionData[i] = row.map(val => val / sum);
        }
        
        charts.attentionHeatmap.data = attentionData;
        charts.attentionHeatmap.update();
    }
    
    // Update performance metrics chart
    if (charts.performanceMetrics) {
        const batchSizes = [1, 2, 4, 8, 16, 32, 64, 128];
        
        charts.performanceMetrics.data.labels = batchSizes;
        charts.performanceMetrics.data.datasets[0].data = metricsData.performance.inferenceTime;
        charts.performanceMetrics.data.datasets[1].data = metricsData.performance.memoryUsage;
        charts.performanceMetrics.data.datasets[2].data = metricsData.performance.throughput;
        charts.performanceMetrics.update();
    }
}

// Generate random data for charts
function generateRandomData(modelId = 'model1') {
    // Clear existing data
    metricsData.training.epochs = [];
    metricsData.training.loss = [];
    metricsData.training.accuracy = [];
    metricsData.validation.loss = [];
    metricsData.validation.accuracy = [];
    metricsData.validation.precision = [];
    metricsData.validation.recall = [];
    metricsData.validation.f1Score = [];
    metricsData.performance.inferenceTime = [];
    metricsData.performance.memoryUsage = [];
    metricsData.performance.throughput = [];
    
    // Model-specific parameters
    let startLoss, convergenceRate, noiseLevel, baseAccuracy, inferenceTimeBase, memoryUsageBase;
    
    switch(modelId) {
        case 'model1': // TransformerX-Large
            startLoss = 4.5;
            convergenceRate = 0.85;
            noiseLevel = 0.05;
            baseAccuracy = 0.65;
            inferenceTimeBase = 80;
            memoryUsageBase = 15;
            break;
        case 'model2': // TransformerX-Base
            startLoss = 3.8;
            convergenceRate = 0.88;
            noiseLevel = 0.03;
            baseAccuracy = 0.72;
            inferenceTimeBase = 45;
            memoryUsageBase = 8;
            break;
        case 'model3': // MultiModal-Fusion
            startLoss = 5.2;
            convergenceRate = 0.82;
            noiseLevel = 0.07;
            baseAccuracy = 0.58;
            inferenceTimeBase = 95;
            memoryUsageBase = 22;
            break;
        default:
            startLoss = 4.0;
            convergenceRate = 0.85;
            noiseLevel = 0.05;
            baseAccuracy = 0.7;
            inferenceTimeBase = 60;
            memoryUsageBase = 12;
    }
    
    // Generate epochs (1 to 30)
    for (let i = 1; i <= 30; i++) {
        metricsData.training.epochs.push(i);
        
        // Training loss (decreasing exponentially with noise)
        const baseLoss = startLoss * Math.pow(convergenceRate, i - 1);
        const noise = (Math.random() * 2 - 1) * noiseLevel * baseLoss;
        const trainingLoss = Math.max(0.1, baseLoss + noise);
        metricsData.training.loss.push(trainingLoss);
        
        // Validation loss (slightly higher than training loss)
        const validationLoss = trainingLoss * (1 + 0.1 * Math.random());
        metricsData.validation.loss.push(validationLoss);
        
        // Accuracy (increasing with diminishing returns)
        const accuracyProgress = 1 - Math.pow(0.95, i);
        const maxAccuracy = baseAccuracy + (1 - baseAccuracy) * 0.9; // Max accuracy is 90-95% depending on model
        const accuracy = baseAccuracy + (maxAccuracy - baseAccuracy) * accuracyProgress;
        const accuracyNoise = (Math.random() * 2 - 1) * 0.02 * (1 - accuracyProgress);
        metricsData.validation.accuracy.push(Math.min(0.99, Math.max(baseAccuracy, accuracy + accuracyNoise)));
        
        // Precision (similar to accuracy but with different noise)
        const precision = baseAccuracy + (maxAccuracy - baseAccuracy) * accuracyProgress;
        const precisionNoise = (Math.random() * 2 - 1) * 0.03 * (1 - accuracyProgress);
        metricsData.validation.precision.push(Math.min(0.99, Math.max(baseAccuracy, precision + precisionNoise)));
        
        // Recall (typically lower than precision for most models)
        const recall = baseAccuracy + (maxAccuracy - baseAccuracy) * accuracyProgress * 0.95;
        const recallNoise = (Math.random() * 2 - 1) * 0.04 * (1 - accuracyProgress);
        metricsData.validation.recall.push(Math.min(0.99, Math.max(baseAccuracy - 0.05, recall + recallNoise)));
        
        // F1 Score (harmonic mean of precision and recall)
        const precision_i = metricsData.validation.precision[metricsData.validation.precision.length - 1];
        const recall_i = metricsData.validation.recall[metricsData.validation.recall.length - 1];
        const f1 = 2 * (precision_i * recall_i) / (precision_i + recall_i);
        metricsData.validation.f1Score.push(f1);
        
        // Performance metrics
        // Inference time (ms) - decreases slightly with training
        const inferenceTime = inferenceTimeBase * (1 - 0.2 * accuracyProgress) * (0.9 + Math.random() * 0.2);
        metricsData.performance.inferenceTime.push(inferenceTime);
        
        // Memory usage (GB)
        const memoryUsage = memoryUsageBase * (0.95 + Math.random() * 0.1);
        metricsData.performance.memoryUsage.push(memoryUsage);
        
        // Throughput (samples/sec) - increases with training
        const throughput = 1000 / inferenceTime * (1 + 0.1 * accuracyProgress) * (0.9 + Math.random() * 0.2);
        metricsData.performance.throughput.push(throughput);
    }
    
    // Generate attention data
    metricsData.attention.entropyValues = Array(10).fill().map(() => Math.random() * 0.5 + 0.5);
    metricsData.attention.headImportance = Array(10).fill().map(() => Math.random());
    
    // Normalize head importance to sum to 1
    const sum = metricsData.attention.headImportance.reduce((a, b) => a + b, 0);
    metricsData.attention.headImportance = metricsData.attention.headImportance.map(v => v / sum);
}

// Utility to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate random attention data for visualization
function generateAttentionData(headId) {
    const size = 10; // 10x10 attention matrix
    const data = [];
    
    // Generate different patterns based on the head
    if (headId === 'head1') {
        // Diagonal attention pattern (focused on corresponding tokens)
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                if (i === j) {
                    row.push(0.8 + Math.random() * 0.2); // High attention on diagonal
                } else {
                    const distance = Math.abs(i - j);
                    row.push(Math.max(0, 0.5 - (distance * 0.1)) * Math.random()); // Lower attention based on distance
                }
            }
            data.push(row);
        }
    } else if (headId === 'head2') {
        // Global attention pattern (attends to all tokens somewhat evenly)
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(0.3 + Math.random() * 0.4); // Medium attention everywhere
            }
            data.push(row);
        }
    } else if (headId === 'head3') {
        // Local window attention (focused on nearby tokens)
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                const distance = Math.abs(i - j);
                if (distance <= 2) {
                    row.push(0.6 + Math.random() * 0.4); // High attention for nearby tokens
                } else {
                    row.push(Math.random() * 0.2); // Low attention for distant tokens
                }
            }
            data.push(row);
        }
    } else {
        // Head 4: Special token attention (first token attends to all, all attend to last)
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                if (i === 0 || j === size - 1) {
                    row.push(0.7 + Math.random() * 0.3); // High attention for special tokens
                } else {
                    row.push(Math.random() * 0.3); // Low attention elsewhere
                }
            }
            data.push(row);
        }
    }
    
    return data;
}

// Function to refresh data periodically (simulating real-time updates)
function startMetricsRefresh(intervalMs = 5000) {
    setInterval(() => {
        // Add new data point for ongoing training
        if (metricsData.training.epochs.length > 0) {
            const lastEpoch = metricsData.training.epochs[metricsData.training.epochs.length - 1];
            const newEpoch = lastEpoch + 1;
            
            // Add new training data
            metricsData.training.epochs.push(newEpoch);
            
            // Training loss - decreasing with noise
            const lastLoss = metricsData.training.loss[metricsData.training.loss.length - 1];
            const newLoss = Math.max(0.01, lastLoss * (0.98 + Math.random() * 0.04));
            metricsData.training.loss.push(newLoss);
            
            // Validation loss
            const lastValLoss = metricsData.validation.loss[metricsData.validation.loss.length - 1];
            const newValLoss = Math.max(0.02, lastValLoss * (0.97 + Math.random() * 0.06));
            metricsData.validation.loss.push(newValLoss);
            
            // Accuracy
            const lastAccuracy = metricsData.validation.accuracy[metricsData.validation.accuracy.length - 1];
            const accuracyDelta = Math.min(0.01, (1 - lastAccuracy) * 0.1);
            const newAccuracy = Math.min(0.99, lastAccuracy + (Math.random() * 2 - 0.5) * accuracyDelta);
            metricsData.validation.accuracy.push(newAccuracy);
            
            // Precision
            const lastPrecision = metricsData.validation.precision[metricsData.validation.precision.length - 1];
            const precisionDelta = Math.min(0.01, (1 - lastPrecision) * 0.1);
            const newPrecision = Math.min(0.99, lastPrecision + (Math.random() * 2 - 0.5) * precisionDelta);
            metricsData.validation.precision.push(newPrecision);
            
            // Recall
            const lastRecall = metricsData.validation.recall[metricsData.validation.recall.length - 1];
            const recallDelta = Math.min(0.01, (1 - lastRecall) * 0.1);
            const newRecall = Math.min(0.99, lastRecall + (Math.random() * 2 - 0.5) * recallDelta);
            metricsData.validation.recall.push(newRecall);
            
            // F1 Score
            const newF1 = 2 * (newPrecision * newRecall) / (newPrecision + newRecall);
            metricsData.validation.f1Score.push(newF1);
            
            // Keep only the last 50 points
            if (metricsData.training.epochs.length > 50) {
                metricsData.training.epochs.shift();
                metricsData.training.loss.shift();
                metricsData.validation.loss.shift();
                metricsData.validation.accuracy.shift();
                metricsData.validation.precision.shift();
                metricsData.validation.recall.shift();
                metricsData.validation.f1Score.shift();
            }
            
            // Update all charts
            updateAllCharts();
        }
    }, intervalMs);
}

// Initialize real-time updates
document.addEventListener('DOMContentLoaded', () => {
    // Start metrics refresh after 2 seconds
    setTimeout(() => {
        startMetricsRefresh(5000);
    }, 2000);
}); 