// Reading Companion - Popup Script
// Handles user interactions in the extension popup

// ── Helpers ──────────────────────────────────────────────────────────────────
function showNotification(message, type) {
  const statusDot = document.querySelector('#api-status .status-dot');
  const statusText = document.querySelector('#api-status .status-text');
  if (!statusDot || !statusText) return;
  statusText.textContent = message;
  statusDot.className = 'status-dot ' + (type === 'error' ? 'disconnected' : 'success');
}

function resetStatus() {
  const statusDot = document.querySelector('#api-status .status-dot');
  const statusText = document.querySelector('#api-status .status-text');
  if (!statusDot || !statusText) return;
  statusText.textContent = 'Ready';
  statusDot.className = 'status-dot disconnected';
}

async function updateStatusFromStorage() {
  const result = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey']);
  const provider = result.apiProvider || 'deepseek';
  const statusDot = document.querySelector('#api-status .status-dot');
  const statusText = document.querySelector('#api-status .status-text');
  if (!statusDot || !statusText) return;

  if (provider === 'deepseek') {
    statusText.textContent = result.deepseekApiKey ? 'DeepSeek API configured' : 'DeepSeek API not configured';
    statusDot.className = 'status-dot ' + (result.deepseekApiKey ? 'connected' : 'disconnected');
  } else {
    statusText.textContent = result.geminiApiKey ? 'Gemini API configured' : 'Gemini API not configured';
    statusDot.className = 'status-dot ' + (result.geminiApiKey ? 'connected' : 'disconnected');
  }
}

// ── DeepSeek Test ─────────────────────────────────────────────────────────────
document.getElementById('test-btn').addEventListener('click', async () => {
  const apiKey = document.getElementById('api-key').value.trim();
  const btn = document.getElementById('test-btn');

  if (!apiKey) {
    showNotification('Please enter an API key first', 'error');
    return;
  }

  btn.textContent = 'Testing...';
  btn.disabled = true;
  showNotification('Testing connection...', 'info');

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "OK" in one word.' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      await chrome.storage.local.set({ apiProvider: 'deepseek', deepseekApiKey: apiKey });
      document.getElementById('api-provider').value = 'deepseek';
      showNotification('DeepSeek connected (saved)', 'success');
    } else {
      const err = await response.text();
      showNotification(`Error ${response.status}`, 'error');
    }
  } catch (error) {
    showNotification(`Network error`, 'error');
  } finally {
    btn.textContent = 'Test Connection';
    btn.disabled = false;
  }
});

// ── DeepSeek Save ─────────────────────────────────────────────────────────────
document.getElementById('save-btn').addEventListener('click', async () => {
  const apiKey = document.getElementById('api-key').value.trim();
  const btn = document.getElementById('save-btn');
  if (!apiKey) { showNotification('Please enter an API key', 'error'); return; }
  await chrome.storage.local.set({ apiProvider: 'deepseek', deepseekApiKey: apiKey });
  btn.textContent = 'Saved!';
  setTimeout(() => { btn.textContent = 'Save'; }, 2000);
  showNotification('Saved', 'success');
});

// ── Gemini Test ────────────────────────────────────────────────────────────────
document.getElementById('gemini-test-btn').addEventListener('click', async () => {
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const model = document.getElementById('gemini-model')?.value || 'gemini-2.5-flash';
  const btn = document.getElementById('gemini-test-btn');

  if (!apiKey) {
    showNotification('Please enter an API key first', 'error');
    return;
  }

  btn.textContent = 'Testing...';
  btn.disabled = true;
  showNotification('Testing connection...', 'info');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    if (response.ok) {
      await chrome.storage.local.set({ apiProvider: 'gemini', geminiApiKey: apiKey, geminiModel: model });
      document.getElementById('api-provider').value = 'gemini';
      showNotification(`${model} connected (saved)`, 'success');
    } else {
      const err = await response.json().catch(() => ({}));
      showNotification(`${err?.error?.message || 'API Error'}`, 'error');
    }
  } catch (error) {
    showNotification(`Network error`, 'error');
  } finally {
    btn.textContent = 'Test Connection';
    btn.disabled = false;
  }
});

// ── Gemini Save ───────────────────────────────────────────────────────────────
document.getElementById('gemini-save-btn').addEventListener('click', async () => {
  const apiKey = document.getElementById('gemini-api-key').value.trim();
  const model = document.getElementById('gemini-model')?.value || 'gemini-2.5-flash';
  const btn = document.getElementById('gemini-save-btn');
  if (!apiKey) { showNotification('Please enter an API key', 'error'); return; }
  await chrome.storage.local.set({ apiProvider: 'gemini', geminiApiKey: apiKey, geminiModel: model });
  btn.textContent = 'Saved!';
  setTimeout(() => { btn.textContent = 'Save'; }, 2000);
  showNotification('Saved', 'success');
});

// ── Provider Switch ───────────────────────────────────────────────────────────
document.getElementById('api-provider').addEventListener('change', async (e) => {
  const provider = e.target.value;
  await chrome.storage.local.set({ apiProvider: provider });
  document.querySelector('.deepseek-fields').style.display = provider === 'deepseek' ? 'block' : 'none';
  document.querySelector('.gemini-fields').style.display = provider === 'gemini' ? 'block' : 'none';
  updateStatusFromStorage();
});

// ── Open Sidebar ──────────────────────────────────────────────────────────────
document.getElementById('toggle-sidebar-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    showNotification('No active tab found', 'error');
    return;
  }

  // Block chrome:// and extension pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    showNotification('Cannot run on this page — open a web page first', 'error');
    setTimeout(() => window.close(), 2000);
    return;
  }

  try {
    // Try directly — works if content script is already running
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
    window.close();
  } catch (e) {
    // Content script not running — set flag then reload
    await chrome.storage.local.set({ _autoOpenSidebar: true });
    chrome.tabs.reload(tab.id, { bypassCache: true });
    window.close();
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────
(async () => {
  const result = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'geminiModel']);
  const provider = result.apiProvider || 'deepseek';

  // Set provider dropdown
  document.getElementById('api-provider').value = provider;

  // Show/hide provider fields
  document.querySelector('.deepseek-fields').style.display = provider === 'deepseek' ? 'block' : 'none';
  document.querySelector('.gemini-fields').style.display = provider === 'gemini' ? 'block' : 'none';

  // Fill saved keys
  if (result.deepseekApiKey) document.getElementById('api-key').value = result.deepseekApiKey;
  if (result.geminiApiKey) document.getElementById('gemini-api-key').value = result.geminiApiKey;
  if (result.geminiModel) {
    const sel = document.getElementById('gemini-model');
    if (sel) sel.value = result.geminiModel;
  }

  // Status
  updateStatusFromStorage();
})();
