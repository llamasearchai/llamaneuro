// BCI Status Monitor - Displays real-time Brain-Computer Interface status
let impedanceChart;
let signalChart;
let bciStatus = {
    connected: true,
    recordingTime: 0,
    sampleRate: 1000, // Hz
    electrodes: [
        { name: 'Fp1', impedance: 12.4, signal: 95, status: 'good' },
        { name: 'Fp2', impedance: 8.7, signal: 98, status: 'good' },
        { name: 'F3', impedance: 15.2, signal: 92, status: 'good' },
        { name: 'F4', impedance: 10.1, signal: 97, status: 'good' },
        { name: 'C3', impedance: 7.8, signal: 99, status: 'good' },
        { name: 'C4', impedance: 11.3, signal: 96, status: 'good' },
        { name: 'P3', impedance: 14.6, signal: 91, status: 'good' },
        { name: 'P4', impedance: 9.2, signal: 94, status: 'good' },
        { name: 'O1', impedance: 18.5, signal: 85, status: 'poor' },
        { name: 'O2', impedance: 22.7, signal: 78, status: 'poor' },
        { name: 'T3', impedance: 13.4, signal: 93, status: 'good' },
        { name: 'T4', impedance: 16.8, signal: 89, status: 'moderate' },
        { name: 'T5', impedance: 19.3, signal: 82, status: 'poor' },
        { name: 'T6', impedance: 17.6, signal: 87, status: 'moderate' },
        { name: 'Fz', impedance: 6.5, signal: 100, status: 'good' },
        { name: 'Cz', impedance: 5.9, signal: 100, status: 'good' },
        { name: 'Pz', impedance: 9.8, signal: 97, status: 'good' }
    ],
    signalHistory: [],
    batteryLevel: 87,
    storageUsed: 42, // percentage
    lastUpdate: Date.now()
};

// Initialize the BCI status monitor when DOM is ready
document.addEventListener('DOMContentLoaded', initBCIStatusMonitor);

// Handle theme changes
window.addEventListener('themeChange', (e) => {
    const isDark = e.detail.isDark;
    updateBCITheme(isDark);
});

// Public interface for the BCI status monitor
window.bciStatusMonitor = {
    // Connect or disconnect BCI
    toggleConnection: function() {
        bciStatus.connected = !bciStatus.connected;
        updateConnectionStatus();
        return bciStatus.connected;
    },
    
    // Set sample rate
    setSampleRate: function(rate) {
        bciStatus.sampleRate = rate;
        updateBCIInfo();
        return rate;
    },
    
    // Get current status
    getStatus: function() {
        return {...bciStatus};
    },
    
    // Simulate impedance check
    runImpedanceCheck: function() {
        // Show notification
        showBCINotification('Running impedance check...', 'info');
        
        // Disable connection toggle during check
        const toggleBtn = document.getElementById('bci-connect-btn');
        if (toggleBtn) toggleBtn.disabled = true;
        
        // Simulate check progress
        let progress = 0;
        const progressBar = document.getElementById('bci-progress');
        if (progressBar) progressBar.style.width = '0%';
        
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progressBar) progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Update impedances with new random values
                bciStatus.electrodes.forEach(electrode => {
                    electrode.impedance = Math.max(5, Math.min(40, electrode.impedance + (Math.random() - 0.5) * 10));
                    
                    // Update status based on impedance
                    if (electrode.impedance < 10) {
                        electrode.status = 'good';
                        electrode.signal = 95 + Math.random() * 5;
                    } else if (electrode.impedance < 15) {
                        electrode.status = 'good';
                        electrode.signal = 90 + Math.random() * 5;
                    } else if (electrode.impedance < 20) {
                        electrode.status = 'moderate';
                        electrode.signal = 80 + Math.random() * 10;
                    } else {
                        electrode.status = 'poor';
                        electrode.signal = 70 + Math.random() * 10;
                    }
                });
                
                updateImpedanceDisplay();
                updateSignalQualityDisplay();
                
                // Re-enable connection toggle
                if (toggleBtn) toggleBtn.disabled = false;
                
                showBCINotification('Impedance check completed', 'success');
            }
        }, 100);
        
        return true;
    }
};

// Initialize the BCI status monitor
function initBCIStatusMonitor() {
    // Check if the BCI status container exists
    const impedanceContainer = document.getElementById('impedance-chart');
    const signalContainer = document.getElementById('signal-quality-chart');
    const electrodeTable = document.getElementById('electrode-status');
    
    if (!impedanceContainer && !signalContainer && !electrodeTable) return;
    
    // Initialize the impedance chart if container exists
    if (impedanceContainer) {
        initImpedanceChart(impedanceContainer);
    }
    
    // Initialize the signal quality chart if container exists
    if (signalContainer) {
        initSignalQualityChart(signalContainer);
    }
    
    // Initialize electrode table if container exists
    if (electrodeTable) {
        updateElectrodeTable(electrodeTable);
    }
    
    // Initialize connection status
    updateConnectionStatus();
    
    // Initialize BCI info
    updateBCIInfo();
    
    // Start simulated updates
    startBCIUpdates();
    
    // Initialize connect button
    const connectBtn = document.getElementById('bci-connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            const isConnected = window.bciStatusMonitor.toggleConnection();
            this.textContent = isConnected ? 'Disconnect' : 'Connect';
            this.className = isConnected ? 'btn-small btn-danger' : 'btn-small btn-primary';
        });
    }
    
    // Initialize impedance check button
    const impedanceBtn = document.getElementById('run-impedance-check');
    if (impedanceBtn) {
        impedanceBtn.addEventListener('click', function() {
            window.bciStatusMonitor.runImpedanceCheck();
        });
    }
}

// Initialize impedance chart
function initImpedanceChart(container) {
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    if (!container.querySelector('canvas')) {
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Sort electrodes by name for consistent display
    const sortedElectrodes = [...bciStatus.electrodes].sort((a, b) => a.name.localeCompare(b.name));
    
    impedanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedElectrodes.map(e => e.name),
            datasets: [{
                label: 'Impedance (kΩ)',
                data: sortedElectrodes.map(e => e.impedance),
                backgroundColor: sortedElectrodes.map(e => {
                    // Color based on impedance
                    if (e.impedance < 10) return 'rgba(16, 185, 129, 0.7)'; // Good - Green
                    if (e.impedance < 15) return 'rgba(59, 130, 246, 0.7)'; // Good - Blue
                    if (e.impedance < 20) return 'rgba(245, 158, 11, 0.7)'; // Moderate - Yellow
                    return 'rgba(239, 68, 68, 0.7)'; // Poor - Red
                }),
                borderColor: sortedElectrodes.map(e => {
                    if (e.impedance < 10) return 'rgba(16, 185, 129, 1)';
                    if (e.impedance < 15) return 'rgba(59, 130, 246, 1)';
                    if (e.impedance < 20) return 'rgba(245, 158, 11, 1)';
                    return 'rgba(239, 68, 68, 1)';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 50,
                    title: {
                        display: true,
                        text: 'Impedance (kΩ)',
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    },
                    ticks: {
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: isDark ? '#e2e8f0' : '#334155'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw.toFixed(1)} kΩ`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize signal quality chart
function initSignalQualityChart(container) {
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    if (!container.querySelector('canvas')) {
        container.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Sort electrodes by name for consistent display
    const sortedElectrodes = [...bciStatus.electrodes].sort((a, b) => a.name.localeCompare(b.name));
    
    signalChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: sortedElectrodes.map(e => e.name),
            datasets: [{
                label: 'Signal Quality (%)',
                data: sortedElectrodes.map(e => e.signal),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                pointBackgroundColor: sortedElectrodes.map(e => {
                    if (e.signal > 90) return 'rgba(16, 185, 129, 1)'; // Good - Green
                    if (e.signal > 80) return 'rgba(59, 130, 246, 1)'; // Good - Blue
                    if (e.signal > 70) return 'rgba(245, 158, 11, 1)'; // Moderate - Yellow
                    return 'rgba(239, 68, 68, 1)'; // Poor - Red
                }),
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: isDark ? '#e2e8f0' : '#334155'
                    },
                    grid: {
                        color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)'
                    },
                    pointLabels: {
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
                }
            }
        }
    });
}

// Update electrode table
function updateElectrodeTable(tableElement) {
    // Clear existing rows
    tableElement.innerHTML = `
        <tr>
            <th>Channel</th>
            <th>Impedance</th>
            <th>Signal</th>
            <th>Status</th>
        </tr>
    `;
    
    // Add rows for each electrode
    bciStatus.electrodes.forEach(electrode => {
        const row = document.createElement('tr');
        
        // Status class for color coding
        let statusClass = '';
        if (electrode.status === 'good') statusClass = 'status-good';
        else if (electrode.status === 'moderate') statusClass = 'status-moderate';
        else statusClass = 'status-poor';
        
        row.innerHTML = `
            <td>${electrode.name}</td>
            <td>${electrode.impedance.toFixed(1)} kΩ</td>
            <td>${electrode.signal.toFixed(0)}%</td>
            <td><span class="status-indicator ${statusClass}">${electrode.status}</span></td>
        `;
        
        tableElement.appendChild(row);
    });
}

// Update connection status display
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');
    
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${bciStatus.connected ? 'status-good' : 'status-poor'}`;
    }
    
    if (statusText) {
        statusText.textContent = bciStatus.connected ? 'Connected' : 'Disconnected';
    }
    
    // Update record time
    updateRecordingTime();
}

// Update BCI info (sample rate, battery, storage)
function updateBCIInfo() {
    const sampleRateEl = document.getElementById('sample-rate');
    const batteryEl = document.getElementById('battery-level');
    const storageEl = document.getElementById('storage-used');
    
    if (sampleRateEl) {
        sampleRateEl.textContent = `${bciStatus.sampleRate} Hz`;
    }
    
    if (batteryEl) {
        batteryEl.textContent = `${bciStatus.batteryLevel}%`;
        
        // Update battery icon
        const batteryIcon = document.querySelector('.battery-icon i');
        if (batteryIcon) {
            if (bciStatus.batteryLevel > 80) {
                batteryIcon.className = 'fas fa-battery-full';
            } else if (bciStatus.batteryLevel > 60) {
                batteryIcon.className = 'fas fa-battery-three-quarters';
            } else if (bciStatus.batteryLevel > 40) {
                batteryIcon.className = 'fas fa-battery-half';
            } else if (bciStatus.batteryLevel > 20) {
                batteryIcon.className = 'fas fa-battery-quarter';
            } else {
                batteryIcon.className = 'fas fa-battery-empty';
            }
        }
    }
    
    if (storageEl) {
        storageEl.textContent = `${bciStatus.storageUsed}%`;
    }
}

// Update recording time
function updateRecordingTime() {
    const recordingTimeEl = document.getElementById('recording-time');
    
    if (recordingTimeEl && bciStatus.connected) {
        // Format time as HH:MM:SS
        const hours = Math.floor(bciStatus.recordingTime / 3600);
        const minutes = Math.floor((bciStatus.recordingTime % 3600) / 60);
        const seconds = bciStatus.recordingTime % 60;
        
        recordingTimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (recordingTimeEl) {
        recordingTimeEl.textContent = '--:--:--';
    }
}

// Update theme for BCI charts
function updateBCITheme(isDark) {
    // Update impedance chart
    if (impedanceChart) {
        impedanceChart.options.scales.y.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        impedanceChart.options.scales.y.title.color = isDark ? '#e2e8f0' : '#334155';
        impedanceChart.options.scales.y.ticks.color = isDark ? '#e2e8f0' : '#334155';
        impedanceChart.options.scales.x.ticks.color = isDark ? '#e2e8f0' : '#334155';
        impedanceChart.update();
    }
    
    // Update signal quality chart
    if (signalChart) {
        signalChart.options.scales.r.ticks.color = isDark ? '#e2e8f0' : '#334155';
        signalChart.options.scales.r.grid.color = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)';
        signalChart.options.scales.r.pointLabels.color = isDark ? '#e2e8f0' : '#334155';
        signalChart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#334155';
        signalChart.update();
    }
}

// Show a notification in the BCI panel
function showBCINotification(message, type = 'info') {
    const notifications = document.getElementById('bci-notifications');
    if (!notifications) return;
    
    const notification = document.createElement('div');
    notification.className = `bci-notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notifications.removeChild(notification);
        }, 500);
    }, 5000);
}

// Update impedance display
function updateImpedanceDisplay() {
    // Update impedance chart if it exists
    if (impedanceChart) {
        // Sort electrodes by name for consistent display
        const sortedElectrodes = [...bciStatus.electrodes].sort((a, b) => a.name.localeCompare(b.name));
        
        impedanceChart.data.datasets[0].data = sortedElectrodes.map(e => e.impedance);
        impedanceChart.data.datasets[0].backgroundColor = sortedElectrodes.map(e => {
            if (e.impedance < 10) return 'rgba(16, 185, 129, 0.7)';
            if (e.impedance < 15) return 'rgba(59, 130, 246, 0.7)';
            if (e.impedance < 20) return 'rgba(245, 158, 11, 0.7)';
            return 'rgba(239, 68, 68, 0.7)';
        });
        impedanceChart.data.datasets[0].borderColor = sortedElectrodes.map(e => {
            if (e.impedance < 10) return 'rgba(16, 185, 129, 1)';
            if (e.impedance < 15) return 'rgba(59, 130, 246, 1)';
            if (e.impedance < 20) return 'rgba(245, 158, 11, 1)';
            return 'rgba(239, 68, 68, 1)';
        });
        
        impedanceChart.update();
    }
    
    // Update electrode table
    const electrodeTable = document.getElementById('electrode-status');
    if (electrodeTable) {
        updateElectrodeTable(electrodeTable);
    }
}

// Update signal quality display
function updateSignalQualityDisplay() {
    // Update signal quality chart if it exists
    if (signalChart) {
        // Sort electrodes by name for consistent display
        const sortedElectrodes = [...bciStatus.electrodes].sort((a, b) => a.name.localeCompare(b.name));
        
        signalChart.data.datasets[0].data = sortedElectrodes.map(e => e.signal);
        signalChart.data.datasets[0].pointBackgroundColor = sortedElectrodes.map(e => {
            if (e.signal > 90) return 'rgba(16, 185, 129, 1)';
            if (e.signal > 80) return 'rgba(59, 130, 246, 1)';
            if (e.signal > 70) return 'rgba(245, 158, 11, 1)';
            return 'rgba(239, 68, 68, 1)';
        });
        
        signalChart.update();
    }
}

// Start simulated BCI updates
function startBCIUpdates() {
    setInterval(() => {
        if (bciStatus.connected) {
            // Increment recording time
            bciStatus.recordingTime++;
            updateRecordingTime();
            
            // Decrease battery level slowly
            if (Math.random() < 0.1) {
                bciStatus.batteryLevel = Math.max(0, bciStatus.batteryLevel - 1);
                updateBCIInfo();
            }
            
            // Increase storage used slowly
            if (Math.random() < 0.05) {
                bciStatus.storageUsed = Math.min(100, bciStatus.storageUsed + 1);
                updateBCIInfo();
            }
            
            // Randomly fluctuate signal quality
            bciStatus.electrodes.forEach(electrode => {
                // Signal fluctuates slightly
                electrode.signal = Math.max(50, Math.min(100, electrode.signal + (Math.random() - 0.5) * 2));
                
                // Impedance fluctuates slightly
                electrode.impedance = Math.max(5, Math.min(40, electrode.impedance + (Math.random() - 0.5) * 0.5));
                
                // Update status based on impedance
                if (electrode.impedance < 10) {
                    electrode.status = 'good';
                } else if (electrode.impedance < 15) {
                    electrode.status = 'good';
                } else if (electrode.impedance < 20) {
                    electrode.status = 'moderate';
                } else {
                    electrode.status = 'poor';
                }
            });
            
            // Update displays occasionally to avoid too frequent updates
            if (bciStatus.recordingTime % 5 === 0) {
                updateImpedanceDisplay();
                updateSignalQualityDisplay();
            }
        }
    }, 1000);
} 