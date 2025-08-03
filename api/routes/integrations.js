const express = require('express');
const router = express.Router();
const axios = require('axios');
const UserIntegrations = require('../../models/UserIntegrations');
const { updateUserPluginAuth, deleteUserPluginAuth } = require('../services/PluginService');
const { logger } = require('~/config');
const { requireJwtAuth } = require('~/server/middleware');

// GoHighLevel API base URL
const GHL_API_BASE = 'https://services.leadconnectorhq.com';

/**
 * Test GoHighLevel API connection
 * @param {string} apiKey - GoHighLevel API key
 * @param {string} locationId - Optional location ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function testGoHighLevelConnection(apiKey, locationId) {
  try {
    // Test the API by fetching location info
    const endpoint = locationId 
      ? `${GHL_API_BASE}/locations/${locationId}`
      : `${GHL_API_BASE}/locations/`;
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('[GoHighLevel Test] Connection failed:', error);
    
    if (error.response) {
      // API responded with error
      if (error.response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      } else if (error.response.status === 404) {
        return { success: false, error: 'Location ID not found' };
      } else {
        return { 
          success: false, 
          error: `API error: ${error.response.data?.message || error.response.statusText}` 
        };
      }
    } else if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Connection timeout' };
    } else {
      return { success: false, error: 'Failed to connect to GoHighLevel' };
    }
  }
}

/**
 * GET /api/integrations/gohighlevel/status
 * Get the current integration status for the user
 */
router.get('/gohighlevel/status', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await UserIntegrations.getIntegrationStatus(userId, 'gohighlevel');
    
    res.json(status);
  } catch (error) {
    logger.error('[Integration Status] Error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

/**
 * POST /api/integrations/gohighlevel/test
 * Test the GoHighLevel API connection
 */
router.post('/gohighlevel/test', requireJwtAuth, async (req, res) => {
  try {
    const { apiKey, locationId } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const result = await testGoHighLevelConnection(apiKey, locationId);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Connection successful',
        locationName: result.data?.location?.name || result.data?.locations?.[0]?.name,
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    logger.error('[Integration Test] Error:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

/**
 * POST /api/integrations/gohighlevel/save
 * Save the GoHighLevel integration
 */
router.post('/gohighlevel/save', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { apiKey, locationId } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Test the connection first
    const testResult = await testGoHighLevelConnection(apiKey, locationId);
    
    if (!testResult.success) {
      return res.status(400).json({ error: testResult.error });
    }

    // Update integration status in UserIntegrations
    await UserIntegrations.updateIntegrationStatus(userId, 'gohighlevel', {
      isConnected: true,
      lastValidated: new Date(),
      lastError: null,
      metadata: {
        locationName: testResult.data?.location?.name || testResult.data?.locations?.[0]?.name,
        locationId: locationId || testResult.data?.location?.id || testResult.data?.locations?.[0]?.id,
      },
    });

    // Save credentials to PluginAuth for MCP system
    // Note: The pluginKey uses 'mcp_' prefix to match MCP naming convention
    await updateUserPluginAuth(userId, {
      pluginKey: 'mcp_gohighlevel',
      authField: 'GHL_API_KEY',
      value: apiKey, // Will be encrypted by updateUserPluginAuth
    });

    if (locationId) {
      await updateUserPluginAuth(userId, {
        pluginKey: 'mcp_gohighlevel',
        authField: 'GHL_LOCATION_ID',
        value: locationId,
      });
    }

    logger.info(`[Integration Save] User ${userId} connected GoHighLevel`);
    
    res.json({ 
      success: true, 
      message: 'Integration saved successfully',
      locationName: testResult.data?.location?.name || testResult.data?.locations?.[0]?.name,
    });
  } catch (error) {
    logger.error('[Integration Save] Error:', error);
    res.status(500).json({ error: 'Failed to save integration' });
  }
});

/**
 * DELETE /api/integrations/gohighlevel
 * Remove the GoHighLevel integration
 */
router.delete('/gohighlevel', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Update integration status
    await UserIntegrations.updateIntegrationStatus(userId, 'gohighlevel', {
      isConnected: false,
      lastValidated: null,
      lastError: null,
      metadata: {},
    });

    // Remove credentials from PluginAuth
    await deleteUserPluginAuth(userId, 'mcp_gohighlevel', 'GHL_API_KEY');
    await deleteUserPluginAuth(userId, 'mcp_gohighlevel', 'GHL_LOCATION_ID');

    logger.info(`[Integration Delete] User ${userId} disconnected GoHighLevel`);
    
    res.json({ success: true, message: 'Integration removed successfully' });
  } catch (error) {
    logger.error('[Integration Delete] Error:', error);
    res.status(500).json({ error: 'Failed to remove integration' });
  }
});

module.exports = router;