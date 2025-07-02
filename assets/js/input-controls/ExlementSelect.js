// Exlement Select Web Component
// Usage: <exlement-select label="Choose" required options='[{"value":"1","label":"One"},{"value":"2","label":"Two"}]' searchable multiple size="large" color="primary" error="Error!" helper="Pick wisely"></exlement-select>
// Attributes: label, value, disabled, required, options (JSON array), searchable, multiple, size, shape, color, variant, error, success, helper
// Features: Accessible, emits 'select-change' event, advanced UI

class ExlementSelect extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'value', 'disabled', 'required', 'options', 'searchable', 'multiple', 'size', 'shape', 'color', 'variant', 'error', 'success', 'helper'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._onChange = this._onChange.bind(this);
    this._onInput = this._onInput.bind(this);
    this._onClear = this._onClear.bind(this);
    this._onOptionClick = this._onOptionClick.bind(this);
    this._onDropdownKeydown = this._onDropdownKeydown.bind(this);
    this._onSearchInput = this._onSearchInput.bind(this);
    this._dropdownOpen = false;
    this._filteredOptions = null;
  }

  connectedCallback() {
    [
      'value', 'label', 'disabled', 'required', 'options', 'searchable', 'multiple',
      'size', 'shape', 'color', 'variant', 'error', 'success', 'helper'
    ].forEach(p => this._upgradeProperty(p));
    this.render();
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this._closeDropdown();
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && this._select && this._select.value !== newValue) {
      this._select.value = newValue || '';
      return;
    }
    if (['disabled', 'required'].includes(name) && this._select) {
      this._select[name] = this[name];
      return;
    }
    this.render();
  }

  set value(val) {
    if (this.multiple && Array.isArray(val)) {
      this.setAttribute('value', JSON.stringify(val));
    } else {
      this.setAttribute('value', val);
    }
  }
  get value() {
    if (this.multiple) {
      try { return JSON.parse(this.getAttribute('value')) || []; } catch { return []; }
    }
    return this.getAttribute('value') || '';
  }

  set label(val) { this.setAttribute('label', val); }
  get label() { return this.getAttribute('label') || ''; }

  set disabled(val) { val ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get disabled() { return this.hasAttribute('disabled'); }

  set required(val) { val ? this.setAttribute('required', '') : this.removeAttribute('required'); }
  get required() { return this.hasAttribute('required'); }

  set options(val) { this.setAttribute('options', val); }
  get options() { return this.getAttribute('options') || null; }

  set searchable(val) { val ? this.setAttribute('searchable', '') : this.removeAttribute('searchable'); }
  get searchable() { return this.hasAttribute('searchable'); }

  set multiple(val) { val ? this.setAttribute('multiple', '') : this.removeAttribute('multiple'); }
  get multiple() { return this.hasAttribute('multiple'); }

  set size(val) { this.setAttribute('size', val); }
  get size() { return this.getAttribute('size') || 'medium'; }

  set shape(val) { this.setAttribute('shape', val); }
  get shape() { return this.getAttribute('shape') || 'rounded'; }

  set color(val) { this.setAttribute('color', val); }
  get color() { return this.getAttribute('color') || 'primary'; }

  set variant(val) { this.setAttribute('variant', val); }
  get variant() { return this.getAttribute('variant') || 'default'; }

  set error(val) { val ? this.setAttribute('error', val) : this.removeAttribute('error'); }
  get error() { return this.getAttribute('error') || null; }

  set success(val) { val ? this.setAttribute('success', val) : this.removeAttribute('success'); }
  get success() { return this.getAttribute('success') || null; }

  set helper(val) { this.setAttribute('helper', val); }
  get helper() { return this.getAttribute('helper') || ''; }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  _onChange(e) {
    if (this.multiple) {
      // Not used in custom dropdown, but fallback for native select
      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
      this.value = selected;
      this.dispatchEvent(new CustomEvent('select-change', {
        detail: { value: selected },
        bubbles: true,
        composed: true
      }));
    } else {
      this.value = e.target.value;
      this.dispatchEvent(new CustomEvent('select-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    }
  }

  _onInput(e) {
    this._searchValue = e.target.value;
    this._filteredOptions = this._getFilteredOptions();
    this.render();
    this._openDropdown();
    if (this.shadowRoot.querySelector('.search-input')) {
      this.shadowRoot.querySelector('.search-input').focus();
    }
  }

  _onClear() {
    this.value = this.multiple ? [] : '';
    this._searchValue = '';
    this._filteredOptions = null;
    this.render();
    this.dispatchEvent(new CustomEvent('select-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true
    }));
  }

  _onOptionClick(e) {
    const val = e.currentTarget.getAttribute('data-value');
    const allOptions = this._getOptions();
    if (this.multiple) {
      let arr = Array.isArray(this.value) ? [...this.value] : [];
      if (arr.includes(val)) {
        arr = arr.filter(v => v !== val);
      } else {
        arr.push(val);
      }
      this.value = arr;
      this.render();
      // Enhanced event: include selected option objects for dev ergonomics
      const selectedOptions = allOptions.filter(o => arr.includes(o.value));
      this.dispatchEvent(new CustomEvent('select-change', {
        detail: { value: arr, options: selectedOptions },
        bubbles: true,
        composed: true
      }));
    } else {
      this.value = val;
      this._closeDropdown();
      this.render();
      // Enhanced event: include selected option object for dev ergonomics
      const selectedOption = allOptions.find(o => o.value === val) || null;
      this.dispatchEvent(new CustomEvent('select-change', {
        detail: { value: val, option: selectedOption },
        bubbles: true,
        composed: true
      }));
    }
  }

  _onDropdownKeydown(e) {
    // Keyboard navigation for dropdown
    const opts = Array.from(this.shadowRoot.querySelectorAll('.dropdown-option'));
    const current = opts.findIndex(opt => opt === this.shadowRoot.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (current < opts.length - 1) opts[current + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (current > 0) opts[current - 1].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.shadowRoot.activeElement.click();
    } else if (e.key === 'Escape') {
      this._closeDropdown();
    }
  }

  _onSearchInput(e) {
    // Store caret position before re-render
    const caretPos = e.target.selectionStart;
    this._searchValue = e.target.value;
    this._filteredOptions = this._getFilteredOptions();
    this.render();
    // Restore caret position after re-render
    const searchInput = this.shadowRoot.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
      if (caretPos !== null && caretPos !== undefined) {
        searchInput.setSelectionRange(caretPos, caretPos);
      }
    }
  }

  _getFilteredOptions() {
    let options = this._getOptions();
    if (this._searchValue) {
      return options.filter(opt =>
        (opt.label || '').toLowerCase().includes(this._searchValue.toLowerCase()) ||
        (opt.description || '').toLowerCase().includes(this._searchValue.toLowerCase())
      );
    }
    return options;
  }

  _getOptions() {
    let options = [];
    if (this.options) {
      try {
        options = JSON.parse(this.options);
      } catch (e) {
        options = [];
      }
    }
    return options;
  }

  _openDropdown() {
    this._dropdownOpen = true;
    this.render();
  }
  _closeDropdown() {
    this._dropdownOpen = false;
    this._searchValue = '';
    this._filteredOptions = null;
    this.render();
  }

  render() {
    const label = this.label;
    const value = this.value;
    const disabled = this.disabled;
    const required = this.required;
    const searchable = this.searchable;
    const multiple = this.multiple;
    const size = this.size;
    const shape = this.shape;
    const color = this.color;
    const variant = this.variant;
    const error = this.error;
    const success = this.success;
    const helper = this.helper;
    const selectId = 'select-' + Math.random().toString(36).substr(2, 9);
    const options = this._filteredOptions || this._getOptions();
    const selected = multiple ? (Array.isArray(value) ? value : []) : value;
    const dropdownOpen = this._dropdownOpen;
    const searchValue = this._searchValue || '';
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: inherit; }
        .select-wrapper {
          display: flex;
          flex-direction: column;
          position: relative; /* Ensure dropdown is positioned relative to this */
        }
        label {
          margin-bottom: 0.3em;
          font-weight: 500;
          color: #222;
        }
        .select-display {
          display: flex;
          align-items: center;
          padding: 0.5em 1em;
          border-radius: ${shape === 'pill' ? '999px' : shape === 'square' ? '0' : '4px'};
          border: 1.5px solid #ccc;
          font-size: ${size === 'large' ? '1.15em' : size === 'small' ? '0.95em' : '1em'};
          background: #fff;
          color: #222;
          cursor: pointer;
          min-height: 2.5em;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .select-display:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 2px #cce4ff;
        }
        :host([color="primary"]) .select-display { border-color: #007bff; }
        :host([color="danger"]) .select-display { border-color: #e74c3c; }
        :host([color="success"]) .select-display { border-color: #27ae60; }
        :host([color="warning"]) .select-display { border-color: #f39c12; }
        :host([error]) .select-display { border-color: #e74c3c !important; }
        :host([success]) .select-display { border-color: #27ae60 !important; }
        .select-display.disabled {
          background: #f5f5f5;
          color: #aaa;
          cursor: not-allowed;
        }
        .select-value {
          flex: 1 1 0%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
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
        .clear-btn:hover { background: #eee; }
        .dropdown {
          display: ${dropdownOpen ? 'block' : 'none'};
          position: absolute;
          left: 0;
          right: auto;
          top: 100%;
          z-index: 100;
          background: #fff;
          border: 1.5px solid #ccc;
          border-radius: 0 0 4px 4px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.07);
          max-height: 16em;
          overflow-y: auto;
          width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        .search-input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 0.5em 1em;
          border: none;
          border-bottom: 1px solid #eee;
          font-size: 1em;
          outline: none;
          overflow-x: hidden;
        }
        .dropdown-option {
          display: flex;
          align-items: flex-start;
          padding: 0.5em 1em;
          cursor: pointer;
          background: #fff;
          border: none;
          font-size: 1em;
          transition: background 0.15s;
          max-width: 100%;
          min-width: 0;
          overflow-x: hidden;
          word-break: break-word;
        }
        .dropdown-option.selected {
          background: #eaf4ff;
        }
        .dropdown-option:hover, .dropdown-option:focus {
          background: #f0f8ff;
          outline: none;
        }
        .option-icon {
          margin-right: 0.7em;
          font-size: 1.2em;
        }
        .option-label {
          font-weight: 500;
          word-break: break-word;
        }
        .option-description {
          font-size: 0.92em;
          color: #888;
          margin-left: 0.5em;
          word-break: break-word;
        }
        .multi-tag {
          display: inline-block;
          background: #eaf4ff;
          color: #007bff;
          border-radius: 999px;
          padding: 0.2em 0.8em;
          margin-right: 0.3em;
          font-size: 0.95em;
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
      </style>
      <span class="select-wrapper">
        ${label ? `<label for="${selectId}">${label}${required ? ' *' : ''}</label>` : ''}
        <span class="select-display${disabled ? ' disabled' : ''}" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="${dropdownOpen}" aria-disabled="${disabled}" id="${selectId}">
          <span class="select-value">
            ${multiple
              ? (selected.length ? selected.map(val => {
                  const opt = options.find(o => o.value === val);
                  return opt ? `<span class="multi-tag">${opt.icon ? `<span class="option-icon">${opt.icon}</span>` : ''}${opt.label}</span>` : '';
                }).join('') : '<span style="color:#aaa">Select...</span>')
              : (() => {
                  const opt = options.find(o => o.value === selected);
                  return opt ? `${opt.icon ? `<span class="option-icon">${opt.icon}</span>` : ''}${opt.label}` : '<span style="color:#aaa">Select...</span>';
                })()
            }
          </span>
          ${!disabled && ((multiple && selected.length) || (!multiple && selected)) ? `<button class="clear-btn" title="Clear" tabindex="0">&times;</button>` : ''}
        </span>
        <span class="dropdown" role="listbox">
          ${searchable ? `<input class="search-input" type="text" placeholder="Search..." value="${searchValue}">` : ''}
          ${options.map(opt => `
            <span class="dropdown-option${multiple ? (selected.includes(opt.value) ? ' selected' : '') : (selected === opt.value ? ' selected' : '')}"
              tabindex="0"
              role="option"
              aria-selected="${multiple ? selected.includes(opt.value) : selected === opt.value}"
              data-value="${opt.value}">
              ${opt.icon ? `<span class="option-icon">${opt.icon}</span>` : ''}
              <span class="option-label">${opt.label}</span>
              ${opt.description ? `<span class="option-description">${opt.description}</span>` : ''}
            </span>
          `).join('')}
        </span>
        ${helper ? `<span class="helper">${helper}</span>` : ''}
        ${error ? `<span class="error-msg">${error}</span>` : ''}
        ${success ? `<span class="success-msg">${success}</span>` : ''}
      </span>
    `;
    // Dropdown open/close logic
    const display = this.shadowRoot.querySelector('.select-display');
    if (display && !disabled) {
      display.onclick = () => {
        this._dropdownOpen = !this._dropdownOpen;
        this.render();
        if (this._dropdownOpen && this.shadowRoot.querySelector('.search-input')) {
          this.shadowRoot.querySelector('.search-input').focus();
        }
      };
      display.onkeydown = this._onDropdownKeydown;
    }
    // Option click logic
    this.shadowRoot.querySelectorAll('.dropdown-option').forEach(opt => {
      opt.onclick = this._onOptionClick;
      opt.onkeydown = this._onDropdownKeydown;
    });
    // Search input logic
    const searchInput = this.shadowRoot.querySelector('.search-input');
    if (searchInput) {
      searchInput.oninput = this._onSearchInput;
    }
    // Clear button logic
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');
    if (clearBtn) {
      clearBtn.onclick = this._onClear;
    }
  }
}

customElements.define('exlement-select', ExlementSelect); 