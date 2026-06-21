/**
 * Setu — filters.js
 * Sorting & filtering over an already-predicted result set.
 * Pure functions only — never touches the prediction/cutoff logic.
 */
(function (global) {
  'use strict';

  const SORTERS = {
    'cutoff-high': function (a, b) { return b.cutoffPct - a.cutoffPct; },
    'cutoff-low': function (a, b) { return a.cutoffPct - b.cutoffPct; },
    'college-az': function (a, b) { return a.collegeName.localeCompare(b.collegeName); },
    'college-za': function (a, b) { return b.collegeName.localeCompare(a.collegeName); },
    'region': function (a, b) { return a.region.localeCompare(b.region) || a.collegeName.localeCompare(b.collegeName); },
    'chance': function (a, b) {
      const order = { high: 0, moderate: 1, low: 2 };
      return order[a.status] - order[b.status] || b.cutoffPct - a.cutoffPct;
    },
  };

  function sortResults(results, sortKey) {
    const sorter = SORTERS[sortKey] || SORTERS.chance;
    return results.slice().sort(sorter);
  }

  /**
   * Apply UI-level filters (college type, status, free-text search) on top
   * of an already-predicted result set. Does not touch prediction math.
   */
  function applyFilters(results, opts) {
    opts = opts || {};
    const collegeType = opts.collegeType || 'all';
    const status = opts.status || 'all';
    const query = (opts.query || '').trim().toLowerCase();

    return results.filter(function (r) {
      if (collegeType !== 'all' && r.collegeType !== collegeType) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (query) {
        const hay = (r.collegeName + ' ' + r.course + ' ' + r.choiceCode).toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
  }

  function computeStats(results) {
    const stats = { total: results.length, high: 0, moderate: 0, low: 0 };
    for (let i = 0; i < results.length; i++) {
      stats[results[i].status]++;
    }
    return stats;
  }

  global.SetuFilters = {
    sortResults: sortResults,
    applyFilters: applyFilters,
    computeStats: computeStats,
  };
})(window);
