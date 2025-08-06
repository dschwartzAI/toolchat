const express = require('express');
const router = express.Router();

// Import sub-routers
const coursesRouter = require('./courses');
const modulesRouter = require('./modules');
const lessonsRouter = require('./lessons');
const progressRouter = require('./progress');
const forumRouter = require('./forum');
const adminRouter = require('./admin');

// Mount sub-routers
router.use('/courses', coursesRouter);
router.use('/modules', modulesRouter);
router.use('/lessons', lessonsRouter);
router.use('/progress', progressRouter);
router.use('/forum', forumRouter);
router.use('/admin', adminRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lms' });
});

module.exports = router;