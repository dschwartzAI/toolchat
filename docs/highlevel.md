GoHighLevel Manual API Key Integration for LibreChat Business Tools Platform
FEATURE:
CREATE A NEW GITHUB BRANCH FOR THIS BUILD

LibreChat-based platform with manual GoHighLevel API key integration for business tools

User-friendly integrations section in Settings where users paste their GoHighLevel API key
Encrypted storage of API keys in database with AES-256 encryption
Dynamic per-user API key injection into official GoHighLevel MCP server
Single integration works across all tools (DarkJK Coach, Hybrid Offer Printer) without separate configuration
API key validation before saving to ensure working connection
Clear step-by-step instructions with screenshots for getting API key from GoHighLevel
Connection status display with last validated timestamp and disconnect option
Zero OAuth complexity - users simply paste their key and start using CRM features
EXAMPLES:

See below for code suggestions.

DOCUMENTATION:
LibreChat Settings System: https://docs.librechat.ai/features/user_settings LibreChat Database Schema: https://docs.librechat.ai/development/database GoHighLevel MCP Server: https://help.gohighlevel.com/support/solutions/articles/155000005741-how-to-use-the-highlevel-mcp-server GoHighLevel API Documentation: https://highlevel.stoplight.io/docs/integrations/api-v2 Node.js Crypto for Encryption: https://nodejs.org/api/crypto.html MCP Server Protocol: https://github.com/modelcontextprotocol/specification LibreChat Environment Variables: https://docs.librechat.ai/install/configuration/dotenv.html

OTHER CONSIDERATIONS:
GoHighLevel MCP must be installed as npm dependency before implementation Database migration required for user_integrations table without breaking existing sessions Encryption key must be generated and stored securely in environment variables API key validation should test minimal endpoint to avoid rate limits Consider caching decrypted keys briefly in memory for performance (with TTL) Error messages must never expose actual API keys in logs or responses Settings UI must integrate seamlessly with existing LibreChat settings layout Dynamic MCP loading must not break when users haven't connected GoHighLevel Include "Test Connection" button for users to verify their key still works Plan for future manual integrations using same pattern (Slack, Google, etc.) Consider adding webhook endpoint for future real-time sync capabilities MCP server process management - ensure proper cleanup on errors Add instrumentation for monitoring API key usage and errors Document backup/restore procedures for encrypted API keys

IMPLEMENTATION GUIDE:
Phase 1: Install GoHighLevel MCP Server
bash
# In your LibreChat project directory
npm install @gohighlevel/mcp-server

# Verify installation
ls node_modules/@gohighlevel/mcp-server/
Phase 2: Database Setup
sql
-- Migration: create_user_integrations_table.sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'gohighlevel',
  encrypted_api_key TEXT NOT NULL,
  encrypted_location_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_validated TIMESTAMP,
  validation_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_integrations_lookup ON user_integrations(user_id, provider, is_active);
Phase 3: Environment Configuration
env
# Add to .env file
INTEGRATION_ENCRYPTION_KEY=<generate-32-byte-random-key>
GOHIGHLEVEL_MCP_PATH=./node_modules/@gohighlevel/mcp-server/dist/index.js
Phase 4: Core Implementation Files
1. Encryption Utility
javascript
// lib/encryption.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.INTEGRATION_ENCRYPTION_KEY, 'hex');

exports.encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

exports.decrypt = (encrypted) => {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
2. API Routes
javascript
// api/routes/integrations.js
const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../../lib/encryption');
const db = require('../../lib/db');

// Test API key
router.post('/gohighlevel/test', async (req, res) => {
  const { apiKey, locationId } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  
  try {
    // Test with a lightweight endpoint
    const response = await fetch('https://services.leadconnectorhq.com/users/search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28'
      }
    });
    
    if (response.ok) {
      res.json({ valid: true, message: 'API key is valid' });
    } else {
      const error = await response.text();
      res.status(400).json({ valid: false, error: 'Invalid API key', details: error });
    }
  } catch (error) {
    console.error('GoHighLevel API test error:', error);
    res.status(500).json({ valid: false, error: 'Failed to test API key' });
  }
});

// Save API key
router.post('/gohighlevel/save', async (req, res) => {
  const { apiKey, locationId } = req.body;
  const userId = req.user.id;
  
  try {
    const encryptedApiKey = encrypt(apiKey);
    const encryptedLocationId = locationId ? encrypt(locationId) : null;
    
    await db.query(`
      INSERT INTO user_integrations (
        user_id, provider, encrypted_api_key, encrypted_location_id, last_validated, is_active
      ) VALUES ($1, $2, $3, $4, NOW(), true)
      ON CONFLICT (user_id, provider) 
      DO UPDATE SET 
        encrypted_api_key = $3,
        encrypted_location_id = $4,
        last_validated = NOW(),
        is_active = true,
        validation_error = NULL,
        updated_at = NOW()
    `, [userId, 'gohighlevel', encryptedApiKey, encryptedLocationId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save integration error:', error);
    res.status(500).json({ error: 'Failed to save integration' });
  }
});

// Get status
router.get('/gohighlevel/status', async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(`
      SELECT is_active, last_validated, created_at, validation_error
      FROM user_integrations 
      WHERE user_id = $1 AND provider = $2
    `, [userId, 'gohighlevel']);
    
    if (result.rows.length > 0) {
      const integration = result.rows[0];
      res.json({
        connected: integration.is_active,
        lastValidated: integration.last_validated,
        connectedSince: integration.created_at,
        error: integration.validation_error
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Disconnect
router.delete('/gohighlevel', async (req, res) => {
  const userId = req.user.id;
  
  try {
    await db.query(`
      UPDATE user_integrations 
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND provider = $2
    `, [userId, 'gohighlevel']);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
3. Dynamic MCP Loader
javascript
// lib/mcp/dynamic-loader.js
const { decrypt } = require('../encryption');
const db = require('../db');
const { spawn } = require('child_process');

class DynamicMCPLoader {
  constructor() {
    this.activeServers = new Map();
  }
  
  async getMCPConfigForUser(userId, provider) {
    if (provider !== 'gohighlevel') {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Get user's integration
    const result = await db.query(`
      SELECT encrypted_api_key, encrypted_location_id, is_active
      FROM user_integrations
      WHERE user_id = $1 AND provider = $2 AND is_active = true
    `, [userId, provider]);
    
    if (result.rows.length === 0) {
      throw new Error('GoHighLevel not connected. Please add your API key in Settings → Integrations.');
    }
    
    const integration = result.rows[0];
    const apiKey = decrypt(integration.encrypted_api_key);
    const locationId = integration.encrypted_location_id ? 
      decrypt(integration.encrypted_location_id) : null;
    
    return {
      command: 'node',
      args: [process.env.GOHIGHLEVEL_MCP_PATH || './node_modules/@gohighlevel/mcp-server/dist/index.js'],
      env: {
        ...process.env,
        GOHIGHLEVEL_API_KEY: apiKey,
        ...(locationId && { GOHIGHLEVEL_LOCATION_ID: locationId })
      }
    };
  }
  
  async startMCPForUser(userId, provider) {
    const serverKey = `${userId}-${provider}`;
    
    // Check if already running
    if (this.activeServers.has(serverKey)) {
      return this.activeServers.get(serverKey);
    }
    
    try {
      const config = await this.getMCPConfigForUser(userId, provider);
      
      // Start MCP server process
      const mcpProcess = spawn(config.command, config.args, {
        env: config.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Store reference
      this.activeServers.set(serverKey, {
        process: mcpProcess,
        startedAt: new Date()
      });
      
      // Handle process cleanup
      mcpProcess.on('exit', () => {
        this.activeServers.delete(serverKey);
      });
      
      return mcpProcess;
    } catch (error) {
      console.error(`Failed to start MCP for user ${userId}:`, error);
      throw error;
    }
  }
  
  stopMCPForUser(userId, provider) {
    const serverKey = `${userId}-${provider}`;
    const server = this.activeServers.get(serverKey);
    
    if (server) {
      server.process.kill();
      this.activeServers.delete(serverKey);
    }
  }
}

module.exports = new DynamicMCPLoader();
4. LibreChat Integration Hook
javascript
// lib/hooks/tool-loader-hook.js
const dynamicMCPLoader = require('../mcp/dynamic-loader');

// Hook into LibreChat's tool loading mechanism
function installDynamicMCPHook(librechat) {
  const originalLoadTools = librechat.loadToolsForConversation;
  
  librechat.loadToolsForConversation = async function(conversationId, userId, agentConfig) {
    // Check if agent has GoHighLevel tool
    const hasGoHighLevel = agentConfig.tools?.some(tool => 
      tool.type === 'mcp' && tool.name === 'gohighlevel'
    );
    
    if (hasGoHighLevel) {
      try {
        // Start MCP server with user's API key
        await dynamicMCPLoader.startMCPForUser(userId, 'gohighlevel');
      } catch (error) {
        // Tool will show error message to user
        console.error('Failed to load GoHighLevel for user:', error.message);
      }
    }
    
    // Continue with normal tool loading
    return originalLoadTools.call(this, conversationId, userId, agentConfig);
  };
}

module.exports = { installDynamicMCPHook };
5. React Settings Component
jsx
// client/src/components/Settings/IntegrationsSettings.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function IntegrationsSettings() {
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Fetch current status
  const { data: status, refetch } = useQuery({
    queryKey: ['integration-status', 'gohighlevel'],
    queryFn: () => fetch('/api/integrations/gohighlevel/status').then(r => r.json())
  });
  
  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async ({ apiKey, locationId }) => {
      const response = await fetch('/api/integrations/gohighlevel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, locationId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid API key');
      }
      
      return response.json();
    }
  });
  
  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async ({ apiKey, locationId }) => {
      const response = await fetch('/api/integrations/gohighlevel/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, locationId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save integration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('GoHighLevel connected successfully!');
      setApiKey('');
      setLocationId('');
      refetch();
    }
  });
  
  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/gohighlevel', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('GoHighLevel disconnected');
      refetch();
    }
  });
  
  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('Please enter your API key');
      return;
    }
    
    try {
      // Test first
      await testMutation.mutateAsync({ apiKey, locationId });
      // If test passes, save
      await saveMutation.mutateAsync({ apiKey, locationId });
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-gray-500">
          Connect external services to enhance your AI tools
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <img 
              src="/assets/gohighlevel-logo.png" 
              alt="GoHighLevel" 
              className="w-10 h-10 rounded"
            />
            <div>
              <h4 className="font-medium">GoHighLevel CRM</h4>
              <p className="text-sm text-gray-600 mt-1">
                Access your contacts, opportunities, and calendar data in all AI tools
              </p>
            </div>
          </div>
          
          {status?.connected && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Connected</span>
            </div>
          )}
        </div>
        
        {status?.connected ? (
          <div className="mt-4 space-y-3">
            <div className="text-sm text-gray-600">
              <p>Connected since: {new Date(status.connectedSince).toLocaleDateString()}</p>
              <p>Last validated: {new Date(status.lastValidated).toLocaleDateString()}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => disconnectMutation.mutate()}
                className="text-sm text-red-600 hover:text-red-700"
                disabled={disconnectMutation.isLoading}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your GoHighLevel API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location ID 
                <span className="text-gray-500 font-normal ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="Your sub-account/location ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your GoHighLevel URL or Business Profile
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={handleConnect}
                disabled={!apiKey || testMutation.isLoading || saveMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testMutation.isLoading ? 'Testing...' : 
                 saveMutation.isLoading ? 'Saving...' : 
                 'Connect GoHighLevel'}
              </button>
              
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                How to get API key
              </button>
            </div>
            
            {showInstructions && (
              <div className="bg-gray-50 rounded-md p-4 text-sm">
                <h5 className="font-medium mb-2">Getting your GoHighLevel API key:</h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Log into your GoHighLevel account</li>
                  <li>Navigate to Settings → Integrations</li>
                  <li>Click on "Private Integrations"</li>
                  <li>Click "Create New Integration"</li>
                  <li>Name it "LibreChat Integration"</li>
                  <li>Copy the generated API key</li>
                  <li>Paste it in the field above</li>
                </ol>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800">
                    <strong>Important:</strong> Keep your API key secure. It provides full access to your GoHighLevel account.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
Phase 5: Testing & Deployment
Test Scenarios
User adds valid API key → Should connect successfully
User adds invalid API key → Should show error message
Multiple users connect different accounts → Each sees only their data
User disconnects → Should remove access immediately
API key expires → Should show helpful error message
Deployment Steps
Run database migration
Generate and set INTEGRATION_ENCRYPTION_KEY
Install GoHighLevel MCP: npm install @gohighlevel/mcp-server
Deploy API routes
Deploy frontend changes
Test with a few users before full rollout
SUCCESS CRITERIA:
Simple Connection: Users connect GoHighLevel with just their API key
Secure Storage: All API keys encrypted with AES-256-GCM
Dynamic Injection: Each user's key automatically used in their sessions
Universal Access: All agents with GoHighLevel tool use user's connection
Clear Instructions: Step-by-step guide with visual aids
Error Handling: Helpful messages for all failure scenarios
Performance: Minimal latency added to tool calls
Monitoring: Admins can see integration usage statistics
This implementation provides a production-ready manual API key integration that's much simpler than OAuth while still maintaining security and multi-user support.








