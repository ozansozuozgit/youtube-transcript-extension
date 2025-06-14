/**
 * Extension Reload Helper Script
 * 
 * Run this in the browser console to reload the extension after making changes
 * This is especially useful for development and testing fixes
 */

// Function to reload the extension
async function reloadExtension() {
  try {
    console.log('🔄 Reloading YouTube AI Summary Extension...');
    
    // Send a message to the background script to trigger reload
    if (chrome && chrome.runtime) {
      // Get the extension ID
      const extensionId = chrome.runtime.id;
      console.log(`Extension ID: ${extensionId}`);
      
      // Try to send a message to check if extension is responsive
      chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('❌ Extension not responding (may need manual reload)');
          console.log('Please go to chrome://extensions/ and click reload on the extension');
        } else {
          console.log('✅ Extension is responsive');
        }
      });
      
      // Reload the current page to re-inject content scripts
      setTimeout(() => {
        console.log('🔄 Reloading page to re-inject content scripts...');
        window.location.reload();
      }, 1000);
      
    } else {
      console.log('❌ Chrome extension APIs not available');
      console.log('Make sure you\'re running this on a YouTube page with the extension loaded');
    }
    
  } catch (error) {
    console.error('Error reloading extension:', error);
  }
}

// Instructions
console.log('📋 Extension Reload Helper');
console.log('========================');
console.log('');
console.log('To reload the extension after fixes:');
console.log('1. Go to chrome://extensions/');
console.log('2. Find "YouTube AI Summary" extension');
console.log('3. Click the reload button (circular arrow icon)');
console.log('4. Come back to a YouTube video page');
console.log('5. Run: reloadExtension()');
console.log('');
console.log('Or just run reloadExtension() now to reload this page:');

// Make the function globally available
window.reloadExtension = reloadExtension; 