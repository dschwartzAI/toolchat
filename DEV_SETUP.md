# Development Setup - Working Solution

## The Problem
The development servers frequently fail to start properly or become inaccessible even when they appear to be running. This is due to process management issues and port conflicts.

## The Solution That Works

### Method 1: Using nohup (RECOMMENDED)
This method runs servers in the background and is most reliable:

```bash
# Start backend
cd /Users/danielschwartz/jk-ai/toolchat
nohup npm run backend:dev > backend.log 2>&1 &

# Wait a few seconds for backend to start
sleep 5

# Start frontend
nohup npm run frontend:dev > frontend.log 2>&1 &

# Wait for servers to be ready
sleep 10
```

### Method 2: Using the restart script
```bash
cd /Users/danielschwartz/jk-ai/toolchat
./scripts/restart-servers.sh
```

## Access URLs
- **Frontend**: http://localhost:3090
- **Backend API**: http://localhost:3080

## How to Check if Servers are Running

```bash
# Check frontend
curl -s http://localhost:3090 | head -5

# Check backend
curl -s http://localhost:3080/health
```

## If Connection Refused

1. Kill all existing processes:
```bash
pkill -f "vite"
pkill -f "node.*api/server"
pkill -f "nodemon"
```

2. Wait 2 seconds

3. Start servers using Method 1 above

## View Logs

```bash
# Backend logs
tail -f backend.log

# Frontend logs  
tail -f frontend.log
```

## Common Issues

### Port Already in Use
```bash
lsof -ti:3090 | xargs kill -9
lsof -ti:3080 | xargs kill -9
```

### Frontend can't connect to backend
Make sure backend starts FIRST and is ready before starting frontend.

## Hot Reloading
Both servers support hot reloading:
- Backend: Nodemon watches for changes in /api
- Frontend: Vite HMR for /client

Changes will automatically reload without restarting servers.