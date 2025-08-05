# Fix DarkJK Icon Synchronization

## The Issue
- DarkJK has 2 avatar files locally:
  - `agent-agent_KVXW88WVte1tcyABlAowy-avatar-1752277221712.png`
  - `agent-agent_KVXW88WVte1tcyABlAowy-avatar-1754338620901.png`
- MongoDB points to one of these, but that file doesn't exist on your droplet
- Other agents work because their avatar files were already synced

## Quick Fix: Copy the Missing File

1. **Find which avatar file MongoDB is using:**
   - Try to view DarkJK in the UI and check browser DevTools Network tab
   - Look for the 404 error to see which file it's trying to load
   - Or check MongoDB directly for the avatar.filepath value

2. **Copy just that file to your droplet:**
   ```bash
   # If it's the first file:
   scp /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-1752277221712.png root@your-droplet:/path/to/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/

   # If it's the second file:
   scp /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-1754338620901.png root@your-droplet:/path/to/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
   ```

## Better Solution: Sync All Avatar Files

Since all agents have avatar files, sync the entire user directory:

```bash
# From local to droplet
rsync -avz /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/ root@your-droplet:/path/to/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
```

## Best Solution: Use Static Icons Only

To avoid this issue in the future:

1. **Clear all agent avatars in MongoDB:**
   ```javascript
   db.agents.updateMany(
     { author: "your-user-id" },
     { $unset: { avatar: "" } }
   );
   ```

2. **Never use avatar upload in agent builder**

3. **All agents will use static icons from librechat.yaml:**
   - These files already exist on both instances
   - No synchronization needed
   - Icons work everywhere

## Why Other Agents Work

The other agents work because their avatar files (like `agent-agent_jkxFi4j4VZLDT8voWoXxm-avatar-1752040772677.png`) were already copied to your droplet when you initially set up the fork. DarkJK's issue is that it has a newer avatar file that wasn't copied.