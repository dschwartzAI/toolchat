#!/bin/bash

echo "🔍 Checking AI Business Tools Platform setup..."

# Check if LibreChat directory exists
if [ ! -d "LibreChat" ]; then
    echo "❌ LibreChat directory not found"
    exit 1
fi

# Check required files
required_files=(
    "LibreChat/docker-compose.yml"
    "LibreChat/docker-compose.override.yml"
    "LibreChat/nginx.conf"
    "LibreChat/librechat.yaml"
    "LibreChat/.env"
    "LibreChat/ssl/cert.pem"
    "LibreChat/ssl/key.pem"
    "LibreChat/client/src/localization/custom-en.json"
    "LibreChat/api/middleware/tierAccess.js"
    "LibreChat/api/models/User.js"
    "LibreChat/api/routes/admin.js"
)

all_good=true

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        all_good=false
    else
        echo "✅ Found: $file"
    fi
done

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
else
    echo "❌ Docker is not installed"
    all_good=false
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed"
else
    echo "❌ Docker Compose is not installed"
    all_good=false
fi

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo "✅ Docker daemon is running"
else
    echo "⚠️  Docker daemon is not running"
fi

# Summary
echo ""
if [ "$all_good" = true ]; then
    echo "✅ Setup check completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the platform: ./scripts/start-platform.sh"
    echo "2. Configure agents: ./scripts/post-deploy-setup.sh"
else
    echo "❌ Setup check failed. Please fix the issues above."
    exit 1
fi