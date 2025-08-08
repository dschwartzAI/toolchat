# Perplexity Integration for Web Search

## Overview
LibreChat now supports Perplexity AI for web search through the Model Context Protocol (MCP). This provides an alternative to the built-in Firecrawl/Serper web search functionality.

## Configuration

### 1. Enable Perplexity MCP Server
The Perplexity MCP server is already configured in `librechat.yaml`:

```yaml
mcpServers:
  perplexity:
    type: stdio
    command: npx
    args:
      - "perplexity-mcp"
    env:
      PERPLEXITY_API_KEY: "${PERPLEXITY_API_KEY}"
    timeout: 120000
    chatMenu: true
    description: "AI-powered web research and deep analysis"
```

### 2. Set Perplexity API Key
Add your Perplexity API key to `.env`:
```
PERPLEXITY_API_KEY=your_api_key_here
```

## Using Perplexity in Agents

### Option 1: Use Perplexity MCP Tools
When creating or editing an agent in the Agent Builder:
1. Go to the Tools section
2. Select `mcp:perplexity` from the available tools
3. Save the agent

The agent will now have access to three Perplexity search models:
- **search** - Quick searches for simple queries (Sonar Pro)
- **reason** - Complex analysis and problem-solving (Sonar Reasoning Pro)  
- **deep_research** - Comprehensive research reports (Sonar Deep Research)

### Option 2: Keep Built-in Web Search
Agents can still use the built-in web search by enabling the "Web Search" checkbox, which uses Firecrawl for scraping and Serper for search.

## Comparison

### Perplexity MCP
**Pros:**
- Advanced AI-powered search with source citations
- Multiple search models optimized for different tasks
- Automatic query complexity detection
- Real-time web access with comprehensive results

**Cons:**
- Requires Perplexity API key
- Separate API costs

### Built-in Web Search (Firecrawl/Serper)
**Pros:**
- Integrated into LibreChat core
- Works with the web_search checkbox
- Can be configured system-wide

**Cons:**
- Requires multiple API keys (Serper, Firecrawl, Jina/Cohere)
- Less intelligent search capabilities

## Example Agent Configuration

To create an agent with Perplexity search:

```json
{
  "name": "Research Assistant",
  "instructions": "You are a research assistant with access to Perplexity's advanced search capabilities.",
  "tools": ["mcp:perplexity"],
  "model": "gpt-4o",
  "provider": "openai"
}
```

## Troubleshooting

1. **Perplexity tools not showing:** Ensure the Perplexity MCP server is enabled in librechat.yaml
2. **Authentication errors:** Verify your PERPLEXITY_API_KEY is set correctly in .env
3. **Tool not working:** Restart the backend server after configuration changes

## Notes

- Both Perplexity MCP and built-in web search can be used simultaneously
- Different agents can use different search methods
- The Perplexity MCP automatically selects the best model based on query complexity