# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest V3) that extracts YouTube video transcripts and sends them to AI chatbots (ChatGPT, Claude, Gemini, DeepSeek) for summarization. The extension operates entirely client-side without external servers.

## Development Commands

### Installation and Testing
```bash
# Install the extension in Chrome
./install.sh

# Test the extension (run in browser console on YouTube video page)
# Copy and paste the entire contents of test-extension.js

# Reload extension during development (run in browser console)
# Copy and paste reload-extension.js, then run: reloadExtension()
```

### Development Workflow
1. Make code changes to JavaScript/CSS files
2. Go to chrome://extensions/ and click reload on the extension
3. Refresh the YouTube page to test changes
4. Use browser console for debugging

## Architecture Overview

### Core Extension Files
- **manifest.json**: Chrome extension manifest v3 configuration
- **background.js**: Service worker handling transcript extraction via YouTube's player API
- **contentScript.js**: Injects "Summarize with AI" button into YouTube pages
- **aiSitesContentScript.js**: Auto-pastes transcripts into AI provider interfaces

### Message Flow
1. User clicks "Summarize with AI" button (contentScript.js)
2. Content script sends message to background.js with video data
3. Background script extracts transcript URLs from ytInitialPlayerResponse
4. Background script fetches and parses transcript (JSON3 or VTT format)
5. New tab opens with AI provider site
6. aiSitesContentScript.js auto-pastes transcript into chat interface

### Key Technical Patterns

**Transcript Extraction**: Multiple fallback methods to handle YouTube API changes
- Primary: Extract from ytInitialPlayerResponse.captions
- Fallbacks: Different API endpoints (json3, srv3, vtt formats)

**DOM Interaction**: Robust element selection with retry logic
- Mutation observers for dynamic content
- Site-specific selectors for each AI provider
- Exponential backoff for element detection

**Error Handling**: Comprehensive error reporting and user feedback
- Try-catch blocks with specific error messages
- Console logging for debugging
- User-friendly notifications for common issues

## Key Implementation Details

### YouTube Integration Points
- Video detection: Check URL patterns and DOM elements
- Button injection: Find share/save button containers
- Player data: Extract from window.ytInitialPlayerResponse
- Transcript URLs: Parse from captions.playerCaptionsTracklistRenderer

### AI Provider Integration
Each provider has specific selectors in aiSitesContentScript.js:
- ChatGPT: `#prompt-textarea`
- Claude: `[contenteditable="true"]`
- Gemini: `.ql-editor`
- DeepSeek: `textarea[placeholder*="Message"]`

### Chrome Storage Keys
- `defaultAI`: User's preferred AI provider
- `autoPaste`: Enable/disable auto-paste feature
- `promptTemplate`: Custom prompt template
- `language`: Prompt language preference
- `theme`: Light/dark mode preference