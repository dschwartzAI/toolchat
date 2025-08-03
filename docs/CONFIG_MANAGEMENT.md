# Configuration Management Guide

## Critical Configuration Files

When working with this LibreChat deployment, there are two critical configuration files that **MUST** be tracked in Git:

### 1. `librechat.yaml`
This file contains:
- UI customization settings (hiding model selector, parameters, etc.)
- Endpoint configurations
- Business tool agent settings
- Memory configuration
- MCP server configurations

### 2. `docker-compose.override.yml`
This file contains:
- MongoDB connection settings
- RAG system configuration
- Volume mounts
- Service dependencies

## Important Notes

⚠️ **WARNING**: By default, LibreChat's `.gitignore` excludes these files! This caused a critical issue where reverting Git commits lost all configuration.

## Solution Implemented

1. **Force-added to Git**: Both files have been force-added using `git add -f`
2. **Example files created**: 
   - `librechat.example.yaml` - Contains full config without sensitive data
   - `docker-compose.override.example.yml` - Contains config with placeholder for MongoDB URI
3. **Updated .gitignore**: Added exceptions to track the example files

## Setup Instructions

For new deployments:

1. Copy the example files:
   ```bash
   cp librechat.example.yaml librechat.yaml
   cp docker-compose.override.example.yml docker-compose.override.yml
   ```

2. Update sensitive values:
   - In `docker-compose.override.yml`: Replace `YOUR_MONGODB_CONNECTION_STRING_HERE` with actual MongoDB URI
   - In `.env`: Add all required API keys

3. Force add your actual config files to Git:
   ```bash
   git add -f librechat.yaml
   git add -f docker-compose.override.yml
   ```

## Best Practices

1. **Always commit config changes**: When modifying UI settings or endpoints, commit the YAML files
2. **Use example files**: Keep example files updated when adding new configuration
3. **Document changes**: Update this guide when configuration structure changes
4. **Backup regularly**: Tag working states in Git (e.g., `v1.0-working`)

## Configuration Structure

### librechat.yaml Key Sections:
- `interface`: UI customization (hiding technical elements)
- `endpoints`: Agent and assistant configurations
- `fileConfig`: File upload settings
- `memory`: Business context storage
- `mcpServers`: External tool integrations

### docker-compose.override.yml Key Sections:
- `api`: Main LibreChat service with environment variables
- `vectordb`: PostgreSQL with pgVector for RAG
- `rag_api`: RAG API service for file search
- `nginx`: Reverse proxy (optional)

## Troubleshooting

If configuration is lost:
1. Check Git history: `git log --all -- librechat.yaml docker-compose.override.yml`
2. Restore from commits where files existed
3. Or use example files as starting point
4. Rebuild custom Docker image if UI changes were made