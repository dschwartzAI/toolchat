# JK-AI LibreChat Development Process Report

## Current Development Workflow

### Overview
This report documents the current development process for the JK-AI LibreChat platform, including common errors, pain points, and workarounds currently in use.

## Development Environment

### Stack
- **Base Platform**: LibreChat (forked/customized)
- **Deployment**: Docker Compose with custom Dockerfile
- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express
- **Database**: MongoDB Atlas
- **Vector DB**: pgVector (for RAG)
- **Container Architecture**: Multi-architecture builds (ARM64 for M1 Macs, AMD64 for production)

### Current File Structure
```
jk-ai/
├── LibreChat/
│   ├── docker-compose.yml
│   ├── docker-compose.override.yml
│   ├── Dockerfile.custom
│   ├── librechat.yaml
│   ├── client/           # Frontend React app
│   ├── api/             # Backend Express app
│   └── packages/        # Shared packages
├── scripts/
├── docs/
└── CLAUDE.md            # AI assistant instructions
```

## Major Pain Points

### 1. Hot Reloading Not Working
**Issue**: Frontend changes require full Docker image rebuild
- Hot reloading is configured but doesn't work in practice
- Every UI change requires stopping containers and rebuilding
- This adds 5-10 minutes to each iteration cycle

**Current Workaround**: Three approaches documented in CLAUDE.md:
1. Full Docker rebuild (most reliable)
2. Separate terminal approach (frontend/backend split)
3. Docker exec approach (manual npm build)

### 2. Architecture Mismatch Issues
**Issue**: Development on M1 Mac vs AMD64 production
- Frequent "exec format error" when deploying
- Images built on Mac don't run on production servers
- No automatic multi-architecture builds

**Current Workaround**: 
- Manual buildx commands for production
- Maintaining separate build scripts
- "You messed up... Claude Code should have AUTOMATICALLY built for both architectures"

### 3. Visual Changes Not Showing
**Issue**: UI changes don't appear even after rebuild
- Browser caching issues
- Stale bundle files
- CACHEBUST parameter sometimes needed
- "I'm not seeing it, and it's probably because the image needs to be rebuilt in dev"

**Common Error Messages**:
- "chunk-ZDP7TQGZ.js?v=d54cd6cd:28445 Download the React DevTools... im not seeing hte changes"
- Changes visible in code but not in browser

## Common Development Errors

### 1. Backend Crashes
```
Cannot read properties of undefined (reading 'endsWith')
```
- Often related to missing enum values in CacheKeys
- Fixed by adding OPENID_SESSION, SAML_SESSION entries

### 2. MCP Connection Errors
```
[MCP] Error connecting to GoHighLevel: Connection closed
[MCP] Connection error: Error: fetch failed (404)
```
- GoHighLevel MCP server continuously failing
- Had to disable in librechat.yaml

### 3. Provider Configuration Errors
```
Provider xai not supported
Error in server stream
```
- Case sensitivity issues (xAI vs xai)
- Model specifications not matching provider names
- Custom endpoint configuration problems

### 4. Docker Build Failures
```
failed to solve: failed to compute cache key
```
- Missing files in build context
- Dockerfile COPY commands referencing deleted files
- Cache invalidation issues

### 5. Frontend Bundle Errors
```
Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream
```
- Proxy server issues
- CORS policy violations
- Authentication token problems

## Current Development Process

### Making UI Changes
1. **Edit React Component**
   ```bash
   # Edit file in LibreChat/client/src/
   ```

2. **Rebuild Image** (No hot reload)
   ```bash
   cd /Users/danielschwartz/jk-ai/jk-ai/LibreChat
   docker compose down
   docker compose build api
   docker compose up -d
   ```

3. **Verify Changes**
   - Hard refresh browser (Cmd+Shift+R)
   - Check developer console for errors
   - May need to clear browser cache entirely

### Making Backend Changes
1. **Edit API Files**
   ```bash
   # Edit file in LibreChat/api/
   ```

2. **Update Dockerfile** (if new files)
   ```dockerfile
   COPY api/server/routes/new-route.js /app/api/server/routes/
   ```

3. **Rebuild and Restart**
   ```bash
   docker compose down
   docker compose build api
   docker compose up -d
   ```

## Typical Error Resolution Pattern

### Investigation Phase
1. Check Docker logs: `docker logs LibreChat`
2. Check browser console for frontend errors
3. Verify file paths in Dockerfile
4. Check git status for uncommitted changes

### Common Fixes
1. **"Changes not showing"**
   - Add CACHEBUST arg to Dockerfile
   - Clear browser cache
   - Rebuild with --no-cache flag

2. **"Provider not working"**
   - Check case sensitivity in librechat.yaml
   - Verify API keys in .env
   - Match provider names exactly in modelSpecs

3. **"Build failing"**
   - Remove references to deleted files in Dockerfile
   - Check for syntax errors in recently edited files
   - Ensure all COPY paths exist

## Version Control Strategy

### Golden Images
- Tag working Docker images immediately
- Create git tags for stable states
- Document in CLAUDE.md Golden Images section

### Current Golden Images
- v1.7: AgentFilter removed, no AuthContext errors
- v1.6: Auto-login and tour fixes
- v1.5: Dark mode and feedback system
- v1.8: xAI fixed, Skool reverted

## Integration Attempts and Failures

### Skool Integration (Failed)
**Attempt**: Embed Skool community as 375px sidebar
**Issues**: 
- CORS policy violations
- Authentication token not passing through proxy
- JavaScript sandbox restrictions
**Result**: Complete revert required

### GoHighLevel MCP (Failed)
**Attempt**: Connect CRM via MCP protocol
**Issues**:
- Continuous connection failures
- 404 errors on all endpoints
- No debugging information available
**Result**: Disabled in configuration

## Performance Observations

### Build Times
- Full rebuild: 5-10 minutes
- Frontend only: 3-5 minutes
- Backend only: 2-3 minutes
- Cache effectiveness: Minimal due to frequent invalidation

### Resource Usage
- Docker desktop memory: 8-10GB during builds
- CPU usage: 100% during compilation
- Disk space: ~2GB per image
- Multiple old images accumulate quickly

## Recommendations for Future Investigation

### Hot Reload Priority
The lack of working hot reload is the biggest productivity killer. Each UI tweak costs 5-10 minutes.

### Multi-Architecture Builds
Automated buildx configuration would prevent deployment failures and architecture mismatches.

### Development vs Production Configs
Separate Docker configurations might allow better development experience while maintaining production stability.

### Cache Strategy
Current caching strategy seems ineffective. CACHEBUST workarounds indicate deeper issues.

## Conclusion

The current development process is functional but highly inefficient. The primary bottleneck is the rebuild requirement for every change, compounded by architecture mismatches and various integration challenges. While workarounds exist for most issues, they significantly slow down the development cycle.

The pattern of "it works, then it doesn't, then we rebuild" appears frequently throughout the development history, suggesting systemic issues with the build and deployment pipeline rather than isolated incidents.