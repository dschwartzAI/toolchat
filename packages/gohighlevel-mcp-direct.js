#!/usr/bin/env node

/**
 * GoHighLevel MCP Direct Implementation
 * Bypasses SDK schema validation issues by implementing MCP protocol directly
 */

const readline = require('readline');
const fetch = require('node-fetch');

// GoHighLevel configuration with fallback support
const GHL_MCP_URL = 'https://services.leadconnectorhq.com/mcp/';
const API_KEY = process.env.GHL_API_KEY || process.env.GHL_FALLBACK_KEY || 'pit-b89e253c-2f70-4854-8069-5c4041bd3d50';
const LOCATION_ID = process.env.GHL_LOCATION_ID || process.env.GHL_FALLBACK_LOCATION || '4BO06AvPiDJEeqf2WhmU';

// Cache for available tools
let cachedTools = [];
let toolsMap = new Map();

// Set up stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

/**
 * Send JSON-RPC response
 */
function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  console.log(JSON.stringify(response));
}

/**
 * Log to stderr for debugging
 */
function log(...args) {
  console.error('[GoHighLevel MCP Direct]', ...args);
}

/**
 * Fetch available tools from GoHighLevel
 */
async function fetchTools() {
  try {
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    
    if (LOCATION_ID) {
      headers['locationId'] = LOCATION_ID;
    }

    log('Fetching tools from GoHighLevel API...');

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
    
    // Build tools map for quick lookup
    toolsMap.clear();
    for (const tool of cachedTools) {
      toolsMap.set(tool.name, tool);
    }
    
    log(`Fetched ${cachedTools.length} tools from GoHighLevel`);
    return cachedTools;
  } catch (error) {
    log('Error fetching tools:', error.message);
    return [];
  }
}

/**
 * Execute a tool on GoHighLevel
 */
async function executeTool(name, args = {}) {
  try {
    log(`Executing ${name} with arguments:`, JSON.stringify(args));
    
    // Ensure locationId is included
    const toolArgs = { ...args };
    if (!toolArgs.locationId && LOCATION_ID) {
      toolArgs.locationId = LOCATION_ID;
    }
    
    // Add required parameters for specific tools
    if (name === 'calendars_get-calendar-events') {
      // Add calendarId if not present (using location ID as fallback)
      if (!toolArgs.calendarId && !toolArgs.userId && !toolArgs.groupId) {
        toolArgs.calendarId = LOCATION_ID;
      }
      // Add date range if not present (today's events)
      if (!toolArgs.startTime) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        toolArgs.startTime = today.toISOString();
      }
      if (!toolArgs.endTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        toolArgs.endTime = tomorrow.toISOString();
      }
    }
    
    // Add required parameters for tasks
    if (name === 'contacts_get-all-tasks') {
      // Add assignedTo if not present (using location ID as fallback)
      if (!toolArgs.assignedTo && !toolArgs.contactId) {
        toolArgs.assignedTo = LOCATION_ID;
      }
    }
    
    // Add required parameters for conversations
    if (name === 'conversations_search-conversation') {
      // Add query if not present
      if (!toolArgs.query) {
        toolArgs.query = '';  // Empty query returns all conversations
      }
    }
    
    // Add required parameters for opportunities
    if (name === 'opportunities_search-opportunity') {
      // Add query if not present
      if (!toolArgs.query) {
        toolArgs.query = '';  // Empty query returns all opportunities
      }
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
      log('API Error Response:', errorText);
      throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    log('Raw response:', text.substring(0, 500));
    
    // Parse SSE response
    let jsonData = null;
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          jsonData = JSON.parse(line.substring(6));
          break;
        } catch (e) {
          log('Failed to parse line:', line);
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
    log(`Error executing tool ${name}:`, error.message);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
}

/**
 * Handle JSON-RPC requests
 */
async function handleRequest(request) {
  const { method, params, id } = request;
  
  try {
    switch (method) {
      case 'initialize':
        // Initialize the server
        await fetchTools();
        sendResponse(id, {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {
              listChanged: true
            }
          },
          serverInfo: {
            name: 'gohighlevel-direct',
            version: '1.0.0'
          }
        });
        break;
        
      case 'notifications/initialized':
        // Client confirmed initialization - no response needed
        break;
        
      case 'tools/list':
        // Return the list of tools with simplified schemas
        const simplifiedTools = cachedTools.map(tool => ({
          name: tool.name,
          title: tool.title || tool.name,
          description: tool.description || `GoHighLevel tool: ${tool.name}`,
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: true  // Allow any properties without validation
          }
        }));
        
        sendResponse(id, { tools: simplifiedTools });
        break;
        
      case 'tools/call':
        // Call a tool
        const { name, arguments: toolArgs } = params;
        const result = await executeTool(name, toolArgs);
        sendResponse(id, result);
        break;
        
      case 'ping':
        // Respond to ping
        sendResponse(id, {});
        break;
        
      default:
        // Unknown method
        sendResponse(id, null, {
          code: -32601,
          message: `Method not found: ${method}`
        });
    }
  } catch (error) {
    log('Error handling request:', error);
    sendResponse(id, null, {
      code: -32603,
      message: error.message
    });
  }
}

/**
 * Main server loop
 */
async function main() {
  log('Starting direct MCP server...');
  log('Using API key:', API_KEY.substring(0, 10) + '...');
  log('Using location ID:', LOCATION_ID);
  
  // Read JSON-RPC requests from stdin
  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);
      await handleRequest(request);
    } catch (error) {
      log('Error parsing request:', error.message);
    }
  });
  
  rl.on('close', () => {
    log('Server shutting down');
    process.exit(0);
  });
}

// Start the server
main().catch((error) => {
  log('Fatal error:', error);
  process.exit(1);
});