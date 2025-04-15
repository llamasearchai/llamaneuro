# Docker Setup for TransformerX

This document explains how to use Docker with TransformerX for development, testing, and deployment.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Docker Images

TransformerX includes several Docker configurations for different purposes:

1. **Base Image (Dockerfile)**: Production-ready image with minimal dependencies and multi-stage build
2. **Development Image (Dockerfile.dev)**: Full development environment with debugging tools
3. **Jupyter Image (Dockerfile.jupyter)**: For data analysis and interactive development

## Quick Start with Docker

The easiest way to use Docker is with the provided script:

```bash
# Build and start the production server
./scripts/docker_run.sh start

# Start in development mode
./scripts/docker_run.sh dev

# Start the web dashboard
./scripts/docker_run.sh dashboard

# Start both server and dashboard
./scripts/docker_run.sh full

# Start Jupyter notebook
./scripts/docker_run.sh notebook

# Run tests
./scripts/docker_run.sh test
```

## Docker Compose Services

### Production Server

```bash
docker-compose up transformerx
```

This starts the production server with:
- Port 8080 exposed for the API
- Mounted volumes for models, logs, and configuration
- Optimized for production use
- Health check for monitoring server status

### Development Server

```bash
docker-compose up dev
```

This starts the development server with:
- Hot-reloading enabled
- Debugging tools available
- Full access to the codebase
- Port 8081 exposed to avoid conflicts with other services

### Dashboard Web Interface (NGINX-based)

```bash
docker-compose up dashboard
```

This starts the NGINX-based web dashboard with:
- Efficient static file serving with compression and caching
- API proxying to backend server
- Port 3000 exposed for the web interface
- Environment variable substitution for configuration
- Dependent on the backend service with health check

### Simple Dashboard (Python-based)

```bash
docker-compose up simple-dashboard
```

This starts a simple Python-based dashboard with:
- Basic HTTP server for serving the dashboard frontend
- Port 3001 exposed for the web interface
- Configured to communicate with the backend API
- Fallback option if NGINX dashboard has issues

### Jupyter Notebook

```bash
docker-compose up notebook
```

This starts a Jupyter Lab server with:
- Scientific libraries pre-installed
- Access to the full codebase
- Port 8888 exposed for the web interface
- Custom notebooks directory mounted

### Test Runner

```bash
docker-compose run test
```

This runs tests using tox in a containerized environment.

## Manual Docker Commands

### Building Images

```bash
# Build all images
docker-compose build

# Build a specific image
docker-compose build transformerx

# Build with custom tag
./scripts/build_docker.sh --tag v1.0.0
```

### Starting Services

```bash
# Start all services in the background
docker-compose up -d

# Start a specific service
docker-compose up -d transformerx
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop a specific service
docker-compose stop transformerx
```

### Viewing Logs

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs transformerx

# Follow logs
docker-compose logs -f
```

## Advanced Features

### Docker Entrypoint

The production image uses a custom entrypoint script (`docker-entrypoint.sh`) that:

1. Creates necessary directories
2. Waits for dependent services if configured
3. Runs migrations or other setup tasks if needed
4. Detects development/production mode
5. Launches the application with appropriate settings

You can customize the behavior with environment variables:

```bash
# Wait for a dependent service
docker-compose run -e WAIT_FOR_HOST=database -e WAIT_FOR_PORT=5432 transformerx
```

### Multi-Stage Builds

The production Dockerfile uses multi-stage builds to:

1. Create a smaller, more optimized image
2. Separate build dependencies from runtime dependencies
3. Improve security with a non-root user
4. Include health checks for better container orchestration

### Custom Networks

Services are connected through a dedicated network (`transformerx-network`), enabling:

1. Service discovery using container names as hostnames
2. Isolated communication between services
3. Better security through network segmentation

## Customizing Docker Builds

### Environment Variables

You can customize the Docker builds by setting environment variables:

```bash
# Set debug mode
DEBUG=true docker-compose up transformerx

# Set custom port
PORT=9000 docker-compose up transformerx

# Set custom dashboard port
DASHBOARD_PORT=8000 docker-compose up dashboard
```

### Custom Configuration

To use a custom configuration file:

1. Create your configuration file in `server/config/custom.json`
2. Mount it in the Docker container:

```bash
docker-compose run -v $(pwd)/server/config/custom.json:/app/server/config/custom.json transformerx
```

## Testing the Docker Setup

You can verify your Docker setup using the provided test script:

```bash
./scripts/test_docker.sh
```

This checks:
1. Docker and Docker Compose installation
2. Dockerfile validation
3. docker-compose.yml validation
4. Basic image building and running
5. Network connectivity

## CI/CD Integration

The repository includes GitHub Actions workflows for:

1. Building and testing Docker images
2. Running security scans on images
3. Testing with docker-compose

See `.github/workflows/docker.yml` for the configuration.

## Troubleshooting

### Port Conflicts

If you encounter a port conflict:

```
Error response from daemon: Ports are not available: listen tcp 0.0.0.0:8080: bind: address already in use
```

You can change the port mapping in the `docker-compose.yml` file or start the service with a different port:

```bash
PORT=8081 docker-compose up transformerx
```

### Volume Issues

If you have permission issues with mounted volumes:

```
ERROR: for transformerx  Cannot start service transformerx: error while creating mount source path: mkdir /path/to/models: permission denied
```

Ensure that the directories exist and have the correct permissions:

```bash
mkdir -p models logs
chmod -R 777 models logs
```

### Health Check Failures

If services fail health checks:

```
ERROR: for dashboard  Container "xxx" is unhealthy
```

Check the logs to diagnose the issue:

```bash
docker-compose logs transformerx
```

### Other Issues

If you encounter other issues, try rebuilding the images:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
``` 