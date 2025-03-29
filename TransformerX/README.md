# TransformerX with NeuroLLaMA Integration

TransformerX is a powerful framework for neural signal processing and BCI (Brain-Computer Interface) development. This repository includes NeuroLLaMA integration, which combines neural signal processing with large language models.

![TransformerX Dashboard](https://i.imgur.com/placeholderImage.png)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/transformerx.git
cd transformerx

# Run the system with default settings
./run.sh
```

## Overview

The TransformerX framework with NeuroLLaMA integration provides a modern platform for:

- **Neural Signal Processing**: Real-time EEG signal analysis with transformer-based models
- **Brain-Computer Interface**: Translate neural activity into actionable commands
- **NeuroLLaMA Integration**: Guide language generation with neural signals
- **Interactive Dashboard**: Visualize neural data and influence language processing

## Key Features

- **Real-time Signal Processing**: Process EEG signals in real-time using state-of-the-art transformer models
- **Neural Classification**: Classify motor imagery patterns (left hand, right hand, feet, tongue, rest)
- **Neural Guidance**: Use neural activity to guide the LLaMA language model
- **Interactive Visualization**: Visualize frequency bands, attention weights, and neural classifications
- **REST API**: Comprehensive API for integration with other systems
- **Simulated Data Mode**: Test and develop without physical EEG hardware

## System Architecture

TransformerX consists of three main components:

1. **Backend Server**: Python-based processing of neural signals and LLaMA integration
2. **Dashboard Frontend**: Interactive web interface for visualization and control
3. **NeuroLLaMA Module**: Bridge between neural activity and language generation

For a detailed architecture overview, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js (for dashboard development)
- Web browser
- Optional: CUDA-compatible GPU for faster processing

### Installation Options

```bash
# Install with all dependencies (recommended for new users)
./install.sh --full

# Install with specific components
./install.sh --with-torch --with-transformers

# Install without downloading demo models
./install.sh --skip-models
```

For detailed installation instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md).

## Usage

### Starting the Server

```bash
# Start with default settings
./start_server.sh

# Start with custom port
./start_server.sh --port 8000

# Start in debug mode
./start_server.sh --debug
```

### Using the Dashboard

1. Access the dashboard at http://localhost:8080
2. Enable neural guidance using the toggle in the control panel
3. Simulate neural activity by selecting different motor imagery classes
4. Observe how neural activity guides language generation

## API Reference

The system exposes a comprehensive REST API:

- `/api/v1/status`: Get system status
- `/api/v1/neuro/*`: Neural processor endpoints
- `/api/v1/llama/*`: LLaMA interface endpoints
- `/api/v1/neural_llama/*`: Combined neural and language processing

## Demo

TransformerX includes demo models for immediate testing:

```bash
# Download demo models
./scripts/download_models.py

# Run the server with demo models
./start_server.sh
```

## Docker Support

TransformerX can be run using Docker for easy deployment and development:

### Running with Docker

```bash
# Build and start the server
./scripts/docker_run.sh start

# Run in development mode
./scripts/docker_run.sh dev

# Start Jupyter notebook for data analysis
./scripts/docker_run.sh notebook

# Run tests in Docker
./scripts/docker_run.sh test
```

### Docker Compose Configuration

The project includes multiple Docker configurations:

- **Production Server**: Optimized for deployment
- **Development Server**: Includes hot-reloading and debugging
- **Jupyter Notebook**: For data analysis and model development
- **Test Runner**: For running tests in isolation

```bash
# Manual Docker commands
docker-compose build      # Build all images
docker-compose up         # Start all services
docker-compose down       # Stop all services
```

## Development

### Project Structure

```
TransformerX/
├── server/               # Python backend
│   ├── api/              # API endpoints
│   ├── neuro_processor/  # Neural signal processing
│   ├── llama_interface/  # LLaMA integration
│   └── utils/            # Utility functions
├── dashboard/            # Web dashboard
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   └── index.html        # Main dashboard HTML
├── docs/                 # Documentation
├── models/               # Pre-trained models
└── scripts/              # Utility scripts
```

### Development Tools

The project supports modern Python development tools:

```bash
# Install with development tools
./install.sh --with-dev-tools

# Use faster package management with uv
./install.sh --use-uv

# Set up a complete development environment
./scripts/dev_setup.sh
```

### Testing

```bash
# Run all tests with tox
tox

# Run linting checks
tox -e lint

# Format code
tox -e format
```

### Continuous Integration

TransformerX uses GitHub Actions for continuous integration:

- Automated testing on Python 3.8, 3.9, and 3.10
- Code quality checks with lint tools
- Docker build validation

The CI pipeline runs automatically on each push and pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The LLaMA team for the language model
- Open source BCI community
- Contributors to the EEG processing libraries 