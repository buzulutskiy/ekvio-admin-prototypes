(() => {
  'use strict';
  // Keep utility columns fixed; distribute spare width among content columns.
  const studyTable = document.querySelector('.table-surface .ek-table');
  if (studyTable) {
    const header = studyTable.querySelector('.ek-table__header');
    const bases = [...header.querySelectorAll('th')].map(c => parseFloat(c.getAttribute('width')) || 100);
    const minimum = bases.reduce((a,b) => a+b, 0);
    const weights = bases.map((_,i) => i === 3 ? 4 : [8,10,11].includes(i) ? 2 : i > 3 ? 1 : 0);
    const totalWeight = weights.reduce((a,b) => a+b, 0);
    const fitTable = () => {
      const width = Math.max(minimum, studyTable.clientWidth);
      const widths = bases.map((b,i) => b + (width-minimum)*weights[i]/totalWeight);
      for (const table of studyTable.querySelectorAll('.ek-table__header,.ek-table__body')) {
        let cols = table.querySelector('colgroup');
        if (!cols) { cols = document.createElement('colgroup'); table.prepend(cols); }
        cols.replaceChildren(...widths.map(w => { const col=document.createElement('col'); col.style.width=`${w}px`; return col; }));
        table.style.setProperty('width', `${width}px`, 'important');
        table.style.setProperty('min-width', `${width}px`, 'important');
      }
      const wrapper = studyTable.querySelector('.ek-table__header-wrapper');
      if (wrapper) wrapper.style.width = `${width}px`;
    };
    fitTable(); new ResizeObserver(fitTable).observe(studyTable);
  }

  const $ = selector => document.querySelector(selector);
  const isSettings = document.body.dataset.researchPage === 'settings';
  const root = new URL(isSettings ? '../' : './', location.href);
  const listURL = new URL('index.html', root);
  const settingsURL = new URL('program-settings/index.html', root);
  const seenKey = 'ekvio-visual-tour-seen-v1';
  const activeKey = 'ekvio-visual-tour-step-v1';
  const get = key => { try { return sessionStorage.getItem(key); } catch (_) { return null; } };
  const set = (key, value) => { try { sessionStorage.setItem(key, value); } catch (_) { /* Tour still works without storage. */ } };
  const remove = key => { try { sessionStorage.removeItem(key); } catch (_) { /* Optional session continuity. */ } };
  const steps = [
    { page: 'list', target: '.list-workspace', title: 'Общий вид', text: 'Знакомая админ-панель — в новом оформлении, ближе к веб-версии для сотрудников. Оцените страницу целиком.', side: 'overview' },
    { page: 'list', target: '.refresh-sidebar', title: 'Меню разделов', text: 'Меню — как в веб-версии. Сверните его кнопкой внизу, затем наведите на иконки: названия снова появятся.', side: 'right' },
    { page: 'list', target: '.filters-panel-scroll', title: 'Привычные фильтры', text: 'Фильтры на привычном месте. Группы открыты, у категорий есть поиск. Прокрутите панель — таблица останется на месте.', side: 'right' },
    { page: 'list', target: '.table-surface', title: 'Таблица и прокрутка', text: 'Строки компактнее. Прокрутите таблицу: шапка и пагинация остаются видны, а ID и название закреплены слева.', side: 'left', demo: true },
    { page: 'list', target: '.material-row-link', title: 'Откройте материал', text: 'Нажмите на первую строку — откроются настройки «Адаптации нового сотрудника».', side: 'below', next: 'Открыть материал' },
    { page: 'settings', target: '.material-header', title: 'Шапка и возврат к списку', text: 'Страница компактнее. Вместо крестика — «Назад», как в веб-версии. «Уведомление», «Активный» и «Сохранить» остались под рукой.', side: 'below' },
    { page: 'settings', target: '#settings-section-0', title: 'Настройки материала', text: 'Настройки собраны в блоки: название слева, значение справа. Посмотрите «Описание и оформление».', side: 'right' },
    { page: 'settings', target: '#settings-section-2', title: 'Группировка параметров', text: 'Прохождение, мотивация, обратная связь — у каждой группы свой блок. Прокрутите настройки: понятно ли, где что искать?', side: 'right' },
    { page: 'settings', target: '.material-back-zone a', title: 'Вернитесь к списку', text: 'Компактная шапка остаётся сверху. Нажмите стрелку «Назад» и вернитесь к списку обучения.', side: 'below', next: 'Вернуться к списку' },
  ];
  const launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'research-launcher'; launcher.textContent = 'О прототипе';
  $('.topbar-utilities').prepend(launcher);
  const intro = document.createElement('dialog');
  intro.className = 'research-dialog'; intro.setAttribute('aria-labelledby', 'research-intro-title');
  intro.setAttribute('aria-describedby', 'research-intro-text');
  intro.innerHTML = `<p class="research-eyebrow">Прототип · Обучение и настройки материала</p><h2 id="research-intro-title">Посмотрите обновлённый дизайн</h2><p id="research-intro-text">Новое оформление, привычная структура. Посмотрите список обучения и настройки материала.</p><p>Пройдите короткий обзор, затем изучите интерфейс без подсказок и вернитесь к опросу.</p><p class="research-note">Это демонстрация: другие разделы отключены, фильтры не меняют список. Данные в Эквио не сохраняются.</p><div class="research-actions"><button type="button" class="research-button primary" data-start>Перейти к просмотру</button></div>`;
  const finish = document.createElement('dialog');
  finish.className = 'research-dialog'; finish.setAttribute('aria-labelledby', 'research-finish-title');
  finish.innerHTML = `<p class="research-eyebrow">Обзор завершён</p><h2 id="research-finish-title">Теперь ваше мнение</h2><p>Оцените оформление, таблицу и настройки в опросе. Хотите сначала изучить всё сами? Подсказки больше не будут мешать.</p><div class="research-actions"><button type="button" class="research-button primary" data-continue>Посмотреть без подсказок</button><button type="button" class="research-button" data-return>Пройти тур заново</button></div>`;
  const coach = document.createElement('section');
  coach.className = 'research-coach'; coach.hidden = true; coach.tabIndex = -1;
  coach.setAttribute('role', 'dialog'); coach.setAttribute('aria-modal', 'false');
  coach.setAttribute('aria-labelledby', 'research-step-title'); coach.setAttribute('aria-describedby', 'research-step-text');
  const highlight = document.createElement('div'); highlight.className = 'research-highlight'; highlight.hidden = true; highlight.setAttribute('aria-hidden', 'true');
  const status = document.createElement('div'); status.className = 'research-status'; status.hidden = true; status.setAttribute('role', 'status');
  document.body.append(intro, finish, highlight, coach, status);
  let current = -1, statusTimer, layoutFrame, previousFocus = launcher;
  const announce = message => {
    clearTimeout(statusTimer); status.textContent = message; status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 4500);
  };
  const stop = (restore = true) => {
    current = -1; document.body.classList.remove('research-overview-open'); remove(activeKey); coach.hidden = true; highlight.hidden = true;
    if (restore) (previousFocus?.isConnected ? previousFocus : launcher).focus({ preventScroll: true });
  };
  const travel = (url, index) => {
    if (index !== undefined) { set(activeKey, String(index)); url = new URL(url); url.hash = `tour-${index}`; }
    location.assign(url.href);
  };
  const returnToList = () => {
    remove(activeKey);
    const url = new URL(listURL);
    url.hash = 'tour-complete';
    location.assign(url.href);
  };
  const position = () => {
    if (current < 0 || coach.hidden) return;
    const step = steps[current], target = $(step.target);
    if (!target) { highlight.hidden = true; return; }
    let bounds = target.getBoundingClientRect();
    if (current === steps.length - 1) {
      const icon=target.querySelector('svg');
      if (icon) { const r=icon.getBoundingClientRect(); const size=40; bounds={left:r.left+r.width/2-size/2,right:r.left+r.width/2+size/2,top:r.top+r.height/2-size/2,bottom:r.top+r.height/2+size/2}; }
    }
    const top = Math.max(62, bounds.top), bottom = Math.min(innerHeight - 8, bounds.bottom);
    const left = Math.max(6, bounds.left), right = Math.min(innerWidth - 6, bounds.right);
    highlight.hidden = bottom <= top || right <= left;
    Object.assign(highlight.style, { top: `${top}px`, left: `${left}px`, width: `${Math.max(0, right - left)}px`, height: `${Math.max(0, bottom - top)}px` });
    const w = coach.offsetWidth, h = coach.offsetHeight, gap = 16;
    let x = right + gap, y = top + 12;
    if (step.side === 'overview') { x = 12; y = top + 20; }
    else if (step.side === 'center') { x = (left + right - w) / 2; y = top + 28; }
    else if (step.side === 'left') { x = right - w - 20; y = top + 90; }
    else if (step.side === 'below') { x = Math.min(right - w, left + 20); y = bottom + gap; }
    else if (x + w > innerWidth - 12) { x = right - w - 20; y = top + 24; }
    if (step.side === 'below' && y + h > innerHeight - 12) y = Math.max(74, top - h - gap);
    x = Math.max(12, Math.min(innerWidth - w - 12, x));
    y = Math.max(74, Math.min(innerHeight - h - 12, y));
    coach.style.left = `${x}px`; coach.style.top = `${y}px`;
  };
  const queuePosition = () => { cancelAnimationFrame(layoutFrame); layoutFrame = requestAnimationFrame(position); };
  const hasHorizontalOverflow = () => {
    const table = $('.table-surface .ek-table');
    return table && table.scrollWidth > table.clientWidth + 2;
  };
  const visibleSteps = () => steps.map((_, i) => i).filter(i => i !== 3 || (isSettings ? get('ekvio-study-overflow') !== 'false' : hasHorizontalOverflow()));
  const show = index => {
    if (!isSettings && index === 3 && !hasHorizontalOverflow()) index = current > index ? 2 : 4;
    const step = steps[index];
    if (!step) return;
    if ((step.page === 'settings') !== isSettings) { travel(isSettings ? listURL : settingsURL, index); return; }
    current = index; set(activeKey, String(index));
    if (!isSettings) set('ekvio-study-overflow', String(hasHorizontalOverflow()));
    document.body.classList.toggle('research-overview-open', index === 0);
    if (isSettings) {
      if (index === 5 || index === 6) window.scrollTo(0, 0);
      else if (index === 7) window.scrollTo(0, $('#settings-section-2').getBoundingClientRect().top + window.scrollY - 140);
      else if (index === 8) window.scrollTo(0, Math.max(180, window.scrollY));
    } else {
      if (index === 2) $('.filters-panel').scrollTop = 0;
      if (index === 4) { const table = $('.table-surface .ek-table'); table.scrollTop = 0; table.scrollLeft = 0; }
    }
    coach.classList.toggle('research-overview', index === 0);
    coach.innerHTML = `<p class="research-eyebrow">${visibleSteps().indexOf(index) + 1} из ${visibleSteps().length} · Обзор изменений</p><h2 id="research-step-title">${step.title}</h2><p id="research-step-text">${step.text}</p>${step.demo ? '<button type="button" class="research-button research-demo" data-demo>Показать прокрутку вправо</button>' : ''}<div class="research-actions"><button type="button" class="research-button ghost" data-prev ${index === 0 ? 'disabled' : ''}>Назад</button><button type="button" class="research-button primary" data-next>${step.next || 'Далее'}</button></div><span class="research-explore">Пробуйте интерфейс, затем продолжайте обзор.</span>`;
    coach.hidden = false; position(); coach.focus({ preventScroll: true }); requestAnimationFrame(position);
  };
  launcher.addEventListener('click', () => { previousFocus = launcher; stop(false); intro.showModal(); });
  intro.querySelector('[data-start]').addEventListener('click', () => { set(seenKey, 'true'); intro.close(); show(0); });
  intro.addEventListener('cancel', event => event.preventDefault());
  coach.addEventListener('click', event => {
    if (event.target.closest('[data-prev]')) show(current - 1);
    if (event.target.closest('[data-next]')) {
      if (current === steps.length - 1) returnToList();
      else show(current + 1);
    }
    if (event.target.closest('[data-demo]')) {
      const table = $('.table-surface .ek-table');
      const shifted = table.scrollLeft > 0;
      table.scrollTo({ left: shifted ? 0 : table.scrollWidth - table.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      event.target.textContent = shifted ? 'Показать прокрутку вправо' : 'Вернуть начало таблицы';
    }
  });
  finish.querySelector('[data-continue]').addEventListener('click', () => { finish.close(); launcher.focus(); });
  finish.querySelector('[data-return]').addEventListener('click', () => { finish.close(); show(0); });
  finish.addEventListener('close', () => launcher.focus({ preventScroll: true }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && current >= 0) event.preventDefault();
  });
  // Capture before legacy handlers: unavailable destinations never leave this study.
  document.addEventListener('click', event => {
    if (event.target.closest('.research-coach,.research-dialog,.research-launcher')) return;
    const blocked = event.target.closest('[data-research-blocked]');
    const link = event.target.closest('a');
    if (blocked) {
      event.preventDefault(); event.stopImmediatePropagation();
      announce('Здесь доступны только «Обучение» и настройки первого материала.'); return;
    }
    if (link) {
      const url = new URL(link.href, location.href);
      const allowed = url.origin === root.origin && [listURL.pathname, settingsURL.pathname].includes(url.pathname) && !link.hasAttribute('data-local-unavailable');
      if (!allowed) {
        event.preventDefault(); event.stopImmediatePropagation();
        announce('Этот переход не входит в прототип. Посмотрите обучение и настройки первого материала.'); return;
      }
      if (current >= 0) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (url.pathname === location.pathname) return;
        if (!isSettings && current < 4) { announce('Сначала пройдите подсказки о списке. Переход в материал будет следующим шагом.'); return; }
        if (isSettings && current === steps.length - 1) { returnToList(); return; }
        travel(url, url.pathname === settingsURL.pathname ? 5 : 4); return;
      }
    }
    if (event.target.closest('[data-open-search],[data-utility],.table-toolbar button,.table-wrapper__paginator-wrap,.ek-split-button,.page-header__bottom button,.ek-localize-tab')) {
      event.preventDefault(); event.stopImmediatePropagation();
      announce('Это визуальный прототип: действие не подключено к данным.');
    }
  }, true);
  window.addEventListener('scroll', queuePosition, { passive: true });
  document.addEventListener('scroll', queuePosition, { capture: true, passive: true });
  window.addEventListener('resize', () => { requestAnimationFrame(() => { if (!isSettings && current === 3 && !hasHorizontalOverflow()) show(4); else queuePosition(); }); });
  new ResizeObserver(queuePosition).observe(document.body);
  $('.refresh-sidebar').addEventListener('transitionend', queuePosition);
  window.addEventListener('pageshow', event => {
    if (event.persisted && get(activeKey) === null) stop(false);
  });
  const hashStep = /^#tour-(\d+)$/.exec(location.hash);
  const stored = get(activeKey);
  const initial = hashStep ? Number(hashStep[1]) : stored === null ? null : Number(stored);
  if (hashStep) history.replaceState(null, '', location.pathname + location.search);
  if (!isSettings && location.hash === '#tour-complete') { history.replaceState(null, '', location.pathname + location.search); stop(false); finish.showModal(); }
  else if (initial !== null && steps[initial]) show(initial);
  else if (!get(seenKey)) { previousFocus = launcher; intro.showModal(); }
})();
