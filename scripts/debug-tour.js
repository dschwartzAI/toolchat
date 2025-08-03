// Debug script to test the onboarding tour
// Copy and paste this into the browser console when on LibreChat

// Check if React Joyride is loaded
console.log('React Joyride loaded:', typeof window.ReactJoyride !== 'undefined');

// Check for tour elements
const tourTargets = [
  '[data-tour="tool-selector"]',
  '[data-tour="chat-interface"]', 
  '[data-tour="conversation-history"]',
  '[data-tour="tool-switcher"]'
];

console.log('Tour elements found:');
tourTargets.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`${selector}:`, element ? 'Found' : 'NOT FOUND');
  if (element) {
    // Highlight the element briefly
    element.style.outline = '3px solid red';
    setTimeout(() => element.style.outline = '', 2000);
  }
});

// Try to find and click the settings button
const settingsButton = document.querySelector('[aria-label="Settings"]') || 
                      document.querySelector('button[title="Settings"]') ||
                      document.querySelector('svg.icon-md').closest('button');

if (settingsButton) {
  console.log('Settings button found, clicking...');
  settingsButton.click();
  
  // Wait for settings to open, then look for tour button
  setTimeout(() => {
    const tourButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Start Tour') || btn.textContent.includes('Platform Tour')
    );
    
    if (tourButton) {
      console.log('Tour button found:', tourButton);
      console.log('Click it to start the tour!');
      tourButton.style.outline = '3px solid green';
    } else {
      console.log('Tour button not found in settings');
    }
  }, 1000);
} else {
  console.log('Settings button not found');
}