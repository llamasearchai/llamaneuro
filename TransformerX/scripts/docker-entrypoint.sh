#!/bin/bash

set -e

# Print environment information
echo "TransformerX Docker Entrypoint"
echo "------------------------------"
echo "Python version: $(python --version)"
echo "Environment: ${FLASK_ENV:-production}"
echo "Debug mode: ${DEBUG:-false}"
echo "Server port: ${PORT:-8080}"
echo "Dashboard port: ${DASHBOARD_PORT:-3000}"

# Create necessary directories if they don't exist
mkdir -p /app/logs
mkdir -p /app/models

# Wait for dependent services if needed
wait_for_service() {
  local host="$1"
  local port="$2"
  local service="$3"
  local max_attempts=30
  local attempt=0
  
  echo "Waiting for $service at $host:$port..."
  
  while ! nc -z "$host" "$port" >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Error: $service not available after $max_attempts attempts"
      exit 1
    fi
    echo "Attempt $attempt/$max_attempts: $service not available yet, waiting..."
    sleep 2
  done
  
  echo "$service is available at $host:$port"
}

# If any environment vars are set for waiting for services, use them
if [ -n "$WAIT_FOR_HOST" ] && [ -n "$WAIT_FOR_PORT" ]; then
  wait_for_service "$WAIT_FOR_HOST" "$WAIT_FOR_PORT" "${WAIT_FOR_SERVICE:-dependent service}"
fi

# Handle database migrations or other setup tasks if needed
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running database migrations..."
  python server/migrate.py
fi

# Handle environment variables for command line arguments
SERVER_ARGS=""

# Add host if set
if [ -n "$HOST" ]; then
  SERVER_ARGS="$SERVER_ARGS --host $HOST"
else
  SERVER_ARGS="$SERVER_ARGS --host 0.0.0.0"
fi

# Add port if set
if [ -n "$PORT" ]; then
  SERVER_ARGS="$SERVER_ARGS --port $PORT"
fi

# Add debug flag if enabled
if [ "${FLASK_ENV:-production}" = "development" ] || [ "${DEBUG:-false}" = "true" ]; then
  SERVER_ARGS="$SERVER_ARGS --debug"
  echo "Starting server in development mode..."
  exec python server/run_server.py $SERVER_ARGS "$@"
else
  echo "Starting server in production mode..."
  exec python server/run_server.py $SERVER_ARGS "$@"
fi 