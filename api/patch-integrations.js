#!/usr/bin/env node
/**
 * Patch script to add integrations routes to the LibreChat server
 * This runs at container startup to inject our custom routes
 */

const fs = require('fs');
const path = require('path');

console.log('[Integration Patch] Starting integration routes patch...');

// Patch the routes/index.js to add integrations
const routesIndexPath = '/app/api/server/routes/index.js';
const serverIndexPath = '/app/api/server/index.js';

try {
  // First, patch the routes index file
  if (fs.existsSync(routesIndexPath)) {
    let routesContent = fs.readFileSync(routesIndexPath, 'utf8');
    
    // Add the require if it doesn't exist
    if (!routesContent.includes('integrations')) {
      // Find where to insert (before module.exports)
      const moduleExportsIndex = routesContent.indexOf('module.exports');
      
      if (moduleExportsIndex > -1) {
        // Add the require statement
        const requireStatement = "const integrations = require('../../routes/integrations');\n";
        routesContent = routesContent.slice(0, moduleExportsIndex) + requireStatement + routesContent.slice(moduleExportsIndex);
        
        // Add to exports
        routesContent = routesContent.replace(
          /module\.exports = \{([^}]+)\}/,
          (match, exports) => {
            if (!exports.includes('integrations')) {
              return `module.exports = {${exports},\n  integrations,\n}`;
            }
            return match;
          }
        );
        
        fs.writeFileSync(routesIndexPath, routesContent);
        console.log('[Integration Patch] ✓ Patched routes/index.js');
      }
    } else {
      console.log('[Integration Patch] Routes already includes integrations');
    }
  }

  // Second, patch the server index file
  if (fs.existsSync(serverIndexPath)) {
    let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
    
    // Add the route registration if it doesn't exist
    if (!serverContent.includes('/api/integrations')) {
      // Find where MCP routes are registered
      const mcpRouteIndex = serverContent.indexOf("app.use('/api/mcp', routes.mcp);");
      
      if (mcpRouteIndex > -1) {
        // Insert after MCP route
        const insertPosition = serverContent.indexOf('\n', mcpRouteIndex) + 1;
        const routeRegistration = "  app.use('/api/integrations', routes.integrations);\n";
        
        serverContent = serverContent.slice(0, insertPosition) + routeRegistration + serverContent.slice(insertPosition);
        
        fs.writeFileSync(serverIndexPath, serverContent);
        console.log('[Integration Patch] ✓ Patched server/index.js');
      } else {
        console.log('[Integration Patch] Warning: Could not find MCP route registration');
      }
    } else {
      console.log('[Integration Patch] Server already includes integrations route');
    }
  }

  console.log('[Integration Patch] ✓ Integration routes patch completed successfully');
} catch (error) {
  console.error('[Integration Patch] Error:', error.message);
  process.exit(1);
}