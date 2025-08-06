const { ProgressService } = require('~/server/services/LMS');
const { logger } = require('~/config');

const ProgressController = {
  /**
   * Update video progress
   */
  async updateVideoProgress(req, res) {
    try {
      const { lessonId, watchTime, position, duration } = req.body;
      
      if (!lessonId || watchTime === undefined || position === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const progress = await ProgressService.updateVideoProgress({
        userId: req.user.id,
        lessonId,
        watchTime,
        position,
        duration
      });

      res.json(progress);
    } catch (error) {
      logger.error('[ProgressController] Error updating video progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  },

  /**
   * Mark lesson as complete
   */
  async completeLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const progress = await ProgressService.markLessonComplete(req.user.id, lessonId);
      res.json(progress);
    } catch (error) {
      logger.error('[ProgressController] Error completing lesson:', error);
      res.status(500).json({ error: 'Failed to mark lesson complete' });
    }
  },

  /**
   * Get lesson progress
   */
  async getLessonProgress(req, res) {
    try {
      const { lessonId } = req.params;
      const progress = await ProgressService.getLessonProgress(req.user.id, lessonId);
      res.json(progress);
    } catch (error) {
      logger.error('[ProgressController] Error getting lesson progress:', error);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  },

  /**
   * Get course progress
   */
  async getCourseProgress(req, res) {
    try {
      const { courseId } = req.params;
      const progress = await ProgressService.getUserCourseProgress(req.user.id, courseId);
      res.json(progress);
    } catch (error) {
      logger.error('[ProgressController] Error getting course progress:', error);
      res.status(500).json({ error: 'Failed to fetch course progress' });
    }
  },

  /**
   * Get next lesson
   */
  async getNextLesson(req, res) {
    try {
      const { courseId } = req.params;
      const next = await ProgressService.getNextLesson(req.user.id, courseId);
      res.json(next || { completed: true });
    } catch (error) {
      logger.error('[ProgressController] Error getting next lesson:', error);
      res.status(500).json({ error: 'Failed to fetch next lesson' });
    }
  },

  /**
   * Reset course progress
   */
  async resetProgress(req, res) {
    try {
      const { courseId } = req.params;
      const result = await ProgressService.resetCourseProgress(req.user.id, courseId);
      res.json(result);
    } catch (error) {
      logger.error('[ProgressController] Error resetting progress:', error);
      res.status(500).json({ error: 'Failed to reset progress' });
    }
  }
};

module.exports = ProgressController;