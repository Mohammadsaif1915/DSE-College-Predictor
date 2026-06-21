/**
 * Setu — share.js
 * Reads/writes form state to the URL so predictions can be shared as a link.
 * Params: percentage, category, region (repeatable), branch
 */
(function (global) {
  'use strict';

  function readParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      percentage: p.get('percentage') || '',
      category: p.get('category') || '',
      region: p.getAll('region'),
      branch: p.get('branch') || '',
    };
  }

  function writeParams(state) {
    const p = new URLSearchParams();
    if (state.percentage) p.set('percentage', state.percentage);
    if (state.category) p.set('category', state.category);
    (state.region || []).forEach(function (r) { p.append('region', r); });
    if (state.branch) p.set('branch', state.branch);
    const newUrl = window.location.pathname + (p.toString() ? '?' + p.toString() : '');
    window.history.replaceState(null, '', newUrl);
  }

  function shareableUrl(state) {
    const p = new URLSearchParams();
    if (state.percentage) p.set('percentage', state.percentage);
    if (state.category) p.set('category', state.category);
    (state.region || []).forEach(function (r) { p.append('region', r); });
    if (state.branch) p.set('branch', state.branch);
    return window.location.origin + window.location.pathname + (p.toString() ? '?' + p.toString() : '');
  }

  global.SetuShare = { readParams: readParams, writeParams: writeParams, shareableUrl: shareableUrl };
})(window);
