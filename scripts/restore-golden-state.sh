#!/bin/bash

# Restore LibreChat to Golden Working State
# Created: 2025-01-09
# Golden Image ID: a2b99f2e016a

set -e

echo "🔄 LibreChat Golden State Restore Script"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Configuration
GOLDEN_IMAGE_ID="a2b99f2e016a"
GOLDEN_TAG="v1.0"
BACKUP_DATE="20250109"

echo "📋 Available restore options:"
echo "1. Restore from golden image ID ($GOLDEN_IMAGE_ID)"
echo "2. Restore from v1.0 tag"
echo "3. Restore from backup-$BACKUP_DATE"
echo "4. Restore from git tag (v1.0-working)"

read -p "Select option (1-4): " option

case $option in
    1)
        echo "🔍 Checking for golden image..."
        if docker images -q $GOLDEN_IMAGE_ID > /dev/null 2>&1; then
            echo "✅ Found golden image"
            docker tag $GOLDEN_IMAGE_ID librechat-custom:latest
            docker tag $GOLDEN_IMAGE_ID librechat-custom:v1.0
        else
            echo "❌ Golden image not found"
            exit 1
        fi
        ;;
    2)
        echo "🔍 Restoring from v1.0 tag..."
        docker tag librechat-custom:v1.0 librechat-custom:latest
        ;;
    3)
        echo "🔍 Restoring from backup..."
        docker tag librechat-custom:backup-$BACKUP_DATE librechat-custom:latest
        docker tag librechat-custom:backup-$BACKUP_DATE librechat-custom:v1.0
        ;;
    4)
        echo "🔍 Restoring from git..."
        cd "$(dirname "$0")/.."
        
        # Save current state
        current_branch=$(git branch --show-current)
        git stash push -m "Backup before restore"
        
        # Checkout golden state
        git checkout v1.0-working
        
        # Rebuild image
        cd LibreChat
        echo "🔨 Building Docker image (this will take a few minutes)..."
        docker compose build api
        
        # Return to original branch
        git checkout $current_branch
        git stash pop || true
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
echo "📝 Notes:"
echo "- All UI customizations should be restored"
echo "- Your data in MongoDB Atlas is unchanged"
echo "- If you see any issues, check logs with: docker compose logs api"