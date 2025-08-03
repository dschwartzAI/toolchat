# AI Business Tools Platform - Global Rules for Claude

## 🎯 Project Overview
You are helping build a simplified AI business tools platform using LibreChat as the foundation. The platform provides specialized business tools through LibreChat's native agent builder, running locally for the business owner.

### Core Philosophy
- **LibreChat as foundation**: Use LibreChat's proven architecture and features
- **Native agent builder**: All business tools created through LibreChat's agent interface
- **Agent sharing**: Use LibreChat's native sharing features for access control
- **Local deployment**: Self-hosted for privacy and control
- **Simplified configuration**: Minimal custom code, maximum use of LibreChat features

## 🔄 Project Setup
* **Use LibreChat's agent builder**: All business tools are agents, not custom endpoints
* **Agent sharing for access control**: Use native sharing features instead of custom tier system
* **RAG system enabled**: pgVector + RAG API for knowledge base functionality
* **Web search enabled**: Tavily integration for current information
* **File search hidden**: UI simplified by hiding retrieval status from users

## 🏗️ Architecture Principles

### Platform Architecture
- **Base**: LibreChat with Docker Compose deployment
- **Business Tools**: Native LibreChat agents with specific configurations
- **Knowledge Base**: RAG system with pgVector for file search
- **Access Control**: Native agent sharing (public/private/specific users)
- **Configuration**: Minimal librechat.yaml for enabling features

### Current Implementation
```
Business User → LibreChat UI → Select Agent → AI Processing → Business Result
```

### File Structure
```
jk-ai/
├── LibreChat/                    # LibreChat deployment
│   ├── docker-compose.yml        # Base services
│   ├── docker-compose.override.yml # RAG services
│   ├── librechat.yaml           # Simplified config
│   └── .env                     # API keys and settings
├── scripts/                      # Automation scripts
│   ├── setup-rag.sh             # RAG setup automation
│   └── upload-knowledge-base.sh  # Bulk file upload
├── docs/                        # Documentation
└── PRPs/                        # Implementation plans
```

## 🤖 Agent Configuration Standards

### Business Tool Agents
* **Create via UI**: Use LibreChat's agent builder interface
* **Capabilities enabled**: file_search, artifacts, tools, actions, web_search
* **Sharing settings**: Configure per agent (public/private/users)
* **No custom endpoints**: All tools are native agents

### Example Business Agents
1. **Dark JK Coach**
   - Model: GPT-4o
   - Tools: File Search (with knowledge base), Web Search
   - Sharing: Public or specific users
   
2. **Hybrid Offer Creator**
   - Model: Claude 3.5 Sonnet
   - Tools: Artifacts (for document generation)
   - Sharing: Premium users only

## 🔐 Access Control

### Using Native Agent Sharing
* **Public agents**: Available to all users
* **Private agents**: Only creator can access
* **Shared with users**: Specific email list
* **Admin creates all business agents**: Then shares appropriately

### Implementation
```yaml
# No custom user tiers needed
# Use agent sharing settings in UI:
- Public: Free tier equivalent
- Shared with specific users: Premium tier
- Private: Admin only tools
```

## 🛠️ Current Features

### Enabled Capabilities
* **RAG System**: pgVector + RAG API for knowledge base
* **Web Search**: Tavily integration (requires API key)
* **File Search**: Hidden UI but functional
* **Artifacts**: Document generation
* **All agent tools**: Available in agent builder

### Simplified Configuration
```yaml
# librechat.yaml - minimal config
agents:
  disableBuilder: false
  capabilities:
    - "file_search"
    - "artifacts" 
    - "tools"
    - "actions"
    - "web_search"
```

## 📄 Artifacts System

### Supported Artifact Types
LibreChat supports THREE artifact types through its Sandpack integration:
* **React Components**: Interactive UI components with full React ecosystem
* **HTML**: Web pages with CSS/JS support
* **Mermaid Diagrams**: Flowcharts, sequence diagrams, and more with zoom/pan support

### Current Status
* ✅ Artifacts are created correctly by AI agents
* ✅ Code/content is valid and functional
* ✅ Sandpack bundler is deployed and running on port 3035
* ✅ All artifact types work without connection errors

### Mermaid Diagram Features
* **Full Mermaid.js support**: Flowcharts, sequence diagrams, Gantt charts, etc.
* **Interactive controls**: Zoom in/out, pan, and reset view buttons
* **Dark theme**: Custom styling optimized for dark backgrounds
* **Responsive**: Auto-centers and fits diagrams to viewport
* **Error handling**: Graceful error messages for invalid syntax

### Technical Implementation
* **Sandpack Service**: Running at `http://localhost:3035` via Docker
* **Browser Access**: Configured for client-side artifact rendering
* **Dependencies**: All necessary packages pre-configured (mermaid, react-zoom-pan-pinch, etc.)

### Usage Examples
When creating Mermaid diagrams:
```
Create artifact with type: application/vnd.mermaid
Content: Your Mermaid diagram code
```

The system automatically wraps Mermaid content in a React component with zoom/pan controls.

## 🎨 UI/UX Customization

### Current Modifications
* **File search UI hidden**: RetrievalCall component returns null
* **Full agent builder access**: For creating business tools
* **Native sharing UI**: For access control

### Future Customizations
* **Branding**: Update logos and colors
* **Welcome messages**: Business-specific onboarding
* **Help documentation**: Business tool guides

## 🔧 Deployment & Setup

### Current Stack
```yaml
services:
  api:         # LibreChat main service
  mongodb:     # Handled by MongoDB Atlas
  vectordb:    # pgVector for RAG
  rag_api:     # RAG API service
```

### Setup Steps
1. **Clone repository**: `git clone https://github.com/dschwartzAI/darkjk.git`
2. **Configure .env**: Add API keys (OpenAI, Anthropic, Tavily)
3. **Start services**: `docker-compose up -d`
4. **Create agents**: Use agent builder UI
5. **Upload knowledge**: Use scripts or UI

## 🧪 Testing & Validation

### Working Features
* ✅ Agent builder with all capabilities
* ✅ Agent sharing for access control
* ✅ RAG system with file uploads
* ✅ Web search capability
* ✅ Hidden file search UI
* ✅ MongoDB Atlas integration

### To Configure
* 🔄 Tavily API key for web search
* 🔄 Create business tool agents
* 🔄 Upload knowledge base files
* 🔄 Test agent sharing settings

## 📎 Important Notes

### Using Native Features
* **No fork needed**: Agent sharing eliminates custom code
* **Agent builder only**: No custom endpoints
* **Sharing for access**: Replaces tier system
* **Minimal configuration**: Most features work out-of-box

### API Keys Needed
```bash
OPENAI_API_KEY=          # For GPT-4o agents
ANTHROPIC_API_KEY=       # For Claude agents
TAVILY_API_KEY=          # For web search
```

## 🚀 Business Context

### Implementation Strategy
* **Phase 1**: ✅ Set up LibreChat with RAG
* **Phase 2**: ✅ Enable all agent capabilities
* **Phase 3**: 🔄 Create business agents via UI
* **Phase 4**: 🔄 Configure sharing for user tiers
* **Phase 5**: 🔄 Upload knowledge base

### Business Tools via Agents
* **Coaching tools**: Agents with JK knowledge base
* **Content creation**: Agents with artifacts
* **Research tools**: Agents with web search
* **All managed through**: Native agent builder

### Success Metrics
* **Simplicity**: Minimal custom code
* **Functionality**: Full agent capabilities
* **Access control**: Native sharing features
* **Maintainability**: Easy LibreChat updates

## 🏆 Golden Docker Images - WORKING STATES

### Latest Golden Image (v1.7)
* **Tag**: `librechat-custom:v1.7-agentfilter-removed`
* **Build Date**: 2025-07-24
* **Image ID**: `51d6a90e889c`
* **Changes**: Removed AgentFilter component to fix AuthContext errors
* **Key Features**:
  - ✅ **AgentFilter component completely removed** (no more AuthContext errors)
  - ✅ **All selectedAgents state and handlers removed** from Nav and Conversations
  - ✅ **Clean sidebar without filter dropdown**
  - ✅ **All v1.6 features included** (dark mode, feedback, auto-login, tour)
  - ✅ **Fresh build with CACHEBUST=2** to ensure no stale assets
* **Includes All Previous Fixes** from v1.6, v1.5, v1.4, v1.3, v1.2

### Previous Golden Images

#### v1.6
* **Tag**: `librechat-custom:v1.6-autologin-tour`
* **Build Date**: 2025-07-24
* **Changes**: Auto-login and tour fixes
* **Key Features**:
  - ✅ Auto-login after registration
  - ✅ Tour fixed for new users

#### v1.5
* **Tag**: `librechat-custom:v1.5-golden`
* **Also Tagged**: `librechat-custom:golden-20250121`
* **Build Date**: 2025-01-21
* **Image ID**: `d7461ea5397e`
* **Changes**: Complete UI overhaul with dark mode and feedback system
* **Key Features**:
  - ✅ **Dark/light mode toggle** in header (sun/moon icon)
  - ✅ **Mobile-friendly feedback button** (shows icon only on small screens)
  - ✅ **Logo automatically inverts to white in dark mode** using CSS filters
  - ✅ **Working feedback submission** to Google Sheets
  - ✅ **Hidden message action buttons** (Fork, Audio, Regenerate, Edit)
  - ✅ **RAG system enabled** for file uploads (no OCR errors)
  - ✅ **Hot reloading configured** for frontend development
  - ✅ **All security patches applied** (SSE, dependencies)
  - ✅ **Feedback route properly mounted** at /api/feedback
* **Includes All Previous Fixes** from v1.4, v1.3, v1.2

### Previous Golden Images

#### v1.4
* **Tag**: `librechat-custom:v1.4-rag-enabled`
* **Build Date**: 2025-01-21
* **Image SHA**: `d7461ea5397e535a679778623c2b34b9826d796546cdb2d4c30c1bd1982df9ad`
* **Changes**: Enabled RAG for file uploads
* **Key Fixes**:
  - ✅ File uploads now work through RAG system
  - ✅ Disabled OCR to prevent API key errors
  - ✅ Added environment variables for RAG configuration
  - ✅ All v1.3 fixes included

### Previous Golden Images

#### v1.3
* **Tag**: `librechat-custom:v1.3-feedback-fixed`
* **Build Date**: 2025-01-21
* **Image SHA**: `c9f8aa78c7b59f94d9dc5f1150fa4ea0eed628ad0adfab2951ab3774d07ce06a`
* **Changes**: Fixed feedback system completely
* **Key Fixes**:
  - ✅ Feedback submission works (replaced complex route with simple version)
  - ✅ Dropdown styling fixed (added explicit background colors)
  - ✅ No more double X buttons in modal
  - ✅ SSE stream interruption handling
  - ✅ Hidden message action buttons (Fork, Audio, Regenerate, Edit)
  - ✅ Updated agent packages to latest version

#### v1.2
* **Tag**: `librechat-custom:v1.2`
* **Build Date**: 2025-01-09
* **Git Commit**: `8a1a811` (tagged as `v1.2-endpoint-fixed`)
* **Changes**: Fixed endpoint switching between assistants and agents
* **Key Fixes**:
  - getDefaultEndpoint respects user selection
  - ModelSelectorContext uses current conversation endpoint
  - YAML configuration files tracked in Git
  - Can now switch between DarkJK (assistants) and Business Tools (agents)

#### v1.1
* **Tag**: `librechat-custom:v1.1`
* **Build Date**: 2025-01-09
* **Git Commit**: `d2e65fa` (tagged as `v1.1-logo-fixed`)
* **Changes**: Fixed logo to use transparent_sovereign.png

#### v1.0
* **Image ID**: `a2b99f2e016a`
* **Tag**: `librechat-custom:v1.0`
* **Build Date**: 2025-01-09
* **Git Commit**: `27f2499` (tagged as `v1.0-working`)
* **Size**: 1.92GB

### What's Included
* ✅ **Custom Logo Component**: `Logo.tsx` with SovereignAI branding
* ✅ **Custom Localization**: "Business Tools" instead of "Agents" 
* ✅ **Hidden Technical UI**: No model selection, parameters, or presets visible
* ✅ **Endpoint Icons**: Coaches show person icon, Tools show tool icon
* ✅ **All React Components**: Compiled and bundled with customizations
* ✅ **Working Endpoint Switching**: Can switch between assistants and agents
* ✅ **Configuration Management**: YAML files properly tracked in Git
* ✅ **Custom Dockerfile**: `Dockerfile.custom` with multi-stage build

### How to Restore This State

#### From Docker Image:
```bash
# For v1.4 (latest):
docker tag librechat-custom:v1.4-rag-enabled librechat-custom:latest

# Or restore specific version:
docker tag librechat-custom:v1.3-feedback-fixed librechat-custom:latest
docker tag librechat-custom:v1.2 librechat-custom:latest
docker tag librechat-custom:v1.1 librechat-custom:latest

# Restart services:
docker compose down
docker compose up -d
```

#### From Git:
```bash
# Checkout the working state:
git checkout v1.0-working

# Rebuild the image:
docker compose build api

# Start services:
docker compose up -d
```

### Critical Files for This Build
* `/LibreChat/client/src/components/ui/Logo.tsx` - Custom logo component
* `/LibreChat/client/src/localization/custom-en.json` - Business terminology
* `/LibreChat/Dockerfile.custom` - Build configuration
* `/LibreChat/docker-compose.yml` - Service orchestration
* All icon files in `/LibreChat/icons/`

### Prevention Strategy
1. **Always tag working Docker images**: `docker tag librechat-custom:latest librechat-custom:backup-$(date +%Y%m%d)`
2. **Commit when working**: Use descriptive commits and tags
3. **Document changes**: Update this file when making UI changes
4. **Version your images**: Don't rely on `:latest`

## 🚨 CRITICAL: Docker Multi-Architecture Builds

### The Problem
- **Development Machine**: Mac with Apple Silicon (ARM64/aarch64)
- **Production Servers**: Digital Ocean droplets, AWS EC2, etc. (AMD64/x86_64)
- **Docker images are architecture-specific!**

### What MUST Be Done
When building Docker images for production deployment:

#### ALWAYS Use Multi-Architecture Builds:
```bash
# Initialize buildx (only needed once)
docker buildx create --name multiarch --use

# Build for BOTH architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  -t dschwartz06/librechat:production-complete \
  -f Dockerfile.custom \
  --push .
```

#### OR Build Specifically for Production:
```bash
# If only deploying to AMD64 servers
docker buildx build --platform linux/amd64 \
  -t dschwartz06/librechat:production-complete \
  -f Dockerfile.custom \
  --push .
```

### Why This Is Critical
1. **Mac M1/M2/M3 builds ARM64 images by default**
2. **Cloud servers run AMD64 architecture**
3. **ARM64 images CANNOT run on AMD64 servers**
4. **This causes "exec format error" on deployment**

### Detection Commands
```bash
# Check local architecture
uname -m  # Shows arm64 on Mac, x86_64 on Intel/AMD

# Check image architecture
docker inspect dschwartz06/librechat:production-complete | grep Architecture

# Check what platforms an image supports
docker manifest inspect dschwartz06/librechat:production-complete
```

### Rules for Claude
1. **ALWAYS ask about deployment target architecture**
2. **ALWAYS use buildx for production images**
3. **NEVER assume local builds will work in production**
4. **ALWAYS specify --platform when building for deployment**

### Common Scenarios
- **Local Mac → Cloud Server**: Use `--platform linux/amd64`
- **Multi-environment**: Use `--platform linux/amd64,linux/arm64`
- **Mac-only development**: Default build is fine
- **Production builds**: ALWAYS specify platform

This is a FUNDAMENTAL requirement that must NEVER be overlooked!

## 🔄 Standard Operating Procedures - Visual Changes

### The Problem
When making frontend changes (React components, UI updates, CSS), they often don't appear in localhost because:
- Production Docker images have pre-built frontends
- Docker caches layers aggressively  
- Browser caches compiled assets
- Volume mounts don't include source code by default

### Three Approaches for Different Scenarios

#### **Approach A: Development Mode (Recommended for Active Development)**
**When to use**: Making multiple UI changes, need instant feedback
**Pros**: Hot reloading, instant updates, no rebuilds needed
**Cons**: Requires running backend and frontend separately

```bash
# 1. Stop production containers
docker compose down

# 2. Start only supporting services
docker compose up mongodb meilisearch vectordb rag_api -d

# 3. Install dependencies if not already done
npm ci
cd client && npm ci && cd ..

# 4. In Terminal 1 - Run backend in dev mode
npm run backend:dev

# 5. In Terminal 2 - Run frontend with hot reload
cd client && npm run dev

# 6. Access at http://localhost:5173 (NOT 3090!)
# Changes appear instantly on save!
```

#### **Approach B: Quick Frontend Rebuild (For Testing Production Build)**
**When to use**: Testing how changes look in production build
**Pros**: Tests actual production build, relatively fast
**Cons**: No hot reloading, 2-3 minute rebuild time

```bash
# 1. Make your frontend changes

# 2. Rebuild frontend only
npm run frontend

# 3. Force rebuild Docker image with cache bust
CACHEBUST=$(date +%s) docker compose build api

# 4. Restart container
docker compose up -d

# 5. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+F5 on PC)
```

#### **Approach C: Full Docker Development (For Container-Specific Testing)**
**When to use**: Testing container-specific features, nginx routing, production environment
**Pros**: Exact production environment
**Cons**: Slowest option (5-10 minutes), requires full rebuild

```bash
# 1. Make your changes

# 2. Clear Docker builder cache
docker builder prune -f

# 3. Full rebuild with no cache
CACHEBUST=$(date +%s) docker compose build api --no-cache

# 4. Full restart
docker compose down
docker compose up -d

# 5. Clear browser cache completely
# Chrome: Settings → Privacy → Clear browsing data → Cached images
```

### Quick Decision Tree
```
Need instant feedback while coding? → Use Approach A (Dev Mode)
Testing production build? → Use Approach B (Quick Rebuild)  
Debugging Docker/deployment issues? → Use Approach C (Full Rebuild)
```

### Common Issues and Solutions

#### Visual changes not appearing after rebuild?
1. **Browser Cache**: Always hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. **Docker Cache**: Use CACHEBUST environment variable
3. **CDN/Proxy Cache**: Check nginx isn't caching static assets
4. **Wrong Port**: Dev mode uses 5173, production uses 3090

#### Build seems stuck?
```bash
# Check what's happening
docker logs LibreChat --tail 50

# Force stop and clean rebuild
docker compose down
docker system prune -f
CACHEBUST=$(date +%s) docker compose build api --no-cache
```

#### Port conflicts?
```bash
# Check what's using ports
lsof -i :3090  # Production port
lsof -i :5173  # Dev port

# Kill process using port
kill -9 $(lsof -t -i:3090)
```

### Best Practices
1. **Always use dev mode for active UI development**
2. **Commit working UI states before major changes**
3. **Use descriptive CACHEBUST values**: `CACHEBUST=skool-integration-v1`
4. **Tag working images**: `docker tag librechat-custom:latest librechat-custom:working-$(date +%Y%m%d)`
5. **Document visual changes with screenshots**

### Environment Variables for Development
```bash
# .env.development (create if doesn't exist)
NODE_ENV=development
DEBUG_LOGGING=true
VITE_REFRESH=true
```

### Quick Scripts Available
- **`./dev-mode.sh`** - Sets up development mode with hot reloading
- **`./rebuild-frontend.sh`** - Quick frontend rebuild for production testing
- **`./clear-cache-rebuild.sh`** - Full cache clear and rebuild (nuclear option)