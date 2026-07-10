// Minimal fake DOM sufficient to exercise js/ui/screens.js render + click logic in Node,
// without installing jsdom. Not a full DOM — just enough surface area.

class FakeNode {
  constructor(tag) {
    this.tagName = (tag || '').toUpperCase();
    this.children = [];
    this.parent = null;
    this._attrs = {};
    this._listeners = {};
    this._text = null;
    this.className = '';
    this.id = '';
    this.value = '';
    this.disabled = false;
    this.title = '';
  }
  appendChild(child) {
    if (child == null) return child;
    child.parent = this;
    this.children.push(child);
    return child;
  }
  set innerHTML(v) {
    this.children = [];
    this._text = v === '' ? null : v;
  }
  get innerHTML() {
    return this._text || '';
  }
  setAttribute(k, v) {
    this._attrs[k] = v;
    if (k === 'disabled') this.disabled = true;
    if (k === 'title') this.title = v;
  }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attrs, k) ? this._attrs[k] : null; }
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this._attrs, k); }
  addEventListener(type, fn) {
    this._listeners[type] = this._listeners[type] || [];
    this._listeners[type].push(fn);
  }
  dispatch(type, ev) {
    ev = ev || { target: this, preventDefault: function () {} };
    (this._listeners[type] || []).forEach(function (fn) { fn(ev); });
  }
  click() { this.dispatch('click'); }
  // simple recursive text collector
  get textContent() {
    if (this._text != null) return this._text;
    return this.children.map(function (c) { return c.textContent != null ? c.textContent : ''; }).join('');
  }
  set textContent(v) {
    this.children = [];
    this._text = v;
  }
  // find all elements with a class, recursively
  queryAllByClass(cls) {
    var out = [];
    if ((this.className || '').split(' ').indexOf(cls) !== -1) out.push(this);
    this.children.forEach(function (c) { out = out.concat(c.queryAllByClass(cls)); });
    return out;
  }
  queryAllByTag(tag) {
    var out = [];
    if (this.tagName === tag.toUpperCase()) out.push(this);
    this.children.forEach(function (c) { out = out.concat(c.queryAllByTag(tag)); });
    return out;
  }
}

class FakeDocument {
  constructor() {
    this._byId = {};
  }
  createElement(tag) {
    return new FakeNode(tag);
  }
  createTextNode(text) {
    var n = new FakeNode('#text');
    n._text = text;
    n.textContent = text;
    return n;
  }
  registerId(id, node) {
    this._byId[id] = node;
    node.id = id;
  }
  getElementById(id) {
    return this._byId[id] || null;
  }
}

module.exports = { FakeNode: FakeNode, FakeDocument: FakeDocument };
