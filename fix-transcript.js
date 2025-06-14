// Quick test script to check if we can fetch transcripts directly
// Run this in the browser console on a YouTube video page

async function testTranscriptFetch() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  console.log('Testing video ID:', videoId);
  
  // Get player data
  const playerData = window.ytInitialPlayerResponse;
  if (!playerData || !playerData.captions) {
    console.error('No captions data found');
    return;
  }
  
  const tracks = playerData.captions.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    console.error('No caption tracks found');
    return;
  }
  
  console.log('Found caption tracks:', tracks.length);
  const track = tracks[0];
  console.log('Using track:', track.languageCode);
  
  // Test different URL formats
  const baseUrl = track.baseUrl;
  const urls = [
    baseUrl,
    `${baseUrl}&fmt=json3`,
    `${baseUrl}&fmt=srv3`,
    `${baseUrl}&fmt=vtt`
  ];
  
  for (const url of urls) {
    console.log('Testing URL:', url);
    try {
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      if (response.ok) {
        const text = await response.text();
        console.log('Response length:', text.length);
        console.log('First 200 chars:', text.substring(0, 200));
        
        // Try to parse
        try {
          const data = JSON.parse(text);
          console.log('✅ Successfully parsed as JSON');
          return data;
        } catch (e) {
          console.log('❌ Not JSON format');
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }
}

// Run the test
testTranscriptFetch();