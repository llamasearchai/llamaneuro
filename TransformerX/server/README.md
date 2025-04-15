# TransformerX Server

The TransformerX server provides the backend infrastructure for the NeuroLLaMA integration, combining neural signal processing with LLaMA language model capabilities.

## Features

- **Neural Signal Processing**: Real-time EEG signal processing and motor imagery classification
- **LLaMA Integration**: Text generation guided by neural signals
- **REST API**: Comprehensive API for frontend integration
- **Dashboard Serving**: Serves the TransformerX dashboard

## Requirements

- Python 3.8+
- Virtual environment (recommended)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/transformerx.git
cd transformerx
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
cd server
pip install -r requirements.txt
```

4. (Optional) Install deep learning dependencies:
```bash
# Uncomment the torch and transformers lines in requirements.txt or run:
pip install torch>=2.0.0 transformers>=4.30.2
```

5. (Optional) Install EEG processing libraries:
```bash
# Uncomment the mne and pyedflib lines in requirements.txt or run:
pip install mne>=1.3.1 pyedflib>=0.1.30
```

## Running the Server

Start the server with default settings:
```bash
python run_server.py
```

### Command-line Options

- `--config PATH`: Path to configuration file
- `--host HOST`: Host to run the server on
- `--port PORT`: Port to run the server on
- `--debug`: Run in debug mode

Example:
```bash
python run_server.py --port 8080 --debug
```

## Configuration

The server uses a configuration system with defaults and optional overrides. 
You can create a JSON configuration file and pass it with the `--config` option.

Example configuration:
```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "debug": false
  },
  "neuro_processor": {
    "active": true,
    "use_simulated_data": true
  },
  "llama_interface": {
    "active": true,
    "temperature": 0.7
  }
}
```

## API Endpoints

The server provides the following API endpoints:

### System

- `GET /api/v1/status`: Get overall system status
- `GET /api/v1/config`: Get system configuration
- `POST /api/v1/config`: Update system configuration

### Neural Processor

- `POST /api/v1/neuro/start`: Start neural processor
- `POST /api/v1/neuro/stop`: Stop neural processor
- `GET /api/v1/neuro/status`: Get neural processor status
- `GET /api/v1/neuro/data`: Stream neural processor data (SSE)
- `POST /api/v1/neuro/reset`: Reset neural processor state
- `POST /api/v1/neuro/simulate_data`: Simulate neural data for testing

### LLaMA Interface

- `POST /api/v1/llama/start`: Start LLaMA interface
- `POST /api/v1/llama/stop`: Stop LLaMA interface
- `GET /api/v1/llama/status`: Get LLaMA interface status
- `POST /api/v1/llama/generate`: Generate text using LLaMA model
- `POST /api/v1/llama/settings`: Update LLaMA interface settings
- `GET /api/v1/llama/history`: Get LLaMA message history

### Combined

- `POST /api/v1/neural_llama/process`: Process neural data and generate text

## Development

### Directory Structure

```
server/
├── api/              # API endpoints
├── llama_interface/  # LLaMA model integration
├── neuro_processor/  # Neural signal processing
├── utils/            # Utility functions
├── logs/             # Server logs
├── run_server.py     # Main entry point
└── requirements.txt  # Dependencies
```

### Adding New Features

1. **Neural Processing**: Add new feature extraction methods in `neuro_processor/feature_extraction.py`
2. **LLaMA Integration**: Enhance neural guidance in `llama_interface/llama_model.py`
3. **API Endpoints**: Add new routes in `api/routes.py`

## License

MIT License 