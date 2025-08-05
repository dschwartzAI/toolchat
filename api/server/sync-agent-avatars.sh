#!/bin/bash

# Sync Agent Avatar Files Between Local and Production

echo "Agent Avatar Sync Script"
echo "======================="
echo ""
echo "This script helps sync agent avatar files between your local and production instances."
echo ""

# Configuration
LOCAL_IMAGES_DIR="/Users/danielschwartz/jk-ai/toolchat/client/public/images"
REMOTE_HOST="your-droplet-ip-or-hostname"
REMOTE_USER="root"  # or your user
REMOTE_IMAGES_DIR="/path/to/librechat/client/public/images"

# Option 1: Copy from Production to Local
echo "Option 1: Copy avatar files FROM production TO local"
echo "----------------------------------------------------"
echo "Run this command to sync from your droplet to local:"
echo ""
echo "rsync -avz --progress ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_IMAGES_DIR}/6869b4e65de8d8eed9f0fa69/ ${LOCAL_IMAGES_DIR}/6869b4e65de8d8eed9f0fa69/"
echo ""

# Option 2: Copy from Local to Production
echo "Option 2: Copy avatar files FROM local TO production"
echo "----------------------------------------------------"
echo "Run this command to sync from local to your droplet:"
echo ""
echo "rsync -avz --progress ${LOCAL_IMAGES_DIR}/6869b4e65de8d8eed9f0fa69/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_IMAGES_DIR}/6869b4e65de8d8eed9f0fa69/"
echo ""

# Option 3: Two-way sync
echo "Option 3: Two-way sync (keeps both in sync)"
echo "-------------------------------------------"
echo "First, backup both directories, then run both commands above."
echo ""

# List current avatar files
echo "Current avatar files in local directory:"
echo "---------------------------------------"
ls -la ${LOCAL_IMAGES_DIR}/6869b4e65de8d8eed9f0fa69/agent-agent_* 2>/dev/null | awk '{print $9}' | xargs -n1 basename

echo ""
echo "Avatar files by agent:"
echo "- DarkJK: agent-agent_KVXW88WVte1tcyABlAowy-avatar-*.png"
echo "- Hybrid Offer: agent-agent_jkxFi4j4VZLDT8voWoXxm-avatar-*.png"
echo "- Daily Client: agent-agent_cCc7tBkYYjE3j4NS0QjST-avatar-*.png"
echo "- Ideal Client: agent-agent_DQbu_zXcPMFZCDqq-j3dX-avatar-*.png"
echo "- SovereignJK: agent-agent_odD3oMA9NgaPXQEcf0Pnq-avatar-*.png"
echo "- Workshop: agent-agent_QCDKPRFv8sY6LC_IWuqrh-avatar-*.png"

echo ""
echo "Note: DarkJK has 2 avatar files with different timestamps. The MongoDB likely"
echo "points to one that doesn't exist on your droplet."