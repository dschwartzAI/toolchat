# AI Business Tools Platform - Deployment Guide

This guide walks you through deploying the AI Business Tools Platform, a customized LibreChat instance with specialized business agents.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Agent Setup](#agent-setup)
6. [User Management](#user-management)
7. [SSL Configuration](#ssl-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Prerequisites

Before starting, ensure you have:

- Docker and Docker Compose installed
- Git installed
- Node.js 18+ (for running setup scripts)
- API keys:
  - OpenAI API key (for Dark JK Business Coach)
  - Anthropic API key (for Hybrid Offer Creator)
  - MongoDB Atlas connection (provided: `mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI`)
- OpenAI Vector Store ID for Dark JK Coach: `vs_67df294659c48191bffbe978d27fc6f7`

## Quick Start

```bash
# 1. Run the setup script
./scripts/setup.sh

# 2. Copy and configure environment variables
cp config/.env LibreChat/.env
# Edit LibreChat/.env and add your API keys

# 3. Copy configuration files
cp config/librechat.yaml LibreChat/librechat.yaml
cp config/custom-en.json LibreChat/client/src/localization/

# 4. Start LibreChat
cd LibreChat
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# 5. Configure agents
cd ..
node scripts/configure-agents.js

# 6. Create initial users
node scripts/migrate-users.js
```

## Detailed Setup

### 1. Clone and Setup LibreChat

```bash
# Run the setup script
./scripts/setup.sh

# This will:
# - Clone LibreChat repository
# - Create necessary directories
# - Set up Docker configuration
# - Generate self-signed SSL certificates
```

### 2. Environment Configuration

Edit `LibreChat/.env` with your actual values:

```env
# CRITICAL - Add your API keys
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# MongoDB Atlas (already configured)
MONGO_URI=mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI

# Vector Store for Dark JK Coach
DARKJK_VECTOR_STORE_ID=vs_67df294659c48191bffbe978d27fc6f7

# Security - Generate secure values
JWT_SECRET=generate-a-secure-32-character-string
JWT_REFRESH_SECRET=generate-another-secure-32-character-string
CREDS_KEY=generate-32-character-encryption-key
CREDS_IV=generate-16-char-iv
```

### 3. LibreChat Configuration

The `librechat.yaml` file is pre-configured to:
- Hide technical UI elements (model selection, parameters)
- Disable public registration
- Configure business tool agents
- Set up custom endpoints

Key settings:
```yaml
interface:
  modelSelect: false      # Hide model selection
  parameters: false       # Hide technical parameters
  agents: true           # Show business tools

registration:
  enabled: false         # Admin creates users

endpoints:
  agents:
    disableBuilder: true  # Hide from non-admin users
```

### 4. Start Services

```bash
cd LibreChat

# Start all services
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Services started:
- LibreChat API (port 3080)
- Nginx reverse proxy (ports 80, 443)
- Sandpack bundler (for artifacts)

## Configuration

### Custom UI Terminology

The platform uses business-friendly terminology:
- "Agents" → "Business Tools"
- "Endpoints" → "Tool Categories"
- "Model" → "Tool Type"
- "Parameters" → "Settings"

This is configured in `LibreChat/client/src/localization/custom-en.json`.

### User Tiers

Three user tiers are supported:
- **Free**: Limited access (Content tools only)
- **Premium**: Full access to all business tools
- **Admin**: Full access plus user management

## Agent Setup

Run the agent configuration script:

```bash
node scripts/configure-agents.js
```

This configures two business tools:

### 1. Dark JK Business Coach
- Uses GPT-4o with vector store knowledge base
- Provides strategic business advice
- Premium users only

### 2. Hybrid Offer Creator
- Uses Claude for conversation and document generation
- Creates 1500+ word sales letters
- Premium users only

## User Management

### Create Initial Users

```bash
# Create default demo users
node scripts/migrate-users.js

# Create users from CSV
node scripts/migrate-users.js users.csv

# Export credentials
node scripts/migrate-users.js --export-credentials
```

Default users created:
- `admin@example.com` (admin tier)
- `premium@example.com` (premium tier)
- `free@example.com` (free tier)

### User Tier Management

Admins can manage user tiers through:
1. Admin panel (when implemented)
2. Direct database updates
3. API endpoints (see `config/admin.js`)

## SSL Configuration

The setup creates self-signed certificates for local HTTPS:

```bash
# Certificates location
LibreChat/ssl/cert.pem
LibreChat/ssl/key.pem
```

For production, replace with proper SSL certificates:

```bash
# Copy your certificates
cp /path/to/your/cert.pem LibreChat/ssl/
cp /path/to/your/key.pem LibreChat/ssl/

# Restart nginx
docker-compose restart nginx
```

## Troubleshooting

### Common Issues

#### 1. Services won't start
```bash
# Check logs
docker-compose logs -f

# Verify MongoDB connection
docker exec librechat-app mongosh "$MONGO_URI" --eval "db.serverStatus()"
```

#### 2. Agents not appearing
```bash
# Re-run agent configuration
node scripts/configure-agents.js

# Verify in database
docker exec librechat-app mongosh "$MONGO_URI" --eval "db.assistants.find().pretty()"
```

#### 3. Login issues
```bash
# Reset user password
node scripts/migrate-users.js
# Check credentials in user-credentials-*.csv
```

#### 4. UI customization not showing
```bash
# Rebuild client
cd LibreChat
docker-compose exec api npm run frontend:build

# Restart services
docker-compose restart
```

### Debug Mode

Enable debug logging:
```env
# In LibreChat/.env
DEBUG_LOGGING=true
LOG_LEVEL=debug
```

## Maintenance

### Backup

Regular backups are critical:

```bash
# Manual backup
./scripts/backup.sh backup

# Schedule automated backups (add to crontab)
0 2 * * * /path/to/scripts/backup.sh backup 7
```

### Updates

To update LibreChat:

```bash
cd LibreChat
git pull
docker-compose build
docker-compose up -d
```

### Monitoring

Monitor system health:

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Check logs
docker-compose logs -f api

# Test endpoints
curl -k https://localhost/health
```

### Database Management

```bash
# Connect to MongoDB
docker exec -it librechat-app mongosh "$MONGO_URI"

# Useful queries
db.users.find({tier: "premium"}).count()
db.assistants.find().pretty()
db.conversations.find({user: ObjectId("...")}).count()
```

## Security Considerations

1. **Change default passwords** immediately
2. **Use strong JWT secrets** in production
3. **Enable rate limiting** for API endpoints
4. **Regular backups** of MongoDB data
5. **Monitor usage** for unusual patterns
6. **Update regularly** for security patches

## Next Steps

1. Test the deployment:
   ```bash
   ./tests/e2e-business-flow.sh
   ```

2. Create user accounts for beta users

3. Configure monitoring and alerting

4. Set up automated backups

5. Train users on the platform (see USER-GUIDE.md)

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Run tests: `node tests/test-agents.js`
- Review configuration: `cat LibreChat/librechat.yaml`

Remember to backup before making changes!