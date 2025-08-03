# Snapshot v1.3 - 2025-01-12

## Overview
This snapshot captures a working state of the customized LibreChat deployment with tags feature, MCP integration, and partial XAI endpoint management.

## Docker Image Information
- **Image**: `darkjk/librechat:v1.3-snapshot`
- **Also tagged as**: `darkjk/librechat:latest`
- **Image ID**: `924ed1388fcb`
- **Base**: Custom build from `Dockerfile.custom`
- **Size**: 1.98GB

## Git Information
- **Commit**: `95c023f`
- **Tag**: `v1.3-snapshot`
- **Branch**: `main`

## Key Features

### ✅ Working Features
1. **Tags/Bookmarks System**
   - Fully renamed from Bookmarks to Tags
   - Tag icon visible in chat header
   - Tag navigation enabled in sidebar
   - Permission check removed for universal access

2. **MCP Integration**
   - DarkJK knowledge base MCP server running
   - Available tools: search, fetch
   - Configured in librechat.yaml

3. **Default Agent Loading**
   - DarkJK (agent_KVXW88WVte1tcyABlAowy) loads automatically
   - Hardcoded fallback in buildDefaultConvo.ts
   - Works on login and new chat

4. **UI Customizations**
   - Business Tools terminology throughout
   - Custom SovereignAI logo
   - Hidden technical UI elements
   - Simplified interface

### ⚠️ Known Issues
1. **XAI Endpoint Visibility**
   - Still shows in endpoint selector despite:
     - `ENDPOINTS=agents` in .env
     - `disabled: true` in librechat.yaml
   - Works for agents but visible in UI

## Configuration Files

### librechat.yaml
```yaml
interface:
  defaultEndpoint: "agents"
  defaultAgent: "agent_KVXW88WVte1tcyABlAowy"
  bookmarks: true
  
endpoints:
  custom:
    - name: "xai"
      disabled: true  # Doesn't work as expected
      
mcpServers:
  darkjk_knowledge:
    type: stdio
    command: npx
    args: ["darkjk-mcp"]
```

### .env
```bash
ENDPOINTS=agents
# API keys configured for OpenAI, Anthropic, XAI
```

### docker-compose.yml
- Uses `Dockerfile.custom` for build
- Mounts librechat.yaml as volume
- Includes RAG services (pgVector, RAG API)

## Modified Files
1. `client/src/components/Chat/Header.tsx` - Removed bookmark permission check
2. `client/src/components/Nav/Nav.tsx` - Enabled TagNav in sidebar
3. `client/src/utils/buildDefaultConvo.ts` - Hardcoded default agent
4. `librechat.yaml` - Configuration updates

## Restore Instructions

### From Docker Image:
```bash
docker pull darkjk/librechat:v1.3-snapshot
docker tag darkjk/librechat:v1.3-snapshot darkjk/librechat:mcp
docker compose up -d
```

### From Git:
```bash
git checkout v1.3-snapshot
docker compose build api
docker compose up -d
```

## Testing Checklist
- [ ] Tags icon appears in chat header
- [ ] Tags navigation shows in sidebar
- [ ] Can create and filter by tags
- [ ] DarkJK loads by default
- [ ] MCP tools work (no JSON errors)
- [ ] Only "AI Agents" in endpoint selector
- [ ] XAI models work in agent builder

## Next Steps
1. Fix XAI endpoint visibility issue
2. Consider reverting to original bookmark system if tags continue having issues
3. Investigate LibreChat's endpoint filtering mechanism

## Notes
- The tags feature works but may have edge cases
- XAI endpoint visibility is a LibreChat limitation
- All custom UI elements are preserved
- MCP integration is fully functional