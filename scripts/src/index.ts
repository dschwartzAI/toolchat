#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// DarkJK Vector Store ID
const VECTOR_STORE_ID = 'vs_67df294659c48191bffbe978d27fc6f7';

// Create MCP server
const server = new Server(
  {
    name: 'darkjk-knowledge',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Cache for search results to enable fetch
const searchResultsCache = new Map<string, any>();

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search',
        description: 'Search James Kemp\'s knowledge base for business methodologies and strategies',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch',
        description: 'Retrieve full content of a specific document from the knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the document',
            },
          },
          required: ['id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;

  if (toolName === 'search') {
    const { query } = request.params.arguments as { query: string };
    const startTime = Date.now();
    
    try {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[MCP:DarkJK] Query: "${query}" (${timestamp})`);
      
      // Create a search using the assistant which has the vector store attached
      const thread = await openai.beta.threads.create();
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: query,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: 'asst_2O5apCR6JYRAzrpm544hj4YM',
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      if (runStatus.status !== 'completed') {
        throw new Error(`Search failed: ${runStatus.status}`);
      }

      // Get the response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (!assistantMessage) {
        return { content: [{ type: 'text', text: JSON.stringify([]) }] };
      }

      // Extract content and create search results
      const content = assistantMessage.content[0];
      if (content.type !== 'text') {
        return { content: [{ type: 'text', text: JSON.stringify([]) }] };
      }

      // Parse the response and create search results
      const text = content.text.value;
      const resultId = `result_${Date.now()}`;
      
      // Cache the full response for fetch
      searchResultsCache.set(resultId, {
        id: resultId,
        title: `Knowledge Base Result for: ${query}`,
        text: text.substring(0, 200) + '...',
        full_text: text,
        url: `darkjk://knowledge/${resultId}`
      });

      // Log response details
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[MCP:DarkJK] Response: ${text.length} chars in ${duration}s`);
      console.error(`[MCP:DarkJK] Content preview: "${text.substring(0, 150).replace(/\n/g, ' ')}..."`);

      // Return search results in expected format
      const searchResults = [{
        id: resultId,
        title: `Knowledge Base Result for: ${query}`,
        text: text.substring(0, 200) + '...',
        url: `darkjk://knowledge/${resultId}`
      }];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(searchResults),
          },
        ],
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[MCP:DarkJK] ERROR in search after ${duration}s:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([]),
          },
        ],
      };
    }
  }

  if (toolName === 'fetch') {
    const { id } = request.params.arguments as { id: string };
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      console.error(`[MCP:DarkJK] Fetch: document "${id}" (${timestamp})`);
      
      // Retrieve from cache
      const cachedResult = searchResultsCache.get(id);
      
      if (!cachedResult) {
        console.error(`[MCP:DarkJK] Document not found in cache: ${id}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: id,
                title: 'Not Found',
                text: 'Document not found or expired from cache',
                url: `darkjk://knowledge/${id}`
              }),
            },
          ],
        };
      }

      // Return full document
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              id: cachedResult.id,
              title: cachedResult.title,
              text: cachedResult.full_text,
              url: cachedResult.url,
              metadata: {
                source: 'DarkJK Knowledge Base',
                type: 'methodology'
              }
            }),
          },
        ],
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              id: id,
              title: 'Error',
              text: `Error fetching document: ${error instanceof Error ? error.message : 'Unknown error'}`,
              url: `darkjk://knowledge/${id}`
            }),
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${toolName}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DarkJK MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});