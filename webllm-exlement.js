

class ChatWebLLMComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.worker = null;
        this.modelLoaded = false;
        this.currentModel = null;
        this.availableModels = [
            "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
            "Llama-2-7b-chat-hf-q4f32_1",
            "RedPajama-INCITE-Chat-3B-v1-q4f32_1",
            "gemma-2-2b-it-q4f16_1-MLC",
            "Phi-3-mini-4k-instruct-q4f16_1-MLC"
        ];
    }

    static get observedAttributes() {
        return ['model', 'temperature', 'top-p'];
    }


    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initializeWorker();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this[name] = newValue;
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            positon: relative
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            background-color: #f9f9f9;
          }
          .chat-container {
            display: flex;
            flex-direction: column;
            height: 600px;
          }
          .model-selection {
            margin-bottom: 20px;
          }
          select, button {
            padding: 10px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
          }
          select {
            background-color: #fff;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          button {
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          button:hover {
            background-color: #45a049;
          }
          button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
          .chat-box {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 20px;
            max-width: 80%;
          }
          .user {
            background-color: #E3F2FD;
            align-self: flex-end;
            margin-left: auto;
          }
          .assistant {
            background-color: #F1F8E9;
            align-self: flex-start;
          }
          .chat-input {
            display: flex;
            margin-top: 20px;
          }
          input {
            flex: 1;
            padding: 10px;
            font-size: 16px;
            border: none;
            border-radius: 5px 0 0 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          }
          #send {
            border-radius: 0 5px 5px 0;
          }
          .status {
            text-align: center;
            margin-top: 10px;
            font-style: italic;
            color: #666;
          }
          .message code {
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
        }
        .message pre {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          position: relative;
        }
        .message pre code {
          background-color: transparent;
          padding: 0;
        }
        .message ul, .message ol {
          margin-left: 20px;
        }
        .message strong {
          font-weight: bold;
        }
        .message em {
          font-style: italic;
        }
        .copy-button {
          position: absolute;
          top: 5px;
          right: 5px;
          padding: 2px 5px;
          background-color: #ddd;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        .copy-button:hover {
          background-color: #ccc;
        }
        .chat-input-container {
          display: flex;
          align-items: center;
          margin-top: 20px;
        }
        .input-wrapper {
          flex-grow: 1;
          display: flex;
          align-items: center;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 5px;
        }
        .editable-area {
          flex-grow: 1;
          min-height: 20px;
          max-height: 150px;
          overflow-y: auto;
          padding: 5px;
          outline: none;
        }
        .editable-area[contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #888;
        }
        .upload-button, .model-select-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
        }
        .model-selector {
          margin-left: 10px;
        }
        .model-select-button {
          display: flex;
          align-items: center;
          gap: 5px;
        }
       .model-dropdown {
          margin-top: 5px;
          position: relative;
          display: inline-block;
        }
        .model-dropdown-content {
          display: none;
          position: absolute;
          background-color: #f9f9f9;
          min-width: 160px;
          box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
          z-index: 1;
        }
        .model-dropdown-content a {
          color: black;
          padding: 12px 16px;
          text-decoration: none;
          display: block;
        }
        .model-dropdown-content a:hover {
          background-color: #f1f1f1;
        }
        .show {
          display: block;
        }
        .hidden-file-input {
          display: none;
        }
      #load-model {
        position: absolute;  
        top: 100px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.3s;
        z-index: 1000;
      }
        
        #load-model:hover {
            background-color: #45a049;
        }

        #load-model svg {
            width: 30px;
            height: 30px;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        #load-model.loading svg {
            animation: rotate 2s linear infinite;
        }
      </style>
      <div class="chat-container">
        <div class="chat-box" id="chat-box"></div>
        <div class="chat-input-container">
          <div class="input-wrapper">
            <div class="editable-area" contenteditable="true" role="textbox" aria-label="Write your message to exlement">
              <p data-placeholder="Reply to exlement..."></p>
            </div>
            <input type="file" class="hidden-file-input" accept=".txt,.md,.js,.html,.css,.json">
            <button class="upload-button" aria-label="Upload content">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M209.66,122.34a8,8,0,0,1,0,11.32l-82.05,82a56,56,0,0,1-79.2-79.21L147.67,35.73a40,40,0,1,1,56.61,56.55L105,193A24,24,0,1,1,71,159L154.3,74.38A8,8,0,1,1,165.7,85.6L82.39,170.31a8,8,0,1,0,11.27,11.36L192.93,81A24,24,0,1,0,159,47L59.76,147.68a40,40,0,1,0,56.53,56.62l82.06-82A8,8,0,0,1,209.66,122.34Z"></path>
              </svg>
            </button>
          </div>
         
        </div>
        <div class="model-dropdown">
            <button class="model-select-button" aria-haspopup="menu" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139 34" height="11.5" fill="currentColor" aria-label="exlement">
                    <!-- Add your SVG path data here for the exlement logo -->
                </svg>
                <span class="current-model">No model loaded</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
            </button>
            <div class="model-dropdown-content">
                ${this.availableModels.map(model => `<a href="#" data-model="${model}">${model}</a>`).join('')}
            </div>
        </div>
        <div class="status" id="status"></div>
      </div>
      <button id="load-model" aria-label="Load Model">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
    </button>
    `;
    }


    setupEventListeners() {
        const loadModelBtn = this.shadowRoot.getElementById('load-model');
        const editableArea = this.shadowRoot.querySelector('.editable-area');
        const uploadButton = this.shadowRoot.querySelector('.upload-button');
        const fileInput = this.shadowRoot.querySelector('.hidden-file-input');
        const modelSelectButton = this.shadowRoot.querySelector('.model-select-button');
        const modelDropdownContent = this.shadowRoot.querySelector('.model-dropdown-content');
        this.button = this.shadowRoot.querySelector('.model-select-button');
        this.dropdown = this.shadowRoot.querySelector('.model-dropdown-content');
        this.currentModelSpan = this.shadowRoot.querySelector('.current-model');

        this.button.addEventListener('click', this.toggleDropdown.bind(this));
        this.dropdown.addEventListener('click', this.handleSelection.bind(this));



        loadModelBtn.addEventListener('click', (e) => {
            e.target.classList.add('loading');
            this.initializeModel();
        });

        editableArea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.onMessageSend();
            }
        });

        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    this.insertContentIntoEditableArea(content);
                };
                reader.readAsText(file);
            }
        });

        modelSelectButton.addEventListener('click', () => {
            modelDropdownContent.classList.toggle('show');
        });

        modelDropdownContent.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                const selectedModel = event.target.getAttribute('data-model');
                this.changeModel(selectedModel);
                modelDropdownContent.classList.remove('show');
            }
        });

        // Close the dropdown if clicked outside
        window.addEventListener('click', (event) => {
            if (!event.target.matches('.model-select-button')) {
                modelDropdownContent.classList.remove('show');
            }
        });
    }

    handleSelection(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            this.currentModelSpan.textContent = e.target.textContent;
            this.button.setAttribute('aria-expanded', 'false');
            this.dropdown.style.display = 'none';
        }
    }


    toggleDropdown() {
        const expanded = this.button.getAttribute('aria-expanded') === 'true';
        this.button.setAttribute('aria-expanded', !expanded);
        this.dropdown.style.display = expanded ? 'none' : 'block';
    }


    insertContentIntoEditableArea(content) {
        const editableArea = this.shadowRoot.querySelector('.editable-area');
        editableArea.textContent = content;
    }
    changeModel(newModel) {
        this.currentModel = newModel;
        this.updateModelDisplay();
        this.modelLoaded = false;
        this.initializeModel();
    }

    updateModelDisplay() {
        const currentModelSpan = this.shadowRoot.querySelector('.current-model');
        currentModelSpan.textContent = this.currentModel || "No model loaded";
    }

    initializeModel() {

        this.currentModel = this.currentModel ?? this.getAttribute('model');
        if (!this.currentModel) {
            this.shadowRoot.getElementById('status').textContent = 'Please select a model first.';
            return;
        }

        const statusEl = this.shadowRoot.getElementById('status');
        statusEl.textContent = 'Initializing...';

        this.worker.postMessage({
            type: 'INIT_MODEL',
            data: {
                model: this.currentModel,
                temperature: parseFloat(this.getAttribute('temperature') || '1.0'),
                top_p: parseFloat(this.getAttribute('top-p') || '1'),
            },
        });
    }

    onModelLoaded(modelName) {
        this.modelLoaded = true;
        this.currentModel = modelName;
        this.updateModelDisplay();
        this.shadowRoot.getElementById('load-model').style.display= 'none';
        this.shadowRoot.getElementById('status').textContent = `Model ${modelName} loaded successfully!`;
    }

    initializeWorker() {
        const webworkerScript = `
        import * as webllm from "https://esm.run/@mlc-ai/web-llm";
  
        let engine;
        let modelLoaded = false;
  
        self.addEventListener('message', async (event) => {
          const { type, data } = event.data;
  
          switch (type) {
            case 'INIT_MODEL':
              try {
                engine = new webllm.MLCEngine();
                await engine.reload(data.model, {
                  temperature: data.temperature,
                  top_p: data.top_p,
                });
                modelLoaded = true;
                self.postMessage({ type: 'MODEL_LOADED' });
              } catch (error) {
                self.postMessage({ type: 'ERROR', error: error.message });
              }
              break;
  
            case 'GENERATE':
              if (!modelLoaded) {
                self.postMessage({ type: 'ERROR', error: 'Model not loaded' });
                return;
              }
  
              try {
                const completion = await engine.chat.completions.create({
                  stream: true,
                  messages: data.messages,
                  stream_options: { include_usage: true },
                });
  
                for await (const chunk of completion) {
                  const curDelta = chunk.choices[0]?.delta.content;
                  if (curDelta) {
                    self.postMessage({ type: 'UPDATE', content: curDelta });
                  }
                  if (chunk.usage) {
                    self.postMessage({ type: 'USAGE', usage: chunk.usage });
                  }
                }
  
                const finalMessage = await engine.getMessage();
                self.postMessage({ type: 'FINISH', content: finalMessage });
              } catch (error) {
                self.postMessage({ type: 'ERROR', error: error.message });
              }
              break;
          }
        });
      `;

        const blob = new Blob([webworkerScript], { type: "application/javascript" });
        this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });

        this.worker.onmessage = (event) => {
            const { type, content, error, usage } = event.data;
            switch (type) {
                case 'MODEL_LOADED':
                    this.onModelLoaded(this.currentModel);
                    break;
                case 'UPDATE':
                    this.updateLastMessage(content);
                    break;
                case 'FINISH':
                    this.finishGenerating(content);
                    break;
                case 'USAGE':
                    this.updateUsage(usage);
                    break;
                case 'ERROR':
                    console.error('Worker error:', error);
                    this.shadowRoot.getElementById('status').textContent = `Error: ${error}`;
                    break;
            }
        };
    }


    onMessageSend() {
        if (!this.modelLoaded) return;

        const editableArea = this.shadowRoot.querySelector('.editable-area');
        const input = editableArea.textContent.trim();
        if (input.length === 0) return;

        const message = { content: input, role: 'user' };
        this.appendMessage(message);

        editableArea.textContent = '';
        editableArea.setAttribute('data-placeholder', 'Generating...');
        this.shadowRoot.querySelector('.upload-button').disabled = true;
        this.shadowRoot.querySelector('.model-select-button').disabled = true;

        const aiMessage = { content: 'typing...', role: 'assistant' };
        this.appendMessage(aiMessage);

        this.worker.postMessage({
            type: 'GENERATE',
            data: {
                messages: [
                    { content: "You are an expert UI in MUI Material for React", role: "system" },
                    message,
                ],
            },
        });
    }

    parseMarkdown(text) {
        // Convert markdown to HTML
        return text.replace(/`([^`]+)`/g, "<span><code>$1</code></span>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Unordered lists
            .replace(/^\s*[-*+]\s+(.+)$/gm, (match, p1) => `<li>${p1}</li>`)
            .replace(/(<li>.*<\/li>)(?=\s*[-*+]\s+|\s*$)/gm, "<ul>$&</ul>")
            // Ordered lists
            .replace(/^\s*(\d+)\.\s+(.+)$/gm, (match, p1, p2) => `<li>${p2}</li>`)
            .replace(/(<li>.*<\/li>)(?=\s*\d+\.\s+|\s*$)/gm, "<ol>$&</ol>")
            // Line breaks (only replace double newlines with <p> tags for paragraphs)
            .replace(/\n{2,}/g, "</p><p>")
            .replace(/^\s*<p>/, "<p>")
            .replace(/<\/p>\s*$/, "</p>")
            .replace(/\n/g, "<br>")
            // Code blocks - modified regex
            .replace(/```([\s\S]*?)```/g, (match, code) => {
                const lang = code.split('\n')[0].trim();
                const codeContent = code.replace(/^.*\n/, '').trim();
                return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(codeContent)}</code></pre>`;
            });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    appendMessage(message) {
        const chatBox = this.shadowRoot.getElementById('chat-box');
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', message.role);

        if (message.content !== 'typing...') {
            messageEl.innerHTML = this.parseMarkdown(message.content);
        } else {
            messageEl.textContent = this.parseMarkdown(message.content)
        }

        chatBox.appendChild(messageEl);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Add event listeners for copy buttons
        if (message.content !== 'typing...') {
            this.addCopyButtonListeners(messageEl);
        }
    }

    updateLastMessage(content) {
        const messages = this.shadowRoot.querySelectorAll('.message');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
            if (lastMessage.textContent === 'typing...') {
                lastMessage.innerHTML = '';
            }
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (index > 0) {

                    lastMessage.appendChild(document.createElement('br'));
                }
                const span = document.createElement('span');
                console.log("updateLastMessage", line)

                span.innerHTML = this.parseMarkdown(line);

                lastMessage.appendChild(span);
            });
            this.addCopyButtonListeners(lastMessage);
        }
    }


    finishGenerating(finalMessage) {
        const messages = this.shadowRoot.querySelectorAll('.message');
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.textContent === 'typing...') {
            lastMessage.innerHTML = this.parseMarkdown(finalMessage);
            this.addCopyButtonListeners(lastMessage);
        }
        this.shadowRoot.querySelector('.upload-button').disabled = false;
        this.shadowRoot.querySelector('.model-select-button').disabled = false;
        this.shadowRoot.querySelector('.editable-area').setAttribute('data-placeholder', 'Reply to exlement...');
    }

    addCopyButtonListeners(messageEl) {
        messageEl.querySelectorAll('pre').forEach(pre => {
            const copyButton = pre.querySelector('.copy-button');
            if (copyButton) {
                copyButton.addEventListener('click', () => {
                    const code = pre.querySelector('code');
                    navigator.clipboard.writeText(code.textContent);
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                });
            }
        });
    }

    updateUsage(usage) {
        const statusEl = this.shadowRoot.getElementById('status');
        statusEl.textContent = `Tokens - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens} | Speed - Prefill: ${usage.extra.prefill_tokens_per_s.toFixed(2)} t/s, Decoding: ${usage.extra.decode_tokens_per_s.toFixed(2)} t/s`;
    }
}


class SocialMediaContentGenerator extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.worker = null;
      this.modelLoaded = false;
      this.currentModel = null;
      this.availableModels = [
          "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
          "Llama-2-7b-chat-hf-q4f32_1",
          "RedPajama-INCITE-Chat-3B-v1-q4f32_1",
          "gemma-2-2b-it-q4f16_1-MLC",
          "Phi-3-mini-4k-instruct-q4f16_1-MLC"
      ];
      this.platforms = ['Twitter', 'Instagram', 'LinkedIn', 'Facebook'];
      this.hookStrategies = [
          'Intriguing Hook',
          'Direct Benefit Hook',
          'Numbers-Based Hook',
          'Pain Point Hook'
      ];
  }

  static get observedAttributes() {
      return ['model', 'temperature', 'top-p'];
  }

  connectedCallback() {
      this.render();
      this.setupEventListeners();
      this.initializeWorker();
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
          this[name] = newValue;
      }
  }
  
  render() {
    this.shadowRoot.innerHTML = `
    <style>
        :host {
            display: block;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .container {
            display: flex;
            gap: 20px;
        }
        .input-panel {
            flex: 1;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        }
        .output-panel {
            flex: 2;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        }
        h2 {
            margin-top: 0;
            color: #333;
        }
        select, input, textarea, button {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        textarea {
            height: 100px;
            resize: vertical;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #45a049;
        }
        button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        .chat-box {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background-color: #f9f9f9;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 10px;
            max-width: 100%;
        }
        .user {
            background-color: #E3F2FD;
            align-self: flex-end;
        }
        .assistant {
            background-color: #F1F8E9;
            align-self: flex-start;
        }
        .status {
            margin-top: 10px;
            font-style: italic;
            color: #666;
        }
        #load-model {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.3s;
            z-index: 1000;
        }
        #load-model:hover {
            background-color: #45a049;
        }
        #load-model svg {
            width: 30px;
            height: 30px;
        }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #load-model.loading svg {
            animation: rotate 2s linear infinite;
        }
    </style>
    <div class="container">
        <div class="input-panel">
            <h2>Content Generator</h2>
            <select id="model-select">
                ${this.availableModels.map(model => `<option value="${model}">${model}</option>`).join('')}
            </select>
            <select id="platform-select">
                ${this.platforms.map(platform => `<option value="${platform}">${platform}</option>`).join('')}
            </select>
            <select id="hook-strategy-select">
                ${this.hookStrategies.map(strategy => `<option value="${strategy}">${strategy}</option>`).join('')}
            </select>
            <input type="text" id="topic-input" placeholder="Enter topic/product/service">
            <textarea id="additional-info" placeholder="Additional information or context (optional)"></textarea>
            <button id="generate-button">Generate Post</button>
            <div class="status" id="status"></div>
        </div>
        <div class="output-panel">
            <h2>Generated Content</h2>
            <div class="chat-box" id="chat-box"></div>
        </div>
    </div>
    <button id="load-model" aria-label="Load Model">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path d="M9 12l2 2 4-4"></path>
        </svg>
    </button>
    `;
}

  setupEventListeners() {
      const loadModelBtn = this.shadowRoot.getElementById('load-model');
      const generateButton = this.shadowRoot.getElementById('generate-button');
      const modelSelect = this.shadowRoot.getElementById('model-select');

      loadModelBtn.addEventListener('click', () => {
          loadModelBtn.classList.add('loading');
          this.initializeModel();
      });

      generateButton.addEventListener('click', () => this.generatePost());

      modelSelect.addEventListener('change', (event) => {
          this.changeModel(event.target.value);
      });
  }

  changeModel(newModel) {
      this.currentModel = newModel;
      this.modelLoaded = false;
      this.initializeModel();
  }

  initializeModel() {
      this.currentModel = this.currentModel ?? this.shadowRoot.getElementById('model-select').value;
      if (!this.currentModel) {
          this.shadowRoot.getElementById('status').textContent = 'Please select a model first.';
          return;
      }

      const statusEl = this.shadowRoot.getElementById('status');
      statusEl.textContent = 'Initializing...';

      this.worker.postMessage({
          type: 'INIT_MODEL',
          data: {
              model: this.currentModel,
              temperature: parseFloat(this.getAttribute('temperature') || '0.7'),
              top_p: parseFloat(this.getAttribute('top-p') || '0.9'),
          },
      });
  }

  generatePost() {
      if (!this.modelLoaded) {
          this.shadowRoot.getElementById('status').textContent = 'Please load a model first.';
          return;
      }

      const platform = this.shadowRoot.getElementById('platform-select').value;
      const hookStrategy = this.shadowRoot.getElementById('hook-strategy-select').value;
      const topic = this.shadowRoot.getElementById('topic-input').value;
      const additionalInfo = this.shadowRoot.getElementById('additional-info').value;

      if (!topic) {
          this.shadowRoot.getElementById('status').textContent = 'Please enter a topic/product/service.';
          return;
      }

      const prompt = this.createPrompt(platform, hookStrategy, topic, additionalInfo);
      this.generateContent(prompt);
  }

  createPrompt(platform, hookStrategy, topic, additionalInfo) {
      return `Create an engaging social media post for ${platform} using the ${hookStrategy} strategy:

Topic/Product/Service: ${topic}

${additionalInfo ? `Additional Context: ${additionalInfo}

` : ''}Hook Strategies:

1. Intriguing Hook: Focus on a single, specific aspect of ${topic}. Craft a statement that arouses curiosity without revealing all the details.

2. Direct Benefit Hook: Clearly state the benefit the reader will gain from ${topic}. Be straightforward and avoid clever wordplay.

3. Numbers-Based Hook: Incorporate a relevant statistic or numerical fact about ${topic} to add credibility and clarity to your post.

4. Pain Point Hook: Address a common problem or frustration that your target audience faces regarding ${topic}. Speak directly to their experiences.

Additional guidelines:
- Keep the post within the character limit for ${platform}.
- Include 1-3 relevant hashtags. Research trending hashtags in your industry.
- Add a clear call-to-action.
- Maintain a friendly/professional voice consistent with the brand identity.
- Suggest a relevant image, video, or gif to increase engagement.

Generate the social media post now.`;
  }

  generateContent(prompt) {
      this.appendMessage({ content: prompt, role: 'user' });

      const aiMessage = { content: 'Generating post...', role: 'assistant' };
      this.appendMessage(aiMessage);

      this.worker.postMessage({
          type: 'GENERATE',
          data: {
              messages: [
                  { content: "You are an expert social media content creator", role: "system" },
                  { content: prompt, role: "user" },
              ],
          },
      });
  }

updateModelDisplay() {
    const currentModelSpan = this.shadowRoot.querySelector('.current-model');
    currentModelSpan.textContent = this.currentModel || "No model loaded";
}


onModelLoaded(modelName) {
    this.modelLoaded = true;
    this.currentModel = modelName;
    this.updateModelDisplay();
    this.shadowRoot.getElementById('load-model').style.display= 'none';
    this.shadowRoot.getElementById('status').textContent = `Model ${modelName} loaded successfully!`;
}

initializeWorker() {
    const webworkerScript = `
    import * as webllm from "https://esm.run/@mlc-ai/web-llm";

    let engine;
    let modelLoaded = false;

    self.addEventListener('message', async (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'INIT_MODEL':
          try {
            engine = new webllm.MLCEngine();
            await engine.reload(data.model, {
              temperature: data.temperature,
              top_p: data.top_p,
            });
            modelLoaded = true;
            self.postMessage({ type: 'MODEL_LOADED' });
          } catch (error) {
            self.postMessage({ type: 'ERROR', error: error.message });
          }
          break;

        case 'GENERATE':
          if (!modelLoaded) {
            self.postMessage({ type: 'ERROR', error: 'Model not loaded' });
            return;
          }

          try {
            const completion = await engine.chat.completions.create({
              stream: true,
              messages: data.messages,
              stream_options: { include_usage: true },
            });

            for await (const chunk of completion) {
              const curDelta = chunk.choices[0]?.delta.content;
              if (curDelta) {
                self.postMessage({ type: 'UPDATE', content: curDelta });
              }
              if (chunk.usage) {
                self.postMessage({ type: 'USAGE', usage: chunk.usage });
              }
            }

            const finalMessage = await engine.getMessage();
            self.postMessage({ type: 'FINISH', content: finalMessage });
          } catch (error) {
            self.postMessage({ type: 'ERROR', error: error.message });
          }
          break;
      }
    });
  `;

    const blob = new Blob([webworkerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });

    this.worker.onmessage = (event) => {
        const { type, content, error, usage } = event.data;
        switch (type) {
            case 'MODEL_LOADED':
                this.onModelLoaded(this.currentModel);
                break;
            case 'UPDATE':
                this.updateLastMessage(content);
                break;
            case 'FINISH':
                this.finishGenerating(content);
                break;
            case 'USAGE':
                this.updateUsage(usage);
                break;
            case 'ERROR':
                console.error('Worker error:', error);
                this.shadowRoot.getElementById('status').textContent = `Error: ${error}`;
                break;
        }
    };
}


onMessageSend() {
    if (!this.modelLoaded) return;

    const editableArea = this.shadowRoot.querySelector('.editable-area');
    const input = editableArea.textContent.trim();
    if (input.length === 0) return;

    const message = { content: input, role: 'user' };
    this.appendMessage(message);

    editableArea.textContent = '';
    editableArea.setAttribute('data-placeholder', 'Generating...');
    this.shadowRoot.querySelector('.upload-button').disabled = true;
    this.shadowRoot.querySelector('.model-select-button').disabled = true;

    const aiMessage = { content: 'typing...', role: 'assistant' };
    this.appendMessage(aiMessage);

    this.worker.postMessage({
        type: 'GENERATE',
        data: {
            messages: [
                { content: "You are an expert UI in MUI Material for React", role: "system" },
                message,
            ],
        },
    });
}

parseMarkdown(text) {
    // Convert markdown to HTML
    return text.replace(/`([^`]+)`/g, "<span><code>$1</code></span>")
        // Italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Unordered lists
        .replace(/^\s*[-*+]\s+(.+)$/gm, (match, p1) => `<li>${p1}</li>`)
        .replace(/(<li>.*<\/li>)(?=\s*[-*+]\s+|\s*$)/gm, "<ul>$&</ul>")
        // Ordered lists
        .replace(/^\s*(\d+)\.\s+(.+)$/gm, (match, p1, p2) => `<li>${p2}</li>`)
        .replace(/(<li>.*<\/li>)(?=\s*\d+\.\s+|\s*$)/gm, "<ol>$&</ol>")
        // Line breaks (only replace double newlines with <p> tags for paragraphs)
        .replace(/\n{2,}/g, "</p><p>")
        .replace(/^\s*<p>/, "<p>")
        .replace(/<\/p>\s*$/, "</p>")
        .replace(/\n/g, "<br>")
        // Code blocks - modified regex
        .replace(/```([\s\S]*?)```/g, (match, code) => {
            const lang = code.split('\n')[0].trim();
            const codeContent = code.replace(/^.*\n/, '').trim();
            return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(codeContent)}</code></pre>`;
        });
}

escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

appendMessage(message) {
    const chatBox = this.shadowRoot.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', message.role);

    if (message.content !== 'typing...') {
        messageEl.innerHTML = this.parseMarkdown(message.content);
    } else {
        messageEl.textContent = this.parseMarkdown(message.content)
    }

    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Add event listeners for copy buttons
    if (message.content !== 'typing...') {
        this.addCopyButtonListeners(messageEl);
    }
}

updateLastMessage(content) {
    const messages = this.shadowRoot.querySelectorAll('.message');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
        if (lastMessage.textContent === 'typing...') {
            lastMessage.innerHTML = '';
        }
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (index > 0) {

                lastMessage.appendChild(document.createElement('br'));
            }
            const span = document.createElement('span');
            console.log("updateLastMessage", line)

            span.innerHTML = this.parseMarkdown(line);

            lastMessage.appendChild(span);
        });
        this.addCopyButtonListeners(lastMessage);
    }
}


finishGenerating(finalMessage) {
    const messages = this.shadowRoot.querySelectorAll('.message');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.textContent === 'typing...') {
        lastMessage.innerHTML = this.parseMarkdown(finalMessage);
        this.addCopyButtonListeners(lastMessage);
    }
    this.shadowRoot.querySelector('.upload-button').disabled = false;
    this.shadowRoot.querySelector('.model-select-button').disabled = false;
    this.shadowRoot.querySelector('.editable-area').setAttribute('data-placeholder', 'Reply to exlement...');
}

addCopyButtonListeners(messageEl) {
    messageEl.querySelectorAll('pre').forEach(pre => {
        const copyButton = pre.querySelector('.copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const code = pre.querySelector('code');
                navigator.clipboard.writeText(code.textContent);
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        }
    });
}

updateUsage(usage) {
    const statusEl = this.shadowRoot.getElementById('status');
    statusEl.textContent = `Tokens - Prompt: ${usage.prompt_tokens}, Completion: ${usage.completion_tokens} | Speed - Prefill: ${usage.extra.prefill_tokens_per_s.toFixed(2)} t/s, Decoding: ${usage.extra.decode_tokens_per_s.toFixed(2)} t/s`;
}
  // ... (keep other methods like initializeWorker, onModelLoaded, appendMessage, updateLastMessage, finishGenerating, etc.) ...

}

customElements.define('social-media-content-generator', SocialMediaContentGenerator);

customElements.define('chat-webllm-component', ChatWebLLMComponent);