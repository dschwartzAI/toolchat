const fs = require('fs');
const path = require('path');

console.log('[Apply Feedback Patch] Starting...');

const indexPath = path.join(__dirname, 'index.js');
const feedbackRoutePath = path.join(__dirname, 'routes', 'feedback.js');

// Check if feedback route file exists
if (!fs.existsSync(feedbackRoutePath)) {
  console.error('[Apply Feedback Patch] Error: feedback.js route file not found');
  process.exit(1);
}

// Read the current index.js
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Check if feedback route is already included
if (indexContent.includes("require('./routes/feedback')") || indexContent.includes('routes/feedback')) {
  console.log('[Apply Feedback Patch] Feedback route already included in index.js');
  process.exit(0);
}

// Find where to insert the feedback route
// Look for the pattern where other routes are defined
const routePatterns = [
  /app\.use\('\/api\/auth',\s*require\('\.\/routes\/auth'\)\);/,
  /app\.use\('\/api\/user',\s*require\('\.\/routes\/user'\)\);/,
  /app\.use\('\/api\/search',\s*require\('\.\/routes\/search'\)\);/,
  /app\.use\('\/api\/ask',\s*require\('\.\/routes\/ask'\)\);/,
  /app\.use\('\/api\/edit',\s*require\('\.\/routes\/edit'\)\);/,
];

let inserted = false;
for (const pattern of routePatterns) {
  if (pattern.test(indexContent)) {
    // Insert after this pattern
    indexContent = indexContent.replace(pattern, (match) => {
      return match + "\napp.use('/api/feedback', require('./routes/feedback'));";
    });
    inserted = true;
    console.log('[Apply Feedback Patch] Inserted feedback route after existing routes');
    break;
  }
}

// If no pattern found, try to insert before the 404 handler
if (!inserted) {
  const notFoundPattern = /app\.use\(\(req, res\) => {[\s\S]*?res\.status\(404\)[\s\S]*?}\);/;
  if (notFoundPattern.test(indexContent)) {
    indexContent = indexContent.replace(notFoundPattern, (match) => {
      return "app.use('/api/feedback', require('./routes/feedback'));\n\n" + match;
    });
    inserted = true;
    console.log('[Apply Feedback Patch] Inserted feedback route before 404 handler');
  }
}

// If still not inserted, append before the module.exports
if (!inserted) {
  const moduleExportsPattern = /module\.exports = app;/;
  if (moduleExportsPattern.test(indexContent)) {
    indexContent = indexContent.replace(moduleExportsPattern, (match) => {
      return "app.use('/api/feedback', require('./routes/feedback'));\n\n" + match;
    });
    inserted = true;
    console.log('[Apply Feedback Patch] Inserted feedback route before module.exports');
  }
}

if (!inserted) {
  console.error('[Apply Feedback Patch] Error: Could not find suitable location to insert feedback route');
  process.exit(1);
}

// Write the updated content back
fs.writeFileSync(indexPath, indexContent);
console.log('[Apply Feedback Patch] Successfully updated index.js');

// Verify the route is now included
const updatedContent = fs.readFileSync(indexPath, 'utf8');
if (updatedContent.includes("require('./routes/feedback')")) {
  console.log('[Apply Feedback Patch] Verification successful - feedback route is now included');
} else {
  console.error('[Apply Feedback Patch] Verification failed - feedback route not found after update');
  process.exit(1);
}