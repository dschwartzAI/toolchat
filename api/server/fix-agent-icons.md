# Fix Agent Icon Synchronization

## The Problem
- When you upload an avatar in the agent builder, it creates a file in `/images/{userId}/agent-{agentId}-avatar-{timestamp}.png`
- This file only exists on the instance where you uploaded it
- The agent's avatar field in MongoDB points to this local file
- Other instances can't find this file, so the icon doesn't display

## The Solution
Since the agents are managed in MongoDB (not OpenAI), you need to clear the avatar fields so agents use the static icons from `librechat.yaml`.

### Option 1: Via Agent Builder UI (Recommended)
1. Go to http://localhost:3090
2. Open the agent builder
3. Edit each agent:
   - DarkJK (agent_KVXW88WVte1tcyABlAowy)
   - Hybrid Offer Printer (agent_jkxFi4j4VZLDT8voWoXxm)
   - Daily Client Machine (agent_cCc7tBkYYjE3j4NS0QjST)
   - Ideal Client Extractor (agent_DQbu_zXcPMFZCDqq-j3dX)
   - SovereignJK (agent_odD3oMA9NgaPXQEcf0Pnq)
   - Workshop Copy-Paster (agent_QCDKPRFv8sY6LC_IWuqrh)
4. DO NOT upload any new avatar
5. If there's an option to remove/clear the avatar, use it
6. Save the agent

### Option 2: Direct MongoDB Update
If you have access to your production MongoDB, run this in MongoDB shell:

```javascript
// Connect to your production MongoDB
// Update the database name if different
use LibreChat;

// Clear avatar fields for all business tool agents
db.agents.updateMany(
  { 
    _id: { 
      $in: [
        "agent_KVXW88WVte1tcyABlAowy", // DarkJK
        "agent_jkxFi4j4VZLDT8voWoXxm", // Hybrid Offer
        "agent_cCc7tBkYYjE3j4NS0QjST", // Daily Client
        "agent_DQbu_zXcPMFZCDqq-j3dX", // Ideal Client
        "agent_odD3oMA9NgaPXQEcf0Pnq", // SovereignJK
        "agent_QCDKPRFv8sY6LC_IWuqrh"  // Workshop
      ]
    }
  },
  { 
    $unset: { 
      avatar: "",
      "avatar.filepath": "",
      "avatar.source": ""
    } 
  }
);
```

### Option 3: Environment-Specific Solution
If you need different icons for dev vs production, you could:
1. Keep the static icons in `/images/` for consistency
2. Never use the avatar upload feature
3. Ensure both environments have the same icon files

## Verification
After clearing avatars, the agents will use the `iconURL` from `librechat.yaml`:
- DarkJK → `/images/darkjk.jpg`
- Hybrid Offer → `/images/hybrid-icon-blue.png`
- Daily Client → `/images/dcm-icon-green.png`
- Ideal Client → `/images/icp-icon.png`
- SovereignJK → `/images/sovereign-jk.jpeg`
- Workshop → `/images/workshop-copy-paster.png`

These files already exist in `/client/public/images/` and will work on both instances!