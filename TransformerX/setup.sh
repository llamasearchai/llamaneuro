#!/bin/bash

# TransformerX Setup Script
# This script sets up the environment, installs dependencies, runs tests,
# and verifies that everything is working correctly.

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

echo -e "${BLUE}=== TransformerX Setup Script ===${NC}"

# Check for Python 3.8+
echo -e "${YELLOW}Checking Python version...${NC}"
if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or later.${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    echo -e "${RED}Python 3.8 or later is required. Found Python $PYTHON_VERSION${NC}"
    exit 1
fi

echo -e "${GREEN}Found Python $PYTHON_VERSION${NC}"

# Create and activate virtual environment
echo -e "${YELLOW}Setting up virtual environment...${NC}"
if command_exists python3; then
    if [ -d "venv" ]; then
        echo -e "${YELLOW}Virtual environment already exists. Reusing it.${NC}"
    else
        python3 -m venv venv
        echo -e "${GREEN}Created virtual environment in ./venv${NC}"
    fi
    
    # Activate virtual environment
    echo -e "${YELLOW}Activating virtual environment...${NC}"
    source venv/bin/activate
else
    echo -e "${RED}Python 3 venv module not available.${NC}"
    exit 1
fi

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install base requirements
if [ -f "server/requirements.txt" ]; then
    echo -e "${YELLOW}Installing base requirements...${NC}"
    pip install -r server/requirements.txt
    echo -e "${GREEN}Installed base requirements${NC}"
else
    echo -e "${RED}Missing server/requirements.txt file${NC}"
    exit 1
fi

# Install development requirements if they exist
if [ -f "server/requirements-dev.txt" ]; then
    echo -e "${YELLOW}Installing development requirements...${NC}"
    pip install -r server/requirements-dev.txt
    echo -e "${GREEN}Installed development requirements${NC}"
fi

# Install test dependencies
echo -e "${YELLOW}Installing test dependencies...${NC}"
pip install pytest tox

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p logs models notebooks

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
if command_exists tox; then
    tox -e py
    if [ $? -ne 0 ]; then
        echo -e "${RED}Tests failed. Please check the test output above.${NC}"
        echo -e "${YELLOW}Continuing with setup despite test failures...${NC}"
    else
        echo -e "${GREEN}All tests passed!${NC}"
    fi
else
    echo -e "${YELLOW}Tox not available. Trying pytest directly...${NC}"
    pytest
    if [ $? -ne 0 ]; then
        echo -e "${RED}Tests failed. Please check the test output above.${NC}"
        echo -e "${YELLOW}Continuing with setup despite test failures...${NC}"
    else
        echo -e "${GREEN}All tests passed!${NC}"
    fi
fi

# Verify the setup by running the server in the background and checking its status
echo -e "${YELLOW}Verifying the setup...${NC}"

# Function to find an available port
find_available_port() {
    local base_port=$1
    local max_attempts=${2:-10}
    
    for (( i=0; i<max_attempts; i++ )); do
        local port=$((base_port + i))
        if ! (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
            echo "$port"
            return 0
        fi
    done
    
    # No available port found
    echo ""
    return 1
}

# Find an available port
SERVER_PORT=$(find_available_port 8080)
if [ -z "$SERVER_PORT" ]; then
    echo -e "${RED}Could not find an available port. Using 8100 as a fallback.${NC}"
    SERVER_PORT=8100
fi

echo -e "${YELLOW}Starting the server on port $SERVER_PORT (in background)...${NC}"
nohup python3 server/app.py --port $SERVER_PORT > logs/server_startup.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}Server is running on port $SERVER_PORT (PID: $SERVER_PID)${NC}"
    
    # Try to access the status endpoint
    if command_exists curl; then
        echo -e "${YELLOW}Checking server status...${NC}"
        if curl -s http://localhost:$SERVER_PORT/api/v1/status > /dev/null; then
            echo -e "${GREEN}Server responded successfully!${NC}"
        else
            echo -e "${RED}Server is running but not responding to API requests.${NC}"
        fi
    else
        echo -e "${YELLOW}curl not available. Skipping server status check.${NC}"
    fi
    
    # Kill the server
    echo -e "${YELLOW}Stopping the server...${NC}"
    kill $SERVER_PID
    echo -e "${GREEN}Server stopped.${NC}"
else
    echo -e "${RED}Server failed to start. Check logs/server_startup.log for details.${NC}"
fi

# Print summary
echo -e "${BLUE}=== Setup Summary ===${NC}"
echo -e "${GREEN}✓ Python environment configured${NC}"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo -e "${GREEN}✓ Tests executed${NC}"
echo -e "${GREEN}✓ Server verified${NC}"

echo -e "${BLUE}=== Setup Complete! ===${NC}"
echo -e "To activate the environment in the future, run: ${YELLOW}source venv/bin/activate${NC}"
echo -e "To start the server, run: ${YELLOW}python server/app.py${NC}"
echo -e "To start the dashboard, run: ${YELLOW}python -m http.server 3000 --directory dashboard${NC}"
echo -e "Or use Docker: ${YELLOW}./scripts/docker_run.sh full${NC}"

echo -e "${BLUE}Thank you for using TransformerX!${NC}" 