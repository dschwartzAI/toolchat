#!/bin/bash

# Development Server Restart Script
# Handles proper cleanup of ports and compiled code

echo "🧹 Cleaning up existing processes..."

# Kill any existing backend processes
pkill -f "node api/server" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Kill any existing frontend processes
pkill -f "vite" 2>/dev/null || true

# Kill processes on specific ports if still hanging
lsof -ti:3080 | xargs kill -9 2>/dev/null || true
lsof -ti:3090 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "⏳ Waiting for ports to be released..."
sleep 3

echo "🔨 Rebuilding packages to ensure latest code..."
# Rebuild API package to ensure exports are current
npm run build:api

echo "🚀 Starting backend server..."
npm run backend:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to initialize..."
sleep 10

# Check if backend started successfully
if curl -s http://localhost:3080/api/config > /dev/null; then
    echo "✅ Backend running on port 3080"
else
    echo "❌ Backend failed to start. Check /tmp/backend.log"
    tail -20 /tmp/backend.log
    exit 1
fi

echo "🚀 Starting frontend server..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to initialize..."
sleep 5

# Check if frontend is accessible
if curl -s http://localhost:3090 > /dev/null 2>/dev/null || curl -s http://localhost:5173 > /dev/null 2>/dev/null; then
    echo "✅ Frontend running"
else
    echo "⚠️  Frontend may still be starting. Check /tmp/frontend.log"
fi

echo ""
echo "🎉 Development servers started!"
echo "   Backend:  http://localhost:3080"
echo "   Frontend: http://localhost:3090 (or http://localhost:5173)"
echo ""
echo "📝 Logs available at:"
echo "   Backend:  /tmp/backend.log"
echo "   Frontend: /tmp/frontend.log"
echo ""
echo "To stop servers, run: pkill -f 'node api/server' && pkill -f vite"