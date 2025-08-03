const express = require('express');
const { google } = require('googleapis');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Test endpoint to verify route is accessible
router.get('/test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Feedback route is accessible',
    hasUser: !!req.user
  });
});

// Simple logger fallback
const logger = {
  info: (...args) => console.log('[Feedback]', ...args),
  error: (...args) => console.error('[Feedback]', ...args)
};

// Rate limiting middleware
const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many feedback submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Feedback submission endpoint
router.post('/', feedbackLimiter, async (req, res) => {
  logger.info('Received feedback request', { 
    body: req.body,
    user: req.user?.id || 'anonymous',
    headers: req.headers,
    url: req.originalUrl
  });
  
  try {
    const { category, feedback, email: providedEmail } = req.body;
    const userId = req.user?.id || 'anonymous';
    const userEmail = providedEmail || req.user?.email || 'anonymous';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Validate input
    if (!category || !feedback) {
      return res.status(400).json({
        error: 'Category and feedback are required'
      });
    }
    
    // Validate category
    const validCategories = ['bug', 'feature', 'general', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category'
      });
    }
    
    // Validate feedback length
    if (feedback.length > 5000) {
      return res.status(400).json({
        error: 'Feedback is too long (max 5000 characters)'
      });
    }
    
    // Get environment variables
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // Development mode - log to console if Google Sheets not configured
    if (!clientEmail || !privateKey || !spreadsheetId) {
      logger.info('Development Mode - Feedback Received', {
        timestamp: new Date().toISOString(),
        userId,
        email: userEmail,
        category,
        feedback,
        userAgent,
        ip
      });
      
      return res.json({
        success: true,
        message: 'Feedback received (development mode - check server logs)',
      });
    }
    
    logger.info('Initializing Google Sheets API', {
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      hasSpreadsheetId: !!spreadsheetId,
      spreadsheetId
    });
    
    // Initialize Google Sheets API
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare data for Google Sheets
    const timestamp = new Date().toISOString();
    const values = [[
      timestamp,
      userId,
      userEmail,
      category,
      feedback,
      userAgent,
      ip
    ]];
    
    // Append to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:G', // Adjust sheet name if different
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    
    logger.info('Successfully saved to Google Sheets', {
      userId,
      category,
      timestamp
    });
    
    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback! We appreciate your input.',
    });
    
  } catch (error) {
    logger.error('Error submitting feedback:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      response: error.response?.data
    });
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return res.status(500).json({
        error: 'Permission denied. Please check Google Sheets permissions.'
      });
    }
    
    if (error.code === 404) {
      return res.status(500).json({
        error: 'Spreadsheet not found. Please check the spreadsheet ID.'
      });
    }
    
    // Don't expose internal errors to client
    res.status(500).json({
      error: 'Failed to submit feedback. Please try again later.'
    });
  }
});

module.exports = router;