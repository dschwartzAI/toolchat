const { Course, Module, Lesson, Progress } = require('~/db/models');
const { logger } = require('~/config');

/**
 * Service for managing courses
 */
class CourseService {
  /**
   * Get all published courses
   */
  async getAllCourses({ limit = 20, offset = 0, includeUnpublished = false }) {
    try {
      const query = includeUnpublished ? {} : { isPublished: true };
      
      const courses = await Course.find(query)
        .populate('author', 'name avatar')
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
        
      const total = await Course.countDocuments(query);
      
      return { courses, total };
    } catch (error) {
      logger.error('[CourseService] Error getting courses:', error);
      throw error;
    }
  }

  /**
   * Get a single course with modules and lessons
   */
  async getCourseById(courseId, userId = null) {
    try {
      const course = await Course.findById(courseId)
        .populate('author', 'name avatar')
        .lean();
        
      if (!course) {
        return null;
      }

      // Get modules with lessons
      const modules = await Module.find({ course: courseId })
        .populate({
          path: 'lessons',
          options: { sort: { order: 1 } }
        })
        .sort({ order: 1 })
        .lean();

      // Get user progress if userId provided
      let progress = null;
      if (userId) {
        progress = await this.getCourseProgress(courseId, userId);
      }

      return {
        ...course,
        modules,
        progress
      };
    } catch (error) {
      logger.error('[CourseService] Error getting course:', error);
      throw error;
    }
  }

  /**
   * Get course with user progress
   */
  async getCourseWithProgress(courseId, userId) {
    try {
      const course = await this.getCourseById(courseId, userId);
      
      if (!course) {
        return null;
      }

      // Get detailed progress for each lesson
      const progressRecords = await Progress.find({
        user: userId,
        course: courseId
      }).lean();

      const progressMap = {};
      progressRecords.forEach(p => {
        progressMap[p.lesson.toString()] = p;
      });

      // Add progress to each lesson
      course.modules = course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          progress: progressMap[lesson._id.toString()] || null
        }))
      }));

      return course;
    } catch (error) {
      logger.error('[CourseService] Error getting course with progress:', error);
      throw error;
    }
  }

  /**
   * Create a new course
   */
  async createCourse(courseData, authorId) {
    try {
      const course = new Course({
        ...courseData,
        author: authorId
      });
      
      await course.save();
      return course;
    } catch (error) {
      logger.error('[CourseService] Error creating course:', error);
      throw error;
    }
  }

  /**
   * Update a course
   */
  async updateCourse(courseId, updateData, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Check ownership
      if (course.author.toString() !== userId) {
        throw new Error('Unauthorized to update this course');
      }

      Object.assign(course, updateData);
      await course.save();
      
      return course;
    } catch (error) {
      logger.error('[CourseService] Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete a course and all related data
   */
  async deleteCourse(courseId, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Check ownership
      if (course.author.toString() !== userId) {
        throw new Error('Unauthorized to delete this course');
      }

      // Delete all progress records
      await Progress.deleteMany({ course: courseId });

      // Get all modules
      const modules = await Module.find({ course: courseId });
      
      // Delete all lessons
      for (const module of modules) {
        await Lesson.deleteMany({ module: module._id });
      }

      // Delete all modules
      await Module.deleteMany({ course: courseId });

      // Finally delete the course
      await course.remove();

      return { success: true };
    } catch (error) {
      logger.error('[CourseService] Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Get user's course progress
   */
  async getCourseProgress(courseId, userId) {
    try {
      const progressRecords = await Progress.find({
        user: userId,
        course: courseId
      }).lean();

      const modules = await Module.find({ course: courseId })
        .populate('lessons')
        .lean();

      let totalLessons = 0;
      let completedLessons = 0;
      let totalWatchTime = 0;

      modules.forEach(module => {
        totalLessons += module.lessons.length;
      });

      progressRecords.forEach(progress => {
        if (progress.completed) {
          completedLessons++;
        }
        totalWatchTime += progress.watchTime;
      });

      return {
        totalLessons,
        completedLessons,
        totalWatchTime,
        percentComplete: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      };
    } catch (error) {
      logger.error('[CourseService] Error getting course progress:', error);
      throw error;
    }
  }

  /**
   * Enroll user in a course
   */
  async enrollUser(courseId, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if already enrolled (has any progress)
      const existingProgress = await Progress.findOne({
        user: userId,
        course: courseId
      });

      if (existingProgress) {
        return { alreadyEnrolled: true };
      }

      // Increment enrollment count
      course.enrollmentCount = (course.enrollmentCount || 0) + 1;
      await course.save();

      return { enrolled: true };
    } catch (error) {
      logger.error('[CourseService] Error enrolling user:', error);
      throw error;
    }
  }
}

module.exports = new CourseService();