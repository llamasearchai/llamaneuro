#!/bin/bash

# TransformerX Installation Script
# This script installs all necessary dependencies for the TransformerX project

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to display help
show_help() {
    echo -e "${BLUE}TransformerX Installation Script${NC}"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  --with-torch              Install PyTorch dependencies"
    echo "  --with-transformers       Install Hugging Face Transformers"
    echo "  --with-mne                Install MNE for EEG processing"
    echo "  --full                    Install all optional dependencies"
    echo "  --no-venv                 Don't create a virtual environment"
    echo "  --download-models         Download demo models"
    echo "  --skip-models             Skip downloading demo models"
    echo "  --with-dev-tools          Install development tools (uv, tox)"
    echo "  --use-uv                  Use uv instead of pip for installations"
    echo ""
    echo "Example:"
    echo "  $0 --full"
}

# Parse command line arguments
WITH_TORCH=false
WITH_TRANSFORMERS=false
WITH_MNE=false
USE_VENV=true
DOWNLOAD_MODELS=true
WITH_DEV_TOOLS=false
USE_UV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --with-torch)
            WITH_TORCH=true
            shift
            ;;
        --with-transformers)
            WITH_TRANSFORMERS=true
            shift
            ;;
        --with-mne)
            WITH_MNE=true
            shift
            ;;
        --full)
            WITH_TORCH=true
            WITH_TRANSFORMERS=true
            WITH_MNE=true
            shift
            ;;
        --no-venv)
            USE_VENV=false
            shift
            ;;
        --download-models)
            DOWNLOAD_MODELS=true
            shift
            ;;
        --skip-models)
            DOWNLOAD_MODELS=false
            shift
            ;;
        --with-dev-tools)
            WITH_DEV_TOOLS=true
            shift
            ;;
        --use-uv)
            USE_UV=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Display banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   TransformerX Installation        ${NC}"
echo -e "${GREEN}====================================${NC}"

# Check Python installation
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${BLUE}Found Python $PYTHON_VERSION${NC}"

# Install uv if requested
if [ "$USE_UV" = true ]; then
    echo -e "${BLUE}Checking for uv package installer...${NC}"
    if ! command_exists uv; then
        echo -e "${YELLOW}uv not found. Installing uv...${NC}"
        curl -LsSf https://astral.sh/uv/install.sh | sh
        # Add uv to PATH for current session
        export PATH="$HOME/.cargo/bin:$PATH"
    else
        echo -e "${GREEN}uv already installed${NC}"
    fi
fi

# Create and activate virtual environment if requested
if [ "$USE_VENV" = true ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    
    if [ "$USE_UV" = true ] && command_exists uv; then
        echo -e "${BLUE}Creating virtual environment with uv...${NC}"
        uv venv venv
    else
        if ! command_exists python3 -m venv; then
            echo -e "${YELLOW}Warning: venv module not available. Installing...${NC}"
            python3 -m pip install virtualenv
        fi
        
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        echo -e "${GREEN}Virtual environment activated${NC}"
    else
        echo -e "${RED}Error: Failed to create virtual environment${NC}"
        exit 1
    fi
fi

# Install base dependencies
echo -e "${BLUE}Installing base dependencies...${NC}"
if [ "$USE_UV" = true ] && command_exists uv; then
    uv pip install -r server/requirements.txt
else
    python3 -m pip install -r server/requirements.txt
fi

# Install optional dependencies
if [ "$WITH_TORCH" = true ]; then
    echo -e "${BLUE}Installing PyTorch...${NC}"
    if [ "$USE_UV" = true ] && command_exists uv; then
        uv pip install torch
    else
        python3 -m pip install torch
    fi
fi

if [ "$WITH_TRANSFORMERS" = true ]; then
    echo -e "${BLUE}Installing Hugging Face Transformers...${NC}"
    if [ "$USE_UV" = true ] && command_exists uv; then
        uv pip install transformers
    else
        python3 -m pip install transformers
    fi
fi

if [ "$WITH_MNE" = true ]; then
    echo -e "${BLUE}Installing MNE for EEG processing...${NC}"
    if [ "$USE_UV" = true ] && command_exists uv; then
        uv pip install mne
    else
        python3 -m pip install mne
    fi
fi

# Install development tools if requested
if [ "$WITH_DEV_TOOLS" = true ]; then
    echo -e "${BLUE}Installing development tools...${NC}"
    if [ "$USE_UV" = true ] && command_exists uv; then
        uv pip install tox pytest black isort mypy
    else
        python3 -m pip install tox pytest black isort mypy
    fi
fi

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p TransformerX/logs
mkdir -p TransformerX/models

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x start_server.sh
chmod +x server/run_server.py
chmod +x server/test_server.py
chmod +x scripts/download_models.py

# Download demo models
if [ "$DOWNLOAD_MODELS" = true ]; then
    echo -e "${BLUE}Downloading demo models...${NC}"
    python3 scripts/download_models.py
fi

# Display completion message
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   Installation Complete!           ${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${BLUE}To start the server, run:${NC}"
echo -e "  ./start_server.sh"
echo ""
echo -e "${BLUE}To test the server, run:${NC}"
echo -e "  ./server/test_server.py"
echo ""
if [ "$USE_VENV" = true ]; then
    echo -e "${YELLOW}Note: Remember to activate the virtual environment:${NC}"
    echo -e "  source venv/bin/activate"
    echo ""
fi
if [ "$WITH_DEV_TOOLS" = true ]; then
    echo -e "${BLUE}Development tools installed:${NC}"
    echo -e "  - tox: Run tests across multiple Python environments"
    echo -e "  - pytest: Run unit tests"
    echo -e "  - black & isort: Format code"
    echo -e "  - mypy: Static type checking"
    echo ""
fi
echo -e "${GREEN}====================================${NC}"

exit 0 