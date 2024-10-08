class PageTXSpeechToText extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  static get observedAttributes() {
    return ["options", "model"];
  }

  async connectedCallback() {
    this.render();
    await this.initializeWhisper();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      if (name === "model") {
        this.initializeWhisper();
      }
    }
  }

  render() {
    const options = JSON.parse(this.getAttribute("options") || "{}");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${options.fontFamily || "'Roboto', Arial, sans-serif"};
          --primary-color: ${options.primaryColor || "#4285F4"};
          --secondary-color: ${options.secondaryColor || "#34A853"};
          --background-color: ${options.backgroundColor || "#ffffff"};
          --text-color: ${options.textColor || "#202124"};
          --border-color: ${options.borderColor || "#dfe1e5"};
          --input-bg-color: #ffffff;
          --box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        }
        .container {
          background-color: var(--background-color);
          border-radius: 8px;
          padding: 24px;
          box-shadow: var(--box-shadow);
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        h2 {
          color: var(--primary-color);
          margin: 0;
          font-size: 24px;
          font-weight: 400;
        }
        .controls {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        .record-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s, box-shadow 0.3s;
        }
        .record-button:hover:not(:disabled) {
          background-color: var(--secondary-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.24);
        }
        .record-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .record-button .icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: white;
        }
        .record-button.recording .icon {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .file-input {
          display: none;
        }
        .file-label {
          background-color: var(--background-color);
          color: var(--primary-color);
          border: 2px solid var(--primary-color);
          padding: 10px 20px;
          border-radius: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.3s, color 0.3s;
        }
        .file-label:hover {
          background-color: var(--primary-color);
          color: white;
        }
        textarea {
          width: 100%;
          height: 200px;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 16px;
          background-color: var(--input-bg-color);
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
        }
        textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        #status, #progress-text {
          margin-top: 12px;
          font-style: italic;
          color: var(--text-color);
          text-align: center;
          font-size: 14px;
        }
        #loading-spinner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.7);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid var(--primary-color);
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .container {
            padding: 16px;
            border-radius: 0;
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          h2 {
            font-size: 20px;
          }
          .controls {
            flex-direction: column;
          }
          .record-button, .file-label {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      </style>
      <div class="container">
        <div class="header">
          <h2>${options.title || "Speech to Text"}</h2>
        </div>
        <div class="controls">
          <button id="record-button" class="record-button">
            <span class="icon"></span>
            Start Recording
          </button>
          <input type="file" id="file-input" class="file-input" accept="audio/*">
          <label for="file-input" class="file-label">Upload Audio File</label>
        </div>
        <textarea id="output" readonly placeholder="Transcribed text will appear here"></textarea>
        <div id="status"></div>
        <div id="progress-text"></div>
        <div id="loading-spinner">
          <div class="spinner"></div>
        </div>
      </div>
    `;
  }

  async initializeWhisper() {
    const modelName = this.getAttribute("model") || "Xenova/whisper-tiny.en";

    const recordButton = this.shadowRoot.getElementById("record-button");
    recordButton.disabled = true;
    this.updateStatus("Initializing Whisper model...");

    const workerScript = `
      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.remoteModelPath = "https://huggingface.co/";

      let whisper;

      async function initWhisper(model) {
        whisper = await pipeline('automatic-speech-recognition', model);
      }

      self.onmessage = async function (e) {
        if (e.data.type === 'init') {
          self.postMessage({ type: 'notification', text: e.data.model });
          try {
            await initWhisper(e.data.model);
            self.postMessage({ type: 'init_complete' });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        } else if (e.data.type === 'transcribe') {
          try {
            const result = await whisper(e.data.audio, {
              chunk_length_s: 30,
              stride_length_s: 5,
              language: 'english',
              task: 'transcribe',
            });
            self.postMessage({
              type: 'transcription_complete',
              result: result.text,
            });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.postMessage({ type: "init", model: modelName });

    this.worker.onmessage = (e) => {
      if (e.data.type === "init_complete") {
        this.updateStatus("Whisper model ready");
        recordButton.disabled = false;
      } else if (e.data.type === "notification") {
        this.updateStatus(`${e.data.text} is downloading...`);
      } else if (e.data.type === "transcription_complete") {
        const output = this.shadowRoot.getElementById("output");
        output.value = e.data.result;
        this.updateStatus("Transcription complete");
        recordButton.disabled = false;
        this.shadowRoot.getElementById("loading-spinner").style.display =
          "none";
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        recordButton.disabled = false;
        this.shadowRoot.getElementById("loading-spinner").style.display =
          "none";
      }
    };
  }

  setupEventListeners() {
    const recordButton = this.shadowRoot.getElementById("record-button");
    recordButton.addEventListener("click", () => this.toggleRecording());

    const fileInput = this.shadowRoot.getElementById("file-input");
    fileInput.addEventListener("change", (e) => this.handleFileUpload(e));
  }

  async toggleRecording() {
    if (!this.isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.addEventListener("dataavailable", (event) => {
          this.audioChunks.push(event.data);
        });

        this.mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
          this.transcribeAudio(audioBlob);
        });

        this.mediaRecorder.start();
        this.isRecording = true;
        this.updateRecordButtonState();
        this.updateStatus("Recording...");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        this.updateStatus(
          "Error accessing microphone. Please check your permissions."
        );
      }
    } else {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateRecordButtonState();
      this.updateStatus("Processing audio...");
    }
  }

  updateRecordButtonState() {
    const recordButton = this.shadowRoot.getElementById("record-button");
    if (this.isRecording) {
      recordButton.textContent = "Stop Recording";
      recordButton.classList.add("recording");
    } else {
      recordButton.textContent = "Start Recording";
      recordButton.classList.remove("recording");
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.transcribeAudio(file);
    }
  }

  async transcribeAudio(audioBlob) {
    const loadingSpinner = this.shadowRoot.getElementById("loading-spinner");
    loadingSpinner.style.display = "flex";
    this.updateStatus("Transcribing audio...");

    const arrayBuffer = await audioBlob.arrayBuffer();
    this.worker.postMessage({
      type: "transcribe",
      audio: new Float32Array(arrayBuffer),
    });
  }

  updateStatus(message) {
    const status = this.shadowRoot.getElementById("status");
    status.textContent = message;
  }

  updateProgress(progress) {
    const progressText = this.shadowRoot.getElementById("progress-text");

    if (progress.status === "download") {
      const percentage = ((progress.loaded / progress.total) * 100).toFixed(2);
      progressText.textContent = `Downloading model: ${percentage}%`;
    } else if (progress.status === "init") {
      progressText.textContent = "Initializing model...";
    }
  }
}

class PageTXImageCaptioner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
  }

  static get observedAttributes() {
    return ["model", "options"];
  }

  connectedCallback() {
    this.render();
    this.initializeImageCaptioner();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "model") {
        this.initializeImageCaptioner();
      } else if (name === "options") {
        this.render();
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
    const options = JSON.parse(this.getAttribute("options") || "{}");
    const {
      title = "Image Captioner",
      primaryColor = "#4285F4",
      secondaryColor = "#34A853",
      backgroundColor = "#ffffff",
      textColor = "#202124",
      borderColor = "#dfe1e5",
      fontFamily = "'Roboto', Arial, sans-serif",
      uploadButtonText = "Upload Image",
    } = options;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontFamily};
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
          --background-color: ${backgroundColor};
          --text-color: ${textColor};
          --border-color: ${borderColor};
          --box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        }
        .container {
          background-color: var(--background-color);
          border-radius: 8px;
          padding: 24px;
          box-shadow: var(--box-shadow);
          max-width: 600px;
          margin: 0 auto;
        }
        h2 {
          color: var(--primary-color);
          text-align: center;
          margin-top: 0;
          font-weight: 400;
        }
        #image-upload {
          display: none;
        }
        #upload-label {
          display: block;
          background-color: var(--primary-color);
          color: white;
          text-align: center;
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 16px;
          transition: background-color 0.3s;
        }
        #upload-label:hover {
          background-color: var(--secondary-color);
        }
        #image-preview {
          max-width: 100%;
          margin-bottom: 16px;
          border-radius: 4px;
          display: none;
        }
        #caption-output {
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 12px;
          min-height: 50px;
          color: var(--text-color);
        }
        #status {
          margin-top: 12px;
          font-style: italic;
          text-align: center;
          color: var(--text-color);
        }
        #loading-spinner {
          display: none;
          justify-content: center;
          align-items: center;
          margin-top: 16px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="container">
        <h2>${title}</h2>
        <input type="file" id="image-upload" accept="image/*">
        <label for="image-upload" id="upload-label">${uploadButtonText}</label>
        <img id="image-preview">
        <div id="caption-output"></div>
        <div id="loading-spinner"><div class="spinner"></div></div>
        <div id="status"></div>
      </div>
    `;
  }

  initializeImageCaptioner() {
    const modelName =
      this.getAttribute("model") || "Xenova/vit-gpt2-image-captioning";

    const workerScript = `
      import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

      let captioner;

      async function initCaptioner(model) {
        captioner = await pipeline('image-to-text', model);
      }

      self.onmessage = async function(e) {
        if (e.data.type === 'init') {
          try {
            await initCaptioner(e.data.model);
            self.postMessage({ type: 'init_complete' });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        } else if (e.data.type === 'caption') {
          try {
            const result = await captioner(e.data.image);
            self.postMessage({ type: 'caption_complete', result: result[0].generated_text });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });

    this.worker.onmessage = (e) => {
      if (e.data.type === "init_complete") {
        this.updateStatus("Image captioner ready");
      } else if (e.data.type === "caption_complete") {
        this.updateCaption(e.data.result);
        this.updateStatus("Caption generated");
        this.hideLoadingSpinner();
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        this.hideLoadingSpinner();
      }
    };

    this.worker.postMessage({ type: "init", model: modelName });
  }

  setupEventListeners() {
    const fileInput = this.shadowRoot.getElementById("image-upload");
    fileInput.addEventListener("change", (e) => this.handleImageUpload(e));
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = this.shadowRoot.getElementById("image-preview");
        img.src = e.target.result;
        img.style.display = "block";
        this.captionImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  captionImage(imageData) {
    this.updateStatus("Generating caption...");
    this.showLoadingSpinner();
    this.worker.postMessage({ type: "caption", image: imageData });
  }

  updateCaption(caption) {
    const outputElement = this.shadowRoot.getElementById("caption-output");
    outputElement.textContent = caption;
  }

  updateStatus(message) {
    const status = this.shadowRoot.getElementById("status");
    status.textContent = message;
  }

  showLoadingSpinner() {
    const spinner = this.shadowRoot.getElementById("loading-spinner");
    spinner.style.display = "flex";
  }

  hideLoadingSpinner() {
    const spinner = this.shadowRoot.getElementById("loading-spinner");
    spinner.style.display = "none";
  }
}
class PageTXAIChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
    this.worker = null;
    this.streamingResponse = "";
  }

  static get observedAttributes() {
    return [
      "model",
      "theme",
      "placeholder",
      "send-button-text",
      "task",
      "primary-color",
      "secondary-color",
      "font-family",
      "border-radius",
      "chat-height",
    ];
  }

  connectedCallback() {
    this.render();
    this.initializeWorker();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      if (name === "model") {
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
    const theme = this.getAttribute("theme") || "light";
    const placeholder = this.getAttribute("placeholder") || "Type a message";
    const sendButtonText = this.getAttribute("send-button-text") || "Send";
    const primaryColor = this.getAttribute("primary-color") || "#4CAF50";
    const secondaryColor = this.getAttribute("secondary-color") || "#45a049";
    const fontFamily = this.getAttribute("font-family") || "Arial, sans-serif";
    const borderRadius = this.getAttribute("border-radius") || "8px";
    const chatHeight = this.getAttribute("chat-height") || "500px";

    const isDark = theme === "dark";
    const backgroundColor = isDark ? "#222" : "#f0f0f0";
    const textColor = isDark ? "#fff" : "#000";
    const borderColor = isDark ? "#444" : "#ddd";
    const inputBgColor = isDark ? "#444" : "#fff";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontFamily};
          max-width: 600px;
          margin: 0 auto;
        }
        .chat-container {
          border: 1px solid ${borderColor};
          border-radius: ${borderRadius};
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: ${chatHeight};
          background-color: ${backgroundColor};
          color: ${textColor};
        }
        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .message {
          max-width: 70%;
          padding: 0.5rem 1rem;
          border-radius: ${borderRadius};
          margin-bottom: 0.5rem;
          word-wrap: break-word;
          clear: both;
        }
        .user-message {
          background-color: ${isDark ? "#2c3e50" : primaryColor};
          color: ${isDark ? "#fff" : "#fff"};
          float: right;
        }
        .ai-message {
          background-color: ${isDark ? "#34495e" : "#ffffff"};
          color: ${isDark ? "#fff" : "#000"};
          float: left;
        }
        .chat-input {
          display: flex;
          padding: 1rem;
          background-color: ${isDark ? "#333" : "#ffffff"};
          border-top: 1px solid ${borderColor};
        }
        input {
          flex-grow: 1;
          padding: 0.5rem;
          border: 1px solid ${borderColor};
          border-radius: calc(${borderRadius} / 2);
          margin-right: 0.5rem;
          background-color: ${inputBgColor};
          color: ${textColor};
        }
        button {
          background-color: ${primaryColor};
          color: white;
          border: none;
          border-radius: calc(${borderRadius} / 2);
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: ${secondaryColor};
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .status {
          text-align: center;
          padding: 0.5rem;
          font-style: italic;
          color: ${isDark ? "#aaa" : "#666"};
        }
        .hidden {
          display: none;
        }
      </style>
      <div class="chat-container">
        <div class="chat-messages"></div>
        <div class="status">Initializing AI model...</div>
        <div class="chat-input">
          <input type="text" placeholder="${placeholder}" disabled>
          <button disabled>${sendButtonText}</button>
        </div>
      </div>
    `;
  }

  initializeWorker() {
    const modelName =
      this.getAttribute("model") || "Xenova/Phi-3-mini-4k-instruct";
    const taskType = this.getAttribute("task") || "text-generation";
    const workerScript = `
      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
      import * as ort from 'https://unpkg.com/onnxruntime-web@1.18.0/dist/ort.min.js'

      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.remoteModelPath = "https://huggingface.co/";

      let pipe;
      let tokenizer;

      async function initializePipeline(task, model) {
        pipe = await pipeline(task, model);
        tokenizer = await pipe.tokenizer;
      }

      self.onmessage = async function(e) {
        if(e.data.type === 'init'){
          self.postMessage({ type: 'notification', text: e.data.model });
          try{ 
            await initializePipeline(e.data.task, e.data.model);
            self.postMessage({ type: 'ready' });
          } catch(error){
            self.postMessage({ type: 'error', message: error.message });
          }
        }
        else if (e.data.type === 'generate') {
          try {
            let generatedTokens = [];
            let previousText = '';
            const result = await pipe(e.data.prompt, {
              max_new_tokens: 128,
              temperature: 0.7,
              stream: true,
              callback_function: (x) => {
                if (x[0].output_token_ids && x[0].output_token_ids.length > 0) {
                    generatedTokens = x[0].output_token_ids;
                    const fullText = tokenizer.decode(generatedTokens, { skip_special_tokens: true });
                    const newText = fullText.slice(previousText.length);
                    if (newText) {
                        self.postMessage({ type: 'token', text: newText });
                        previousText = fullText;
                    }
                }
                return false;
              }
            });
            const fullText = tokenizer.decode(generatedTokens, { skip_special_tokens: true });
            self.postMessage({ type: 'complete', text: "" });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.postMessage({ type: "init", model: modelName, task: taskType });

    this.worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        this.updateStatus("AI model ready");
        this.enableInput();
        setTimeout(() => this.hideStatus(), 3000);
      } else if (e.data.type === "token") {
        this.updateStreamingMessage(e.data.text);
      } else if (e.data.type === "complete") {
        this.enableInput();
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        this.enableInput();
      } else if (e.data.type === "notification") {
        this.updateStatus(`Loading model: ${e.data.text}`);
      }
    };
  }

  updateStreamingMessage(text) {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    let messageElement = chatMessages.querySelector(".ai-message:last-child");

    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.classList.add("message", "ai-message");
      chatMessages.appendChild(messageElement);
    }

    messageElement.textContent += text;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");

    button.addEventListener("click", () => this.sendMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const input = this.shadowRoot.querySelector("input");
    const message = input.value.trim();

    if (message) {
      this.addMessage(message, "user");
      input.value = "";
      this.disableInput();

      const prompt = this.generatePrompt(message);
      this.worker.postMessage({ type: "generate", prompt });
    }
  }

  generatePrompt(message) {
    const context = this.messages
      .slice(-5)
      .map((m) => `${m.type === "user" ? "Human" : "AI"}: ${m.text}`)
      .join("\n");
    // return `${context}\nHuman: ${message}\nAI:`;
    return message;
  }

  addMessage(text, type) {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${type}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    this.messages.push({ text, type });
  }

  updateStatus(message) {
    const status = this.shadowRoot.querySelector(".status");
    status.textContent = message;
    status.classList.remove("hidden");
  }

  hideStatus() {
    const status = this.shadowRoot.querySelector(".status");
    status.classList.add("hidden");
  }

  enableInput() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");
    input.disabled = false;
    button.disabled = false;
    input.focus();
  }

  disableInput() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");
    input.disabled = true;
    button.disabled = true;
  }
}

class PageTXONNAIChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
    this.worker = null;
    this.streamingResponse = "";
  }

  static get observedAttributes() {
    return ["model", "theme", "placeholder", "send-button-text", "task"];
  }

  connectedCallback() {
    this.render();
    this.initializeWorker();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      if (name === "model") {
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
    const theme = this.getAttribute("theme") || "light";
    const placeholder = this.getAttribute("placeholder") || "Type a message";
    const sendButtonText = this.getAttribute("send-button-text") || "Send";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }
        .chat-container {
          border: 1px solid ${theme === "dark" ? "#444" : "#ddd"};
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 500px;
          background-color: ${theme === "dark" ? "#222" : "#f0f0f0"};
          color: ${theme === "dark" ? "#fff" : "#000"};
        }
        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .message {
          max-width: 70%;
          padding: 0.5rem 1rem;
          border-radius: 18px;
          margin-bottom: 0.5rem;
          word-wrap: break-word;
          clear: both;
        }
        .user-message {
          background-color: ${theme === "dark" ? "#2c3e50" : "#dcf8c6"};
          float: right;
        }
        .ai-message {
          background-color: ${theme === "dark" ? "#34495e" : "#ffffff"};
          float: left;
        }
        .chat-input {
          display: flex;
          padding: 1rem;
          background-color: ${theme === "dark" ? "#333" : "#ffffff"};
          border-top: 1px solid ${theme === "dark" ? "#444" : "#ddd"};
        }
        input {
          flex-grow: 1;
          padding: 0.5rem;
          border: 1px solid ${theme === "dark" ? "#444" : "#ddd"};
          border-radius: 20px;
          margin-right: 0.5rem;
          background-color: ${theme === "dark" ? "#444" : "#fff"};
          color: ${theme === "dark" ? "#fff" : "#000"};
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0.5rem 1rem;
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
        .status {
          text-align: center;
          padding: 0.5rem;
          font-style: italic;
          color: ${theme === "dark" ? "#aaa" : "#666"};
        }
        .hidden {
          display: none;
        }
      </style>
      <div class="chat-container">
        <div class="chat-messages"></div>
        <div class="status">Initializing AI model...</div>
        <div class="chat-input">
          <input type="text" placeholder="${placeholder}" disabled>
          <button disabled>${sendButtonText}</button>
        </div>
      </div>
    `;
  }

  initializeWorker() {
    const modelName =
      this.getAttribute("model") || "Xenova/Phi-3-mini-4k-instruct";
    const taskType = this.getAttribute("task") || "text-generation";
    const workerScript = `
      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
      import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js';

      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.remoteModelPath = "https://huggingface.co/";

      let pipe;
      let tokenizer;

      async function initializePipeline(task, model) {
        // Check for WebGPU support
        const gpuSupported = await ort.env.webgpu.isWebGPUSupported();
        // console.log(gpuSupported)
        if (gpuSupported) {
          ort.env.wasm.numThreads = 1;
          await ort.env.webgpu.initWebGPU();
          console.log("Using WebGPU for acceleration");
        } else {
          console.log("WebGPU not supported, falling back to default execution provider");
        }

        pipe = await pipeline(task, model, { executionProvider: gpuSupported ? 'webgpu' : 'wasm' });
        tokenizer = await pipe.tokenizer;
      }

      self.onmessage = async function(e) {
        if(e.data.type === 'init'){
          self.postMessage({ type: 'notification', text: e.data.model });
          try{ 
            await initializePipeline(e.data.task, e.data.model);
            self.postMessage({ type: 'ready' });
          } catch(error){
            self.postMessage({ type: 'error', message: error.message });
          }
        }
        else if (e.data.type === 'generate') {
          try {
            let generatedTokens = [];
            let previousText = '';
            const result = await pipe(e.data.prompt, {
              max_new_tokens: 128,
              temperature: 0.7,
              stream: true,
              callback_function: (x) => {
                if (x[0].output_token_ids && x[0].output_token_ids.length > 0) {
                    generatedTokens = x[0].output_token_ids;
                    const fullText = tokenizer.decode(generatedTokens, { skip_special_tokens: true });
                    const newText = fullText.slice(previousText.length);
                    if (newText) {
                        self.postMessage({ type: 'token', text: newText });
                        previousText = fullText;
                    }
                }
                return false;
              }
            });
            const fullText = tokenizer.decode(generatedTokens, { skip_special_tokens: true });
            self.postMessage({ type: 'complete', text: "" });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.postMessage({ type: "init", model: modelName, task: taskType });

    this.worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        this.updateStatus("AI model ready");
        this.enableInput();
        setTimeout(() => this.hideStatus(), 3000);
      } else if (e.data.type === "token") {
        this.updateStreamingMessage(e.data.text);
      } else if (e.data.type === "complete") {
        this.enableInput();
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        this.enableInput();
      } else if (e.data.type === "notification") {
        this.updateStatus(`Loading model: ${e.data.text}`);
      }
    };
  }

  updateStreamingMessage(text) {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    let messageElement = chatMessages.querySelector(".ai-message:last-child");

    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.classList.add("message", "ai-message");
      chatMessages.appendChild(messageElement);
    }

    messageElement.textContent += text;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");

    button.addEventListener("click", () => this.sendMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const input = this.shadowRoot.querySelector("input");
    const message = input.value.trim();

    if (message) {
      this.addMessage(message, "user");
      input.value = "";
      this.disableInput();

      const prompt = this.generatePrompt(message);
      this.worker.postMessage({ type: "generate", prompt });
    }
  }

  generatePrompt(message) {
    const context = this.messages
      .slice(-5)
      .map((m) => `${m.type === "user" ? "Human" : "AI"}: ${m.text}`)
      .join("\n");
    return message;
  }

  addMessage(text, type) {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${type}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    this.messages.push({ text, type });
  }

  updateStatus(message) {
    const status = this.shadowRoot.querySelector(".status");
    status.textContent = message;
    status.classList.remove("hidden");
  }

  hideStatus() {
    const status = this.shadowRoot.querySelector(".status");
    status.classList.add("hidden");
  }

  enableInput() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");
    input.disabled = false;
    button.disabled = false;
    input.focus();
  }

  disableInput() {
    const input = this.shadowRoot.querySelector("input");
    const button = this.shadowRoot.querySelector("button");
    input.disabled = true;
    button.disabled = true;
  }
}

class PageVoiceAIAssistant extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.transcript = "";
    this.silenceTimer = null;
    this.VAD_SILENCE_THRESHOLD = 2000;
    this.isAISpeaking = false;
    this.conversationHistory = [];
    this.maxHistoryLength = 5; // Number of turns to remember
  }

  static get observedAttributes() {
    return [
      "model",
      "language",
      "task",
      "theme",
      "title",
      "show-transcript",
      "height",
      "width",
      "background",
      "max-history",
    ];
  }

  connectedCallback() {
    this.render();
    this.initializeWorker();
    this.setupSpeechRecognition();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === "model" || name === "task") {
        this.initializeWorker();
      } else if (name === "language") {
        this.setupSpeechRecognition();
      } else if (name === "max-history") {
        this.maxHistoryLength = parseInt(newValue) || 5;
      } else {
        this.render();
      }
    }
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  render() {
    const theme = this.getAttribute("theme") || "modern";
    const title = this.getAttribute("title") || "AI Assistant";
    const showTranscript = this.getAttribute("show-transcript") !== "false";
    const height = this.getAttribute("height") || "400px";
    const width = this.getAttribute("width") || "100%";
    const background = this.getAttribute("background") || "";

    const styles = this.getThemeStyles(theme);

    this.shadowRoot.innerHTML = `
      <style>
        ${styles}
        :host {
          display: block;
          font-family: var(--font-family);
          width: ${width};
          height: ${height};
        }
        .container {
          background: ${background || "var(--background)"};
          border-radius: var(--border-radius);
          padding: var(--padding);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        #voiceWave {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        }
        .wave {
          width: var(--wave-width);
          height: var(--wave-height);
          margin: var(--wave-margin);
          border-radius: var(--wave-border-radius);
          opacity: 0.3;
          transition: opacity 0.3s ease, background 0.3s ease;
        }
        .wave.user {
          background: var(--user-wave-color);
          animation: userWave 1s ease-in-out infinite;
        }
        .wave.ai {
          background: var(--ai-wave-color);
          animation: aiWave 1.5s ease-in-out infinite;
        }
        @keyframes userWave {
          0%, 100% { height: var(--wave-height); }
          50% { height: calc(var(--wave-height) * 0.5); }
        }
        @keyframes aiWave {
          0%, 100% { height: var(--wave-height); }
          50% { height: calc(var(--wave-height) * 1.5); }
        }
        .wave.active {
          opacity: 1;
        }
        #status {
          font-size: var(--status-font-size);
          margin: var(--status-margin);
        }
        #transcript {
          font-size: var(--transcript-font-size);
          margin-top: var(--transcript-margin-top);
          flex-grow: 1;
          overflow-y: auto;
          text-align: left;
          white-space: pre-wrap;
          word-wrap: break-word;
          display: ${showTranscript ? "block" : "none"};
        }
      </style>
      <div class="container">
        <h1>${title}</h1>
        <div id="voiceWave">
          <div class="wave user"></div>
          <div class="wave user" style="animation-delay: 0.3s;"></div>
          <div class="wave user" style="animation-delay: 0.6s;"></div>
        </div>
        <div id="status">Initializing...</div>
        <div id="transcript"></div>
      </div>
    `;
  }

  getThemeStyles(theme) {
    const themes = {
      modern: `
        :host {
          --font-family: 'Roboto', sans-serif;
          --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --border-radius: 20px;
          --padding: 30px;
          --wave-width: 6px;
          --wave-height: 40px;
          --wave-margin: 8px;
          --wave-border-radius: 3px;
          --user-wave-color: linear-gradient(45deg, #00aeff, #a68eff);
          --ai-wave-color: linear-gradient(45deg, #ff9a9e, #fad0c4);
          --status-font-size: 18px;
          --status-margin: 20px 0;
          --transcript-font-size: 16px;
          --transcript-margin-top: 20px;
        }
        h1 {
          color: #ffffff;
          font-size: 28px;
          margin-bottom: 20px;
        }
        #status, #transcript {
          color: #ffffff;
        }
      `,
      minimal: `
        :host {
          --font-family: 'Arial', sans-serif;
          --background: #ffffff;
          --border-radius: 10px;
          --padding: 20px;
          --wave-width: 4px;
          --wave-height: 30px;
          --wave-margin: 6px;
          --wave-border-radius: 2px;
          --user-wave-color: #3498db;
          --ai-wave-color: #2ecc71;
          --status-font-size: 16px;
          --status-margin: 15px 0;
          --transcript-font-size: 14px;
          --transcript-margin-top: 15px;
        }
        h1 {
          color: #333333;
          font-size: 24px;
          margin-bottom: 15px;
        }
        #status, #transcript {
          color: #666666;
        }
        .container {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
      `,
      futuristic: `
        :host {
          --font-family: 'Orbitron', sans-serif;
          --background: #000000;
          --border-radius: 0;
          --padding: 25px;
          --wave-width: 5px;
          --wave-height: 50px;
          --wave-margin: 10px;
          --wave-border-radius: 0;
          --user-wave-color: #00ff00;
          --ai-wave-color: #ff00ff;
          --status-font-size: 18px;
          --status-margin: 25px 0;
          --transcript-font-size: 16px;
          --transcript-margin-top: 25px;
        }
        h1 {
          color: #00ff00;
          font-size: 32px;
          margin-bottom: 25px;
          text-transform: uppercase;
        }
        #status, #transcript {
          color: #ffffff;
        }
        .container {
          border: 2px solid #00ff00;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
        }
        .wave {
          box-shadow: 0 0 10px var(--user-wave-color);
        }
        .wave.ai {
          box-shadow: 0 0 10px var(--ai-wave-color);
        }
      `,
    };

    return themes[theme] || themes.modern;
  }

  initializeWorker() {
    const modelName = this.getAttribute("model") || "Xenova/distilgpt2";
    const taskType = this.getAttribute("task") || "text-generation";
    const workerScript = `
      import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.remoteModelPath = "https://huggingface.co/";

      let pipe;

      async function initializePipeline(task, model) {
        pipe = await pipeline(task, model);
      }

      self.onmessage = async function(e) {
        if (e.data.type === 'init') {
          self.postMessage({ type: 'notification', text: e.data.model });
          try {
            await initializePipeline(e.data.task, e.data.model);
            self.postMessage({ type: 'ready' });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        } else if (e.data.type === 'generate') {
          try {
            let result;
            if (e.data.task === 'text-generation') {
              result = await pipe(e.data.prompt, {
                max_new_tokens: 100,
                temperature: 0.7,
              });
              result = result[0].generated_text;
            } else if (e.data.task === 'text2text-generation') {
              result = await pipe(e.data.prompt,e.data.context, {
                max_length: 100
              });
              result = result[0].generated_text;
            } else if (e.data.task === 'question-answering') {
              result = await pipe({
                question: e.data.prompt,
                context: "Answer this question based on your knowledge."
              });
              result = result.answer;
            } else {
              result = await pipe(e.data.prompt);
              result = JSON.stringify(result);
            }
            self.postMessage({ type: 'complete', text: result });
          } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
          }
        }
      };
    `;

    const blob = new Blob([workerScript], { type: "application/javascript" });
    this.worker = new Worker(URL.createObjectURL(blob), { type: "module" });
    this.worker.postMessage({ type: "init", model: modelName, task: taskType });

    this.worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        this.updateStatus("AI model ready. Start speaking...");
        this.startListening();
      } else if (e.data.type === "complete") {
        this.speakResponse(e.data.text);
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
      } else if (e.data.type === "notification") {
        this.updateStatus(`Loading model: ${e.data.text}`);
      }
    };
  }

  setupSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateStatus("Speech recognition not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.getAttribute("language") || "en-US";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      this.updateTranscript(currentTranscript);
      this.resetSilenceTimer();
      this.activateWaveAnimation("user");
    };

    this.recognition.onerror = (event) => {
      this.updateStatus(`Error: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };
  }

  startListening() {
    if (!this.isListening) {
      this.isListening = true;
      this.recognition.start();
      this.updateStatus("Listening...");
    }
  }

  stopListening() {
    if (this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.updateStatus("Processing...");
    }
  }

  resetSilenceTimer() {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      this.stopListening();
      this.generateResponse(this.transcript);
      this.transcript = "";
    }, this.VAD_SILENCE_THRESHOLD);
  }

  activateWaveAnimation(type) {
    const waves = this.shadowRoot.querySelectorAll(".wave");
    waves.forEach((wave) => {
      wave.classList.remove("user", "ai");
      wave.classList.add(type, "active");
    });
  }

  deactivateWaveAnimation() {
    const waves = this.shadowRoot.querySelectorAll(".wave");
    waves.forEach((wave) => wave.classList.remove("active"));
  }

  generateResponse(transcript) {
    this.conversationHistory.push({ role: "user", content: transcript });
    const taskType = this.getAttribute("task") || "text-generation";
    this.worker.postMessage({
      type: "generate",
      prompt: transcript,
      task: taskType,
      context: this.conversationHistory.map((item) => item.content).join(" "),
    });
    // console.log("sending to AI", this.conversationHistory);
  }

  speakResponse(text) {
    this.isAISpeaking = true;
    this.activateWaveAnimation("ai");
    this.updateTranscript(`AI: ${text}`);
    this.conversationHistory.push({ role: "ai", content: text });

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getAttribute("language") || "en-US";
    utterance.onend = () => {
      this.isAISpeaking = false;
      this.deactivateWaveAnimation();
      this.startListening();
    };
    this.synthesis.speak(utterance);
    console.log("Received from AI", this.conversationHistory);
  }

  updateStatus(message) {
    this.shadowRoot.getElementById("status").textContent = message;
  }

  updateTranscript(text) {
    this.transcript = text;
    const transcriptElement = this.shadowRoot.getElementById("transcript");
    transcriptElement.textContent = text;
    transcriptElement.scrollTop = transcriptElement.scrollHeight;
  }
}

customElements.define("page-voice-ai-assistant", PageVoiceAIAssistant);
customElements.define("page-txonn-chat", PageTXONNAIChat);
customElements.define("page-tx-image-captioner", PageTXImageCaptioner);
customElements.define("page-tx-chat", PageTXAIChat);
customElements.define("page-tx-speech-to-text", PageTXSpeechToText);
