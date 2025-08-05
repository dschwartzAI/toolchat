const { CourseService, ProgressService } = require('~/server/services/LMS');
const { SystemRoles } = require('librechat-data-provider');
const { logger } = require('~/config');

const CourseController = {
  /**
   * Get all courses
   */
  async getCourses(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const includeUnpublished = req.user.role === SystemRoles.ADMIN;
      
      const result = await CourseService.getAllCourses({
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeUnpublished
      });

      res.json(result);
    } catch (error) {
      logger.error('[CourseController] Error getting courses:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  },

  /**
   * Get single course
   */
  async getCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await CourseService.getCourseWithProgress(courseId, req.user.id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if course is published or user is admin/author
      if (!course.isPublished && 
          req.user.role !== SystemRoles.ADMIN && 
          course.author.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(course);
    } catch (error) {
      logger.error('[CourseController] Error getting course:', error);
      res.status(500).json({ error: 'Failed to fetch course' });
    }
  },

  /**
   * Create course (admin only)
   */
  async createCourse(req, res) {
    try {
      const course = await CourseService.createCourse(req.body, req.user.id);
      res.status(201).json(course);
    } catch (error) {
      logger.error('[CourseController] Error creating course:', error);
      res.status(500).json({ error: 'Failed to create course' });
    }
  },

  /**
   * Update course (admin/author only)
   */
  async updateCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await CourseService.updateCourse(courseId, req.body, req.user.id);
      res.json(course);
    } catch (error) {
      logger.error('[CourseController] Error updating course:', error);
      if (error.message === 'Unauthorized to update this course') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update course' });
    }
  },

  /**
   * Delete course (admin/author only)
   */
  async deleteCourse(req, res) {
    try {
      const { courseId } = req.params;
      await CourseService.deleteCourse(courseId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      logger.error('[CourseController] Error deleting course:', error);
      if (error.message === 'Unauthorized to delete this course') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete course' });
    }
  },

  /**
   * Enroll in course
   */
  async enrollCourse(req, res) {
    try {
      const { courseId } = req.params;
      const result = await CourseService.enrollUser(courseId, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('[CourseController] Error enrolling in course:', error);
      res.status(500).json({ error: 'Failed to enroll in course' });
    }
  },

  /**
   * Get user's enrolled courses
   */
  async getUserCourses(req, res) {
    try {
      const progressRecords = await ProgressService.getUserStats(req.user.id);
      res.json(progressRecords);
    } catch (error) {
      logger.error('[CourseController] Error getting user courses:', error);
      res.status(500).json({ error: 'Failed to fetch user courses' });
    }
  }
};

module.exports = CourseController;