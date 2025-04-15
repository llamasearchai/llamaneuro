// Vendor Libraries

// Utility function to load JavaScript files
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    
    if (callback) {
        script.onload = callback;
    }
    
    document.head.appendChild(script);
    console.log(`Loading script: ${url}`);
}

// Utility function to load CSS files
function loadCSS(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    console.log(`Loading CSS: ${url}`);
}

// Load Three.js and its controls for network visualization
loadScript('https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js', function() {
    loadScript('https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js', function() {
        console.log('Three.js and OrbitControls loaded, initializing network visualization');
        
        // Check if the network visualization container exists
        if (document.getElementById('network-visualization-container') && typeof initNetworkVisualization === 'function') {
            initNetworkVisualization();
        } else {
            console.log('Network visualization container not found or initialization function not available');
        }
    });
});

// Load Chart.js for metrics visualization and BCI status
loadScript('https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.min.js', function() {
    console.log('Chart.js loaded, initializing metrics and BCI status visualizations');
    
    // Initialize metrics visualization if available
    if (typeof initMetricsVisualization === 'function') {
        initMetricsVisualization();
    } else {
        console.log('Metrics visualization initialization function not available');
    }
    
    // Load Chart.js plugins after main library
    loadScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0', function() {
        console.log('Chart.js datalabels plugin loaded');
    });
    
    // Load additional Chart.js plugin for heatmap
    loadScript('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@1.1.1/dist/chartjs-chart-matrix.min.js', function() {
        console.log('Chart.js matrix plugin loaded');
    });
});

// Load FontAwesome
loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

// Load D3.js for additional visualizations
loadScript('https://cdn.jsdelivr.net/npm/d3@7.4.4/dist/d3.min.js', function() {
    console.log('D3.js loaded');
});

// Load Moment.js for time formatting
loadScript('https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js', function() {
    console.log('Moment.js loaded');
});

console.log('All libraries loading process initiated');

// DOM ready event listener for initialization that doesn't depend on external libraries
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard');
    
    // Initialize theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Dispatch theme change event for components to update
            window.dispatchEvent(new CustomEvent('themeChange', {
                detail: { isDark: newTheme === 'dark' }
            }));
            
            // Update icon
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        
        // Set initial icon based on theme
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}); 