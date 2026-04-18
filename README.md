# Reading Companion - Chrome Extension

An AI-powered Chrome extension that helps you get more out of English articles on the web.

## Features

### 👨‍🏫 Teacher Mode
- **📌 Key Views & Insights**: Summarizes main arguments, thesis, important facts, and key takeaways
- **✍️ Writing Style Analysis**: Analyzes tone, structure, literary devices, and target audience
- **💡 Powerful Quotes**: Extracts 2-3 most insightful or eloquent quotes from the article
- **📚 Recommended Readings**: Suggests related articles/resources with links and descriptions

### 👨‍🎓 Classmate Mode
- **Interactive Chat**: Discuss the article with an AI companion
- **Smart Q&A**: Ask questions about the content and get intelligent answers
- **Discussion Partner**: Share your thoughts and get thoughtful responses

## Multi-API Support

This extension supports multiple AI providers. You can choose between:

| Provider | Pros | Cons |
|----------|------|------|
| **DeepSeek** | Global access, affordable | China-based company |
| **Google Gemini** | Powerful, free tier available | Requires Google account |

## Installation

### Step 1: Get an API Key

**Option A: DeepSeek**
1. Visit [platform.deepseek.com](https://platform.deepseek.com/)
2. Sign up / Log in
3. Go to API Keys → Create new key
4. Copy the API key

**Option B: Google Gemini**
1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Copy the API key

### Step 2: Load the Extension in Chrome

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable Developer Mode** (toggle in the top right corner)
3. **Click "Load unpacked"** button
4. **Select the `reading-companion` folder** from this project
5. The extension icon should appear in your Chrome toolbar

### Step 3: Configure the Extension

1. **Click the extension icon** in your Chrome toolbar
2. **Select your preferred API provider** (DeepSeek or Gemini)
3. **Enter your API key** in the input field
4. **Click "Save"**
5. **Click "Test Connection"** to verify

## Usage

### Method 1: Click Extension Icon
1. Navigate to any English article in Chrome
2. Click the "Reading Companion" icon in your toolbar
3. The sidebar will appear on the right side

### Method 2: Keyboard Shortcut
- **Ctrl + Shift + R** (Windows/Linux)
- Opens the Reading Companion sidebar

## How It Works

### Teacher Mode
1. Click **"Analyze Article"** button
2. Wait for AI to process the content
3. View:
   - Key arguments and insights
   - Writing style analysis
   - Related topic suggestions

### Classmate Mode
1. Switch to **"Classmate"** tab
2. Type your question or thought
3. Press **Enter** or click **Send**
4. Get intelligent responses about the article

## Files Structure

```
reading-companion/
├── manifest.json          # Extension configuration (Manifest v3)
├── background/
│   └── background.js      # Service worker (API calls)
├── content/
│   └── content.js        # Content script (sidebar)
├── popup/
│   ├── popup.html        # Extension popup UI
│   └── popup.js          # Popup logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/
    └── en/
        └── messages.json # i18n strings
```

## API Configuration

The extension supports the following AI providers:

### DeepSeek
- **Endpoint**: `https://api.deepseek.com/chat/completions`
- **Model**: `deepseek-chat`
- **Pricing**: Affordable with free credits

### Google Gemini
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Model**: `gemini-2.0-flash`
- **Pricing**: Free tier available

## Privacy

- All API calls are made directly between your browser and the selected AI provider
- No data is stored on external servers
- Article content is only sent to the AI for analysis
- API keys are stored locally in your browser

## Troubleshooting

### "API key not configured"
- Make sure you've entered a valid API key for the selected provider
- Click Save after entering the key

### "Network error" or "Failed to fetch"
1. **Test Connection First**
   - Click the 📚 extension icon
   - Click **"Test Connection"**
   - If it fails, check your network

2. **Reload Extension** ⭐ IMPORTANT AFTER UPDATES
   - Go to `chrome://extensions/`
   - Find **Reading Companion**
   - Click the 🔄 **reload** button

3. **Switch Provider**
   - Try switching to a different AI provider
   - Some providers may have network restrictions

### "Unable to extract content"
- Try refreshing the page
- Make sure the article has substantial text content
- Some paywalled sites may not work properly

### Sidebar not appearing
- Check that the extension is enabled in `chrome://extensions/`
- Try clicking the extension icon directly
- Use the keyboard shortcut Ctrl+Shift+R

## License

MIT License
