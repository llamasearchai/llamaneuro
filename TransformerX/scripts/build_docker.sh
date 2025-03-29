#!/bin/bash

# Script to build Docker images for TransformerX

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

# Display help
show_help() {
    echo -e "${BLUE}TransformerX Docker Build Script${NC}"
    echo -e "Usage: $0 [OPTIONS]"
    echo -e ""
    echo -e "Options:"
    echo -e "  -h, --help       Show this help message"
    echo -e "  -a, --all        Build all Docker images"
    echo -e "  -p, --prod       Build only production image"
    echo -e "  -d, --dev        Build only development image"
    echo -e "  -j, --jupyter    Build only Jupyter image"
    echo -e "  -t, --tag TAG    Specify a custom tag (default: latest)"
    echo -e ""
    echo -e "Examples:"
    echo -e "  $0 --all                  # Build all images with 'latest' tag"
    echo -e "  $0 --prod --tag v1.0.0    # Build production image with 'v1.0.0' tag"
}

# Default values
BUILD_PROD=false
BUILD_DEV=false
BUILD_JUPYTER=false
TAG="latest"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -a|--all)
            BUILD_PROD=true
            BUILD_DEV=true
            BUILD_JUPYTER=true
            shift
            ;;
        -p|--prod)
            BUILD_PROD=true
            shift
            ;;
        -d|--dev)
            BUILD_DEV=true
            shift
            ;;
        -j|--jupyter)
            BUILD_JUPYTER=true
            shift
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# If no build option is specified, build all
if [[ "$BUILD_PROD" == "false" && "$BUILD_DEV" == "false" && "$BUILD_JUPYTER" == "false" ]]; then
    BUILD_PROD=true
    BUILD_DEV=true
    BUILD_JUPYTER=true
fi

# Navigate to project root directory
cd "$(dirname "$0")/.." || exit 1

# Build production image
if [[ "$BUILD_PROD" == "true" ]]; then
    echo -e "${BLUE}Building production image: transformerx:${TAG}${NC}"
    docker build -t "transformerx:${TAG}" -f Dockerfile .
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}Successfully built production image: transformerx:${TAG}${NC}"
    else
        echo -e "${RED}Failed to build production image${NC}"
        exit 1
    fi
fi

# Build development image
if [[ "$BUILD_DEV" == "true" ]]; then
    echo -e "${BLUE}Building development image: transformerx:dev-${TAG}${NC}"
    docker build -t "transformerx:dev-${TAG}" -f Dockerfile.dev .
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}Successfully built development image: transformerx:dev-${TAG}${NC}"
    else
        echo -e "${RED}Failed to build development image${NC}"
        exit 1
    fi
fi

# Build Jupyter image
if [[ "$BUILD_JUPYTER" == "true" ]]; then
    echo -e "${BLUE}Building Jupyter image: transformerx:jupyter-${TAG}${NC}"
    docker build -t "transformerx:jupyter-${TAG}" -f Dockerfile.jupyter .
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}Successfully built Jupyter image: transformerx:jupyter-${TAG}${NC}"
    else
        echo -e "${RED}Failed to build Jupyter image${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}All requested Docker images have been built successfully!${NC}"
echo -e "${YELLOW}To run the images, use:${NC}"
echo -e "  docker run -p 8080:8080 transformerx:${TAG}                # For production"
echo -e "  docker run -p 8081:8080 transformerx:dev-${TAG}            # For development"
echo -e "  docker run -p 8888:8888 transformerx:jupyter-${TAG}        # For Jupyter"
echo -e "${YELLOW}Or use docker-compose:${NC}"
echo -e "  docker-compose up transformerx                             # For production"
echo -e "  docker-compose up dev                                      # For development"
echo -e "  docker-compose up notebook                                 # For Jupyter" 