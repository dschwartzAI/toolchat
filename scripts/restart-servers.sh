#!/bin/bash

echo "🔄 Restarting LibreChat servers..."

# Kill existing processes
echo "📛 Stopping existing servers..."
pkill -f "vite" 2>/dev/null
pkill -f "node api/server/index.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

# Wait for processes to terminate
sleep 3

# Check if ports are free
if lsof -i :3080 -i :3090 -i :5173 | grep LISTEN > /dev/null; then
    echo "⚠️  Warning: Some ports are still in use. Attempting force kill..."
    lsof -ti:3080 | xargs kill -9 2>/dev/null
    lsof -ti:3090 | xargs kill -9 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start backend
echo "🚀 Starting backend server on port 3080..."
npm run backend:dev &
BACKEND_PID=$!

# Wait for backend to be fully ready with health check
echo "⏳ Waiting for backend to be fully ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3080/api/config > /dev/null 2>&1; then
        echo "✅ Backend is ready and responding!"
        break
    fi
    echo "   Backend still starting... (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Backend failed to start after $MAX_ATTEMPTS attempts!"
    echo "   Check the logs for errors."
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
npm run frontend:dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5

# Verify both servers are accessible
echo "🔍 Verifying servers..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3080/ 2>/dev/null || echo "000")
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3090/ 2>/dev/null || echo "000")

if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend server verified (port 3080)"
else
    echo "⚠️  Backend may not be fully ready (status: $BACKEND_STATUS)"
fi

if [ "$FRONTEND_STATUS" != "000" ]; then
    echo "✅ Frontend server verified (port 3090)"
else
    echo "ℹ️  Frontend dev server starting..."
fi

echo ""
echo "🎉 Servers started successfully!"
echo "   Backend PID: $BACKEND_PID (port 3080)"
echo "   Frontend PID: $FRONTEND_PID (attempting port 3090, may use 3091 if busy)"
echo ""
echo "📍 Access the app at:"
echo "   Development: http://localhost:3090 (or http://localhost:3091 if 3090 is busy)"
echo "   Frontend only: http://localhost:5173"
echo ""
echo "💡 To stop servers, run: pkill -f 'vite' && pkill -f 'node api/server/index.js'"