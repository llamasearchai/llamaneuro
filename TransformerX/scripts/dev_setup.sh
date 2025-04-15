#!/bin/bash

# TransformerX Development Environment Setup
# This script sets up a development environment with uv, venv, and tox

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

# Display banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   TransformerX Dev Setup          ${NC}"
echo -e "${GREEN}====================================${NC}"

# Check Python installation
if ! command_exists python3; then
    echo -e "${RED}Error: Python 3 is not installed. Please install Python 3.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${BLUE}Found Python $PYTHON_VERSION${NC}"

# Install uv
echo -e "${BLUE}Installing uv package installer...${NC}"
if ! command_exists uv; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Add uv to PATH for current session
    export PATH="$HOME/.cargo/bin:$PATH"
    echo -e "${GREEN}uv installed successfully${NC}"
else
    echo -e "${GREEN}uv already installed${NC}"
fi

# Create virtual environment with uv
echo -e "${BLUE}Creating virtual environment with uv...${NC}"
uv venv venv
source venv/bin/activate
echo -e "${GREEN}Virtual environment activated${NC}"

# Install development dependencies
echo -e "${BLUE}Installing development dependencies...${NC}"
uv pip install -e ".[dev]" ".[deep-learning]" ".[eeg]"
echo -e "${GREEN}Dependencies installed successfully${NC}"

# Install pre-commit hooks
echo -e "${BLUE}Setting up pre-commit hooks...${NC}"
if ! command_exists pre-commit; then
    uv pip install pre-commit
fi

cat > .pre-commit-config.yaml << EOF
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
    -   id: trailing-whitespace
    -   id: end-of-file-fixer
    -   id: check-yaml
    -   id: check-added-large-files

-   repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
    -   id: black

-   repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
    -   id: isort

-   repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
    -   id: flake8
EOF

pre-commit install
echo -e "${GREEN}Pre-commit hooks installed${NC}"

# Configure Git
if command_exists git; then
    echo -e "${BLUE}Configuring Git...${NC}"
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
ENV/
env/

# Testing
.coverage
htmlcov/
.tox/
.pytest_cache/

# Development
.mypy_cache/
.vscode/
.idea/

# Models
models/

# Logs
logs/
*.log
EOF
        echo -e "${GREEN}.gitignore created${NC}"
    fi
fi

# Display completion message
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   Dev Environment Ready!           ${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${BLUE}You can now:${NC}"
echo -e "  - Run tests: ${YELLOW}tox${NC}"
echo -e "  - Format code: ${YELLOW}tox -e format${NC}"
echo -e "  - Check code quality: ${YELLOW}tox -e lint${NC}"
echo -e ""
echo -e "${BLUE}Virtual environment is activated.${NC}"
echo -e "${BLUE}To deactivate, run: ${YELLOW}deactivate${NC}"
echo -e "${GREEN}====================================${NC}"

exit 0 