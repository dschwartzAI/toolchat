const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for thumbnail uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'images', 'academy', 'modules');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'module-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const ModuleController = {
  /**
   * Get all modules
   * Public can see published modules, admins can see all
   */
  async getModules(req, res) {
    try {
      const { limit = 50, offset = 0, includeDeleted = false } = req.query;
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      // Import Module model
      const Module = require('~/models/Module');
      
      // Build query
      const query = {};
      
      // Non-admins can only see published modules
      if (!isAdmin) {
        query.isPublished = true;
        query.deletedAt = null;
      } else if (!includeDeleted) {
        query.deletedAt = null;
      }
      
      const modules = await Module.find(query)
        .sort({ order: 1, createdAt: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('deletedBy', 'name email');
      
      const total = await Module.countDocuments(query);
      
      res.json({
        modules,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      logger.error('[ModuleController] Error getting modules:', error);
      res.status(500).json({ error: 'Failed to fetch modules' });
    }
  },

  /**
   * Get single module by ID
   */
  async getModule(req, res) {
    try {
      const { moduleId } = req.params;
      const isAdmin = req.user.role === SystemRoles.ADMIN;
      
      const Module = require('~/models/Module');
      const module = await Module.findById(moduleId)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
      
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }
      
      // Check if module is accessible
      if (!module.isPublished && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Check if module is soft deleted (non-admins shouldn't see)
      if (module.deletedAt && !isAdmin) {
        return res.status(404).json({ error: 'Module not found' });
      }
      
      res.json(module);
    } catch (error) {
      logger.error('[ModuleController] Error getting module:', error);
      res.status(500).json({ error: 'Failed to fetch module' });
    }
  },

  /**
   * Create new module (admin only)
   */
  async createModule(req, res) {
    try {
      const Module = require('~/models/Module');
      
      // Get the highest order number to place new module at the end
      const lastModule = await Module.findOne({}).sort({ order: -1 });
      const nextOrder = lastModule ? lastModule.order + 1 : 0;
      
      const moduleData = {
        ...req.body,
        order: req.body.order !== undefined ? req.body.order : nextOrder,
        createdBy: req.user.id,
        updatedBy: req.user.id
      };
      
      const module = new Module(moduleData);
      await module.save();
      
      await module.populate('createdBy', 'name email');
      
      res.status(201).json(module);
    } catch (error) {
      logger.error('[ModuleController] Error creating module:', error);
      res.status(500).json({ error: 'Failed to create module' });
    }
  },

  /**
   * Update module (admin only)
   */
  async updateModule(req, res) {
    try {
      const { moduleId } = req.params;
      const Module = require('~/models/Module');
      
      const module = await Module.findById(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }
      
      // Don't allow updating soft deleted modules
      if (module.deletedAt) {
        return res.status(400).json({ error: 'Cannot update deleted module' });
      }
      
      // Update fields
      const allowedFields = [
        'title', 'description', 'thumbnail', 'videoUrl',
        'textContent', 'resources', 'transcript', 'duration',
        'order', 'isPublished'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          module[field] = req.body[field];
        }
      });
      
      module.updatedBy = req.user.id;
      await module.save();
      
      await module.populate('createdBy', 'name email');
      await module.populate('updatedBy', 'name email');
      
      res.json(module);
    } catch (error) {
      logger.error('[ModuleController] Error updating module:', error);
      res.status(500).json({ error: 'Failed to update module' });
    }
  },

  /**
   * Delete module (soft delete, admin only)
   */
  async deleteModule(req, res) {
    try {
      const { moduleId } = req.params;
      const Module = require('~/models/Module');
      
      const module = await Module.findById(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }
      
      if (module.deletedAt) {
        return res.status(400).json({ error: 'Module already deleted' });
      }
      
      // Perform soft delete
      await module.softDelete(req.user.id);
      
      res.json({ 
        success: true, 
        message: 'Module deleted successfully',
        deletedAt: module.deletedAt 
      });
    } catch (error) {
      logger.error('[ModuleController] Error deleting module:', error);
      res.status(500).json({ error: 'Failed to delete module' });
    }
  },

  /**
   * Restore soft deleted module (admin only)
   */
  async restoreModule(req, res) {
    try {
      const { moduleId } = req.params;
      const Module = require('~/models/Module');
      
      // Need to include deleted items in query
      const module = await Module.findById(moduleId).setOptions({ includeDeleted: true });
      
      if (!module) {
        return res.status(404).json({ error: 'Module not found' });
      }
      
      if (!module.deletedAt) {
        return res.status(400).json({ error: 'Module is not deleted' });
      }
      
      // Restore the module
      await module.restore();
      module.updatedBy = req.user.id;
      await module.save();
      
      res.json({ 
        success: true, 
        message: 'Module restored successfully',
        module 
      });
    } catch (error) {
      logger.error('[ModuleController] Error restoring module:', error);
      res.status(500).json({ error: 'Failed to restore module' });
    }
  },

  /**
   * Reorder modules (admin only)
   */
  async reorderModules(req, res) {
    try {
      const { moduleOrders } = req.body; // Array of { moduleId, order }
      
      if (!Array.isArray(moduleOrders)) {
        return res.status(400).json({ error: 'Invalid reorder data' });
      }
      
      const Module = require('~/models/Module');
      
      // Update each module's order
      const updatePromises = moduleOrders.map(({ moduleId, order }) => 
        Module.findByIdAndUpdate(
          moduleId,
          { 
            order,
            updatedBy: req.user.id 
          },
          { new: true }
        )
      );
      
      await Promise.all(updatePromises);
      
      res.json({ 
        success: true, 
        message: 'Modules reordered successfully' 
      });
    } catch (error) {
      logger.error('[ModuleController] Error reordering modules:', error);
      res.status(500).json({ error: 'Failed to reorder modules' });
    }
  },

  /**
   * Upload module thumbnail (admin only)
   */
  uploadThumbnail: [
    upload.single('thumbnail'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { moduleId } = req.params;
        const Module = require('~/models/Module');
        
        const module = await Module.findById(moduleId);
        
        if (!module) {
          // Delete uploaded file if module doesn't exist
          await fs.unlink(req.file.path).catch(err => 
            logger.error('Error deleting orphan file:', err)
          );
          return res.status(404).json({ error: 'Module not found' });
        }
        
        // Delete old thumbnail if exists
        if (module.thumbnail) {
          const oldPath = path.join(process.cwd(), module.thumbnail);
          await fs.unlink(oldPath).catch(err => 
            logger.error('Error deleting old thumbnail:', err)
          );
        }
        
        // Update module with new thumbnail path
        module.thumbnail = `/images/academy/modules/${req.file.filename}`;
        module.updatedBy = req.user.id;
        await module.save();
        
        res.json({ 
          success: true,
          thumbnail: module.thumbnail,
          message: 'Thumbnail uploaded successfully' 
        });
      } catch (error) {
        logger.error('[ModuleController] Error uploading thumbnail:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
          await fs.unlink(req.file.path).catch(err => 
            logger.error('Error deleting file after error:', err)
          );
        }
        
        res.status(500).json({ error: 'Failed to upload thumbnail' });
      }
    }
  ],

  /**
   * Bulk publish/unpublish modules (admin only)
   */
  async bulkPublish(req, res) {
    try {
      const { moduleIds, isPublished } = req.body;
      
      if (!Array.isArray(moduleIds)) {
        return res.status(400).json({ error: 'Invalid module IDs' });
      }
      
      const Module = require('~/models/Module');
      
      const result = await Module.updateMany(
        { 
          _id: { $in: moduleIds },
          deletedAt: null // Don't update deleted modules
        },
        { 
          isPublished,
          updatedBy: req.user.id 
        }
      );
      
      res.json({ 
        success: true,
        updated: result.modifiedCount,
        message: `${result.modifiedCount} modules ${isPublished ? 'published' : 'unpublished'}` 
      });
    } catch (error) {
      logger.error('[ModuleController] Error bulk publishing modules:', error);
      res.status(500).json({ error: 'Failed to update modules' });
    }
  }
};

module.exports = ModuleController;