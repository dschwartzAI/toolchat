#!/bin/bash

# AI Business Tools Platform - Post-Deployment Setup
# Run this after the platform is up and running

set -e

echo "🔧 Running post-deployment setup..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB connection..."
sleep 5

# Run agent configuration inside the LibreChat container
echo "🤖 Configuring business tool agents..."
docker-compose -f LibreChat/docker-compose.yml -f LibreChat/docker-compose.override.yml \
    exec api node /app/scripts/configure-agents.js

# Create initial admin user
echo "👤 Creating initial admin user..."
docker-compose -f LibreChat/docker-compose.yml -f LibreChat/docker-compose.override.yml \
    exec api node /app/scripts/migrate-users.js --create-admin

echo "✅ Post-deployment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Log in with the admin credentials"
echo "2. Create users for your team"
echo "3. Assign appropriate tiers (free/premium)"
echo "4. Start using the business tools!"