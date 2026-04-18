// Reading Companion - Content Script
// Injects sidebar and handles user interactions on web pages

(function() {
  'use strict';
  
  let sidebarVisible = false;
  let sidebarElement = null;
  let isLoading = false;
  let currentArticle = null;
  
  // Create sidebar HTML structure
  function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'reading-companion-sidebar';
    sidebar.innerHTML = `
      <div class="rc-header">
        <div class="rc-logo">
          <span class="rc-logo-text">Reading Companion</span>
        </div>
        <div class="rc-header-actions">
          <button class="rc-settings-btn" id="rc-settings-btn" title="Settings">&#9881;</button>
          <button class="rc-close-btn" id="rc-close-btn" title="Close sidebar">&#215;</button>
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="rc-settings-panel" id="rc-settings-panel">
        <div class="rc-settings-inner">
          <h3>Settings</h3>
          <div class="rc-settings-row">
            <label>API Provider</label>
            <select id="rc-api-provider">
              <option value="deepseek">DeepSeek</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
          <div class="rc-settings-row rc-deepseek-row">
            <label>DeepSeek API Key</label>
            <input type="password" id="rc-deepseek-key" placeholder="sk-..." />
          </div>
          <div class="rc-settings-row rc-gemini-row" style="display:none">
            <label>Gemini API Key</label>
            <input type="password" id="rc-gemini-key" placeholder="AI..." />
          </div>
          <div class="rc-settings-row rc-gemini-row" style="display:none">
            <label>Model</label>
            <select id="rc-gemini-model">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            </select>
          </div>
          <div class="rc-settings-actions">
            <button class="rc-btn rc-btn-secondary" id="rc-test-btn">Test</button>
            <button class="rc-btn rc-btn-primary" id="rc-save-settings-btn">Save</button>
          </div>
          <p class="rc-settings-hint" id="rc-settings-status"></p>
        </div>
      </div>
      
      <div class="rc-tabs">
        <button class="rc-tab active" data-tab="teacher">Teacher</button>
        <button class="rc-tab" data-tab="classmate">Classmate</button>
      </div>
      
      <div class="rc-content">
        <!-- Teacher Section -->
        <div class="rc-section active" id="rc-teacher-section">
          <div class="rc-loading" id="rc-teacher-loading">
            <div class="rc-spinner"></div>
            <p>Analyzing&hellip;</p>
          </div>
          
          <div class="rc-teacher-content" id="rc-teacher-content">
            <div class="rc-card">
              <h3>Key Views &amp; Insights</h3>
              <div class="rc-card-content" id="rc-key-insights">
                <p class="rc-placeholder">Click "Analyze" to extract key insights</p>
              </div>
            </div>
            
            <div class="rc-card">
              <h3>Structure Overview</h3>
              <div class="rc-card-content" id="rc-structure-overview">
                <p class="rc-placeholder">Click "Analyze" to see article structure</p>
              </div>
            </div>
            
            <div class="rc-card">
              <h3>Powerful Quotes</h3>
              <div class="rc-card-content" id="rc-powerful-quotes">
                <p class="rc-placeholder">Click "Analyze" to extract memorable quotes</p>
              </div>
            </div>
            
            <div class="rc-card">
              <h3>Recommended Readings</h3>
              <div class="rc-card-content" id="rc-recommendations">
                <p class="rc-placeholder">Click "Analyze" to get recommendations</p>
              </div>
            </div>
          </div>
          
          <div class="rc-actions">
            <button class="rc-btn rc-btn-primary" id="rc-analyze-btn">
              Analyze Article
            </button>
          </div>
        </div>
        
        <!-- Classmate Section -->
        <div class="rc-section" id="rc-classmate-section">
          <div class="rc-chat-container">
            <div class="rc-chat-messages" id="rc-chat-messages">
              <div class="rc-message rc-message-ai">
                <div class="rc-message-avatar">RC</div>
                <div class="rc-message-content">
                  <p>Hi there. I&rsquo;m your reading companion. Ask me anything about this article, or we can discuss the ideas together.</p>
                </div>
              </div>
            </div>
            
            <div class="rc-chat-input-area">
              <textarea id="rc-chat-input" placeholder="Ask a question or share your thoughts..." rows="2"></textarea>
              <button class="rc-btn rc-btn-send" id="rc-send-btn">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return sidebar;
  }
  
  // Extract article content from page
  function extractArticleContent() {
    // Try to find main content
    const selectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
      '#content'
    ];
    
    let contentElement = null;
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 500) {
        contentElement = element;
        break;
      }
    }
    
    if (!contentElement) {
      // Fallback: get body content but filter scripts and styles
      contentElement = document.body;
    }
    
    // Get title
    const title = document.title || 
                  document.querySelector('h1')?.innerText || 
                  document.querySelector('article h1')?.innerText || 
                  'Untitled Article';
    
    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    
    // Extract main text content
    const clone = contentElement.cloneNode(true);
    
    // Remove unwanted elements
    const unwanted = clone.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement, .social-share, .comments, #comments');
    unwanted.forEach(el => el.remove());
    
    // Get text content
    const textContent = clone.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limit to 15000 chars for API
    
    // Get URL
    const url = window.location.href;
    
    // Get images for potential recommendations
    const images = Array.from(document.querySelectorAll('article img, main img'))
      .slice(0, 5)
      .map(img => ({
        src: img.src,
        alt: img.alt
      }));
    
    return {
      title,
      url,
      textContent,
      metaDesc,
      images
    };
  }
  
  // Toggle sidebar visibility
  function toggleSidebar() {
    if (!sidebarElement) {
      sidebarElement = createSidebar();
      document.body.appendChild(sidebarElement);
      setupEventListeners();
    }

    sidebarVisible = !sidebarVisible;
    sidebarElement.classList.toggle('rc-visible', sidebarVisible);

    // Close settings panel when sidebar is hidden
    if (!sidebarVisible) {
      const panel = document.getElementById('rc-settings-panel');
      if (panel) panel.classList.remove('open');
    }

    if (sidebarVisible) {
      currentArticle = extractArticleContent();
    }
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Close button
    document.getElementById('rc-close-btn').addEventListener('click', toggleSidebar);

    // Settings panel toggle
    document.getElementById('rc-settings-btn').addEventListener('click', () => {
      const panel = document.getElementById('rc-settings-panel');
      const isOpen = panel.classList.contains('open');
      if (isOpen) {
        panel.classList.remove('open');
      } else {
        panel.classList.add('open');
        loadSidebarSettings();
      }
    });

    // Provider toggle
    document.getElementById('rc-api-provider').addEventListener('change', () => {
      const provider = document.getElementById('rc-api-provider').value;
      document.querySelectorAll('.rc-deepseek-row').forEach(el => el.style.display = provider === 'deepseek' ? '' : 'none');
      document.querySelectorAll('.rc-gemini-row').forEach(el => el.style.display = provider === 'gemini' ? '' : 'none');
    });

    // Test button
    document.getElementById('rc-test-btn').addEventListener('click', async () => {
      const provider = document.getElementById('rc-api-provider').value;
      const statusEl = document.getElementById('rc-settings-status');
      const btn = document.getElementById('rc-test-btn');
      btn.disabled = true;
      btn.textContent = 'Testing...';
      statusEl.textContent = '';
      statusEl.className = 'rc-settings-hint';

      try {
        const settings = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'geminiModel']);

        if (provider === 'deepseek') {
          const key = document.getElementById('rc-deepseek-key').value.trim() || settings.deepseekApiKey;
          if (!key) throw new Error('No API key');
          const response = await chrome.runtime.sendMessage({
            type: 'CALL_DEEPSEEK',
            apiKey: key,
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Reply: OK' }],
            temperature: 0.7,
            max_tokens: 10
          });
          if (response.ok) {
            statusEl.textContent = 'DeepSeek connected';
            statusEl.className = 'rc-settings-hint success';
          } else {
            throw new Error(response.error);
          }
        } else {
          const key = document.getElementById('rc-gemini-key').value.trim() || settings.geminiApiKey;
          const model = document.getElementById('rc-gemini-model').value;
          if (!key) throw new Error('No API key');
          const response = await chrome.runtime.sendMessage({
            type: 'CALL_GEMINI',
            apiKey: key,
            model: model,
            messages: [{ role: 'user', parts: [{ text: 'Reply: OK' }] }],
            temperature: 0.7,
            max_tokens: 10
          });
          if (response.ok) {
            statusEl.textContent = model + ' connected';
            statusEl.className = 'rc-settings-hint success';
          } else {
            throw new Error(response.error);
          }
        }
      } catch (err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.className = 'rc-settings-hint error';
      }

      btn.disabled = false;
      btn.textContent = 'Test';
    });

    // Save button
    document.getElementById('rc-save-settings-btn').addEventListener('click', async () => {
      const provider = document.getElementById('rc-api-provider').value;
      const statusEl = document.getElementById('rc-settings-status');
      const data = { apiProvider: provider };

      if (provider === 'deepseek') {
        const key = document.getElementById('rc-deepseek-key').value.trim();
        if (key) data.deepseekApiKey = key;
      } else {
        const key = document.getElementById('rc-gemini-key').value.trim();
        if (key) data.geminiApiKey = key;
        data.geminiModel = document.getElementById('rc-gemini-model').value;
      }

      await chrome.storage.local.set(data);
      currentArticle = null;
      statusEl.textContent = 'Saved';
      statusEl.className = 'rc-settings-hint success';
      setTimeout(() => {
        document.getElementById('rc-settings-panel').classList.remove('open');
      }, 600);
    });

    // Load settings into sidebar form
    async function loadSidebarSettings() {
      const settings = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'geminiModel']);
      const provider = settings.apiProvider || 'deepseek';
      document.getElementById('rc-api-provider').value = provider;
      if (settings.deepseekApiKey) document.getElementById('rc-deepseek-key').value = settings.deepseekApiKey;
      if (settings.geminiApiKey) document.getElementById('rc-gemini-key').value = settings.geminiApiKey;
      if (settings.geminiModel) document.getElementById('rc-gemini-model').value = settings.geminiModel;
      document.querySelectorAll('.rc-deepseek-row').forEach(el => el.style.display = provider === 'deepseek' ? '' : 'none');
      document.querySelectorAll('.rc-gemini-row').forEach(el => el.style.display = provider === 'gemini' ? '' : 'none');
      document.getElementById('rc-settings-status').textContent = '';
    }
    
    // Tab switching
    document.querySelectorAll('.rc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        // Close settings panel when switching tabs
        document.getElementById('rc-settings-panel').classList.remove('open');

        // Update tab buttons
        document.querySelectorAll('.rc-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update sections
        document.querySelectorAll('.rc-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`rc-${tabName}-section`).classList.add('active');
      });
    });
    
    // Analyze button
    document.getElementById('rc-analyze-btn').addEventListener('click', analyzeArticle);
    
    // Chat send button
    document.getElementById('rc-send-btn').addEventListener('click', sendChatMessage);
    
    // Chat input enter key
    document.getElementById('rc-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
  
  // Analyze article with AI
  async function analyzeArticle() {
    if (isLoading) return;
    
    if (!currentArticle) {
      currentArticle = extractArticleContent();
    }
    
    if (!currentArticle.textContent || currentArticle.textContent.length < 100) {
      alert('Unable to extract sufficient content from this page.');
      return;
    }
    
    isLoading = true;
    document.getElementById('rc-teacher-loading').style.display = 'flex';
    document.getElementById('rc-teacher-content').style.display = 'none';
    
    try {
      // Get API configuration from storage
      const { apiProvider, deepseekApiKey, geminiApiKey } = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey']);
      
      const provider = apiProvider || 'deepseek';
      const apiKey = provider === 'gemini' ? geminiApiKey : deepseekApiKey;
      
      if (!apiKey) {
        throw new Error(`Please set your ${provider === 'gemini' ? 'Gemini' : 'DeepSeek'} API key in the extension popup.`);
      }
      
      // Prepare analysis prompt - comprehensive Teacher analysis
      const articleText = currentArticle.textContent.substring(0, 6000);
      
      const analysisPrompt = `You are an expert reading companion providing a comprehensive analysis of an article.

Article Title: ${currentArticle.title}
Article URL: ${currentArticle.url}

Article Content:
${articleText}

Please provide a clear, structured analysis:

## Key Views & Insights
- Core thesis and main arguments (2-3 concise bullet points)
- Key supporting facts or evidence
- Main conclusions and takeaways

## Structure Overview
- Major sections or parts of the article
- Key points covered in each section

## Powerful Quotes
- 2-3 most eloquent or insightful quotes
- Why each quote is memorable

## Recommended Readings
- 3 related articles with title, URL, and brief description

Format with headers and bullet points.`;

      // Call the selected API
      const messageType = provider === 'gemini' ? 'CALL_GEMINI' : 'CALL_DEEPSEEK';
      const messageData = provider === 'gemini' 
        ? {
            glmApiKey: apiKey,
            messages: [{ role: 'user', content: analysisPrompt }],
            temperature: 0.7,
            max_tokens: 4500
          }
        : {
            glmApiKey: apiKey,
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: analysisPrompt }],
            temperature: 0.7,
            max_tokens: 4500
          };
      
      const response = await chrome.runtime.sendMessage({
        type: messageType,
        data: messageData
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      const analysis = response.data.choices[0].message.content;
      
      // Parse and display results
      displayAnalysisResults(analysis);
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing article: ' + error.message);
    } finally {
      isLoading = false;
      document.getElementById('rc-teacher-loading').style.display = 'none';
      document.getElementById('rc-teacher-content').style.display = 'block';
    }
  }
  
  // Display analysis results
  function displayAnalysisResults(analysis) {
    // Split by any markdown header (## / # / ** / ---)
    // Also try splitting by bold keywords on their own line
    const lines = analysis.split('\n');
    let currentSection = null;
    let currentContent = [];
    const sectionMap = {};

    lines.forEach(line => {
      // Detect section header (markdown ##, or bold **, or numbered)
      const headerMatch = line.match(/^#{1,3}\s*(.+)/) ||
                          line.match(/^\*\*(.+)\*\*/) ||
                          line.match(/^(\d+\.?\s+[A-Z][^:]+)$/);
      if (headerMatch) {
        const header = headerMatch[1].trim().toLowerCase();
        if (currentSection && currentContent.length) {
          sectionMap[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = header;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });
    if (currentSection && currentContent.length) {
      sectionMap[currentSection] = currentContent.join('\n').trim();
    }

    // Also try naive split on ## markers as fallback
    if (!Object.keys(sectionMap).length) {
      const parts = analysis.split(/#{1,3}\s+/);
      parts.forEach(part => {
        const lines2 = part.split('\n');
        if (lines2.length < 2) return;
        const header = lines2[0].toLowerCase();
        const content = lines2.slice(1).join('\n').trim();
        if (content) sectionMap[header] = content;
      });
    }

    // Match sections to UI elements
    Object.entries(sectionMap).forEach(([header, content]) => {
      const h = header.toLowerCase();
      if (h.includes('key view') || h.includes('insight') || h.includes('main point') || h.includes('argument')) {
        document.getElementById('rc-key-insights').innerHTML = formatContent(content);
      } else if (h.includes('structure') || h.includes('overview') || h.includes('section') || h.includes('part')) {
        document.getElementById('rc-structure-overview').innerHTML = formatContent(content);
      } else if (h.includes('quote') || h.includes('powerful') || h.includes('memorable') || h.includes('eloquent')) {
        document.getElementById('rc-powerful-quotes').innerHTML = formatQuotes(content);
      } else if (h.includes('recommend') || h.includes('reading') || h.includes('related')) {
        document.getElementById('rc-recommendations').innerHTML = formatLinks(content);
      }
    });
    
  }
  
  // Format content with proper HTML
  function formatContent(text) {
    return text
      .replace(/^#{1,6}\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }
  
  // Format links in recommendations
  function formatLinks(text) {
    const linkRegex = /(https?:\/\/[^\s\)]+)/g;
    return text
      .replace(linkRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }
  
  // Format powerful quotes with special styling
  function formatQuotes(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/"([^"]{30,})"/g, '<blockquote class="rc-quote">"$1"</blockquote>')
      .replace(/^#{1,6}\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }
  
  // Send chat message
  async function sendChatMessage() {
    const input = document.getElementById('rc-chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    const messagesContainer = document.getElementById('rc-chat-messages');
    const userMessage = document.createElement('div');
    userMessage.className = 'rc-message rc-message-user';
    userMessage.innerHTML = `
      <div class="rc-message-content">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="rc-message-avatar">Y</div>
    `;
    messagesContainer.appendChild(userMessage);
    
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'rc-message rc-message-ai';
    loadingMessage.id = 'rc-chat-loading';
    loadingMessage.innerHTML = `
      <div class="rc-message-avatar">RC</div>
      <div class="rc-message-content">
        <p>Thinking&hellip;</p>
      </div>
    `;
    messagesContainer.appendChild(loadingMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
      // Get API configuration from storage
      const { apiProvider, deepseekApiKey, geminiApiKey } = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey']);
      
      const provider = apiProvider || 'deepseek';
      const apiKey = provider === 'gemini' ? geminiApiKey : deepseekApiKey;
      
      if (!apiKey) {
        throw new Error(`Please set your ${provider === 'gemini' ? 'Gemini' : 'DeepSeek'} API key in the extension popup.`);
      }
      
      // Prepare chat context
      const systemPrompt = `You are a friendly and intelligent reading companion. Help the user understand and discuss an article. Be conversational and insightful.`;

      const articleContext = `Article: ${currentArticle?.title || 'Unknown'}
Content: ${currentArticle?.textContent?.substring(0, 2000) || 'No content'}

Respond concisely.`;

      // Call the selected API
      const messageType = provider === 'gemini' ? 'CALL_GEMINI' : 'CALL_DEEPSEEK';
      const messageData = provider === 'gemini' 
        ? {
            glmApiKey: apiKey,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: articleContext + '\n\nUser question: ' + message }
            ],
            temperature: 0.8,
            max_tokens: 1000
          }
        : {
            glmApiKey: apiKey,
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt + '\n\n' + articleContext },
              { role: 'user', content: message }
            ],
            temperature: 0.8,
            max_tokens: 1000
          };
      
      const response = await chrome.runtime.sendMessage({
        type: messageType,
        data: messageData
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      const aiResponse = response.data.choices[0].message.content;
      
      // Replace loading message with AI response
      loadingMessage.innerHTML = `
        <div class="rc-message-avatar">RC</div>
        <div class="rc-message-content">
          <p>${aiResponse.replace(/\n/g, '<br>')}</p>
        </div>
      `;
      
    } catch (error) {
      console.error('Chat error:', error);
      loadingMessage.innerHTML = `
        <div class="rc-message-avatar">RC</div>
        <div class="rc-message-content">
          <p style="color: #888;">Error: ${escapeHtml(error.message)}</p>
        </div>
      `;
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOGGLE_SIDEBAR') {
      toggleSidebar();
      sendResponse({ ok: true });
    }
    return true;
  });

  // Check for auto-open flag (set by popup before reload)
  chrome.storage.local.get(['_autoOpenSidebar'], (result) => {
    if (result._autoOpenSidebar) {
      // Clear flag immediately
      chrome.storage.local.remove('_autoOpenSidebar');
      // Open sidebar after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (!sidebarVisible) toggleSidebar();
      }, 300);
    }
  });

  // Listen for storage changes (e.g., when popup saves a new API key)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (
      changes.apiProvider ||
      changes.deepseekApiKey ||
      changes.geminiApiKey ||
      changes.geminiModel
    )) {
      // Force refresh cached article so next Analyze uses fresh settings
      currentArticle = null;
      console.log('[RC] API settings updated, cache cleared for next analysis');
    }
  });
  
  // Add toolbar button click handler (for pages without action popup)
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + R to toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      toggleSidebar();
    }
  });
  
  // Initialize: inject styles
  const style = document.createElement('style');
  style.textContent = getSidebarStyles();
  document.head.appendChild(style);
  
  function getSidebarStyles() {
    return `
      /* =============================================
         Reading Companion - New Yorker Aesthetic
         Minimal · Serif · Monochrome
         ============================================= */
      
      @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap');

      #reading-companion-sidebar {
        position: fixed;
        top: 0;
        right: -440px;
        width: 420px;
        height: 100vh;
        background: #fafafa;
        border-left: 1px solid #e0e0e0;
        z-index: 2147483647;
        font-family: 'Source Serif 4', 'Crimson Pro', Georgia, 'Times New Roman', serif;
        display: flex;
        flex-direction: column;
        transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      
      #reading-companion-sidebar.rc-visible {
        right: 0;
      }
      
      /* --- Header --- */
      .rc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px 20px;
        border-bottom: 1px solid #e8e8e8;
        background: #fafafa;
      }
      
      .rc-logo {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      
      .rc-logo-icon {
        font-size: 14px;
        opacity: 0.5;
        letter-spacing: -1px;
      }
      
      .rc-logo-text {
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.02em;
        color: #1a1a1a;
        text-transform: uppercase;
        font-variant: small-caps;
      }

      .rc-header-actions {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .rc-settings-btn {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.2s;
        font-family: Georgia, serif;
      }

      .rc-settings-btn:hover {
        color: #333;
      }

      .rc-close-btn {
        background: none;
        border: none;
        color: #999;
        font-size: 22px;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
        transition: color 0.2s;
        font-family: Georgia, serif;
      }

      .rc-close-btn:hover {
        color: #333;
      }

      /* --- Settings Panel --- */
      .rc-settings-panel {
        display: none;
        border-bottom: 1px solid #e8e8e8;
        background: #fafafa;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .rc-settings-panel.open {
        display: block;
        max-height: 500px;
      }

      .rc-settings-inner {
        padding: 20px 28px;
      }

      .rc-settings-inner h3 {
        font-family: 'Source Serif 4', Georgia, serif;
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 16px 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .rc-settings-row {
        margin-bottom: 12px;
      }

      .rc-settings-row label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #888;
        margin-bottom: 4px;
      }

      .rc-settings-row select,
      .rc-settings-row input {
        width: 100%;
        padding: 6px 10px;
        font-family: 'Source Sans 3', sans-serif;
        font-size: 12px;
        border: 1px solid #ccc;
        background: #fff;
        color: #333;
        outline: none;
        box-sizing: border-box;
      }

      .rc-settings-row select:focus,
      .rc-settings-row input:focus {
        border-color: #1a1a1a;
      }

      .rc-settings-actions {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }

      .rc-settings-hint {
        font-size: 11px;
        color: #888;
        margin: 8px 0 0;
        font-style: italic;
      }

      .rc-settings-hint.success { color: #3a7d44; }
      .rc-settings-hint.error { color: #c0392b; }
      
      /* --- Tabs --- */
      .rc-tabs {
        display: flex;
        padding: 0 28px;
        gap: 24px;
        border-bottom: 1px solid #e8e8e8;
        background: #fafafa;
      }
      
      .rc-tab {
        flex: none;
        padding: 14px 0;
        border: none;
        background: transparent;
        cursor: pointer;
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 13px;
        font-weight: 400;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #aaa;
        position: relative;
        transition: color 0.2s;
      }
      
      .rc-tab.active {
        color: #1a1a1a;
        font-weight: 500;
      }
      
      .rc-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #1a1a1a;
      }
      
      .rc-tab:hover {
        color: #555;
      }
      
      /* --- Content Area --- */
      .rc-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px 28px 28px;
        scrollbar-width: thin;
        scrollbar-color: #ddd transparent;
      }
      
      .rc-content::-webkit-scrollbar {
        width: 4px;
      }
      
      .rc-content::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .rc-content::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
      }
      
      .rc-section {
        display: none;
      }
      
      .rc-section.active {
        display: block;
      }
      
      /* --- Loading State --- */
      .rc-loading {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        color: #888;
      }
      
      .rc-spinner {
        width: 24px;
        height: 24px;
        border: 1.5px solid #e0e0e0;
        border-top-color: #333;
        border-radius: 50%;
        animation: rc-spin 0.8s linear infinite;
        margin-bottom: 16px;
      }
      
      @keyframes rc-spin {
        to { transform: rotate(360deg); }
      }
      
      .rc-loading p {
        font-size: 13px;
        letter-spacing: 0.04em;
        color: #888;
      }
      
      /* --- Cards --- */
      .rc-card {
        margin-bottom: 32px;
        padding-bottom: 28px;
        border-bottom: 1px solid #e8e8e8;
      }
      
      .rc-card:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .rc-card h3 {
        margin: 0 0 14px 0;
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #888;
      }
      
      .rc-card-content {
        font-size: 15px;
        line-height: 1.75;
        color: #2a2a2a;
      }
      
      .rc-card-content h4 {
        margin: 16px 0 8px 0;
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 15px;
        font-weight: 600;
        color: #1a1a1a;
      }
      
      .rc-card-content ul {
        margin: 10px 0;
        padding-left: 0;
        list-style: none;
      }
      
      .rc-card-content li {
        margin-bottom: 10px;
        padding-left: 16px;
        position: relative;
      }
      
      .rc-card-content li::before {
        content: '—';
        position: absolute;
        left: 0;
        color: #ccc;
      }
      
      .rc-card-content p {
        margin: 10px 0;
      }
      
      .rc-placeholder {
        color: #bbb;
        font-style: italic;
        font-size: 14px;
      }
      
      /* --- Quotes --- */
      .rc-quote {
        margin: 16px 0;
        padding: 16px 20px 16px 24px;
        border-left: 2px solid #333;
        background: rgba(0,0,0,0.02);
        font-style: italic;
        color: #333;
        font-size: 15px;
        line-height: 1.7;
      }
      
      /* --- Action Button --- */
      .rc-actions {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e8e8e8;
      }
      
      .rc-btn {
        width: 100%;
        padding: 14px 20px;
        border: 1px solid #1a1a1a;
        background: #1a1a1a;
        color: #fafafa;
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .rc-btn:hover {
        background: #333;
        border-color: #333;
      }
      
      .rc-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      /* --- Chat Styles --- */
      .rc-chat-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 160px);
      }
      
      .rc-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 4px 0;
        scrollbar-width: thin;
        scrollbar-color: #ddd transparent;
      }
      
      .rc-chat-messages::-webkit-scrollbar {
        width: 4px;
      }
      
      .rc-chat-messages::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 2px;
      }
      
      .rc-message {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        align-items: flex-start;
      }
      
      .rc-message-user {
        flex-direction: row-reverse;
      }
      
      .rc-message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #f0f0f0;
        border: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .rc-message-ai .rc-message-avatar {
        background: #1a1a1a;
        border-color: #1a1a1a;
        color: #fafafa;
        font-size: 12px;
      }
      
      .rc-message-content {
        max-width: 78%;
        font-size: 14px;
        line-height: 1.65;
        color: #2a2a2a;
      }
      
      .rc-message-user .rc-message-content {
        background: #f0f0f0;
        padding: 10px 14px;
        color: #1a1a1a;
        border-radius: 16px 4px 16px 16px;
      }
      
      .rc-message-ai .rc-message-content {
        padding: 0;
        border-radius: 0;
      }
      
      /* --- Chat Input --- */
      .rc-chat-input-area {
        display: flex;
        gap: 10px;
        padding-top: 16px;
        margin-top: 8px;
        border-top: 1px solid #e8e8e8;
      }
      
      .rc-chat-input-area textarea {
        flex: 1;
        padding: 12px 14px;
        border: 1px solid #ddd;
        background: #fff;
        border-radius: 4px;
        resize: none;
        font-family: 'Source Serif 4', Georgia, serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1a1a1a;
        transition: border-color 0.2s;
      }
      
      .rc-chat-input-area textarea:focus {
        outline: none;
        border-color: #999;
      }
      
      .rc-chat-input-area textarea::placeholder {
        color: #bbb;
        font-style: italic;
      }
      
      .rc-btn-send {
        width: auto;
        padding: 12px 18px;
        background: #1a1a1a;
        color: #fafafa;
        border: none;
        font-family: 'Crimson Pro', Georgia, serif;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .rc-btn-send:hover {
        background: #444;
      }
    `;
  }
  
  // Expose toggle function globally for browser action
  window.toggleReadingCompanion = toggleSidebar;
  
  // Also try to auto-create sidebar on page load (optional)
  // Uncomment the line below if you want the sidebar to appear automatically
  // setTimeout(toggleSidebar, 1000);
  
})();
