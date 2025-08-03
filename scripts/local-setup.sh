#!/bin/bash

# AI Business Tools Platform - Local Setup (Simplified)
# Based on LibreChat's recommended local setup

set -e

echo "🚀 Setting up AI Business Tools Platform locally..."

# Change to LibreChat directory
cd LibreChat

# Check if Docker Desktop is running
DOCKER_CMD="docker"
if ! command -v docker &> /dev/null; then
    if [ -x "/Applications/Docker.app/Contents/Resources/bin/docker" ]; then
        DOCKER_CMD="/Applications/Docker.app/Contents/Resources/bin/docker"
    elif [ -x "/usr/local/bin/docker" ]; then
        DOCKER_CMD="/usr/local/bin/docker"
    else
        echo "❌ Docker command not found."
        echo "Please make sure Docker Desktop is installed and running."
        echo "You may need to restart your terminal or Cursor."
        exit 1
    fi
fi

if ! $DOCKER_CMD info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running."
    echo "Please make sure Docker Desktop is fully started."
    echo "Look for the whale icon in your menu bar."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env from example..."
        cp .env.example .env
        echo "⚠️  Please edit .env with your API keys and MongoDB connection!"
    else
        echo "📝 Creating .env from our config..."
        cp ../.env .
    fi
fi

# Check if we need to update docker-compose.override.yml
if [ ! -f "docker-compose.override.yml" ]; then
    echo "📝 docker-compose.override.yml missing. Creating from backup..."
    cp ../docker-compose.override.yml .
fi

# Start LibreChat
echo "🐳 Starting LibreChat with business tools configuration..."
$DOCKER_CMD compose up -d

# Wait for services
echo "⏳ Waiting for services to start (this may take a few minutes on first run)..."
sleep 20

# Check status
if $DOCKER_CMD compose ps | grep -E "(running|Up)"; then
    echo ""
    echo "✅ AI Business Tools Platform is running!"
    echo ""
    echo "🌐 Access the platform at: http://localhost:3080"
    echo ""
    echo "📊 Service Status:"
    $DOCKER_CMD compose ps
    echo ""
    echo "📝 Next steps:"
    echo "1. Create an account at http://localhost:3080"
    echo "2. Contact admin to upgrade your tier for premium tools"
    echo "3. Start using the business tools!"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:  $DOCKER_CMD compose logs -f"
    echo "   Stop:       $DOCKER_CMD compose down"
    echo "   Restart:    $DOCKER_CMD compose restart"
else
    echo "❌ Services failed to start."
    echo "Check logs with: $DOCKER_CMD compose logs"
    exit 1
fi