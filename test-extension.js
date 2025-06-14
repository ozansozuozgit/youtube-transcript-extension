/**
 * YouTube AI Summary Extension - Diagnostic Test Script
 * 
 * Run this in the browser console on a YouTube video page to diagnose issues
 * Copy and paste this entire script into the browser console (F12 -> Console tab)
 */

console.log("🔍 YouTube AI Summary Extension Diagnostic Test");
console.log("=".repeat(50));

// Test 1: Check if we're on a video page
console.log("1. Page Detection:");
const isVideoPage = window.location.pathname === '/watch' && document.getElementById('player');
const isShortsPage = window.location.pathname.startsWith('/shorts/');
console.log(`   Video page: ${isVideoPage}`);
console.log(`   Shorts page: ${isShortsPage}`);
console.log(`   Current URL: ${window.location.href}`);

// Test 2: Check video ID extraction
console.log("\n2. Video ID Extraction:");
function getVideoIdFromUrl() {
  const url = new URL(window.location.href);
  if (window.location.pathname.startsWith('/shorts/')) {
    return window.location.pathname.split('/shorts/')[1].split('/')[0];
  }
  return url.searchParams.get('v');
}
const videoId = getVideoIdFromUrl();
console.log(`   Video ID: ${videoId}`);

// Test 3: Check for YouTube player data
console.log("\n3. YouTube Player Data:");
console.log(`   window.ytInitialPlayerResponse exists: ${!!window.ytInitialPlayerResponse}`);
console.log(`   window.ytplayer exists: ${!!window.ytplayer}`);

// Try to extract player data
let playerData = null;
if (window.ytInitialPlayerResponse) {
  playerData = window.ytInitialPlayerResponse;
  console.log("   ✅ Found ytInitialPlayerResponse in window");
} else {
  // Try script tags
  for (const script of document.querySelectorAll('script')) {
    const text = script.textContent;
    if (text && text.includes('ytInitialPlayerResponse')) {
      const match = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (match && match[1]) {
        try {
          playerData = JSON.parse(match[1]);
          console.log("   ✅ Found ytInitialPlayerResponse in script tag");
          break;
        } catch (e) {
          console.log("   ❌ Failed to parse ytInitialPlayerResponse from script");
        }
      }
    }
  }
}

if (playerData) {
  console.log(`   Player data available: ✅`);
  console.log(`   Video ID in player data: ${playerData.videoDetails?.videoId}`);
  console.log(`   Has captions: ${!!playerData.captions}`);
  
  const captions = playerData.captions;
  const captionsTrack = captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (captionsTrack && captionsTrack.length > 0) {
    console.log(`   Caption tracks found: ${captionsTrack.length}`);
    captionsTrack.forEach((track, index) => {
      console.log(`     Track ${index + 1}: ${track.languageCode} (${track.name?.simpleText || 'No name'})`);
    });
  } else {
    console.log("   ❌ No caption tracks found");
  }
} else {
  console.log("   ❌ No player data found");
}

// Test 4: Check for extension button containers
console.log("\n4. Button Container Detection:");
const containerSelectors = [
  '#above-the-fold',
  '#top-level-buttons-computed',
  '.ytd-watch-metadata',
  '#title h1',
  '#top-row',
  '#actions',
  '.ytd-watch-metadata #actions'
];

containerSelectors.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`   ${selector}: ${element ? '✅ Found' : '❌ Not found'}`);
});

// Test 5: Check video title extraction
console.log("\n5. Video Title Extraction:");
const titleSelectors = [
  'h1.ytd-watch-metadata title',
  'h1.title yt-formatted-string',
  '.title.style-scope.ytd-shorts',
  'h1.ytd-video-primary-info-renderer',
  '.ytd-video-primary-info-renderer h1'
];

let videoTitle = null;
titleSelectors.forEach(selector => {
  const element = document.querySelector(selector);
  const title = element?.textContent?.trim() || element?.innerText?.trim();
  console.log(`   ${selector}: ${title ? `✅ "${title}"` : '❌ Not found'}`);
  if (title && !videoTitle) {
    videoTitle = title;
  }
});

if (!videoTitle) {
  videoTitle = document.title.replace(" - YouTube", "").replace(" - YouTube Shorts", "").trim();
  console.log(`   Fallback (document.title): "${videoTitle}"`);
}

// Test 6: Check Chrome extension APIs
console.log("\n6. Chrome Extension APIs:");
console.log(`   chrome.runtime available: ${!!chrome?.runtime}`);
console.log(`   chrome.storage available: ${!!chrome?.storage}`);

// Test 7: Test transcript URL (if we have player data)
if (playerData && captionsTrack && captionsTrack.length > 0) {
  console.log("\n7. Testing Transcript URL:");
  const captionTrack = captionsTrack.find(track => 
    track.languageCode === 'en' || track.languageCode.startsWith('en')
  ) || captionsTrack[0];
  
  const captionUrl = captionTrack.baseUrl;
  if (captionUrl) {
    const jsonUrl = `${captionUrl}&fmt=json3`;
    console.log(`   Caption URL: ${jsonUrl.substring(0, 100)}...`);
    
    // Test the fetch
    fetch(jsonUrl)
      .then(response => {
        console.log(`   Fetch response status: ${response.status} ${response.statusText}`);
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .then(data => {
        console.log(`   ✅ Transcript fetch successful`);
        console.log(`   Events count: ${data.events?.length || 0}`);
        if (data.events && data.events.length > 0) {
          const transcript = data.events
            .filter(event => event.segs && event.segs.length > 0)
            .map(event => {
              return event.segs
                .map(seg => seg.utf8 || '')
                .join('')
                .trim();
            })
            .filter(line => line)
            .join(' ');
          console.log(`   Processed transcript length: ${transcript.length}`);
          console.log(`   Preview: "${transcript.substring(0, 100)}..."`);
        }
      })
      .catch(error => {
        console.log(`   ❌ Transcript fetch failed: ${error.message}`);
      });
  } else {
    console.log("   ❌ No caption URL found");
  }
}

// Test 8: Check if extension is loaded
console.log("\n8. Extension Status:");
const extensionButton = document.getElementById('yt-ai-summary-button');
console.log(`   Extension button present: ${!!extensionButton}`);

if (extensionButton) {
  console.log("   ✅ Extension appears to be loaded and working");
} else {
  console.log("   ❌ Extension button not found - extension may not be loaded or working");
}

console.log("\n" + "=".repeat(50));
console.log("🏁 Diagnostic test complete!");
console.log("\nIf you see issues above, please share this output for troubleshooting."); 