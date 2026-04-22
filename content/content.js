// Reading Companion V2 - Content Script
// v2.1.5: Two-step API calls for STRICT 5-section structure output

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
          <div class="rc-settings-row rc-deepseek-row">
            <label>Model</label>
            <select id="rc-deepseek-model">
              <option value="deepseek-chat">DeepSeek V3 (Chat)</option>
              <option value="deepseek-reasoner">DeepSeek o1 (Reasoner)</option>
            </select>
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

      <div class="rc-top-actions">
        <button class="rc-btn rc-btn-primary rc-analyze-btn-top" id="rc-analyze-btn">
          Analyze Article
        </button>
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
              <h3>Structure Overview (5 Sections)</h3>
              <div class="rc-card-content" id="rc-structure-overview">
                <p class="rc-placeholder">Click "Analyze" to see article structure</p>
              </div>
            </div>

            <div class="rc-card">
              <h3>Most Impactful Passages</h3>
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
      contentElement = document.body;
    }

    const title = document.title ||
                 document.querySelector('h1')?.innerText ||
                 document.querySelector('article h1')?.innerText ||
                 'Untitled Article';

    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';

    const clone = contentElement.cloneNode(true);

    const unwanted = clone.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement, .social-share, .comments, #comments');
    unwanted.forEach(el => el.remove());

    const textContent = clone.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 40000);

    const url = window.location.href;

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
    document.getElementById('rc-close-btn').addEventListener('click', toggleSidebar);

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

    document.getElementById('rc-api-provider').addEventListener('change', () => {
      const provider = document.getElementById('rc-api-provider').value;
      document.querySelectorAll('.rc-deepseek-row').forEach(el => el.style.display = provider === 'deepseek' ? '' : 'none');
      document.querySelectorAll('.rc-gemini-row').forEach(el => el.style.display = provider === 'gemini' ? '' : 'none');
    });

    // Initialize deepseek model visibility
    document.querySelectorAll('.rc-deepseek-row').forEach(el => {
      const provider = document.getElementById('rc-api-provider').value;
      el.style.display = provider === 'deepseek' ? '' : 'none';
    });

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
          if (response.success) {
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
          if (response.success) {
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

    document.getElementById('rc-save-settings-btn').addEventListener('click', async () => {
      const provider = document.getElementById('rc-api-provider').value;
      const statusEl = document.getElementById('rc-settings-status');
      const data = { apiProvider: provider };

      if (provider === 'deepseek') {
        const key = document.getElementById('rc-deepseek-key').value.trim();
        if (key) data.deepseekApiKey = key;
        data.deepseekModel = document.getElementById('rc-deepseek-model').value;
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

    async function loadSidebarSettings() {
      const settings = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'geminiModel', 'deepseekModel']);
      const provider = settings.apiProvider || 'deepseek';
      document.getElementById('rc-api-provider').value = provider;
      if (settings.deepseekApiKey) document.getElementById('rc-deepseek-key').value = settings.deepseekApiKey;
      if (settings.geminiApiKey) document.getElementById('rc-gemini-key').value = settings.geminiApiKey;
      if (settings.geminiModel) document.getElementById('rc-gemini-model').value = settings.geminiModel;
      if (settings.deepseekModel) document.getElementById('rc-deepseek-model').value = settings.deepseekModel;
      document.querySelectorAll('.rc-deepseek-row').forEach(el => el.style.display = provider === 'deepseek' ? '' : 'none');
      document.querySelectorAll('.rc-gemini-row').forEach(el => el.style.display = provider === 'gemini' ? '' : 'none');
      document.getElementById('rc-settings-status').textContent = '';
    }

    document.querySelectorAll('.rc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        document.getElementById('rc-settings-panel').classList.remove('open');
        document.querySelectorAll('.rc-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.rc-section').forEach(s => s.classList.remove('active'));
        document.getElementById('rc-' + tabName + '-section').classList.add('active');
      });
    });

    document.getElementById('rc-analyze-btn').addEventListener('click', analyzeArticle);

    document.getElementById('rc-send-btn').addEventListener('click', sendChatMessage);

    document.getElementById('rc-chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  // Analyze article with AI - v2.1.5: TWO-STEP approach for STRICT 5-section output
  // Step 1: Call API separately for Structure (focused prompt)
  // Step 2: Call API separately for Key Views + Quotes
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
      const { apiProvider, deepseekApiKey, geminiApiKey, deepseekModel } = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'deepseekModel']);

      const provider = apiProvider || 'deepseek';
      const apiKey = provider === 'gemini' ? geminiApiKey : deepseekApiKey;
      const model = provider === 'gemini' ? undefined : (deepseekModel || 'deepseek-chat');

      if (!apiKey) {
        throw new Error('Please set your ' + (provider === 'gemini' ? 'Gemini' : 'DeepSeek') + ' API key in the extension popup.');
      }

      const articleText = currentArticle.textContent;

      // Read feature toggles
      const features = await chrome.storage.local.get(['featureSummarize', 'featureStructure', 'featureRecommend', 'featureQuotes']);
      const includeSummarize = features.featureSummarize !== false;
      const includeStructure = features.featureStructure !== false;
      const includeRecommend = features.featureRecommend !== false;
      const includeQuotes = features.featureQuotes !== false;

      // v2.1.5: Provider-specific max tokens
      // DeepSeek max: 8192, Gemini: 15000
      const maxTokens = provider === 'gemini' ? 15000 : 8192;

      var structureResult = '';
      var otherResult = '';

      // STEP 1: Structure analysis - DEDICATED API call with focused prompt
      if (includeStructure) {
        var structurePrompt = 'You are a structural analyst. Your job is to divide the article into 7-10 sequential content blocks.\n\n' +
          'CRITICAL RULES:\n' +
          '- Divide the article into 7-10 EQUAL-SIZED content blocks\n' +
          '- Block 1 = the VERY BEGINNING. Block 10 (or last) = the VERY END\n' +
          '- EACH BLOCK must cover roughly the same amount of content (10-20% of the article)\n' +
          '- DO NOT dump multiple topics into one block — especially the ending blocks\n' +
          '- If the article has a long conclusion or summary, split it into 2-3 separate blocks\n' +
          '- Each block must describe DIFFERENT content from other blocks\n' +
          '- Do NOT use titles like "Introduction", "Body", "Conclusion", "Final Section"\n' +
          '- Do NOT use the word "section" in your titles\n' +
          '- Number each block: 1., 2., 3., etc.\n\n' +
          'OUTPUT FORMAT (7-10 blocks, equal size):\n\n' +
          '**1. [A specific title about the very beginning]**\n\n' +
          '[2-3 sentences describing the EXACT content in this part]\n\n' +
          '**2. [A specific title about what comes next]**\n\n' +
          '[2-3 sentences — DIFFERENT content from block 1]\n\n' +
          '**3. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**4. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**5. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**6. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**7. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**8. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**9. [A specific title]**\n\n' +
          '[2-3 sentences]\n\n' +
          '**10. [A specific title about the final part]**\n\n' +
          '[2-3 sentences — the VERY END, not a summary of the whole article]\n\n' +
          'ARTICLE TITLE: ' + currentArticle.title + '\n\n' +
          'ARTICLE CONTENT:\n' +
          articleText.substring(0, 30000);

        console.log('[RC V2] Step 1: Structure analysis, prompt length: ' + structurePrompt.length);

        structureResult = await callAPI(provider, apiKey, structurePrompt, maxTokens, model);
        console.log('[RC V2] Structure result length: ' + structureResult.length);
      }

      // STEP 2: Key Views and/or Quotes - SEPARATE API call
      if (includeSummarize || includeRecommend || includeQuotes) {
        var otherPrompt = 'You are analyzing an article.\n\n' +
          'ARTICLE TITLE: ' + currentArticle.title + '\n' +
          'ARTICLE URL: ' + currentArticle.url + '\n\n' +
          'ARTICLE CONTENT:\n' + articleText + '\n\n';

        if (includeSummarize) {
          otherPrompt += '## Key Views & Insights\n' +
            '- Core thesis: What is the main argument or message?\n' +
            '- Key supporting evidence: 2-3 key facts that support the thesis\n' +
            '- Takeaways: What should readers remember?\n\n';
        }

        if (includeQuotes) {
          otherPrompt += '## Most Impactful Passages\n' +
            'You are a seasoned literary editor and narrative critic. Extract 5-6 unforgettable passages from this article.\n\n' +
            'SELECTION CRITERIA:\n' +
            '1. Literary Quality (文学性): Beautiful rhetoric, unique metaphors, unforgettable rhythm\n' +
            '2. Narrative Focus (叙事重心): Reveals core conflict, deepens theme, or defines character\n' +
            '3. Intellectual Depth (思想密度): Profound insight into humanity, society, or phenomena\n' +
            '4. Emotional Tension (情感张力): Touches the reader emotionally — humor, tragedy, or serene observation\n\n' +
            'SPECIFICALLY LOOK FOR:\n' +
            '- Sentences that reveal a character\'s core motivation or contradiction\n' +
            '- Sharp assertions that pierce through surface to essence\n' +
            '- Narrative turning points that use detail to show grand themes\n\n' +
            'AVOID:\n' +
            '- Pure factual background (e.g., "he was born in 1965")\n' +
            '- Only narrative context without literary or intellectual impact\n\n' +
            'Can be from the AUTHOR\'s voice OR INTERVIEWEES.\n\n' +
            'OUTPUT FORMAT — follow this EXACTLY for each passage (no deviations):\n\n' +
            '1. **[exact passage verbatim, 1-3 sentences, NO surrounding quotes]**\n' +
            '_[one line explaining why it\'s memorable]_\n\n' +
            '2. **[exact passage verbatim, 1-3 sentences, NO surrounding quotes]**\n' +
            '_[one line explaining why it\'s memorable]_\n\n' +
            'RULES:\n' +
            '- Do NOT add any label before the passage (no "Passage:", no "Quote:", nothing)\n' +
            '- Do NOT wrap the passage in quotation marks\n' +
            '- The passage text must be wrapped in **bold** markdown\n' +
            '- The note must be wrapped in _italic_ markdown, on its own line right after the passage\n' +
            '- Do NOT include any other labels or headers (no "Note:", no "Why it stands out:")\n\n';
        }

        if (includeRecommend) {
          otherPrompt += '## Recommended Readings\n' +
            'Based on this article\'s themes, suggest 3 related articles with titles and brief descriptions.\n';
        }

        console.log('[RC V2] Step 2: Other analysis, prompt length: ' + otherPrompt.length);

        otherResult = await callAPI(provider, apiKey, otherPrompt, maxTokens, model);
        console.log('[RC V2] Other result length: ' + otherResult.length);
      }

      // STEP 3: Combine results - structure FIRST, then other results
      var combinedAnalysis = '';
      if (structureResult) {
        combinedAnalysis = '## Structure Overview\n\n' + structureResult + '\n\n';
      }
      if (otherResult) {
        combinedAnalysis += otherResult;
      }

      console.log('[RC V2] Combined analysis length: ' + combinedAnalysis.length);
      console.log('[RC V2] Combined analysis preview: ' + combinedAnalysis.substring(0, 500));

      displayAnalysisResults(combinedAnalysis);

    } catch (error) {
      console.error('[RC V2] Analysis error:', error);
      var errorMsg = 'Error analyzing article: ' + error.message;
      console.error('[RC V2] Full error:', error);
      alert(errorMsg);
    } finally {
      isLoading = false;
      document.getElementById('rc-teacher-loading').style.display = 'none';
      document.getElementById('rc-teacher-content').style.display = 'block';
    }
  }

  // Helper: Call API with correct format for each provider
  async function callAPI(provider, apiKey, prompt, maxTokens, model) {
    var messageType = provider === 'gemini' ? 'CALL_GEMINI' : 'CALL_DEEPSEEK';
    var messageData = provider === 'gemini'
      ? {
          glmApiKey: apiKey,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens
        }
      : {
          glmApiKey: apiKey,
          model: model || 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens
        };

    var response = await chrome.runtime.sendMessage({
      type: messageType,
      data: messageData
    });

    console.log('[RC V2] API call completed, success: ' + response.success);

    if (!response.success) {
      console.error('[RC V2] API Error:', response.error);
      throw new Error(response.error);
    }

    // Handle both DeepSeek and Gemini response formats
    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message?.content || '';
    } else if (response.data.candidates && response.data.candidates[0]) {
      return response.data.candidates[0].content?.parts?.[0]?.text || '';
    } else {
      console.error('[RC V2] Unexpected response format:', response.data);
      throw new Error('Invalid response format from API');
    }
  }

  // Display analysis results
  function displayAnalysisResults(analysis) {
    console.log('[RC V2] displayAnalysisResults, input length:', analysis.length);
    console.log('[RC V2] First 3000 chars:', analysis.substring(0, 3000));

    var sectionMap = {};

    // Strategy 1: Split by ## or ### headers (works even at start of string)
    var sectionBlocks = analysis.split(/(?:^|\n)#{1,3}\s+/);

    sectionBlocks.forEach(function(block) {
      if (!block.trim()) return;

      var lines = block.split('\n');
      var header = lines[0].toLowerCase().trim();
      var content = lines.slice(1).join('\n').trim();

      if (!content) return;

      console.log('[RC V2] Parsing section header:', JSON.stringify(header));

      if (header.includes('key view') || header.includes('insight') || header.includes('key ideas') || header.includes('main point') || header.includes('argument')) {
        sectionMap['key-insights'] = content;
      } else if (header.includes('structure') || header.includes('overview') || header.includes('outline') || header.includes('content block')) {
        sectionMap['structure'] = content;
      } else if (header.includes('quote') || header.includes('powerful') || header.includes('impactful') || header.includes('passage') || header.includes('excerpt') || header.includes('memorable')) {
        sectionMap['quotes'] = content;
      } else if (header.includes('recommend') || header.includes('reading') || header.includes('further')) {
        sectionMap['recommend'] = content;
      } else {
        // Unknown header: try to assign by content heuristics
        if (!sectionMap['_unmatched']) sectionMap['_unmatched'] = '';
        sectionMap['_unmatched'] += '\n\n' + block;
      }
    });

    console.log('[RC V2] After header split, sectionMap keys:', Object.keys(sectionMap));

    // Strategy 2: If quotes NOT found, look for numbered bold lines (N. **passage**)
    if (!sectionMap['quotes']) {
      if (analysis.match(/^\d+\.\s+\*\*/m)) {
        // Find the section that contains numbered bold items
        var quoteSection = analysis.match(/(?:Most Impactful|Passages?|Quotes?)[^\n]*\n([\s\S]+?)(?=\n#{1,3}\s|\n## |\Z)/i);
        if (quoteSection) {
          sectionMap['quotes'] = quoteSection[1].trim();
          console.log('[RC V2] Found quotes via regex search');
        } else {
          // No clear section header — if most of the text contains numbered bold items, treat as quotes
          var boldCount = (analysis.match(/^\d+\.\s+\*\*/gm) || []).length;
          if (boldCount >= 3) {
            sectionMap['quotes'] = analysis;
            console.log('[RC V2] Treating whole text as quotes (boldCount=' + boldCount + ')');
          }
        }
      }
    }

    // Strategy 3: If structure not found, look for numbered headings (**1. Title**)
    if (!sectionMap['structure']) {
      var structureLines = analysis.match(/\*\*\d+\.\s+[^*]+\*\*/g);
      if (structureLines && structureLines.length >= 3 && !sectionMap['quotes']) {
        sectionMap['structure'] = analysis;
        console.log('[RC V2] Found structure via **N. Title** pattern');
      }
    }

    console.log('[RC V2] Final sectionMap keys:', Object.keys(sectionMap));

    // Strategy 4: Smart assignment for _unmatched content
    // If we have _unmatched text but some sections are already filled,
    // try to split unmatched by content patterns
    if (sectionMap['_unmatched'] && sectionMap['_unmatched'].length > 50) {
      var unmatched = sectionMap['_unmatched'];

      // If key-insights is empty and unmatched looks like analysis/summary → assign it
      if (!sectionMap['key-insights'] && (
        /core thesis|main argument|key takeaway|takeaway|thesis|supporting evidence|what should/i.test(unmatched) ||
        !/\*\*\d+\.\s+/m.test(unmatched)
      )) {
        sectionMap['key-insights'] = unmatched;
        console.log('[RC V2] Assigned unmatched → key-insights (heuristic)');
      }

      // If structure is empty and unmatched has numbered bold headings → assign it
      if (!sectionMap['structure'] && /\*\*\d+\.\s+[^*]+\*\*/.test(unmatched)) {
        sectionMap['structure'] = unmatched;
        console.log('[RC V2] Assigned unmatched → structure (numbered pattern)');
      }

      // If quotes is empty and unmatched has numbered bold passages → assign it
      if (!sectionMap['quotes'] && /^\d+\.\s+\*\*/m.test(unmatched)) {
        sectionMap['quotes'] = unmatched;
        console.log('[RC V2] Assigned unmatched → quotes (passage pattern)');
      }

      // If still leftover unmatched after all heuristics → dump to key-insights
      if (sectionMap['_unmatched'] && sectionMap['_unmatched'].length > 0 &&
          !sectionMap['key-insights']) {
        sectionMap['key-insights'] = sectionMap['_unmatched'];
        sectionMap['_unmatched'] = '';
        console.log('[RC V2] Assigned remaining unmatched → key-insights (fallback)');
      }
    }

    // Render matched sections
    if (sectionMap['key-insights']) {
      document.getElementById('rc-key-insights').innerHTML = formatContent(sectionMap['key-insights']);
    }
    if (sectionMap['structure']) {
      document.getElementById('rc-structure-overview').innerHTML = formatContent(sectionMap['structure']);
    }
    if (sectionMap['quotes']) {
      document.getElementById('rc-powerful-quotes').innerHTML = formatQuotes(sectionMap['quotes']);
    }
    if (sectionMap['recommend']) {
      document.getElementById('rc-recommendations').innerHTML = formatLinks(sectionMap['recommend']);
    }

    // FALLBACK: if NOTHING matched at all, dump combined text into key-insights
    var anyMatched = sectionMap['key-insights'] || sectionMap['structure'] || sectionMap['quotes'] || sectionMap['recommend'];
    if (!anyMatched) {
      console.warn('[RC V2] No sections matched — falling back to raw display');
      document.getElementById('rc-key-insights').innerHTML = formatContent(analysis);
    }
  }

  // Format content with proper HTML
  function formatContent(text) {
    // First convert bold to strong
    var result = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Handle headers
    result = result.replace(/^#{1,6}\s+(.+)$/gm, '<h4>$1</h4>');

    // Handle standalone bold titles (titles on their own line)
    // A bold title followed by a paragraph (not another bold)
    result = result.replace(/^(<strong>.*?<\/strong>)\s*\n\s*(?!\s*<)/gm, '$1<br>');

    // Handle list items
    result = result.replace(/^- (.+)$/gm, '<li>$1</li>');
    result = result.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Convert remaining newlines
    result = result.replace(/\n\n/g, '</p><p>');
    result = result.replace(/\n/g, '<br>');

    return result;
  }

  // Format links in recommendations
  function formatLinks(text) {
    var linkRegex = /(https?:\/\/[^\s\)]+)/g;
    return text
      .replace(linkRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }

  // Format powerful quotes - handle "1. **passage**\n_note_" format
  function formatQuotes(text) {
    var result = text;

    // ── Normalise line endings ──
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // ── Strip any legacy labels the AI might still emit ──
    result = result.replace(/\*\*(The Passage|Passage|Note|One-line note|Why it['']s valuable|Why this stands out):\*\*\s*/gi, '');
    result = result.replace(/(The Passage|Passage|Note):\s*/gi, '');

    // ── Strip markdown headers like "### 1." ──
    result = result.replace(/^#{1,3}\s*\d+\.\s*$/gm, '');

    // ── Parse each numbered entry: "N. **bold text** \n _italic note_" ──
    // Matches: optional whitespace, digit(s), dot, space,
    //          bold passage (possibly multi-sentence),
    //          then an optional italic note on a following line.
    var html = '';
    // Split on numbered items at the start of a line
    var blocks = result.split(/\n(?=\d+\.\s)/);

    blocks.forEach(function(block) {
      block = block.trim();
      if (!block) return;

      // Try to match "N. **passage** \n _note_"
      var m = block.match(/^\d+\.\s+\*\*([\s\S]+?)\*\*\s*\n\s*_([^\n_]+)_/);
      if (m) {
        var passage = m[1].trim();
        var note    = m[2].trim();
        html += '<div class="rc-quote">' +
                  '<p class="rc-quote-passage"><strong>' + escapeHtml(passage) + '</strong></p>' +
                  '<p class="rc-note"><em>' + escapeHtml(note) + '</em></p>' +
                '</div>';
        return;
      }

      // Fallback A: "N. **passage**" with no italic note
      var mBold = block.match(/^\d+\.\s+\*\*([\s\S]+?)\*\*/);
      if (mBold) {
        var passage = mBold[1].trim();
        // Grab anything after the closing ** as a note (might be plain text)
        var remainder = block.slice(block.indexOf(mBold[0]) + mBold[0].length).trim();
        // Strip leading colon / dash
        remainder = remainder.replace(/^[:\-–—]\s*/, '');
        html += '<div class="rc-quote">' +
                  '<p class="rc-quote-passage"><strong>' + escapeHtml(passage) + '</strong></p>' +
                  (remainder ? '<p class="rc-note"><em>' + escapeHtml(remainder) + '</em></p>' : '') +
                '</div>';
        return;
      }

      // Fallback B: "N. plain passage\n_note_" (AI forgot bold)
      var mPlain = block.match(/^\d+\.\s+([\s\S]+?)(?:\n\s*_([^\n_]+)_)?$/);
      if (mPlain) {
        var passage = mPlain[1].trim().replace(/^[""]|[""]$/g, ''); // strip surrounding quotes
        var note    = mPlain[2] ? mPlain[2].trim() : '';
        html += '<div class="rc-quote">' +
                  '<p class="rc-quote-passage"><strong>' + escapeHtml(passage) + '</strong></p>' +
                  (note ? '<p class="rc-note"><em>' + escapeHtml(note) + '</em></p>' : '') +
                '</div>';
        return;
      }

      // Last resort: render as plain paragraph
      if (block) {
        html += '<p>' + escapeHtml(block) + '</p>';
      }
    });

    return html || '<p>' + escapeHtml(result) + '</p>';
  }

  // Send chat message
  async function sendChatMessage() {
    var input = document.getElementById('rc-chat-input');
    var message = input.value.trim();

    if (!message) return;

    var messagesContainer = document.getElementById('rc-chat-messages');
    var userMessage = document.createElement('div');
    userMessage.className = 'rc-message rc-message-user';
    userMessage.innerHTML = '<div class="rc-message-content"><p>' + escapeHtml(message) + '</p></div><div class="rc-message-avatar">Y</div>';
    messagesContainer.appendChild(userMessage);

    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    var loadingMessage = document.createElement('div');
    loadingMessage.className = 'rc-message rc-message-ai';
    loadingMessage.id = 'rc-chat-loading';
    loadingMessage.innerHTML = '<div class="rc-message-avatar">RC</div><div class="rc-message-content"><p>Thinking&hellip;</p></div>';
    messagesContainer.appendChild(loadingMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      var settings = await chrome.storage.local.get(['apiProvider', 'deepseekApiKey', 'geminiApiKey', 'deepseekModel']);

      var provider = settings.apiProvider || 'deepseek';
      var apiKey = provider === 'gemini' ? settings.geminiApiKey : settings.deepseekApiKey;
      var model = provider === 'gemini' ? undefined : (settings.deepseekModel || 'deepseek-chat');

      if (!apiKey) {
        throw new Error('Please set your ' + (provider === 'gemini' ? 'Gemini' : 'DeepSeek') + ' API key in the extension popup.');
      }

      var systemPrompt = 'You are a friendly and intelligent reading companion. Help the user understand and discuss an article. Be conversational and insightful.';

      var articleContext = 'Article: ' + (currentArticle?.title || 'Unknown') + '\nContent: ' + (currentArticle?.textContent?.substring(0, 2000) || 'No content') + '\n\nRespond concisely.';

      var messageType = provider === 'gemini' ? 'CALL_GEMINI' : 'CALL_DEEPSEEK';
      var messageData = provider === 'gemini'
        ? {
            glmApiKey: apiKey,
            messages: [
              { role: 'user', parts: [{ text: systemPrompt }] },
              { role: 'user', parts: [{ text: articleContext + '\n\nUser question: ' + message }] }
            ],
            temperature: 0.8,
            max_tokens: 1000
          }
        : {
            glmApiKey: apiKey,
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: articleContext + '\n\nUser question: ' + message }
            ],
            temperature: 0.8,
            max_tokens: 1000
          };

      var response = await chrome.runtime.sendMessage({
        type: messageType,
        data: messageData
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      var aiResponse = response.data.choices[0].message.content;

      loadingMessage.innerHTML = '<div class="rc-message-avatar">RC</div><div class="rc-message-content"><p>' + aiResponse.replace(/\n/g, '<br>') + '</p></div>';

    } catch (error) {
      console.error('Chat error:', error);
      loadingMessage.innerHTML = '<div class="rc-message-avatar">RC</div><div class="rc-message-content"><p style="color: #888;">Error: ' + escapeHtml(error.message) + '</p></div>';
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Escape HTML
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Message listener
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'TOGGLE_SIDEBAR') {
      toggleSidebar();
      sendResponse({ success: true });
    }
    return true;
  });

  chrome.storage.local.get(['_autoOpenSidebar'], function(result) {
    if (result._autoOpenSidebar) {
      chrome.storage.local.remove('_autoOpenSidebar');
      setTimeout(function() {
        if (!sidebarVisible) toggleSidebar();
      }, 300);
    }
  });

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && (
      changes.apiProvider ||
      changes.deepseekApiKey ||
      changes.geminiApiKey ||
      changes.geminiModel
    )) {
      currentArticle = null;
    }
  });

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  // Inject styles
  var style = document.createElement('style');
  style.id = 'rc-v2-styles';
  style.textContent = getSidebarStyles();
  (document.head || document.documentElement).appendChild(style);

  // Create and append sidebar
  sidebarElement = createSidebar();
  document.body.appendChild(sidebarElement);

  // Bind events AFTER DOM is ready
  setupEventListeners();

  window.toggleReadingCompanion = toggleSidebar;
  console.log('[RC V2] Content script loaded successfully, sidebar ready');

  // ── Sidebar Styles ──────────────────────────────────────────────
  function getSidebarStyles() {
    return [
      "@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap');",
      "",
      "#reading-companion-sidebar {",
      "  position: fixed;",
      "  top: 0; right: -440px;",
      "  width: 420px;",
      "  height: 100vh;",
      "  background: #fafafa;",
      "  border-left: 1px solid #e0e0e0;",
      "  z-index: 2147483647;",
      "  font-family: 'Source Serif 4', 'Crimson Pro', Georgia, serif;",
      "  display: flex; flex-direction: column;",
      "  transition: right .35s cubic-bezier(.4,0,.2,1);",
      "  overflow: hidden;",
      "}",
      "#reading-companion-sidebar.rc-visible { right: 0; }",
      ".rc-header {",
      "  display: flex; justify-content: space-between; align-items: center;",
      "  padding: 24px 28px 20px; border-bottom: 1px solid #e8e8e8; background: #fafafa;",
      "}",
      ".rc-logo { display: flex; align-items: baseline; gap: 10px; }",
      ".rc-logo-text {",
      "  font-family: 'Crimson Pro', Georgia, serif;",
      "  font-size: 18px; font-weight: 500; letter-spacing: .02em;",
      "  color: #1a1a1a; text-transform: uppercase; font-variant: small-caps;",
      "}",
      ".rc-header-actions { display: flex; align-items: center; gap: 2px; }",
      ".rc-settings-btn, .rc-close-btn {",
      "  background: none; border: none; color: #999;",
      "  font-size: 18px; cursor: pointer; padding: 4px 8px;",
      "  line-height: 1; transition: color .2s; font-family: Georgia, serif;",
      "}",
      ".rc-close-btn { font-size: 22px; }",
      ".rc-settings-btn:hover, .rc-close-btn:hover { color: #333; }",
      ".rc-settings-panel {",
      "  display: none; border-bottom: 1px solid #e8e8e8; background: #fafafa;",
      "  max-height: 0; overflow: hidden; transition: max-height .3s ease;",
      "}",
      ".rc-settings-panel.open { display: block; max-height: 500px; }",
      ".rc-settings-inner { padding: 20px 28px; }",
      ".rc-settings-inner h3 {",
      "  font-family: 'Source Serif 4', Georgia, serif; font-size: 14px;",
      "  font-weight: 600; color: #1a1a1a; margin: 0 0 16px;",
      "  text-transform: uppercase; letter-spacing: .08em;",
      "}",
      ".rc-settings-row { margin-bottom: 12px; }",
      ".rc-settings-row label {",
      "  display: block; font-size: 10px; text-transform: uppercase;",
      "  letter-spacing: .08em; color: #888; margin-bottom: 4px;",
      "}",
      ".rc-settings-row select, .rc-settings-row input {",
      "  width: 100%; padding: 6px 10px;",
      "  font-family: sans-serif; font-size: 12px;",
      "  border: 1px solid #ccc; background: #fff; color: #333;",
      "  outline: none; box-sizing: border-box;",
      "}",
      ".rc-settings-row select:focus, .rc-settings-row input:focus { border-color: #1a1a1a; }",
      ".rc-settings-actions { display: flex; gap: 8px; margin-top: 14px; }",
      ".rc-settings-hint { font-size: 11px; color: #888; margin: 8px 0 0; font-style: italic; }",
      ".rc-settings-hint.success { color: #3a7d44; }",
      ".rc-settings-hint.error { color: #c0392b; }",
      ".rc-tabs {",
      "  display: flex; padding: 0 28px; gap: 24px;",
      "  border-bottom: 1px solid #e8e8e8; background: #fafafa;",
      "}",
      ".rc-tab {",
      "  flex: none; padding: 14px 0; border: none; background: transparent;",
      "  cursor: pointer; font-family: 'Crimson Pro', Georgia, serif;",
      "  font-size: 13px; font-weight: 400; letter-spacing: .08em;",
      "  text-transform: uppercase; color: #aaa; position: relative; transition: color .2s;",
      "}",
      ".rc-tab.active { color: #1a1a1a; font-weight: 500; }",
      ".rc-tab.active::after {",
      "  content: ''; position: absolute; bottom: -1px; left: 0; right: 0;",
      "  height: 2px; background: #1a1a1a;",
      "}",
      ".rc-tab:hover { color: #555; }",
      ".rc-content {",
      "  flex: 1; overflow-y: auto; padding: 24px 28px 28px;",
      "  scrollbar-width: thin; scrollbar-color: #ddd transparent;",
      "}",
      ".rc-content::-webkit-scrollbar { width: 4px; }",
      ".rc-content::-webkit-scrollbar-track { background: transparent; }",
      ".rc-content::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }",
      ".rc-section { display: none; }",
      ".rc-section.active { display: block; }",
      ".rc-loading {",
      "  display: none; flex-direction: column; align-items: center;",
      "  justify-content: center; padding: 80px 20px; color: #888;",
      "}",
      ".rc-spinner {",
      "  width: 24px; height: 24px; border: 1.5px solid #e0e0e0;",
      "  border-top-color: #333; border-radius: 50%;",
      "  animation: rc-spin .8s linear infinite; margin-bottom: 16px;",
      "}",
      "@keyframes rc-spin { to { transform: rotate(360deg); } }",
      ".rc-loading p { font-size: 13px; letter-spacing: .04em; color: #888; }",
      ".rc-card {",
      "  margin-bottom: 32px; padding-bottom: 28px; border-bottom: 1px solid #e8e8e8;",
      "}",
      ".rc-card:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }",
      ".rc-card h3 {",
      "  margin: 0 0 14px; font-family: 'Crimson Pro', Georgia, serif;",
      "  font-size: 11px; font-weight: 500; letter-spacing: .12em;",
      "  text-transform: uppercase; color: #888;",
      "}",
      ".rc-card-content {",
      "  font-size: 15px; line-height: 1.75; color: #2a2a2a;",
      "  font-family: 'Crimson Pro', Georgia, serif;",
      "}",
      ".rc-card-content h4 {",
      "  margin: 16px 0 8px; font-family: 'Crimson Pro', Georgia, serif;",
      "  font-size: 15px; font-weight: 600; color: #1a1a1a;",
      "}",
      ".rc-card-content strong {",
      "  display: block; margin: 20px 0 8px; font-size: 15px;",
      "  font-weight: 600; color: #1a1a1a; font-family: 'Crimson Pro', Georgia, serif;",
      "}",
      ".rc-card-content strong:first-child { margin-top: 0; }",
      ".rc-card-content ul { margin: 10px 0; padding-left: 0; list-style: none; }",
      ".rc-card-content li {",
      "  margin-bottom: 10px; padding-left: 16px; position: relative;",
      "}",
      ".rc-card-content li::before { content: '\\2014'; position: absolute; left: 0; color: #ccc; }",
      ".rc-card-content p { margin: 10px 0; }",
      ".rc-placeholder { color: #bbb; font-style: italic; font-size: 14px; }",
      ".rc-quote {",
      "  margin: 12px 0; padding: 14px 18px; border-left: 2px solid #333;",
      "  background: rgba(0,0,0,.02); color: #333; font-size: 14px; line-height: 1.7;",
      "}",
      ".rc-quote-passage { margin: 0 0 6px; font-weight: 400; color: #1a1a1a; line-height: 1.65; }",
      ".rc-quote-passage strong { font-weight: 700; }",
      ".rc-note { display: block; margin: 4px 0 0; font-weight: 400; font-style: italic; color: #888; font-size: 13px; }",
      ".rc-top-actions { padding: 16px 20px; border-bottom: 1px solid #eee; }",
      ".rc-analyze-btn-top { width: 100%; padding: 12px; font-size: 15px; }",
      ".rc-actions { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8e8e8; }",
      ".rc-btn {",
      "  width: 100%; padding: 14px 20px; border: 1px solid #1a1a1a;",
      "  background: #1a1a1a; color: #fafafa;",
      "  font-family: 'Crimson Pro', Georgia, serif; font-size: 12px;",
      "  font-weight: 500; letter-spacing: .1em; text-transform: uppercase;",
      "  cursor: pointer; transition: all .2s;",
      "}",
      ".rc-btn:hover { background: #333; border-color: #333; }",
      ".rc-btn:disabled { opacity: .4; cursor: not-allowed; }",
      ".rc-chat-container {",
      "  display: flex; flex-direction: column; height: calc(100vh - 160px);",
      "}",
      ".rc-chat-messages {",
      "  flex: 1; overflow-y: auto; padding: 4px 0;",
      "  scrollbar-width: thin; scrollbar-color: #ddd transparent;",
      "}",
      ".rc-chat-messages::-webkit-scrollbar { width: 4px; }",
      ".rc-chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }",
      ".rc-message { display: flex; gap: 12px; margin-bottom: 20px; align-items: flex-start; }",
      ".rc-message-user { flex-direction: row-reverse; }",
      ".rc-message-avatar {",
      "  width: 28px; height: 28px; border-radius: 50%;",
      "  background: #f0f0f0; border: 1px solid #e0e0e0;",
      "  display: flex; align-items: center; justify-content: center;",
      "  font-size: 14px; flex-shrink: 0;",
      "}",
      ".rc-message-ai .rc-message-avatar { background: #1a1a1a; border-color: #1a1a1a; color: #fafafa; font-size: 12px; }",
      ".rc-message-content { max-width: 78%; font-size: 14px; line-height: 1.65; color: #2a2a2a; }",
      ".rc-message-user .rc-message-content {",
      "  background: #f0f0f0; padding: 10px 14px; color: #1a1a1a;",
      "  border-radius: 16px 4px 16px 16px;",
      "}",
      ".rc-chat-input-area {",
      "  display: flex; gap: 10px; padding-top: 16px;",
      "  margin-top: 8px; border-top: 1px solid #e8e8e8;",
      "}",
      ".rc-chat-input-area textarea {",
      "  flex: 1; padding: 12px 14px; border: 1px solid #ddd;",
      "  background: #fff; border-radius: 4px; resize: none;",
      "  font-family: 'Source Serif 4', Georgia, serif;",
      "  font-size: 14px; line-height: 1.5; color: #1a1a1a; transition: border-color .2s;",
      "}",
      ".rc-chat-input-area textarea:focus { outline: none; border-color: #999; }",
      ".rc-chat-input-area textarea::placeholder { color: #bbb; font-style: italic; }",
      ".rc-btn-send {",
      "  width: auto; padding: 12px 18px; background: #1a1a1a; color: #fafafa;",
      "  border: none; font-family: 'Crimson Pro', Georgia, serif;",
      "  font-size: 11px; font-weight: 500; letter-spacing: .08em;",
      "  text-transform: uppercase; cursor: pointer; transition: background .2s;",
      "}",
      ".rc-btn-send:hover { background: #444; }",
    ].join('\n');
  }
})();
