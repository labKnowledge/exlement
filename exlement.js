class PageBase extends HTMLElement {
  connectedCallback() {
    // No need to render anything, just act as a container
  }
}

class PageTop extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const dataAttr = this.getAttribute("data");
    const optionAttr = this.getAttribute("option");
    if (!dataAttr) {
      console.error("No data attribute provided for page-top");
      return;
    }
    const config = JSON.parse(dataAttr.replace(/'/g, '"'));
    const option = optionAttr
      ? JSON.parse(optionAttr.replace(/'/g, '"'))
      : { logo: "left" };

    const logoHtml = `<img src="${config.logo}" alt="Logo">`;
    const navHtml = `<nav>${config.links
      .map((link) => `<a href="#">${link}</a>`)
      .join("")}</nav>`;

    let content;
    switch (option.logo) {
      case "left":
        content = `${logoHtml}${navHtml}`;
        this.style.justifyContent = "space-between";
        break;
      case "right":
        content = `${navHtml}${logoHtml}`;
        this.style.justifyContent = "space-between";
        break;
      case "center":
        content = `${logoHtml}${navHtml}`;
        this.style.flexDirection = "column";
        this.style.justifyContent = "center";
        this.style.textAlign = "center";
        break;
      default:
        content = `${logoHtml}${navHtml}`;
        this.style.justifyContent = "space-between";
    }

    this.innerHTML = content;
  }
}

class PageTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const tabs = JSON.parse(this.getAttribute("tabs") || "[]");
    const theme = this.getAttribute("theme") || "light";

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                }
                .tabs {
                    border: 1px solid ${theme === "dark" ? "#555" : "#ddd"};
                    border-radius: 4px;
                    overflow: hidden;
                }
                .tab-headers {
                    display: flex;
                    background-color: ${theme === "dark" ? "#333" : "#f8f9fa"};
                }
                .tab-header {
                    padding: 1rem;
                    border: none;
                    background-color: transparent;
                    cursor: pointer;
                    color: ${theme === "dark" ? "#fff" : "#333"};
                    transition: background-color 0.3s;
                }
                .tab-header:hover {
                    background-color: ${theme === "dark" ? "#555" : "#e9ecef"};
                }
                .tab-header.active {
                    background-color: ${theme === "dark" ? "#444" : "#fff"};
                    border-bottom: 2px solid ${
                      theme === "dark" ? "#fff" : "#007bff"
                    };
                }
                .tab-content {
                    display: none;
                    padding: 1rem;
                    background-color: ${theme === "dark" ? "#444" : "#fff"};
                    color: ${theme === "dark" ? "#fff" : "#333"};
                }
                .tab-content.active {
                    display: block;
                }
                @media (max-width: 768px) {
                    .tab-headers {
                        flex-direction: column;
                    }
                }
            </style>
            <div class="tabs">
                <div class="tab-headers">
                    ${tabs
                      .map(
                        (tab, index) => `
                        <button class="tab-header ${
                          index === 0 ? "active" : ""
                        }" data-index="${index}">
                            ${tab.title}
                        </button>
                    `
                      )
                      .join("")}
                </div>
                ${tabs
                  .map(
                    (tab, index) => `
                    <div class="tab-content ${
                      index === 0 ? "active" : ""
                    }" data-index="${index}">
                        ${tab.content}
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll(".tab-header").forEach((header) => {
      header.addEventListener("click", () => {
        const index = header.dataset.index;
        this.activateTab(index);
      });
    });
  }

  activateTab(index) {
    this.shadowRoot.querySelectorAll(".tab-header").forEach((header) => {
      header.classList.toggle("active", header.dataset.index === index);
    });
    this.shadowRoot.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.toggle("active", content.dataset.index === index);
    });
  }
}

class PageProofreader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.aiType = "openai";
    this.model = "";
    this.serverUrl = "";
    this.responseKey = "";
  }

  static get observedAttributes() {
    return ["ai-type", "model", "server-url", "response-key"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "ai-type":
        this.aiType = newValue;
        break;
      case "model":
        this.model = newValue;
        break;
      case "server-url":
        this.serverUrl = newValue;
        break;
      case "response-key":
        this.responseKey = newValue;
        break;
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #4a90e2;
          --secondary-color: #2c3e50;
          --background-color: #f9f9f9;
          --text-color: #333;
          --border-color: #e0e0e0;
          --success-color: #27ae60;
          --error-color: #e74c3c;

          display: block;
          font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
          max-width: 1200px;
          margin: 2rem auto;
          padding: 2rem;
          background-color: var(--background-color);
          color: var(--text-color);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .proofreader {
          display: flex;
          gap: 2rem;
        }
        .input-section, .output-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: var(--secondary-color);
          color: white;
        }
        label {
          font-weight: 600;
          font-size: 1.1rem;
        }
        textarea {
          width: 100%;
          height: 400px;
          padding: 1rem;
          border: none;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
        }
        textarea:focus {
          outline: none;
        }
        button {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: var(--primary-color);
          color: white;
        }
        button:hover {
          background-color: #3498db;
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        button:active {
          transform: translateY(0);
        }
        .output {
          padding: 1rem;
          height: 400px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-size: 1rem;
          line-height: 1.6;
        }
        .loading {
          text-align: center;
          font-style: italic;
          color: var(--text-color);
          padding: 1rem;
        }
        .success {
          color: var(--success-color);
          font-weight: 600;
        }
        .error {
          color: var(--error-color);
          font-weight: 600;
        }
        .copy-btn {
          background-color: transparent;
          color: white;
          padding: 0.4rem 0.8rem;
          font-size: 0.9rem;
        }
        .copy-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        @media (max-width: 768px) {
          .proofreader {
            flex-direction: column;
          }
        }
      </style>
      <div class="proofreader">
        <div class="input-section">
          <div class="section-header">
            <label for="input">Original Text</label>
            <button id="proofread">Proofread</button>
          </div>
          <textarea id="input" placeholder="Enter your text here for proofreading..."></textarea>
        </div>
        <div class="output-section">
          <div class="section-header">
            <label for="output">Proofread Result</label>
            <button id="copy" class="copy-btn">Copy</button>
          </div>
          <div id="output" class="output"></div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const proofreadButton = this.shadowRoot.getElementById("proofread");
    proofreadButton.addEventListener("click", () => this.proofread());

    const copyButton = this.shadowRoot.getElementById("copy");
    copyButton.addEventListener("click", () => this.copyOutput());
  }

  async proofread() {
    const input = this.shadowRoot.getElementById("input").value;
    const output = this.shadowRoot.getElementById("output");

    if (!input.trim()) {
      output.innerHTML =
        '<span class="error">Please enter some text to proofread.</span>';
      return;
    }

    output.innerHTML = '<div class="loading">Proofreading...</div>';

    try {
      if (this.aiType === "ollama") {
        await this.proofreadOllama(input);
      } else if (this.aiType === "openai") {
        const result = await this.proofreadOpenAI(input);
        output.innerHTML = `${result}`;
      } else {
        const result = await this.proofreadCustom(input);
        output.innerHTML = `${result}`;
      }
    } catch (error) {
      output.innerHTML =
        '<span class="error">Error proofreading text. Please try again.</span>';
      console.error("Error:", error);
    }
  }

  async proofreadOllama(input) {
    const output = this.shadowRoot.getElementById("output");
    const prompt = `Proofread the following text. No comments, no verbose or any indication of results like (Here's a corrected version ) and the like. produce just text:\n\n${input}`;

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: true,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const parsedChunk = JSON.parse(chunk);
      output.innerHTML += parsedChunk.response;
    }
  }

  async proofreadOpenAI(input) {
    const prompt = `Proofread the following text. No comment, no verbose:\n\n${input}`;

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${window.EXLEMENT_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async proofreadCustom(input) {
    const prompt = `Proofread the following text. no comments. no verbose:\n\n${input}`;

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return this.extractResponse(data);
  }

  extractResponse(response) {
    if (this.responseKey) {
      const keys = this.responseKey.split(".");
      let result = response;
      for (const key of keys) {
        result = result[key];
        if (result === undefined) {
          console.error(`Key "${key}" not found in response`);
          return response;
        }
      }
      return result;
    }
    return response;
  }

  copyOutput() {
    const output = this.shadowRoot.getElementById("output");
    const text = output.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const copyButton = this.shadowRoot.getElementById("copy");
      const originalText = copyButton.innerText;
      copyButton.innerText = "Copied!";
      setTimeout(() => {
        copyButton.innerText = originalText;
      }, 2000);
    });
  }
}

class PageNavMenu extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["items", "theme", "animation", "logo", "logo-position"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }

  render() {
    const items = JSON.parse(this.getAttribute("items") || "[]");
    const theme = this.getAttribute("theme") || "light";
    const animation = this.getAttribute("animation") || "fade";
    const logo = this.getAttribute("logo") || "";
    const logoPosition = this.getAttribute("logo-position") || "left";

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                nav {
                    background-color: ${
                      theme === "dark" ? "#2c3e50" : "#ecf0f1"
                    };
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .nav-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .logo-container {
                    display: flex;
                    align-items: center;
                }
                .logo {
                    max-height: 40px;
                    margin-right: 1rem;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-wrap: wrap;
                }
                li {
                    margin-right: 1rem;
                    position: relative;
                }
                a {
                    color: ${theme === "dark" ? "#ecf0f1" : "#2c3e50"};
                    text-decoration: none;
                    padding: 0.7rem 1.2rem;
                    display: block;
                    transition: all 0.3s ease;
                    border-radius: 4px;
                }
                a:hover {
                    background-color: ${
                      theme === "dark" ? "#34495e" : "#bdc3c7"
                    };
                    transform: translateY(-2px);
                }
                .submenu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background-color: ${
                      theme === "dark" ? "#34495e" : "#ecf0f1"
                    };
                    border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    min-width: 150px;
                }
                li:hover > .submenu {
                    display: block;
                    animation: ${
                      animation === "slide"
                        ? "slideDown 0.3s ease"
                        : "fadeIn 0.3s ease"
                    };
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @media (max-width: 768px) {
                    .nav-container {
                        flex-direction: column;
                        align-items: center;
                    }
                    .logo-container {
                        margin-bottom: 1rem;
                    }
                    ul {
                        flex-direction: column;
                        align-items: center;
                    }
                    li {
                        margin-right: 0;
                        margin-bottom: 0.5rem;
                    }
                    .submenu {
                        position: static;
                        box-shadow: none;
                        padding-left: 1rem;
                    }
                }
            </style>
            <nav>
                <div class="nav-container" style="${this.getContainerStyle(
                  logoPosition
                )}">
                    <div class="logo-container">
                        ${
                          logo
                            ? `<img src="${logo}" alt="Logo" class="logo">`
                            : ""
                        }
                    </div>
                    ${this.renderMenu(items)}
                </div>
            </nav>
        `;
  }

  getContainerStyle(logoPosition) {
    switch (logoPosition) {
      case "left":
        return "flex-direction: row;";
      case "right":
        return "flex-direction: row-reverse;";
      case "center":
        return "flex-direction: column; align-items: center;";
      default:
        return "flex-direction: row;";
    }
  }

  renderMenu(items) {
    return `
            <ul>
                ${items
                  .map(
                    (item) => `
                    <li>
                        <a href="${item.url || "#"}">${item.text}</a>
                        ${
                          item.submenu
                            ? `<div class="submenu">${this.renderMenu(
                                item.submenu
                              )}</div>`
                            : ""
                        }
                    </li>
                `
                  )
                  .join("")}
            </ul>
        `;
  }
}

class PageLayout extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const columns = this.getAttribute("column") || "2";
    const optionsAttr = this.getAttribute("options") || "{}";
    const options = JSON.parse(optionsAttr.replace(/'/g, '"'));

    this.style.display = "grid";
    this.style.gap = "1rem";

    let templateColumns;
    switch (options.size) {
      case "same":
        templateColumns = `repeat(${columns}, 1fr)`;
        break;
      case "side-bar-left":
        templateColumns = "250px 1fr";
        break;
      case "side-bar-right":
        templateColumns = "1fr 250px";
        break;
      default:
        templateColumns = `repeat(${columns}, 1fr)`;
    }

    this.style.gridTemplateColumns = templateColumns;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaQuery = (e) => {
      if (e.matches) {
        this.style.gridTemplateColumns = "1fr";
      } else {
        this.style.gridTemplateColumns = templateColumns;
      }
    };
    mediaQuery.addListener(handleMediaQuery);
    handleMediaQuery(mediaQuery);
  }
}

class PageImageGallery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentSlide = 0;
    this.slideInterval = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const layout = this.getAttribute("layout") || "grid";
    const columns = parseInt(this.getAttribute("columns") || "3", 10);
    const images = JSON.parse(this.getAttribute("images") || "[]");
    const slideInterval = parseInt(
      this.getAttribute("slide-interval") || "5000",
      10
    );

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(${columns}, 1fr);
                    gap: 1rem;
                }
                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    aspect-ratio: 16/9;
                }
                .slideshow {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                }
                .slideshow .gallery-item {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                }
                .slideshow .gallery-item.active {
                    opacity: 1;
                }
                .slideshow-nav {
                    position: absolute;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 0.5rem;
                    z-index: 10;
                }
                .slideshow-nav button {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    border: none;
                    background-color: rgba(255,255,255,0.5);
                    cursor: pointer;
                }
                .slideshow-nav button.active {
                    background-color: white;
                }
                .slideshow-control {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 15%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    background-color: rgba(0,0,0,0);
                    border: none;
                    font-size: 2rem;
                    color: white;
                    text-shadow: 0 0 5px rgba(0,0,0,0.5);
                }
                .slideshow-control:hover {
                    background-color: rgba(0,0,0,0.1);
                }
                .slideshow-control.prev {
                    left: 0;
                }
                .slideshow-control.next {
                    right: 0;
                }
            </style>
            <div class="${layout === "grid" ? "gallery-grid" : "slideshow"}">
                ${images
                  .map(
                    (img, index) => `
                    <div class="gallery-item ${
                      layout === "slideshow" && index === 0 ? "active" : ""
                    }" data-index="${index}">
                        <img src="${img.src}" alt="${img.alt}">
                    </div>
                `
                  )
                  .join("")}
                ${
                  layout === "slideshow"
                    ? `
                    <button class="slideshow-control prev">&lt;</button>
                    <button class="slideshow-control next">&gt;</button>
                    <div class="slideshow-nav">
                        ${images
                          .map(
                            (_, index) => `
                            <button data-index="${index}" ${
                              index === 0 ? 'class="active"' : ""
                            }></button>
                        `
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            </div>
        `;

    if (layout === "slideshow") {
      this.setupSlideshow(slideInterval);
    }
  }

  setupSlideshow(interval) {
    const slides = this.shadowRoot.querySelectorAll(".gallery-item");
    const navButtons = this.shadowRoot.querySelectorAll(
      ".slideshow-nav button"
    );
    const prevButton = this.shadowRoot.querySelector(".prev");
    const nextButton = this.shadowRoot.querySelector(".next");

    const showSlide = (index) => {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
      });
      navButtons.forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
      });
      this.currentSlide = index;
    };

    const nextSlide = () => {
      showSlide((this.currentSlide + 1) % slides.length);
    };

    const prevSlide = () => {
      showSlide((this.currentSlide - 1 + slides.length) % slides.length);
    };

    navButtons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        showSlide(index);
        this.resetInterval(interval);
      });
    });

    prevButton.addEventListener("click", () => {
      prevSlide();
      this.resetInterval(interval);
    });

    nextButton.addEventListener("click", () => {
      nextSlide();
      this.resetInterval(interval);
    });

    this.startInterval(interval);
  }

  startInterval(interval) {
    this.slideInterval = setInterval(() => {
      const slides = this.shadowRoot.querySelectorAll(".gallery-item");
      const nextIndex = (this.currentSlide + 1) % slides.length;
      this.shadowRoot
        .querySelector(`.gallery-item[data-index="${nextIndex}"]`)
        .classList.add("active");
      this.shadowRoot
        .querySelector(`.gallery-item[data-index="${this.currentSlide}"]`)
        .classList.remove("active");
      this.shadowRoot
        .querySelector(`.slideshow-nav button[data-index="${nextIndex}"]`)
        .classList.add("active");
      this.shadowRoot
        .querySelector(
          `.slideshow-nav button[data-index="${this.currentSlide}"]`
        )
        .classList.remove("active");
      this.currentSlide = nextIndex;
    }, interval);
  }

  resetInterval(interval) {
    clearInterval(this.slideInterval);
    this.startInterval(interval);
  }

  disconnectedCallback() {
    clearInterval(this.slideInterval);
  }
}

class PageContentGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.serverUrl = "";
    this.aiType = "openai";
    this.model = "";
    this.customPrompt = "";
  }

  static get observedAttributes() {
    return ["server-url", "ai-type", "model", "custom-prompt"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "server-url") {
      this.serverUrl = newValue;
    } else if (name === "ai-type") {
      this.aiType = newValue;
    } else if (name === "model") {
      this.model = newValue;
    } else if (name === "custom-prompt") {
      this.customPrompt = newValue;
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          background-color: #f5f5f5;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          min-height: 600px;
        }
        .contentGen {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          height: 100%
        }
        .input-column, .output-column {
          display: flex;
          flex: 1;
          min-width: 300px;
          padding: 10px;
          flex-direction: column;
        }
        .output-column {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .input-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }
        input, select, textarea {
          width: 100%;
          padding: 0.75rem;
          margin: 0px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s, box-shadow 0.3s;
          transition: border-color 0.3s, box-shadow 0.3s;
          box-sizing: border-box;
          -webkit-appearance: none; 
          -moz-appearance: none;
          appearance: none;
        }
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23333' d='M0 2l4 4 4-4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 8px 8px;
          padding-right: 2rem;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }
        textarea {
          min-height: 120px;
          resize: vertical;
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.3s, transform 0.1s;
          width: 100%;
        }
        button:hover {
          background-color: #45a049;
        }
        button:active {
          transform: translateY(1px);
        }
        .output {
          position: relative;
          flex: 1;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1rem;
          background-color: white;
          white-space: pre-wrap;
          font-size: 0.9rem;
          line-height: 1.5;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 10px;
        }
        @media (max-width: 768px) {
          .contentGen {
            flex-direction: column;
          }
          :host {
            padding: 1rem;
          }
        }

      
      .copy-get-text-button {
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        color: #666;
        padding: 2px;
      }
      
      .copy-get-text-button:hover {
        color: #333;
      }
      </style>
      <div class="contentGen">
        <div class="input-column">
          <div class="input-group">
            <label for="topic">Topic:</label>
            <textarea id="topic" placeholder="Enter your topic or brief"></textarea>
          </div>
          <div class="input-group">
            <label for="type">Content Type:</label>
            <select id="type" >
              <option value="article">Article</option>
              <option value="blog-post">Blog Post</option>
              <option value="product-description">Product Description</option>
              <option value="social-media-post">Social Media Post</option>
              <option value="email-newsletter">Email Newsletter</option>
              <option value="press-release">Press Release</option>
              <option value="technical-writing">Technical Writing</option>
              <option value="creative-story">Creative Story</option>
            </select>
          </div>
          <div class="input-group">
            <label for="tone">Tone:</label>
            <select id="tone">
              <option value="informative">Informative</option>
              <option value="persuasive">Persuasive</option>
              <option value="humorous">Humorous</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="inspirational">Inspirational</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <div class="input-group">
            <label for="length">Length (words):</label>
            <input type="number" id="length" min="50" max="2000" value="500">
          </div>
          <div class="input-group">
            <label for="proofreading">Proofreading Level:</label>
            <select id="proofreading">
              <option value="basic">Basic</option>
              <option value="thorough">Thorough</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          <button id="generate">Generate Content</button>
        </div>
        <div class="output-column">
            <div class="output" id="output"></div>
            <span class="copy-get-text-button" id="copyButton" title="Copy to clipboard">📋</span>
         
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const generateButton = this.shadowRoot.getElementById("generate");
    generateButton.addEventListener("click", () => this.generateContent());

    const copyButton = this.shadowRoot.getElementById("copyButton");
    copyButton.addEventListener("click", () => this.copyOutputContent());
  }

  copyOutputContent() {
    const output = this.shadowRoot.getElementById("output");
    const text = output.textContent;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        const copyButton = this.shadowRoot.getElementById("copyButton");
        const originalText = copyButton.textContent;
        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  async generateContent() {
    const topic = this.shadowRoot.getElementById("topic").value;
    const type = this.shadowRoot.getElementById("type").value;
    const tone = this.shadowRoot.getElementById("tone").value;
    const length = this.shadowRoot.getElementById("length").value;
    const proofreading = this.shadowRoot.getElementById("proofreading").value;
    const output = this.shadowRoot.getElementById("output");

    output.textContent = "Generating content...";

    try {
      if (this.aiType === "ollama") {
        await this.generateOllamaContent(
          topic,
          type,
          tone,
          length,
          proofreading
        );
      } else {
        await this.generateOpenAIContent(
          topic,
          type,
          tone,
          length,
          proofreading
        );
      }
    } catch (error) {
      output.textContent = "Error generating content. Please try again.";
      console.error("Error:", error);
    }
  }

  async generateOllamaContent(topic, type, tone, length, proofreading) {
    const output = this.shadowRoot.getElementById("output");
    const prompt =
      this.customPrompt ||
      this.getDefaultPrompt(topic, type, tone, length, proofreading);

    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: true,
        }),
      });

      const reader = response.body.getReader();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;
          const parsedLine = JSON.parse(line);
          content += parsedLine.response;
          output.textContent = content;
        }
      }
    } catch (error) {
      console.error("Error generating Ollama content:", error);
      throw error;
    }
  }

  async generateOpenAIContent(topic, type, tone, length, proofreading) {
    const output = this.shadowRoot.getElementById("output");
    const prompt =
      this.customPrompt ||
      this.getDefaultPrompt(topic, type, tone, length, proofreading);

    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.EXLEMENT_CONFIG.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: parseInt(length) * 2,
        }),
      });

      const data = await response.json();
      output.textContent = data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating OpenAI content:", error);
      throw error;
    }
  }

  getDefaultPrompt(topic, type, tone, length, proofreading) {
    return `Write a ${tone} ${type} about "${topic}". The content should be approximately ${length} words long. 
    Apply ${proofreading} proofreading to ensure high-quality output. 
    If the topic is a question or requires specific information, provide a well-researched and accurate response.`;
  }
}

class PageContent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const level = this.getAttribute("level") || "1";
    const text = this.getAttribute("text") || "";

    this.innerHTML = text;

    switch (level) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
        this.style.display = "block";
        this.style.fontWeight = "bold";
        this.style.fontSize = `${2.5 - (level - 1) * 0.2}em`;
        this.style.margin = "0.5em 0";
        break;
      case "7":
        this.style.display = "block";
        this.style.margin = "1em 0";
        break;
      case "8":
        this.style.display = "inline";
        break;
      default:
        this.style.display = "block";
    }
  }
}

class PageContainer extends HTMLElement {
  connectedCallback() {
    // No need to render anything, just act as a container
  }
}

class PageColumn extends HTMLElement {
  connectedCallback() {
    const width = this.getAttribute("width") || "50%";
    this.style.flexBasis = width;
    this.style.flexGrow = "1";
    this.style.minWidth = "200px";
  }
}

class PageChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
    this.serverUrl = "";
    this.chatType = "default";
    this.model = "";
    this.responseKey = "";
  }

  static get observedAttributes() {
    return ["server-url", "chat-type", "model", "response-key"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "server-url") {
      this.serverUrl = newValue;
    } else if (name === "chat-type") {
      this.chatType = newValue;
    } else if (name === "model") {
      this.model = newValue;
    } else if (name === "response-key") {
      this.responseKey = newValue;
    }
    if (oldValue !== newValue) {
      this.fetchMessages();
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }
        .chat-container {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 500px;
          background-color: #e5ddd5;
        }
        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .message {
          max-width: 70%;
          padding: 0.5rem 1rem;
          border-radius: 7.5px;
          margin-bottom: 0.5rem;
          position: relative;
          word-wrap: break-word;
          clear: both;
        }
        .message::after {
          content: '';
          position: absolute;
          bottom: 0;
          width: 0;
          height: 0;
          border: 8px solid transparent;
        }
        .server-message {
          background-color: #ffffff;
          float: left;
          border-top-left-radius: 0;
        }
        .server-message::after {
          left: -15px;
          border-right-color: #ffffff;
          border-bottom-color: #ffffff;
        }
        .user-message {
          background-color: #dcf8c6;
          float: right;
          border-top-right-radius: 0;
        }
        .user-message::after {
          right: -15px;
          border-left-color: #dcf8c6;
          border-bottom-color: #dcf8c6;
        }
        .chat-input {
          display: flex;
          padding: 1rem;
          background-color: #f0f0f0;
          border-top: 1px solid #ddd;
        }
        input {
          flex-grow: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 20px;
          margin-right: 0.5rem;
        }
        button {
          background-color: #25D366;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        button:hover {
          background-color: #128C7E;
        }
        button::after {
          content: '➤';
          font-size: 1.2em;
        }
        .message strong {
          font-weight: bold;
        }
        .message em {
          font-style: italic;
        }
        .message code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
        }
        .message pre {
          position: relative;
          background-color: #1e1e1e;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
          margin: 10px 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .message pre code {
          background-color: transparent;
          color: #f8f8f2;
          padding: 0;
        }
        .copy-button {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #4CAF50;
          color: white;
          content: null;
          border: none;
          border-radius: 3px;
          padding: 3px 5px;
          font-size: 12px;
          cursor: pointer;
        }
        .copy-button:hover {
          background-color: #45a049;
        }
        .message ul, .message ol {
          margin-top: 5px;
          margin-bottom: 5px;
          padding-left: 20px;
        }
        .message li {
          margin-bottom: 3px;
        }
      </style>
      <div class="chat-container">
        <div class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" placeholder="Type a message">
          <button></button>
        </div>
      </div>
    `;
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

    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("copy-button")) {
        this.copyCodeToClipboard(e.target);
      }
    });
  }

  async fetchMessages() {
    try {
      const response = await fetch(this.serverUrl);
      const data = await response.json();
      this.messages = data.messages || [];
      this.updateChatMessages();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async sendMessage() {
    const input = this.shadowRoot.querySelector("input");
    const message = input.value.trim();

    if (message) {
      this.messages.push({ text: message, type: "user" });
      this.updateChatMessages();
      input.value = "";

      if (this.chatType === "ollama") {
        await this.sendOllamaMessage(message);
      } else if (this.chatType === "openai") {
        await this.sendOpenAIMessage(message);
      } else {
        await this.sendDefaultMessage(message);
      }
    }
  }

  async sendOpenAIMessage(message) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.EXLEMENT_CONFIG.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: "user", content: message }],
            stream: true,
          }),
        }
      );

      const reader = response.body.getReader();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the stream
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonString = line.slice(6); // Remove 'data: ' prefix
            if (jsonString.trim() === "[DONE]") {
              break;
            }
            try {
              const parsedData = JSON.parse(jsonString);
              const contentDelta = parsedData.choices[0].delta.content;
              if (contentDelta) {
                assistantMessage += contentDelta;
                this.updateAssistantMessage(assistantMessage);
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }

      this.messages.push({ text: assistantMessage, type: "server" });
      this.updateChatMessages();
    } catch (error) {
      console.error("Error sending OpenAI message:", error);
    }
  }

  async sendOllamaMessage(message) {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: message }],
        }),
      });

      const reader = response.body.getReader();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;
          const parsedLine = JSON.parse(line);
          assistantMessage += parsedLine.message.content;
          this.updateAssistantMessage(assistantMessage);
        }
      }

      this.messages.push({ text: assistantMessage, type: "server" });
      this.updateChatMessages();
    } catch (error) {
      console.error("Error sending Ollama message:", error);
    }
  }

  async sendDefaultMessage(message) {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      let replyContent = data;

      if (this.responseKey) {
        const keys = this.responseKey.split(".");
        for (const key of keys) {
          replyContent = replyContent[key];
        }
      }

      if (replyContent) {
        this.messages.push({ text: replyContent, type: "server" });
        this.updateChatMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  updateAssistantMessage(message) {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    const lastMessage = chatMessages.lastElementChild;

    if (lastMessage && lastMessage.classList.contains("server-message")) {
      lastMessage.innerHTML = this.formatMessage(message);
    } else {
      const newMessage = document.createElement("div");
      newMessage.classList.add("message", "server-message");
      newMessage.innerHTML = this.formatMessage(message);
      chatMessages.appendChild(newMessage);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  updateChatMessages() {
    const chatMessages = this.shadowRoot.querySelector(".chat-messages");
    chatMessages.innerHTML = this.messages
      .map(
        (message) => `
      <div class="message ${
        message.type === "server" ? "server-message" : "user-message"
      }">
        ${this.formatMessage(message.text)}
      </div>
    `
      )
      .join("");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  formatMessage(text) {
    // Convert markdown to HTML
    return (
      text
        // Code blocks
        .replace(
          /```(\w+)?\n([\s\S]*?)```/g,
          (match, lang, code) => `
        <pre><code class="language-${lang || "plaintext"}">${this.escapeHtml(
            code.trim()
          )}</code>
        <span class="copy-button">Copy</span></pre>
      `
        )
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Unordered lists
        .replace(/^\s*[-*+]\s+(.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
        // Ordered lists
        .replace(/^\s*(\d+)\.\s+(.+)$/gm, "<li>$2</li>")
        .replace(/(<li>.*<\/li>)/s, "<ol>$1</ol>")
        // Line breaks
        .replace(/\n/g, "<br>")
    );
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  copyCodeToClipboard(button) {
    const pre = button.closest("pre");
    const code = pre.querySelector("code");
    const text = code.textContent;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }
}
class PageCardLayout extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupResizeObserver();
  }

  render() {
    const columns = this.getAttribute("columns") || "3";
    const minCardWidth = this.getAttribute("min-card-width") || "250px";

    this.style.display = "grid";
    this.style.gap = "1rem";
    this.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`;

    // Ensure a maximum of 'columns' number of columns
    this.style.gridTemplateColumns = `repeat(auto-fit, minmax(max(${minCardWidth}, 100%/${columns}), 1fr))`;
  }

  setupResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const columns = this.getAttribute("columns") || "3";
        const minCardWidth = this.getAttribute("min-card-width") || "250px";

        if (width < parseInt(minCardWidth) * parseInt(columns)) {
          this.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minCardWidth}, 1fr))`;
        } else {
          this.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        }
      }
    });

    resizeObserver.observe(this);
  }
}
class PageCard extends HTMLElement {
  connectedCallback() {
    this.style.border = "1px solid #ddd";
    this.style.borderRadius = "4px";
    this.style.padding = "1rem";
    this.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  }
}

class PageBottom extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const dataAttr = this.getAttribute("data");
    if (!dataAttr) {
      console.error("No data attribute provided for page-bottom");
      return;
    }
    const config = JSON.parse(dataAttr.replace(/'/g, '"'));
    this.innerHTML = `
                    <p>&copy; ${config.copyright}</p>
                    <nav>
                        ${config.links
                          .map((link) => `<a href="#">${link}</a>`)
                          .join("")}
                    </nav>
                `;
  }
}
class PageAICodeEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.aiType = "openai";
    this.model = "";
    this.serverUrl = "";
    this.apiKey = "";
    this.debounceTimeout = null;
    this.language = "javascript";
    this.editor = null;
  }

  static get observedAttributes() {
    return ["ai-type", "model", "server-url", "language"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "ai-type":
        this.aiType = newValue;
        this.updateAITypeUI();
        break;
      case "model":
        this.model = newValue;
        break;
      case "server-url":
        this.serverUrl = newValue;
        break;
      case "language":
        this.language = newValue;
        this.updateEditorLanguage();
        break;
    }
  }

  connectedCallback() {
    this.render();
    this.setupCodeMirror();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css');
        :host {
          display: block;
          font-family: 'Roboto Mono', monospace;
          max-width: 1200px;
          margin: 2rem auto;
        }
        .editor-container {
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #282a36;
          color: #f8f8f2;
        }
        .language-select, .ai-type-select {
          padding: 0.5rem;
          border-radius: 4px;
          background-color: #44475a;
          color: #f8f8f2;
          border: none;
          font-size: 14px;
        }
        #api-key-input {
          padding: 0.5rem;
          border-radius: 4px;
          background-color: #44475a;
          color: #f8f8f2;
          border: none;
          font-size: 14px;
          width: 200px;
          margin-left: 0.5rem;
        }
        #code-editor {
          width: 100%;
        }
        .suggestions {
          padding: 1rem;
          background-color: #282a36;
          color: #f8f8f2;
          border-top: 1px solid #44475a;
          max-height: 200px;
          overflow-y: auto;
        }
        .suggestion {
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background-color: #44475a;
          border-radius: 4px;
          font-size: 14px;
        }
        .error {
          color: #ff5555;
          font-weight: bold;
        }
        .btn {
          background-color: #50fa7b;
          color: #282a36;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-left: 0.5rem;
        }
        .btn:hover {
          background-color: #5af78e;
        }
        .preview-container {
          display: flex;
          flex-direction: column;
          background-color: #f8f8f2;
          border-top: 1px solid #44475a;
          padding: 1rem;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        #preview-frame {
          width: 100%;
          height: 300px;
          border: none;
          background-color: white;
        }
        #console-output {
          width: 100%;
          height: 300px;
          background-color: #282a36;
          color: #f8f8f2;
          font-family: 'Roboto Mono', monospace;
          padding: 0.5rem;
          overflow-y: auto;
          white-space: pre-wrap;
        }
      </style>
      <div class="editor-container">
        <div class="editor-header">
          <div>
            <select class="language-select">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            <select class="ai-type-select">
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
            </select>
            <input type="password" id="api-key-input" placeholder="API Key" style="display: none;">
          </div>
          <span>AI-Assisted Code Editor</span>
          <div>
            <button class="btn generate-btn">Generate Code</button>
            <button class="btn run-btn">Run</button>
          </div>
        </div>
        <textarea id="code-editor"></textarea>
        <div class="suggestions"></div>
        <div class="preview-container">
          <div class="preview-header">
            <h3>Preview</h3>
            <button class="btn clear-btn">Clear</button>
          </div>
          <iframe id="preview-frame" style="display:none;"></iframe>
          <pre id="console-output" style="display:none;"></pre>
        </div>
      </div>
    `;
  }

  setupCodeMirror() {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js";
    script.onload = () => {
      const modeScript = document.createElement("script");
      modeScript.src = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/${this.language}/${this.language}.min.js`;
      modeScript.onload = () => {
        this.initializeCodeMirror();
      };
      document.head.appendChild(modeScript);
    };
    document.head.appendChild(script);
  }

  initializeCodeMirror() {
    const textarea = this.shadowRoot.getElementById("code-editor");
    this.editor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      theme: "dracula",
      mode: this.language,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 2,
      tabSize: 2,
      indentWithTabs: false,
      lineWrapping: true,
    });

    this.editor.on("change", () => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => this.getAISuggestions(), 500);
    });
  }

  updateEditorLanguage() {
    if (this.editor) {
      this.editor.setOption("mode", this.language);
    }
    this.updatePreviewVisibility();
  }

  updatePreviewVisibility() {
    const previewFrame = this.shadowRoot.getElementById("preview-frame");
    const consoleOutput = this.shadowRoot.getElementById("console-output");

    if (
      this.language === "javascript" ||
      this.language === "html" ||
      this.language === "css"
    ) {
      previewFrame.style.display = "block";
      consoleOutput.style.display = "none";
    } else {
      previewFrame.style.display = "none";
      consoleOutput.style.display = "block";
    }
  }

  setupEventListeners() {
    const languageSelect = this.shadowRoot.querySelector(".language-select");
    const aiTypeSelect = this.shadowRoot.querySelector(".ai-type-select");
    const apiKeyInput = this.shadowRoot.getElementById("api-key-input");
    const generateBtn = this.shadowRoot.querySelector(".generate-btn");
    const runBtn = this.shadowRoot.querySelector(".run-btn");
    const clearBtn = this.shadowRoot.querySelector(".clear-btn");

    languageSelect.addEventListener("change", (event) => {
      this.language = event.target.value;
      this.updateEditorLanguage();
      this.getAISuggestions();
    });

    aiTypeSelect.addEventListener("change", (event) => {
      this.aiType = event.target.value;
      this.updateAITypeUI();
    });

    apiKeyInput.addEventListener("change", (event) => {
      this.apiKey = event.target.value;
    });

    generateBtn.addEventListener("click", () =>
      this.generateCodeFromComments()
    );
    runBtn.addEventListener("click", () => this.runCode());
    clearBtn.addEventListener("click", () => this.clearPreview());
  }

  updateAITypeUI() {
    const apiKeyInput = this.shadowRoot.getElementById("api-key-input");
    if (this.aiType === "openai") {
      apiKeyInput.style.display = "inline-block";
    } else {
      apiKeyInput.style.display = "none";
    }
  }

  runCode() {
    const code = this.editor.getValue();

    if (this.language === "javascript") {
      this.runJavaScript(code);
    } else if (this.language === "html") {
      this.runHTML(code);
    } else if (this.language === "css") {
      this.runCSS(code);
    } else if (this.language === "python") {
      this.runPython(code);
    }
  }

  runJavaScript(code) {
    const previewFrame = this.shadowRoot.getElementById("preview-frame");
    previewFrame.srcdoc = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h1>JavaScript Output:</h1>
          <div id="output"></div>
          <script>
            function log(message) {
              const output = document.getElementById('output');
              output.innerHTML += message + '<br>';
            }
            console.log = log;
            console.error = log;
            console.warn = log;
            console.info = log;
            try {
              ${code}
            } catch (error) {
              log('Error: ' + error.message);
            }
          </script>
        </body>
      </html>
    `;
  }

  runHTML(code) {
    const previewFrame = this.shadowRoot.getElementById("preview-frame");
    previewFrame.srcdoc = code;
  }

  runCSS(code) {
    const previewFrame = this.shadowRoot.getElementById("preview-frame");
    previewFrame.srcdoc = `
      <html>
        <head>
          <style>${code}</style>
        </head>
        <body>
          <h1>CSS Preview</h1>
          <p>This is a paragraph to demonstrate text styling.</p>
          <div class="example">This is a div with the class "example".</div>
          <button>This is a button</button>
        </body>
      </html>
    `;
  }

  runPython(code) {
    const consoleOutput = this.shadowRoot.getElementById("console-output");
    consoleOutput.textContent = "Python output (simulated):\n\n";
    consoleOutput.textContent +=
      "Note: This is a simulated output. For actual Python execution, you would need a backend service.\n\n";
    consoleOutput.textContent += code;
  }

  clearPreview() {
    const previewFrame = this.shadowRoot.getElementById("preview-frame");
    const consoleOutput = this.shadowRoot.getElementById("console-output");
    previewFrame.srcdoc = "";
    consoleOutput.textContent = "";
  }

  async getAISuggestions() {
    const suggestionsContainer = this.shadowRoot.querySelector(".suggestions");
    const code = this.editor.getValue();

    if (!code.trim()) {
      suggestionsContainer.innerHTML = "";
      return;
    }

    const prompt = `
      Language: ${this.language}
      Code:
      ${code}

      Provide the following:
      1. Code completion suggestions
      2. Potential errors or improvements
      3. Brief explanation of a complex part (if any)

      Format the response as JSON with the following structure:
      {
        "completions": ["suggestion1", "suggestion2", ...],
        "errors": ["error1", "error2", ...],
        "explanation": "Brief explanation here"
      }
    `;

    try {
      let response;
      if (this.aiType === "ollama") {
        response = await this.getOllamaSuggestions(prompt);
      } else {
        response = await this.getOpenAISuggestions(prompt);
      }

      const suggestions = JSON.parse(response);
      this.renderSuggestions(suggestions);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      suggestionsContainer.innerHTML =
        '<div class="error">Error getting AI suggestions. Please try again.</div>';
    }
  }

  async generateCodeFromComments() {
    const code = this.editor.getValue();
    const comments = this.extractComments(code);

    if (comments.length === 0) {
      alert("Please add comments to generate code.");
      return;
    }

    const prompt = `
      Language: ${this.language}
      Comments:
      ${comments.join("\n")}

      Generate code based on these comments. Format the response as a string containing only the generated code.
    `;

    try {
      let response;
      if (this.aiType === "ollama") {
        response = await this.getOllamaSuggestions(prompt);
      } else {
        response = await this.getOpenAISuggestions(prompt);
      }

      this.editor.setValue(response);
    } catch (error) {
      console.error("Error generating code:", error);
      alert("Error generating code. Please try again.");
    }
  }

  extractComments(code) {
    const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
    return code.match(commentRegex) || [];
  }

  async getOllamaSuggestions(prompt) {
    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
      }),
    });

    const data = await response.json();
    return data.response;
  }

  async getOpenAISuggestions(prompt) {
    if (!this.apiKey) {
      throw new Error("API key is required for OpenAI");
    }

    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  renderSuggestions(suggestions) {
    const suggestionsContainer = this.shadowRoot.querySelector(".suggestions");
    suggestionsContainer.innerHTML = "";

    if (suggestions.completions && suggestions.completions.length > 0) {
      const completionsElement = document.createElement("div");
      completionsElement.innerHTML = "<strong>Suggestions:</strong>";
      completionsElement.innerHTML += suggestions.completions
        .map((suggestion) => `<div class="suggestion">${suggestion}</div>`)
        .join("");
      suggestionsContainer.appendChild(completionsElement);
    }

    if (suggestions.errors && suggestions.errors.length > 0) {
      const errorsElement = document.createElement("div");
      errorsElement.innerHTML = "<strong>Potential issues:</strong>";
      errorsElement.innerHTML += suggestions.errors
        .map((error) => `<div class="suggestion error">${error}</div>`)
        .join("");
      suggestionsContainer.appendChild(errorsElement);
    }

    if (suggestions.explanation) {
      const explanationElement = document.createElement("div");
      explanationElement.innerHTML = `<strong>Explanation:</strong><div class="suggestion">${suggestions.explanation}</div>`;
      suggestionsContainer.appendChild(explanationElement);
    }
  }
}

customElements.define("page-ai-code-editor", PageAICodeEditor);
customElements.define("page-bottom", PageBottom);
customElements.define("page-card", PageCard);
customElements.define("page-card-layout", PageCardLayout);
customElements.define("page-chat", PageChat);
customElements.define("page-column", PageColumn);
customElements.define("page-container", PageContainer);
customElements.define("page-content", PageContent);
customElements.define("page-content-generator", PageContentGenerator);
customElements.define("page-image-gallery", PageImageGallery);
customElements.define("page-layout", PageLayout);
customElements.define("page-nav-menu", PageNavMenu);
customElements.define("page-proofreader", PageProofreader);
customElements.define("page-tabs", PageTabs);
customElements.define("page-top", PageTop);
customElements.define("page-base", PageBase);
