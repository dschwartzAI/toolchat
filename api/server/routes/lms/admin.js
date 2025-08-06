const express = require('express');
const router = express.Router();
const { Course, Module, Lesson, ForumCategory } = require('~/db/models');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');
const { logger } = require('~/config');

// All routes require admin
router.use(requireJwtAuth, checkAdmin);

// Course management
router.post('/courses/reorder', async (req, res) => {
  try {
    const { courseIds } = req.body;
    
    const updates = courseIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));

    await Course.bulkWrite(updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error reordering courses:', error);
    res.status(500).json({ error: 'Failed to reorder courses' });
  }
});

// Module management
router.post('/modules/reorder', async (req, res) => {
  try {
    const { moduleIds } = req.body;
    
    const updates = moduleIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));

    await Module.bulkWrite(updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error reordering modules:', error);
    res.status(500).json({ error: 'Failed to reorder modules' });
  }
});

// Lesson management
router.post('/lessons/reorder', async (req, res) => {
  try {
    const { lessonIds } = req.body;
    
    const updates = lessonIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index }
      }
    }));

    await Lesson.bulkWrite(updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error reordering lessons:', error);
    res.status(500).json({ error: 'Failed to reorder lessons' });
  }
});

// Forum category management
router.get('/forum/categories', async (req, res) => {
  try {
    const categories = await ForumCategory.find().sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching forum categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/forum/categories', async (req, res) => {
  try {
    const { name, description, slug, icon, order } = req.body;
    
    const category = new ForumCategory({
      name,
      description,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      icon,
      order: order || 0
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    logger.error('Error creating forum category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/forum/categories/:categoryId', async (req, res) => {
  try {
    const category = await ForumCategory.findByIdAndUpdate(
      req.params.categoryId,
      req.body,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    logger.error('Error updating forum category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/forum/categories/:categoryId', async (req, res) => {
  try {
    const category = await ForumCategory.findByIdAndDelete(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting forum category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Bulk import endpoint
router.post('/import/courses', async (req, res) => {
  try {
    const { courses } = req.body;
    
    // This would handle bulk import of course data
    // Implementation depends on the import format
    
    res.json({ 
      success: true, 
      message: `Import functionality would process ${courses.length} courses` 
    });
  } catch (error) {
    logger.error('Error importing courses:', error);
    res.status(500).json({ error: 'Failed to import courses' });
  }
});

// Analytics endpoints
router.get('/analytics/overview', async (req, res) => {
  try {
    const [courseCount, userCount, postCount] = await Promise.all([
      Course.countDocuments({ isPublished: true }),
      Progress.distinct('user').countDocuments(),
      ForumPost.countDocuments({ isDeleted: false })
    ]);

    res.json({
      courses: courseCount,
      enrolledUsers: userCount,
      forumPosts: postCount
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;