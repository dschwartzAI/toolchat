const { Progress, Lesson, Module } = require('~/db/models');
const { logger } = require('~/config');

/**
 * Service for managing user progress tracking
 */
class ProgressService {
  /**
   * Update video progress
   */
  async updateVideoProgress({ userId, lessonId, watchTime, position, duration }) {
    try {
      const lesson = await Lesson.findById(lessonId).lean();
      
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const module = await Module.findById(lesson.module).lean();
      
      if (!module) {
        throw new Error('Module not found');
      }

      // Find or create progress record
      let progress = await Progress.findOne({
        user: userId,
        lesson: lessonId
      });

      if (!progress) {
        progress = new Progress({
          user: userId,
          course: module.course,
          module: module._id,
          lesson: lessonId,
          watchTime: 0,
          lastPosition: 0,
          completed: false
        });
      }

      // Update watch time (accumulate)
      if (watchTime > progress.watchTime) {
        progress.watchTime = watchTime;
      }

      // Update last position
      progress.lastPosition = position;

      // Check if completed (watched 90% of video)
      if (duration && position >= duration * 0.9) {
        progress.completed = true;
        progress.completedAt = new Date();
      }

      await progress.save();

      return progress;
    } catch (error) {
      logger.error('[ProgressService] Error updating video progress:', error);
      throw error;
    }
  }

  /**
   * Mark lesson as complete
   */
  async markLessonComplete(userId, lessonId) {
    try {
      const lesson = await Lesson.findById(lessonId).lean();
      
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const module = await Module.findById(lesson.module).lean();

      let progress = await Progress.findOne({
        user: userId,
        lesson: lessonId
      });

      if (!progress) {
        progress = new Progress({
          user: userId,
          course: module.course,
          module: module._id,
          lesson: lessonId
        });
      }

      progress.completed = true;
      progress.completedAt = new Date();
      
      // For text lessons, set watch time to a nominal value
      if (lesson.type === 'text' && !progress.watchTime) {
        progress.watchTime = 300; // 5 minutes
      }

      await progress.save();

      return progress;
    } catch (error) {
      logger.error('[ProgressService] Error marking lesson complete:', error);
      throw error;
    }
  }

  /**
   * Get user's progress for a course
   */
  async getUserCourseProgress(userId, courseId) {
    try {
      const progressRecords = await Progress.find({
        user: userId,
        course: courseId
      })
      .populate('lesson', 'title type')
      .populate('module', 'title')
      .lean();

      return progressRecords;
    } catch (error) {
      logger.error('[ProgressService] Error getting user course progress:', error);
      throw error;
    }
  }

  /**
   * Get user's progress for a specific lesson
   */
  async getLessonProgress(userId, lessonId) {
    try {
      const progress = await Progress.findOne({
        user: userId,
        lesson: lessonId
      }).lean();

      return progress || {
        watchTime: 0,
        completed: false,
        lastPosition: 0
      };
    } catch (error) {
      logger.error('[ProgressService] Error getting lesson progress:', error);
      throw error;
    }
  }

  /**
   * Get user's overall progress stats
   */
  async getUserStats(userId) {
    try {
      const progressRecords = await Progress.find({ user: userId }).lean();

      const stats = {
        totalCoursesStarted: new Set(progressRecords.map(p => p.course.toString())).size,
        totalLessonsCompleted: progressRecords.filter(p => p.completed).length,
        totalWatchTime: progressRecords.reduce((sum, p) => sum + p.watchTime, 0),
        recentActivity: []
      };

      // Get recent activity
      const recentProgress = await Progress.find({ user: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('course', 'title')
        .populate('lesson', 'title')
        .lean();

      stats.recentActivity = recentProgress.map(p => ({
        courseTitle: p.course.title,
        lessonTitle: p.lesson.title,
        lastAccessed: p.updatedAt,
        completed: p.completed
      }));

      return stats;
    } catch (error) {
      logger.error('[ProgressService] Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Reset progress for a course
   */
  async resetCourseProgress(userId, courseId) {
    try {
      const result = await Progress.deleteMany({
        user: userId,
        course: courseId
      });

      return {
        success: true,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      logger.error('[ProgressService] Error resetting course progress:', error);
      throw error;
    }
  }

  /**
   * Get next lesson for user in a course
   */
  async getNextLesson(userId, courseId) {
    try {
      // Get all modules and lessons for the course
      const modules = await Module.find({ course: courseId })
        .populate('lessons')
        .sort({ order: 1 })
        .lean();

      // Get user's progress
      const progressRecords = await Progress.find({
        user: userId,
        course: courseId,
        completed: true
      }).lean();

      const completedLessonIds = new Set(progressRecords.map(p => p.lesson.toString()));

      // Find first incomplete lesson
      for (const module of modules) {
        for (const lesson of module.lessons.sort((a, b) => a.order - b.order)) {
          if (!completedLessonIds.has(lesson._id.toString())) {
            return {
              module,
              lesson
            };
          }
        }
      }

      // All lessons completed
      return null;
    } catch (error) {
      logger.error('[ProgressService] Error getting next lesson:', error);
      throw error;
    }
  }
}

module.exports = new ProgressService();