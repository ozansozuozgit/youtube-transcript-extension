# YouTube AI Summary Extension - Troubleshooting Guide

## Quick Fix for June 2025 Issues

Your extension is **already using Manifest V3**, so the Chrome Manifest V2 phase-out is not the cause of your issues. Here are the most likely causes and solutions:

## 🔧 Immediate Steps to Try

### 1. Check Extension Status
1. Open Chrome Extensions page: `chrome://extensions/`
2. Find "YouTube AI Summary" extension
3. Make sure it's **enabled** (toggle should be blue)
4. If it was disabled, re-enable it
5. Try refreshing a YouTube video page

### 2. Clear Extension Data
1. Go to `chrome://extensions/`
2. Click "Details" on your extension
3. Scroll down and click "Extension options" (if available)
4. Or try removing and re-installing the extension

### 3. Test with Diagnostic Script
1. Go to any YouTube video with captions/subtitles
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the entire content of `test-extension.js` 
5. Press Enter to run the diagnostic
6. Share the output if you need help

## 🐛 Common Issues and Solutions

### Issue: Extension button not appearing
**Possible causes:**
- YouTube changed their DOM structure
- Extension was disabled by Chrome
- Content script failed to load

**Solutions:**
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check if extension is enabled in `chrome://extensions/`
3. Try on a different YouTube video
4. Run the diagnostic script to see what's failing

### Issue: "No captions available" error
**Possible causes:**
- Video doesn't have captions/subtitles
- YouTube changed their caption API
- Network/CORS issues

**Solutions:**
1. Make sure the video has captions (look for CC button on video player)
2. Try a different video that definitely has captions
3. Check browser console for error messages
4. Try refreshing the page

### Issue: Extension loads but transcript extraction fails
**Possible causes:**
- YouTube changed their internal API structure
- Player data extraction is failing
- Network issues

**Solutions:**
1. Run the diagnostic script to identify the specific failure point
2. Check browser console for detailed error messages
3. Try on multiple different videos
4. Clear browser cache and cookies for YouTube

## 🔍 Advanced Debugging

### Enable Debug Logging
The extension now includes enhanced debug logging. To see detailed logs:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for messages starting with `[YT-AI-Summary Background]` and `[YT-AI-Summary Content]`
4. These will show exactly what's happening during transcript extraction

### Check Network Requests
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try extracting a transcript
4. Look for failed requests to YouTube's caption APIs
5. Check if any requests are being blocked

### Test Different Video Types
Try the extension on:
- Regular YouTube videos with manual captions
- Videos with auto-generated captions
- YouTube Shorts
- Different languages/regions

## 🚨 Known Issues

### YouTube DOM Changes
YouTube frequently updates their website structure, which can break DOM selectors. The extension has been updated with multiple fallback selectors, but new changes might still cause issues.

### Chrome Security Updates
Chrome 137+ has stricter security policies that might affect:
- Cross-origin requests
- Content script injection
- Clipboard access

## 📞 Getting Help

If the extension is still not working:

1. **Run the diagnostic script** and share the output
2. **Check the browser console** for error messages
3. **Try on multiple videos** to see if it's video-specific
4. **Note your Chrome version**: `chrome://version/`
5. **Note your OS**: Windows/Mac/Linux

## 🔄 Manual Transcript Extraction (Fallback)

If the extension completely fails, you can manually extract transcripts:

1. Open a YouTube video with captions
2. Click the three dots (...) below the video
3. Click "Open transcript"
4. Copy the transcript text manually
5. Paste it into your preferred AI chat

## 📝 Recent Updates (January 2025)

The extension has been enhanced with:
- ✅ Better error handling and debugging
- ✅ Multiple fallback methods for DOM detection
- ✅ Enhanced YouTube player data extraction
- ✅ Improved compatibility with Chrome 137+
- ✅ More robust transcript URL handling
- ✅ Better clipboard fallback methods

Your extension should now be more reliable and provide better error messages when issues occur. 