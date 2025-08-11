/**
 * User Model Pass-through with Smart Lazy Loading
 * 
 * This file exports the unified User model that was created by LibreChat
 * and extended with custom fields in /api/server/bootstrap/extend-user.js
 * 
 * Problem: Routes are loaded before database connection and model creation
 * Solution: Use a cached proxy that gets the model once it's available
 */

const mongoose = require('mongoose');

// Create a self-healing proxy that caches the model once found
module.exports = (() => {
  let cachedModel = null;
  
  return new Proxy({}, {
    get(target, prop) {
      // Try to get the cached model or fetch it if not cached
      if (!cachedModel) {
        cachedModel = mongoose.models.User;
        
        // If model still doesn't exist, provide helpful error
        if (!cachedModel) {
          console.error('[User Model Proxy] User model not found in mongoose.models');
          console.error('[User Model Proxy] Available models:', Object.keys(mongoose.models || {}));
          throw new Error(
            'User model not initialized. This typically happens when:\n' +
            '1. Database connection has not been established\n' +
            '2. extend-user.js has not run yet\n' +
            '3. Routes are being accessed before server startup completes'
          );
        }
      }
      
      // Special handling for certain properties
      if (prop === 'modelName') {
        return 'User';
      }
      
      if (prop === 'collection') {
        return cachedModel.collection;
      }
      
      // Get the property/method from the cached model
      const value = cachedModel[prop];
      
      // If it's a function, bind it to maintain correct 'this' context
      if (typeof value === 'function') {
        return value.bind(cachedModel);
      }
      
      // Return the value as-is for properties
      return value;
    },
    
    // Handle 'in' operator (e.g., 'findById' in User)
    has(target, prop) {
      if (!cachedModel) {
        cachedModel = mongoose.models.User;
      }
      return cachedModel ? prop in cachedModel : false;
    },
    
    // Handle Object.keys()
    ownKeys(target) {
      if (!cachedModel) {
        cachedModel = mongoose.models.User;
      }
      return cachedModel ? Reflect.ownKeys(cachedModel) : [];
    },
    
    // Handle Object.getOwnPropertyDescriptor()
    getOwnPropertyDescriptor(target, prop) {
      if (!cachedModel) {
        cachedModel = mongoose.models.User;
      }
      return cachedModel ? Reflect.getOwnPropertyDescriptor(cachedModel, prop) : undefined;
    }
  });
})();