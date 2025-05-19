Project Description: Free YouTube AI Summary Chrome Extension
Overview:
A free and privacy-friendly Chrome extension that lets users instantly summarize YouTube videos using leading AI chatbots (ChatGPT, Claude, Gemini, DeepSeek, and more). The extension injects a “Summarize” button onto YouTube, extracts the video transcript, and opens your chosen AI chatbot’s web interface with the transcript and a smart summary prompt—no API keys, no cost, no servers.

Key Features
Instant Summaries: Add a “Summarize” button to YouTube video pages for one-click summaries.

Multiple AI Models: Support for ChatGPT, Claude, Gemini, DeepSeek, and more via their web UIs.

Automatic Transcript Extraction: Grabs the video’s transcript (if available), title, and URL.

Smart Prompt Templates: Generates clear, customizable summary prompts.

Auto-Paste/Send: Attempts to fill in and (where possible) auto-submit to the selected chatbot.

Customizable UI: Sidebar or popup for selecting AI models and tweaking prompt language/settings.

Free and Private: No API keys or third-party servers—everything happens in your browser.

Tech Stack / Technologies Used
Chrome Extension Platform (Manifest V3)

Permissions: "activeTab", "scripting", "tabs", "storage"

JavaScript (ES6+) for all extension logic

HTML/CSS (possibly Tailwind or Sass) for UI components

Content Scripts

For injecting UI and extracting transcripts from YouTube pages

Background Service Worker

For managing tab creation, messaging, and communication between scripts

Popup/Sidebar UI

Modern, minimal UI using HTML/CSS, optionally a lightweight framework like Preact for reactivity

chrome.storage API

To save user settings, custom prompts, preferred AI, etc.

Optional Enhancements
Clipboard Fallback: If input can’t be auto-filled, copy prompt to clipboard and instruct user to paste.

Light/Dark Mode: Toggle theme for better UX.

Localization: Add i18n support for prompt language.

Folder Structure (Example)
css
Copy
Edit
youtube-ai-summary/
│
├── manifest.json
├── background.js
├── contentScript.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── sidebar/ (optional, for in-page sidebar UI)
│   ├── sidebar.html
│   ├── sidebar.js
│   └── sidebar.css
├── assets/
│   └── icon.png
├── utils/
│   └── transcriptExtractor.js
└── README.md
How It Works
User visits a YouTube video.

Content script injects a “Summarize” button onto the video page.

When clicked, a sidebar/popup appears to select your preferred AI chatbot.

Transcript, title, and URL are extracted from the YouTube DOM.

Prompt is constructed (e.g., “Summarize the following transcript in 5-10 bullet points…”).

Extension opens the chosen AI chatbot’s web interface in a new tab, and attempts to auto-paste (and submit) the prompt.

User receives their summary—free and private.

Why This Tech Stack?
Manifest V3: Required for Chrome Web Store, offers better performance and security.

Plain JavaScript/HTML/CSS: Lightweight, no build step needed, easy to audit and extend.

No Back End or API Costs: All logic stays client-side, making the extension forever free.

Good UX: Minimal, fast, and privacy-friendly.

Summary
YouTube AI Summary is a lightweight, open-source Chrome extension that supercharges your YouTube learning by letting you summarize any video—instantly, privately, and for free—using today’s best AI chatbots.