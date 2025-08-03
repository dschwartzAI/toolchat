name: "LibreChat Native RAG Implementation PRP"
description: |

## Purpose
Implement LibreChat's native RAG (Retrieval-Augmented Generation) system for the AI Business Tools Platform, specifically configuring the Dark JK Coach agent to use pgVector-based document retrieval and the Hybrid Offer Printer agent for conversational document generation.

## Core Principles
1. **Use LibreChat's Native RAG**: Leverage built-in RAG API and pgVector database
2. **Agent-Based Tools**: Configure agents as business tools with RAG capabilities
3. **Production Ready**: Hide technical complexity from end users
4. **Business Focus**: Each agent serves specific business needs
5. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Deploy LibreChat with native RAG system enabling:
- Dark JK Coach agent accessing James Kemp's knowledge base via vector search
- Hybrid Offer Printer generating sales letters through guided conversations
- Admin-managed content through LibreChat's file management system
- Production configuration hiding technical details from business users

## Why
- **Business Value**: Premium users get AI-powered coaching with James Kemp's methodology
- **Scalability**: pgVector handles large knowledge bases efficiently  
- **User Experience**: Natural conversation interface for complex business tools
- **Data Control**: Self-hosted RAG keeps business knowledge private

## What
Business users select agents from LibreChat interface:
- **Dark JK Coach**: Conversational coaching using RAG-retrieved context
- **Hybrid Offer Printer**: Interactive sales letter creation with artifacts
- **Admin Panel**: Upload/manage knowledge base documents
- **Premium Access**: Tier-based agent availability

### Success Criteria
- [ ] Dark JK Coach retrieves relevant JK content for coaching queries
- [ ] Hybrid Offer Printer generates 1500+ word sales letters
- [ ] Admin can bulk upload documents to RAG system
- [ ] Users see only business tools, not technical configuration
- [ ] RAG API indexes and retrieves documents successfully

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://www.librechat.ai/docs/features/rag_api
  why: Official RAG API setup and configuration guide
  
- url: https://www.librechat.ai/docs/configuration/rag_api  
  why: Environment variables and docker configuration
  
- url: https://www.librechat.ai/docs/features/agents#file-search
  why: How agents use vector stores for retrieval
  
- url: https://github.com/danny-avila/rag_api
  why: RAG API implementation details and pgVector setup
  
- file: /Users/danielschwartz/jk-ai/jk-ai/LibreChat/rag.yml
  why: Existing pgVector and RAG API docker configuration
  
- file: /Users/danielschwartz/jk-ai/jk-ai/config/agents/darkjk-config.json
  why: Dark JK agent configuration with vector store reference
  
- file: /Users/danielschwartz/jk-ai/jk-ai/config/librechat.yaml
  why: Main LibreChat configuration for agents and endpoints

- docfile: /Users/danielschwartz/jk-ai/jk-ai/CLAUDE.md
  why: Global project rules and architecture principles
```

### Current Codebase Tree
```bash
jk-ai/
├── LibreChat/
│   ├── docker-compose.yml      # Main compose with RAG integration
│   ├── rag.yml                 # pgVector and RAG API services
│   └── helm/                   # Kubernetes configs
├── config/
│   ├── librechat.yaml         # Main LibreChat config
│   └── agents/
│       ├── darkjk-config.json # Dark JK agent with vector store
│       └── hybrid-offer-config.json # Hybrid offer agent
├── examples/                   # Missing RAG examples to create
└── RAG.md                     # Feature requirements
```

### Desired Codebase Tree with Files to Add
```bash
jk-ai/
├── LibreChat/
│   ├── docker-compose.override.yml  # Production RAG config
│   └── .env.production             # Production environment vars
├── config/
│   └── librechat.production.yaml   # Hide technical UI elements
├── examples/
│   ├── darkjk-rag-setup.md        # Migration guide for JK content
│   ├── hybrid-offer-prd.md        # Full conversation flow spec
│   ├── rag-api-config/
│   │   ├── docker-compose.rag.yml # Example RAG configuration
│   │   └── .env.rag.example       # RAG environment template
│   ├── agent-configs/
│   │   ├── darkjk-export.json    # Exportable agent config
│   │   └── hybrid-export.json    # Exportable agent config
│   ├── librechat-yaml/
│   │   └── production.yaml        # Production config example
│   └── migration-scripts/
│       ├── bulk-upload.py         # Script for bulk document upload
│       └── prepare-jk-content.py  # Prepare JK docs for upload
├── scripts/
│   ├── setup-rag.sh              # One-click RAG setup
│   └── upload-knowledge-base.sh  # Upload JK content
└── docs/
    └── rag-deployment-guide.md   # Production deployment steps
```

### Known Gotchas & Library Quirks
```yaml
# CRITICAL: LibreChat RAG requires specific setup order
# 1. pgVector database must be initialized before RAG API
# 2. RAG API must be running before main LibreChat API
# 3. Vector store IDs must be created before agent configuration

# pgVector specifics:
# - Requires PostgreSQL 15+ with pgvector extension
# - Default chunk size: 512 tokens (tunable via CHUNK_SIZE)
# - Default overlap: 128 tokens (tunable via CHUNK_OVERLAP)

# RAG API limitations:
# - File upload UI works but bulk upload has issues (use API directly)
# - Supports .txt, .pdf, .md, .docx formats
# - Max file size: 50MB default (configurable)
# - Embedding model: text-embedding-3-small (OpenAI default)

# Agent configuration:
# - vector_store_ids must be array even for single store
# - file_search tool required for RAG functionality
# - max_num_results affects response time (8-10 optimal)

# Production considerations:
# - Use managed PostgreSQL for production (AWS RDS, etc)
# - Monitor embedding costs (OpenAI API usage)
# - Plan for ~50MB storage per 100 documents
# - Backup vector database regularly
```

## Implementation Blueprint

### Data Models and Structure

```yaml
# Docker service structure
services:
  vectordb:          # pgVector PostgreSQL database
  rag_api:          # LibreChat RAG API service  
  api:              # Main LibreChat API (depends on rag_api)
  mongodb:          # User data and conversations
  
# Agent structure
agent:
  tools: ["file_search"]  # Required for RAG
  tool_resources:
    file_search:
      vector_store_ids: ["store_id"]  # From RAG API
      
# Environment variables
RAG_OPENAI_API_KEY: "sk-..."  # For embeddings
EMBEDDINGS_PROVIDER: "openai"
EMBEDDINGS_MODEL: "text-embedding-3-small"
CHUNK_SIZE: 512
CHUNK_OVERLAP: 128
```

### List of Tasks to Complete

```yaml
Task 1: Create production docker-compose override
MODIFY LibreChat/docker-compose.override.yml:
  - EXTEND rag.yml configuration
  - ADD production environment variables
  - CONFIGURE external PostgreSQL if available
  - SET resource limits for production

Task 2: Configure production environment
CREATE LibreChat/.env.production:
  - COPY from .env.example
  - SET RAG_OPENAI_API_KEY for embeddings
  - CONFIGURE PostgreSQL connection
  - SET appropriate CHUNK_SIZE/OVERLAP
  - HIDE technical UI elements

Task 3: Create production LibreChat configuration
CREATE config/librechat.production.yaml:
  - DISABLE agent builder for non-admins
  - HIDE model selection from users
  - CONFIGURE agent presets
  - SET user tier restrictions

Task 4: Create RAG setup documentation
CREATE examples/darkjk-rag-setup.md:
  - DOCUMENT JK content preparation steps
  - EXPLAIN file format requirements
  - PROVIDE upload instructions
  - INCLUDE vector store creation

Task 5: Create bulk upload script
CREATE scripts/upload-knowledge-base.sh:
  - USE RAG API endpoints directly
  - HANDLE multiple file formats
  - PROVIDE progress feedback
  - CREATE vector stores automatically

Task 6: Create agent export configurations
CREATE examples/agent-configs/darkjk-export.json:
  - EXPORT Dark JK agent configuration
  - INCLUDE system prompts
  - DOCUMENT vector store setup
  - PROVIDE import instructions

Task 7: Create setup automation script
CREATE scripts/setup-rag.sh:
  - CHECK prerequisites (Docker, etc)
  - START pgVector database
  - WAIT for initialization
  - START RAG API service
  - CREATE initial vector stores
  - OUTPUT configuration values

Task 8: Create deployment guide
CREATE docs/rag-deployment-guide.md:
  - PROVIDE step-by-step setup
  - INCLUDE troubleshooting section
  - DOCUMENT backup procedures
  - EXPLAIN monitoring setup
```

### Per Task Implementation Details

```bash
# Task 1: Docker Compose Override
# File: LibreChat/docker-compose.override.yml
version: '3.8'
services:
  vectordb:
    restart: always
    environment:
      POSTGRES_DB: librechat_vectors
      POSTGRES_USER: ${POSTGRES_USER:-librechat}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgvector_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U librechat"]
      
  rag_api:
    image: ghcr.io/danny-avila/librechat-rag-api-dev:latest
    environment:
      - EMBEDDINGS_PROVIDER=${EMBEDDINGS_PROVIDER:-openai}
      - EMBEDDINGS_MODEL=${EMBEDDINGS_MODEL:-text-embedding-3-small}
      - CHUNK_SIZE=${CHUNK_SIZE:-512}
      - CHUNK_OVERLAP=${CHUNK_OVERLAP:-128}
    depends_on:
      vectordb:
        condition: service_healthy

# Task 5: Bulk Upload Script
# File: scripts/upload-knowledge-base.sh
#!/bin/bash
# Script to bulk upload documents to LibreChat RAG

RAG_API_URL="${RAG_API_URL:-http://localhost:8000}"
API_KEY="${RAG_API_KEY}"

# Create vector store
STORE_ID=$(curl -X POST "$RAG_API_URL/vector-stores" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "JK Knowledge Base"}' | jq -r '.id')

# Upload files
for file in knowledge-base/*.{txt,md,pdf}; do
  if [ -f "$file" ]; then
    echo "Uploading $file..."
    curl -X POST "$RAG_API_URL/files" \
      -H "Authorization: Bearer $API_KEY" \
      -F "file=@$file" \
      -F "vector_store_id=$STORE_ID"
  fi
done

echo "Vector Store ID: $STORE_ID"
echo "Add to DARKJK_VECTOR_STORE_ID in .env"
```

### Integration Points
```yaml
DATABASE:
  - pgVector: PostgreSQL with vector extension
  - MongoDB: User sessions and conversations
  - Vector stores: Created via RAG API
  
CONFIGURATION:
  - .env: RAG_OPENAI_API_KEY, DARKJK_VECTOR_STORE_ID
  - librechat.yaml: Agent configurations
  - docker-compose: Service dependencies
  
APIS:
  - RAG API: http://rag_api:8000
  - File upload: /api/files/upload
  - Vector store: /api/vector-stores
```

## Validation Loop

### Level 1: Service Health
```bash
# Verify all services are running
docker-compose -f docker-compose.yml -f docker-compose.override.yml ps

# Check pgVector is ready
docker-compose exec vectordb pg_isready -U librechat

# Verify RAG API is responding
curl http://localhost:8000/health

# Expected: All services "Up" and health checks passing
```

### Level 2: RAG Functionality
```bash
# Test file upload to RAG
curl -X POST http://localhost:8000/files \
  -H "Authorization: Bearer $RAG_API_KEY" \
  -F "file=@test-document.txt"

# Test vector search
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "business coaching", "vector_store_id": "$STORE_ID"}'

# Expected: Successful upload and relevant search results
```

### Level 3: Agent Integration
```bash
# Test Dark JK agent with RAG
# 1. Login to LibreChat UI
# 2. Select "Dark JK Business Coach" agent
# 3. Ask: "What does James say about pricing strategy?"
# 4. Verify response includes retrieved context

# Test via API
curl -X POST http://localhost:3080/api/chat/new \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "darkjk",
    "message": "What are the key principles of creating a hybrid offer?"
  }'

# Expected: Response with context from JK knowledge base
```

## Final Validation Checklist
- [ ] pgVector database initialized and healthy
- [ ] RAG API service running and connected to pgVector
- [ ] LibreChat API connected to RAG API
- [ ] Dark JK agent configured with vector store ID
- [ ] Knowledge base documents uploaded successfully
- [ ] Agent retrieves relevant context for queries
- [ ] Production UI hides technical configuration
- [ ] Backup strategy documented and tested

---

## Anti-Patterns to Avoid
- ❌ Don't expose vector store IDs to end users
- ❌ Don't skip pgVector initialization before RAG API
- ❌ Don't use synchronous file processing for large uploads
- ❌ Don't forget to monitor embedding API costs
- ❌ Don't hardcode vector store IDs in agent configs
- ❌ Don't skip backup configuration for vector database

## Confidence Score: 9/10
High confidence due to:
- Clear documentation from LibreChat
- Existing working configuration files
- Well-defined docker service architecture
- Established patterns in codebase

Minor uncertainty on:
- Exact bulk upload implementation details
- Production PostgreSQL configuration specifics