/**
 * YouTube AI Summary - AI Sites Content Script
 * Handles auto-pasting transcripts into AI chat interfaces
 */

// Current site provider type
let providerType = detectProviderType();
console.log("YouTube AI Summary: AI site detected -", providerType);

// Site-specific selectors for input fields and submit buttons
const SITE_SELECTORS = {
  chatgpt: {
    input: '#prompt-textarea',
    submit: 'button[data-testid="send-button"]',
    readyIndicator: '#prompt-textarea',
    pasteDelay: 2500, // Increased delay for ChatGPT
    submitDelay: 1000, // Increased delay for ChatGPT
    extraAttempts: 2  // Extra attempts specifically for ChatGPT
  },
  claude: {
    input: '.claude-input, [contenteditable="true"]',
    submit: 'button[aria-label="Send message"], button.send-button',
    readyIndicator: '.claude-input, [contenteditable="true"]',
    pasteDelay: 2000,
    submitDelay: 800
  },
  gemini: {
    input: '[contenteditable="true"], textarea.message-input',
    submit: 'button[aria-label="Send message"], button.send-button',
    readyIndicator: '[contenteditable="true"], textarea.message-input',
    pasteDelay: 2000,
    submitDelay: 800
  },
  deepseek: {
    input: 'textarea#chat-input, .message-input',
    submit: 'button.send-button, button[type="submit"]',
    readyIndicator: 'textarea#chat-input, .message-input',
    pasteDelay: 1500,
    submitDelay: 500
  }
};

// Retry configuration for auto-paste
const RETRY_CONFIG = {
  maxAttempts: 5,
  delayBetweenAttempts: 2000,
  initialDelay: 1000
};

// Create a notification UI element
function createNotification() {
  // Check if notification already exists
  if (document.getElementById('yt-ai-summary-notification')) {
    return;
  }
  
  const notification = document.createElement('div');
  notification.id = 'yt-ai-summary-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    z-index: 10000;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  return notification;
}

function showNotification(message, duration = 5000) {
  const notification = createNotification();
  if (!notification) return;
  
  notification.textContent = `YouTube AI Summary: ${message}`;
  notification.style.opacity = '1';
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Detect which AI provider site we're on
function detectProviderType() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('openai.com') || hostname.includes('chat.openai')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return 'gemini';
  } else if (hostname.includes('deepseek.com')) {
    return 'deepseek';
  }
  
  return null;
}

// Get stored transcript from background script
async function getStoredTranscript() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'getStoredTranscript', provider: providerType },
      response => {
        if (response && response.success) {
          resolve(response.transcript);
        } else {
          resolve(null);
        }
      }
    );
  });
}

// Set input value using different methods (for compatibility across sites)
function setInputValue(input, text) {
  if (!input) return false;
  
  try {
    // Method 1: Standard value/innerHTML property setting
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = text;
    } else if (input.isContentEditable) {
      input.innerHTML = text;
    } else {
      return false;
    }
    
    // Method 2: Dispatch input event to trigger UI updates
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Method 3: Focus on input to ensure UI state is correct
    input.focus();
    
    return true;
  } catch (error) {
    console.error("YouTube AI Summary: Error setting input value", error);
    return false;
  }
}

// Try to submit the form
function submitForm(submitButton) {
  if (!submitButton) return false;
  
  try {
    // Enable the button if disabled
    if (submitButton.disabled) {
      submitButton.disabled = false;
    }
    
    // Click the button
    submitButton.click();
    
    return true;
  } catch (error) {
    console.error("YouTube AI Summary: Error submitting form", error);
    return false;
  }
}

// Main function to paste transcript when the page is ready
async function autoPasteTranscript() {
  // Check if we're on a supported site
  if (!providerType) {
    console.log("YouTube AI Summary: Not on a supported AI provider site");
    return;
  }
  
  const selectors = SITE_SELECTORS[providerType];
  if (!selectors) {
    console.log("YouTube AI Summary: No selectors found for this provider");
    return;
  }

  console.log("YouTube AI Summary: Waiting for transcript data...");
  
  // Create an initial loading notification
  showNotification("Preparing to paste transcript...");
  
  // Get the transcript from background script with initial delay
  setTimeout(async () => {
    const transcript = await getStoredTranscript();
    if (!transcript) {
      console.log("YouTube AI Summary: No transcript to auto-paste");
      return;
    }
    
    console.log("YouTube AI Summary: Transcript received, waiting for page to be ready");
    showNotification("Transcript received, preparing to paste...");
    
    // Set max attempts based on provider (ChatGPT needs more attempts)
    const maxAttempts = selectors.extraAttempts 
      ? RETRY_CONFIG.maxAttempts + selectors.extraAttempts 
      : RETRY_CONFIG.maxAttempts;
    
    // Start retry loop for waiting for input element
    let attempt = 0;
    const attemptPaste = async () => {
      attempt++;
      console.log(`YouTube AI Summary: Paste attempt ${attempt} of ${maxAttempts} for ${providerType}`);
      
      const input = document.querySelector(selectors.input);
      if (!input) {
        if (attempt < maxAttempts) {
          showNotification(`Waiting for input field (attempt ${attempt})...`);
          setTimeout(attemptPaste, RETRY_CONFIG.delayBetweenAttempts);
        } else {
          console.error("YouTube AI Summary: Input field not found after maximum attempts");
          showNotification("Could not find input field. Try pasting manually (Ctrl/Cmd+V)");
        }
        return;
      }
      
      console.log("YouTube AI Summary: Input field found, attempting to paste transcript");
      showNotification("Pasting transcript...");
      
      // Set the value of the input
      const success = setInputValue(input, transcript);
      
      if (success) {
        console.log("YouTube AI Summary: Transcript pasted successfully");
        showNotification("Transcript pasted successfully");
        
        // Find and click the submit button
        const submitButton = document.querySelector(selectors.submit);
        if (submitButton) {
          // Wait a moment before submitting
          setTimeout(() => {
            if (submitForm(submitButton)) {
              console.log("YouTube AI Summary: Form submitted automatically");
              showNotification("Form submitted automatically", 3000);
            } else {
              showNotification("Pasted transcript, but couldn't submit. Press Enter to submit.");
            }
          }, selectors.submitDelay);
        } else {
          showNotification("Transcript pasted. Press Enter to submit.");
        }
      } else {
        if (attempt < RETRY_CONFIG.maxAttempts) {
          console.log(`YouTube AI Summary: Paste failed, retrying (${attempt}/${RETRY_CONFIG.maxAttempts})`);
          showNotification(`Paste failed, retrying (${attempt}/${RETRY_CONFIG.maxAttempts})...`);
          setTimeout(attemptPaste, RETRY_CONFIG.delayBetweenAttempts);
        } else {
          console.error("YouTube AI Summary: Failed to paste after maximum attempts");
          showNotification("Failed to auto-paste. Try pasting manually (Ctrl/Cmd+V)");
          
          // Copy to clipboard as fallback
          try {
            await navigator.clipboard.writeText(transcript);
            showNotification("Transcript copied to clipboard for manual pasting");
          } catch (err) {
            console.error("YouTube AI Summary: Failed to copy to clipboard");
          }
        }
      }
    };
    
    // Start the paste attempts after the input field should be ready
    setTimeout(attemptPaste, selectors.pasteDelay);
  }, RETRY_CONFIG.initialDelay);
}

// Helper function to wait for an element to appear in the DOM
function waitForElement(selector, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    // Set a timeout to reject the promise if the element doesn't appear
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found after ${timeoutMs}ms`));
    }, timeoutMs);
    
    // Create a mutation observer to watch for the element
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(timeout);
        obs.disconnect();
        resolve(element);
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

// Initialize when the page is loaded
if (document.readyState === 'complete') {
  autoPasteTranscript();
} else {
  window.addEventListener('load', autoPasteTranscript);
} 