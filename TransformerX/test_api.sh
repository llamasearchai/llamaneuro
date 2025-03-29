#!/bin/bash

# TransformerX API Test Script
# This script tests the API functionality of the TransformerX server

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SERVER_URL="http://localhost:8080"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --url)
            SERVER_URL="$2"
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
            echo "  --url URL       Set the server URL (default: http://localhost:8080)"
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

# Check for curl
if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}Error: curl is not installed. Please install curl to run this script.${NC}"
    exit 1
fi

# Initialize test counts
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to make API requests
make_request() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="$3"
    local expected_status="${4:-200}"
    
    local full_url="${SERVER_URL}${endpoint}"
    ((TESTS_TOTAL++))
    
    echo -e "${YELLOW}Testing ${method} ${endpoint}...${NC}"
    
    local status_code
    local response
    
    if [ "$method" = "GET" ]; then
        if [ "$VERBOSE" = true ]; then
            response=$(curl -s -w "\n%{http_code}" "$full_url")
        else
            response=$(curl -s -w "\n%{http_code}" "$full_url" 2>/dev/null)
        fi
    else
        if [ -n "$data" ]; then
            if [ "$VERBOSE" = true ]; then
                response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$full_url")
            else
                response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$full_url" 2>/dev/null)
            fi
        else
            if [ "$VERBOSE" = true ]; then
                response=$(curl -s -w "\n%{http_code}" -X "$method" "$full_url")
            else
                response=$(curl -s -w "\n%{http_code}" -X "$method" "$full_url" 2>/dev/null)
            fi
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$ d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ Test passed (Status: $status_code)${NC}"
        ((TESTS_PASSED++))
        
        if [ "$VERBOSE" = true ]; then
            echo "Response:"
            echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
            echo ""
        fi
        
        return 0
    else
        echo -e "${RED}✗ Test failed (Expected: $expected_status, Got: $status_code)${NC}"
        ((TESTS_FAILED++))
        
        echo "Response:"
        echo "$body" | python -m json.tool 2>/dev/null || echo "$body"
        echo ""
        
        return 1
    fi
}

echo -e "${BLUE}=== TransformerX API Test Script ===${NC}"
echo -e "Testing server at ${SERVER_URL}"
echo ""

# Test 1: Status endpoint
make_request "/api/v1/status"

# Test 2: Neural processor status
make_request "/api/v1/neuro/status"

# Test 3: Start neural processor
make_request "/api/v1/neuro/start" "POST"

# Test 4: Get neural data
make_request "/api/v1/neuro/data"

# Test 5: Stop neural processor
make_request "/api/v1/neuro/stop" "POST"

# Test 6: LLaMA status
make_request "/api/v1/llama/status"

# Test 7: Start LLaMA
make_request "/api/v1/llama/start" "POST"

# Test 8: Generate text with LLaMA
make_request "/api/v1/llama/generate" "POST" '{"prompt": "Hello, world!", "max_tokens": 10}'

# Test 9: Stop LLaMA
make_request "/api/v1/llama/stop" "POST"

# Test 10: Neural LLaMA integration
make_request "/api/v1/neural_llama" "POST" '{"prompt": "Testing neural guidance", "max_tokens": 10}'

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "Total tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi 