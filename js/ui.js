/**
 * Setu — ui.js
 * Pure rendering functions. Takes data, returns/writes HTML. No state owned here.
 */
(function (global) {
  'use strict';

  const U = global.SetuUtils;

  function statsBarHTML(stats) {
    return (
      '<div class="stats-bar fade-in">' +
        statCard(stats.total, '📋 Total Matches', '') +
        statCard(stats.high, '🟢 High Chance', 'high') +
        statCard(stats.moderate, '🟡 Moderate Chance', 'moderate') +
        statCard(stats.low, '🔴 Low Chance', 'low') +
      '</div>'
    );
  }
  function statCard(value, label, cls) {
    return (
      '<div class="stat-card ' + cls + '">' +
        '<div class="stat-value mono">' + value + '</div>' +
        '<div class="stat-label">' + label + '</div>' +
      '</div>'
    );
  }

  function statusLabel(status) {
    return { high: '🟢 High Chance', moderate: '🟡 Moderate Chance', low: '🔴 Low Chance' }[status] || status;
  }

  function resultsTableHTML(results) {
    if (!results.length) return '';
    const rows = results
      .map(function (r) {
        return (
          '<tr>' +
            '<td class="college-cell">' +
              '<div class="college-name">' + U.escapeHtml(r.collegeName) + '</div>' +
              '<div class="college-code">Code ' + U.escapeHtml(r.collegeCode) + ' &middot; Choice ' + U.escapeHtml(r.choiceCode) + '</div>' +
            '</td>' +
            '<td>' + U.escapeHtml(r.course) + '</td>' +
            '<td>' + U.escapeHtml(r.region) + '</td>' +
            '<td class="num">' + U.fmtRank(r.cutoffRank) + '</td>' +
            '<td class="num">' + U.fmtPct(r.cutoffPct) + '</td>' +
            '<td>' + U.escapeHtml(r.categoryUsed) + (r.fellBackToOpen ? '<div class="fallback-note">via fallback</div>' : '') + '</td>' +
            '<td><span class="status-pill ' + r.status + '">' + statusLabel(r.status) + '</span></td>' +
            '<td><span class="type-badge">' + U.escapeHtml(r.collegeType) + '</span></td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="results-table-wrap">' +
        '<table class="results-table">' +
          '<thead><tr>' +
            '<th>College</th><th>Branch</th><th>Region</th><th>Cutoff Rank</th>' +
            '<th>Cutoff %</th><th>Category Used</th><th>Status</th><th>Type</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function resultsCardsHTML(results) {
    if (!results.length) return '';
    return (
      '<div class="results-cards">' +
        results
          .map(function (r) {
            return (
              '<div class="result-card">' +
                '<div class="rc-head">' +
                  '<div>' +
                    '<div class="rc-college">' + U.escapeHtml(r.collegeName) + '</div>' +
                    '<div class="rc-course">' + U.escapeHtml(r.course) + '</div>' +
                  '</div>' +
                  '<span class="status-pill ' + r.status + '">' + statusLabel(r.status) + '</span>' +
                '</div>' +
                '<dl class="rc-grid">' +
                  '<dt>Region</dt><dd>' + U.escapeHtml(r.region) + '</dd>' +
                  '<dt>Cutoff Rank</dt><dd>' + U.fmtRank(r.cutoffRank) + '</dd>' +
                  '<dt>Cutoff %</dt><dd>' + U.fmtPct(r.cutoffPct) + '</dd>' +
                  '<dt>Category Used</dt><dd>' + U.escapeHtml(r.categoryUsed) + (r.fellBackToOpen ? ' *' : '') + '</dd>' +
                '</dl>' +
                '<div class="rc-foot">' +
                  '<span class="type-badge">' + U.escapeHtml(r.collegeType) + '</span>' +
                  '<span class="fallback-note">Code ' + U.escapeHtml(r.collegeCode) + ' &middot; Choice ' + U.escapeHtml(r.choiceCode) + '</span>' +
                '</div>' +
              '</div>'
            );
          })
          .join('') +
      '</div>'
    );
  }

  function skeletonHTML(rows) {
    rows = rows || 6;
    let out = '<div class="results-table-wrap"><div class="skeleton-wrap">';
    for (let i = 0; i < rows; i++) out += '<div class="skeleton-row"></div>';
    out += '</div></div>';
    return out;
  }

  function emptyStateHTML(kind) {
    const states = {
      'no-prediction': {
        icon: '🎯',
        title: 'No prediction yet',
        body: 'Fill in your diploma percentage, category, and preferred region or branch above, then hit Predict to see your matching colleges. ☝️',
      },
      'no-results': {
        icon: '🧐',
        title: 'No colleges found',
        body: 'No courses match this combination of percentage, category, region, and branch. Try widening your region selection or clearing the branch filter.',
      },
      'invalid': {
        icon: '⚠️',
        title: 'Check your percentage',
        body: 'Enter a diploma percentage between 0 and 100 to run a prediction.',
      },
    };
    const s = states[kind] || states['no-prediction'];
    return (
      '<div class="empty-state fade-in-soft">' +
        '<div class="es-icon" aria-hidden="true" style="font-size:44px;line-height:1;">' + s.icon + '</div>' +
        '<h3>' + s.title + '</h3>' +
        '<p>' + s.body + '</p>' +
      '</div>'
    );
  }

  global.SetuUI = {
    statsBarHTML: statsBarHTML,
    resultsTableHTML: resultsTableHTML,
    resultsCardsHTML: resultsCardsHTML,
    skeletonHTML: skeletonHTML,
    emptyStateHTML: emptyStateHTML,
  };
})(window);
