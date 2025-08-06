const express = require('express');
const router = express.Router();
const { ProgressController } = require('~/server/controllers/lms');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

// Progress tracking routes
router.put('/video', requireJwtAuth, ProgressController.updateVideoProgress);
router.post('/lesson/:lessonId/complete', requireJwtAuth, ProgressController.completeLesson);
router.get('/lesson/:lessonId', requireJwtAuth, ProgressController.getLessonProgress);
router.get('/course/:courseId', requireJwtAuth, ProgressController.getCourseProgress);
router.get('/course/:courseId/next', requireJwtAuth, ProgressController.getNextLesson);
router.delete('/course/:courseId/reset', requireJwtAuth, ProgressController.resetProgress);

module.exports = router;