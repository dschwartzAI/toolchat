const winston = require('winston');

/**
 * Validates required configuration on startup
 * @returns {boolean} true if config is valid, false otherwise
 */
function validateConfig() {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
  });

  const errors = [];

  // Check required API keys for enabled endpoints
  const endpointsConfig = process.env.ENDPOINTS || '';
  
  if (endpointsConfig.includes('openAI') || endpointsConfig.includes('agents')) {
    if (!process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required when OpenAI or Agents endpoints are enabled');
    }
  }

  if (endpointsConfig.includes('anthropic')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      errors.push('ANTHROPIC_API_KEY is required when Anthropic endpoint is enabled');
    }
  }

  // Check MongoDB connection
  if (!process.env.MONGO_URI) {
    errors.push('MONGO_URI is required for database connection');
  }

  // Check web search configuration
  if (process.env.SEARCH_ENABLE === 'true') {
    if (!process.env.SERPER_API_KEY && !process.env.TAVILY_API_KEY) {
      errors.push('Either SERPER_API_KEY or TAVILY_API_KEY is required when web search is enabled');
    }
  }

  // Check MCP configuration
  if (process.env.MCP_SERVERS_CONFIG) {
    if (process.env.MCP_SERVERS_CONFIG.includes('perplexity') && !process.env.PERPLEXITY_API_KEY) {
      errors.push('PERPLEXITY_API_KEY is required when Perplexity MCP server is configured');
    }
  }

  // Check session secret
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required for secure sessions');
  }

  // Check port configuration
  const port = process.env.PORT || '3090';
  if (isNaN(parseInt(port))) {
    errors.push(`Invalid PORT configuration: ${port}`);
  }

  // Report validation results
  if (errors.length > 0) {
    logger.error('Configuration validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    return false;
  }

  logger.info('Configuration validation passed');
  return true;
}

module.exports = { validateConfig };