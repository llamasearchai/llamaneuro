#!/bin/bash

# Start TransformerX Server
# This script starts the TransformerX server with all necessary components

# Set the environment variables
export PYTHONPATH="$PYTHONPATH:$(pwd)"

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

# Function to check if Python and required packages are installed
check_python() {
    if ! command_exists python3; then
        echo -e "${RED}Error: Python 3 is not installed. Please install Python 3.${NC}"
        exit 1
    fi
    
    if ! python3 -c "import flask" &>/dev/null; then
        echo -e "${YELLOW}Warning: Flask is not installed. Installing required dependencies...${NC}"
        python3 -m pip install -r server/requirements.txt
    fi
}

# Function to display help
show_help() {
    echo -e "${BLUE}TransformerX Server Launcher${NC}"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -c, --config CONFIG       Use specified configuration file"
    echo "  -p, --port PORT           Run server on specified port (default: 8080)"
    echo "  -d, --debug               Run in debug mode"
    echo "  --host HOST               Run server on specified host (default: 0.0.0.0)"
    echo "  --no-simulated            Disable simulated data mode (use real EEG data)"
    echo ""
    echo "Example:"
    echo "  $0 --port 8000 --debug"
}

# Parse command line arguments
CONFIG_FILE=""
PORT=8080
HOST="0.0.0.0"
DEBUG=""
EXTRA_ARGS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            EXTRA_ARGS="$EXTRA_ARGS --config $CONFIG_FILE"
            shift 2
            ;;
        -p|--port)
            PORT="$2"
            EXTRA_ARGS="$EXTRA_ARGS --port $PORT"
            shift 2
            ;;
        -d|--debug)
            DEBUG="--debug"
            EXTRA_ARGS="$EXTRA_ARGS --debug"
            shift
            ;;
        --host)
            HOST="$2"
            EXTRA_ARGS="$EXTRA_ARGS --host $HOST"
            shift 2
            ;;
        --no-simulated)
            EXTRA_ARGS="$EXTRA_ARGS --no-simulated"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check Python and dependencies
check_python

# Create logs directory if it doesn't exist
mkdir -p logs

# Display banner
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}   TransformerX Server Launcher    ${NC}"
echo -e "${GREEN}====================================${NC}"
echo -e "${BLUE}Starting server at http://$HOST:$PORT${NC}"
echo -e "${BLUE}Dashboard URL: http://$HOST:$PORT${NC}"
echo -e "${BLUE}API URL: http://$HOST:$PORT/api/v1${NC}"
if [ ! -z "$CONFIG_FILE" ]; then
    echo -e "${BLUE}Using config file: $CONFIG_FILE${NC}"
fi
if [ ! -z "$DEBUG" ]; then
    echo -e "${YELLOW}Running in DEBUG mode${NC}"
fi
echo -e "${GREEN}====================================${NC}"

# Start the server
cd "$(dirname "$0")"
python3 server/run_server.py --host $HOST --port $PORT $DEBUG $EXTRA_ARGS

# Exit with the Python script's exit code
exit $? 