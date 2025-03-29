document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing dashboard...');
    
    // Initialize theme
    initTheme();
    
    // Initialize sidebar functionality
    initSidebar();
    
    // Initialize dropdown functionality
    initDropdowns();
    
    // Initialize last updated time
    updateTimestamp();
    
    // Demo data refresh for resources
    initResourceRefresh();
    
    // Initialize visualization controls
    initVisualizationControls();
    
    // Initialize model selector for performance metrics
    initModelSelector();
    
    // Initialize decoder model selector
    initDecoderModelSelector();
    
    // Initialize modals
    initModals();
    
    // Initialize export functionality
    initExportButtons();
    
    // Initialize fullscreen functionality
    initFullscreenButtons();
    
    // Initialize model selectors
    initModelSelectors();
    
    // Initialize trajectory type selector
    initTrajectoryTypeSelector();
    
    // Initialize BCI integration with other components
    initBCIIntegration();
    
    // Initialize component integration
    setTimeout(initializeComponentIntegration, 1000); // Slight delay to ensure all components are loaded
    
    console.log('Dashboard initialization complete');
});

// Theme switcher functionality
function initTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference or use device preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        htmlElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }
    
    // Theme switch event handler
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            htmlElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        
        // Notify visualizations about theme change
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: { isDark: this.checked }
        }));
    });
}

// Sidebar functionality
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.querySelector('.sidebar');
    
    // Check for saved sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    
    if (sidebarCollapsed) {
        appContainer.classList.add('sidebar-collapsed');
        sidebar.classList.add('collapsed');
    }
    
    sidebarToggle.addEventListener('click', function() {
        appContainer.classList.toggle('sidebar-collapsed');
        sidebar.classList.toggle('collapsed');
        
        // Save sidebar state
        localStorage.setItem('sidebar-collapsed', appContainer.classList.contains('sidebar-collapsed'));
    });
    
    // For mobile: close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        // Only applies when in mobile mode and sidebar is open
        if (window.innerWidth <= 768 && !appContainer.classList.contains('sidebar-collapsed')) {
            // If click is outside sidebar and not on the toggle button
            if (!sidebar.contains(e.target) && e.target !== sidebarToggle) {
                appContainer.classList.add('sidebar-collapsed');
                localStorage.setItem('sidebar-collapsed', 'true');
            }
        }
    });
    
    // Mobile menu toggle
    document.addEventListener('click', function(e) {
        if (e.target === sidebarToggle && window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
            e.stopPropagation();
        }
    });
}

// Dropdown functionality
function initDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
                if (menu !== this.nextElementSibling) {
                    menu.classList.remove('active');
                }
            });
            
            // Toggle this dropdown
            const dropdownMenu = this.nextElementSibling;
            dropdownMenu.classList.toggle('active');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
            menu.classList.remove('active');
        });
    });
}

// Last updated timestamp
function updateTimestamp() {
    const lastUpdated = document.getElementById('last-updated');
    
    if (lastUpdated) {
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastUpdated.textContent = formattedTime;
    }
}

// Resource refresh simulation
function initResourceRefresh() {
    const refreshSelect = document.getElementById('refresh-rate');
    let refreshInterval;
    
    if (refreshSelect) {
        // Initial refresh time
        let refreshTime = parseInt(refreshSelect.value);
        
        // Set up initial interval if not manual
        if (refreshTime > 0) {
            refreshInterval = setInterval(updateResourceMetrics, refreshTime * 1000);
        }
        
        // Change refresh rate
        refreshSelect.addEventListener('change', function() {
            // Clear current interval
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            
            // Get new refresh time
            refreshTime = parseInt(this.value);
            
            // Set new interval if not manual
            if (refreshTime > 0) {
                refreshInterval = setInterval(updateResourceMetrics, refreshTime * 1000);
            }
        });
    }
}

// Update resource metrics with random data (for demo purposes)
function updateResourceMetrics() {
    // Update GPU memory
    const gpuMemoryValue = document.querySelector('.resource-metrics .resource-metric:nth-child(1) .resource-value');
    if (gpuMemoryValue) {
        const usedGPU = (Math.random() * 3 + 12).toFixed(1); // Random between 12-15GB
        gpuMemoryValue.textContent = `${usedGPU}GB / 16GB`;
        
        const gpuBar = document.querySelector('.resource-metrics .resource-metric:nth-child(1) .progress');
        gpuBar.style.width = `${(usedGPU / 16) * 100}%`;
    }
    
    // Update CPU usage
    const cpuValue = document.querySelector('.resource-metrics .resource-metric:nth-child(2) .resource-value');
    if (cpuValue) {
        const cpuUsage = Math.floor(Math.random() * 30 + 30); // Random between 30-60%
        cpuValue.textContent = `${cpuUsage}%`;
        
        const cpuBar = document.querySelector('.resource-metrics .resource-metric:nth-child(2) .progress');
        cpuBar.style.width = `${cpuUsage}%`;
    }
    
    // Update RAM usage
    const ramValue = document.querySelector('.resource-metrics .resource-metric:nth-child(3) .resource-value');
    if (ramValue) {
        const usedRAM = (Math.random() * 8 + 20).toFixed(1); // Random between 20-28GB
        ramValue.textContent = `${usedRAM}GB / 64GB`;
        
        const ramBar = document.querySelector('.resource-metrics .resource-metric:nth-child(3) .progress');
        ramBar.style.width = `${(usedRAM / 64) * 100}%`;
    }
    
    // Update GPU temperatures
    const gpuTemps = document.querySelectorAll('.gpu-temp');
    gpuTemps.forEach(temp => {
        const newTemp = Math.floor(Math.random() * 10 + 60); // Random between 60-70°C
        temp.textContent = `${newTemp}°C`;
        
        // Change color based on temperature
        if (newTemp > 75) {
            temp.style.color = 'var(--error)';
        } else if (newTemp > 65) {
            temp.style.color = 'var(--warning)';
        } else {
            temp.style.color = 'var(--info)';
        }
    });
    
    // Update GPU utilization
    const gpuUtils = document.querySelectorAll('.gpu-util');
    gpuUtils.forEach(util => {
        const newUtil = Math.floor(Math.random() * 20 + 75); // Random between 75-95%
        util.textContent = `${newUtil}%`;
    });
    
    // Update last updated timestamp
    updateTimestamp();
}

// Fullscreen visualization functionality
document.getElementById('fullscreen-btn')?.addEventListener('click', function() {
    const visualizationCard = document.querySelector('.visualization-card');
    
    if (!document.fullscreenElement) {
        visualizationCard.requestFullscreen()
            .catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
    } else {
        document.exitFullscreen();
    }
});

// Tab switching functionality
const tabButtons = document.querySelectorAll('.metric-tabs .tab-btn');
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update chart based on selected metric
        const metric = this.getAttribute('data-metric');
        updatePerformanceChart(metric);
    });
});

// Initialize visualization controls
function initVisualizationControls() {
    // Layer visibility control
    const layerVisibility = document.getElementById('layer-visibility');
    if (layerVisibility) {
        layerVisibility.addEventListener('change', function() {
            // Call the network visualization's setLayerVisibility function
            if (window.networkVisualization && window.networkVisualization.setLayerVisibility) {
                window.networkVisualization.setLayerVisibility(this.value);
            }
        });
    }
    
    // Animation speed control
    const animationSpeed = document.getElementById('animation-speed');
    if (animationSpeed) {
        animationSpeed.addEventListener('input', function() {
            // Call the network visualization's setAnimationSpeed function
            if (window.networkVisualization && window.networkVisualization.setAnimationSpeed) {
                window.networkVisualization.setAnimationSpeed(parseFloat(this.value));
            }
        });
    }
    
    // Play/pause animation button
    const playAnimation = document.getElementById('play-animation');
    if (playAnimation) {
        playAnimation.addEventListener('click', function() {
            // Toggle animation state
            if (window.networkVisualization && window.networkVisualization.toggleAnimation) {
                const isPlaying = window.networkVisualization.toggleAnimation();
                
                // Update button icon and text
                const icon = this.querySelector('i');
                if (isPlaying) {
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                    this.innerHTML = `<i class="fas fa-pause"></i> Pause Animation`;
                } else {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                    this.innerHTML = `<i class="fas fa-play"></i> Play Animation`;
                }
            }
        });
    }
    
    // Attention head selector
    const attentionHeadSelect = document.getElementById('attention-head-select');
    if (attentionHeadSelect) {
        attentionHeadSelect.addEventListener('change', function() {
            // Update the attention visualization with the selected head
            if (window.metricsVisualization && window.metricsVisualization.updateAttentionVisualization) {
                window.metricsVisualization.updateAttentionVisualization(this.value);
            }
        });
    }
}

// Initialize model selector for performance metrics
function initModelSelector() {
    const modelSelect = document.getElementById('model-performance-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            // Update metrics charts with data for the selected model
            if (window.metricsVisualization && window.metricsVisualization.updateModelData) {
                window.metricsVisualization.updateModelData(this.value);
            }
        });
    }
}

// Function to update performance chart based on selected metric
function updatePerformanceChart(metric) {
    if (window.metricsVisualization && window.metricsVisualization.updateMetricView) {
        window.metricsVisualization.updateMetricView(metric);
    }
}

// Initialize decoder model selector
function initDecoderModelSelector() {
    const decoderModelSelect = document.getElementById('decoder-model-select');
    const trajectoryTypeSelect = document.getElementById('trajectory-type-selector');
    
    if (decoderModelSelect) {
        decoderModelSelect.addEventListener('change', function() {
            updateDecoderModelMetrics(this.value, trajectoryTypeSelect?.value || 'circular');
        });
    }
    
    if (trajectoryTypeSelect) {
        trajectoryTypeSelect.addEventListener('change', function() {
            // First update the trajectory type
            if (window.decoderVisualization && window.decoderVisualization.setTrajectoryType) {
                window.decoderVisualization.setTrajectoryType(this.value);
            }
            
            // Then update metrics based on both model and trajectory type
            updateDecoderModelMetrics(decoderModelSelect?.value || 'model1', this.value);
        });
    }
}

// Update decoder metrics based on model selection and trajectory type
function updateDecoderModelMetrics(modelId, trajectoryType) {
    if (window.decoderVisualization && window.decoderVisualization.updateDecoderData) {
        // Base metrics - will be adjusted based on model and trajectory
        let accuracy = 0.80;
        let noise = 0.15;
        let metrics = { 
            mse: 0.035, 
            r2: 0.75, 
            correlation: 0.85,
            decodeTime: 5.0,
            bitrate: 120
        };
        
        // Adjust base metrics based on model
        switch(modelId) {
            case 'model1': // TransformerX-Decoder
                accuracy *= 1.05;  // 5% better
                noise *= 0.85;     // 15% less noise
                metrics.mse *= 0.8;
                metrics.r2 *= 1.05;
                metrics.correlation *= 1.05;
                metrics.decodeTime *= 1.1; // 10% slower
                metrics.bitrate *= 1.05;   // 5% higher bitrate
                break;
            case 'model2': // RNN-Decoder
                accuracy *= 0.9;   // 10% worse
                noise *= 1.3;      // 30% more noise
                metrics.mse *= 1.5;
                metrics.r2 *= 0.9;
                metrics.correlation *= 0.95;
                metrics.decodeTime *= 0.85; // 15% faster
                metrics.bitrate *= 0.85;    // 15% lower bitrate
                break;
            case 'model3': // Transformer-Hybrid
                accuracy *= 1.12;  // 12% better
                noise *= 0.6;      // 40% less noise
                metrics.mse *= 0.65;
                metrics.r2 *= 1.12;
                metrics.correlation *= 1.1;
                metrics.decodeTime *= 1.2; // 20% slower
                metrics.bitrate *= 1.15;   // 15% higher bitrate
                break;
        }
        
        // Now adjust based on trajectory type
        switch(trajectoryType) {
            case 'circular': // Baseline, no adjustment
                break;
            case 'figure8':  // Figure-8 is harder
                accuracy *= 0.92;  // 8% worse
                noise *= 1.2;      // 20% more noise
                metrics.mse *= 1.3;
                metrics.r2 *= 0.92;
                metrics.correlation *= 0.95;
                metrics.bitrate *= 0.95;
                break;
            case 'reaching': // Reaching is easier for the decoder
                accuracy *= 1.08;  // 8% better
                noise *= 0.8;      // 20% less noise
                metrics.mse *= 0.7;
                metrics.r2 *= 1.05;
                metrics.correlation *= 1.05;
                metrics.bitrate *= 1.1;
                break;
        }
        
        // Keep metrics in reasonable ranges
        accuracy = Math.min(0.98, Math.max(0.5, accuracy));
        metrics.mse = Math.max(0.01, metrics.mse);
        metrics.r2 = Math.min(0.98, Math.max(0.4, metrics.r2));
        metrics.correlation = Math.min(0.99, Math.max(0.5, metrics.correlation));
        metrics.decodeTime = Math.max(2.0, metrics.decodeTime);
        metrics.bitrate = Math.max(50, metrics.bitrate);
        
        // Update the decoder data with new parameters
        window.decoderVisualization.updateDecoderData({
            accuracy: accuracy,
            metrics: metrics,
            trajectoryType: trajectoryType
        });
    }
}

// Initialize modal functionality
function initModals() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    
    // Settings buttons
    const settingsButtons = [
        document.getElementById('settings'),
        document.getElementById('sidebar-settings')
    ];
    
    settingsButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                openSettingsModal();
            });
        }
    });
    
    // Close modal
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    function openSettingsModal() {
        modalTitle.textContent = 'Dashboard Settings';
        
        // Create settings content
        modalBody.innerHTML = `
            <div class="settings-container">
                <h3>Display Settings</h3>
                <div class="setting-group">
                    <label for="animation-enabled">Enable Animations</label>
                    <input type="checkbox" id="animation-enabled" checked>
                </div>
                
                <div class="setting-group">
                    <label for="auto-refresh">Auto Refresh Interval</label>
                    <select id="auto-refresh">
                        <option value="0">Off</option>
                        <option value="5000" selected>5 seconds</option>
                        <option value="10000">10 seconds</option>
                        <option value="30000">30 seconds</option>
                        <option value="60000">1 minute</option>
                    </select>
                </div>
                
                <h3>Network Visualization Settings</h3>
                <div class="setting-group">
                    <label for="particle-count">Particle Count</label>
                    <input type="range" id="particle-count" min="100" max="5000" step="100" value="1000">
                    <span id="particle-count-value">1000</span>
                </div>
                
                <div class="setting-group">
                    <label for="node-size">Node Size</label>
                    <input type="range" id="node-size" min="1" max="5" step="0.5" value="2.5">
                    <span id="node-size-value">2.5</span>
                </div>
                
                <h3>BCI Settings</h3>
                <div class="setting-group">
                    <label for="sample-rate-setting">Sample Rate (Hz)</label>
                    <select id="sample-rate-setting">
                        <option value="250">250 Hz</option>
                        <option value="500">500 Hz</option>
                        <option value="1000" selected>1000 Hz</option>
                        <option value="2000">2000 Hz</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label for="bci-auto-check">Auto Impedance Check</label>
                    <select id="bci-auto-check">
                        <option value="0">Off</option>
                        <option value="60000" selected>Every minute</option>
                        <option value="300000">Every 5 minutes</option>
                        <option value="3600000">Every hour</option>
                    </select>
                </div>
                
                <button id="save-settings" class="btn-primary">Save Settings</button>
                <button id="reset-settings" class="btn-secondary">Reset to Defaults</button>
            </div>
        `;
        
        // Add event listeners to settings controls
        const saveButton = document.getElementById('save-settings');
        const resetButton = document.getElementById('reset-settings');
        const particleCount = document.getElementById('particle-count');
        const particleCountValue = document.getElementById('particle-count-value');
        const nodeSize = document.getElementById('node-size');
        const nodeSizeValue = document.getElementById('node-size-value');
        const sampleRateSelect = document.getElementById('sample-rate-setting');
        
        if (particleCount && particleCountValue) {
            particleCount.addEventListener('input', function() {
                particleCountValue.textContent = this.value;
            });
        }
        
        if (nodeSize && nodeSizeValue) {
            nodeSize.addEventListener('input', function() {
                nodeSizeValue.textContent = this.value;
            });
        }
        
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                // Save settings
                if (window.networkVisualization && particleCount) {
                    window.networkVisualization.setParticleCount(parseInt(particleCount.value));
                }
                
                if (window.networkVisualization && nodeSize) {
                    window.networkVisualization.setNodeSize(parseFloat(nodeSize.value));
                }
                
                if (window.bciStatusMonitor && sampleRateSelect) {
                    window.bciStatusMonitor.setSampleRate(parseInt(sampleRateSelect.value));
                }
                
                // Close modal
                modal.style.display = 'none';
                
                // Show notification
                showNotification('Settings saved successfully', 'success');
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', function() {
                // Reset to defaults
                if (particleCount) {
                    particleCount.value = 1000;
                    particleCountValue.textContent = '1000';
                }
                
                if (nodeSize) {
                    nodeSize.value = 2.5;
                    nodeSizeValue.textContent = '2.5';
                }
                
                if (sampleRateSelect) {
                    sampleRateSelect.value = 1000;
                }
                
                // Show notification
                showNotification('Settings reset to defaults', 'info');
            });
        }
        
        modal.style.display = 'block';
    }
}

// Initialize export buttons
function initExportButtons() {
    const exportButtons = {
        'export-training': 'training-progress-chart',
        'export-validation': 'validation-metrics-chart',
        'export-attention': 'attention-heatmap',
        'export-performance': 'performance-chart',
        'export-decoder': 'trajectory-chart',
        'export-bci': 'impedance-chart'
    };
    
    // General export button
    const exportDataBtn = document.getElementById('export-data');
    const sidebarExportBtn = document.getElementById('sidebar-export');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportAllData();
        });
    }
    
    if (sidebarExportBtn) {
        sidebarExportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportAllData();
        });
    }
    
    // Individual chart export buttons
    for (const [buttonId, chartId] of Object.entries(exportButtons)) {
        const button = document.getElementById(buttonId);
        
        if (button) {
            button.addEventListener('click', function() {
                exportChart(chartId);
            });
        }
    }
    
    function exportChart(chartId) {
        const canvas = document.getElementById(chartId);
        
        if (canvas && canvas.tagName === 'CANVAS') {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            
            link.href = dataUrl;
            link.download = `${chartId}-export-${new Date().toISOString().slice(0, 10)}.png`;
            link.click();
            
            showNotification('Chart exported successfully', 'success');
        } else {
            console.error(`Canvas with ID ${chartId} not found or not a canvas element`);
            showNotification('Failed to export chart', 'error');
        }
    }
    
    function exportAllData() {
        // Create a data object with all metrics and settings
        const data = {
            exportDate: new Date().toISOString(),
            metrics: {}
        };
        
        // Add metrics data if available
        if (window.metricsData) {
            data.metrics = window.metricsData;
        }
        
        // Add decoder data if available
        if (window.decoderData) {
            data.decoder = window.decoderData;
        }
        
        // Add BCI data if available
        if (window.bciStatusMonitor) {
            data.bci = window.bciStatusMonitor.getStatus();
        }
        
        // Convert to JSON and create download
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `transformerx-dashboard-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        showNotification('All dashboard data exported successfully', 'success');
    }
}

// Initialize fullscreen buttons
function initFullscreenButtons() {
    const fullscreenButtons = {
        'fullscreen-network': 'network-card',
        'fullscreen-training': 'training-card',
        'fullscreen-validation': 'validation-card',
        'fullscreen-attention': 'attention-card',
        'fullscreen-performance': 'performance-card',
        'fullscreen-decoder': 'decoder-card',
        'fullscreen-bci': 'bci-card'
    };
    
    for (const [buttonId, cardClass] of Object.entries(fullscreenButtons)) {
        const button = document.getElementById(buttonId);
        
        if (button) {
            button.addEventListener('click', function() {
                toggleFullscreen(cardClass);
            });
        }
    }
    
    function toggleFullscreen(cardClass) {
        const card = document.querySelector(`.${cardClass}`);
        
        if (!card) return;
        
        if (!document.fullscreenElement) {
            card.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                showNotification('Failed to enter fullscreen mode', 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// Initialize model selectors
function initModelSelectors() {
    const decoderModelSelect = document.getElementById('decoder-model-select');
    
    if (decoderModelSelect) {
        decoderModelSelect.addEventListener('change', function() {
            updateDecoderMetrics(this.value, getSelectedTrajectoryType());
            showNotification(`Switched to ${this.options[this.selectedIndex].text} model`, 'info');
        });
    }
}

// Initialize trajectory type selector
function initTrajectoryTypeSelector() {
    const trajectoryTypeSelect = document.getElementById('trajectory-type-select');
    
    if (trajectoryTypeSelect) {
        trajectoryTypeSelect.addEventListener('change', function() {
            const decoderModelSelect = document.getElementById('decoder-model-select');
            const decoderModel = decoderModelSelect ? decoderModelSelect.value : 'transformer';
            
            updateDecoderMetrics(decoderModel, this.value);
            showNotification(`Switched to ${this.options[this.selectedIndex].text} trajectory`, 'info');
        });
    }
}

// Get selected trajectory type
function getSelectedTrajectoryType() {
    const trajectoryTypeSelect = document.getElementById('trajectory-type-select');
    return trajectoryTypeSelect ? trajectoryTypeSelect.value : 'circular';
}

// Update decoder metrics based on selected model and trajectory type
function updateDecoderMetrics(model, trajectoryType) {
    // Performance metrics for different models and trajectory types
    const metrics = {
        transformer: {
            circular: { accuracy: 94.5, mse: 0.037, r2: 0.912, correlation: 0.889, time: 12.4, bitrate: 71.5 },
            figure8: { accuracy: 91.2, mse: 0.052, r2: 0.884, correlation: 0.862, time: 13.1, bitrate: 68.2 },
            reaching: { accuracy: 89.8, mse: 0.068, r2: 0.871, correlation: 0.845, time: 12.9, bitrate: 65.7 }
        },
        lstm: {
            circular: { accuracy: 92.1, mse: 0.045, r2: 0.894, correlation: 0.871, time: 10.8, bitrate: 69.3 },
            figure8: { accuracy: 88.4, mse: 0.067, r2: 0.856, correlation: 0.834, time: 11.2, bitrate: 65.9 },
            reaching: { accuracy: 85.9, mse: 0.079, r2: 0.842, correlation: 0.821, time: 11.5, bitrate: 62.8 }
        },
        kalman: {
            circular: { accuracy: 89.7, mse: 0.058, r2: 0.876, correlation: 0.853, time: 5.2, bitrate: 76.2 },
            figure8: { accuracy: 83.5, mse: 0.082, r2: 0.831, correlation: 0.809, time: 5.5, bitrate: 72.1 },
            reaching: { accuracy: 87.2, mse: 0.071, r2: 0.854, correlation: 0.837, time: 5.3, bitrate: 74.6 }
        },
        pca: {
            circular: { accuracy: 81.3, mse: 0.115, r2: 0.792, correlation: 0.774, time: 3.7, bitrate: 68.9 },
            figure8: { accuracy: 76.8, mse: 0.142, r2: 0.754, correlation: 0.731, time: 3.8, bitrate: 65.1 },
            reaching: { accuracy: 79.5, mse: 0.128, r2: 0.776, correlation: 0.758, time: 3.9, bitrate: 67.4 }
        }
    };
    
    // Get metrics for selected model and trajectory type
    const selectedMetrics = metrics[model]?.[trajectoryType] || metrics.transformer.circular;
    
    // Update metric values in the UI
    updateMetricElement('decoder-accuracy', `${selectedMetrics.accuracy.toFixed(1)}%`);
    updateMetricElement('decoder-mse', selectedMetrics.mse.toFixed(3));
    updateMetricElement('decoder-r2', selectedMetrics.r2.toFixed(3));
    updateMetricElement('decoder-correlation', selectedMetrics.correlation.toFixed(3));
    updateMetricElement('decoder-time', `${selectedMetrics.time.toFixed(1)} ms`);
    updateMetricElement('decoder-bitrate', `${selectedMetrics.bitrate.toFixed(1)} bps`);
    
    // Update decoder visualization if available
    if (window.updateDecoderVisualization) {
        window.updateDecoderVisualization(model, trajectoryType);
    } else {
        console.log('Decoder visualization update function not available');
    }
}

// Update metric element
function updateMetricElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        const valueElement = element.querySelector('.metric-value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
}

// Initialize BCI integration with other components
function initBCIIntegration() {
    // Listen for BCI connection status changes
    document.addEventListener('bciStatusChange', function(e) {
        const isConnected = e.detail.connected;
        
        // Update network visualization if available
        if (window.networkVisualization) {
            if (isConnected) {
                window.networkVisualization.startAnimation();
            } else {
                window.networkVisualization.pauseAnimation();
            }
        }
        
        // Update metrics refresh if available
        if (window.startMetricsRefresh && window.stopMetricsRefresh) {
            if (isConnected) {
                window.startMetricsRefresh();
            } else {
                window.stopMetricsRefresh();
            }
        }
        
        // Update decoder visualization if available
        if (window.startDecoderAnimation && window.stopDecoderAnimation) {
            if (isConnected) {
                window.startDecoderAnimation();
            } else {
                window.stopDecoderAnimation();
            }
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

/**
 * Initialize component integration
 */
function initializeComponentIntegration() {
    console.log("Initializing component integration...");
    
    // Check if Neural Signal Processor and NeuroLLaMA are available
    if (typeof initNeuralSignalProcessor === 'function' && typeof initNeuroLLaMA === 'function') {
        console.log("Neural Signal Processor and NeuroLLaMA components available, setting up integration");
        
        // Setup event listeners for neural processor to NeuroLLaMA communication
        document.addEventListener('processor:features-extracted', function(event) {
            // Log diagnostic information
            console.log("Neural processor extracted features, forwarding to NeuroLLaMA");
            
            // Forward the event to NeuroLLaMA (handled by its own event listeners)
            document.dispatchEvent(new CustomEvent('neuro-llama:features-available', {
                detail: event.detail
            }));
        });
        
        // Listen for NeuroLLaMA ready event
        document.addEventListener('neuro-llama:ready', function(event) {
            console.log("NeuroLLaMA component ready, connecting to neural processor");
            
            // Notify neural processor that NeuroLLaMA is ready
            document.dispatchEvent(new CustomEvent('processor:connect-llama', {
                detail: {
                    conceptMapping: event.detail.conceptMapping,
                    actionVerbs: event.detail.actionVerbs
                }
            }));
        });
    } else {
        console.warn("Neural Signal Processor or NeuroLLaMA components not available");
    }
    
    // Check if Decoder Visualization and NeuroLLaMA are available
    if (typeof initDecoderVisualization === 'function' && typeof initNeuroLLaMA === 'function') {
        console.log("Decoder Visualization and NeuroLLaMA components available, setting up integration");
        
        // Setup event listeners for neural classification to movement mapping
        document.addEventListener('processor:classification-updated', function(event) {
            if (event.detail && event.detail.class) {
                const classification = event.detail.class;
                const confidence = event.detail.confidence || 0;
                
                // Map motor imagery classes to movement directions for the decoder
                let direction = null;
                
                switch(classification) {
                    case 'Left Hand':
                        direction = 'left';
                        break;
                    case 'Right Hand':
                        direction = 'right';
                        break;
                    case 'Feet':
                        direction = 'down';
                        break;
                    case 'Tongue':
                        direction = 'up';
                        break;
                    default:
                        direction = null;
                }
                
                if (direction && confidence > 0.65) {
                    // Dispatch movement request to decoder
                    document.dispatchEvent(new CustomEvent('decoder:movement-request', {
                        detail: {
                            direction: direction,
                            confidence: confidence,
                            source: 'neural-processor'
                        }
                    }));
                    
                    console.log(`Neural classification "${classification}" mapped to "${direction}" direction for decoder`);
                }
                
                // Highlight the corresponding motor imagery class in the UI
                if (typeof highlightMotorImageryClass === 'function') {
                    highlightMotorImageryClass(classification);
                }
            }
        });
    }
    
    // Check if BCI Status and Neural Signal Processor are available
    if (typeof initBCIStatus === 'function' && typeof initNeuralSignalProcessor === 'function') {
        console.log("BCI Status and Neural Signal Processor components available, setting up integration");
        
        // Listen for BCI status changes to inform processor
        document.addEventListener('bci:status-updated', function(event) {
            if (event.detail && event.detail.status) {
                const status = event.detail.status;
                
                // Forward BCI signal quality to processor
                document.dispatchEvent(new CustomEvent('processor:bci-status', {
                    detail: {
                        signalQuality: status.signalQuality || 0,
                        batteryLevel: status.batteryLevel || 0,
                        connected: status.connected || false
                    }
                }));
                
                console.log("BCI status forwarded to Neural Signal Processor");
            }
        });
    }
    
    // Log integration status
    console.log("Component integration setup complete");
}

// Call the integration function after a short delay to ensure all components are initialized
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components first
    setTimeout(initializeComponentIntegration, 1500);
    
    // Log overall system status
    console.log("TransformerX Dashboard fully initialized");
}); 