#!/usr/bin/env node

/**
 * GoHighLevel MCP Wrapper
 * This wrapper connects to the GoHighLevel MCP endpoint and exposes it as a stdio MCP server
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fetch = require('node-fetch');

// GoHighLevel configuration
const GHL_MCP_URL = 'https://services.leadconnectorhq.com/mcp/';
const API_KEY = process.env.GHL_API_KEY || 'pit-03d0718e-dc62-455a-a09d-e674e897d01e';
const LOCATION_ID = process.env.GHL_LOCATION_ID || '';

// Cache for available tools
let cachedTools = null;
let toolsLastFetched = 0;
const TOOLS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch available tools from GoHighLevel MCP and register them
 */
async function fetchAndRegisterTools(server) {
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
        id: 1
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
    
    // Register each tool with the MCP server
    for (const tool of cachedTools) {
      console.error(`[GoHighLevel MCP] Registering tool: ${tool.name}`);
      
      // Ensure inputSchema is properly formatted
      let inputSchema = { type: 'object', properties: {} };
      
      if (tool.inputSchema) {
        // Ensure it's a valid JSON schema format
        if (typeof tool.inputSchema === 'object') {
          inputSchema = {
            type: 'object',
            properties: tool.inputSchema.properties || {},
            required: tool.inputSchema.required || []
          };
        }
      }
      
      server.registerTool(
        tool.name,
        {
          title: tool.name,
          description: tool.description || `GoHighLevel tool: ${tool.name}`,
          inputSchema: inputSchema
        },
        async (args) => {
          console.error(`[GoHighLevel MCP] Executing tool: ${tool.name} with args:`, JSON.stringify(args));
          
          // Add location ID if not provided
          const enrichedArgs = { ...args };
          if (!enrichedArgs.locationId && LOCATION_ID) {
            enrichedArgs.locationId = LOCATION_ID;
          }
          
          return await executeTool(tool.name, enrichedArgs);
        }
      );
    }
    
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
async function executeTool(name, args) {
  try {
    console.error(`[GoHighLevel MCP] Executing ${name} with arguments:`, args);
    
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    
    // Always include location ID in headers if available
    if (LOCATION_ID) {
      headers['locationId'] = LOCATION_ID;
    }
    
    // Ensure args has locationId if needed
    const toolArgs = { ...args };
    if (!toolArgs.locationId && LOCATION_ID) {
      toolArgs.locationId = LOCATION_ID;
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
      throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
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
        text: `Error executing ${name}: ${error.message}`
      }]
    };
  }
}

// Start the server
async function main() {
  console.error('[GoHighLevel MCP] Starting wrapper server...');
  console.error(`[GoHighLevel MCP] Using API key: ${API_KEY.substring(0, 10)}...`);
  if (LOCATION_ID) {
    console.error(`[GoHighLevel MCP] Using location ID: ${LOCATION_ID}`);
  }
  
  // Create MCP server
  const server = new McpServer({
    name: 'gohighlevel-mcp',
    version: '1.0.0',
    capabilities: {
      tools: {}
    }
  });
  
  // Fetch and register tools before connecting
  await fetchAndRegisterTools(server);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('[GoHighLevel MCP] Server connected and ready');
  console.error(`[GoHighLevel MCP] ${cachedTools?.length || 0} tools available`);
}

main().catch((error) => {
  console.error('[GoHighLevel MCP] Fatal error:', error);
  process.exit(1);
});