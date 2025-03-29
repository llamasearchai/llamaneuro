# Getting Started with TransformerX

This guide will help you set up and start using the TransformerX system with NeuroLLaMA integration.

## Prerequisites

- Python 3.8 or higher
- Git (for cloning the repository)
- 4GB+ RAM recommended
- Optional: CUDA-compatible GPU for faster processing

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/transformerx.git
cd transformerx
```

### 2. Quick Start

For a quick start with default settings, simply run:

```bash
./run.sh
```

This will:
- Install necessary dependencies (first time only)
- Start the TransformerX server
- Open the dashboard in your default browser

### 3. Manual Installation

If you prefer to install and configure manually:

```bash
# Install dependencies
./install.sh

# Start the server
./start_server.sh
```

You can customize the installation with options:

```bash
# Install with all optional dependencies
./install.sh --full

# Install with specific components
./install.sh --with-torch --with-transformers
```

## Using the Dashboard

1. Access the dashboard at: http://localhost:8080

2. The dashboard provides several key sections:
   - **Status Panel**: Shows the system state
   - **Neural Activity**: Visualizes brain activity
   - **NeuroLLaMA Interface**: Controls language generation

3. Enable neural guidance by clicking the "Enable Neural Guidance" toggle in the control panel.

4. Simulate neural activity:
   - Use the "Simulate" dropdown to select different motor imagery classes
   - Observe how neural classifications affect language generation

## Testing the System

You can run the test script to verify everything is working correctly:

```bash
./server/test_server.py
```

For specific component tests:

```bash
./server/test_server.py --components  # Test individual components
./server/test_server.py --api         # Test API endpoints
```

## Configuration

The system can be configured through:

1. **Command-line arguments**:
   ```bash
   ./start_server.sh --port 8000 --debug
   ```

2. **Configuration files**:
   - Edit `server/config/default.json` for permanent changes
   - Create custom config files and use with `--config` option:
   ```bash
   ./start_server.sh --config my_config.json
   ```

## Working with Neural Data

### Simulated Data Mode

By default, the system uses simulated neural data. You can:

- Change the active class from the dashboard
- Adjust confidence levels
- See immediate effects on the language model

### Real EEG Data

To use with real EEG data:
1. Connect your EEG device
2. Set `use_simulated_data` to `false` in the configuration
3. Configure the appropriate device settings

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   ./start_server.sh --port 8081  # Try a different port
   ```

2. **Missing dependencies**:
   ```bash
   ./install.sh --full  # Reinstall all dependencies
   ```

3. **Dashboard not loading**:
   - Ensure the server is running
   - Check browser console for errors
   - Verify the port is correct in your URL

### Getting Help

- Check the logs in `TransformerX/logs/server.log`
- See the full documentation in the `docs` directory
- Submit issues on GitHub

## Next Steps

- Try creating custom neural guidance profiles
- Experiment with different motor imagery patterns
- Explore the API documentation to build your own applications 

## Development Tools

TransformerX includes support for modern Python development tools to help with dependency management and code quality.

### Using uv for Faster Package Installation

[uv](https://github.com/astral-sh/uv) is a fast Python package installer and resolver. To use uv with TransformerX:

```bash
# Install with uv
./install.sh --use-uv

# Install specific dependencies with uv
uv pip install torch transformers
```

### Virtual Environments

The project uses Python's built-in venv module by default. You can also create environments with uv:

```bash
# Create and activate a venv using uv
uv venv venv
source venv/bin/activate
```

### Testing with tox

[tox](https://tox.wiki/en/latest/) automates testing across multiple Python environments:

```bash
# Install tox
./install.sh --with-dev-tools

# Run tests across all supported Python versions
tox

# Run only linting
tox -e lint

# Format code automatically
tox -e format
```

### Installing Development Dependencies

Install all development tools at once:

```bash
# Using pip
pip install -e ".[dev]"

# Using uv
uv pip install -e ".[dev]"
```

This will install pytest, tox, black, isort, and mypy for testing and code quality checks. 