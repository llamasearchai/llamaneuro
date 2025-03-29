#!/bin/bash

# TransformerX Run Script
# A convenience script to run various TransformerX commands

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}Virtual environment not found. Please run ./setup.sh first.${NC}"
    exit 1
fi

# Show help if no arguments provided
if [ $# -eq 0 ]; then
    echo -e "${BLUE}TransformerX Run Script${NC}"
    echo -e "Usage: $0 [command]"
    echo ""
    echo -e "Commands:"
    echo -e "  server        Start the TransformerX server"
    echo -e "  dashboard     Start the TransformerX dashboard"
    echo -e "  test          Run all tests"
    echo -e "  test-server   Run server tests"
    echo -e "  test-api      Run API tests"
    echo -e "  help          Show this help message"
    exit 0
fi

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
    echo "$base_port"
}

# Activate virtual environment
source venv/bin/activate

# Parse command
COMMAND=$1
shift

case $COMMAND in
    server)
        # Get port from arguments or use default
        PORT=${1:-$(find_available_port 8080)}
        echo -e "${BLUE}Starting TransformerX server on port $PORT...${NC}"
        echo -e "${GREEN}Server URL: http://localhost:$PORT${NC}"
        echo -e "${GREEN}API URL: http://localhost:$PORT/api/v1${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
        python server/app.py --port $PORT
        ;;
    dashboard)
        # Get port from arguments or use default
        PORT=${1:-$(find_available_port 3000)}
        echo -e "${BLUE}Starting TransformerX dashboard on port $PORT...${NC}"
        echo -e "${GREEN}Dashboard URL: http://localhost:$PORT${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop the dashboard${NC}"
        echo -e "${YELLOW}Make sure the server is running!${NC}"
        cd dashboard && python -m http.server $PORT
        ;;
    test)
        echo -e "${BLUE}Running all tests...${NC}"
        if command -v tox >/dev/null 2>&1; then
            tox
        else
            python -m pytest
        fi
        ;;
    test-server)
        echo -e "${BLUE}Running server tests...${NC}"
        python -m pytest server/test_server.py -v
        ;;
    test-api)
        echo -e "${BLUE}Running API tests...${NC}"
        python server/test_server.py --api-only
        ;;
    help)
        echo -e "${BLUE}TransformerX Run Script${NC}"
        echo -e "Usage: $0 [command]"
        echo ""
        echo -e "Commands:"
        echo -e "  server        Start the TransformerX server"
        echo -e "  dashboard     Start the TransformerX dashboard"
        echo -e "  test          Run all tests"
        echo -e "  test-server   Run server tests"
        echo -e "  test-api      Run API tests"
        echo -e "  help          Show this help message"
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo -e "Run '$0 help' for usage information."
        exit 1
        ;;
esac 