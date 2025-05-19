#!/bin/bash

# YouTube AI Summary Extension Installer
# This script helps install the extension in Chrome/Chromium browsers

echo "=== YouTube AI Summary Extension Installer ==="
echo "This script will help you install the YouTube AI Summary extension."
echo ""

# Check if we're in the extension directory
if [ ! -f "manifest.json" ]; then
  echo "Error: manifest.json not found. Please run this script from the extension directory."
  exit 1
fi

# Get absolute path
EXTENSION_PATH=$(pwd)

echo "Extension found at: $EXTENSION_PATH"
echo ""
echo "=== Installation Instructions ==="
echo "1. Open Chrome/Chromium browser"
echo "2. Navigate to chrome://extensions/"
echo "3. Enable 'Developer mode' (toggle in the top right)"
echo "4. Click 'Load unpacked'"
echo "5. Select this folder: $EXTENSION_PATH"
echo ""
echo "=== After Installation ==="
echo "1. Visit any YouTube video or Shorts"
echo "2. Look for the 'Summarize with AI' button next to share/save buttons"
echo "3. Click it and select your preferred AI model"
echo "4. A new tab will open with your chosen AI chatbot and the transcript ready to paste"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "Would you like to open Chrome to the extensions page now? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    open -a "Google Chrome" "chrome://extensions/"
    echo "Chrome should be opening to the extensions page. Complete steps 3-5 from above."
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  echo "Would you like to open Chrome to the extensions page now? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if command -v google-chrome &> /dev/null; then
      google-chrome "chrome://extensions/"
      echo "Chrome should be opening to the extensions page. Complete steps 3-5 from above."
    elif command -v chromium-browser &> /dev/null; then
      chromium-browser "chrome://extensions/"
      echo "Chromium should be opening to the extensions page. Complete steps 3-5 from above."
    else
      echo "Chrome/Chromium not found. Please open Chrome manually and follow steps 2-5."
    fi
  fi
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
  # Windows
  echo "Would you like to open Chrome to the extensions page now? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    start chrome "chrome://extensions/"
    echo "Chrome should be opening to the extensions page. Complete steps 3-5 from above."
  fi
fi

echo ""
echo "For more information, please refer to README.md"
echo "=== Installation help complete ===" 