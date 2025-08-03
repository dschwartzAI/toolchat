#!/bin/bash

# Restart script for AI Business Tools Platform

set -e

echo "🔄 Restarting AI Business Tools Platform services..."

# Change to LibreChat directory
cd LibreChat

# Stop all services
echo "🛑 Stopping services..."
docker-compose down

# Start services again
echo "🚀 Starting services..."
docker-compose up -d

# Check status
echo "✅ Services restarted!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access the platform at: http://localhost:3080" 