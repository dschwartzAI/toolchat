const GoHighLevelMCP = require('../GoHighLevelMCP');
const { logger } = require('~/config');

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