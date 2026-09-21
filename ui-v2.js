// Training UI v2: simple tabs + compact exercise editor.
(() => {
  if (typeof state === 'undefined') return;

  const TARGET_KEY='training.exerciseTargets.v2';
  const UI_KEY='training.ui.v2';

  const exercises=[
    {id:'seated_leg_press',name:'シーテッド・レッグプレス',desc:'座ってプレートを押し、椅子側が動くタイプ。',muscle:'legs',label:'脚',weight:true,reps:'12'},
    {id:'leg_extension',name:'レッグエクステンション',desc:'太ももの前側。膝を伸ばすマシン。',muscle:'legs',label:'太もも',weight:true,reps:'12'},
    {id:'ab_crunch',name:'アブドミナルクランチ',desc:'座ってかがみながら肘側のパッドを押す腹筋マシン。',muscle:'core',label:'腹',weight:true,reps:'12'},
    {id:'rotary_torso',name:'ロータリートルソー',desc:'膝を台に乗せ、上半身を固定して左右へ動かす。',muscle:'obliques',label:'脇腹',weight:true,reps:'12'},
    {id:'lat_pulldown',name:'ラットプルダウン',desc:'頭上のバーを胸方向へ引く。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'dead_hang',name:'デッドハング',desc:'バーにぶら下がって保持。',muscle:'grip',label:'握力',weight:false,reps:'20–40秒'},
    {id:'pec_fly',name:'ペックフライ',desc:'腕を開いた位置から前へ閉じる。',muscle:'chest',label:'胸',weight:true,reps:'12'},
    {id:'chest_press',name:'チェストプレス',desc:'座って前へ押す。',muscle:'chest',label:'胸',weight:true,reps:'12'},
    {id:'shoulder_press',name:'ショルダープレス',desc:'座って頭上へ押す。',muscle:'shoulders',label:'肩',weight:true,reps:'12'},
    {id:'chest_supported_row',name:'チェストサポート・ロー',desc:'体を斜めに固定し、左右のバーを後ろへ引く。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'high_row_machine',name:'ハイロー / プルダウン系',desc:'座って頭上の左右バーを下へ引く。',muscle:'back',label:'背中',weight:true,reps:'12'}
  ];

  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
  const legacy=read('trainingQuest.exerciseTargets.v1',{});
  const targets=read(TARGET_KEY,{});
  const ui=read(UI_KEY,{tab:'today',openExercise:null});

  for(const e of exercises){
    const old=targets[e.id]||legacy[e.id]||{};
    const migratedReps=(old.reps==='8–12'||old.reps==='8-12')?e.reps:(old.reps||e.reps); targets[e.id]={weight:old.weight??'',reps:migratedReps,sets:Math.max(1,Number(old.sets||3))};
  }
  const saveTargets=()=>localStorage.setItem(TARGET_KEY,JSON.stringify(targets));
  const saveUi=()=>localStorage.setItem(UI_KEY,JSON.stringify(ui));
  saveTargets();

  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function icon(type){
    const c='viewBox="0 0 24 24" aria-hidden="true"';
    const m={
      chest:'<svg '+c+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8.2 8.5c1.4-1 2.6-1 3.8.1 1.2-1.1 2.4-1.1 3.8-.1v3c-1.5.8-2.7.8-3.8-.1-1.1.9-2.3.9-3.8.1v-3Z"/></svg>',
      back:'<svg '+c+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8 7.5 11 10v5l-3.2-2.2L8 7.5Zm8 0-3 2.5v5l3.2-2.2L16 7.5Z"/></svg>',
      shoulders:'<svg '+c+'><path d="M8 4 5 7l1.3 11h11.4L19 7l-3-3-4 2-4-2Z"/><circle class="muscle-mark" cx="6.8" cy="7.2" r="2.2"/><circle class="muscle-mark" cx="17.2" cy="7.2" r="2.2"/></svg>',
      core:'<svg '+c+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="M9.2 8.2h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1zm-3.5 3.4h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1z"/></svg>',
      obliques:'<svg '+c+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="m8.4 8 2 2.3-1.8 5H7.2L7 10zm7.2 0-2 2.3 1.8 5h1.4L17 10z"/></svg>',
      legs:'<svg '+c+'><path d="M9 3h6l.7 7-1.2 11h-3l.5-8-.5 8h-3L7.8 10 9 3Z"/><path class="muscle-mark" d="M8.7 7.2h2.7l.1 5.8H9.1zm3.9 0h2.7l-.4 5.8h-2.4z"/></svg>',
      grip:'<svg '+c+'><path d="M4 7h16v2H4z"/><path d="M7 9v5.5c0 2 1.4 3.5 3.2 3.5H12v-7H9.8v-2Zm10 0v5.5c0 2-1.4 3.5-3.2 3.5H12v-7h2.2v-2Z"/><path class="muscle-mark" d="M7 10h4v3H7zm6 0h4v3h-4z"/></svg>'
    };
    return m[type]||m.core;
  }
  function badge(e){return '<span class="muscle-badge">'+icon(e.muscle)+'<span>'+esc(e.label)+'</span></span>'}

  function setupSections(){
    const shell=document.querySelector('.shell');
    const header=document.querySelector('.topbar');
    if(!shell||!header)return;

    const hero=shell.querySelector('.hero');
    const stats=shell.querySelector('.stats-grid');
    const summary=shell.querySelector('.level-summary-card');
    const plan=shell.querySelector('#planGrid')?.closest('.card');
    const level=shell.querySelector('#levelGrid')?.closest('.card');
    const progress=shell.querySelector('#progressChart')?.closest('.card');
    const history=shell.querySelector('#history')?.closest('.card');

    [hero,stats].filter(Boolean).forEach(x=>x.dataset.appSection='today');
    [summary,plan,level].filter(Boolean).forEach(x=>x.dataset.appSection='program');
    if(progress)progress.dataset.appSection='progress';
    if(history)history.dataset.appSection='history';

    const ex=document.createElement('section');
    ex.className='card exercise-manager';
    ex.dataset.appSection='exercises';
    ex.innerHTML='<div class="section-head simple-head"><div><p class="eyebrow">EXERCISES</p><h2>種目</h2></div></div><p class="muted">種目を押すと重量・レップ・セットを編集できます。値は自動保存されます。</p><div id="simpleExerciseList" class="simple-exercise-list"></div>';
    shell.appendChild(ex);

    const nav=document.createElement('nav');
    nav.id='simpleTabs';
    nav.className='simple-tabs';
    nav.innerHTML=[
      ['today','今日'],['exercises','種目'],['program','プログラム'],['progress','進捗'],['history','履歴']
    ].map(([id,label])=>'<button type="button" data-simple-tab="'+id+'">'+label+'</button>').join('');
    header.insertAdjacentElement('afterend',nav);
    nav.addEventListener('click',e=>{const b=e.target.closest('[data-simple-tab]');if(b)showTab(b.dataset.simpleTab)});

    // Hide redundant controls; functionality remains available through the remaining UI/automatic progression.
    ['recoveryBtn','levelUpBtn','resetLevelBtn','exportBtn'].forEach(id=>{const n=document.getElementById(id);if(n)n.classList.add('ui-redundant')});

    renderExercises();
    showTab(ui.tab||'today');
  }

  function showTab(id){
    if(!['today','exercises','program','progress','history'].includes(id))id='today';
    ui.tab=id;saveUi();
    document.querySelectorAll('[data-app-section]').forEach(el=>el.classList.toggle('app-section-hidden',el.dataset.appSection!==id));
    document.querySelectorAll('[data-simple-tab]').forEach(b=>b.classList.toggle('active',b.dataset.simpleTab===id));
    window.scrollTo(0,0);
  }

  function renderExercises(){
    const root=document.querySelector('#simpleExerciseList');
    if(!root)return;
    root.innerHTML=exercises.map(e=>{
      const t=targets[e.id],open=ui.openExercise===e.id;
      const weight=e.weight?(t.weight===''?'未設定':esc(t.weight)+' kg'):'自重';
      return '<article class="simple-exercise '+(open?'open':'')+'" data-exercise-id="'+e.id+'">'+
        '<button type="button" class="simple-exercise-summary">'+
          '<div class="exercise-title-line">'+badge(e)+'<div><strong>'+esc(e.name)+'</strong><small>'+esc(e.desc)+'</small></div></div>'+
          '<div class="exercise-values"><span>'+weight+'</span><span>'+esc(t.reps)+'</span><span>'+t.sets+' set</span></div>'+
        '</button>'+
        (open?'<div class="simple-editor">'+
          (e.weight?field('重量','weight',t.weight,'number','kg'):'<div class="simple-static"><span>負荷</span><strong>自重</strong></div>')+
          field(e.id==='dead_hang'?'時間':'レップ','reps',t.reps,'text','')+
          field('セット','sets',t.sets,'number','')+
        '</div>':'')+
      '</article>';
    }).join('');

    root.querySelectorAll('.simple-exercise-summary').forEach(btn=>btn.onclick=()=>{
      const id=btn.closest('.simple-exercise').dataset.exerciseId;
      ui.openExercise=ui.openExercise===id?null:id;saveUi();renderExercises();
    });
    root.querySelectorAll('.simple-editor input').forEach(inp=>inp.oninput=()=>{
      const box=inp.closest('.simple-exercise'),id=box.dataset.exerciseId;
      if(inp.dataset.field==='sets')targets[id].sets=Math.max(1,Number(inp.value||1));
      else targets[id][inp.dataset.field]=inp.value;
      saveTargets();
      const t=targets[id];
      const vals=box.querySelectorAll('.exercise-values span');
      const def=exercises.find(x=>x.id===id);
      if(vals[0])vals[0].textContent=def.weight?(t.weight===''?'未設定':t.weight+' kg'):'自重';
      if(vals[1])vals[1].textContent=t.reps;
      if(vals[2])vals[2].textContent=t.sets+' set';
    });
  }
  function field(label,key,value,type,suffix){
    return '<label class="simple-field"><span>'+label+'</span><div><input data-field="'+key+'" type="'+type+'" '+(type==='number'?'min="0" step="'+(key==='sets'?'1':'0.5')+'"':'')+' value="'+esc(value)+'">'+(suffix?'<em>'+suffix+'</em>':'')+'</div></label>';
  }

  function wrapWorkout(){
    const original=window.openWorkout;
    if(typeof original!=='function'||original.__trainingUiV2)return;
    const wrapped=function(key){
      original(key);
      document.querySelectorAll('#exerciseList .exercise').forEach(el=>{
        const name=el.dataset.name;
        const def=exercises.find(x=>x.name===name||(x.id==='seated_leg_press'&&name==='レッグプレス'));
        if(!def)return;
        const title=el.querySelector('.exercise-main h3');
        if(title&&!el.querySelector('.muscle-badge')){
          title.insertAdjacentHTML('beforebegin',badge(def));
        }
      });
    };
    wrapped.__trainingUiV2=true;
    window.openWorkout=wrapped;
    const start=document.querySelector('#startTodayBtn');
    if(start)start.onclick=e=>wrapped(e.currentTarget.dataset.key);
  }

  const style=document.createElement('style');
  style.textContent=`
    .ui-redundant{display:none!important}
    .app-section-hidden{display:none!important}
    .simple-tabs{position:sticky;top:0;z-index:80;max-width:1180px;margin:0 auto;padding:8px 20px;display:flex;gap:8px;overflow-x:auto;background:var(--bg)}
    .simple-tabs button{flex:0 0 auto;border:1px solid var(--line);background:var(--surface);color:var(--muted);padding:9px 14px;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}
    .simple-tabs button.active{background:var(--accent);color:#07110c;border-color:var(--accent)}
    .simple-head{margin-bottom:6px}.simple-exercise-list{display:grid;gap:8px;margin-top:14px}
    .simple-exercise{border:1px solid var(--line);background:var(--surface2);border-radius:14px;overflow:hidden}.simple-exercise.open{border-color:var(--accent)}
    .simple-exercise-summary{width:100%;border:0;background:transparent;color:var(--text);padding:13px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;text-align:left;cursor:pointer}
    .exercise-title-line{display:flex;gap:10px;align-items:center;min-width:0}.exercise-title-line strong{display:block}.exercise-title-line small{display:block;color:var(--muted);margin-top:2px}
    .muscle-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;border:1px solid var(--line);background:var(--surface3);border-radius:999px;padding:4px 7px;color:var(--accent);font-size:.68rem;font-weight:900}
    .muscle-badge svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.muscle-badge .muscle-mark{fill:currentColor;stroke:none}
    .exercise-values{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.exercise-values span{border:1px solid var(--line);border-radius:999px;padding:5px 8px;color:var(--muted);font-size:.72rem}
    .simple-editor{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:0 13px 13px}.simple-field,.simple-static{display:grid;gap:5px;color:var(--muted);font-size:.72rem}.simple-field>div{display:flex;align-items:center;gap:6px}.simple-field input{width:100%;font-weight:800}.simple-field em{font-style:normal}.simple-static strong{color:var(--text);font-size:1rem}
    .hero-actions{max-width:260px}.hero-actions #startTodayBtn{width:100%}
    @media(max-width:700px){.simple-tabs{padding-inline:12px}.simple-exercise-summary{grid-template-columns:1fr}.exercise-values{justify-content:flex-start}.simple-editor{grid-template-columns:1fr 1fr}.simple-editor>*:last-child{grid-column:1/-1}}
  `;
  document.head.appendChild(style);

  setupSections();
  wrapWorkout();
})();