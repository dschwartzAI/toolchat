# Droplet Console Commands

## 1. First, SSH into your droplet and check if the directory exists:

```bash
# Check if the user directory exists
ls -la /var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
```

If it shows "No such file or directory", create it:

```bash
# Create the directory
mkdir -p /var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
```

## 2. Then, from your LOCAL machine (not the droplet), copy the DarkJK avatar files:

```bash
# Copy both DarkJK avatar files to droplet
scp /Users/danielschwartz/jk-ai/toolchat/client/public/images/6869b4e65de8d8eed9f0fa69/agent-agent_KVXW88WVte1tcyABlAowy-avatar-*.png root@YOUR_DROPLET_IP:/var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
```

## 3. Back in the droplet console, verify the files were copied:

```bash
# List the files to confirm they're there
ls -la /var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/ | grep KVXW88WVte1tcyABlAowy
```

You should see:
- agent-agent_KVXW88WVte1tcyABlAowy-avatar-1752277221712.png
- agent-agent_KVXW88WVte1tcyABlAowy-avatar-1754338620901.png

## 4. Set proper permissions:

```bash
# Set ownership (adjust nginx:nginx if you use different user)
chown -R nginx:nginx /var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/

# Set permissions
chmod -R 755 /var/www/librechat/client/public/images/6869b4e65de8d8eed9f0fa69/
```

## Note:
- Replace `/var/www/librechat` with your actual LibreChat installation path
- Replace `YOUR_DROPLET_IP` with your actual droplet IP
- The `nginx:nginx` user might be different (could be `www-data:www-data` on Ubuntu)

After this, DarkJK icon should work on your deployed instance!