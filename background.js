/**
 * YouTube AI Summary - Background Script
 * Handles transcript extraction via youtube video player data
 * and communication between content scripts
 * 
 * Updated: Enhanced error handling and debugging for Chrome 137+ compatibility
 */

// Store transcript data temporarily
let transcriptData = null;
let transcriptTimeout = null;

// Enhanced logging for debugging
function debugLog(message, data = null) {
  console.log(`[YT-AI-Summary Background] ${message}`, data || '');
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog(`Received message: ${message.action}`);
  
  if (message.action === 'fetchTranscript') {
    // Handle transcript fetching
    debugLog('Starting transcript fetch', { videoId: message.videoId });
    
    getTranscript(message.videoId, message.playerResponse)
      .then(transcript => {
        debugLog('Transcript fetch successful', { length: transcript?.length || 0 });
        sendResponse({ transcript });
      })
      .catch(error => {
        debugLog('Transcript fetch failed', error);
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
    
    debugLog("Transcript stored for provider:", message.aiProvider);
    
    // Set a timeout to clear the data after 5 minutes
    transcriptTimeout = setTimeout(() => {
      transcriptData = null;
      debugLog("Transcript data cleared (timeout)");
    }, 5 * 60 * 1000);
    
    sendResponse({ success: true });
    return true;
  }
  
  // Request transcript data for auto-paste
  if (message.action === 'getStoredTranscript') {
    const provider = message.provider;
    // Only send if this is the right provider and we have data
    if (transcriptData && transcriptData.aiProvider === provider) {
      debugLog("Transcript retrieved for provider:", provider);
      
      sendResponse({ 
        success: true, 
        transcript: transcriptData.transcript
      });
      
      // Clear after sending
      clearTimeout(transcriptTimeout);
      transcriptData = null;
      debugLog("Transcript data cleared after retrieval");
    } else {
      debugLog("No transcript available for provider:", provider);
      sendResponse({ success: false });
    }
    return true;
  }
});

// Listen for tab creation to handle auto-paste
chrome.tabs.onCreated.addListener((tab) => {
  // We'll handle further logic in the aiSitesContentScript.js
  // when it loads in the new tab
  debugLog('New tab created', { url: tab.url });
});

// Main function to get transcript using player data
async function getTranscript(videoId, playerResponseData) {
  try {
    debugLog('Getting transcript', { videoId, hasPlayerData: !!playerResponseData });
    
    if (!playerResponseData) {
      throw new Error('No player response data provided');
    }
    
    // Parse the player response if it's a string
    const playerResponse = typeof playerResponseData === 'string' 
      ? JSON.parse(playerResponseData) 
      : playerResponseData;
    
    debugLog('Player response parsed', { 
      hasCaptions: !!playerResponse?.captions,
      videoId: playerResponse?.videoDetails?.videoId 
    });
    
    // Extract captions data
    const captions = playerResponse?.captions;
    const captionsTrack = captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionsTrack || captionsTrack.length === 0) {
      debugLog('No captions found in player response');
      throw new Error('No captions available for this video');
    }
    
    debugLog('Found caption tracks', { count: captionsTrack.length });
    
    // Prefer English captions if available
    let captionTrack = captionsTrack.find(track => 
      track.languageCode === 'en' || 
      track.languageCode.startsWith('en')
    );
    
    // Fallback to first available caption if no English
    if (!captionTrack) {
      captionTrack = captionsTrack[0];
    }
    
    debugLog('Selected caption track', { 
      language: captionTrack.languageCode,
      hasBaseUrl: !!captionTrack.baseUrl 
    });
    
    // Get the base URL for the captions
    const captionUrl = captionTrack.baseUrl;
    if (!captionUrl) {
      throw new Error('Caption URL not found');
    }
    
    // Try multiple format approaches due to recent YouTube API changes
    // Remove problematic parameters that might cause CORS issues
    const cleanUrl = captionUrl
      .replace(/&variant=punctuated/g, '')
      .replace(/&opi=\d+/g, '')
      .replace(/&xoaf=\d+/g, '');
    
    const urlsToTry = [
      `${cleanUrl}&fmt=json3`,  // JSON3 format (primary)
      `${cleanUrl}&fmt=srv3`,   // SRV3 format (alternative)
      `${cleanUrl}&fmt=vtt`,    // VTT format (fallback)
      cleanUrl                  // Original URL without format param
    ];
    
    for (const jsonUrl of urlsToTry) {
      debugLog('Fetching captions from URL', { url: jsonUrl.substring(0, 100) + '...' });
      
      try {
        // Fetch the captions with better error handling
        const response = await fetch(jsonUrl, {
          method: 'GET',
          credentials: 'omit',  // Don't send cookies
          mode: 'cors',
          headers: {
            'Accept': 'application/json, text/vtt, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          debugLog('Caption fetch failed', { 
            url: jsonUrl.substring(0, 50) + '...', 
            status: response.status, 
            statusText: response.statusText 
          });
          continue; // Try next URL
        }
        
        const text = await response.text();
        debugLog('Caption response received', { 
          length: text.length,
          contentType: response.headers.get('content-type'),
          preview: text.substring(0, 100) + '...'
        });
        
        if (!text || text.trim().length === 0) {
          debugLog('Empty caption response');
          continue; // Try next URL
        }
        
        // Try to parse as JSON first
        let captionData;
        try {
          captionData = JSON.parse(text);
          debugLog('Successfully parsed as JSON');
        } catch (jsonError) {
          debugLog('Not valid JSON, trying to parse as VTT or other format');
          
          // If it's VTT format, convert it
          if (text.includes('WEBVTT') || text.includes('-->')) {
            captionData = parseVTTFormat(text);
            debugLog('Parsed as VTT format');
          } else {
            debugLog('Unknown format, skipping', { preview: text.substring(0, 200) });
            continue; // Try next URL
          }
        }
        
        // Process the caption data into a readable transcript
        const transcript = processTranscript(captionData);
        
        if (transcript && transcript.length > 0) {
          debugLog('Transcript processed successfully', { length: transcript.length });
          return transcript;
        } else {
          debugLog('No valid transcript content found');
          continue; // Try next URL
        }
        
      } catch (fetchError) {
        debugLog('Fetch error for URL', { 
          url: jsonUrl.substring(0, 50) + '...', 
          error: fetchError.message 
        });
        continue; // Try next URL
      }
    }
    
    // If all caption URLs failed, throw error to trigger fallback
    throw new Error('All caption URL formats failed');
    
  } catch (error) {
    debugLog('Error in getTranscript, trying fallback', error.message);
    console.error('Error in getTranscript:', error);
    
    // As fallback, try the direct API approach
    return await fallbackTranscriptMethod(videoId);
  }
}

// Helper function to parse VTT format captions
function parseVTTFormat(vttText) {
  try {
    const lines = vttText.split('\n');
    const events = [];
    
    let currentEvent = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and WEBVTT header
      if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
        continue;
      }
      
      // Check if this is a timestamp line (contains -->)
      if (line.includes('-->')) {
        currentEvent = { segs: [] };
        continue;
      }
      
      // If we have a current event and this is text content
      if (currentEvent && line && !line.includes('-->')) {
        // Remove HTML tags and add to segments
        const cleanText = line.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          currentEvent.segs.push({ utf8: cleanText });
        }
      }
      
      // If we hit an empty line or end, save the current event
      if ((!line || i === lines.length - 1) && currentEvent && currentEvent.segs.length > 0) {
        events.push(currentEvent);
        currentEvent = null;
      }
    }
    
    return { events };
  } catch (error) {
    debugLog('Error parsing VTT format', error.message);
    return null;
  }
}

// Process the transcript data into readable text
function processTranscript(data) {
  if (!data) {
    debugLog('No data provided to processTranscript');
    return '';
  }
  
  if (!data.events || !Array.isArray(data.events)) {
    debugLog('No events array in transcript data', { 
      hasEvents: !!data.events, 
      isArray: Array.isArray(data.events),
      dataKeys: Object.keys(data)
    });
    return '';
  }
  
  try {
    const transcript = data.events
      .filter(event => {
        // Filter out events without segments
        if (!event || !event.segs || !Array.isArray(event.segs)) {
          return false;
        }
        // Filter out empty segments
        return event.segs.some(seg => seg && seg.utf8 && seg.utf8.trim());
      })
      .map(event => {
        return event.segs
          .map(seg => {
            if (!seg || !seg.utf8) return '';
            // Clean up the text - remove extra whitespace and newlines
            return seg.utf8.replace(/\s+/g, ' ').trim();
          })
          .filter(text => text.length > 0)
          .join('');
      })
      .filter(line => line && line.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim();
      
    debugLog('Transcript processing complete', { 
      eventCount: data.events.length,
      finalLength: transcript.length,
      preview: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : '')
    });
    
    return transcript;
  } catch (error) {
    debugLog('Error processing transcript', error.message);
    return '';
  }
}

// Fallback method using direct API calls
async function fallbackTranscriptMethod(videoId) {
  debugLog('Using fallback transcript method', { videoId });
  
  try {
    // Updated YouTube caption API endpoints with multiple attempts
    const fallbackUrls = [
      // Modern YouTube caption API endpoints
      `https://www.youtube.com/api/timedtext?lang=en&type=asr&v=${videoId}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`,
      // VTT format fallbacks
      `https://www.youtube.com/api/timedtext?lang=en&type=asr&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=vtt`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=vtt`,
      // Plain text fallbacks
      `https://www.youtube.com/api/timedtext?lang=en&type=asr&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?v=${videoId}`
    ];
    
    for (const url of fallbackUrls) {
      debugLog('Trying fallback URL', { url: url.substring(0, 80) + '...' });
      
      const transcript = await tryFetchTranscript(url);
      if (transcript && transcript.length > 50) {
        debugLog('Fallback method successful', { 
          url: url.substring(0, 50) + '...', 
          length: transcript.length 
        });
        return transcript;
      }
    }
    
    debugLog('All fallback methods failed');
    return '';
  } catch (e) {
    debugLog('Fallback transcript method failed', e.message);
    console.error('Fallback transcript method failed:', e);
    return '';
  }
}

// Helper function to try fetching from a specific URL
async function tryFetchTranscript(url) {
  try {
    debugLog('Trying transcript URL', { url: url.substring(0, 80) + '...' });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',  // Don't send cookies
      mode: 'cors',
      headers: {
        'Accept': 'application/json, text/vtt, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      debugLog('Transcript URL failed', { status: response.status });
      return null;
    }
    
    const text = await response.text();
    
    if (!text || !text.trim()) {
      debugLog('Empty response from transcript URL');
      return null;
    }
    
    debugLog('Response received', { 
      length: text.length, 
      contentType: response.headers.get('content-type'),
      preview: text.substring(0, 100) + '...'
    });
    
    // Try to process the response based on format
    let data;
    try {
      // Try JSON first
      data = JSON.parse(text);
      debugLog('Successfully parsed as JSON');
    } catch (jsonError) {
      // Try VTT format
      if (text.includes('WEBVTT') || text.includes('-->')) {
        data = parseVTTFormat(text);
        debugLog('Parsed as VTT format');
      } else {
        debugLog('Unknown format in fallback', { preview: text.substring(0, 200) });
        return null;
      }
    }
    
    if (data) {
      const transcript = processTranscript(data);
      debugLog('Transcript URL successful', { length: transcript.length });
      return transcript;
    }
    
    return null;
  } catch (e) {
    debugLog('Transcript URL request failed', e.message);
    return null;
  }
}