#!/bin/bash

echo "DarkJK Avatar Copy Script"
echo "========================"
echo ""

# Local DarkJK avatar files
echo "DarkJK has 2 avatar files locally:"
echo "1. agent-agent_KVXW88WVte1tcyABlAowy-avatar-1752277221712.png (older)"
echo "2. agent-agent_KVXW88WVte1tcyABlAowy-avatar-1754338620901.png (newer)"
echo ""

# The newer one is likely the active one
echo "The newer file (1754338620901) is likely what MongoDB is pointing to."
echo ""

echo "To copy BOTH files to your droplet (safest option):"
echo "===================================================="
echo ""
echo "scp /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-*.png root@YOUR_DROPLET_IP:/path/to/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/"
echo ""

echo "Or copy just the newer one:"
echo "==========================="
echo ""
echo "scp /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-1754338620901.png root@YOUR_DROPLET_IP:/path/to/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/"
echo ""

echo "Replace:"
echo "- YOUR_DROPLET_IP with your actual droplet IP address"
echo "- /path/to/librechat with the actual path on your droplet"
echo ""

echo "After copying, DarkJK should display correctly on both local and production!"