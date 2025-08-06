const express = require('express');
const router = express.Router();
const { ModuleController } = require('~/server/controllers/lms');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');

/**
 * Public Routes (authenticated users)
 */

// Get all modules (published only for non-admins)
router.get('/', requireJwtAuth, ModuleController.getModules);

// Get single module by ID
router.get('/:moduleId', requireJwtAuth, ModuleController.getModule);

/**
 * Admin Only Routes
 */

// Create new module
router.post('/', requireJwtAuth, checkAdmin, ModuleController.createModule);

// Update module
router.put('/:moduleId', requireJwtAuth, checkAdmin, ModuleController.updateModule);

// Delete module (soft delete)
router.delete('/:moduleId', requireJwtAuth, checkAdmin, ModuleController.deleteModule);

// Restore soft deleted module
router.post('/:moduleId/restore', requireJwtAuth, checkAdmin, ModuleController.restoreModule);

// Reorder modules
router.post('/reorder', requireJwtAuth, checkAdmin, ModuleController.reorderModules);

// Upload thumbnail
router.post('/:moduleId/thumbnail', requireJwtAuth, checkAdmin, ModuleController.uploadThumbnail);

// Bulk publish/unpublish
router.post('/bulk/publish', requireJwtAuth, checkAdmin, ModuleController.bulkPublish);

module.exports = router;