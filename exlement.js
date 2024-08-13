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
      : { logo: "left", bgColor: "#f8f9fa", textColor: "#333" };

    const logoHtml = `<img src="${config.logo}" alt="Logo">`;
    const navHtml = `<nav>${config.links
      .map((link) => {
        if (typeof link === "string") {
          return `<a href="#">${link}</a>`;
        } else if (typeof link === "object" && link.text && link.url) {
          return `<a href="${link.url}">${link.text}</a>`;
        }
        return "";
      })
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
    this.style.backgroundColor = option.bgColor || "#f8f9fa";
    this.style.color = option.textColor || "#333";

    // Apply text color to links
    const links = this.querySelectorAll("a");
    links.forEach((link) => {
      link.style.color = option.textColor || "#333";
    });
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
    const optionsAttr = this.getAttribute("options");
    const customCssAttr = this.getAttribute("custom-css");

    // Default options
    const defaultOptions = {
      size: "same",
      gutter: "1rem",
      spacing: "1rem",
      padding: "0",
    };

    // Merge default options with user-provided options
    const options = optionsAttr
      ? { ...defaultOptions, ...JSON.parse(optionsAttr.replace(/'/g, '"')) }
      : defaultOptions;

    const customCss = customCssAttr
      ? JSON.parse(customCssAttr.replace(/'/g, '"'))
      : {};

    this.style.display = "grid";
    this.style.columnGap = options.gutter;
    this.style.rowGap = options.spacing;
    this.style.padding = options.padding;

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
      case "stq":
        templateColumns = " 1fr 0.5fr";
        break;
      default:
        templateColumns = `repeat(${columns}, 1fr)`;
    }

    this.style.gridTemplateColumns = templateColumns;

    // Apply custom CSS
    Object.keys(customCss).forEach((property) => {
      this.style[property] = customCss[property];
    });

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
    const optionAttr = this.getAttribute("option");
    if (!dataAttr) {
      console.error("No data attribute provided for page-bottom");
      return;
    }
    const config = JSON.parse(dataAttr.replace(/'/g, '"'));
    const option = optionAttr
      ? JSON.parse(optionAttr.replace(/'/g, '"'))
      : {
          bgColor: "#f8f9fa",
          textColor: "#333",
          align: "center",
          font: "Arial, sans-serif",
        };

    const copyright = `<p class="copyright">&copy; ${config.copyright}</p>`;
    const navHtml = `<nav>${config.links
      .map((link) => {
        if (typeof link === "string") {
          return `<a href="#">${link}</a>`;
        } else if (typeof link === "object" && link.text && link.url) {
          return `<a href="${link.url}">${link.text}</a>`;
        }
        return "";
      })
      .join("")}</nav>`;

    this.innerHTML = `
      <div class="footer-content">
        ${copyright}
        ${navHtml}
      </div>
    `;

    // Apply styles to the component
    this.style.backgroundColor = option.bgColor || "#f8f9fa";
    this.style.color = option.textColor || "#333";
    this.style.padding = "1rem";
    this.style.fontFamily = option.font || "Arial, sans-serif";

    // Apply alignment and styling
    const footerContent = this.querySelector(".footer-content");
    footerContent.style.display = "flex";
    footerContent.style.flexDirection =
      option.align === "center" ? "column" : "row";
    footerContent.style.alignItems =
      option.align === "center" ? "center" : "baseline";
    footerContent.style.justifyContent =
      option.align === "right"
        ? "flex-end"
        : option.align === "center"
        ? "center"
        : "space-between";

    // Style the copyright
    const copyrightElement = this.querySelector(".copyright");
    copyrightElement.style.margin = "0";
    copyrightElement.style.marginRight =
      option.align !== "center" ? "1rem" : "0";

    // Style the nav
    const nav = this.querySelector("nav");
    nav.style.display = "flex";
    nav.style.flexWrap = "wrap";
    nav.style.justifyContent =
      option.align === "center" ? "center" : "flex-start";
    nav.style.marginTop = option.align === "center" ? "0.5rem" : "0";

    // Apply text color and font to links
    const links = this.querySelectorAll("a");
    links.forEach((link) => {
      link.style.color = option.textColor || "#333";
      link.style.marginLeft = "0.5rem";
      link.style.marginRight = "0.5rem";
      link.style.textDecoration = "none";
      link.style.fontFamily = option.font || "Arial, sans-serif";
    });
  }
}

class PageImageContent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const dataAttr = this.getAttribute("data");
    const optionAttr = this.getAttribute("option");
    if (!dataAttr) {
      console.error("No data attribute provided for page-image-content");
      return;
    }
    const data = JSON.parse(dataAttr.replace(/'/g, '"'));
    const option = optionAttr
      ? JSON.parse(optionAttr.replace(/'/g, '"'))
      : { imagePosition: "left" };

    const imageHtml = `<div class="image-container"><img src="${data.image}" alt="Content Image"></div>`;
    const contentHtml = `
      <div class="content-container">
        ${data.title ? `<h2>${data.title}</h2>` : ""}
        <p>${data.content}</p>
      </div>
    `;

    this.innerHTML = `
      <div class="image-content-wrapper">
        ${imageHtml}
        ${contentHtml}
      </div>
    `;

    this.style.cssText = `
      display: block;
      font-family: Arial, sans-serif;
      margin: 20px 0;
    `;

    const wrapper = this.querySelector(".image-content-wrapper");
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 20px;
      flex-direction: ${
        option.imagePosition === "right" ? "row-reverse" : "row"
      };
    `;

    const imageContainer = this.querySelector(".image-container");
    imageContainer.style.cssText = `
      flex: 1;
      max-width: 50%;
    `;

    const image = this.querySelector("img");
    image.style.cssText = `
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 8px;
    `;

    const contentContainer = this.querySelector(".content-container");
    contentContainer.style.cssText = `
      flex: 1;
    `;

    const title = this.querySelector("h2");
    if (title) {
      title.style.cssText = `
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 24px;
        color: #333;
      `;
    }

    const content = this.querySelector("p");
    content.style.cssText = `
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
      color: #666;
    `;

    // Add media query for responsiveness
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaQueryChange = (e) => {
      if (e.matches) {
        // Mobile styles
        wrapper.style.flexDirection = "column";
        imageContainer.style.maxWidth = "100%";
        imageContainer.style.marginBottom = "20px";
        contentContainer.style.width = "100%";
        if (title) {
          title.style.fontSize = "20px";
        }
        content.style.fontSize = "14px";
      } else {
        // Desktop styles
        wrapper.style.flexDirection =
          option.imagePosition === "right" ? "row-reverse" : "row";
        imageContainer.style.maxWidth = "50%";
        imageContainer.style.marginBottom = "0";
        contentContainer.style.width = "auto";
        if (title) {
          title.style.fontSize = "24px";
        }
        content.style.fontSize = "16px";
      }
    };

    // Initial call to set the correct styles
    handleMediaQueryChange(mediaQuery);

    // Add listener for viewport changes
    mediaQuery.addListener(handleMediaQueryChange);
  }
}

class PageTeam extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const teamData = JSON.parse(this.getAttribute("data") || "[]");
    const options = JSON.parse(this.getAttribute("options") || "{}");

    const imageShape = options.imageShape || "circle";
    const bgColor = options.bgColor || "#f8f9fa";
    const textColor = options.textColor || "#333333";
    const accentColor = options.accentColor || "#007bff";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: ${bgColor};
          color: ${textColor};
          font-family: 'Arial', sans-serif;
          padding: 2rem;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h2 {
          text-align: center;
          font-size: clamp(2rem, 5vw, 2.5rem);
          margin-bottom: 2rem;
          color: ${accentColor};
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        .team-member {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem;
          background-color: ${this.lightenDarkenColor(bgColor, 20)};
          border-radius: 10px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .team-member:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .member-image {
          width: 150px;
          height: 150px;
          object-fit: cover;
          border: 3px solid ${accentColor};
          ${
            imageShape === "circle"
              ? "border-radius: 50%;"
              : "border-radius: 10px;"
          }
          margin-bottom: 1rem;
        }
        .member-name {
          font-size: clamp(1.1rem, 3vw, 1.25rem);
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .member-role {
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          color: ${accentColor};
          margin-bottom: 1rem;
        }
        .member-bio {
          font-size: clamp(0.8rem, 2vw, 0.9rem);
          line-height: 1.5;
        }
        @media (max-width: 1024px) {
          .team-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        @media (max-width: 768px) {
          :host {
            padding: 1.5rem;
          }
          .team-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.5rem;
          }
          .member-image {
            width: 120px;
            height: 120px;
          }
        }
        @media (max-width: 480px) {
          :host {
            padding: 1rem;
          }
          .team-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .team-member {
            padding: 1rem;
          }
          .member-image {
            width: 100px;
            height: 100px;
          }
        }
      </style>
      <div class="container">
        <h2>Our Team</h2>
        <div class="team-grid">
          ${teamData
            .map(
              (member) => `
            <div class="team-member">
              <img src="${member.image}" alt="${member.name}" class="member-image">
              <div class="member-name">${member.name}</div>
              <div class="member-role">${member.role}</div>
              <div class="member-bio">${member.bio}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00ff) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000ff) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
  }
}

class PageProductInfo extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const dataAttr = this.getAttribute("data");
    const optionAttr = this.getAttribute("option");
    if (!dataAttr) {
      console.error("No data attribute provided for page-product-info");
      return;
    }
    const data = JSON.parse(dataAttr.replace(/'/g, '"'));
    const option = optionAttr
      ? JSON.parse(optionAttr.replace(/'/g, '"'))
      : {
          layout: "vertical",
          bgColor: "#ffffff",
          textColor: "#333333",
          buttonColor: "#4CAF50",
          buttonTextColor: "#ffffff",
        };

    this.innerHTML = `
      <div class="product-info-wrapper">
        <div class="image-container">
          <img src="${data.image}" alt="${data.title}">
        </div>
        <div class="content-container">
          <h2>${data.title}</h2>
          <p>${data.text}</p>
          <button class="read-more-btn">${
            data.buttonText || "Read More"
          }</button>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      @media (max-width: 768px) {
        .product-info-wrapper {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .image-container {
          flex: 1 !important;
          max-width: 100% !important;
        }
      }
    `;
    this.appendChild(style);

    this.style.cssText = `
      display: block;
      font-family: Arial, sans-serif;
      background-color: ${option.bgColor};
      color: ${option.textColor};
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    `;

    const wrapper = this.querySelector(".product-info-wrapper");
    wrapper.style.cssText = `
      display: flex;
      flex: 1;
      flex-direction: ${option.layout === "horizontal" ? "row" : "column"};
      align-items: ${option.layout === "horizontal" ? "center" : "stretch"};
      gap: ${option.layout === "horizontal" ? "10px" : "20px"};
      spacing: 10px
    `;

    const imageContainer = this.querySelector(".image-container");
    imageContainer.style.cssText = `
      flex: ${option.layout === "horizontal" ? "0 0 40%" : "1"};
      max-width: ${option.layout === "horizontal" ? "40%" : "100%"};
    `;

    const image = this.querySelector("img");
    image.style.cssText = `
      width: 100%;
      height: auto;
      object-fit: cover;
      border-radius: 8px;
    `;

    const contentContainer = this.querySelector(".content-container");
    contentContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
    `;

    const title = this.querySelector("h2");
    title.style.cssText = `
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 24px;
    `;

    const text = this.querySelector("p");
    text.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 16px;
      line-height: 1.5;
    `;

    const button = this.querySelector(".read-more-btn");
    button.style.cssText = `
      align-self: flex-start;
      padding: 10px 20px;
      font-size: 16px;
      font-weight: bold;
      color: ${option.buttonTextColor};
      background-color: ${option.buttonColor};
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s, transform 0.1s;
    `;

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = this.lightenDarkenColor(
        option.buttonColor,
        -20
      );
    });

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = option.buttonColor;
    });

    button.addEventListener("mousedown", () => {
      button.style.transform = "scale(0.98)";
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "scale(1)";
    });
  }

  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00ff) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000ff) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
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

class PageTestimonial extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const data = JSON.parse(this.getAttribute("data") || "{}");
    const theme = this.getAttribute("theme") || "light";
    const bgColor =
      this.getAttribute("bg-color") ||
      (theme === "dark" ? "#2c3e50" : "#ffffff");
    const textColor =
      this.getAttribute("text-color") ||
      (theme === "dark" ? "#ecf0f1" : "#2c3e50");
    const fontSize = this.getAttribute("font-size") || "16px";
    const fontStyle = this.getAttribute("font-style") || "Arial, sans-serif";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: ${fontStyle};
          font-size: ${fontSize};
          max-width: 800px;
          margin: 2rem auto;
          background-color: ${bgColor};
          color: ${textColor};
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        :host(:hover) {
          transform: translateY(-5px);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
        }

        .testimonial-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 2rem;
        }

        .image-container {
          flex: 0 0 150px;
          margin-right: 2rem;
        }

        .image-container img {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid ${theme === "dark" ? "#3498db" : "#e74c3c"};
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .content-container {
          flex: 1;
        }

        .quote {
          font-size: 1.2em;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-style: italic;
          position: relative;
        }

        .quote::before,
        .quote::after {
          content: '"';
          font-size: 3em;
          color: ${theme === "dark" ? "#3498db" : "#e74c3c"};
          position: absolute;
          opacity: 0.3;
        }

        .quote::before {
          top: -1rem;
          left: -1rem;
        }

        .quote::after {
          bottom: -2rem;
          right: -1rem;
        }

        .author {
          font-weight: bold;
          font-size: 1.1em;
          margin-bottom: 0.3rem;
        }

        .role {
          font-size: 0.9em;
          opacity: 0.7;
        }

        @media (max-width: 600px) {
          .testimonial-container {
            flex-direction: column;
            text-align: center;
          }

          .image-container {
            margin-right: 0;
            margin-bottom: 1.5rem;
          }
        }
      </style>
      <div class="testimonial-container">
        <div class="image-container">
          <img src="${data.image}" alt="${data.name}">
        </div>
        <div class="content-container">
          <div class="quote">${data.quote}</div>
          <div class="author">${data.name}</div>
          <div class="role">${data.role}</div>
        </div>
      </div>
    `;
  }
}

class PageHeading extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const subtitle = this.getAttribute("subtitle") || "";
    const title = this.getAttribute("title") || "";
    const text = this.getAttribute("text") || "";

    const options = {
      bgColor: this.getAttribute("bg-color") || "transparent",
      subtitleColor: this.getAttribute("subtitle-color") || "#666",
      titleColor: this.getAttribute("title-color") || "#333",
      textColor: this.getAttribute("text-color") || "#444",
      subtitleFont: this.getAttribute("subtitle-font") || "inherit",
      titleFont: this.getAttribute("title-font") || "inherit",
      textFont: this.getAttribute("text-font") || "inherit",
      subtitleSize: this.getAttribute("subtitle-size") || "16",
      titleSize: this.getAttribute("title-size") || "40",
      textSize: this.getAttribute("text-size") || "16",
      align: this.getAttribute("align") || "center",
      padding: this.getAttribute("padding") || "2rem",
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: ${options.bgColor};
          padding: ${options.padding};
          text-align: ${options.align};
        }
        .heading-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .subtitle {
          color: ${options.subtitleColor};
          font-family: ${options.subtitleFont};
          font-size: calc(${options.subtitleSize}px + 0.1vw);
          margin-bottom: 0.5rem;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .title {
          color: ${options.titleColor};
          font-family: ${options.titleFont};
          font-size: calc(${options.titleSize}px + 1vw);
          margin: 0.5rem 0;
          font-weight: bold;
          line-height: 1.2;
        }
        .text {
          color: ${options.textColor};
          font-family: ${options.textFont};
          font-size: calc(${options.textSize}px + 0.1vw);
          margin-top: 1rem;
          line-height: 1.5;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 768px) {
          :host {
            padding: 1.5rem;
          }
          .subtitle {
            font-size: calc(${options.subtitleSize}px - 2px);
          }
          .title {
            font-size: calc(${options.titleSize}px - 8px);
          }
          .text {
            font-size: calc(${options.textSize}px - 1px);
          }
        }
        @media (max-width: 480px) {
          :host {
            padding: 1rem;
          }
          .subtitle {
            font-size: calc(${options.subtitleSize}px - 4px);
          }
          .title {
            font-size: calc(${options.titleSize}px - 16px);
          }
          .text {
            font-size: calc(${options.textSize}px - 2px);
          }
        }
      </style>
      <div class="heading-container">
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
        <h2 class="title">${title}</h2>
        ${text ? `<div class="text">${text}</div>` : ""}
      </div>
    `;
  }
}

class PageTranslator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.worker = null;
  }

  static get observedAttributes() {
    return ["data", "options", "model"];
  }

  async connectedCallback() {
    this.render();
    await this.initializeTranslator();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      if (name === "model") {
        this.initializeTranslator();
      }
    }
  }

  render() {
    const data = JSON.parse(this.getAttribute("data") || "{}");
    const options = JSON.parse(this.getAttribute("options") || "{}");
    const customModel = this.getAttribute("model");

    const languages = data.languages || [
      { code: "en", name: "English" },
      { code: "fr", name: "French" },
      { code: "es", name: "Spanish" },
      { code: "de", name: "German" },
    ];

    const defaultModels = [
      { name: "T5 Small", value: "Xenova/t5-small" },
      { name: "M2M100 418M", value: "Xenova/m2m100_418M" },
      { name: "All MiniLM L6", value: "Xenova/all-MiniLM-L6-v2" },
      {
        name: "NLLB 200 Distilled 600M",
        value: "Xenova/nllb-200-distilled-600M",
      },
    ];

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
        .language-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        .input-group {
          flex: 1 1;
        }
        label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
          font-size: 14px;
        }
        select, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 16px;
          background-color: var(--input-bg-color);
          transition: border-color 0.3s, box-shadow 0.3s;
          box-sizing: border-box;
        }
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          box-sizing: border-box;
          border: none;
        }
        .text-areas {
          display: flex;
          gap: 20px;
        }
        .text-area-wrapper {
          flex: 1;
          position: relative;
        }
        textarea {
          resize: none;
          height: 150px;
          font-family: inherit;
          line-height: 1.5;
          overflow-y: auto;
        }
        select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        select:focus {
          border: none;
        }
        button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.3s, box-shadow 0.3s;
          position: absolute;
          bottom: 12px;
          right: 12px;
        }
        button:hover:not(:disabled) {
          background-color: var(--secondary-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.24);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          .text-areas {
            flex-direction: column;
          }
          .language-controls {
            flex-direction: column;
            gap: 20px;
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          h2 {
            font-size: 20px;
          }
          textarea {
            height: 120px;
          }
          button {
            position: static;
            width: 100%;
            margin-top: 12px;
          }
        }
      </style>
      <div class="container">
        <div class="header">
          <h2>${options.title || "Translate"}</h2>
          ${
            !customModel
              ? `
          <select id="model-select">
            ${defaultModels
              .map(
                (model) =>
                  `<option value="${model.value}">${model.name}</option>`
              )
              .join("")}
          </select>
        `
              : ""
          }
        </div>
        <div class="language-controls">
          <div class="input-group">
            <select id="source-lang">
              ${languages
                .map(
                  (lang) => `<option value="${lang.code}">${lang.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="input-group">
            <select id="target-lang">
              ${languages
                .map(
                  (lang) => `<option value="${lang.code}">${lang.name}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
        <div class="text-areas">
          <div class="text-area-wrapper">
            <textarea id="input-text" placeholder="Enter text"></textarea>
          </div>
          <div class="text-area-wrapper">
            <textarea id="output" readonly placeholder="Translation"></textarea>
            <button id="translate-btn">${
              options.buttonText || "Translate"
            }</button>
          </div>
        </div>
        <div id="status"></div>
        <div id="progress-text"></div>
        <div id="loading-spinner">
          <div class="spinner"></div>
        </div>
      </div>
    `;
  }

  async initializeTranslator() {
    const modelName =
      this.getAttribute("model") ||
      this.shadowRoot.getElementById("model-select")?.value ||
      "Xenova/t5-small";

    const translateBtn = this.shadowRoot.getElementById("translate-btn");
    translateBtn.disabled = true;
    this.updateStatus("Initializing translator...");

    const workerScript = `
          import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

        // The key environment that should be set for transformer to work
         env.allowLocalModels = false;
          env.useBrowserCache = true;
         env.remoteModelPath = "https://huggingface.co/";

          let translator;

          async function initTranslator(model) {
              translator = await pipeline('translation', model);
          }

          self.onmessage = async function (e) {
              if (e.data.type === 'init') {
                self.postMessage({ type: 'notification', text: e.data.model });
                  try {
                     translator = await pipeline('translation', e.data.model);
                      self.postMessage({ type: 'init_complete' });
                  } catch (error) {
                      self.postMessage({ type: 'error', message: error.message });
                  }
              } else if (e.data.type === 'translate') {
                  try {
                      const result = await translator(e.data.text, {
                          src_lang: e.data.sourceLang,
                          tgt_lang: e.data.targetLang,
                          max_length: 1000,
                      });
                      self.postMessage({
                          type: 'translation_complete',
                          result: result[0].translation_text,
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
        this.updateStatus("Translator ready");
        translateBtn.disabled = false;
      } else if (e.data.type === "notification") {
        this.updateStatus(`${e.data.text} is downloading...`);
      } else if (e.data.type === "translation_complete") {
        const output = this.shadowRoot.getElementById("output");
        output.textContent = e.data.result;
        this.updateStatus("Translation complete");
        translateBtn.disabled = false;
        this.shadowRoot.getElementById("loading-spinner").style.display =
          "none";
      } else if (e.data.type === "error") {
        this.updateStatus(`Error: ${e.data.message}`);
        translateBtn.disabled = false;
        this.shadowRoot.getElementById("loading-spinner").style.display =
          "none";
      }
    };
  }

  setupEventListeners() {
    const translateBtn = this.shadowRoot.getElementById("translate-btn");
    translateBtn.addEventListener("click", () => this.translate());

    const modelSelect = this.shadowRoot.getElementById("model-select");
    if (modelSelect) {
      modelSelect.addEventListener("change", () => this.initializeTranslator());
    }

    const inputText = this.shadowRoot.getElementById("input-text");
    inputText.addEventListener("input", () => this.handleInputChange());
  }

  handleInputChange() {
    const translateBtn = this.shadowRoot.getElementById("translate-btn");
    const inputText = this.shadowRoot.getElementById("input-text").value;
    translateBtn.disabled = !inputText.trim();
  }

  translate() {
    const translateBtn = this.shadowRoot.getElementById("translate-btn");
    const loadingSpinner = this.shadowRoot.getElementById("loading-spinner");
    translateBtn.disabled = true;
    loadingSpinner.style.display = "flex";
    this.updateStatus("Translating...");

    const sourceLang = this.shadowRoot.getElementById("source-lang").value;
    const targetLang = this.shadowRoot.getElementById("target-lang").value;
    const inputText = this.shadowRoot.getElementById("input-text").value;

    if (!inputText.trim()) {
      this.shadowRoot.getElementById("output").textContent =
        "Please enter text to translate.";
      this.updateStatus("");
      translateBtn.disabled = false;
      loadingSpinner.style.display = "none";
      return;
    }

    this.worker.postMessage({
      type: "translate",
      text: inputText,
      sourceLang: sourceLang,
      targetLang: targetLang,
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



customElements.define('chat-webllm-component', ChatWebLLMComponent);
customElements.define("page-voice-ai-assistant", PageVoiceAIAssistant);
customElements.define("page-txonn-chat", PageTXONNAIChat);
customElements.define("page-tx-image-captioner", PageTXImageCaptioner);
customElements.define("page-tx-chat", PageTXAIChat);
customElements.define("page-tx-speech-to-text", PageTXSpeechToText);
customElements.define('chat-webllm-component', ChatWebLLMComponent);
customElements.define('ai-model', AIModelComponent);
customElements.define("page-tx-generator", PageTXGenerator);
customElements.define("page-translator", PageTranslator);
customElements.define("page-heading", PageHeading);
customElements.define("page-testimonial", PageTestimonial);
customElements.define("page-team", PageTeam);
customElements.define("page-product-info", PageProductInfo);
customElements.define("page-image-content", PageImageContent);
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
