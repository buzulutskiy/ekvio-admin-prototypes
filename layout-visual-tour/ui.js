(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menuPreferenceKey = 'ekvio-visual-study-menu-v1';
  const syncMenuState = collapsed => {
    document.body.classList.toggle('menu-collapsed', collapsed);
    const toggle = $('[data-menu-toggle]');
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    toggle?.setAttribute('aria-label', collapsed ? 'Развернуть меню' : 'Свернуть меню');
    const label = $('.menu-collapse-label');
    if (label) label.textContent = collapsed ? 'Развернуть меню' : 'Свернуть меню';
  };
  const restoreMenuState = () => {
    try { syncMenuState(localStorage.getItem(menuPreferenceKey) === 'true'); } catch (_) { /* Browser storage may be disabled. */ }
  };
  restoreMenuState();
  window.addEventListener('pageshow', restoreMenuState);
  const status = $('.prototype-status');
  const say = message => { if (status) status.textContent = message; };
  const utilityPanel = $('.utility-panel');
  const utilities = $$('[data-utility]');
  const closeUtility = () => {
    utilityPanel.hidden = true;
    utilities.forEach(button => button.setAttribute('aria-expanded', 'false'));
  };
  const filtersPanel = $('#filters-panel');
  const resetFiltersButton = $('[data-reset-filters]');
  const labelFor = input => {
    const label = input.closest('label') || (input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null);
    return label?.textContent.trim().replace(/\s+/g, ' ') || input.getAttribute('aria-label') || input.value;
  };
  const selections = () => filtersPanel ? $$('input:checked', filtersPanel)
    .filter(input => !/^Все$/i.test(labelFor(input)))
    .map(input => ({ input, label: labelFor(input), group: input.closest('.legacy-filter-group') })) : [];
  const renderFilterState = () => {
    if (!filtersPanel) return;
    const host = $('.active-filters');
    host.replaceChildren();
    const selected = selections();
    host.hidden = true;
    const count = $('.filters-total');
    count.hidden = !selected.length;
    count.textContent = selected.length;
    resetFiltersButton.disabled = selected.length === 0;

  };
  if (filtersPanel) {
    const categorySearch = $('[data-category-search]');
    categorySearch?.addEventListener('input', () => {
      const query = categorySearch.value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
      let visible = 0;
      $$('.category-values-scroll li').forEach(row => {
        if (row.hasAttribute('data-filter-all')) return;
        row.hidden = !row.textContent.toLocaleLowerCase('ru').replace(/ё/g, 'е').includes(query);
        if (!row.hidden) visible++;
      });
      $('.category-search-empty').hidden = visible > 0;
    });
    resetFiltersButton.addEventListener('click', () => {
      $$('input:checked', filtersPanel).filter(input => !input.disabled).forEach(input => { input.checked = false; });
      renderFilterState();

      say('Условия сброшены. Серверная фильтрация в локальном концепте не подключена.');
    });
    filtersPanel.addEventListener('change', event => {
      const input = event.target;
      if (!input.matches('input[type="checkbox"],input[type="radio"]')) return;
      const group = input.closest('.legacy-filter-group');
      if (/^Все$/i.test(labelFor(input))) {
        $$('input', group).filter(i => !i.disabled).forEach(i => { i.checked = false; });
      } else {
        $$('input', group).filter(i => /^Все$/i.test(labelFor(i)) && !i.disabled).forEach(i => { i.checked = false; });
      }
      renderFilterState();
      say('Условия выбраны. Серверная фильтрация пока не подключена.');
    });
    document.body.classList.add('filters-pinned');
    filtersPanel.hidden = false;
    renderFilterState();
    const updateFilterEdge = () => filtersPanel.classList.toggle('is-scrolled', filtersPanel.scrollTop > 1);
    filtersPanel.addEventListener('scroll', updateFilterEdge, { passive: true });
    updateFilterEdge();
  }

  const materialHeader = $('.material-header');
  if (materialHeader) {
    $$('[data-form-layout]').forEach(button => button.addEventListener('click', () => {
      document.body.classList.toggle('inline-form-labels', button.dataset.formLayout === 'inline');
      $$('[data-form-layout]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    }));
    // Reserve the full header height: compacting must never change scroll geometry.
    const slot = document.createElement('div');
    slot.className = 'material-header-slot';
    materialHeader.before(slot);
    slot.append(materialHeader);
    const reserveHeight = () => {
      if (!materialHeader.classList.contains('is-scrolled')) {
        slot.style.height = `${materialHeader.offsetHeight}px`;
      }
    };
    reserveHeight();
    new ResizeObserver(reserveHeight).observe(materialHeader);
    const updateHeader = () => {
      // Clip the scrolling content to the same rounded edge as the sticky header.
      const form=$('.settings-form');
      if(form){
        const cut=Math.max(0,slot.getBoundingClientRect().top-form.getBoundingClientRect().top);
        form.style.clipPath=`inset(${cut}px 0 0 round 20px 20px 0 0)`;
      }
      const compact = window.scrollY > 48;
      if (compact === materialHeader.classList.contains('is-scrolled')) return;
      materialHeader.classList.toggle('is-scrolled', compact);
      if (!compact) reserveHeight();
    };
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
    updateHeader();
  }
  const localEditor = $('[data-local-editor]');
  const localTagInput = $('[data-tag-input]');
  if (localTagInput) {
    const values = $('.local-tag-values');
    const addTag = () => {
      const value = localTagInput.value.trim();
      if (!value) return;
      if ([...values.children].some(chip => chip.dataset.value === value)) { localTagInput.value = ''; return; }
      const chip = document.createElement('span');
      chip.className = 'local-tag-chip'; chip.dataset.value = value;
      const text = document.createElement('span'); text.textContent = value;
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить тег ${value}`);
      remove.addEventListener('click', event => { event.stopPropagation(); chip.remove(); localTagInput.focus(); });
      chip.append(text, remove); values.append(chip); localTagInput.value = '';
    };
    localTagInput.addEventListener('keydown', event => {
      if (event.isComposing) return;
      if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); event.stopPropagation(); addTag(); }
      if (event.key === 'Backspace' && !localTagInput.value) values.lastElementChild?.remove();
    });
  }
  if (localEditor) {
    let editorRange = null;
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (selection.rangeCount && localEditor.contains(selection.getRangeAt(0).commonAncestorContainer)) editorRange = selection.getRangeAt(0).cloneRange();
    };
    const restoreSelection = () => {
      localEditor.focus();
      if (!editorRange || !localEditor.contains(editorRange.commonAncestorContainer)) {
        editorRange = document.createRange();
        editorRange.selectNodeContents(localEditor);
        editorRange.collapse(false);
      }
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(editorRange);
    };
    localEditor.addEventListener('keyup', rememberSelection);
    localEditor.addEventListener('mouseup', rememberSelection);
    $('.local-editor-toolbar').addEventListener('mousedown', event => event.preventDefault());
    $$('[data-editor-command]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      rememberSelection();
      if (button.dataset.editorCommand === 'link') {
        $('[data-link-field="text"]').value = editorRange?.toString() || '';
        $('[data-link-field="url"]').value = '';
        $('.editor-link-error').hidden = true;
        $('.editor-link-dialog').showModal();
        $('[data-link-field="url"]').focus();
      } else {
        restoreSelection();
        document.execCommand(button.dataset.editorCommand, false);
        rememberSelection();
      }
    }));
    $('[data-link-cancel]').addEventListener('click', () => $('.editor-link-dialog').close());
    $('[data-link-insert]').addEventListener('click', () => {
      let url;
      try {
        url = new URL($('[data-link-field="url"]').value.trim());
        if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error();
      } catch (_) {
        $('.editor-link-error').textContent = 'Укажите адрес с https://, http:// или mailto:.';
        $('.editor-link-error').hidden = false;
        return;
      }
      const text = $('[data-link-field="text"]').value.trim() || editorRange?.toString() || url.href;
      $('.editor-link-dialog').close();
      restoreSelection();
      const anchor = document.createElement('a');
      anchor.href = url.href; anchor.textContent = text;
      editorRange.deleteContents(); editorRange.insertNode(anchor);
      editorRange.setStartAfter(anchor); editorRange.collapse(true);
      restoreSelection();
      localEditor.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  $('[data-menu-toggle]').addEventListener('click', event => {
    const collapsed = !document.body.classList.contains('menu-collapsed');
    syncMenuState(collapsed);
    try { localStorage.setItem(menuPreferenceKey, String(collapsed)); } catch (_) { /* Keep navigation usable without storage. */ }
    document.body.classList.toggle('menu-collapse-lock', collapsed);
  });
  $$('.ek-table__body tbody tr').forEach(row => {
    const link = $('.material-link', row);
    if (!link) return;
    row.classList.add('material-row-link');
    row.tabIndex = 0;
    row.setAttribute('aria-label', `Открыть материал: ${link.textContent.trim()}`);
    row.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.getSelection()?.toString()) return;
      if (event.target.closest('a,button,input,label,select,textarea,[role="button"],[data-drag-handler]')) return;
      link.click();
    });
    row.addEventListener('keydown', event => {
      if (event.target === row && event.key === 'Enter') { event.preventDefault(); link.click(); }
    });
  });
  $('.refresh-sidebar').addEventListener('pointerleave', () => document.body.classList.remove('menu-collapse-lock'));
  const tableScroll = $('.table-surface .ek-table');
  if (tableScroll) tableScroll.addEventListener('scroll', () => tableScroll.classList.toggle('has-horizontal-scroll', tableScroll.scrollLeft > 0), { passive: true });
  utilities.forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    closeUtility();
    if (!open) return;
    button.setAttribute('aria-expanded', 'true');
    utilityPanel.hidden = false;
    $('.utility-message').textContent = button.dataset.utility === 'account'
      ? 'Аккаунт. Это локальная копия без авторизации и изменения данных.'
      : 'Процессы. В локальном концепте фоновые операции не запускаются.';
  }));

  const searchDialog = $('.command-dialog');
  const searchInput = $('.command-input');
  const searchResults = $('.command-results');
  const searchClear = $('.command-clear');
  const normalize = text => text.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  const prefix = document.body.dataset.basePrefix ?? (document.body.classList.contains('settings-view') ? '../' : '');
  const mapSearchRecord = (record, kind) => ({
    ...record,
    href: record.target === 'list' ? `${prefix}index.html` : record.target === 'program' ? `${prefix}program-settings/index.html` : record.target === 'statistics' ? `${prefix}statistics/select.html` : record.target === 'reports' ? `${prefix}reports/index.html` : '#',
    unavailable: record.target ? '' : `${kind} не перенесён в локальный концепт.`,
  });
  const menuRecords = (window.EKVIO_LOCAL_SEARCH?.sections || []).map(r => mapSearchRecord(r, 'Этот раздел'));
  const materialRecords = (window.EKVIO_LOCAL_SEARCH?.materials || []).map(r => mapSearchRecord(r, 'Этот материал'));
  const renderSearch = () => {
    const query = normalize(searchInput.value);
    searchClear.hidden = !query;
    searchResults.replaceChildren();
    let total = 0;
    for (const [title, records] of [['Разделы', menuRecords], ['Сохранённые материалы', materialRecords]]) {
      const found = records.filter(r => r.label && (!query || normalize(r.label).includes(query))).slice(0, query ? 12 : 6);
      if (!found.length) continue;
      const heading = document.createElement('h2');
      heading.className = 'command-group-title';
      heading.textContent = title;
      searchResults.append(heading);
      for (const record of found) {
        const a = document.createElement('a');
        a.className = 'command-result';
        a.href = record.href;
        if (record.unavailable) a.dataset.localUnavailable = record.unavailable;
        if (record.icon) {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('aria-hidden', 'true');
          const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          use.setAttribute('href', prefix + record.icon); svg.append(use); a.append(svg);
        }
        const label = document.createElement('span'); label.textContent = record.label;
        a.append(label); searchResults.append(a); total++;
      }
    }
    if (!total) {
      const p = document.createElement('p'); p.className = 'command-empty';
      p.textContent = 'В локальной копии ничего не найдено. Попробуйте другое название.';
      searchResults.append(p);
    }
  };
  const openSearch = () => { closeUtility(); renderSearch(); searchDialog.showModal(); searchInput.focus(); };
  $('[data-open-search]').addEventListener('click', openSearch);
  $('.command-close').addEventListener('click', () => searchDialog.close());
  searchInput.addEventListener('input', renderSearch);
  searchClear.addEventListener('click', () => { searchInput.value = ''; renderSearch(); searchInput.focus(); });
  searchDialog.addEventListener('click', event => { if (event.target === searchDialog) searchDialog.close(); });
  searchDialog.addEventListener('keydown', event => {
    const items = $$('.command-result');
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!items.length) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement);
      const index = event.key === 'ArrowDown' ? (current + 1) % items.length : (current <= 0 ? items.length - 1 : current - 1);
      items[index].focus();
    }
    if (event.key === 'Enter' && event.target === searchInput && items.length) { event.preventDefault(); items[0].click(); }
  });

  document.addEventListener('keydown', event => {
    const typing = event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
    if ((event.metaKey || event.ctrlKey) && event.code === 'KeyK') {
      event.preventDefault();
      if (searchDialog.open) searchDialog.close(); else openSearch();
      return;
    }
    if (event.key === 'Escape') {
      if (searchDialog.open || $('.rules-dialog').open) return;
      closeUtility();

    }
    if (typing || event.isComposing || event.metaKey || event.ctrlKey || event.altKey || searchDialog.open || $('.rules-dialog').open) return;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.utility-panel,.topbar-utilities')) closeUtility();

    const unavailable = event.target.closest('[data-local-unavailable]');
    if (unavailable) { event.preventDefault(); say(unavailable.dataset.localUnavailable); return; }
    const original = event.target.closest('.table-surface button,.table-surface .ek-pagination__number,.material-header button,.settings-form button,.filters-panel .ek-button');
    if (original && !original.disabled) {
      event.preventDefault();
      say(original.textContent.includes('Сохранить') ? 'Локальный визуальный концепт: изменения не сохраняются на сервере.' : 'Операция сохранена визуально, её логика пока не перенесена.');
    }
  });
  document.addEventListener('submit', event => { event.preventDefault(); say('Отправка данных в локальном концепте отключена.'); });
  const rules = $('.rules-dialog');
  $('[data-rules]').addEventListener('click', () => rules.showModal());
  $('.rules-close').addEventListener('click', () => rules.close());
  $('[data-hide-preview]').addEventListener('click', () => document.body.classList.add('preview-hidden'));
})();
