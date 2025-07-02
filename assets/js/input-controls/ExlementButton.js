// Exlement Button Web Component
// Usage: <exlement-button ...>Click me</exlement-button>
// Optional attributes: variant, disabled, loading, type, icon-position, shape, size, outline, ghost, block, color, tooltip, loading-text
// Features: Accessible, keyboard support, loading spinner, icon slot, tooltip, ripple, style variants

class ExlementButton extends HTMLElement {
  static get observedAttributes() {
    return [
      'variant', 'disabled', 'loading', 'type', 'icon-position', 'shape', 'size',
      'outline', 'ghost', 'block', 'color', 'tooltip', 'loading-text'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
  }

  connectedCallback() {
    this.render();
    this._upgradeProperty('disabled');
    this._upgradeProperty('loading');
    this._upgradeProperty('variant');
    this._upgradeProperty('type');
    this._upgradeProperty('icon-position');
    this._upgradeProperty('shape');
    this._upgradeProperty('size');
    this._upgradeProperty('outline');
    this._upgradeProperty('ghost');
    this._upgradeProperty('block');
    this._upgradeProperty('color');
    this._upgradeProperty('tooltip');
    this._upgradeProperty('loading-text');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }

  // Property getters/setters for all attributes
  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get disabled() { return this.hasAttribute('disabled'); }

  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
  get loading() { return this.hasAttribute('loading'); }

  set variant(val) { this.setAttribute('variant', val); }
  get variant() { return this.getAttribute('variant') || 'primary'; }

  set type(val) { this.setAttribute('type', val); }
  get type() { return this.getAttribute('type') || 'button'; }

  set iconPosition(val) { this.setAttribute('icon-position', val); }
  get iconPosition() { return this.getAttribute('icon-position') || 'left'; }

  set shape(val) { this.setAttribute('shape', val); }
  get shape() { return this.getAttribute('shape') || 'rounded'; }

  set size(val) { this.setAttribute('size', val); }
  get size() { return this.getAttribute('size') || 'medium'; }

  set outline(val) { val ? this.setAttribute('outline', '') : this.removeAttribute('outline'); }
  get outline() { return this.hasAttribute('outline'); }

  set ghost(val) { val ? this.setAttribute('ghost', '') : this.removeAttribute('ghost'); }
  get ghost() { return this.hasAttribute('ghost'); }

  set block(val) { val ? this.setAttribute('block', '') : this.removeAttribute('block'); }
  get block() { return this.hasAttribute('block'); }

  set color(val) { this.setAttribute('color', val); }
  get color() { return this.getAttribute('color') || 'primary'; }

  set tooltip(val) { this.setAttribute('tooltip', val); }
  get tooltip() { return this.getAttribute('tooltip') || '' }

  set loadingText(val) { this.setAttribute('loading-text', val); }
  get loadingText() { return this.getAttribute('loading-text') || '' }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  _onClick(e) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    // Ripple effect
    const btn = this._button;
    if (btn) {
      btn.classList.remove('ripple');
      void btn.offsetWidth; // force reflow
      btn.classList.add('ripple');
    }
    // Forward the click event
    this.dispatchEvent(new Event('button-click', { bubbles: true, composed: true }));
  }

  _onKeyDown(e) {
    if (this.disabled || this.loading) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this._button && this._button.click();
    }
  }

  _onFocus() { this._button && this._button.classList.add('focus'); }
  _onBlur() { this._button && this._button.classList.remove('focus'); }

  _onMouseEnter() {
    if (this.tooltip) {
      this._showTooltip();
    }
  }
  _onMouseLeave() {
    this._hideTooltip();
  }

  _showTooltip() {
    if (!this._tooltipEl && this.tooltip) {
      this._tooltipEl = document.createElement('div');
      this._tooltipEl.className = 'exlement-btn-tooltip';
      this._tooltipEl.textContent = this.tooltip;
      this.shadowRoot.appendChild(this._tooltipEl);
      // Position tooltip
      const rect = this._button.getBoundingClientRect();
      this._tooltipEl.style.left = rect.width / 2 + 'px';
    }
  }
  _hideTooltip() {
    if (this._tooltipEl) {
      this.shadowRoot.removeChild(this._tooltipEl);
      this._tooltipEl = null;
    }
  }

  render() {
    const disabled = this.disabled;
    const loading = this.loading;
    const type = this.type;
    const iconPos = this.iconPosition;
    const shape = this.shape;
    const size = this.size;
    const outline = this.outline;
    const ghost = this.ghost;
    const block = this.block;
    const color = this.color;
    const tooltip = this.tooltip;
    const loadingText = this.loadingText;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${block ? '100%' : 'auto'};
          padding: ${size === 'large' ? '0.75em 2em' : size === 'small' ? '0.25em 0.8em' : '0.5em 1.2em'};
          border-radius: ${shape === 'pill' ? '999px' : shape === 'square' ? '0' : '4px'};
          border: ${outline ? '2px solid var(--button-outline, #007bff)' : 'none'};
          font-size: ${size === 'large' ? '1.25em' : size === 'small' ? '0.9em' : '1em'};
          cursor: pointer;
          background: ${ghost ? 'transparent' : `var(--button-bg-${color}, #007bff)`};
          color: ${ghost ? `var(--button-bg-${color}, #007bff)` : outline ? `var(--button-bg-${color}, #007bff)` : 'var(--button-color, #fff)'};
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          outline: none;
          position: relative;
          min-width: 2.5em;
          box-shadow: none;
        }
        button[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        button.ripple::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.1);
          border-radius: inherit;
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
          animation: ripple-anim 0.4s linear;
        }
        @keyframes ripple-anim {
          0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        :host([variant="secondary"]) button,
        :host([color="secondary"]) button {
          background: ${ghost ? 'transparent' : 'var(--button-bg-secondary, #f0f0f0)'};
          color: ${ghost ? 'var(--button-bg-secondary, #f0f0f0)' : outline ? 'var(--button-bg-secondary, #f0f0f0)' : 'var(--button-color-secondary, #222)'};
        }
        :host([color="danger"]) button {
          background: ${ghost ? 'transparent' : 'var(--button-bg-danger, #e74c3c)'};
          color: ${ghost ? 'var(--button-bg-danger, #e74c3c)' : outline ? 'var(--button-bg-danger, #e74c3c)' : '#fff'};
        }
        :host([color="success"]) button {
          background: ${ghost ? 'transparent' : 'var(--button-bg-success, #27ae60)'};
          color: ${ghost ? 'var(--button-bg-success, #27ae60)' : outline ? 'var(--button-bg-success, #27ae60)' : '#fff'};
        }
        :host([color="warning"]) button {
          background: ${ghost ? 'transparent' : 'var(--button-bg-warning, #f39c12)'};
          color: ${ghost ? 'var(--button-bg-warning, #f39c12)' : outline ? 'var(--button-bg-warning, #f39c12)' : '#fff'};
        }
        button.focus {
          box-shadow: 0 0 0 2px #0056b3;
        }
        .spinner {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid #fff;
          border-radius: 50%;
          border-top: 2px solid #007bff;
          animation: spin 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 0.5em;
        }
        :host([color="secondary"]) .spinner {
          border-top: 2px solid #222;
        }
        :host([color="danger"]) .spinner {
          border-top: 2px solid #e74c3c;
        }
        :host([color="success"]) .spinner {
          border-top: 2px solid #27ae60;
        }
        :host([color="warning"]) .spinner {
          border-top: 2px solid #f39c12;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .icon {
          display: inline-flex;
          align-items: center;
          margin-right: ${iconPos === 'left' ? '0.5em' : '0'};
          margin-left: ${iconPos === 'right' ? '0.5em' : '0'};
        }
        .exlement-btn-tooltip {
          position: absolute;
          left: 50%;
          top: -2.2em;
          transform: translateX(-50%);
          background: #222;
          color: #fff;
          padding: 0.3em 0.8em;
          border-radius: 4px;
          font-size: 0.9em;
          white-space: nowrap;
          z-index: 10;
          pointer-events: none;
        }
      </style>
      <button
        part="button"
        type="${type}"
        ${disabled ? 'disabled' : ''}
        aria-disabled="'${disabled}'"
        tabindex="${disabled ? -1 : 0}"
        role="button"
      >
        ${loading ? `<span class="spinner"></span>${loadingText ? `<span>${loadingText}</span>` : ''}` : ''}
        ${iconPos === 'left' ? '<span class="icon"><slot name="icon"></slot></span>' : ''}
        <slot></slot>
        ${iconPos === 'right' ? '<span class="icon"><slot name="icon"></slot></span>' : ''}
      </button>
    `;
    this._button = this.shadowRoot.querySelector('button');
    if (this._button) {
      this._button.removeEventListener('click', this._onClick);
      this._button.removeEventListener('keydown', this._onKeyDown);
      this._button.removeEventListener('focus', this._onFocus);
      this._button.removeEventListener('blur', this._onBlur);
      this._button.removeEventListener('mouseenter', this._onMouseEnter);
      this._button.removeEventListener('mouseleave', this._onMouseLeave);
      this._button.addEventListener('click', this._onClick);
      this._button.addEventListener('keydown', this._onKeyDown);
      this._button.addEventListener('focus', this._onFocus);
      this._button.addEventListener('blur', this._onBlur);
      this._button.addEventListener('mouseenter', this._onMouseEnter);
      this._button.addEventListener('mouseleave', this._onMouseLeave);
    }
  }
}

customElements.define('exlement-button', ExlementButton); 