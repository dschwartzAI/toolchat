const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Ensure JSON parsing
router.use(express.json());

// Simple auth check
const requireAuth = (req, res, next) => {
  if (!req.user && !req.headers.authorization) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Feedback submission endpoint
router.post('/', requireAuth, async (req, res) => {
  console.log('[Feedback] Received feedback request, body:', req.body);
  
  try {
    const { category, feedback, email: providedEmail } = req.body;
    const userId = req.user?.id || 'anonymous';
    const userEmail = providedEmail || req.user?.email || 'anonymous';
    
    if (!category || !feedback) {
      return res.status(400).json({
        error: 'Category and feedback are required'
      });
    }
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.log('[Feedback] Dev mode - no Google Sheets config');
      return res.json({
        success: true,
        message: 'Feedback received (dev mode)',
      });
    }
    
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const values = [[
      new Date().toISOString(),
      userId,
      userEmail,
      category,
      feedback,
      req.headers['user-agent'] || 'unknown',
      req.ip || 'unknown'
    ]];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    
    console.log('[Feedback] Saved to Google Sheets');
    
    res.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
    
  } catch (error) {
    console.error('[Feedback] Error:', error.message);
    res.status(500).json({
      error: 'Failed to submit feedback. Please try again later.'
    });
  }
});

module.exports = router;