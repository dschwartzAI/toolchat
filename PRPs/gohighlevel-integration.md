# PRP: GoHighLevel Manual API Key Integration for LibreChat

## Executive Summary
Implement a manual API key integration system for GoHighLevel CRM in LibreChat, allowing users to connect their GoHighLevel account by simply pasting their API key in settings. This integration will enable all AI agents to access GoHighLevel data without requiring separate configuration.

## Context and Background

### Current State
- LibreChat uses MCP (Model Context Protocol) servers configured in librechat.yaml
- Settings system uses React components with tabs in `/client/src/components/Nav/SettingsTabs/`
- No dedicated integrations system exists yet
- User data stored in MongoDB Atlas with manual migration scripts
- Authentication uses JWT with Passport middleware
- Encryption utility exists using AES-256-CTR (V3 pattern)

### Key Files to Reference
- Settings UI: `/client/src/components/Nav/Settings.tsx`
- User Model: `/api/models/User.js`
- MCP Initialization: `/api/server/services/initializeMCP.js`
- Encryption: `/packages/api/src/crypto/encryption.ts`
- Auth Middleware: `/api/server/middleware/requireJwtAuth.js`
- Data Provider: `/client/src/data-provider/`

## Implementation Blueprint

### Phase 1: Database Setup

#### 1.1 Create Migration Script
```javascript
// scripts/migrations/add-user-integrations.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateUserIntegrations() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Create indexes for efficient lookups
    await db.collection('users').createIndex(
      { 'integrations.provider': 1 },
      { sparse: true }
    );
    
    console.log('✅ User integrations migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateUserIntegrations();
```

#### 1.2 Update User Model
```javascript
// api/models/User.js - Add to existing schema
integrations: [{
  provider: {
    type: String,
    required: true,
    enum: ['gohighlevel', 'slack', 'google'] // Future providers
  },
  encryptedApiKey: {
    type: String,
    required: true
  },
  encryptedLocationId: String, // GoHighLevel specific
  isActive: {
    type: Boolean,
    default: true
  },
  lastValidated: Date,
  validationError: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}]
```

### Phase 2: Backend Implementation

#### 2.1 Integration Controller
```javascript
// api/server/controllers/IntegrationsController.js
const { encryptV3, decryptV3 } = require('~/packages/api/dist/crypto/encryption');
const User = require('~/models/User');
const logger = require('~/config/winston');

const IntegrationsController = {
  async testGoHighLevel(req, res) {
    try {
      const { apiKey, locationId } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      
      // Test with minimal endpoint to avoid rate limits
      const response = await fetch('https://services.leadconnectorhq.com/users/search?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': '2021-07-28'
        }
      });
      
      if (response.ok) {
        return res.json({ valid: true, message: 'API key is valid' });
      }
      
      const errorText = await response.text();
      logger.warn(`GoHighLevel API test failed: ${response.status}`);
      return res.status(400).json({ 
        valid: false, 
        error: 'Invalid API key',
        details: response.status === 401 ? 'Unauthorized' : 'API error'
      });
    } catch (error) {
      logger.error('GoHighLevel API test error:', error);
      return res.status(500).json({ 
        valid: false, 
        error: 'Failed to test API key' 
      });
    }
  },

  async saveGoHighLevel(req, res) {
    try {
      const { apiKey, locationId } = req.body;
      const userId = req.user.id;
      
      const encryptedApiKey = encryptV3(apiKey);
      const encryptedLocationId = locationId ? encryptV3(locationId) : null;
      
      const user = await User.findById(userId);
      
      // Remove existing GoHighLevel integration
      user.integrations = user.integrations?.filter(i => i.provider !== 'gohighlevel') || [];
      
      // Add new integration
      user.integrations.push({
        provider: 'gohighlevel',
        encryptedApiKey,
        encryptedLocationId,
        lastValidated: new Date(),
        isActive: true
      });
      
      await user.save();
      
      logger.info(`GoHighLevel integration saved for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Save integration error:', error);
      res.status(500).json({ error: 'Failed to save integration' });
    }
  },

  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      const integration = user.integrations?.find(i => i.provider === 'gohighlevel');
      
      if (!integration) {
        return res.json({ connected: false });
      }
      
      res.json({
        connected: integration.isActive,
        lastValidated: integration.lastValidated,
        connectedSince: integration.createdAt,
        error: integration.validationError
      });
    } catch (error) {
      logger.error('Status check error:', error);
      res.status(500).json({ error: 'Failed to check status' });
    }
  },

  async disconnect(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      const integrationIndex = user.integrations?.findIndex(i => i.provider === 'gohighlevel');
      
      if (integrationIndex >= 0) {
        user.integrations[integrationIndex].isActive = false;
        user.integrations[integrationIndex].updatedAt = new Date();
        await user.save();
      }
      
      logger.info(`GoHighLevel disconnected for user ${userId}`);
      res.json({ success: true });
    } catch (error) {
      logger.error('Disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect' });
    }
  }
};

module.exports = IntegrationsController;
```

#### 2.2 Integration Routes
```javascript
// api/server/routes/integrations.js
const express = require('express');
const router = express.Router();
const controller = require('~/server/controllers/IntegrationsController');
const { requireJwtAuth } = require('~/server/middleware');

router.use(requireJwtAuth);

router.post('/gohighlevel/test', controller.testGoHighLevel);
router.post('/gohighlevel/save', controller.saveGoHighLevel);
router.get('/gohighlevel/status', controller.getStatus);
router.delete('/gohighlevel', controller.disconnect);

module.exports = router;
```

#### 2.3 Dynamic MCP Loader Service
```javascript
// api/server/services/GoHighLevelMCP.js
const { decryptV3 } = require('~/packages/api/dist/crypto/encryption');
const User = require('~/models/User');
const { spawn } = require('child_process');
const logger = require('~/config/winston');
const path = require('path');

class GoHighLevelMCPService {
  constructor() {
    this.activeServers = new Map();
  }

  async getUserIntegration(userId) {
    const user = await User.findById(userId);
    const integration = user?.integrations?.find(
      i => i.provider === 'gohighlevel' && i.isActive
    );
    
    if (!integration) {
      throw new Error('GoHighLevel not connected');
    }
    
    return {
      apiKey: decryptV3(integration.encryptedApiKey),
      locationId: integration.encryptedLocationId ? 
        decryptV3(integration.encryptedLocationId) : null
    };
  }

  async startMCPForUser(userId) {
    const serverKey = `${userId}-gohighlevel`;
    
    // Return existing server if running
    if (this.activeServers.has(serverKey)) {
      return this.activeServers.get(serverKey);
    }
    
    try {
      const { apiKey, locationId } = await this.getUserIntegration(userId);
      
      // Check if GoHighLevel MCP is installed
      const mcpPath = path.resolve(
        process.env.GOHIGHLEVEL_MCP_PATH || 
        './node_modules/@gohighlevel/mcp-server/dist/index.js'
      );
      
      const mcpProcess = spawn('node', [mcpPath], {
        env: {
          ...process.env,
          GOHIGHLEVEL_API_KEY: apiKey,
          ...(locationId && { GOHIGHLEVEL_LOCATION_ID: locationId })
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.activeServers.set(serverKey, {
        process: mcpProcess,
        startedAt: new Date()
      });
      
      // Clean up on exit
      mcpProcess.on('exit', (code) => {
        logger.info(`GoHighLevel MCP for user ${userId} exited with code ${code}`);
        this.activeServers.delete(serverKey);
      });
      
      // Log errors
      mcpProcess.stderr.on('data', (data) => {
        logger.error(`GoHighLevel MCP error for user ${userId}: ${data}`);
      });
      
      return mcpProcess;
    } catch (error) {
      logger.error(`Failed to start GoHighLevel MCP for user ${userId}:`, error);
      throw error;
    }
  }

  stopMCPForUser(userId) {
    const serverKey = `${userId}-gohighlevel`;
    const server = this.activeServers.get(serverKey);
    
    if (server) {
      server.process.kill();
      this.activeServers.delete(serverKey);
    }
  }

  // Clean up all servers
  cleanup() {
    for (const [key, server] of this.activeServers) {
      server.process.kill();
    }
    this.activeServers.clear();
  }
}

module.exports = new GoHighLevelMCPService();
```

#### 2.4 Hook into Tool Loading
```javascript
// api/server/services/Tools/loadUserIntegrations.js
const GoHighLevelMCP = require('../GoHighLevelMCP');

async function loadUserIntegrations(userId, tools) {
  // Check if any tool requires GoHighLevel
  const needsGoHighLevel = tools.some(tool => 
    tool.metadata?.provider === 'gohighlevel' ||
    tool.function?.name?.includes('gohighlevel')
  );
  
  if (needsGoHighLevel) {
    try {
      await GoHighLevelMCP.startMCPForUser(userId);
    } catch (error) {
      // Tool will show error to user
      logger.warn(`GoHighLevel not available for user ${userId}: ${error.message}`);
    }
  }
  
  return tools;
}

module.exports = { loadUserIntegrations };
```

### Phase 3: Frontend Implementation

#### 3.1 Integrations Settings Component
```tsx
// client/src/components/Nav/SettingsTabs/Integrations/index.tsx
export { default as Integrations } from './Integrations';
```

```tsx
// client/src/components/Nav/SettingsTabs/Integrations/Integrations.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useToastContext } from '~/Providers/ToastContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/Tabs';
import GoHighLevelIntegration from './GoHighLevelIntegration';

export default function Integrations() {
  return (
    <div className="flex flex-col gap-4">
      <div className="pb-2 border-b border-border">
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect external services to enhance your AI tools
        </p>
      </div>
      
      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="communication" disabled>Communication</TabsTrigger>
          <TabsTrigger value="productivity" disabled>Productivity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="crm" className="space-y-4">
          <GoHighLevelIntegration />
        </TabsContent>
        
        <TabsContent value="communication" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <p>Coming soon: Slack, Discord, and more</p>
          </div>
        </TabsContent>
        
        <TabsContent value="productivity" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            <p>Coming soon: Google Workspace, Notion, and more</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

```tsx
// client/src/components/Nav/SettingsTabs/Integrations/GoHighLevelIntegration.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, HelpCircle, Loader2, ExternalLink } from 'lucide-react';
import { useToastContext } from '~/Providers/ToastContext';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Label } from '~/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/Collapsible';
import dataService from '~/data-provider';

interface IntegrationStatus {
  connected: boolean;
  lastValidated?: string;
  connectedSince?: string;
  error?: string;
}

export default function GoHighLevelIntegration() {
  const { showToast } = useToastContext();
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Fetch current status
  const { data: status, refetch } = useQuery<IntegrationStatus>({
    queryKey: ['integration-status', 'gohighlevel'],
    queryFn: () => dataService.getIntegrationStatus('gohighlevel'),
    refetchInterval: false,
  });
  
  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async ({ apiKey, locationId }: { apiKey: string; locationId?: string }) => {
      return dataService.testIntegration('gohighlevel', { apiKey, locationId });
    },
  });
  
  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async ({ apiKey, locationId }: { apiKey: string; locationId?: string }) => {
      return dataService.saveIntegration('gohighlevel', { apiKey, locationId });
    },
    onSuccess: () => {
      showToast({ message: 'GoHighLevel connected successfully!', status: 'success' });
      setApiKey('');
      setLocationId('');
      refetch();
    },
    onError: (error: any) => {
      showToast({ 
        message: error.message || 'Failed to save integration', 
        status: 'error' 
      });
    },
  });
  
  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return dataService.disconnectIntegration('gohighlevel');
    },
    onSuccess: () => {
      showToast({ message: 'GoHighLevel disconnected', status: 'info' });
      refetch();
    },
    onError: (error: any) => {
      showToast({ 
        message: error.message || 'Failed to disconnect', 
        status: 'error' 
      });
    },
  });
  
  const handleConnect = async () => {
    if (!apiKey) {
      showToast({ message: 'Please enter your API key', status: 'warning' });
      return;
    }
    
    try {
      // Test first
      const testResult = await testMutation.mutateAsync({ apiKey, locationId });
      
      if (testResult.valid) {
        // If test passes, save
        await saveMutation.mutateAsync({ apiKey, locationId });
      } else {
        showToast({ 
          message: testResult.error || 'Invalid API key', 
          status: 'error' 
        });
      }
    } catch (error: any) {
      showToast({ 
        message: error.message || 'Connection failed', 
        status: 'error' 
      });
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <img 
              src="/assets/gohighlevel-logo.png" 
              alt="GoHighLevel" 
              className="w-10 h-10 rounded"
            />
            <div>
              <CardTitle>GoHighLevel CRM</CardTitle>
              <CardDescription className="mt-1">
                Access your contacts, opportunities, and calendar data in all AI tools
              </CardDescription>
            </div>
          </div>
          
          {status?.connected && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {status?.connected ? (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Connected since:</span>
                  <p className="font-medium">{formatDate(status.connectedSince)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last validated:</span>
                  <p className="font-medium">{formatDate(status.lastValidated)}</p>
                </div>
              </div>
            </div>
            
            {status.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{status.error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={() => disconnectMutation.mutate()}
                variant="destructive"
                size="sm"
                disabled={disconnectMutation.isLoading}
              >
                {disconnectMutation.isLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="api-key">
                  API Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your GoHighLevel API key"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="location-id">
                  Location ID <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </Label>
                <Input
                  id="location-id"
                  type="text"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  placeholder="Your sub-account/location ID"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find this in your GoHighLevel URL or Business Profile
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                onClick={handleConnect}
                disabled={!apiKey || testMutation.isLoading || saveMutation.isLoading}
              >
                {(testMutation.isLoading || saveMutation.isLoading) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {testMutation.isLoading ? 'Testing...' : 
                 saveMutation.isLoading ? 'Saving...' : 
                 'Connect GoHighLevel'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                How to get API key
              </Button>
            </div>
            
            <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
              <CollapsibleContent>
                <Alert className="mt-4">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Getting your GoHighLevel API key</AlertTitle>
                  <AlertDescription className="mt-2">
                    <ol className="list-decimal list-inside space-y-2 mt-3">
                      <li>Log into your GoHighLevel account</li>
                      <li>Navigate to <strong>Settings → Integrations</strong></li>
                      <li>Click on <strong>"Private Integrations"</strong></li>
                      <li>Click <strong>"Create New Integration"</strong></li>
                      <li>Name it <strong>"LibreChat Integration"</strong></li>
                      <li>Select the required scopes for your needs</li>
                      <li>Copy the generated API key</li>
                      <li>Paste it in the field above</li>
                    </ol>
                    
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Important:</strong> Keep your API key secure. It provides full access to your GoHighLevel account.
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://help.gohighlevel.com/support/solutions/articles/155000005741', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Official Guide
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 3.2 Data Provider Service
```typescript
// client/src/data-provider/data-service.ts
// Add these methods to the existing data service

async testIntegration(provider: string, data: any): Promise<any> {
  return await request.post(`/api/integrations/${provider}/test`, data);
}

async saveIntegration(provider: string, data: any): Promise<any> {
  return await request.post(`/api/integrations/${provider}/save`, data);
}

async getIntegrationStatus(provider: string): Promise<any> {
  return await request.get(`/api/integrations/${provider}/status`);
}

async disconnectIntegration(provider: string): Promise<any> {
  return await request.delete(`/api/integrations/${provider}`);
}
```

#### 3.3 Update Settings Component
```tsx
// client/src/components/Nav/Settings.tsx
// Add Integrations to the tabs array

import { Integrations } from './SettingsTabs/Integrations';

const tabConfig = [
  { id: 'general', label: 'General', component: General },
  { id: 'account', label: 'Account', component: Account },
  { id: 'integrations', label: 'Integrations', component: Integrations }, // Add this
  { id: 'chat', label: 'Chat', component: Chat },
  // ... rest of tabs
];
```

### Phase 4: Integration with App Startup

#### 4.1 Update App Initialization
```javascript
// api/server/index.js
// Add after existing service initialization

const GoHighLevelMCP = require('./services/GoHighLevelMCP');

// Clean up MCP servers on shutdown
process.on('SIGTERM', () => {
  GoHighLevelMCP.cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  GoHighLevelMCP.cleanup();
  process.exit(0);
});
```

#### 4.2 Add Routes to Express App
```javascript
// api/server/routes/index.js
// Add integration routes

const integrations = require('./integrations');
// ... other imports

router.use('/integrations', integrations);
```

### Phase 5: Add MCP Server Package

#### 5.1 Install GoHighLevel MCP
```json
// package.json - Add to dependencies
"@gohighlevel/mcp-server": "^1.0.0"
```

#### 5.2 Environment Variables
```bash
# .env
INTEGRATION_ENCRYPTION_KEY=<generate-32-byte-hex-key>
GOHIGHLEVEL_MCP_PATH=./node_modules/@gohighlevel/mcp-server/dist/index.js
```

### Phase 6: Testing and Validation

#### 6.1 Unit Tests
```javascript
// api/test/integrations.test.js
const request = require('supertest');
const app = require('../server/index');
const User = require('../models/User');

describe('GoHighLevel Integration', () => {
  let authToken;
  let testUser;
  
  beforeEach(async () => {
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });
    authToken = await getAuthToken(testUser);
  });
  
  describe('POST /api/integrations/gohighlevel/test', () => {
    it('should validate API key', async () => {
      const res = await request(app)
        .post('/api/integrations/gohighlevel/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'valid-test-key' });
        
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });
    
    it('should reject invalid API key', async () => {
      const res = await request(app)
        .post('/api/integrations/gohighlevel/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'invalid-key' });
        
      expect(res.status).toBe(400);
      expect(res.body.valid).toBe(false);
    });
  });
  
  describe('Integration Flow', () => {
    it('should complete full integration flow', async () => {
      // Test API key
      await request(app)
        .post('/api/integrations/gohighlevel/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'valid-key' })
        .expect(200);
        
      // Save integration
      await request(app)
        .post('/api/integrations/gohighlevel/save')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ apiKey: 'valid-key' })
        .expect(200);
        
      // Check status
      const status = await request(app)
        .get('/api/integrations/gohighlevel/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(status.body.connected).toBe(true);
      
      // Disconnect
      await request(app)
        .delete('/api/integrations/gohighlevel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
```

#### 6.2 E2E Tests
```javascript
// e2e/integrations.spec.js
const { test, expect } = require('@playwright/test');

test.describe('GoHighLevel Integration', () => {
  test('should connect GoHighLevel account', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to settings
    await page.click('[data-testid="settings-button"]');
    await page.click('text=Integrations');
    
    // Fill API key
    await page.fill('[id="api-key"]', 'test-api-key');
    
    // Connect
    await page.click('text=Connect GoHighLevel');
    
    // Verify connection
    await expect(page.locator('text=Connected')).toBeVisible();
  });
});
```

### Phase 7: Deployment Steps

1. **Generate encryption key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Run database migration**:
   ```bash
   npm run migrate:user-integrations
   ```

3. **Install GoHighLevel MCP**:
   ```bash
   npm install @gohighlevel/mcp-server
   ```

4. **Update environment variables**

5. **Deploy backend changes**

6. **Deploy frontend changes**

7. **Test with a few users**

8. **Monitor logs for errors**

## Validation Gates

```bash
# Backend validation
cd api && npm test -- integrations.test.js

# Frontend validation
cd client && npm run type-check && npm run lint

# E2E validation
npm run e2e -- integrations.spec.js

# Security check
npm audit

# Build check
npm run build
```

## Implementation Checklist

- [ ] Database migration script created and tested
- [ ] User model updated with integrations field
- [ ] Backend controller implemented with encryption
- [ ] API routes added and protected with JWT auth
- [ ] Dynamic MCP loader service implemented
- [ ] Frontend components created with proper error handling
- [ ] Data provider methods added
- [ ] Settings tab integrated
- [ ] GoHighLevel MCP package installed
- [ ] Environment variables configured
- [ ] Unit tests passing
- [ ] E2E tests passing
- [ ] Security audit clean
- [ ] Build successful

## Error Handling Strategy

1. **API Key Validation**: Show specific error messages (invalid, expired, rate limited)
2. **Connection Failures**: Graceful degradation with helpful user messages
3. **MCP Process Crashes**: Automatic restart with exponential backoff
4. **Encryption Errors**: Log but never expose sensitive data
5. **Database Errors**: Transaction rollback and user notification

## Security Considerations

1. **API Keys**: Encrypted with AES-256-CTR before storage
2. **Transport**: HTTPS only for API key transmission
3. **Access Control**: JWT authentication required for all endpoints
4. **Logging**: Never log unencrypted API keys
5. **Rate Limiting**: Implement per-user rate limits for API testing

## Performance Optimizations

1. **MCP Process Pooling**: Reuse processes when possible
2. **Lazy Loading**: Only start MCP when tools are actually used
3. **Caching**: Cache decrypted keys in memory with TTL
4. **Connection Pooling**: Reuse HTTP connections to GoHighLevel

## Future Enhancements

1. **Webhook Support**: Real-time sync with GoHighLevel events
2. **Bulk Operations**: Batch API calls for better performance
3. **Advanced Settings**: Custom field mappings, sync preferences
4. **Usage Analytics**: Track API usage per user
5. **Multi-Location Support**: Handle multiple GoHighLevel locations

## Success Metrics

- Users can connect GoHighLevel in < 1 minute
- Zero plaintext API keys in database or logs
- < 100ms latency added to tool calls
- 99.9% uptime for connected integrations
- Clear error messages for all failure scenarios

## Confidence Score: 9/10

This PRP provides comprehensive implementation details with:
- Complete code examples following LibreChat patterns
- Security best practices with encryption
- Proper error handling and user feedback
- Testing strategy with examples
- Clear deployment steps

The only uncertainty is the exact GoHighLevel MCP package structure, but the implementation is designed to be adaptable.