#!/bin/bash

# AI Business Tools Platform - Start Script
# This script starts the LibreChat deployment with business configurations

set -e

echo "🚀 Starting AI Business Tools Platform..."

# Change to LibreChat directory
cd LibreChat

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in LibreChat directory."
    echo "Please copy config/.env to LibreChat/.env first."
    exit 1
fi

# Check if librechat.yaml exists
if [ ! -f "librechat.yaml" ]; then
    echo "❌ librechat.yaml not found in LibreChat directory."
    echo "Please copy config/librechat.yaml to LibreChat/librechat.yaml first."
    exit 1
fi

# Start the services
echo "🐳 Starting Docker services..."
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🌐 Access the platform at:"
    echo "   HTTP:  http://localhost:3080"
    echo "   HTTPS: https://localhost (with nginx proxy)"
    echo ""
    echo "📊 Service Status:"
    docker compose ps
    echo ""
    echo "📋 To view logs: docker compose logs -f"
    echo "🛑 To stop: docker compose down"
else
    echo "❌ Services failed to start. Check logs with: docker compose logs"
    exit 1
fi