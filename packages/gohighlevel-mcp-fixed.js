#!/usr/bin/env node

/**
 * GoHighLevel MCP Wrapper - Fixed Version
 * This wrapper connects to the GoHighLevel MCP endpoint and exposes it as a stdio MCP server
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fetch = require('node-fetch');

// GoHighLevel configuration
const GHL_MCP_URL = 'https://services.leadconnectorhq.com/mcp/';
const API_KEY = process.env.GHL_API_KEY || 'pit-03d0718e-dc62-455a-a09d-e674e897d01e';
const LOCATION_ID = process.env.GHL_LOCATION_ID || '4BO06AvPiDJEeqf2WhmU';

// Create MCP server
const server = new McpServer({
  name: 'gohighlevel',
  version: '1.0.0',
});

// Cache for available tools
let cachedTools = null;
let toolsLastFetched = 0;
const TOOLS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch available tools from GoHighLevel MCP
 */
async function fetchTools() {
  const now = Date.now();
  
  // Return cached tools if still valid
  if (cachedTools && (now - toolsLastFetched) < TOOLS_CACHE_TTL) {
    return cachedTools;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    
    if (LOCATION_ID) {
      headers['locationId'] = LOCATION_ID;
    }

    console.error('[GoHighLevel MCP] Fetching tools from GoHighLevel API...');

    // Make request to GoHighLevel MCP to get available tools
    const response = await fetch(GHL_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    
    // Parse SSE response
    let jsonData = null;
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          jsonData = JSON.parse(line.substring(6));
          break;
        } catch (e) {
          // Continue to next line
        }
      }
    }
    
    cachedTools = jsonData?.result?.tools || [];
    toolsLastFetched = now;
    
    console.error(`[GoHighLevel MCP] Fetched ${cachedTools.length} tools from GoHighLevel`);
    
    return cachedTools;
  } catch (error) {
    console.error('[GoHighLevel MCP] Error fetching tools:', error);
    // Return empty array if fetch fails
    return [];
  }
}

/**
 * Execute a tool on GoHighLevel
 */
async function executeTool(name, args = {}) {
  try {
    console.error(`[GoHighLevel MCP] Executing ${name} with arguments:`, JSON.stringify(args));
    
    // Ensure locationId is included
    const toolArgs = { ...args };
    if (!toolArgs.locationId && LOCATION_ID) {
      toolArgs.locationId = LOCATION_ID;
    }
    
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    
    if (LOCATION_ID) {
      headers['locationId'] = LOCATION_ID;
    }

    const response = await fetch(GHL_MCP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name,
          arguments: toolArgs
        },
        id: Date.now()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GoHighLevel MCP] API Error Response:`, errorText);
      throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.error(`[GoHighLevel MCP] Raw response:`, text.substring(0, 500));
    
    // Parse SSE response
    let jsonData = null;
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          jsonData = JSON.parse(line.substring(6));
          break;
        } catch (e) {
          console.error(`[GoHighLevel MCP] Failed to parse line:`, line);
        }
      }
    }
    
    if (jsonData?.error) {
      throw new Error(`GoHighLevel API error: ${JSON.stringify(jsonData.error)}`);
    }
    
    const result = jsonData?.result || {};
    
    // Format response for MCP
    if (result.content) {
      return result;
    }
    
    // Default response format
    return { 
      content: [{ 
        type: 'text', 
        text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      }] 
    };
  } catch (error) {
    console.error(`[GoHighLevel MCP] Error executing tool ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
}

/**
 * Initialize and start the MCP server
 */
async function main() {
  console.error('[GoHighLevel MCP] Starting wrapper server...');
  console.error('[GoHighLevel MCP] Using API key:', API_KEY.substring(0, 10) + '...');
  console.error('[GoHighLevel MCP] Using location ID:', LOCATION_ID);

  // Fetch tools on startup
  const tools = await fetchTools();

  // Register each tool with simplified schema
  for (const tool of tools) {
    console.error(`[GoHighLevel MCP] Registering tool: ${tool.name}`);
    
    // Create a simplified schema that won't cause validation issues
    const inputSchema = {
      type: 'object',
      properties: {},
      additionalProperties: true  // Allow any properties
    };
    
    // If the tool has specific required parameters, add them
    if (tool.inputSchema && tool.inputSchema.properties) {
      for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
        inputSchema.properties[key] = {
          type: value.type || 'string',
          description: value.description || `Parameter ${key}`
        };
      }
    }
    
    server.registerTool(
      tool.name,
      {
        title: tool.title || tool.name,
        description: tool.description || `GoHighLevel tool: ${tool.name}`,
        inputSchema: inputSchema
      },
      async (args) => {
        return await executeTool(tool.name, args);
      }
    );
  }

  // Set up transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[GoHighLevel MCP] Server connected and ready');
  console.error(`[GoHighLevel MCP] ${tools.length} tools available`);
}

// Start the server
main().catch((error) => {
  console.error('[GoHighLevel MCP] Fatal error:', error);
  process.exit(1);
});