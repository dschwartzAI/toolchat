#!/bin/bash

# Restore LibreChat to Golden Working State
# Updated: 2025-01-09
# Latest Golden Version: v1.2

set -e

echo "🔄 LibreChat Golden State Restore Script v2"
echo "==========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📋 Available golden versions:"
echo ""
echo "1. v1.2 - Latest (Endpoint switching fixed)"
echo "   - Git: 8a1a811 (tagged as v1.2-endpoint-fixed)"
echo "   - Fixes: Can switch between assistants and agents"
echo ""
echo "2. v1.1 - Logo fixed"
echo "   - Git: d2e65fa (tagged as v1.1-logo-fixed)"  
echo "   - Fixes: Uses transparent_sovereign.png"
echo ""
echo "3. v1.0 - Initial golden state"
echo "   - Git: 27f2499 (tagged as v1.0-working)"
echo "   - Image ID: a2b99f2e016a"
echo ""

read -p "Select version to restore (1-3): " version

case $version in
    1)
        TAG="v1.2"
        GIT_TAG="v1.2-endpoint-fixed"
        ;;
    2)
        TAG="v1.1"
        GIT_TAG="v1.1-logo-fixed"
        ;;
    3)
        TAG="v1.0"
        GIT_TAG="v1.0-working"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "📋 Restore method:"
echo "1. Use existing Docker image (librechat-custom:$TAG)"
echo "2. Rebuild from Git tag ($GIT_TAG)"
echo ""

read -p "Select method (1-2): " method

case $method in
    1)
        echo "🔍 Checking for Docker image librechat-custom:$TAG..."
        if docker image inspect librechat-custom:$TAG > /dev/null 2>&1; then
            echo "✅ Found image"
            docker tag librechat-custom:$TAG librechat-custom:latest
        else
            echo "❌ Image librechat-custom:$TAG not found"
            echo "💡 Try option 2 to rebuild from Git"
            exit 1
        fi
        ;;
    2)
        echo "🔍 Restoring from Git tag $GIT_TAG..."
        cd "$(dirname "$0")/.."
        
        # Save current state
        current_branch=$(git branch --show-current)
        echo "📌 Current branch: $current_branch"
        
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            echo "⚠️  You have uncommitted changes. Stashing them..."
            git stash push -m "Backup before restore to $GIT_TAG"
        fi
        
        # Checkout golden state
        echo "🔄 Checking out $GIT_TAG..."
        git checkout $GIT_TAG
        
        # Rebuild image
        cd LibreChat
        echo "🔨 Building Docker image (this will take 5-7 minutes)..."
        docker compose build api
        
        # Tag the build
        docker tag librechat-custom:latest librechat-custom:$TAG
        
        # Return to original branch
        echo "🔄 Returning to $current_branch..."
        cd ..
        git checkout $current_branch
        
        # Restore stashed changes if any
        if git stash list | grep -q "Backup before restore"; then
            echo "📌 Restoring stashed changes..."
            git stash pop || echo "⚠️  Could not restore stash automatically"
        fi
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🔄 Restarting services..."
cd "$(dirname "$0")/../LibreChat"

# Stop services
docker compose down

# Start with restored image
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."
docker compose ps

echo ""
echo "✅ Restore complete!"
echo ""
echo "🌐 Access LibreChat at: http://localhost:3090"
echo ""
echo "📝 What's working in $TAG:"
case $TAG in
    "v1.2")
        echo "- ✅ Endpoint switching between assistants and agents"
        echo "- ✅ YAML configuration tracked in Git"
        echo "- ✅ Logo displays correctly (transparent_sovereign.png)"
        echo "- ✅ All UI customizations"
        ;;
    "v1.1")
        echo "- ✅ Logo displays correctly (transparent_sovereign.png)"
        echo "- ✅ All UI customizations"
        echo "- ⚠️  Endpoint switching may not work properly"
        ;;
    "v1.0")
        echo "- ✅ All UI customizations"
        echo "- ⚠️  Logo may not display correctly"
        echo "- ⚠️  Endpoint switching may not work properly"
        ;;
esac
echo ""
echo "💡 Tips:"
echo "- Clear browser cache if you see old UI"
echo "- Check logs: docker compose logs api"
echo "- List all golden images: docker images | grep librechat-custom"