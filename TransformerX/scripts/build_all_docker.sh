#!/bin/bash

# Script to build all Docker images for TransformerX with optional registry pushing

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TAG="latest"
REGISTRY=""
PUSH=false
BUILD_ALL=true
PARALLEL=false

# Function to show help
show_help() {
    echo -e "${BLUE}TransformerX Docker Build Script${NC}"
    echo "Builds all Docker images for TransformerX"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --tag TAG           Specify image tag (default: latest)"
    echo "  -r, --registry REGISTRY Specify Docker registry (e.g., ghcr.io/username)"
    echo "  -p, --push              Push images to registry after building"
    echo "  --parallel              Build images in parallel"
    echo ""
    echo "Examples:"
    echo "  $0 --tag v1.0.0                               # Build with specific tag"
    echo "  $0 --registry ghcr.io/username --push         # Push to GitHub Container Registry"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Navigate to project root directory
cd "$(dirname "$0")/.." || exit 1

echo -e "${BLUE}Building all Docker images for TransformerX with tag: ${TAG}${NC}"

# Set registry prefix if provided
REGISTRY_PREFIX=""
if [ -n "$REGISTRY" ]; then
    REGISTRY_PREFIX="${REGISTRY}/"
    echo -e "${BLUE}Using registry: ${REGISTRY}${NC}"
fi

# Function to build and optionally push an image
build_and_push() {
    local dockerfile=$1
    local image_name=$2
    local tag=$3
    
    echo -e "${YELLOW}Building ${image_name}:${tag} from ${dockerfile}...${NC}"
    
    # Build the image
    docker build -t "${REGISTRY_PREFIX}${image_name}:${tag}" -f "$dockerfile" .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to build ${image_name}:${tag}${NC}"
        return 1
    else
        echo -e "${GREEN}Successfully built ${image_name}:${tag}${NC}"
    fi
    
    # Push if requested
    if [ "$PUSH" = true ]; then
        echo -e "${YELLOW}Pushing ${REGISTRY_PREFIX}${image_name}:${tag}...${NC}"
        docker push "${REGISTRY_PREFIX}${image_name}:${tag}"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to push ${REGISTRY_PREFIX}${image_name}:${tag}${NC}"
            return 1
        else
            echo -e "${GREEN}Successfully pushed ${REGISTRY_PREFIX}${image_name}:${tag}${NC}"
        fi
    fi
    
    return 0
}

# Define the images to build
IMAGES=(
    "Dockerfile:transformerx:${TAG}"
    "Dockerfile.dev:transformerx:dev-${TAG}"
    "Dockerfile.jupyter:transformerx:jupyter-${TAG}"
    "Dockerfile.dashboard:transformerx:dashboard-${TAG}"
)

# Build all images
success=true

if [ "$PARALLEL" = true ]; then
    echo -e "${BLUE}Building images in parallel...${NC}"
    pids=()
    
    # Start all builds in background
    for image_def in "${IMAGES[@]}"; do
        IFS=':' read -r dockerfile image_name image_tag <<< "$image_def"
        build_and_push "$dockerfile" "$image_name" "$image_tag" &
        pids+=($!)
    done
    
    # Wait for all builds to complete
    for pid in "${pids[@]}"; do
        wait $pid
        if [ $? -ne 0 ]; then
            success=false
        fi
    done
else
    echo -e "${BLUE}Building images sequentially...${NC}"
    for image_def in "${IMAGES[@]}"; do
        IFS=':' read -r dockerfile image_name image_tag <<< "$image_def"
        build_and_push "$dockerfile" "$image_name" "$image_tag"
        if [ $? -ne 0 ]; then
            success=false
        fi
    done
fi

# Summary
echo -e "${BLUE}=== Build Summary ===${NC}"
if [ "$success" = true ]; then
    echo -e "${GREEN}All images were built successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some images failed to build. Check the logs above for details.${NC}"
    exit 1
fi 