const express = require('express');
const router = express.Router();
const { CourseController } = require('~/server/controllers/lms');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const checkAdmin = require('~/server/middleware/roles/admin');

// Public routes (still require auth)
router.get('/', requireJwtAuth, CourseController.getCourses);
router.get('/:courseId', requireJwtAuth, CourseController.getCourse);
router.post('/:courseId/enroll', requireJwtAuth, CourseController.enrollCourse);
router.get('/user/enrolled', requireJwtAuth, CourseController.getUserCourses);

// Admin routes
router.post('/', requireJwtAuth, checkAdmin, CourseController.createCourse);
router.put('/:courseId', requireJwtAuth, checkAdmin, CourseController.updateCourse);
router.delete('/:courseId', requireJwtAuth, checkAdmin, CourseController.deleteCourse);

module.exports = router;