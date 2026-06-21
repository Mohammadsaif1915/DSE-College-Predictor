/**
 * Setu — search.js
 * Accessible searchable combobox used for the Branch field.
 * ARIA combobox pattern: input + listbox, arrow keys, Enter, Escape, type-to-filter.
 */
(function (global) {
  'use strict';

  const U = global.SetuUtils;

  function createCombobox(opts) {
    const root = opts.root; // .combobox element
    const input = opts.input;
    const list = opts.list;
    const clearBtn = opts.clearBtn;
    const options = opts.options; // array of strings
    const onChange = opts.onChange || function () {};

    let filtered = options.slice();
    let activeIndex = -1;
    let value = '';

    function open() {
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
    }

    function renderOptions() {
      if (!filtered.length) {
        U.renderInto(list, '<li class="combobox-empty">No branches match your search.</li>');
        return;
      }
      const html = filtered
        .slice(0, 60)
        .map(function (opt, i) {
          const selected = i === activeIndex;
          return (
            '<li role="option" id="combo-opt-' + i + '" class="combobox-option" ' +
            'aria-selected="' + selected + '" data-value="' + U.escapeHtml(opt) + '">' +
            U.escapeHtml(opt) + '</li>'
          );
        })
        .join('');
      U.renderInto(list, html);
    }

    function filterNow(q) {
      const ql = q.trim().toLowerCase();
      filtered = ql ? options.filter(function (o) { return o.toLowerCase().indexOf(ql) !== -1; }) : options.slice();
      activeIndex = filtered.length ? 0 : -1;
      renderOptions();
    }

    const debouncedFilter = U.debounce(filterNow, 120);

    function selectValue(v) {
      value = v;
      input.value = v;
      clearBtn.hidden = !v;
      close();
      onChange(value);
    }

    input.addEventListener('input', function () {
      clearBtn.hidden = !input.value;
      debouncedFilter(input.value);
      open();
      if (!input.value) onChange('');
    });

    input.addEventListener('focus', function () {
      filterNow(input.value);
      open();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (list.hidden) { open(); filterNow(input.value); return; }
        activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
        renderOptions();
        scrollActiveIntoView();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderOptions();
        scrollActiveIntoView();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          selectValue(filtered[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        close();
      } else if (e.key === 'Tab') {
        close();
      }
    });

    function scrollActiveIntoView() {
      const el = list.querySelector('[aria-selected="true"]');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    list.addEventListener('mousedown', function (e) {
      const li = e.target.closest('.combobox-option');
      if (!li) return;
      e.preventDefault();
      selectValue(li.getAttribute('data-value'));
    });

    clearBtn.addEventListener('click', function () {
      selectValue('');
      input.focus();
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) close();
    });

    return {
      getValue: function () { return value; },
      setValue: function (v) {
        value = v || '';
        input.value = value;
        clearBtn.hidden = !value;
      },
      reset: function () { selectValue(''); },
    };
  }

  global.SetuSearch = { createCombobox: createCombobox };
})(window);
