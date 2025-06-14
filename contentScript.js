/**
 * YouTube AI Summary Extension - Content Script
 * Injects summarize button on YouTube video pages and extracts transcripts
 * 
 * Updated: Enhanced DOM detection and error handling for Chrome 137+ compatibility
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

// Enhanced logging for debugging
function debugLog(message, data = null) {
  console.log(`[YT-AI-Summary Content] ${message}`, data || '');
}

// Main function that runs when the script is loaded
(async function() {
  debugLog("Content script loaded");
  await loadSettings();
  
  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.settings) {
      const newSettings = changes.settings.newValue;
      if (newSettings) {
        appSettings = { ...appSettings, ...newSettings };
        debugLog("Settings updated", appSettings);
      }
    }
  });
  
  let buttonAdded = false;
  
  const observer = new MutationObserver(() => {
    // Handle both regular YouTube and YouTube Shorts
    if (!buttonAdded && (isVideoPage() || isShortsPage())) {
      debugLog("Video page detected, adding button");
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
    debugLog("Initial video page detected");
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
  debugLog("Adding summarize button...");
  
  // Different container depending on whether it's a regular video or shorts
  let menuContainer;
  
  if (isShortsPage()) {
    // Enhanced selectors for YouTube Shorts (2024+ layout)
    const shortsSelectors = [
      '#shorts-player',
      '.shorts-player', 
      '#shorts-container',
      '#shorts-inner-buttons',
      '#shorts-actions',
      '.shorts-action-bar',
      '.reel-player-overlay-actions',
      '[id*="shorts"]',
      '.ytd-shorts',
      '#actions.ytd-reel-video-renderer'
    ];
    
    for (const selector of shortsSelectors) {
      menuContainer = document.querySelector(selector);
      if (menuContainer) {
        debugLog(`Found shorts container with selector: ${selector}`);
        break;
      }
    }
    
    debugLog("Shorts page detected");
  } else {
    // Enhanced selectors for regular YouTube videos (2024+ layout)
    const videoSelectors = [
      '#above-the-fold',
      '#top-level-buttons-computed',
      '.ytd-watch-metadata',
      '#title h1',
      '.title.ytd-video-primary-info-renderer',
      '#above-the-fold #top-row',
      '#top-row',
      '#menu-container #top-row',
      '#menu.ytd-video-primary-info-renderer',
      'ytd-menu-renderer.ytd-watch-metadata',
      '#actions-inner',
      '#actions',
      '.ytd-watch-metadata #actions',
      '#owner.ytd-watch-metadata', // Try placing near channel info
      '.ytd-video-primary-info-renderer #container',
      '#info.ytd-watch-flexy' // Modern layout
    ];
    
    for (const selector of videoSelectors) {
      menuContainer = document.querySelector(selector);
      if (menuContainer) {
        debugLog(`Found video container with selector: ${selector}`);
        break;
      }
    }
  }
  
  if (!menuContainer) {
    debugLog('Could not find menu container. Available elements:', {
      hasAboveFold: !!document.querySelector('#above-the-fold'),
      hasTopRow: !!document.querySelector('#top-row'),
      hasActions: !!document.querySelector('#actions'),
      hasWatchMetadata: !!document.querySelector('.ytd-watch-metadata')
    });
    
    // Retry with a longer delay
    setTimeout(() => {
      debugLog('Retrying button placement...');
      addSummarizeButton();
    }, 3000);
    return;
  }
  
  if (document.getElementById('yt-ai-summary-button')) {
    debugLog("Button already exists");
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
  debugLog(`Starting extraction for ${aiProviderKey}`);
  showLoadingIndicator();
  
  try {
    // Enhanced video title extraction with multiple fallbacks
    let videoTitle = null;
    
    // Try multiple selectors for video title (YouTube keeps changing these)
    const titleSelectors = [
      'h1.ytd-watch-metadata title',
      'h1.title yt-formatted-string',
      '.title.style-scope.ytd-shorts',
      'h1.ytd-video-primary-info-renderer',
      '.ytd-video-primary-info-renderer h1',
      'h1[class*="title"]',
      '.watch-title',
      '#title h1',
      '.ytd-shorts-video-title'
    ];
    
    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        videoTitle = element.textContent?.trim() || element.innerText?.trim();
        if (videoTitle) {
          debugLog(`Found video title using selector: ${selector}`, { title: videoTitle });
          break;
        }
      }
    }
    
    // Fallback to document title
    if (!videoTitle) {
      videoTitle = document.title
        .replace(" - YouTube", "")
        .replace(" - YouTube Shorts", "")
        .replace(" | YouTube", "")
        .trim();
      debugLog("Using document title as fallback", { title: videoTitle });
    }
    
    const videoUrl = window.location.href;
    const videoId = getVideoIdFromUrl();
    
    debugLog("Video info extracted", { 
      title: videoTitle, 
      url: videoUrl, 
      videoId: videoId 
    });
    
    debugLog("Extracting transcript...");
    const transcript = await extractTranscript();
    
    if (!transcript || transcript.length < 50) { // Check for meaningful transcript
      debugLog("Failed to extract meaningful transcript", { 
        transcriptLength: transcript?.length || 0,
        transcript: transcript?.substring(0, 100) + '...' 
      });
      throw new Error("Couldn't extract transcript or transcript too short. Make sure this video has captions available.");
    }
    
    debugLog(`Transcript extracted successfully`, { length: transcript.length });
    
    const prompt = generateSummaryPrompt(transcript, videoTitle, videoUrl);
    const provider = AI_PROVIDERS[aiProviderKey];
    
    if (!provider) {
      debugLog("Invalid AI provider key", { aiProviderKey });
      throw new Error("Invalid AI provider key");
    }
    
    debugLog("Generated prompt", { 
      promptLength: prompt.length,
      provider: provider.name,
      autoPaste: appSettings.autoPaste 
    });
    
    // If auto-paste is enabled, store transcript for the AI site to retrieve
    if (appSettings.autoPaste) {
      try {
        await chrome.runtime.sendMessage({
          action: 'storeTranscript',
          transcript: prompt,
          aiProvider: aiProviderKey
        });
        debugLog("Transcript stored for auto-paste");
      } catch (error) {
        debugLog("Failed to store transcript for auto-paste", error.message);
        // Continue anyway, clipboard copy will still work
      }
    }
    
    // Open AI provider URL
    debugLog("Opening AI provider", { url: provider.url });
    window.open(provider.url, '_blank');
    
    // Always copy to clipboard as a fallback
    try {
      await navigator.clipboard.writeText(prompt);
      debugLog("Prompt copied to clipboard");
    } catch (clipboardError) {
      debugLog("Failed to copy to clipboard", clipboardError.message);
      // Try fallback clipboard method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        debugLog("Prompt copied to clipboard using fallback method");
      } catch (fallbackError) {
        debugLog("Fallback clipboard method also failed", fallbackError.message);
      }
    }
    
    hideLoadingIndicator();
    showNotification(
      appSettings.autoPaste 
        ? "Transcript extracted! Opening AI chat with auto-paste." 
        : "Transcript extracted and copied to clipboard! Paste it in the AI chat that just opened.", 
      "success"
    );
    
  } catch (error) {
    hideLoadingIndicator();
    debugLog("Error in extractAndSummarize", error);
    console.error("YouTube AI Summary: Error in extractAndSummarize:", error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('transcript')) {
      errorMessage += "\n\nTroubleshooting tips:\n• Make sure the video has captions/subtitles\n• Try refreshing the page\n• Check if the video is age-restricted or private";
    }
    
    showNotification("Error: " + errorMessage, "error");
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

// Extract YouTube player response data with enhanced methods
function getYoutubePlayerData() {
  try {
    debugLog("Attempting to extract YouTube player data");
    
    // Method 1: From ytInitialPlayerResponse in window
    if (window.ytInitialPlayerResponse) {
      debugLog("Found ytInitialPlayerResponse in window");
      return window.ytInitialPlayerResponse;
    }
    
    // Method 2: From script tags (multiple patterns)
    const scriptPatterns = [
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
      /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/,
      /"ytInitialPlayerResponse":\s*({.+?}),/,
      /ytInitialPlayerResponse":\s*({.+?})(?:,|\})/
    ];
    
    for (const script of document.querySelectorAll('script')) {
      const text = script.textContent;
      if (text && text.includes('ytInitialPlayerResponse')) {
        for (const pattern of scriptPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            try {
              debugLog("Found ytInitialPlayerResponse in script tag");
              return JSON.parse(match[1]);
            } catch (e) {
              debugLog('Failed to parse ytInitialPlayerResponse from script', e.message);
            }
          }
        }
      }
    }
    
    // Method 3: From window.ytplayer (legacy)
    if (window.ytplayer && window.ytplayer.config) {
      debugLog("Found ytplayer config");
      const playerResponse = window.ytplayer.config.args.player_response;
      if (typeof playerResponse === 'string') {
        try {
          return JSON.parse(playerResponse);
        } catch (e) {
          debugLog('Failed to parse ytplayer config', e.message);
        }
      }
      return playerResponse;
    }
    
    // Method 4: Try to get from YouTube's internal API
    if (window.yt && window.yt.config_ && window.yt.config_.EXPERIMENT_FLAGS) {
      debugLog("Attempting to get player data from yt.config_");
      // This is a more advanced method that might work with newer YouTube versions
    }
    
    debugLog("No player data found using any method");
    return null;
  } catch (error) {
    debugLog('Error extracting player data', error.message);
    console.error('Error extracting player data:', error);
    return null;
  }
}

// Clean and optimize transcript text for LLMs
function cleanTranscriptText(transcript) {
  let cleaned = transcript
    // Remove standalone timestamps like "0:10" or "1:23:45"
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')
    // Remove timestamps that might appear in brackets like [00:15]
    .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, '')
    // Remove speaker labels like "Speaker:" or "John:"
    .replace(/\b[A-Z][a-z]+\s*:\s*/g, '')
    // Remove repeated filler words and phrases
    .replace(/\b(um|uh|ah|like|you know|so|well)\b/gi, '')
    // Remove excessive punctuation
    .replace(/[\.]{2,}/g, '.')
    .replace(/[,]{2,}/g, ',')
    // Clean up spacing around punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])\s+/g, '$1 ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();
  
  // Remove duplicate consecutive phrases (common in auto-generated transcripts)
  const words = cleaned.split(' ');
  const deduplicated = [];
  let lastPhrase = '';
  
  for (let i = 0; i < words.length; i++) {
    // Check for 3-word phrases to detect duplicates
    const currentPhrase = words.slice(i, i + 3).join(' ').toLowerCase();
    
    if (currentPhrase !== lastPhrase || currentPhrase.length < 6) {
      deduplicated.push(words[i]);
      if (currentPhrase.length >= 6) {
        lastPhrase = currentPhrase;
      }
    } else {
      // Skip duplicate phrase, but advance the index
      i += 2; // Skip next 2 words as they're part of the duplicate phrase
    }
  }
  
  cleaned = deduplicated.join(' ');
  
  // Just log the length for debugging, but don't truncate
  debugLog(`Final transcript length: ${cleaned.length} characters`);
  
  return cleaned;
}

// Extract transcript directly from page data (workaround for YouTube blocking API calls)
async function extractTranscriptFromPageData(videoId) {
  debugLog("Attempting direct transcript extraction from page data");
  
  try {
    // Check if transcript panel is available
    const transcriptButton = document.querySelector('button[aria-label*="transcript"], button[aria-label*="Transcript"]');
    if (transcriptButton) {
      debugLog("Found transcript button, attempting to click it");
      transcriptButton.click();
      
      // Wait for transcript panel to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to find transcript text
      const transcriptSelectors = [
        '[data-testid="transcript-segment"]',
        '.ytd-transcript-segment-renderer',
        '.segment-text',
        '#transcript [role="button"]',
        'ytd-transcript-segment-renderer .segment-text'
      ];
      
      for (const selector of transcriptSelectors) {
        const segments = document.querySelectorAll(selector);
        if (segments.length > 0) {
          debugLog(`Found transcript segments using selector: ${selector}`, { count: segments.length });
          const transcript = Array.from(segments)
            .map(seg => seg.textContent?.trim())
            .filter(text => text && text.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n+/g, ' ')  // Replace newlines with spaces
            .replace(/\t+/g, ' ')  // Replace tabs with spaces
            .trim();
          
          if (transcript.length > 50) {
            debugLog("Successfully extracted transcript from DOM", { length: transcript.length });
            return cleanTranscriptText(transcript);
          }
        }
      }
    }
    
    debugLog("Could not extract transcript from page data");
    return null;
  } catch (error) {
    debugLog("Error extracting transcript from page data", error.message);
    return null;
  }
}

// Ask background script to fetch transcript
function fetchTranscriptFromBackground(videoId) {
  return new Promise((resolve, reject) => {
    debugLog("Fetching transcript from background", { videoId });
    
    // Get YouTube player data
    const playerResponse = getYoutubePlayerData();
    
    if (!playerResponse) {
      debugLog("No player response data available");
      reject(new Error('No player response data available. Try refreshing the page.'));
      return;
    }
    
    debugLog("Sending transcript request to background", { 
      videoId, 
      hasPlayerResponse: !!playerResponse 
    });
    
    chrome.runtime.sendMessage(
      { 
        action: 'fetchTranscript', 
        videoId,
        playerResponse 
      },
      response => {
        if (chrome.runtime.lastError) {
          debugLog("Chrome runtime error", chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response && response.transcript) {
          debugLog("Transcript received from background", { 
            length: response.transcript.length 
          });
          resolve(response.transcript);
        } else {
          const errorMsg = response?.error || 'Failed to fetch transcript from background';
          debugLog("Background transcript fetch failed", errorMsg);
          reject(new Error(errorMsg));
        }
      }
    );
  });
}

// Main transcript extraction function
async function extractTranscript() {
  const videoId = getVideoIdFromUrl();
  
  debugLog("Starting transcript extraction", { videoId });
  
  if (!videoId) {
    debugLog("No video ID found");
    return null;
  }
  
  // First try direct page data extraction (workaround for YouTube API blocking)
  try {
    debugLog("Trying direct page data extraction first");
    const directTranscript = await extractTranscriptFromPageData(videoId);
    if (directTranscript && directTranscript.length > 50) {
      debugLog("Direct extraction successful", { 
        length: directTranscript.length,
        preview: directTranscript.substring(0, 100) + '...'
      });
      return directTranscript;
    }
  } catch (error) {
    debugLog("Direct extraction failed", error.message);
  }
  
  // Fallback to background script method
  try {
    const transcript = await fetchTranscriptFromBackground(videoId);
    
    if (transcript && transcript.length > 50) {
      debugLog("Background extraction successful", { 
        length: transcript.length,
        preview: transcript.substring(0, 100) + '...'
      });
      return cleanTranscriptText(transcript);
    } else {
      debugLog("Transcript too short or empty", { 
        length: transcript?.length || 0 
      });
      return null;
    }
  } catch (error) {
    debugLog("Error in extractTranscript", error.message);
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