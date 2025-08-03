# DarkJK MCP Server

This MCP (Model Context Protocol) server provides access to James Kemp's knowledge base through OpenAI's vector store.

## Features

- Search James Kemp's business methodologies and strategies
- Access Dark Horse framework content
- Query coaching materials and business insights

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your OpenAI API key:
```bash
# Copy the .env file and add your API key
cp .env .env.local
# Edit .env to add your OPENAI_API_KEY
```

3. Build the TypeScript code:
```bash
npm run build
```

## Testing

Test the vector store connection:
```bash
npm test
```

## Running the MCP Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Using with LibreChat

Add this configuration to your `librechat.yaml`:

```yaml
mcpServers:
  darkjk_knowledge:
    type: stdio
    command: node
    args:
      - "/absolute/path/to/darkjk-mcp/dist/index.js"
    env:
      OPENAI_API_KEY: "${OPENAI_API_KEY}"
    timeout: 120000
    chatMenu: true
    description: "James Kemp's business knowledge base - methodologies and strategies"
```

## Available Tools

### search_jk_knowledge
Search the knowledge base for specific information about:
- Dark Horse methodology
- Business strategies
- Coaching frameworks
- Sales techniques
- Content creation approaches

Example queries:
- "What is the Dark Horse methodology?"
- "How to create a hybrid offer?"
- "James Kemp's approach to sales"

## Architecture

This MCP server:
1. Receives search queries through the MCP protocol
2. Creates a thread with OpenAI's Assistants API
3. Runs the DarkJK assistant with file_search enabled
4. Returns formatted results to the agent

## Security Notes

- API keys are loaded from environment variables
- All queries are logged to stderr for debugging
- No data is stored locally
- Uses OpenAI's secure API endpoints