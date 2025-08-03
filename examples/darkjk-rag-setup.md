# Dark JK Business Coach RAG Setup Guide

This guide walks you through setting up the RAG (Retrieval-Augmented Generation) system for the Dark JK Business Coach, enabling it to access James Kemp's knowledge base for contextual coaching responses.

## Overview

The Dark JK Business Coach uses LibreChat's native RAG API with pgVector to store and retrieve James Kemp's business coaching content. When users ask questions, the system searches the knowledge base and provides responses grounded in JK's methodology.

## Prerequisites

- LibreChat with RAG services running (docker-compose with pgVector and RAG API)
- OpenAI API key for embeddings
- James Kemp's content prepared in supported formats (txt, md, pdf, docx)
- Admin access to LibreChat

## Content Preparation

### 1. Organize JK Content

Create a directory structure for your knowledge base:

```bash
jk-knowledge-base/
├── foundations/
│   ├── hybrid-offers.md
│   ├── pricing-strategies.txt
│   └── value-creation.pdf
├── client-acquisition/
│   ├── lead-generation.md
│   ├── sales-conversations.txt
│   └── closing-techniques.pdf
├── business-strategy/
│   ├── scaling-principles.md
│   ├── leverage-points.txt
│   └── market-positioning.pdf
└── mindset/
    ├── entrepreneur-psychology.md
    ├── overcoming-limits.txt
    └── peak-performance.pdf
```

### 2. Format Guidelines

For optimal RAG performance:

- **Markdown files**: Use clear headers and sections
- **Text files**: One concept per paragraph, clear topic sentences
- **PDF files**: Ensure text is selectable (not scanned images)
- **File size**: Keep individual files under 10MB
- **Content chunking**: Natural breaks every 300-500 words

### 3. Content Optimization

Structure content for better retrieval:

```markdown
# Topic: Creating Hybrid Offers

## Key Principle
A hybrid offer combines multiple delivery methods to maximize value while minimizing your time investment.

## Components
1. **Core Transformation**: The main result you deliver
2. **Delivery Methods**: Group, 1-on-1, digital, live
3. **Price Anchoring**: Strategic positioning for premium pricing

## Example Application
[Specific example of a successful hybrid offer...]
```

## Upload Process

### Method 1: Bulk Upload Script (Recommended)

Use the provided bulk upload script:

```bash
# Set environment variables
export RAG_API_URL=http://localhost:8000
export RAG_API_KEY=your-rag-api-key

# Run bulk upload
./scripts/upload-knowledge-base.sh /path/to/jk-knowledge-base
```

The script will:
1. Create a new vector store named "JK Knowledge Base"
2. Upload all supported files
3. Generate embeddings using OpenAI
4. Output the vector store ID

### Method 2: Manual Upload via UI

1. Login to LibreChat as admin
2. Navigate to Files → Vector Stores
3. Create new vector store: "JK Knowledge Base"
4. Upload files one by one or in batches
5. Wait for processing (check status indicator)

### Method 3: API Upload

For programmatic uploads:

```bash
# Create vector store
STORE_ID=$(curl -X POST http://localhost:8000/vector-stores \
  -H "Authorization: Bearer $RAG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "JK Knowledge Base", "description": "James Kemp business coaching content"}' \
  | jq -r '.id')

# Upload a file
curl -X POST http://localhost:8000/files \
  -H "Authorization: Bearer $RAG_API_KEY" \
  -F "file=@hybrid-offers.md" \
  -F "vector_store_id=$STORE_ID" \
  -F "metadata={\"category\":\"foundations\",\"topic\":\"offers\"}"
```

## Configuration

### 1. Update Environment Variables

Add the vector store ID to your `.env` file:

```bash
DARKJK_VECTOR_STORE_ID=vs_abc123xyz  # Your generated store ID
```

### 2. Verify Agent Configuration

The Dark JK agent should have these settings in `config/agents/darkjk-config.json`:

```json
{
  "tools": [
    {
      "type": "file_search"
    }
  ],
  "tool_resources": {
    "file_search": {
      "vector_store_ids": ["${DARKJK_VECTOR_STORE_ID}"],
      "max_num_results": 8
    }
  }
}
```

### 3. Test the Integration

Test queries to verify RAG is working:

```bash
# Via API
curl -X POST http://localhost:3080/api/chat/new \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "darkjk",
    "message": "What does James say about creating hybrid offers?"
  }'
```

Expected response should include:
- Specific content from JK's materials
- Contextual coaching advice
- References to uploaded documents

## Content Management

### Adding New Content

1. Prepare new files following format guidelines
2. Upload to the same vector store
3. Content is immediately available for retrieval

### Updating Existing Content

1. Delete old file from vector store
2. Upload updated version
3. Embeddings regenerate automatically

### Monitoring Performance

Check RAG API logs for:
- Embedding generation status
- Search query performance
- Retrieval accuracy metrics

```bash
docker logs librechat-rag-api --tail 100
```

## Optimization Tips

### 1. Chunk Size Tuning

Adjust in `.env` for your content:
```bash
CHUNK_SIZE=512        # Default, good for concepts
CHUNK_OVERLAP=128     # Ensures context continuity
```

### 2. Search Results

Configure in agent settings:
```json
"max_num_results": 8  # Balance between context and speed
```

### 3. Content Categories

Use metadata for better organization:
```json
"metadata": {
  "category": "pricing",
  "level": "advanced",
  "format": "framework"
}
```

## Troubleshooting

### Common Issues

1. **No results returned**
   - Check vector store ID is correct
   - Verify files were processed (check logs)
   - Test with broader queries

2. **Slow responses**
   - Reduce max_num_results
   - Check pgVector performance
   - Monitor embedding API rate limits

3. **Irrelevant results**
   - Review content chunking
   - Adjust chunk size/overlap
   - Improve content structure

### Debug Commands

```bash
# Check vector store status
curl http://localhost:8000/vector-stores/$STORE_ID

# List files in store
curl http://localhost:8000/vector-stores/$STORE_ID/files

# Test search directly
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "hybrid offers", "vector_store_id": "'$STORE_ID'"}'
```

## Best Practices

1. **Regular Updates**: Keep knowledge base current with JK's latest content
2. **Quality Control**: Review retrieved content periodically
3. **User Feedback**: Monitor coaching quality through user interactions
4. **Backup Strategy**: Regular PostgreSQL backups of vector database
5. **Cost Monitoring**: Track OpenAI embedding API usage

## Next Steps

After successful setup:
1. Test with various coaching queries
2. Fine-tune retrieval parameters
3. Document successful query patterns
4. Train admin team on content management
5. Set up monitoring and alerts

For additional support, refer to:
- [LibreChat RAG Documentation](https://www.librechat.ai/docs/features/rag_api)
- [pgVector Performance Guide](https://github.com/pgvector/pgvector)
- Admin training materials