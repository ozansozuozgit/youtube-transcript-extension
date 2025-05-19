/**
 * YouTube AI Summary Extension - Content Script
 * Injects summarize button on YouTube video pages and extracts transcripts
 */

// AI providers configuration
const AI_PROVIDERS = {
  chatgpt: {
    name: "ChatGPT",
    url: "https://chat.openai.com/",
    autoSubmit: false,
    icon: "🤖"
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai/",
    autoSubmit: false,
    icon: "🧠"
  },
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com/app",
    autoSubmit: false,
    icon: "✨"
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://chat.deepseek.com/",
    autoSubmit: false,
    icon: "🔍"
  }
};

// Default prompt template
const DEFAULT_PROMPT_TEMPLATE = `Please summarize the following YouTube video transcript into key points:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
1. A brief overview (2-3 sentences)
2. 5-8 key points or main ideas
3. Any important conclusions or takeaways`;

// App settings
let appSettings = {
  aiModel: 'chatgpt',
  autoPaste: true,
  darkMode: false,
  language: 'en',
  promptTemplate: DEFAULT_PROMPT_TEMPLATE
};

// Main function that runs when the script is loaded
(async function() {
  console.log("YouTube AI Summary: Content script loaded.");
  await loadSettings();
  
  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.settings) {
      const newSettings = changes.settings.newValue;
      if (newSettings) {
        appSettings = { ...appSettings, ...newSettings };
        console.log("YouTube AI Summary: Settings updated", appSettings);
      }
    }
  });
  
  let buttonAdded = false;
  
  const observer = new MutationObserver(() => {
    // Handle both regular YouTube and YouTube Shorts
    if (!buttonAdded && (isVideoPage() || isShortsPage())) {
      addSummarizeButton();
      buttonAdded = true;
    }
    
    // Re-check if we've navigated to/from shorts
    if (buttonAdded && document.getElementById('yt-ai-summary-button')) {
      updateButtonForPageType();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  if (isVideoPage() || isShortsPage()) {
    addSummarizeButton();
    buttonAdded = true;
  }
})();

// Load settings from storage
async function loadSettings() {
  try {
    const storedSettings = await chrome.storage.sync.get('settings');
    if (storedSettings.settings) {
      appSettings = { 
        ...appSettings, 
        ...storedSettings.settings 
      };
      console.log("YouTube AI Summary: Settings loaded", appSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Check if we're on a regular video page
function isVideoPage() {
  return window.location.pathname === '/watch' && document.getElementById('player');
}

// Check if we're on a YouTube Shorts page
function isShortsPage() {
  return window.location.pathname.startsWith('/shorts/');
}

// Get ordered providers with preferred model first
function getOrderedProviders() {
  const preferredModel = appSettings.aiModel || 'chatgpt';
  const providers = Object.keys(AI_PROVIDERS);
  
  // Sort providers to put preferred model first
  return providers.sort((a, b) => {
    if (a === preferredModel) return -1;
    if (b === preferredModel) return 1;
    return 0;
  });
}

// Update button classes based on page type
function updateButtonForPageType() {
  const container = document.querySelector('.yt-ai-summary-container');
  if (!container) return;
  
  // Check if we're on shorts page
  if (isShortsPage()) {
    container.classList.add('is-shorts');
  } else {
    container.classList.remove('is-shorts');
  }
}

function addSummarizeButton() {
  console.log("YouTube AI Summary: Adding summarize button...");
  
  // Different container depending on whether it's a regular video or shorts
  let menuContainer;
  
  if (isShortsPage()) {
    // For Shorts, we'll add it to the player
    menuContainer = document.querySelector('#shorts-player') || 
                    document.querySelector('.shorts-player') ||
                    document.querySelector('#shorts-container') ||
                    document.querySelector('#shorts-inner-buttons') ||
                    document.querySelector('#shorts-actions'); // Modern YT Shorts
    
    // If still not found, try finding the buttons bar
    if (!menuContainer) {
      const actionBars = document.querySelectorAll('.shorts-action-bar, .reel-player-overlay-actions');
      if (actionBars.length > 0) {
        menuContainer = actionBars[0];
      }
    }
    
    console.log("YouTube AI Summary: Shorts page detected");
  } else {
    // For regular videos - try various selectors for different YouTube layouts
    // Try to place the button above the action buttons
    menuContainer = document.querySelector('#above-the-fold') || 
                    document.querySelector('#top-level-buttons-computed') ||
                    document.querySelector('.ytd-watch-metadata') ||
                    document.querySelector('#title h1') ||
                    document.querySelector('.title.ytd-video-primary-info-renderer') ||
                    // Fallbacks to original locations
                    document.querySelector('#above-the-fold #top-row') || 
                    document.querySelector('#top-row') ||
                    document.querySelector('#menu-container #top-row') || 
                    document.querySelector('#menu.ytd-video-primary-info-renderer') ||
                    document.querySelector('ytd-menu-renderer.ytd-watch-metadata') ||
                    document.querySelector('#actions-inner, #actions') ||
                    document.querySelector('.ytd-watch-metadata #actions'); // Modern YT layout
  }
  
  if (!menuContainer) {
    console.warn('YouTube AI Summary: Could not find menu container to add button. Retrying in 2s.');
    setTimeout(addSummarizeButton, 2000); // Retry if container not found initially
    return;
  }
  
  if (document.getElementById('yt-ai-summary-button')) {
    console.log("YouTube AI Summary: Button already exists.");
    updateButtonForPageType(); // Make sure it has the right styling
    return; // Already added
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'yt-ai-summary-container';
  
  // Add shorts class if on shorts page
  if (isShortsPage()) {
    buttonContainer.classList.add('is-shorts');
  }
  
  const summarizeButton = document.createElement('button');
  summarizeButton.id = 'yt-ai-summary-button';
  summarizeButton.className = 'yt-ai-summary-button';
  
  // Different text for regular vs shorts
  if (isShortsPage()) {
    summarizeButton.innerHTML = 'AI';
    summarizeButton.title = 'Summarize with AI';
  } else {
    summarizeButton.innerHTML = 'Summarize with AI';
    summarizeButton.title = 'Summarize this video with AI';
  }
  
  buttonContainer.appendChild(summarizeButton);
  
  const dropdown = document.createElement('div');
  dropdown.className = 'yt-ai-summary-dropdown';
  
  // Get ordered providers with preferred model first
  const orderedProviders = getOrderedProviders();
  
  dropdown.innerHTML = `
    <div class="yt-ai-summary-dropdown-content">
      ${orderedProviders.map(key => `
        <button class="yt-ai-summary-provider-btn" data-provider="${key}">
          ${AI_PROVIDERS[key].name}
        </button>
      `).join('')}
    </div>
  `;
  buttonContainer.appendChild(dropdown);
  menuContainer.appendChild(buttonContainer);
  
  summarizeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (event) => {
    if (!buttonContainer.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  const providerButtons = dropdown.querySelectorAll('.yt-ai-summary-provider-btn');
  providerButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const providerKey = button.getAttribute('data-provider');
      extractAndSummarize(providerKey);
      dropdown.classList.remove('show');
    });
  });
  
  console.log('YouTube AI Summary: AI Summarize button added to page.');
}

async function extractAndSummarize(aiProviderKey) {
  console.log(`YouTube AI Summary: Starting extraction for ${aiProviderKey}`);
  showLoadingIndicator();
  
  try {
    // For both regular videos and shorts
    const videoTitle = document.querySelector('h1.ytd-watch-metadata title')?.textContent?.trim() || 
                       document.querySelector('h1.title yt-formatted-string')?.textContent?.trim() ||
                       document.querySelector('.title.style-scope.ytd-shorts')?.textContent?.trim() ||
                       document.title.replace(" - YouTube", "").replace(" - YouTube Shorts", ""); // Fallback
                       
    const videoUrl = window.location.href;
    
    console.log("YouTube AI Summary: Extracting transcript...");
    const transcript = await extractTranscript();
    
    if (!transcript || transcript.length < 50) { // Check for meaningful transcript
      console.error("YouTube AI Summary: Failed to extract a meaningful transcript.", transcript);
      throw new Error("Couldn't extract transcript or transcript too short. Make sure this video has captions available.");
    }
    console.log(`YouTube AI Summary: Transcript extracted (length: ${transcript.length})`);
    
    const prompt = generateSummaryPrompt(transcript, videoTitle, videoUrl);
    const provider = AI_PROVIDERS[aiProviderKey];
    
    if (!provider) throw new Error("Invalid AI provider key");
    
    // If auto-paste is enabled, store transcript for the AI site to retrieve
    if (appSettings.autoPaste) {
      await chrome.runtime.sendMessage({
        action: 'storeTranscript',
        transcript: prompt,
        aiProvider: aiProviderKey
      });
    }
    
    window.open(provider.url, '_blank');
    
    // Always copy to clipboard as a fallback
    await navigator.clipboard.writeText(prompt);
    
    hideLoadingIndicator();
    showNotification(
      appSettings.autoPaste 
        ? "Transcript extracted! Opening AI chat with auto-paste." 
        : "Transcript extracted and copied to clipboard! Paste it in the AI chat that just opened.", 
      "success"
    );
    
  } catch (error) {
    hideLoadingIndicator();
    console.error("YouTube AI Summary: Error in extractAndSummarize:", error);
    showNotification("Error: " + error.message, "error");
  }
}

function generateSummaryPrompt(transcript, title, url) {
  // Use the custom prompt template if available, otherwise use default
  console.log("Current prompt template:", appSettings.promptTemplate);
  const template = appSettings.promptTemplate || DEFAULT_PROMPT_TEMPLATE;
  
  return template
    .replace(/{title}/g, title)
    .replace(/{url}/g, url)
    .replace(/{transcript}/g, transcript);
}

function showLoadingIndicator() {
  if (document.getElementById('yt-ai-summary-loader')) return;
  const loader = document.createElement('div');
  loader.id = 'yt-ai-summary-loader';
  loader.className = 'yt-ai-summary-loader';
  loader.innerHTML = `
    <div class="yt-ai-summary-loader-content">
      <div class="yt-ai-summary-spinner"></div>
      <p>Extracting transcript...</p>
    </div>
  `;
  document.body.appendChild(loader);
}

function hideLoadingIndicator() {
  const loader = document.getElementById('yt-ai-summary-loader');
  if (loader) loader.remove();
}

function showNotification(message, type = "info") {
  const existingNotification = document.getElementById('yt-ai-summary-notification');
  if (existingNotification) existingNotification.remove();

  const notification = document.createElement('div');
  notification.id = 'yt-ai-summary-notification';
  notification.className = `yt-ai-summary-notification ${type}`;
  notification.innerHTML = `<div class="yt-ai-summary-notification-content"><p>${message}</p></div>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// Get video ID from URL
function getVideoIdFromUrl() {
  const url = new URL(window.location.href);
  if (window.location.pathname.startsWith('/shorts/')) {
    return window.location.pathname.split('/shorts/')[1].split('/')[0];
  }
  return url.searchParams.get('v');
}

// Extract YouTube player response data
function getYoutubePlayerData() {
  try {
    // Try different methods to get player data
    // Method 1: From ytInitialPlayerResponse in window
    if (window.ytInitialPlayerResponse) {
      return window.ytInitialPlayerResponse;
    }
    
    // Method 2: From script tags
    for (const script of document.querySelectorAll('script')) {
      const text = script.textContent;
      if (text && text.includes('ytInitialPlayerResponse')) {
        const match = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match && match[1]) {
          try {
            return JSON.parse(match[1]);
          } catch (e) {
            console.warn('Failed to parse ytInitialPlayerResponse from script');
          }
        }
      }
    }
    
    // Method 3: From window.ytplayer
    if (window.ytplayer && window.ytplayer.config) {
      return window.ytplayer.config.args.player_response;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting player data:', error);
    return null;
  }
}

// Ask background script to fetch transcript
function fetchTranscriptFromBackground(videoId) {
  return new Promise((resolve, reject) => {
    // Get YouTube player data
    const playerResponse = getYoutubePlayerData();
    
    chrome.runtime.sendMessage(
      { 
        action: 'fetchTranscript', 
        videoId,
        playerResponse 
      },
      response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.transcript) {
          resolve(response.transcript);
        } else {
          reject(response?.error || 'Failed to fetch transcript');
        }
      }
    );
  });
}

// Main transcript extraction function
async function extractTranscript() {
  const videoId = getVideoIdFromUrl();
  if (!videoId) return null;
  
  try {
    const transcript = await fetchTranscriptFromBackground(videoId);
    if (transcript && transcript.length > 50) {
      return transcript;
    }
    return null;
  } catch (error) {
    console.error('Error in extractTranscript:', error);
    return null;
  }
}

// Listen for YouTube navigation events (SPA)
window.addEventListener('yt-navigate-finish', () => {
  // Remove old button if present
  const oldBtn = document.getElementById('yt-ai-summary-button');
  if (oldBtn && oldBtn.parentNode && oldBtn.parentNode.parentNode) {
    oldBtn.parentNode.remove();
  }
  
  // Reset button added flag
  buttonAdded = false;
  
  // Re-inject button after navigation
  if (isVideoPage() || isShortsPage()) {
    setTimeout(() => addSummarizeButton(), 1000);
  }
});

// Also listen for URL changes that might not trigger the YouTube event
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    
    // Check if we navigated to a video or shorts page
    if (isVideoPage() || isShortsPage()) {
      buttonAdded = false;
      setTimeout(() => addSummarizeButton(), 1000);
    }
  }
}).observe(document, {subtree: true, childList: true}); 