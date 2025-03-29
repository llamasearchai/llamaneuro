#!/bin/bash

# Docker Run Script for TransformerX
# This script manages Docker containers for the TransformerX project

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

# Function to check if a port is in use
port_in_use() {
    if command_exists nc; then
        nc -z localhost "$1" >/dev/null 2>&1
        return $?
    elif command_exists lsof; then
        lsof -i:"$1" >/dev/null 2>&1
        return $?
    else
        # Fallback method
        (echo >/dev/tcp/localhost/"$1") >/dev/null 2>&1
        return $?
    fi
}

# Function to find an available port
find_available_port() {
    local base_port=$1
    local max_attempts=${2:-10}
    
    for (( i=0; i<max_attempts; i++ )); do
        local port=$((base_port + i))
        if ! port_in_use "$port"; then
            echo "$port"
            return 0
        fi
    done
    
    # No available port found
    echo -e "${RED}Error: No available ports found in range $base_port-$((base_port + max_attempts - 1))${NC}"
    return 1
}

# Function to display help
show_help() {
    echo -e "${BLUE}TransformerX Docker Runner${NC}"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start         Start the production server"
    echo "  dev           Start the development server"
    echo "  dashboard     Start the nginx dashboard"
    echo "  simple-dash   Start the simple Python dashboard (fallback)"
    echo "  full          Start server and dashboard together"
    echo "  full-simple   Start server and simple dashboard together"
    echo "  notebook      Start Jupyter notebook server"
    echo "  test          Run tests using tox in Docker"
    echo "  build         Build all Docker images"
    echo "  stop          Stop all running containers"
    echo "  logs          View logs from all containers"
    echo "  help          Show this help message"
    echo ""
    echo "Options:"
    echo "  --port PORT   Specify a custom port for the server (default: 8080)"
    echo "  --dash-port PORT   Specify a custom port for the dashboard (default: 3000)"
    echo "  --simple-port PORT   Specify a custom port for the simple dashboard (default: 3001)"
    echo "  --notebook-port PORT   Specify a custom port for the notebook (default: 8888)"
    echo "  --theme THEME   Specify dashboard theme: light or dark (default: light)"
    echo ""
    echo "Examples:"
    echo "  $0 start      Start the TransformerX server"
    echo "  $0 dashboard  Start only the web dashboard"
    echo "  $0 full       Start both server and dashboard"
    echo "  $0 start --port 9000  Start server on port 9000"
    echo "  $0 dashboard --theme dark  Start dashboard with dark theme"
}

# Check if Docker is installed
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Parse command
COMMAND=${1:-help}
shift || true

# Parse additional arguments
SERVER_PORT=8080
DASHBOARD_PORT=3000
NOTEBOOK_PORT=8888

while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            SERVER_PORT="$2"
            shift 2
            ;;
        --dash-port)
            DASHBOARD_PORT="$2"
            shift 2
            ;;
        --simple-port)
            SIMPLE_PORT="$2"
            shift 2
            ;;
        --notebook-port)
            NOTEBOOK_PORT="$2"
            shift 2
            ;;
        --theme)
            THEME="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if ports are in use and find alternatives if needed
if [[ "$COMMAND" == "start" || "$COMMAND" == "full" ]]; then
    if port_in_use "$SERVER_PORT"; then
        echo -e "${YELLOW}Warning: Port $SERVER_PORT is already in use.${NC}"
        NEW_PORT=$(find_available_port $((SERVER_PORT + 1)))
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}Using alternative port: $NEW_PORT${NC}"
            SERVER_PORT=$NEW_PORT
        else
            echo -e "${RED}Could not find an available port. Please specify a different port with --port.${NC}"
            exit 1
        fi
    fi
fi

if [[ "$COMMAND" == "dashboard" || "$COMMAND" == "full" ]]; then
    if port_in_use "$DASHBOARD_PORT"; then
        echo -e "${YELLOW}Warning: Port $DASHBOARD_PORT is already in use.${NC}"
        NEW_PORT=$(find_available_port $((DASHBOARD_PORT + 1)))
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}Using alternative port for dashboard: $NEW_PORT${NC}"
            DASHBOARD_PORT=$NEW_PORT
        else
            echo -e "${RED}Could not find an available port for dashboard. Please specify a different port with --dash-port.${NC}"
            exit 1
        fi
    fi
fi

if [[ "$COMMAND" == "notebook" ]]; then
    if port_in_use "$NOTEBOOK_PORT"; then
        echo -e "${YELLOW}Warning: Port $NOTEBOOK_PORT is already in use.${NC}"
        NEW_PORT=$(find_available_port $((NOTEBOOK_PORT + 1)))
        if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}Using alternative port for notebook: $NEW_PORT${NC}"
            NOTEBOOK_PORT=$NEW_PORT
        else
            echo -e "${RED}Could not find an available port for notebook. Please specify a different port with --notebook-port.${NC}"
            exit 1
        fi
    fi
fi

# Export environment variables for docker-compose
export PORT=$SERVER_PORT
export DASHBOARD_PORT=$DASHBOARD_PORT
export SIMPLE_DASHBOARD_PORT=$SIMPLE_PORT
export NOTEBOOK_PORT=$NOTEBOOK_PORT
export DASHBOARD_THEME=$THEME

# Execute command
case $COMMAND in
    start)
        echo -e "${BLUE}Starting TransformerX server...${NC}"
        echo -e "${GREEN}Server will be available at: http://localhost:$SERVER_PORT${NC}"
        docker-compose up transformerx
        ;;
    dev)
        echo -e "${BLUE}Starting TransformerX in development mode...${NC}"
        echo -e "${GREEN}Server will be available at: http://localhost:$SERVER_PORT${NC}"
        docker-compose up dev
        ;;
    dashboard)
        echo -e "${BLUE}Starting TransformerX dashboard...${NC}"
        echo -e "${GREEN}Dashboard will be available at: http://localhost:$DASHBOARD_PORT${NC}"
        docker-compose up dashboard
        ;;
    simple-dash)
        echo -e "${BLUE}Starting simple Python dashboard...${NC}"
        echo -e "${GREEN}Simple dashboard will be available at: http://localhost:$SIMPLE_PORT${NC}"
        docker-compose up simple-dashboard
        ;;
    full)
        echo -e "${BLUE}Starting TransformerX server and dashboard...${NC}"
        echo -e "${GREEN}Server will be available at: http://localhost:$SERVER_PORT${NC}"
        echo -e "${GREEN}Dashboard will be available at: http://localhost:$DASHBOARD_PORT${NC}"
        docker-compose up transformerx dashboard
        ;;
    full-simple)
        echo -e "${BLUE}Starting TransformerX server and simple dashboard...${NC}"
        echo -e "${GREEN}Server will be available at: http://localhost:$SERVER_PORT${NC}"
        echo -e "${GREEN}Simple dashboard will be available at: http://localhost:$SIMPLE_PORT${NC}"
        docker-compose up transformerx simple-dashboard
        ;;
    notebook)
        echo -e "${BLUE}Starting Jupyter notebook server...${NC}"
        echo -e "${GREEN}Notebook will be available at: http://localhost:$NOTEBOOK_PORT${NC}"
        echo -e "${YELLOW}Token: transformerx${NC}"
        docker-compose up notebook
        ;;
    test)
        echo -e "${BLUE}Running tests with tox...${NC}"
        docker-compose run test
        ;;
    build)
        echo -e "${BLUE}Building Docker images...${NC}"
        docker-compose build
        ;;
    stop)
        echo -e "${BLUE}Stopping all containers...${NC}"
        docker-compose down
        ;;
    logs)
        echo -e "${BLUE}Viewing logs...${NC}"
        docker-compose logs -f
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_help
        exit 1
        ;;
esac

exit 0 