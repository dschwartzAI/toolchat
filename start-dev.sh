#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Starting LibreChat Development Environment${NC}"

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "vite" 2>/dev/null
pkill -f "node.*api/server" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
sleep 2

# Start backend
echo -e "${GREEN}🚀 Starting backend server on port 3080...${NC}"
npm run backend:dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3080/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${GREEN}🎨 Starting frontend server on port 3090...${NC}"
npm run frontend:dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
sleep 5

echo -e "${GREEN}✨ Development environment is ready!${NC}"
echo -e "${GREEN}📍 Frontend: http://localhost:3090${NC}"
echo -e "${GREEN}📍 Backend API: http://localhost:3080${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Keep script running and handle cleanup
trap "echo -e '\n${YELLOW}Shutting down servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; pkill -f vite; pkill -f nodemon; exit" INT

# Wait for processes
wait