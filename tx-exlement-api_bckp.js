class PageTXGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
    this.accessMode = "pipeline";
  }

  static get observedAttributes() {
    return ["model", "task", "quantized"];
  }

  connectedCallback() {
    this.render();
    this.initializeWorker();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "model" || name === "task" || name === "quantized") {
        this.initializeWorker();
      }
    }
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <div id="status"></div>
    `;
  }

  initializeWorker() {
    const modelName = this.getAttribute("model") || "Xenova/all-MiniLM-L6-v2";
    const taskType = this.getAttribute("task") || "feature-extraction";
    this.accessMode = this.getAttribute("mode") || "pipeline";
    const modelState = this.getAttribute("quantized") !== "false";

    const workerScript = `
        import {pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

        env.allowLocalModels = false;
        env.useBrowserCache = true;
        env.remoteModelPath = "https://huggingface.co/";

        let pipe;
        let tokenizer;
        let model;

        async function initializePipeline(task, model, quantized) {
            pipe = await pipeline(task, model, {quantized: quantized});
        }

        

      self.onmessage = async function(e) {
        if (e.data.type === 'init') {
          self.postMessage({ type: 'status', message: 'Initializing model...' });
          try {
              await initializePipeline(e.data.task, e.data.model, e.data.quantizer);
              self.postMessage({ type: 'status', message: 'Model ready' });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        } else if (e.data.type === 'process') {
          try {
              const result = await pipe(e.data.input, e.data.options);
              self.postMessage({ type: 'result', data: result});
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });

    this.worker.onmessage = (e) => {
      if (e.data.type === "status") {
        this.updateStatus(e.data.message);
      } else if (e.data.type === "result") {
        this.dispatchEvent(new CustomEvent("result", { detail: e.data.data }));
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        this.dispatchEvent(
          new CustomEvent("error", { detail: e.data.message })
        );
      }
    };

    this.worker.postMessage({
      type: "init",
      model: modelName,
      task: taskType,
      quantized: modelState,
    });
  }

  updateStatus(message) {
    const status = this.shadowRoot.getElementById("status");
    status.textContent = message;
  }

  process(input, options = {}) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }
    this.worker.postMessage({ type: "process", input, options });
  }
}


class AIModelComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
  }

  static get observedAttributes() {
    return ["model", "task", "quantized"];
  }

  connectedCallback() {
    this.render();
    this.initializeWorker();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "model" || name === "task" || name === "quantized") {
        this.initializeWorker();
      }
    }
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <div id="status"></div>
    `;
  }

  initializeWorker() {
    const modelName = this.getAttribute("model") || "Xenova/all-MiniLM-L6-v2";
    const taskType = this.getAttribute("task") || "feature-extraction";
    const quantized = this.getAttribute("quantized") !== "false";

    const workerScript = `
        import {ort} from 'https://unpkg.com/onnxruntime-web@1.18.0/dist/ort.min.js';
        import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';

        env.allowLocalModels = false;
        env.useBrowserCache = true;
        env.remoteModelPath = "https://huggingface.co/";

        // Configure ONNX Runtime
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = true;
        ort.env.wasm.wasmPaths = document.location.pathname.replace('index.html', '') + 'dist/';

        // Set up ONNX Runtime options for Transformers.js
        env.onnx = {
          wasm: {
            wasmPaths: ort.env.wasm.wasmPaths,
          },
        };

        let pipe;

        async function initializePipeline(task, model, quantized) {
            pipe = await pipeline(task, model, { quantized: quantized });
        }

        self.onmessage = async function(e) {
          if (e.data.type === 'init') {
            self.postMessage({ type: 'status', message: 'Initializing model...' });
            try {
                await initializePipeline(e.data.task, e.data.model, e.data.quantized);
                self.postMessage({ type: 'status', message: 'Model ready' });
            } catch (error) {
              self.postMessage({ type: 'error', message: error.message });
            }
          } else if (e.data.type === 'process') {
            try {
                const result = await pipe(e.data.input, e.data.options);
                self.postMessage({ type: 'result', data: result });
            } catch (error) {
              self.postMessage({ type: 'error', message: error.message });
            }
          }
        };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });

    this.worker.onmessage = (e) => {
      if (e.data.type === "status") {
        this.updateStatus(e.data.message);
      } else if (e.data.type === "result") {
        this.dispatchEvent(new CustomEvent("result", { detail: e.data.data }));
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        this.dispatchEvent(
          new CustomEvent("error", { detail: e.data.message })
        );
      }
    };

    this.worker.postMessage({
      type: "init",
      model: modelName,
      task: taskType,
      quantized: quantized
    });
  }

  updateStatus(message) {
    const status = this.shadowRoot.getElementById("status");
    status.textContent = message;
  }

  process(input, options = {}) {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }
    this.worker.postMessage({ type: "process", input, options });
  }
}


class ChatWebLLMComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.worker = null;
    this.modelLoaded = false;
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
      </style>
      <div class="chat-container">
        <button id="load-model">Load Model</button>
        <div class="chat-box" id="chat-box"></div>
        <div class="chat-input">
          <input type="text" id="user-input" placeholder="Type your message...">
          <button id="send" disabled>Send</button>
        </div>
        <div class="status" id="status"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const loadModelBtn = this.shadowRoot.getElementById('load-model');
    const sendBtn = this.shadowRoot.getElementById('send');
    const userInput = this.shadowRoot.getElementById('user-input');

    loadModelBtn.addEventListener('click', (e) => { e.target.innerHTML= "loading model"; this.initializeModel()});
    sendBtn.addEventListener('click', () => this.onMessageSend());
    userInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.onMessageSend();
      }
    });
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
          this.modelLoaded = true;
          this.shadowRoot.getElementById('load-model').style.display = "none";

          this.shadowRoot.getElementById('send').disabled = false;
          this.shadowRoot.getElementById('status').textContent = 'Model loaded successfully!';
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

  initializeModel() {
    const statusEl = this.shadowRoot.getElementById('status');
    statusEl.textContent = 'Initializing...';

    this.worker.postMessage({
      type: 'INIT_MODEL',
      data: {
        model: this.getAttribute('model') || "Llama-3.1-8B-Instruct-q4f32_1-MLC-1k",
        temperature: parseFloat(this.getAttribute('temperature') || '1.0'),
        top_p: parseFloat(this.getAttribute('top-p') || '1'),
      },
    });
  }

  
  async onMessageSend() {
    if (!this.modelLoaded) return;

    const userInput = this.shadowRoot.getElementById('user-input');
    const input = userInput.value.trim();
    if (input.length === 0) return;

    const message = { content: input, role: 'user' };
    this.appendMessage(message);

    userInput.value = '';
    userInput.setAttribute('placeholder', 'Generating...');
    this.shadowRoot.getElementById('send').disabled = true;

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
    this.shadowRoot.getElementById('send').disabled = false;
    this.shadowRoot.getElementById('user-input').setAttribute('placeholder', 'Type your message...');
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

customElements.define('chat-webllm-component', ChatWebLLMComponent);

customElements.define('ai-model', AIModelComponent);

customElements.define("page-tx-generator", PageTXGenerator);
