// Exlement Input Web Component
// Usage: <exlement-input label="Name" placeholder="Enter your name"></exlement-input>
// Attributes: type, placeholder, value, disabled, required, label, size, shape, variant, color, maxlength, error, success
// Features: Accessible, emits 'input-change' event, icon slots, size/shape/variant, basic styles

class ExlementInput extends HTMLElement {
  static get observedAttributes() {
    return [
      'type', 'placeholder', 'value', 'disabled', 'required', 'label',
      'size', 'shape', 'variant', 'color', 'maxlength', 'error', 'success'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onInput = this._onInput.bind(this);
    this._onChange = this._onChange.bind(this);
  }

  connectedCallback() {
    this._upgradeProperty('value');
    this._upgradeProperty('type');
    this._upgradeProperty('placeholder');
    this._upgradeProperty('disabled');
    this._upgradeProperty('required');
    this._upgradeProperty('label');
    this._upgradeProperty('size');
    this._upgradeProperty('shape');
    this._upgradeProperty('variant');
    this._upgradeProperty('color');
    this._upgradeProperty('maxlength');
    this._upgradeProperty('error');
    this._upgradeProperty('success');
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Only update the relevant part, not the whole DOM, to avoid focus loss
    if (name === 'value' && this._input && this._input.value !== newValue) {
      this._input.value = newValue || '';
      return;
    }
    if (['disabled', 'type', 'placeholder', 'required'].includes(name) && this._input) {
      this._input[name] = this[name];
      return;
    }
    // For style/label/structure changes, re-render
    this.render();
  }

  set value(val) { this.setAttribute('value', val); }
  get value() { return this.getAttribute('value') || ''; }

  set type(val) { this.setAttribute('type', val); }
  get type() { return this.getAttribute('type') || 'text'; }

  set placeholder(val) { this.setAttribute('placeholder', val); }
  get placeholder() { return this.getAttribute('placeholder') || ''; }

  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get disabled() { return this.hasAttribute('disabled'); }

  set required(val) { val ? this.setAttribute('required', '') : this.removeAttribute('required'); }
  get required() { return this.hasAttribute('required'); }

  set label(val) { this.setAttribute('label', val); }
  get label() { return this.getAttribute('label') || ''; }

  set size(val) { this.setAttribute('size', val); }
  get size() { return this.getAttribute('size') || 'medium'; }

  set shape(val) { this.setAttribute('shape', val); }
  get shape() { return this.getAttribute('shape') || 'rounded'; }

  set variant(val) { this.setAttribute('variant', val); }
  get variant() { return this.getAttribute('variant') || 'default'; }

  set color(val) { this.setAttribute('color', val); }
  get color() { return this.getAttribute('color') || 'primary'; }

  set maxlength(val) { this.setAttribute('maxlength', val); }
  get maxlength() { return this.getAttribute('maxlength') || null; }

  set error(val) { val ? this.setAttribute('error', val) : this.removeAttribute('error'); }
  get error() { return this.getAttribute('error') || null; }

  set success(val) { val ? this.setAttribute('success', val) : this.removeAttribute('success'); }
  get success() { return this.getAttribute('success') || null; }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  _onInput(e) {
    // Only update attribute if changed by user
    if (this.value !== e.target.value) {
      this.value = e.target.value;
    }
    this.dispatchEvent(new CustomEvent('input-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }

  _onChange(e) {
    if (this.value !== e.target.value) {
      this.value = e.target.value;
    }
  }

  render() {
    // Save focus and cursor position
    const hadFocus = this._input && this.shadowRoot.activeElement === this._input;
    let cursorPos = this._input ? this._input.selectionStart : null;
    const type = this.type;
    const placeholder = this.placeholder;
    const value = this.value;
    const disabled = this.disabled;
    const required = this.required;
    const label = this.label;
    const size = this.size;
    const shape = this.shape;
    const variant = this.variant;
    const color = this.color;
    const maxlength = this.maxlength;
    const error = this.error;
    const success = this.success;
    const inputId = 'input-' + Math.random().toString(36).substr(2, 9);
    const isTextarea = type === 'textarea';
    const isPassword = type === 'password';
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: inherit;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: ${shape === 'pill' ? '999px' : shape === 'square' ? '0' : '4px'};
          border: ${variant === 'outline' ? '2px solid var(--input-outline, #007bff)' : '1.5px solid #ccc'};
          box-shadow: ${variant === 'fancy' ? '0 2px 8px rgba(0,0,0,0.07)' : 'none'};
          padding: 0;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          position: relative; /* For absolute helper/error/success if needed */
          min-width: 0;
        }
        :host([error]) .input-wrapper {
          border-color: #e74c3c !important;
        }
        :host([success]) .input-wrapper {
          border-color: #27ae60 !important;
        }
        :host([color="primary"]) .input-wrapper {
          border-color: #007bff;
        }
        :host([color="danger"]) .input-wrapper {
          border-color: #e74c3c;
        }
        :host([color="success"]) .input-wrapper {
          border-color: #27ae60;
        }
        :host([color="warning"]) .input-wrapper {
          border-color: #f39c12;
        }
        :host([color="primary"]) .input-wrapper:focus-within {
          border-color: #0056b3;
          box-shadow: 0 0 0 2px #cce4ff;
        }
        :host([color="danger"]) .input-wrapper:focus-within {
          border-color: #c0392b;
          box-shadow: 0 0 0 2px #f9d6d5;
        }
        :host([color="success"]) .input-wrapper:focus-within {
          border-color: #219150;
          box-shadow: 0 0 0 2px #d2fbe4;
        }
        :host([color="warning"]) .input-wrapper:focus-within {
          border-color: #b9770e;
          box-shadow: 0 0 0 2px #fff3cd;
        }
        .icon {
          display: none;
          align-items: center;
          justify-content: center;
          min-width: 2em;
          min-height: 2em;
          color: #888;
        }
        .has-icon-left .icon.icon-left,
        .has-icon-right .icon.icon-right {
          display: inline-flex;
        }
        .prefix, .suffix {
          display: inline-flex;
          align-items: center;
          margin: 0 0.3em;
          color: #888;
        }
        .clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #888;
          font-size: 1.2em;
          cursor: pointer;
          margin-left: 0.2em;
          margin-right: 0.2em;
          padding: 0 0.2em;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .clear-btn:hover {
          background: #eee;
        }
        .toggle-password {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #888;
          font-size: 1.2em;
          cursor: pointer;
          margin-left: 0.2em;
          margin-right: 0.2em;
          padding: 0 0.2em;
        }
        .char-counter {
          display: block;
          text-align: right;
          font-size: 0.85em;
          color: #888;
          margin-top: 0.1em;
        }
        .helper {
          display: block;
          font-size: 0.95em;
          color: #888;
          margin-top: 0.2em;
        }
        .error-msg {
          display: block;
          font-size: 0.95em;
          color: #e74c3c;
          margin-top: 0.2em;
        }
        .success-msg {
          display: block;
          font-size: 0.95em;
          color: #27ae60;
          margin-top: 0.2em;
        }
        input, textarea {
          flex: 1 1 0%;
          width: 100%;
          min-width: 0;
          padding: ${size === 'large' ? '0.75em 1.2em' : size === 'small' ? '0.25em 0.7em' : '0.5em 1em'};
          border: none;
          border-radius: inherit;
          font-size: ${size === 'large' ? '1.25em' : size === 'small' ? '0.9em' : '1em'};
          outline: none;
          background: transparent;
          color: #222;
          resize: vertical;
          min-height: ${isTextarea ? '4em' : 'auto'};
          max-height: 16em;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }
        input:focus, textarea:focus {
          border: none;
          outline: none;
        }
        .input-wrapper:focus-within {
          border-color: #007bff;
          box-shadow: 0 0 0 2px #cce4ff;
        }
        input:disabled, textarea:disabled {
          background: #f5f5f5;
          color: #aaa;
          cursor: not-allowed;
        }
        input:invalid, textarea:invalid {
          border-color: #e74c3c;
        }
        label {
          display: block;
          margin-bottom: 0.3em;
          font-weight: 500;
          color: #222;
        }
        .icon, .prefix, .suffix, .clear-btn, .toggle-password {
          /* Vertically center all inline elements */
          display: inline-flex;
          align-items: center;
          height: 2.5em;
          min-width: 0;
        }
      </style>
      ${label ? `<label for="${inputId}">${label}${required ? ' *' : ''}</label>` : ''}
      <span class="input-wrapper">
        <span class="prefix"><slot name="prefix"></slot></span>
        <span class="icon icon-left"><slot name="icon-left"></slot></span>
        ${isTextarea ? `
          <textarea
            id="${inputId}"
            placeholder="${placeholder}"
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            ${maxlength ? `maxlength=\"${maxlength}\"` : ''}
            autocomplete="off"
          >${value}</textarea>
        ` : `
          <input
            id="${inputId}"
            type="${isPassword ? 'password' : type}"
            placeholder="${placeholder}"
            value="${value}"
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            ${maxlength ? `maxlength=\"${maxlength}\"` : ''}
            autocomplete="off"
          >
        `}
        <span class="icon icon-right"><slot name="icon-right"></slot></span>
        <span class="suffix"><slot name="suffix"></slot></span>
        ${!disabled && value ? `<button class="clear-btn" title="Clear" tabindex="0">&times;</button>` : ''}
        ${isPassword && !disabled ? `<button class="toggle-password" title="Show/Hide Password" tabindex="0">👁️</button>` : ''}
      </span>
      ${maxlength ? `<span class="char-counter">${value.length} / ${maxlength}</span>` : ''}
      <span class="helper"><slot name="helper"></slot></span>
      ${error ? `<span class="error-msg">${error || '<slot name="error"></slot>'}</span>` : ''}
      ${success ? `<span class="success-msg">${success || '<slot name="success"></slot>'}</span>` : ''}
    `;
    // Set up input or textarea
    this._input = this.shadowRoot.querySelector(isTextarea ? 'textarea' : 'input');
    // Icon slot logic: only show icon if slot has content
    const wrapper = this.shadowRoot.querySelector('.input-wrapper');
    const leftSlot = this.shadowRoot.querySelector('slot[name="icon-left"]');
    const rightSlot = this.shadowRoot.querySelector('slot[name="icon-right"]');
    // Remove icon classes first
    wrapper.classList.remove('has-icon-left', 'has-icon-right');
    if (leftSlot && leftSlot.assignedNodes().length > 0) {
      wrapper.classList.add('has-icon-left');
    }
    if (rightSlot && rightSlot.assignedNodes().length > 0) {
      wrapper.classList.add('has-icon-right');
    }
    // Listen for slot changes to update icon classes dynamically
    if (leftSlot) {
      leftSlot.addEventListener('slotchange', () => {
        wrapper.classList.toggle('has-icon-left', leftSlot.assignedNodes().length > 0);
      });
    }
    if (rightSlot) {
      rightSlot.addEventListener('slotchange', () => {
        wrapper.classList.toggle('has-icon-right', rightSlot.assignedNodes().length > 0);
      });
    }
    // Clear button logic
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.value = '';
        this._input.value = '';
        this.dispatchEvent(new CustomEvent('input-change', {
          detail: { value: '' },
          bubbles: true,
          composed: true
        }));
      });
    }
    // Password toggle logic
    if (isPassword) {
      const toggleBtn = this.shadowRoot.querySelector('.toggle-password');
      if (toggleBtn && this._input) {
        toggleBtn.addEventListener('click', () => {
          this._input.type = this._input.type === 'password' ? 'text' : 'password';
        });
      }
    }
    // Auto-resize for textarea
    if (isTextarea && this._input) {
      const resize = () => {
        this._input.style.height = 'auto';
        this._input.style.height = (this._input.scrollHeight) + 'px';
      };
      this._input.addEventListener('input', resize);
      setTimeout(resize, 0);
    }
    if (this._input) {
      this._input.removeEventListener('input', this._onInput);
      this._input.removeEventListener('change', this._onChange);
      this._input.addEventListener('input', this._onInput);
      this._input.addEventListener('change', this._onChange);
      // Restore focus and cursor for both input and textarea
      if (hadFocus) {
        this._input.focus();
        if (cursorPos !== null && typeof this._input.setSelectionRange === 'function') {
          this._input.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }
  }
}

customElements.define('exlement-input', ExlementInput); 