# Working Configuration - 2025-01-10

## Docker Image
- **Image**: `darkjk/librechat:v1.6`
- **Built**: 2025-07-09 20:22:35 PDT
- **Image ID**: 718c95baa455

## Git State
- **Commit**: 217f083 (Fix web search, MCP tools, and endpoint selector issues)
- **Date**: 2025-07-09 18:56:11 PDT

## What's Working
- ✅ MCP tools (playwright, perplexity) 
- ✅ Agent/Assistant selection
- ✅ DarkJK as default assistant
- ✅ Endpoint switching
- ✅ Custom logo and branding
- ✅ Business terminology (Tools/Coaches)

## Key Configuration Files
- `docker-compose.yml` - Points to darkjk/librechat:v1.6
- `librechat.yaml` - Has MCP configuration, no memory config
- `.env` - Contains API keys
- `docker-compose.override.yml` - RAG services configuration

## Why This Works
- Built AFTER the MCP tools fix (18:56)
- Built BEFORE memory implementation attempts (19:03+)
- Contains all UI fixes and customizations
- No breaking modifications to core files

## To Restore This State
1. Copy all files from this directory to LibreChat/
2. Run: `docker compose down && docker compose up -d`
3. Wait for services to start (~30 seconds)
4. Access http://localhost:3090

## Important Notes
- Do NOT update the Docker image
- Do NOT modify core API files (chatV2.js, createRunBody.js, etc.)
- Memory implementation should be done via configuration only