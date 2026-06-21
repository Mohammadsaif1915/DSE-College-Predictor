/**
 * Setu — export.js
 * Exports the *currently filtered* results to CSV or Excel (.xls, SpreadsheetML).
 * No external libraries required.
 */
(function (global) {
  'use strict';

  const COLUMNS = [
    { key: 'collegeCode', label: 'College Code' },
    { key: 'collegeName', label: 'College Name' },
    { key: 'collegeType', label: 'College Type' },
    { key: 'region', label: 'Region' },
    { key: 'choiceCode', label: 'Choice Code' },
    { key: 'course', label: 'Branch' },
    { key: 'categoryUsed', label: 'Category Used' },
    { key: 'fellBackToOpen', label: 'Fallback Applied' },
    { key: 'cutoffRank', label: 'Cutoff Rank' },
    { key: 'cutoffPct', label: 'Cutoff %' },
    { key: 'status', label: 'Admission Status' },
  ];

  function rowsToAOA(results) {
    const header = COLUMNS.map(function (c) { return c.label; });
    const body = results.map(function (r) {
      return COLUMNS.map(function (c) {
        const v = r[c.key];
        if (c.key === 'fellBackToOpen') return v ? 'Yes' : 'No';
        if (c.key === 'status') return v.charAt(0).toUpperCase() + v.slice(1);
        return v;
      });
    });
    return [header].concat(body);
  }

  function csvEscape(v) {
    const s = String(v == null ? '' : v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportCSV(results, filename) {
    const aoa = rowsToAOA(results);
    const csv = aoa.map(function (row) { return row.map(csvEscape).join(','); }).join('\r\n');
    downloadBlob('\ufeff' + csv, filename || 'setu-predictions.csv', 'text/csv;charset=utf-8');
  }

  /** Excel via SpreadsheetML (.xls) — opens natively in Excel, no library needed. */
  function exportExcel(results, filename) {
    const aoa = rowsToAOA(results);
    const rowsXml = aoa
      .map(function (row) {
        const cells = row
          .map(function (v) {
            const isNum = typeof v === 'number';
            const type = isNum ? 'Number' : 'String';
            const val = isNum ? v : String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<Cell><Data ss:Type="' + type + '">' + val + '</Data></Cell>';
          })
          .join('');
        return '<Row>' + cells + '</Row>';
      })
      .join('');

    const xml =
      '<?xml version="1.0"?>' +
      '<?mso-application progid="Excel.Sheet"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
      'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
      'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
      '<Worksheet ss:Name="Predictions">' +
      '<Table>' + rowsXml + '</Table>' +
      '</Worksheet>' +
      '</Workbook>';

    downloadBlob(xml, filename || 'setu-predictions.xls', 'application/vnd.ms-excel');
  }

  global.SetuExport = { exportCSV: exportCSV, exportExcel: exportExcel };
})(window);
