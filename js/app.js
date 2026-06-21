/**
 * Setu — app.js
 * Wires the form, predictor, filters, search, export, and share modules
 * together. Owns UI state; defers all prediction math to predictor.js.
 */
(function () {
  'use strict';

  const U = window.SetuUtils;
  const DATA = window.SETU_DATA;
  const Predictor = window.SetuPredictor;
  const Filters = window.SetuFilters;
  const UI = window.SetuUI;
  const Share = window.SetuShare;
  const Exporter = window.SetuExport;

  // Reservation categories as used on the official DSE CAP form.
  // base codes map to the G-/L- prefixed columns in the dataset; EWS and
  // PWD are stored without a gender prefix.
  const CATEGORY_OPTIONS = [
    { value: 'OPEN', label: 'OPEN' },
    { value: 'OBC', label: 'OBC' },
    { value: 'SC', label: 'SC' },
    { value: 'ST', label: 'ST' },
    { value: 'NTA', label: 'VJ/DT-A (NT-A)' },
    { value: 'NTB', label: 'NT-B' },
    { value: 'NTC', label: 'NT-C' },
    { value: 'NTD', label: 'NT-D' },
    { value: 'SEBC', label: 'SEBC' },
    { value: 'EWS', label: 'EWS' },
    { value: 'PWD', label: 'PWD' },
  ];

  const NO_GENDER_PREFIX = { EWS: 'EWS', PWD: 'PWD-O' };

  function buildCategoryCode(base, gender) {
    if (NO_GENDER_PREFIX[base]) return NO_GENDER_PREFIX[base];
    const prefix = gender === 'female' ? 'L' : 'G';
    return prefix + base;
  }

  const els = {
    form: U.qs('#predict-form'),
    percentage: U.qs('#f-percentage'),
    percentageErr: U.qs('#f-percentage-error'),
    gender: U.qs('#f-gender'),
    category: U.qs('#f-category'),
    categoryErr: U.qs('#f-category-error'),
    regionChips: U.qs('#f-region-chips'),
    branchInput: U.qs('#f-branch'),
    branchList: U.qs('#f-branch-list'),
    branchClear: U.qs('#f-branch-clear'),
    branchCombo: U.qs('#f-branch-combo'),
    predictBtn: U.qs('#btn-predict'),
    resetBtn: U.qs('#btn-reset'),
    resultsRegion: U.qs('#results-region'),
    toolbar: U.qs('#toolbar'),
    sortSelect: U.qs('#sort-select'),
    typeFilter: U.qs('#type-filter'),
    statusFilter: U.qs('#status-filter'),
    searchInput: U.qs('#result-search'),
    exportCsvBtn: U.qs('#btn-export-csv'),
    exportXlsBtn: U.qs('#btn-export-xls'),
    shareBtn: U.qs('#btn-share'),
    shareNote: U.qs('#share-note'),
    resultsMeta: U.qs('#results-meta'),
  };

  let allResults = []; // full prediction set (before toolbar filters)
  let selectedRegions = new Set();

  /* ---------------------------------------------------------------------
     Region chips
     --------------------------------------------------------------------- */
  function renderRegionChips() {
    const html = DATA.regions
      .map(function (r) {
        return (
          '<button type="button" class="chip" role="checkbox" aria-pressed="false" data-region="' +
          U.escapeHtml(r) + '">' + U.escapeHtml(r) + '</button>'
        );
      })
      .join('');
    U.renderInto(els.regionChips, html);
  }

  els.regionChips && els.regionChips.addEventListener('click', function (e) {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const region = chip.getAttribute('data-region');
    const pressed = chip.getAttribute('aria-pressed') === 'true';
    chip.setAttribute('aria-pressed', String(!pressed));
    if (pressed) selectedRegions.delete(region); else selectedRegions.add(region);
  });

  function setRegions(regions) {
    selectedRegions = new Set(regions || []);
    U.qsa('.chip', els.regionChips).forEach(function (chip) {
      const on = selectedRegions.has(chip.getAttribute('data-region'));
      chip.setAttribute('aria-pressed', String(on));
    });
  }

  /* ---------------------------------------------------------------------
     Branch combobox
     --------------------------------------------------------------------- */
  const branchCombo = window.SetuSearch.createCombobox({
    root: els.branchCombo,
    input: els.branchInput,
    list: els.branchList,
    clearBtn: els.branchClear,
    options: DATA.branches,
    onChange: function () {},
  });

  /* ---------------------------------------------------------------------
     Validation
     --------------------------------------------------------------------- */
  function validate() {
    let ok = true;
    const pct = parseFloat(els.percentage.value);
    if (els.percentage.value.trim() === '' || isNaN(pct) || pct < 0 || pct > 100) {
      els.percentageErr.textContent = 'Enter a valid percentage between 0 and 100.';
      els.percentage.setAttribute('aria-invalid', 'true');
      ok = false;
    } else {
      els.percentageErr.textContent = '';
      els.percentage.removeAttribute('aria-invalid');
    }

    if (!els.category.value) {
      els.categoryErr.textContent = 'Select your reservation category.';
      els.category.setAttribute('aria-invalid', 'true');
      ok = false;
    } else {
      els.categoryErr.textContent = '';
      els.category.removeAttribute('aria-invalid');
    }

    return ok;
  }

  /* ---------------------------------------------------------------------
     Predict / Reset
     --------------------------------------------------------------------- */
  function currentFormState() {
    return {
      percentage: els.percentage.value,
      category: els.category.value,
      gender: els.gender.value,
      region: Array.from(selectedRegions),
      branch: branchCombo.getValue(),
    };
  }

  function runPredict() {
    if (!validate()) {
      U.renderInto(els.resultsRegion, UI.emptyStateHTML('invalid'));
      els.toolbar.hidden = true;
      els.resultsMeta.hidden = true;
      return;
    }

    els.predictBtn.disabled = true;
    U.renderInto(els.resultsRegion, UI.skeletonHTML(6));
    els.toolbar.hidden = true;
    els.resultsMeta.hidden = true;

    const state = currentFormState();
    const categoryCode = buildCategoryCode(state.category, state.gender);

    Share.writeParams(state);

    const delay = 300 + Math.random() * 200;
    setTimeout(function () {
      allResults = Predictor.predict(
        {
          percentage: state.percentage,
          category: categoryCode,
          regions: state.region,
          branchQuery: state.branch,
        },
        DATA
      );
      els.predictBtn.disabled = false;
      renderResults();
    }, delay);
  }

  function resetForm() {
    els.form.reset();
    setRegions([]);
    branchCombo.reset();
    allResults = [];
    els.percentageErr.textContent = '';
    els.categoryErr.textContent = '';
    els.percentage.removeAttribute('aria-invalid');
    els.category.removeAttribute('aria-invalid');
    els.toolbar.hidden = true;
    els.resultsMeta.hidden = true;
    U.renderInto(els.resultsRegion, UI.emptyStateHTML('no-prediction'));
    Share.writeParams({});
  }

  /* ---------------------------------------------------------------------
     Results rendering (with toolbar filters applied)
     --------------------------------------------------------------------- */
  function renderResults() {
    if (!allResults.length) {
      els.toolbar.hidden = true;
      els.resultsMeta.hidden = true;
      U.renderInto(els.resultsRegion, UI.emptyStateHTML('no-results'));
      return;
    }

    els.toolbar.hidden = false;
    els.resultsMeta.hidden = false;

    const filtered = Filters.applyFilters(allResults, {
      collegeType: els.typeFilter.value,
      status: els.statusFilter.value,
      query: els.searchInput.value,
    });
    const sorted = Filters.sortResults(filtered, els.sortSelect.value);
    const stats = Filters.computeStats(allResults);

    let html = UI.statsBarHTML(stats);
    if (!sorted.length) {
      html += UI.emptyStateHTML('no-results');
    } else {
      html += UI.resultsTableHTML(sorted) + UI.resultsCardsHTML(sorted);
    }
    U.renderInto(els.resultsRegion, html);

    els.resultsMeta.textContent = 'Showing ' + sorted.length + ' of ' + allResults.length + ' matched courses.' +
      (sorted.length !== allResults.length ? ' Filters are narrowing this list.' : '');
  }

  const debouncedFilterRender = U.debounce(renderResults, 150);

  /* ---------------------------------------------------------------------
     Wire events
     --------------------------------------------------------------------- */
  function init() {
    renderRegionChips();
    U.renderInto(els.resultsRegion, UI.emptyStateHTML('no-prediction'));

    // populate category select
    const catHtml = '<option value="">Select category</option>' +
      CATEGORY_OPTIONS.map(function (c) { return '<option value="' + c.value + '">' + c.label + '</option>'; }).join('');
    U.renderInto(els.category, catHtml);

    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      runPredict();
    });
    els.resetBtn.addEventListener('click', resetForm);

    els.sortSelect.addEventListener('change', renderResults);
    els.typeFilter.addEventListener('change', renderResults);
    els.statusFilter.addEventListener('change', renderResults);
    els.searchInput.addEventListener('input', debouncedFilterRender);

    els.exportCsvBtn.addEventListener('click', function () {
      const filtered = Filters.sortResults(
        Filters.applyFilters(allResults, {
          collegeType: els.typeFilter.value,
          status: els.statusFilter.value,
          query: els.searchInput.value,
        }),
        els.sortSelect.value
      );
      Exporter.exportCSV(filtered, 'setu-dse-predictions.csv');
    });
    els.exportXlsBtn.addEventListener('click', function () {
      const filtered = Filters.sortResults(
        Filters.applyFilters(allResults, {
          collegeType: els.typeFilter.value,
          status: els.statusFilter.value,
          query: els.searchInput.value,
        }),
        els.sortSelect.value
      );
      Exporter.exportExcel(filtered, 'setu-dse-predictions.xls');
    });

    els.shareBtn.addEventListener('click', function () {
      const url = Share.shareableUrl(currentFormState());
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          els.shareNote.textContent = 'Link copied to clipboard.';
          setTimeout(function () { els.shareNote.textContent = ''; }, 2500);
        });
      } else {
        window.prompt('Copy this link:', url);
      }
    });

    // Restore state from URL (shareable links)
    const params = Share.readParams();
    if (params.percentage) els.percentage.value = params.percentage;
    if (params.category) els.category.value = params.category;
    if (params.region && params.region.length) setRegions(params.region);
    if (params.branch) branchCombo.setValue(params.branch);
    if (params.percentage && params.category) runPredict();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
