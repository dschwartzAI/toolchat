const express = require('express');
const router = express.Router();
const { Lesson, Module } = require('~/db/models');
const { VideoService } = require('~/server/services/LMS');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');
const { logger } = require('~/config');

// Get lessons for a module
router.get('/module/:moduleId', requireJwtAuth, async (req, res) => {
  try {
    const lessons = await Lesson.find({ module: req.params.moduleId })
      .sort({ order: 1 })
      .lean();
    
    res.json(lessons);
  } catch (error) {
    logger.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get single lesson
router.get('/:lessonId', requireJwtAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate('module', 'title course')
      .lean();
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Parse video info if video lesson
    if (lesson.type === 'video' && lesson.videoUrl) {
      lesson.videoInfo = VideoService.parseVideoUrl(lesson.videoUrl);
    }

    res.json(lesson);
  } catch (error) {
    logger.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Create lesson (admin only)
router.post('/', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const { title, description, moduleId, type, content, videoUrl, order } = req.body;
    
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Validate video URL if provided
    if (type === 'video' && videoUrl) {
      if (!VideoService.isValidVideoUrl(videoUrl)) {
        return res.status(400).json({ error: 'Invalid video URL' });
      }
      
      const videoInfo = VideoService.parseVideoUrl(videoUrl);
      if (!videoInfo.provider) {
        return res.status(400).json({ error: 'Unsupported video provider' });
      }
    }

    const lesson = new Lesson({
      title,
      description,
      module: moduleId,
      type,
      content,
      videoUrl,
      videoProvider: type === 'video' ? VideoService.parseVideoUrl(videoUrl).provider : undefined,
      order: order || 0
    });

    await lesson.save();

    // Add lesson to module
    module.lessons.push(lesson._id);
    await module.save();

    res.status(201).json(lesson);
  } catch (error) {
    logger.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson (admin only)
router.put('/:lessonId', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    // Validate video URL if updated
    if (videoUrl && !VideoService.isValidVideoUrl(videoUrl)) {
      return res.status(400).json({ error: 'Invalid video URL' });
    }

    const updateData = { ...req.body };
    if (videoUrl) {
      updateData.videoProvider = VideoService.parseVideoUrl(videoUrl).provider;
    }

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.lessonId,
      updateData,
      { new: true }
    );

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    logger.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson (admin only)
router.delete('/:lessonId', requireJwtAuth, checkAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Remove from module
    await Module.findByIdAndUpdate(lesson.module, {
      $pull: { lessons: lesson._id }
    });

    // Delete the lesson
    await lesson.remove();

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Get video embed info
router.post('/video-info', requireJwtAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const embedInfo = VideoService.generateEmbedCode(url);
    
    if (!embedInfo) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    res.json(embedInfo);
  } catch (error) {
    logger.error('Error getting video info:', error);
    res.status(500).json({ error: 'Failed to get video info' });
  }
});

module.exports = router;