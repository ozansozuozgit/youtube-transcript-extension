# YouTube AI Summary

A free and privacy-friendly Chrome extension that lets you instantly summarize YouTube videos using your preferred AI chatbot.

## Features

- 🎯 **Instant Access**: Adds a "Summarize with AI" button to YouTube video pages
- 🧠 **Multiple AI Options**: Support for ChatGPT, Claude, Gemini, DeepSeek and more
- 📝 **Automatic Transcript Extraction**: Grabs the video's transcript directly from YouTube
- 🔄 **Auto-Paste**: Automatically pastes transcript into AI chat interfaces
- 🔒 **Free & Private**: No API keys or third-party servers—everything happens in your browser
- ⚙️ **Customizable Settings**: Personalize your AI model, prompt template, and more

## How It Works

1. Visit any YouTube video with captions
2. Click the "Summarize with AI" button added by the extension
3. Select your preferred AI chatbot (ChatGPT, Claude, Gemini, etc.)
4. The extension extracts the transcript and opens your chosen AI in a new tab
5. The transcript is automatically pasted into the AI chat interface (or copied to clipboard as fallback)
6. Get your video summary instantly!

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the downloaded folder
5. The extension will now be installed and ready to use

## Settings

Click the extension icon in your toolbar to access settings:

- **AI Models**: Choose your default AI provider
- **Auto-Paste**: Enable/disable automatic pasting into AI interfaces
- **Custom Prompts**: Customize the summary prompt template
- **Language**: Change the prompt language (English, Spanish, French, German)
- **Theme**: Toggle between light and dark mode

## Testing the Extension

1. After installing, navigate to any YouTube video with captions (e.g., educational videos, lectures, tutorials)
2. Look for the "🤖 Summarize with AI" button next to the share/save buttons
3. Click it and select your preferred AI model
4. A new tab will open with the AI service, and the prompt will be copied to your clipboard
5. Paste the prompt (Ctrl/Cmd+V) into the AI chat interface

## Technical Implementation

The extension uses a two-part approach to extract YouTube transcripts:

1. **Primary Method**: Extracts the transcript URLs directly from YouTube's player response data
2. **Fallback Method**: Uses YouTube's caption API endpoints with multiple language fallbacks

For auto-pasting, the extension:
1. Detects which AI provider website is open
2. Uses site-specific selectors to locate the input field
3. Automatically pastes the transcript and optionally submits the form

## Privacy

This extension:
- Does NOT collect or store any user data
- Does NOT require any API keys or accounts
- Works entirely locally in your browser
- Only accesses the YouTube page you're currently viewing
- Settings are stored locally in your browser

## Permissions

- `activeTab`: To access the current YouTube page
- `storage`: To store your preferences
- `clipboardWrite`: To copy the transcript prompt to your clipboard
- Host permissions: To auto-paste into AI chat interfaces

## Troubleshooting

- **Button not appearing?** Refresh the YouTube page or check if you're on a video page
- **Can't extract transcript?** Make sure the video has captions available
- **No captions available?** Unfortunately, some videos don't have captions or transcripts
- **Auto-paste not working?** Try disabling it in settings and use the clipboard fallback instead
- **Extension showing an error?** Check the browser console for detailed error messages

## License

MIT License - see LICENSE file for details. 