# 📝 Feedback System with Google Sheets Integration - Complete Setup Guide

## ✅ Working Solution Documentation

This guide documents the complete working feedback system that submits user feedback to Google Sheets via the LibreChat interface.

## 🎯 Overview

The feedback system allows authenticated users to submit feedback through a modal in LibreChat, which is then automatically saved to a Google Sheet for tracking and analysis.

### Key Features
- ✅ In-app feedback submission via modal
- ✅ Google Sheets integration for data storage
- ✅ Rate limiting (5 submissions per minute)
- ✅ JWT authentication integration
- ✅ Category-based feedback (bug, feature, general, other)
- ✅ Optional email collection
- ✅ Automatic user tracking

## 📋 Prerequisites

### 1. Google Cloud Service Account
You need a Google Cloud service account with access to Google Sheets API:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a service account
5. Download the credentials JSON
6. Extract these values for your `.env` file

### 2. Google Sheet Setup
1. Create a new Google Sheet
2. Note the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Share the sheet with your service account email (found in credentials)
4. Give it "Editor" permissions

## 🔧 Implementation Files

### 1. Backend Route: `/api/server/routes/feedback-simple.js`

```javascript
const express = require('express');
const { google } = require('googleapis');
const rateLimit = require('express-rate-limit');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();

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
router.post('/', requireJwtAuth, feedbackLimiter, async (req, res) => {
  logger.info('Received feedback request', { 
    body: req.body,
    user: req.user?.id || 'anonymous'
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
    
    res.json({
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
```

### 2. Route Registration: `/api/server/routes/index.js`

Add this line to import the feedback route:
```javascript
const feedback = require('./feedback-simple');
```

And include it in the module.exports:
```javascript
module.exports = {
  // ... other routes
  feedback,
};
```

### 3. Server Mount: `/api/server/index.js`

Ensure the route is mounted (should be around line 123):
```javascript
app.use('/api/feedback', routes.feedback);
```

## 🔐 Environment Variables

Add these to your `.env` file:

```bash
# Google Sheets API Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` must include the full key with BEGIN/END markers
- Newlines in the key should be represented as `\n`
- Wrap the entire key in double quotes

## 🐳 Docker Deployment

### Dockerfile.custom Updates

Ensure these files are copied in your Dockerfile:

```dockerfile
# Copy missing backend files
COPY api/server/routes/feedback-simple.js /app/api/server/routes/feedback-simple.js
COPY api/server/routes/index.js /app/api/server/routes/index.js
COPY api/server/index.js /app/api/server/index.js
```

### Docker Compose Environment

In your `docker-compose.yml`, ensure the environment variables are passed:

```yaml
services:
  api:
    environment:
      - GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
      - GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
      - GOOGLE_SHEET_ID=${GOOGLE_SHEET_ID}
```

## 📊 Google Sheet Structure

Your Google Sheet should have these columns:
1. **Column A**: Timestamp
2. **Column B**: User ID
3. **Column C**: User Email
4. **Column D**: Category
5. **Column E**: Feedback
6. **Column F**: User Agent
7. **Column G**: IP Address

## 🚀 Cloud Deployment Checklist

- [ ] Create Google Cloud service account
- [ ] Enable Google Sheets API
- [ ] Create and share Google Sheet with service account
- [ ] Add environment variables to cloud provider
- [ ] Ensure `feedback-simple.js` is included in build
- [ ] Verify route registration in `routes/index.js`
- [ ] Confirm route mounting in `server/index.js`
- [ ] Test authentication flow
- [ ] Verify rate limiting works
- [ ] Check Google Sheet receives data

## 🧪 Testing

1. **Local Testing**:
   ```bash
   # Test without auth (should fail)
   curl -X POST http://localhost:3090/api/feedback \
     -H "Content-Type: application/json" \
     -d '{"category":"test","feedback":"test"}'
   ```

2. **Browser Testing**:
   - Login to LibreChat
   - Click feedback button
   - Submit feedback
   - Check browser console for errors
   - Verify entry appears in Google Sheet

## 🔍 Troubleshooting

### Common Issues:

1. **401 Unauthorized Error**
   - Ensure using `requireJwtAuth` from LibreChat middleware
   - Check user is logged in
   - Verify JWT token is valid

2. **Google Sheets Not Updating**
   - Verify environment variables are set
   - Check service account has edit permissions on sheet
   - Ensure Sheet ID is correct
   - Check logs for specific Google API errors

3. **Route Not Found**
   - Verify `feedback-simple.js` exists in container
   - Check route is registered in `routes/index.js`
   - Ensure route is mounted in `server/index.js`

### Debug Commands:

```bash
# Check if feedback route exists in container
docker exec LibreChat ls -la /app/api/server/routes/feedback-simple.js

# Check logs for feedback attempts
docker logs LibreChat | grep -i feedback

# Test route availability
curl -I http://localhost:3090/api/feedback
```

## ✅ Success Indicators

When working correctly, you should see:
- Success toast message in UI after submission
- New row appears in Google Sheet
- Server logs show "Successfully saved to Google Sheets"
- No errors in browser console

## 🎯 Summary

This feedback system provides a seamless way for users to submit feedback directly from LibreChat, with all data automatically stored in Google Sheets for easy tracking and analysis. The implementation uses LibreChat's native authentication system and includes proper error handling and rate limiting for production use.