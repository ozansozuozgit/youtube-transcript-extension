/**
 * YouTube AI Summary - Popup Settings
 */

// Default settings
const DEFAULT_SETTINGS = {
  aiModel: 'chatgpt',
  autoPaste: true,
  darkMode: false,
  language: 'en',
  promptTemplate: `Please summarize the following YouTube video transcript into key points:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
1. A brief overview (2-3 sentences)
2. 5-8 key points or main ideas
3. Any important conclusions or takeaways`
};

// Preset prompt templates
const PRESET_TEMPLATES = {
  summary: `Please summarize the following YouTube video transcript:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
1. A brief overview (2-3 sentences)
2. 5-8 key points or main ideas
3. Important conclusions or takeaways`,

  bullets: `I need a concise bullet-point summary of this YouTube video:

Title: {title}
URL: {url}

TRANSCRIPT:
{transcript}

Please provide:
• A one-sentence overview of what the video is about
• 7-10 bullet points covering the most important information
• Each bullet point should be 1-2 sentences maximum`,

  questions: `Based on this YouTube video transcript, please identify and answer the 5 most important questions someone might have:

Title: {title}
URL: {url}

Transcript:
{transcript}

For each question:
1. State the question clearly
2. Provide a concise answer based on the content
3. Include any relevant details or context`,

  steps: `Extract a step-by-step guide or tutorial from this YouTube video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
1. What task/process this video is teaching
2. A complete numbered list of steps in chronological order
3. Any tools, materials, or prerequisites mentioned
4. Common mistakes to avoid (if mentioned)`,

  study_notes: `Create comprehensive study notes from this educational video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Format as:
1. Main topic and subtopics with clear hierarchical structure
2. Key definitions and concepts with explanations
3. Important formulas, equations, or principles
4. Examples given in the video
5. Visual representations described (if any)`,

  explanation: `Explain complex concepts from this video in simple terms:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please:
1. Identify the most difficult concepts presented
2. Explain each concept using simple analogies and plain language
3. Connect these concepts to real-world applications
4. Address common misconceptions mentioned`,

  timeline: `Create a chronological timeline of events described in this video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Format the timeline as:
- Specific dates/periods mentioned
- Key events in sequential order
- Important figures involved
- Cause and effect relationships between events
- Historical significance of each major event`,

  debate: `Analyze the debate or different perspectives presented in this video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
1. The main question or topic being debated
2. Position A: summarize first perspective with supporting arguments
3. Position B: summarize opposing perspective with supporting arguments
4. Any middle ground or nuanced positions
5. The strongest evidence presented by each side
6. Areas of agreement (if any)`,

  technical: `Extract technical details and specifications from this video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please format as:
1. Technologies/products/systems mentioned
2. Technical specifications and parameters
3. Performance metrics and benchmarks
4. Implementation requirements
5. Limitations and constraints
6. Future developments mentioned`,

  research: `Summarize this research or scientific presentation:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please structure as:
1. Research question or hypothesis
2. Methodology used
3. Key findings and results
4. Statistical significance of results (if mentioned)
5. Limitations of the study
6. Practical implications of the research
7. Future research directions suggested`,

  product_review: `Extract a detailed product review from this video:

Title: {title}
URL: {url}

Transcript:
{transcript}

Please format as:
1. Product name and category
2. Key features and specifications
3. Pros and cons list
4. Performance evaluation
5. Comparisons to alternatives
6. Value for money assessment
7. Final verdict/recommendation`,

  custom: `# Custom Template
  
You can edit this template to create your own custom prompt for AI summarization.

Title: {title}
URL: {url}

Transcript:
{transcript}

Please provide:
[Your custom instructions here]`
};

// DOM Elements
const tabButtons = document.querySelectorAll('nav li');
const tabContents = document.querySelectorAll('.tab-content');
const modelButtons = document.querySelectorAll('.model-btn');
const promptTemplate = document.getElementById('prompt-template');
const presetButtons = document.querySelectorAll('.preset-btn');
const autoPasteToggle = document.getElementById('auto-paste');
const darkModeToggle = document.getElementById('dark-mode');
const languageSelect = document.getElementById('language');
const writeReviewBtn = document.getElementById('write-review');
const helpTips = document.querySelectorAll('.help-tip');

// Current settings
let settings = { ...DEFAULT_SETTINGS };

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initializeUI();
  attachEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const storedSettings = await chrome.storage.sync.get('settings');
    if (storedSettings.settings) {
      settings = { ...DEFAULT_SETTINGS, ...storedSettings.settings };
      console.log("Settings loaded:", settings);
    } else {
      // First time use, save default settings
      await saveSettings();
      console.log("Default settings saved");
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ settings });
    console.log("Settings saved:", settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Initialize UI based on settings
function initializeUI() {
  // Set AI model
  modelButtons.forEach(btn => {
    if (btn.dataset.model === settings.aiModel) {
      btn.classList.add('selected');
    }
  });

  // Set prompt template
  promptTemplate.value = settings.promptTemplate || DEFAULT_SETTINGS.promptTemplate;

  // Set auto-paste
  autoPasteToggle.checked = settings.autoPaste;

  // Set dark mode
  darkModeToggle.checked = settings.darkMode;
  if (settings.darkMode) {
    document.body.classList.add('dark-mode');
  }

  // Set language
  languageSelect.value = settings.language;
}

// Attach event listeners
function attachEventListeners() {
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show active tab content
      tabContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // Model selection
  modelButtons.forEach(button => {
    button.addEventListener('click', () => {
      modelButtons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      
      settings.aiModel = button.dataset.model;
      saveSettings();
    });
  });
  
  // Preset prompt templates
  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const presetKey = button.dataset.preset;
      if (PRESET_TEMPLATES[presetKey]) {
        promptTemplate.value = PRESET_TEMPLATES[presetKey];
        settings.promptTemplate = PRESET_TEMPLATES[presetKey];
        saveSettings();
        
        // Visual feedback
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 300);
      }
    });
  });

  // Prompt template changes
  promptTemplate.addEventListener('input', () => {
    settings.promptTemplate = promptTemplate.value;
  });
  
  // Save on blur (when user clicks away)
  promptTemplate.addEventListener('blur', () => {
    saveSettings();
  });

  // Auto-paste toggle
  autoPasteToggle.addEventListener('change', () => {
    settings.autoPaste = autoPasteToggle.checked;
    saveSettings();
  });

  // Dark mode toggle
  darkModeToggle.addEventListener('change', () => {
    settings.darkMode = darkModeToggle.checked;
    
    if (settings.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    saveSettings();
  });

  // Language selection
  languageSelect.addEventListener('change', () => {
    settings.language = languageSelect.value;
    saveSettings();
  });

  // Help tips tooltips
  helpTips.forEach(tip => {
    tip.addEventListener('mouseenter', (event) => {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = tip.getAttribute('title');
      
      // Position the tooltip
      tooltip.style.position = 'absolute';
      tooltip.style.padding = '6px 10px';
      tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      tooltip.style.color = 'white';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.zIndex = '1000';
      tooltip.style.maxWidth = '200px';
      
      document.body.appendChild(tooltip);
      
      const rect = tip.getBoundingClientRect();
      tooltip.style.left = `${rect.left - (tooltip.offsetWidth / 2) + (tip.offsetWidth / 2)}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
      
      tip.tooltip = tooltip;
    });
    
    tip.addEventListener('mouseleave', () => {
      if (tip.tooltip) {
        tip.tooltip.remove();
        tip.tooltip = null;
      }
    });
  });

  // Write review
  writeReviewBtn.addEventListener('click', () => {
    chrome.tabs.create({ 
      url: 'https://chrome.google.com/webstore/detail/youtube-ai-summary/YOUR_EXTENSION_ID/reviews' 
    });
  });
} 