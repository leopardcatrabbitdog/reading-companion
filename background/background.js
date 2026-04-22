// Reading Companion V2 - Background Script (Service Worker)
// Based on V1 with increased max_tokens for long articles

// DeepSeek API Configuration
const DEEPSEEK_CONFIG = {
  baseUrl: 'https://api.deepseek.com'
};

// DeepSeek available models
const DEEPSEEK_MODELS = [
  { value: 'deepseek-chat', label: 'DeepSeek V3 (Chat)' },
  { value: 'deepseek-reasoner', label: 'DeepSeek o1 (Reasoner)' }
];

// Gemini API Configuration
const GEMINI_CONFIG = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
};

// DeepSeek API Call - V2: improved error handling and model support
async function callDeepSeekAPI(apiKey, model, messages, temperature, max_tokens) {
  const url = `${DEEPSEEK_CONFIG.baseUrl}/chat/completions`;
  
  // Use provided model or default to deepseek-chat
  const selectedModel = model || 'deepseek-chat';
  
  // Note: deepseek-reasoner (o1) doesn't support temperature parameter
  const requestBody = {
    model: selectedModel,
    messages: messages,
    max_tokens: max_tokens || 8000
  };
  
  // Only add temperature for non-reasoner models
  if (!selectedModel.includes('reasoner')) {
    requestBody.temperature = temperature || 0.7;
  }
  
  console.log('[RC V2] DeepSeek API call:', { model: selectedModel, messageCount: messages.length });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[RC V2] DeepSeek API error:', response.status, errorText);
    
    // Parse error for better messages
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error && errorJson.error.message) {
        throw new Error(errorJson.error.message);
      }
    } catch (e) {
      // If parsing failed or message extraction failed, use original
    }
    throw new Error(`DeepSeek API Error ${response.status}: ${errorText.substring(0, 200)}`);
  }
  
  const data = await response.json();
  console.log('[RC V2] DeepSeek response received, tokens used:', data.usage?.total_tokens);
  
  return data;
}

// Gemini API Call - V2: increased default max_tokens to 8000
async function callGeminiAPI(apiKey, model, messages, temperature, max_tokens) {
  const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const systemMessage = messages.filter(m => m.role === 'system').map(m => m.content).join('\n') || '';
  
  const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
  
  const selectedModel = model || 'gemini-2.5-flash';
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
        maxOutputTokens: max_tokens || 8000  // V2: increased from 4096 to 8000
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  
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
  
  return true;
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
  console.log('Reading Companion V2 installed/updated:', details.reason);
});
