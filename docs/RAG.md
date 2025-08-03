LibreChat Business Tools Platform with Native RAG
FEATURE:

LibreChat deployment using native Agents system with built-in RAG API for document retrieval
Two specialized agents appearing as business tools: Dark JK Coach (GPT-4o with LibreChat RAG) and Hybrid Offer Printer (Claude with artifacts)
Users select agents from native LibreChat interface without seeing technical complexity
Dark JK Coach uses LibreChat's PostgreSQL/pgVector RAG system for James Kemp's content
Hybrid Offer Printer generates 1500+ word sales letters through conversational flow
Admin uploads and manages knowledge base content through LibreChat's file management
Production configuration hides agent builder and technical settings from end users
Each agent maintains separate conversation context and file associations

EXAMPLES:
In the examples/ folder:

examples/darkjk-rag-setup.md - Complete guide for migrating JK content to LibreChat's RAG system
examples/hybrid-offer-prd.md - Full PRD with conversation flow and document generation specs
examples/rag-api-config/ - Docker compose and environment configurations for RAG API
examples/agent-configs/ - [TO BE ADDED] Export files for both agents with complete settings
examples/librechat-yaml/ - [TO BE ADDED] Production configurations hiding complexity
examples/migration-scripts/ - [TO BE ADDED] Scripts for bulk uploading content to RAG

Read the setup guides to understand RAG configuration and agent implementation.
DOCUMENTATION:

LibreChat RAG API Guide: https://www.librechat.ai/docs/features/rag_api
RAG API Configuration: https://www.librechat.ai/docs/configuration/rag_api
LibreChat Agents: https://www.librechat.ai/docs/features/agents
Agent File Search: https://www.librechat.ai/docs/features/agents#file-search
PostgreSQL pgVector Setup: https://github.com/danny-avila/rag_api
LibreChat Docker Compose: https://www.librechat.ai/docs/configuration/docker_compose
Optimizing RAG Performance: https://www.librechat.ai/blog/2025-04-25_optimizing-rag-performance-in-librechat

OTHER CONSIDERATIONS:

LibreChat RAG requires PostgreSQL with pgVector extension (included in default docker setup)
Must configure RAG API environment variables: RAG_OPENAI_API_KEY, embeddings settings
File uploads through UI work but programmatic bulk upload has reported issues
Each file uploaded gets converted to embeddings using configured model (OpenAI ada-002 default)
RAG API supports OpenAI, Azure, HuggingFace TEI, and Ollama embeddings
File Search capability in agents automatically queries the RAG database
Consider performance tuning: chunk size, overlap, top_k results for optimal retrieval
Production deployment should use external managed PostgreSQL for reliability
Agent file associations persist across conversations within same agent context
Success = users select "Dark JK Coach" and get contextual coaching from knowledge base
Monitor RAG API logs for indexing status and retrieval performance
Plan for ~50MB per 100 documents in vector storage space
Include backup strategy for PostgreSQL vector database