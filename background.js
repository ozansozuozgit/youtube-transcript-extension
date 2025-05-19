/**
 * YouTube AI Summary - Background Script
 * Handles transcript extraction via youtube video player data
 * and communication between content scripts
 */

// Store transcript data temporarily
let transcriptData = null;
let transcriptTimeout = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchTranscript') {
    // Handle transcript fetching
    getTranscript(message.videoId, message.playerResponse)
      .then(transcript => {
        sendResponse({ transcript });
      })
      .catch(error => {
        console.error('Error fetching transcript:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  // Store transcript data for auto-paste
  if (message.action === 'storeTranscript') {
    // Clear any existing timeout
    if (transcriptTimeout) {
      clearTimeout(transcriptTimeout);
    }
    
    transcriptData = {
      transcript: message.transcript,
      aiProvider: message.aiProvider,
      timestamp: Date.now()
    };
    
    console.log("Transcript stored for provider:", message.aiProvider);
    
    // Set a timeout to clear the data after 5 minutes
    transcriptTimeout = setTimeout(() => {
      transcriptData = null;
      console.log("Transcript data cleared (timeout)");
    }, 5 * 60 * 1000);
    
    sendResponse({ success: true });
    return true;
  }
  
  // Request transcript data for auto-paste
  if (message.action === 'getStoredTranscript') {
    const provider = message.provider;
    // Only send if this is the right provider and we have data
    if (transcriptData && transcriptData.aiProvider === provider) {
      console.log("Transcript retrieved for provider:", provider);
      
      sendResponse({ 
        success: true, 
        transcript: transcriptData.transcript
      });
      
      // Clear after sending
      clearTimeout(transcriptTimeout);
      transcriptData = null;
      console.log("Transcript data cleared after retrieval");
    } else {
      console.log("No transcript available for provider:", provider);
      sendResponse({ success: false });
    }
    return true;
  }
});

// Listen for tab creation to handle auto-paste
chrome.tabs.onCreated.addListener((tab) => {
  // We'll handle further logic in the aiSitesContentScript.js
  // when it loads in the new tab
});

// Main function to get transcript using player data
async function getTranscript(videoId, playerResponseData) {
  try {
    if (!playerResponseData) {
      throw new Error('No player response data provided');
    }
    
    // Parse the player response if it's a string
    const playerResponse = typeof playerResponseData === 'string' 
      ? JSON.parse(playerResponseData) 
      : playerResponseData;
    
    // Extract captions data
    const captions = playerResponse?.captions;
    const captionsTrack = captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionsTrack || captionsTrack.length === 0) {
      throw new Error('No captions available for this video');
    }
    
    // Prefer English captions if available
    let captionTrack = captionsTrack.find(track => 
      track.languageCode === 'en' || 
      track.languageCode.startsWith('en')
    );
    
    // Fallback to first available caption if no English
    if (!captionTrack) {
      captionTrack = captionsTrack[0];
    }
    
    // Get the base URL for the captions
    const captionUrl = captionTrack.baseUrl;
    if (!captionUrl) {
      throw new Error('Caption URL not found');
    }
    
    // Add parameters to get JSON format
    const jsonUrl = `${captionUrl}&fmt=json3`;
    
    // Fetch the captions
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }
    
    const captionData = await response.json();
    
    // Process the caption data into a readable transcript
    return processTranscript(captionData);
  } catch (error) {
    console.error('Error in getTranscript:', error);
    
    // As fallback, try the direct API approach
    return await fallbackTranscriptMethod(videoId);
  }
}

// Process the transcript data into readable text
function processTranscript(data) {
  if (!data || !data.events) {
    return '';
  }
  
  return data.events
    .filter(event => event.segs && event.segs.length > 0)
    .map(event => {
      return event.segs
        .map(seg => seg.utf8 || '')
        .join('')
        .trim();
    })
    .filter(line => line)
    .join(' ');
}

// Fallback method using direct API calls
async function fallbackTranscriptMethod(videoId) {
  try {
    // Try auto-generated captions first
    const asr = await tryFetchTranscript(
      `https://www.youtube.com/api/timedtext?lang=en&type=asr&v=${videoId}&fmt=json3`
    );
    if (asr) return asr;
    
    // Try manual English captions
    const en = await tryFetchTranscript(
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`
    );
    if (en) return en;
    
    // Try any available caption
    const any = await tryFetchTranscript(
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`
    );
    if (any) return any;
    
    return '';
  } catch (e) {
    console.error('Fallback transcript method failed:', e);
    return '';
  }
}

// Helper function to try fetching from a specific URL
async function tryFetchTranscript(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    if (!text || !text.trim()) return null;
    
    try {
      const data = JSON.parse(text);
      return processTranscript(data);
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}