const express = require('express');
const router = express.Router();

// Test endpoint - no auth required
router.post('/', async (req, res) => {
  console.log('[FEEDBACK TEST] Received request:', {
    body: req.body,
    headers: req.headers,
    user: req.user
  });
  
  res.json({
    success: true,
    message: 'Test feedback received',
    received: req.body
  });
});

module.exports = router;