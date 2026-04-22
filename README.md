# Reading Companion V2

AI-powered reading companion with selective analysis and section anchor jumping.

## Version 2.1.3 - Better Error Handling & Debug Logging

### What's Fixed

1. **Structure Overview now outputs EXACTLY 5 sections**

2. **STRICT constraints added:**
   - "CRITICAL REQUIREMENT: You MUST divide this article into EXACTLY FIVE (5) distinct sections"
   - No generic titles (Introduction, Conclusion, etc.)
   - Each section gets equal depth (3-5 sentences + "Why Here")
   - No references to "final section" or "last part"

3. **Increased max_tokens from 8000 to 15000** for long articles

## Features

### Teacher Mode
- **Key Views & Insights**: Core thesis and main arguments
- **Structure Overview (5 Sections)**: Narrative cartography with:
  - Exactly 5 distinct sections (STRICT)
  - Unique descriptive titles
  - 3-5 sentence summaries per section
  - "Why Here" explanations
  - Equal weight to all sections
- **Powerful Quotes**: Memorable passages
- **Recommended Readings**: Related articles

### Classmate Mode
- Chat about the article with AI

### Section Anchor Jump
Click any heading in the Structure Overview to jump to that section

## Usage

### Installation

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `reading-companion-v2` folder

### Setup API Key

1. Click the extension icon
2. Choose provider (DeepSeek or Gemini)
3. Enter your API key
4. Click **Save** or **Test** first

### Analyze an Article

1. Open any article in your browser
2. Click extension icon → **Open Reading Companion**
3. Configure toggles:
   - ☐ Key views & insights
   - ☐ Structure overview (5 sections)
   - ☐ Recommended readings
4. Click **Analyze Article**

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+R` | Toggle sidebar |

## Files

```
reading-companion-v2/
├── manifest.json
├── README.md
├── _locales/
│   └── en/
│       └── messages.json
├── background/
│   └── background.js
├── content/
│   └── content.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.html
    └── popup.js
```

## Changelog

### v2.1.3
- Added detailed console logging for debugging API responses
- Better error handling for invalid API responses
- Handles both DeepSeek and Gemini response formats
- Console logs show full response for debugging

### v2.1.2
- STRICT 5-section prompt with critical requirements
- Increased max_tokens to 15000 for long articles
- No generic titles allowed
- Equal depth for all 5 sections

### v2.1.1
- Fixed feature toggles not working
- Fixed Structure Overview parsing

### v2.1.0
- Complete rebuild based on V1
- New Senior Editor prompt for Structure Overview
- Increased content limit to 40,000 chars

### v2.0.0
- Initial V2 with section anchor jumping
