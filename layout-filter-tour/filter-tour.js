(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const sessionKey = 'ekvio-filter-tour-progress-v2';
  let progress = {step: -1, savedId: '', savedName: '', finished: false};
  if (!Number.isInteger(progress.step) || progress.step < -1 || progress.step > 6) progress.step = -1;
  let state = {view: '', name: '', filters: {}, custom: false, changed: false};
  const persist = () => { try { sessionStorage.setItem(sessionKey, JSON.stringify(progress)); } catch (_) { /* Works in memory too. */ } };
  const steps = [
    {target: '#lf-view-trigger', title: 'Сохраняйте фильтры и возвращайтесь в один клик', text: 'Теперь наборы фильтров можно сохранять и возвращаться к ним в один клик. Давайте посмотрим, как это работает.'},
    {target: '#lf-views', title: 'Выберите готовый набор', text: 'Выберите «Активные программы» — применятся тип материала и статус.'},
    {target: '#lf-add-trigger', title: 'Уточним список', text: 'Добавьте условие: категория «Адаптация».'},
    {target: '#lf-save', title: 'Чтобы не выбирать заново', text: 'Список изменился. Часто нужны эти условия? Сохраните набор. Чтобы изменить значение, нажмите на выбранное условие.'},
    {target: '#lf-view-name', title: 'Сохраните набор', text: 'Название уже заполнено. Его можно изменить или сразу нажать «Сохранить».'},
    {target: '#lf-view-trigger', title: 'Ваш набор добавлен', text: () => `«${progress.savedName}» теперь в списке. Откройте его и выберите «Все материалы».`},
    {target: '#lf-view-trigger', title: 'Вернитесь к своим фильтрам', text: () => `Выберите «${progress.savedName}» — все сохранённые условия применятся вместе.`}
  ];
  const launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'research-launcher'; launcher.textContent = 'О прототипе';
  $('.topbar-utilities').prepend(launcher);
  const intro = document.createElement('dialog');
  intro.className = 'research-dialog'; intro.setAttribute('aria-labelledby', 'filter-intro-title');
  intro.innerHTML = `<p class="research-eyebrow">Прототип · Фильтрация обучения</p><h2 id="filter-intro-title">Попробуйте обновлённую фильтрацию</h2><p>Выберите условия один раз. Сохраните набор — и возвращайтесь к нему одним нажатием.</p><p>Попробуем вместе: выберем набор, добавим условие и сохраним результат.</p><p class="research-note">Данные демонстрационные. Наборы сохраняются в вашем браузере. После просмотра вернитесь к опросу.</p><div class="research-actions"><button type="button" class="research-button primary" data-start>Перейти к просмотру</button></div>`;
  const finish = document.createElement('dialog');
  finish.className = 'research-dialog'; finish.setAttribute('aria-labelledby', 'filter-finish-title');
  finish.innerHTML = `<p class="research-eyebrow">Вы попробовали новую фильтрацию</p><h2 id="filter-finish-title">Теперь ваше мнение</h2><p>Набор сохранён — вы уже вернулись к нему. Поделитесь мнением в опросе или попробуйте фильтрацию без подсказок.</p><div class="research-actions"><button type="button" class="research-button primary" data-explore>Посмотреть без подсказок</button><button type="button" class="research-button" data-restart>Пройти тур заново</button></div>`;
  const coach = document.createElement('section');
  coach.className = 'research-coach filter-study-coach'; coach.hidden = true; coach.tabIndex = -1;
  coach.setAttribute('role', 'dialog'); coach.setAttribute('aria-modal', 'false'); coach.setAttribute('aria-live', 'polite');
  coach.setAttribute('aria-labelledby', 'filter-step-title'); coach.setAttribute('aria-describedby', 'filter-step-text');
  const highlight = document.createElement('div'); highlight.className = 'research-highlight'; highlight.hidden = true; highlight.setAttribute('aria-hidden', 'true');
  const status = document.createElement('div'); status.className = 'research-status'; status.hidden = true; status.setAttribute('role', 'status');
  document.body.append(intro, finish, highlight, coach, status);
  let timer, frame, restoring = false;
  let history = [];
  const announce = text => { clearTimeout(timer); status.textContent = text; status.hidden = false; timer = setTimeout(() => status.hidden = true, 3500); };
  const findText = (selector, text) => [...document.querySelectorAll(selector)].find(el => el.textContent.replace(/^[✓\s]+/, '').trim() === text);
  const cue = () => {
    const step = progress.step;
    if (step === 1 && $('#lf-views').open) return {target: findText('.lf-view-item', 'Активные программы'), title: 'Выберите готовый набор', text: 'Нажмите «Активные программы».'};
    if (step === 2 && $('#lf-picker').open) {
      if ($('#lf-picker-title').textContent === 'Добавить условие') return {target: [...document.querySelectorAll('button.lf-picker-item')].find(el => el.querySelector('span')?.textContent === 'Категория'), title: 'Добавьте категорию', text: 'Нажмите «Категория».'};
      if ($('#lf-picker-title').textContent === 'Категория') {
        const item = findText('label.lf-picker-item', 'Адаптация');
        return item?.querySelector('input').checked ? {target: $('#lf-apply'), title: 'Примените условие', text: 'Нажмите «Применить». Список материалов изменится.'} : {target: item, title: 'Выберите значение', text: 'Отметьте «Адаптация».'};
      }
    }
    if (step === 4 && $('#lf-view-name').value.trim()) return {target: $('#lf-save-form button[type="submit"]'), title: 'Сохраните набор', text: 'Название уже заполнено. Измените его при желании и нажмите «Сохранить».'};
    if ((step === 5 || step === 6) && $('#lf-views').open) return {target: findText('.lf-view-item', step === 5 ? 'Все материалы' : progress.savedName), title: step === 5 ? 'Переключите фильтры' : 'Откройте свой набор', text: step === 5 ? 'Выберите «Все материалы».' : `Выберите «${progress.savedName}».`};
    return {target: $(steps[step].target), title: steps[step].title, text: typeof steps[step].text === 'function' ? steps[step].text() : steps[step].text};
  };
  const position = () => {
    if (progress.step < 0 || coach.hidden) return;
    const modal = $('.lf-dialog[open]');
    const owner = modal || document.body;
    if (coach.parentElement !== owner) owner.append(coach);
    if (highlight.parentElement !== (modal || document.body)) (modal || document.body).append(highlight);
    const activeCue = cue();
    coach.querySelector('h2').textContent = activeCue.title;
    coach.querySelector('#filter-step-text').textContent = activeCue.text;
    let target = activeCue.target;
    if (!target || !target.getClientRects().length) target = modal || $('#lf-view-trigger');
    const r = target.getBoundingClientRect();
    Object.assign(highlight.style, {left: `${Math.max(4, r.left - 3)}px`, top: `${Math.max(4, r.top - 3)}px`, width: `${Math.min(r.width + 6, innerWidth - 8)}px`, height: `${r.height + 6}px`});
    highlight.hidden = r.bottom < 60 || r.top > innerHeight;
    const w = coach.offsetWidth, h = coach.offsetHeight;
    let x = r.left, y = r.bottom + 12;
    if (y + h > innerHeight - 12) y = r.top - h - 12;
    if (modal) {
      const m = modal.getBoundingClientRect();
      x = m.right + 12; y = r.top;
      if (x + w > innerWidth - 12) x = m.left - w - 12;
      if (x < 12) {x = 12; y = m.bottom + 12;}
    }
    coach.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, x))}px`;
    coach.style.top = `${Math.max(12, Math.min(innerHeight - h - 12, y))}px`;
  };
  const queuePosition = () => {cancelAnimationFrame(frame); frame = requestAnimationFrame(position);};
  const show = index => {
    progress.step = index; persist();
    const step = steps[index];
    coach.innerHTML = `<p class="research-eyebrow">${index + 1} из ${steps.length} · Фильтрация</p><h2 id="filter-step-title"></h2><p id="filter-step-text"></p><div class="research-actions"><button type="button" class="research-button" data-step-back ${history.length ? "" : "disabled"}>Назад</button><button type="button" class="research-button outline" data-step-next>Далее</button></div>`;
    coach.querySelector('h2').textContent = step.title;
    coach.querySelector('#filter-step-text').textContent = typeof step.text === 'function' ? step.text() : step.text;
    coach.hidden = false; position();
  };
  const complete = () => {
    progress.step = -1; progress.finished = true; persist(); coach.hidden = true; highlight.hidden = true;
    document.body.append(highlight, coach); finish.showModal();
  };
  document.addEventListener('filter-study:state', event => {
    state = event.detail;
    if (restoring) return;
    const step = progress.step;
    if (step === 1 && state.view === 'active-programs' && !state.changed) show(2);
    else if (step === 2 && state.filters.category?.includes('Адаптация')) show(3);
    else if (step === 4 && state.custom && !state.changed) {
      progress.savedId = state.view; progress.savedName = state.name; show(5);
    } else if (step === 5 && state.view === 'all' && !state.changed) show(6);
    else if (step === 6 && state.view === progress.savedId && !state.changed) complete();
    queuePosition();
  });
  document.dispatchEvent(new Event('filter-study:request'));
  // Save the state before real actions, including the smaller steps inside a picker.
  document.addEventListener('click', event => {
    if (progress.step < 0 || restoring || !event.target.closest('#lf-view-trigger,.lf-view-item,#lf-add-trigger,button.lf-picker-item,label.lf-picker-item,#lf-apply,#lf-save,#lf-save-form button[type=submit]')) return;
    const request = {snapshot:null};
    document.dispatchEvent(new CustomEvent('filter-study:snapshot', {detail:request}));
    history.push({progress:{...progress}, snapshot:request.snapshot});
    const back=coach.querySelector('[data-step-back]');if(back)back.disabled=false;
  }, true);
  coach.addEventListener('click', event => {
    if (event.target.closest('[data-step-back]') && history.length) {
      const previous=history.pop();restoring=true;
      document.dispatchEvent(new CustomEvent('filter-study:restore', {detail:previous.snapshot}));
      progress={...previous.progress};restoring=false;show(progress.step);queuePosition();
      return;
    }
    if (event.target.closest('[data-step-next]')) {
      const target=cue().target;
      if (target?.matches('dialog') || !target?.getClientRects().length) $('#lf-view-trigger').click();
      else target?.click();
      queuePosition();
    }
  });
  const resetStudy = () => document.dispatchEvent(new Event('filter-study:reset'));
  const start = () => {history=[];resetStudy(); progress = {step: -1, savedId: '', savedName: '', finished: false}; persist(); intro.showModal();};
  launcher.addEventListener('click', () => {
    if (progress.step >= 0) {announce('Продолжите обзор по подсказке.'); return;}
    start();
  });
  intro.querySelector('[data-start]').addEventListener('click', () => {intro.close(); resetStudy(); show(0);});
  intro.addEventListener('cancel', event => event.preventDefault());
  finish.querySelector('[data-explore]').addEventListener('click', () => {finish.close(); launcher.focus();});
  finish.querySelector('[data-restart]').addEventListener('click', () => {finish.close(); start();});
  finish.addEventListener('close', () => launcher.focus());
  // Existing demo handlers open dialogs before this bubble listener runs.
  document.addEventListener('click', event => {
    if (progress.step === 0 && event.target.closest('#lf-view-trigger')) show(1);
    else if (progress.step === 3 && event.target.closest('#lf-save')) {
      let name='Программы адаптации', suffix=2;
      const names=[...document.querySelectorAll('.lf-view-item')].map(el=>el.textContent.replace(/^[✓\s]+/,'').trim());
      while(names.includes(name))name=`Программы адаптации ${suffix++}`;
      $('#lf-view-name').value=name;
      show(4);
    }
    queuePosition();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-research-blocked]')) {
      event.preventDefault(); event.stopImmediatePropagation(); announce('В этом прототипе доступна вкладка «Обучение».'); return;
    }
    if (event.target.closest('.research-coach,.research-dialog,.research-launcher,.lf-panel,.lf-dialog,.lf-pagination,.lf-empty')) return;
    if (event.target.closest('a,[data-open-search],[data-utility],.table-toolbar button,.ek-table__body tbody tr')) {
      event.preventDefault(); event.stopImmediatePropagation(); announce('В этом прототипе проверяем только фильтрацию обучения.');
    }
  }, true);
  document.querySelectorAll('.lf-dialog').forEach(dialog => dialog.addEventListener('close', queuePosition));
  document.addEventListener('input', queuePosition);
  document.addEventListener('change', queuePosition);
  document.addEventListener('scroll', queuePosition, {capture: true, passive: true});
  window.addEventListener('resize', queuePosition);
  new ResizeObserver(queuePosition).observe($('.lf-panel'));
  $('.refresh-sidebar').addEventListener('transitionend', queuePosition);
  resetStudy();
  if (progress.step >= 0) show(progress.step);
  else if (!progress.finished) intro.showModal();
})();
