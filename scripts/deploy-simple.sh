#!/bin/bash
# deploy-simple.sh
cd ~/jk-ai/jk-ai/LibreChat/

# Always use a timestamp tag to avoid caching issues
TAG="production-$(date +%Y%m%d-%H%M%S)"

# Build for AMD64
./build-amd64-only.sh

# Tag with timestamp
docker tag dschwartz06/librechat:production dschwartz06/librechat:$TAG

# Push with timestamp
docker push dschwartz06/librechat:$TAG

# Deploy to droplet
ssh danschwartz@137.184.83.110 "cd /home/danschwartz/LibreChat && \
  sed -i 's|image: dschwartz06/librechat:.*|image: dschwartz06/librechat:$TAG|' docker-compose.yml && \
  docker pull dschwartz06/librechat:$TAG && \
  docker-compose down && \
  docker-compose up -d"

echo "Deployed: dschwartz06/librechat:$TAG"