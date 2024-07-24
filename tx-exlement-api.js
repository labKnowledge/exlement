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

customElements.define("page-tx-generator", PageTXGenerator);
