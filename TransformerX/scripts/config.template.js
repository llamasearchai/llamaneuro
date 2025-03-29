// Configuration for TransformerX Dashboard
window.TRANSFORMERX_CONFIG = {
    // API Configuration
    api: {
        // Base URL for API requests
        baseUrl: '${API_URL}',
        
        // API endpoints
        endpoints: {
            status: '/api/v1/status',
            neuroStart: '/api/v1/neuro/start',
            neuroStop: '/api/v1/neuro/stop',
            neuroStatus: '/api/v1/neuro/status',
            neuroData: '/api/v1/neuro/data',
            llamaStart: '/api/v1/llama/start',
            llamaStop: '/api/v1/llama/stop',
            llamaStatus: '/api/v1/llama/status',
            llamaGenerate: '/api/v1/llama/generate',
            neuralLlama: '/api/v1/neural_llama'
        }
    },
    
    // UI Configuration
    ui: {
        // Refresh intervals in milliseconds
        refreshIntervals: {
            status: 2000,
            neuroData: 100,
            attentionWeights: 1000
        },
        
        // Default themes
        theme: '${DASHBOARD_THEME:-light}',
        
        // Dashboard settings
        charts: {
            eegViewDuration: 5,
            maxFrequencyDisplay: 60
        }
    },
    
    // Demo mode settings
    demo: {
        enabled: false,
        useSimulatedData: true
    }
}; 