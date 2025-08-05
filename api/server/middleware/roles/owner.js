const { SystemRoles } = require('librechat-data-provider');

/**
 * Middleware to check if user is the owner of a resource or an admin
 * @param {Function} getResource - Function that retrieves the resource from req and returns it
 * @param {String} ownerField - Field name that contains the owner ID (default: 'author')
 */
function checkOwner(getResource, ownerField = 'author') {
  return async (req, res, next) => {
    try {
      // Admins can always proceed
      if (req.user.role === SystemRoles.ADMIN) {
        return next();
      }

      // Get the resource using the provided function
      const resource = await getResource(req);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if the user is the owner
      const ownerId = resource[ownerField]?._id || resource[ownerField];
      if (ownerId?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to modify this resource' });
      }

      // Store resource in request for later use
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Owner check error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
}

module.exports = checkOwner;