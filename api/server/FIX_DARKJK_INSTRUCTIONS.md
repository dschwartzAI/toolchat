# Fix DarkJK Icon - Simple Solution

Since all other agent icons work perfectly and only DarkJK is broken, this is a simple data issue.

## Option 1: Fix via Agent Builder UI (Easiest)

1. Go to your LibreChat instance (localhost:3090 or production)
2. Log in with your admin account (dschwartz06@gmail.com)
3. Open the Agent Builder
4. Find and edit the DarkJK agent
5. Look for the avatar/icon section
6. Either:
   - Remove/clear the current avatar (if there's a remove button)
   - Or save the agent without uploading a new avatar
7. Save the agent

This should clear the broken avatar reference and make DarkJK use the `/images/darkjk.jpg` from librechat.yaml.

## Option 2: Direct MongoDB Fix (If you have access)

Run this in your production MongoDB:

```javascript
use LibreChat;  // or whatever your database name is

// First check what's different about DarkJK
db.agents.find(
  { _id: { $in: [
    "agent_KVXW88WVte1tcyABlAowy", // DarkJK
    "agent_jkxFi4j4VZLDT8voWoXxm", // Hybrid Offer (working)
  ]}},
  { _id: 1, name: 1, avatar: 1 }
).pretty();

// Then fix only DarkJK
db.agents.updateOne(
  { _id: "agent_KVXW88WVte1tcyABlAowy" },
  { $unset: { avatar: "" } }
);
```

## Why This Works

- All other agents work = the system is fine
- DarkJK doesn't work = DarkJK has bad data
- The bad data is likely an avatar field pointing to a file that doesn't exist
- Clearing the avatar makes it fall back to the working iconURL from librechat.yaml
- The file `/images/darkjk.jpg` already exists in your codebase

## After the Fix

DarkJK should display its icon consistently across all instances, just like the other agents do.