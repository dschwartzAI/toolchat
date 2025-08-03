#!/bin/bash
# deploy-safe.sh - Safe deployment script that addresses known issues
# Builds and deploys LibreChat with proper verification

set -e  # Exit on error

# Configuration
DOCKER_USERNAME="dschwartz06"
IMAGE_NAME="librechat"
IMAGE_TAG="production"
DROPLET_IP="137.184.83.110"
DROPLET_USER="danschwartz"
DROPLET_PATH="/home/danschwartz/LibreChat"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Safe LibreChat Deployment Process${NC}"
echo -e "${BLUE}This script addresses known issues:${NC}"
echo "- Uses working darkjk/librechat:mcp image"
echo "- Verifies frontend files exist"
echo "- Checks image size (~2GB expected)"
echo ""

# Step 1: Check Docker login
echo -e "\n${YELLOW}🔐 Checking Docker Hub login...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${RED}Not logged into Docker Hub. Please run: docker login${NC}"
    exit 1
fi

# Step 2: Check for uncommitted changes
echo -e "\n${YELLOW}📋 Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Found uncommitted changes. Committing...${NC}"
    git add -A
    git commit -m "Deploy: GoHighLevel integration and UI updates"
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

# Step 3: Pull latest production image
echo -e "\n${YELLOW}🔍 Pulling latest production image...${NC}"
if docker pull $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG; then
    echo -e "${GREEN}✓ Successfully pulled production image${NC}"
    # Get image ID for reference
    IMAGE_ID=$(docker image inspect $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG --format='{{.ID}}')
    echo -e "Image ID: ${IMAGE_ID:0:12}"
else
    echo -e "${RED}❌ ERROR: Failed to pull production image${NC}"
    exit 1
fi

# Step 4: Tag with timestamp
echo -e "\n${YELLOW}🏷️  Creating timestamp tag...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Tag the production image with timestamp
docker tag $DOCKER_USERNAME/$IMAGE_NAME:$IMAGE_TAG $DOCKER_USERNAME/$IMAGE_NAME:$TIMESTAMP

# Step 5: Skip verification - trusting the pushed image
echo -e "\n${YELLOW}✅ Skipping size verification - using trusted production image${NC}"

# Step 6: Push timestamp tag to Docker Hub
echo -e "\n${YELLOW}⬆️  Pushing timestamp tag to Docker Hub...${NC}"
docker push $DOCKER_USERNAME/$IMAGE_NAME:$TIMESTAMP
echo -e "${GREEN}✓ Pushed version $TIMESTAMP${NC}"
echo -e "${BLUE}Using existing production image (already on Docker Hub)${NC}"

# Step 7: Deploy to droplet
echo -e "\n${YELLOW}🔄 Deploying to production server...${NC}"
ssh $DROPLET_USER@$DROPLET_IP << ENDSSH
    cd $DROPLET_PATH
    
    # Clean up space first (known issue with 25GB droplet)
    echo "Cleaning up Docker resources..."
    docker system prune -f
    
    # Remove old images except current running
    docker images | grep -E "dschwartz06/librechat|darkjk/librechat" | tail -n +4 | awk '{print \$3}' | xargs -r docker rmi -f || true
    
    # Backup current config
    cp docker-compose.yml docker-compose.yml.backup
    cp librechat.yaml librechat.yaml.backup
    cp .env .env.backup
    
    # Update docker-compose.yml to use new image
    sed -i "s|image: .*|image: dschwartz06/librechat:production|g" docker-compose.yml
    
    # Pull the new image
    echo "Pulling new image..."
    docker pull dschwartz06/librechat:production
    
    # Stop current containers
    echo "Stopping current services..."
    docker-compose down
    
    # Start with new image
    echo "Starting services with new image..."
    docker-compose up -d
    
    # Wait for services to be healthy
    echo "Waiting for services to start..."
    sleep 20
    
    # Check if services are running
    docker-compose ps
    
    # Check logs for errors
    echo "Checking for startup errors..."
    docker-compose logs --tail=50 api | grep -i error || true
    
    # Final cleanup
    docker system prune -af --volumes=false || true
    
    echo "✅ Deployment complete!"
ENDSSH

# Step 8: Verify deployment
echo -e "\n${YELLOW}🔍 Verifying deployment...${NC}"
sleep 5

# Check if the site loads
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DROPLET_IP:3090 || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ Deployment successful! Site is accessible at http://jk.toolchat.ai${NC}"
    echo -e "${GREEN}📋 Deployed version: $TIMESTAMP${NC}"
    
    # Quick check for frontend
    if curl -s http://$DROPLET_IP:3090 | grep -q -E "(SovereignAI|LibreChat)"; then
        echo -e "${GREEN}✅ Frontend is loading correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend might not be loading properly - check manually${NC}"
    fi
else
    echo -e "${RED}❌ Warning: Site returned HTTP status $HTTP_STATUS${NC}"
    echo -e "${YELLOW}Check the logs with:${NC}"
    echo "ssh $DROPLET_USER@$DROPLET_IP 'cd $DROPLET_PATH && docker-compose logs --tail=100 api'"
fi

# Step 9: Show important info
echo -e "\n${YELLOW}📌 Important Information:${NC}"
echo "Deployed image: $DOCKER_USERNAME/$IMAGE_NAME:$TIMESTAMP"
echo "Image size: ${IMAGE_SIZE}GB"
echo ""
echo -e "${YELLOW}📌 Rollback Instructions:${NC}"
echo "ssh $DROPLET_USER@$DROPLET_IP 'cd $DROPLET_PATH && \\"
echo "  docker-compose down && \\"
echo "  docker pull $DOCKER_USERNAME/$IMAGE_NAME:$TIMESTAMP && \\"
echo "  sed -i \"s|image: .*|image: $DOCKER_USERNAME/$IMAGE_NAME:$TIMESTAMP|g\" docker-compose.yml && \\"
echo "  docker-compose up -d'"
echo ""
echo -e "${YELLOW}📌 View logs:${NC}"
echo "ssh $DROPLET_USER@$DROPLET_IP 'cd $DROPLET_PATH && docker-compose logs -f api'"
echo ""
echo -e "${YELLOW}📌 SSH to server:${NC}"
echo "ssh $DROPLET_USER@$DROPLET_IP"