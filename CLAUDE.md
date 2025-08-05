# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a heavily customized fork of LibreChat v0.7.9-rc1, transformed into an AI Business Tools Platform. It provides specialized business coaching and consulting tools through native LibreChat agents.

## Essential Commands

### Development
```bash
# Start development servers (run in separate terminals)
npm run backend:dev     # Backend with hot reload on port 3080
npm run frontend:dev    # Frontend on port 5173

# Alternative with bun
npm run b:api:dev      # Bun development backend
```

### Production Build
```bash
npm run frontend       # Build complete frontend (includes all packages)
npm run backend        # Run production backend

# Individual package builds (usually handled by frontend command)
npm run build:api
npm run build:data-provider
npm run build:data-schemas
```

### Testing
```bash
npm run test:client    # Client-side tests
npm run test:api       # API tests
npm run e2e           # Playwright end-to-end tests
npm run e2e:headed    # E2E tests with browser UI
```

### Business Tool Maintenance
```bash
npm run fix-sovereignjk   # Fix SovereignJK provider issues
npm run check-agents      # Check agent provider configurations
```

### User Management
```bash
npm run create-user       # Create new user
npm run invite-user       # Send invitation
npm run list-users        # List all users
npm run reset-password    # Reset user password
npm run ban-user          # Ban user
npm run delete-user       # Delete user
npm run add-balance       # Add user balance
npm run set-balance       # Set user balance
npm run list-balances     # List all balances
```

## High-Level Architecture

### Core Structure
```
/api/                    # Express backend server
  /server/              # Server implementation
    /routes/            # API endpoints
    /services/          # Business logic
    /middleware/        # Custom middleware
/client/                # React frontend application
  /src/
    /components/        # React components
    /hooks/            # Custom React hooks
    /store/            # State management
    /utils/            # Utility functions
/packages/             # Shared npm workspaces
  /api/               # API client library
  /data-provider/     # Data fetching layer
  /data-schemas/      # Shared type definitions
/docs/                # Documentation
librechat.yaml        # Main configuration file
docker-compose.yml    # Service orchestration
Dockerfile           # Custom multi-stage build
```

### Service Architecture
- **Frontend**: React + TypeScript + Vite (port 5173 dev, built to /client/dist)
- **Backend**: Express + MongoDB (port 3080)
- **Database**: MongoDB Atlas (shared between environments)
- **Vector DB**: pgVector for RAG functionality
- **Search**: Meilisearch for full-text search
- **File Storage**: Local filesystem at /images/

### Agent System Architecture
Agents are LibreChat's native implementation with:
- MongoDB storage for agent configurations
- File-based avatar system with user-specific directories
- ModelSpecs in librechat.yaml for UI configuration
- Shared agents across all users (not assistant-based)

## Key Configuration Files

### librechat.yaml
Controls the entire platform behavior:
- **UI Customization**: Hidden technical elements, business terminology
- **Agent Capabilities**: file_search, artifacts, tools, actions, web_search
- **Model Specifications**: Defines all business tools (DarkJK, Hybrid Offer Printer, etc.)
- **Memory System**: Business-specific context keys
- **MCP Servers**: DarkJK knowledge base integration

### docker-compose.yml
Orchestrates all services:
- LibreChat API (custom image: dschwartz06/librechat:production-solo-os)
- MongoDB (local instance)
- Meilisearch (search functionality)
- RAG API (knowledge base)
- pgVector (vector database)

### .env Configuration
Critical environment variables:
- `MONGO_URI`: MongoDB Atlas connection (shared between local/production)
- `APP_TITLE`: Solo:OS
- API Keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY
- `DARKJK_VECTOR_STORE_ID`: OpenAI vector store for DarkJK knowledge

## Business Tools (Agents)

All agents are defined in librechat.yaml under modelSpecs:

1. **DarkJK** (agent_KVXW88WVte1tcyABlAowy) - Default agent, GPT-4o based business coach
2. **Hybrid Offer Printer** (agent_jkxFi4j4VZLDT8voWoXxm) - Claude Sonnet 4 based
3. **Daily Client Machine** (agent_cCc7tBkYYjE3j4NS0QjST) - Client acquisition funnels
4. **Ideal Client Extractor** (agent_DQbu_zXcPMFZCDqq-j3dX) - Claude Opus 4 based
5. **SovereignJK** (agent_odD3oMA9NgaPXQEcf0Pnq) - Mindset coaching
6. **Workshop Copy-Paster** (agent_QCDKPRFv8sY6LC_IWuqrh) - Free tool

## Development Workflow Issues & Solutions

### Frontend Development
Current issues with hot reload require Docker rebuilds. Three approaches:

1. **Direct Development** (Recommended for UI work):
   ```bash
   cd client && npm run dev
   ```

2. **Docker Development** (For full-stack changes):
   ```bash
   docker compose up --build
   ```

3. **Golden State Management** (Production-like):
   ```bash
   docker build -t librechat:golden .
   docker run -p 3080:3080 librechat:golden
   ```

### Agent Icon Synchronization
Agent avatars are stored as files in `/images/{userId}/` directories. When sharing MongoDB between instances:
- Avatar files must exist on both local and production
- Use static icons in librechat.yaml when possible
- Sync avatar files between instances when needed

### MCP Integration
Model Context Protocol servers defined in librechat.yaml:
- **darkjk_knowledge**: Custom knowledge base using OpenAI vector store
- Requires darkjk-mcp package (built into Docker image)

## Custom Implementations

### UI Customizations
- Business terminology throughout (Agents → Business Tools, Conversations → Sessions)
- Hidden technical parameters and model selection
- Custom logos and branding (SovereignAI)
- Dark mode with automatic logo inversion

### Backend Customizations
- Memory system with business-specific keys
- Agent filtering based on user access
- Google Sheets feedback integration
- Custom middleware for tier-based access control

### Deployment
Production uses Docker with:
- Multi-architecture builds (linux/amd64,linux/arm64)
- Custom image: dschwartz06/librechat:production-solo-os
- Environment-specific configurations
- Shared MongoDB Atlas instance

## Important Notes

- **MongoDB Sharing**: Local and production share the same MongoDB Atlas instance
- **File Storage**: Agent avatars and images are instance-specific
- **Vector Store**: DarkJK uses OpenAI vector store (ID in .env)
- **Development**: M1 Mac development vs AMD64 production can cause issues
- **Agents vs Assistants**: Uses native LibreChat agents, not OpenAI assistants