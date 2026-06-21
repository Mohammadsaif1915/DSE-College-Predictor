/**
 * Setu — utils.js
 * Generic helpers shared across modules. No business/prediction logic here.
 */
(function (global) {
  'use strict';

  function debounce(fn, wait) {
    let t = null;
    return function debounced() {
      const args = arguments;
      const ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /** Simple memoizer keyed by JSON.stringify of arguments. */
  function memoize(fn) {
    const cache = new Map();
    return function memoized() {
      const key = JSON.stringify(Array.prototype.slice.call(arguments));
      if (cache.has(key)) return cache.get(key);
      const result = fn.apply(this, arguments);
      cache.set(key, result);
      return result;
    };
  }

  function fmtPct(n) {
    return Number(n).toFixed(2) + '%';
  }

  function fmtRank(n) {
    return Number(n).toLocaleString('en-IN');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Build DOM nodes from an HTML string using a <template>, returns a DocumentFragment. */
  const _tpl = document.createElement('template');
  function fragmentFromHTML(html) {
    _tpl.innerHTML = html;
    const frag = document.importNode(_tpl.content, true);
    _tpl.innerHTML = '';
    return frag;
  }

  /** Replace the children of `el` efficiently using a single DocumentFragment write. */
  function renderInto(el, html) {
    const frag = fragmentFromHTML(html);
    el.textContent = '';
    el.appendChild(frag);
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  global.SetuUtils = {
    debounce: debounce,
    memoize: memoize,
    fmtPct: fmtPct,
    fmtRank: fmtRank,
    escapeHtml: escapeHtml,
    fragmentFromHTML: fragmentFromHTML,
    renderInto: renderInto,
    qs: qs,
    qsa: qsa,
  };
})(window);
