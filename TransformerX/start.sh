#!/bin/bash

# TransformerX Master Script
# This script handles the entire process from setup to verification to running the system

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}   ______                   ____                 ${NC}"
echo -e "${BLUE}  /_  __/________ _____  __/ __/___  _________ __${NC}"
echo -e "${BLUE}   / / / ___/ __  / __ \/ / /_/ __ \/ ___/ __ \/_/${NC}"
echo -e "${BLUE}  / / / /  / /_/ / / / / / __/ /_/ / /  / /_/ / / ${NC}"
echo -e "${BLUE} /_/ /_/   \__,_/_/ /_/_/_/  \____/_/   \____/_/  ${NC}"
echo -e "${BLUE}                                                 ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}             Motor Imagery BCI                  ${NC}"
echo -e "${BLUE}=================================================${NC}"

# Parse arguments
SKIP_SETUP=false
SKIP_VERIFY=false
RUN_MODE="full"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        --mode)
            RUN_MODE="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-setup    Skip the setup process"
            echo "  --skip-verify   Skip the verification process"
            echo "  --mode MODE     Set the run mode (server, dashboard, full, test)"
            echo "  --verbose       Show detailed output"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Run '$0 --help' for usage information."
            exit 1
            ;;
    esac
done

# Step 1: Setup
if [ "$SKIP_SETUP" = false ]; then
    echo -e "${BLUE}=== Step 1: Setup ===${NC}"
    if [ -f "./setup.sh" ]; then
        if [ "$VERBOSE" = true ]; then
            ./setup.sh
        else
            ./setup.sh > logs/setup.log 2>&1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Setup completed successfully${NC}"
            else
                echo -e "${RED}✗ Setup failed. Check logs/setup.log for details.${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${RED}✗ Setup script not found.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping setup as requested...${NC}"
fi

# Step 2: Verification
if [ "$SKIP_VERIFY" = false ]; then
    echo -e "${BLUE}=== Step 2: Verification ===${NC}"
    if [ -f "./verify.sh" ]; then
        if [ "$VERBOSE" = true ]; then
            ./verify.sh
        else
            ./verify.sh > logs/verify.log 2>&1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Verification completed successfully${NC}"
            else
                echo -e "${RED}✗ Verification failed. Check logs/verify.log for details.${NC}"
                exit 1
            fi
        fi
    else
        echo -e "${RED}✗ Verification script not found.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping verification as requested...${NC}"
fi

# Step 3: Run
echo -e "${BLUE}=== Step 3: Running TransformerX ===${NC}"
if [ -f "./run.sh" ]; then
    case "$RUN_MODE" in
        server)
            echo -e "${GREEN}Starting server...${NC}"
            ./run.sh server
            ;;
        dashboard)
            echo -e "${GREEN}Starting dashboard...${NC}"
            ./run.sh dashboard
            ;;
        test)
            echo -e "${GREEN}Running tests...${NC}"
            ./run.sh test
            ;;
        full)
            echo -e "${GREEN}Starting full system...${NC}"
            echo -e "${YELLOW}Starting server in the background...${NC}"
            
            # Start server in background
            SERVER_PORT=8080
            ./run.sh server $SERVER_PORT > logs/server.log 2>&1 &
            SERVER_PID=$!
            
            # Wait for server to start
            echo -e "${YELLOW}Waiting for server to start...${NC}"
            sleep 5
            
            # Check if server is running
            if ps -p $SERVER_PID > /dev/null; then
                echo -e "${GREEN}✓ Server started successfully (PID: $SERVER_PID)${NC}"
                echo -e "${GREEN}Server URL: http://localhost:$SERVER_PORT${NC}"
                echo -e "${GREEN}API URL: http://localhost:$SERVER_PORT/api/v1${NC}"
                
                # Start dashboard
                echo -e "${YELLOW}Starting dashboard...${NC}"
                DASHBOARD_PORT=3000
                echo -e "${GREEN}Dashboard URL: http://localhost:$DASHBOARD_PORT${NC}"
                echo -e "${RED}Press Ctrl+C to exit both server and dashboard${NC}"
                
                # Set up trap to ensure server is killed when dashboard exits
                trap "kill $SERVER_PID; echo -e '${YELLOW}Stopping server...${NC}'; echo -e '${GREEN}✓ Server stopped${NC}'" EXIT
                
                # Run dashboard
                ./run.sh dashboard $DASHBOARD_PORT
            else
                echo -e "${RED}✗ Server failed to start. Check logs/server.log for details.${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}Unknown run mode: $RUN_MODE${NC}"
            echo "Valid modes: server, dashboard, test, full"
            exit 1
            ;;
    esac
else
    echo -e "${RED}✗ Run script not found.${NC}"
    exit 1
fi 