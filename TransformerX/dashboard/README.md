# TransformerX Dashboard

This directory contains the web interface for the TransformerX project.

## Overview

The dashboard provides a visual interface for:

1. Monitoring EEG signal processing
2. Visualizing neural classifications
3. Controlling the LLaMA interface
4. Viewing neural-guided text generation

## Docker Deployment Options

The dashboard can be deployed using Docker in two ways:

### 1. NGINX-Based Dashboard (Recommended)

This option uses NGINX to serve the dashboard files, providing production-ready performance with compression, caching, and API proxying.

```bash
# Start only the dashboard
./scripts/docker_run.sh dashboard

# Start with both server and dashboard
./scripts/docker_run.sh full

# Customize port
./scripts/docker_run.sh dashboard --dash-port 8000

# Use dark theme
./scripts/docker_run.sh dashboard --theme dark
```

### 2. Simple Python-Based Dashboard (Fallback)

This option uses Python's built-in HTTP server for simpler deployment, useful as a fallback if you encounter issues with the NGINX version.

```bash
# Start only the simple dashboard
./scripts/docker_run.sh simple-dash

# Start with both server and simple dashboard
./scripts/docker_run.sh full-simple

# Customize port
./scripts/docker_run.sh simple-dash --simple-port 8000
```

## Troubleshooting

If you encounter issues with the dashboard:

1. Check if the server is running and healthy
2. Verify network connectivity between containers
3. Check browser console for any JavaScript errors
4. Try the simple dashboard as a fallback option
5. Check the logs with `docker-compose logs dashboard`

## Development

For local development without Docker:

```bash
# Navigate to dashboard directory
cd dashboard

# Start a simple HTTP server
python -m http.server 3000
```

You'll need to configure the API URL to point to your backend server by editing `js/config.js` or using the provided environment variable substitution in Docker. 