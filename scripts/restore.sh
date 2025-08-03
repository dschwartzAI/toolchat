#!/bin/bash

# Script to restore to previous LibreChat versions
# Usage: ./restore.sh [version]

set -e

HOST_DIR="/Users/danielschwartz/jk-ai/jk-ai"

# Check if version provided
if [ $# -eq 0 ]; then
    echo "Usage: ./restore.sh [version]"
    echo "Available versions:"
    echo "  v1.0 - Initial custom build"
    echo "  v1.1 - With localStorage migration"
    echo "  v1.2 - Fixed endpoint switching and agent selection"
    echo "  v1.3 - Fixed agent_id handling in conversation"
    echo "  v1.4 - Fixed template stripping for param endpoints"
    echo "  v1.5 - Fixed buildDefault conditional for agents"
    exit 1
fi

VERSION=$1

# Navigate to LibreChat directory
cd "${HOST_DIR}/LibreChat"

case $VERSION in
    # v1.0 - Initial custom build with UI customizations
    "v1.0")
        echo "Restoring v1.0..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.0
        docker start librechat-nginx
        echo "✅ Restored to v1.0"
        ;;
    
    # v1.1 - With localStorage migration
    "v1.1")
        echo "Restoring v1.1..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.1
        docker start librechat-nginx
        echo "✅ Restored to v1.1"
        ;;
    
    # v1.2 - Fixed endpoint switching and agent selection
    "v1.2")
        echo "Restoring v1.2..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.2
        docker start librechat-nginx
        echo "✅ Restored to v1.2"
        ;;
    
    # v1.3 - Fixed agent_id handling in conversation
    "v1.3")
        echo "Restoring v1.3..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.3
        docker start librechat-nginx
        echo "✅ Restored to v1.3"
        ;;
    
    # v1.4 - Fixed template stripping for param endpoints
    "v1.4")
        echo "Restoring v1.4..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.4
        docker start librechat-nginx
        echo "✅ Restored to v1.4"
        ;;
    
    # v1.5 - Fixed buildDefault conditional for agents
    "v1.5")
        echo "Restoring v1.5..."
        docker stop LibreChat librechat-nginx
        docker run --rm -d --name LibreChat \
            --env-file .env \
            -p 3080:3080 \
            -v "${HOST_DIR}/LibreChat/logs:/app/api/logs" \
            -v "${HOST_DIR}/LibreChat/uploads:/app/client/public/uploads" \
            -v "${HOST_DIR}/LibreChat/images:/app/client/public/images" \
            -v "${HOST_DIR}/LibreChat/.env:/app/.env" \
            -v "${HOST_DIR}/LibreChat/librechat.yaml:/app/librechat.yaml" \
            --network librechat_default \
            --restart always \
            darkjk/librechat:v1.5
        docker start librechat-nginx
        echo "✅ Restored to v1.5"
        ;;
    
    *)
        echo "Unknown version: $VERSION"
        echo "Available versions: v1.0, v1.1, v1.2, v1.3, v1.4, v1.5"
        exit 1
        ;;
esac