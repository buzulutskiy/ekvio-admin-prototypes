(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const data = window.EKVIO_FILTER_DEMO;
  const key = 'ekvio-learning-filter-tour-v1';
  const labels = {type:'Тип материала',status:'Статус',category:'Категория',comments:'Комментарии',rating:'Участие в рейтинге',attention:'Требует внимания',reassign:'Переназначение',groups:'Группы',admin:'Административная группа',manager:'Назначение руководителем'};
  const defaults = [
    {id:'all',name:'Все материалы',scope:'learning',filters:{},group:''},
    {id:'active-programs',name:'Активные программы',scope:'learning',filters:{type:['Программа обучения'],status:['Активный']},group:''},
    {id:'trajectories',name:'Траектории обучения',scope:'learning',filters:{type:['Траектория обучения']},group:''}
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  const normal = x => String(x).toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
  let custom = [], scope='learning', states={learning:{filters:{},group:'',view:'all'},admin:{filters:{},group:'',view:''}}, pageSize=20, page=1;
  const validFilters = value => Object.fromEntries(Object.entries(value || {}).filter(([k,v])=>labels[k] && Array.isArray(v) && v.every(x=>typeof x==='string')));
  try {
    const saved = JSON.parse(localStorage.getItem(key)||'null');
    if(saved && saved.version===1) {
      custom = (saved.custom||[]).filter(v=>v && typeof v.id==='string' && typeof v.name==='string' && ['admin','learning'].includes(v.scope)).map(v=>({...v,filters:validFilters(v.filters)}));
      scope = saved.scope==='admin'?'admin':'learning';
      for(const k of ['learning','admin']) if(saved.states?.[k]) states[k]={filters:validFilters(saved.states[k].filters),group:data.groups.includes(saved.states[k].group)?saved.states[k].group:'',view:String(saved.states[k].view||'')};
      pageSize=saved.pageSize===10?10:20;
    }
  } catch(_) { /* The prototype also works without browser storage. */ }
  const current = () => states[scope];
  const views = () => [...defaults,...custom];
  const persist = () => {
    try { localStorage.setItem(key,JSON.stringify({version:1,custom,scope,states,pageSize})); }
    catch(_) { toast('Не удалось сохранить набор в браузере'); }
  };
  let toastTimer;
  function toast(text) { const e=$('#lf-toast'); e.textContent=text; e.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>e.hidden=true,2800); }
  const equal = (a,b) => JSON.stringify(Object.entries(a).sort().map(([k,v])=>[k,[...v].sort()])) === JSON.stringify(Object.entries(b).sort().map(([k,v])=>[k,[...v].sort()]));
  const changed = () => { const view=views().find(v=>v.id===current().view); if(!view)return Object.keys(current().filters).length>0 || !!current().group; return view.scope!==scope || !equal(view.filters,current().filters) || view.group!==current().group; };
  const hasConditions = () => Object.keys(current().filters).length>0 || !!current().group;
  const rows=$$('.ek-table__body tbody tr');
  const rowMap=new Map(rows.map(r=>[r.dataset.recordId,r]));
  const table=$('.ek-table');
  const section=$('.lf-top');
  const adminWrap=document.createElement('label'); adminWrap.className='lf-admin-select'; adminWrap.append(document.createTextNode('Группа'));
  const adminSelect=document.createElement('select'); adminSelect.setAttribute('aria-label','Административная группа');
  for(const value of ['',...data.groups]) { const option=document.createElement('option'); option.value=value; option.textContent=value||'Все группы'; adminSelect.append(option); }
  adminWrap.append(adminSelect); section.append(adminWrap);
  adminSelect.addEventListener('change',()=>{current().group=adminSelect.value;page=1;render();persist();});
  $('#lf-add-trigger').classList.add('lf-add');
  $('#lf-add-trigger').setAttribute('aria-controls','lf-picker');
  const viewButton=$('#lf-current-view').parentElement; viewButton.classList.add('lf-view-button'); viewButton.setAttribute('aria-controls','lf-views');
  const saveAs=document.createElement('button');saveAs.type='button';saveAs.className='lf-reset';saveAs.textContent='Сохранить как…';saveAs.hidden=true;$('#lf-save').after(saveAs);
  saveAs.addEventListener('click',()=>saveDialog(false));
  function filtered() {
    return data.records.filter(r=>(!current().group||r.admin===current().group) && Object.entries(current().filters).every(([k,values])=>!values.length||values.includes(r[k])));
  }
  function updateRows() {
    const result=filtered(), pages=Math.max(1,Math.ceil(result.length/pageSize));page=Math.min(page,pages);
    const shown=new Set(result.slice((page-1)*pageSize,page*pageSize).map(r=>r.id));
    rows.forEach(r=>r.hidden=!shown.has(r.dataset.recordId));
    $('.table-toolbar__text').textContent=`${result.length} из ${data.records.length} материалов`;
    $('#lf-empty-reset').parentElement.hidden=result.length>0;
    const footer=$('.lf-pagination');footer.replaceChildren();
    const button=(text,fn,disabled=false,active=false,label)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.disabled=disabled;if(active){b.className='active';b.setAttribute('aria-current','page');}if(label)b.setAttribute('aria-label',label);b.addEventListener('click',e=>{e.stopPropagation();fn();});footer.append(b);};
    button('‹',()=>{page--;updateRows();},page===1,false,'Предыдущая страница');
    for(let i=1;i<=pages;i++)button(String(i),()=>{page=i;updateRows();},false,page===i,`Страница ${i}`);
    button('›',()=>{page++;updateRows();},page===pages,false,'Следующая страница');
    const range=document.createElement('span');range.className='lf-result-range';range.textContent=result.length?`${(page-1)*pageSize+1}–${Math.min(page*pageSize,result.length)} из ${result.length}`:'0 материалов';footer.append(range);
    const size=document.createElement('select');size.setAttribute('aria-label','Материалов на странице');for(const n of [20,10]){const o=document.createElement('option');o.value=n;o.textContent=n+' на странице';size.append(o);}size.value=pageSize;size.addEventListener('change',()=>{pageSize=Number(size.value);page=1;updateRows();persist();});footer.append(size);
    table.scrollTop=0;
  }
  function render() {
    $$('.lf-tabs button').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.lfTab===scope));b.tabIndex=b.dataset.lfTab===scope?0:-1;});
    adminWrap.hidden=scope!=='admin';adminSelect.value=current().group;
    const v=views().find(v=>v.id===current().view);$('#lf-current-view').textContent=v?.name || (scope==='admin'?'Материалы группы':'Новый набор');
    $('.lf-dirty').hidden=true;
    $('#lf-reset').hidden=!hasConditions();
    const isCustom=custom.some(v=>v.id===current().view);
    $('#lf-save').hidden=!changed()||!hasConditions();$('#lf-save').textContent=isCustom?'Обновить набор':'Сохранить набор';
    saveAs.hidden=!(isCustom&&hasConditions());
    const host=$('#lf-conditions');host.replaceChildren();
    Object.entries(current().filters).forEach(([k,values],index)=>{
      if(index){const and=document.createElement('span');and.className='lf-condition-and';and.textContent='и';host.append(and);}
      const wrap=document.createElement('div');wrap.className='lf-condition';
      const edit=document.createElement('button');edit.type='button';edit.setAttribute('aria-label',`Изменить условие: ${labels[k]}`);
      const label=document.createElement('span');label.className='lf-condition-key';label.textContent=labels[k]+':';
      const value=document.createElement('span');value.className='lf-condition-value';value.textContent=values.length===1?values[0]:`${values[0]} +${values.length-1}`;value.title=values.join(', ');
      edit.append(label,value);edit.addEventListener('click',()=>openPicker(edit,k));
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Удалить условие: ${labels[k]}`);remove.addEventListener('click',()=>{delete current().filters[k];page=1;render();persist();$('#lf-add-trigger').focus();});
      wrap.append(edit,remove);host.append(wrap);
    });
    host.hidden=!host.childElementCount; updateRows();
    document.dispatchEvent(new CustomEvent('filter-study:state', {detail: {
      view: current().view, name: v?.name || '', filters: clone(current().filters),
      custom: custom.some(item=>item.id===current().view), changed: changed()
    }}));
  }
  $$('.lf-tabs button').forEach((b,index)=>{
    b.addEventListener('click',()=>{scope=b.dataset.lfTab;page=1;render();persist();});
    b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=$$('.lf-tabs button')[1-index];next.click();next.focus();}});
  });
  function reset(){current().filters={};current().group='';current().view=scope==='learning'?'all':'';page=1;render();persist();}
  $('#lf-reset').addEventListener('click',reset);$('#lf-empty-reset').addEventListener('click',reset);
  let anchor=null, field=null, draft=new Set();
  const picker=$('#lf-picker'),search=$('#lf-value-search');
  picker.tabIndex=-1;
  function place(dialog,target,center=false){
    dialog.style.left='0px';dialog.style.top='0px';dialog.showModal();
    const box=dialog.getBoundingClientRect(),r=target.getBoundingClientRect();
    dialog.style.left=Math.max(16,Math.min(center?(innerWidth-box.width)/2:r.left,innerWidth-box.width-16))+'px';
    dialog.style.top=Math.max(16,Math.min(center?(innerHeight-box.height)/2:r.bottom+8,innerHeight-box.height-16))+'px';
  }
  function openPicker(target,k=null){anchor=target;field=k;draft=new Set(current().filters[k]||[]);search.value='';renderPicker();if(!picker.open)place(picker,target);picker.focus({preventScroll:true});$('#lf-add-trigger').setAttribute('aria-expanded','true');}
  function renderPicker(){
    $('#lf-picker-back').hidden=!field;$('#lf-picker-title').textContent=field?labels[field]:'Добавить условие';$('#lf-picker-footer').hidden=!field;search.placeholder=field?'Найти значение':'Найти параметр';
    const list=$('#lf-picker-list');list.replaceChildren();const query=normal(search.value);
    if(!field){
      Object.entries(labels).filter(([k,label])=>normal(label).includes(query)).forEach(([k,label])=>{const b=document.createElement('button');b.type='button';b.className='lf-picker-item';const t=document.createElement('span');t.textContent=label;const hint=document.createElement('small');hint.textContent=current().filters[k]?'Изменить':'›';b.append(t,hint);b.addEventListener('click',()=>{field=k;draft=new Set(current().filters[k]||[]);search.value='';renderPicker();picker.focus({preventScroll:true});});list.append(b);});
    }else{
      const options=field==='groups'?data.groups:data.values[field]||[];
      options.filter(x=>normal(x).includes(query)).forEach(value=>{const label=document.createElement('label');label.className='lf-picker-item';const input=document.createElement('input');input.type='checkbox';input.checked=draft.has(value);input.addEventListener('change',()=>{if(input.checked)draft.add(value);else draft.delete(value);});const text=document.createElement('span');text.textContent=value;label.append(input,text);list.append(label);});
    }
    if(!list.childElementCount){const p=document.createElement('p');p.className='lf-picker-empty';p.textContent='Ничего не найдено';list.append(p);}
  }
  $('#lf-add-trigger').addEventListener('click',e=>openPicker(e.currentTarget));
  search.addEventListener('input',renderPicker);
  $('#lf-picker-back').addEventListener('click',()=>{field=null;draft.clear();search.value='';renderPicker();picker.focus({preventScroll:true});});
  $('#lf-apply').addEventListener('click',()=>{if(draft.size)current().filters[field]=[...draft];else delete current().filters[field];page=1;picker.close();render();persist();$('#lf-add-trigger').focus();});
  picker.addEventListener('close',()=>$('#lf-add-trigger').setAttribute('aria-expanded','false'));
  function renderViews(){
    const list=$('#lf-view-list');list.replaceChildren();
    views().forEach(v=>{const row=document.createElement('div');row.className='lf-view-row'+(current().view===v.id?' is-selected':'');const b=document.createElement('button');b.type='button';b.className='lf-view-item';const mark=document.createElement('span');mark.textContent=current().view===v.id?'✓':'';const text=document.createElement('span');text.textContent=v.name;b.append(mark,text);b.addEventListener('click',()=>{scope=v.scope;states[scope]={filters:clone(v.filters),group:v.group||'',view:v.id};page=1;$('#lf-views').close();render();persist();});row.append(b);
      if(custom.includes(v)){const del=document.createElement('button');del.type='button';del.className='lf-delete-view';del.textContent='×';del.setAttribute('aria-label',`Удалить набор ${v.name}`);del.addEventListener('click',()=>{custom=custom.filter(x=>x.id!==v.id);for(const state of Object.values(states))if(state.view===v.id)state.view='';persist();renderViews();render();toast('Набор удалён. Выбранные условия сохранены.');});row.append(del);}list.append(row);
    });
  }
  viewButton.addEventListener('click',()=>{renderViews();viewButton.setAttribute('aria-expanded','true');place($('#lf-views'),viewButton);});
  $('#lf-views').addEventListener('close',()=>viewButton.setAttribute('aria-expanded','false'));
  let editingId=null;
  function saveDialog(edit){editingId=edit?current().view:null;const view=custom.find(v=>v.id===editingId);$('#lf-save-title').textContent=view?'Обновить набор':'Сохранить набор';$('#lf-view-name').value=view?.name||'';$('#lf-save-error').hidden=true;place($('#lf-save-dialog'),$('#lf-save'),true);$('#lf-view-name').focus();}
  $('#lf-save').addEventListener('click',()=>saveDialog(custom.some(v=>v.id===current().view)));
  $('#lf-save-form').addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();const name=$('#lf-view-name').value.trim();if(!name)return;
    if(views().some(v=>normal(v.name)===normal(name)&&v.id!==editingId)){const error=$('#lf-save-error');error.textContent='Такое название уже есть. Выберите другое.';error.hidden=false;return;}
    const v={id:editingId||'view-'+crypto.randomUUID(),name,scope,group:current().group,filters:clone(current().filters)};
    if(editingId)custom=custom.map(x=>x.id===editingId?v:x);else custom.push(v);current().view=v.id;persist();$('#lf-save-dialog').close();render();toast('Набор сохранён');
  });
  $('#lf-save-cancel').addEventListener('click',()=>$('#lf-save-dialog').close());
  $$('[data-lf-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $$('.lf-dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));
  // Preserve table checkbox actions while filtering hides rows.
  $('.ek-table__header input[type=checkbox]')?.addEventListener('change',e=>rows.filter(r=>!r.hidden).forEach(r=>{const c=r.querySelector('input[type=checkbox]');if(c)c.checked=e.target.checked;}));
  const workspace=$('.list-workspace');
  const fitTable=()=>{
    const overhead=[...workspace.children].filter(el=>!el.matches('.table-surface')&&!el.hidden).reduce((sum,el)=>sum+el.offsetHeight,0);
    const gap=parseFloat(getComputedStyle(workspace).gap)||0;
    workspace.style.minHeight=(overhead+340+gap*Math.max(0,[...workspace.children].filter(el=>!el.hidden).length-1))+'px';
  };
  const layoutObserver=new ResizeObserver(fitTable);
  layoutObserver.observe($('.lf-panel'));
  new MutationObserver(()=>{for(const el of workspace.children)if(!el.matches('.table-surface'))layoutObserver.observe(el);fitTable();}).observe(workspace,{childList:true});
  window.addEventListener('resize',fitTable);
  fitTable();
  document.addEventListener('filter-study:request', render);
  document.addEventListener('filter-study:snapshot', event => {
    event.detail.snapshot={scope,states:clone(states),custom:clone(custom),page,field,draft:[...draft],search:search.value,editingId,name:$('#lf-view-name').value,dialogs:[...document.querySelectorAll('.lf-dialog[open]')].map(d=>d.id)};
  });
  document.addEventListener('filter-study:restore', event => {
    const s=event.detail;if(!s)return;
    for(const d of document.querySelectorAll('.lf-dialog[open]'))d.close();
    scope=s.scope;states=clone(s.states);custom=clone(s.custom);page=s.page;field=s.field;draft=new Set(s.draft);search.value=s.search;editingId=s.editingId;
    render();renderViews();renderPicker();$('#lf-view-name').value=s.name;
    for(const id of s.dialogs)place($('#'+id),id==='lf-views'?viewButton:$('#lf-add-trigger'),id==='lf-save-dialog');
    persist();
  });
  document.addEventListener('filter-study:reset', () => {
    for (const dialog of document.querySelectorAll('.lf-dialog[open]')) dialog.close();
    scope='learning';states.learning={filters:{},group:'',view:'all'};page=1;render();persist();
  });
  render();
})();
