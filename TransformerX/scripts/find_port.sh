#!/bin/bash

# Find an available network port starting from a base port
# Usage: ./find_port.sh [base_port] [max_attempts]

# Default values
BASE_PORT=${1:-8000}
MAX_ATTEMPTS=${2:-20}

# Function to check if a port is in use
port_in_use() {
    if command -v nc >/dev/null 2>&1; then
        nc -z localhost "$1" >/dev/null 2>&1
        return $?
    elif command -v lsof >/dev/null 2>&1; then
        lsof -i:"$1" >/dev/null 2>&1
        return $?
    else
        # Fallback method
        (echo >/dev/tcp/localhost/"$1") >/dev/null 2>&1
        return $?
    fi
}

# Find an available port
for (( i=0; i<MAX_ATTEMPTS; i++ )); do
    port=$((BASE_PORT + i))
    if ! port_in_use "$port"; then
        echo "$port"
        exit 0
    fi
done

# If no available port found
echo "Error: No available ports found in range $BASE_PORT-$((BASE_PORT + MAX_ATTEMPTS - 1))" >&2
exit 1 