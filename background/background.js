// Reading Companion - Background Script (Service Worker)
// Handles API calls and message routing

// DeepSeek API Configuration
const DEEPSEEK_CONFIG = {
  baseUrl: 'https://api.deepseek.com'
};

// Gemini API Configuration
const GEMINI_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
};

// DeepSeek API Call
async function callDeepSeekAPI(apiKey, model, messages, temperature, max_tokens) {
  const url = `${DEEPSEEK_CONFIG.baseUrl}/chat/completions`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 4000
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

// Gemini API Call
async function callGeminiAPI(apiKey, model, messages, temperature, max_tokens) {
  // Extract the last user message for Gemini
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const systemMessage = messages.filter(m => m.role === 'system').map(m => m.content).join('\n') || '';
  
  const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
  
  // Use the model specified (default to gemini-2.0-flash-exp)
  const selectedModel = model || 'gemini-2.0-flash-exp';
  const url = `${GEMINI_CONFIG.baseUrl}/${selectedModel}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: max_tokens || 4096
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Convert Gemini response to OpenAI-like format
  return {
    choices: [{
      message: {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
      }
    }]
  };
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request)
    .then(response => sendResponse({ success: true, data: response }))
    .catch(error => sendResponse({ success: false, error: error.message }));
  
  return true; // Keep message channel open for async response
});

async function handleMessage(request) {
  const { type, data } = request;
  
  if (type === 'CALL_DEEPSEEK') {
    return await callDeepSeekAPI(
      data.glmApiKey,
      data.model,
      data.messages,
      data.temperature,
      data.max_tokens
    );
  }
  
  if (type === 'CALL_GEMINI') {
    // Get the saved Gemini model from storage
    const stored = await chrome.storage.local.get(['geminiModel']);
    const model = stored.geminiModel || 'gemini-2.5-flash';
    
    return await callGeminiAPI(
      data.glmApiKey,
      model,
      data.messages,
      data.temperature,
      data.max_tokens
    );
  }
  
  throw new Error(`Unknown message type: ${type}`);
}

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Reading Companion installed/updated:', details.reason);
});
