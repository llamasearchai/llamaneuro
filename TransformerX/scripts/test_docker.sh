#!/bin/bash

# Script to test Docker setup and functionality for TransformerX

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose; then
    echo -e "${YELLOW}Warning: Docker Compose is not installed. Some tests will be skipped.${NC}"
    DOCKER_COMPOSE_AVAILABLE=false
else
    DOCKER_COMPOSE_AVAILABLE=true
fi

# Navigate to project root directory
cd "$(dirname "$0")/.." || exit 1

echo -e "${BLUE}=== TransformerX Docker Test Script ===${NC}"
echo -e "${BLUE}Testing Docker setup and functionality...${NC}"

# Test 1: Check Docker version
echo -e "\n${YELLOW}Test 1: Checking Docker version${NC}"
docker --version
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker is properly installed${NC}"
else
    echo -e "${RED}✗ Failed to get Docker version${NC}"
    exit 1
fi

# Test 2: Check Docker Compose version (if available)
if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
    echo -e "\n${YELLOW}Test 2: Checking Docker Compose version${NC}"
    docker-compose --version
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Docker Compose is properly installed${NC}"
    else
        echo -e "${RED}✗ Failed to get Docker Compose version${NC}"
        DOCKER_COMPOSE_AVAILABLE=false
    fi
else
    echo -e "\n${YELLOW}Test 2: Skipping Docker Compose version check${NC}"
fi

# Test 3: Check if Dockerfile exists
echo -e "\n${YELLOW}Test 3: Checking if Dockerfile exists${NC}"
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✓ Dockerfile exists${NC}"
else
    echo -e "${RED}✗ Dockerfile not found${NC}"
    exit 1
fi

# Test 4: Check if docker-compose.yml exists
echo -e "\n${YELLOW}Test 4: Checking if docker-compose.yml exists${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml exists${NC}"
else
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
fi

# Test 5: Validate docker-compose.yml
if [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
    echo -e "\n${YELLOW}Test 5: Validating docker-compose.yml${NC}"
    docker-compose config > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ docker-compose.yml is valid${NC}"
    else
        echo -e "${RED}✗ docker-compose.yml is invalid${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}Test 5: Skipping docker-compose.yml validation${NC}"
fi

# Test 6: Build test image
echo -e "\n${YELLOW}Test 6: Building test Docker image${NC}"
docker build -t transformerx:test -f Dockerfile . --target=test 2>/dev/null || docker build -t transformerx:test -f Dockerfile .
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully built test Docker image${NC}"
else
    echo -e "${RED}✗ Failed to build test Docker image${NC}"
    exit 1
fi

# Test 7: Run a simple test in Docker
echo -e "\n${YELLOW}Test 7: Running a simple test in Docker${NC}"
docker run --rm transformerx:test python -c "print('Docker test successful!')"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully ran a test in Docker${NC}"
else
    echo -e "${RED}✗ Failed to run a test in Docker${NC}"
    exit 1
fi

# Test 8: Check if Docker network works
echo -e "\n${YELLOW}Test 8: Testing Docker networking${NC}"
docker run --rm transformerx:test python -c "import socket; socket.gethostbyname('google.com'); print('Network test successful!')"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker networking is working${NC}"
else
    echo -e "${RED}✗ Docker networking test failed${NC}"
    echo -e "${YELLOW}  This might be due to network restrictions or firewall settings${NC}"
fi

# Test 9: Clean up test image
echo -e "\n${YELLOW}Test 9: Cleaning up test image${NC}"
docker rmi transformerx:test
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully removed test image${NC}"
else
    echo -e "${RED}✗ Failed to remove test image${NC}"
fi

echo -e "\n${BLUE}=== Docker Test Summary ===${NC}"
echo -e "${GREEN}All essential Docker tests completed.${NC}"
echo -e "${YELLOW}To run the full TransformerX system with Docker:${NC}"
echo -e "  ./scripts/docker_run.sh start"
echo -e "${YELLOW}For development:${NC}"
echo -e "  ./scripts/docker_run.sh dev"
echo -e "${YELLOW}For Jupyter notebook:${NC}"
echo -e "  ./scripts/docker_run.sh notebook" 