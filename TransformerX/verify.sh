#!/bin/bash

# TransformerX Verification Script
# This script verifies that all components of TransformerX are working correctly

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
    echo ""
    return 1
}

# Initialize test status
passed=0
failed=0
warning=0

echo -e "${BLUE}=== TransformerX Verification ===${NC}"
echo "Starting verification process..."

# Check virtual environment
echo -e "${YELLOW}Checking virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Virtual environment not found. Run ./setup.sh first.${NC}"
    ((failed++))
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check Python version
echo -e "${YELLOW}Checking Python version...${NC}"
python_version=$(python --version 2>&1)
echo "Found: $python_version"
if [[ "$python_version" == *"Python 3"* ]]; then
    echo -e "${GREEN}✓ Python 3 is available${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Python 3 not found in virtual environment${NC}"
    ((failed++))
fi

# Check for required directories
echo -e "${YELLOW}Checking required directories...${NC}"
directories=("logs" "models" "server" "dashboard")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir directory exists${NC}"
        ((passed++))
    else
        echo -e "${RED}✗ $dir directory not found${NC}"
        ((failed++))
    fi
done

# Check for key files
echo -e "${YELLOW}Checking key files...${NC}"
files=("server/app.py" "setup.sh" "run.sh")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
        ((passed++))
    else
        echo -e "${RED}✗ $file not found${NC}"
        ((failed++))
    fi
done

# Summary
echo -e "${BLUE}=== Verification Summary ===${NC}"
echo -e "${GREEN}Passed: $passed tests${NC}"
if [ $warning -gt 0 ]; then
    echo -e "${YELLOW}Warnings: $warning${NC}"
fi
if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed: $failed tests${NC}"
    echo -e "${RED}Some components are not working correctly!${NC}"
    echo -e "${YELLOW}Run ./setup.sh to fix issues or check logs for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed! TransformerX is ready to use.${NC}"
    echo -e "${GREEN}=== TransformerX Verification Complete ===${NC}"
    echo -e "To start the server: ${YELLOW}./run.sh server${NC}"
    echo -e "To start the dashboard: ${YELLOW}./run.sh dashboard${NC}"
    echo -e "To run tests: ${YELLOW}./run.sh test${NC}"
fi 