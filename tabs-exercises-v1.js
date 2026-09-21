// Training Quest UI v1: tabs + focused exercise targets.
(() => {
  if (typeof state === 'undefined') return;

  const TARGET_KEY = 'trainingQuest.exerciseTargets.v1';
  const UI_KEY = 'trainingQuest.exerciseUi.v1';

  const exerciseDefs = [
    {id:'seated_leg_press', name:'シーテッド・レッグプレス', desc:'座ってプレートを押し、椅子側が動くタイプ。', muscle:'legs', muscleLabel:'脚', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'leg_extension', name:'レッグエクステンション', desc:'太ももの前側。膝を伸ばすマシン。', muscle:'legs', muscleLabel:'太もも', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'ab_crunch', name:'アブドミナルクランチ', desc:'座ってかがみながら肘側のパッドを押す腹筋マシン。', muscle:'core', muscleLabel:'腹', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'rotary_torso', name:'ロータリートルソー', desc:'膝を台に乗せて上半身を固定し、下半身を左右へ動かすタイプ。', muscle:'obliques', muscleLabel:'脇腹', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'lat_pulldown', name:'ラットプルダウン', desc:'頭上のバーを胸方向へ引く。', muscle:'back', muscleLabel:'背中', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'dead_hang', name:'デッドハング', desc:'バーにぶら下がって保持。回数ではなく時間で管理。', muscle:'grip', muscleLabel:'握力', weight:false, metric:'seconds', defaultReps:'20–40秒'},
    {id:'pec_fly', name:'ペックフライ', desc:'腕を開いた位置から前へ閉じる胸のマシン。', muscle:'chest', muscleLabel:'胸', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'chest_press', name:'チェストプレス', desc:'座って前へ押す胸のマシン。', muscle:'chest', muscleLabel:'胸', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'shoulder_press', name:'ショルダープレス', desc:'座って頭上へ押す肩のマシン。', muscle:'shoulders', muscleLabel:'肩', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'chest_supported_row', name:'チェストサポート・ロー（仮）', desc:'体が斜め・顔は下向きで、左右のバーを後ろへ引くマシン。正式名称が分かるまで仮名。', muscle:'back', muscleLabel:'背中', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'high_row_machine', name:'ハイロー / プルダウン系（仮）', desc:'座って頭上の左右バーを下へ引く。ウェイトスタックは身体の後ろ側。正式名称が分かるまで仮名。', muscle:'back', muscleLabel:'背中', weight:true, metric:'reps', defaultReps:'8–12'}
  ];

  function readJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch { return fallback; }
  }
  const targets = readJSON(TARGET_KEY, {});
  const uiState = readJSON(UI_KEY, {activeTab:'today', focusIndex:0});

  function ensureTarget(def){
    const old = targets[def.id] || {};
    targets[def.id] = {
      weight: old.weight ?? '',
      reps: old.reps || def.defaultReps,
      sets: Math.max(1, Number(old.sets || 3))
    };
  }
  exerciseDefs.forEach(ensureTarget);

  function saveTargets(){ localStorage.setItem(TARGET_KEY, JSON.stringify(targets)); }
  function saveUi(){ localStorage.setItem(UI_KEY, JSON.stringify(uiState)); }
  saveTargets();

  function tabButton(id, label){
    return '<button type="button" class="app-tab-btn" data-tab="' + id + '">' + label + '</button>';
  }

  function buildTabs(){
    if (document.querySelector('#appTabs')) return;

    const header = document.querySelector('.topbar');
    const shell = document.querySelector('.shell');
    if (!header || !shell) return;

    const nav = document.createElement('nav');
    nav.id = 'appTabs';
    nav.className = 'app-tabs';
    nav.innerHTML =
      tabButton('today','今日') +
      tabButton('exercises','種目') +
      tabButton('program','プログラム') +
      tabButton('progress','進捗') +
      tabButton('level','レベル') +
      tabButton('history','履歴');
    header.insertAdjacentElement('afterend', nav);

    const sections = {
      today: document.createElement('div'),
      exercises: document.createElement('div'),
      program: document.createElement('div'),
      progress: document.createElement('div'),
      level: document.createElement('div'),
      history: document.createElement('div')
    };
    Object.entries(sections).forEach(([id,el]) => {
      el.className = 'tab-panel';
      el.dataset.tabPanel = id;
      shell.appendChild(el);
    });

    const hero = shell.querySelector('.hero');
    const stats = shell.querySelector('.stats-grid');
    const summary = shell.querySelector('.level-summary-card');
    const plan = shell.querySelector('#planGrid')?.closest('.card');
    const levelMap = shell.querySelector('#levelGrid')?.closest('.card');
    const progress = shell.querySelector('#progressChart')?.closest('.card');
    const history = shell.querySelector('#history')?.closest('.card');

    [hero,stats].filter(Boolean).forEach(x=>sections.today.appendChild(x));
    [summary,plan].filter(Boolean).forEach(x=>sections.program.appendChild(x));
    if (progress) sections.progress.appendChild(progress);
    if (levelMap) sections.level.appendChild(levelMap);
    if (history) sections.history.appendChild(history);

    const exerciseCard = document.createElement('section');
    exerciseCard.className = 'card focus-exercise-card';
    exerciseCard.innerHTML = '<div class="section-head"><div><p class="eyebrow">CURRENT EXERCISES</p><h2>今やっている種目</h2></div><span class="pill">重量・レップ・セットを保存</span></div><p class="muted">種目を選ぶと上の入力欄にフォーカスします。設定は自動保存され、次回も残ります。</p><div id="focusedExercise"></div><div id="exerciseTargetList" class="exercise-target-list"></div>';
    sections.exercises.appendChild(exerciseCard);

    nav.querySelectorAll('.app-tab-btn').forEach(btn=>btn.onclick=()=>activateTab(btn.dataset.tab));
    renderExerciseTargets();
    activateTab(uiState.activeTab || 'today');
  }

  function activateTab(id){
    const valid = ['today','exercises','program','progress','level','history'];
    if (!valid.includes(id)) id='today';
    uiState.activeTab=id; saveUi();
    document.querySelectorAll('[data-tab-panel]').forEach(p=>p.hidden=p.dataset.tabPanel!==id);
    document.querySelectorAll('.app-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
    window.scrollTo({top:0,behavior:'instant'});
  }

  function muscleIconSvg(type){
    const common='viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    const icons={
      chest:'<svg '+common+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8.2 8.5c1.4-1 2.6-1 3.8.1 1.2-1.1 2.4-1.1 3.8-.1v3c-1.5.8-2.7.8-3.8-.1-1.1.9-2.3.9-3.8.1v-3Z"/></svg>',
      back:'<svg '+common+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8 7.5 11 10v5l-3.2-2.2L8 7.5Zm8 0-3 2.5v5l3.2-2.2L16 7.5Z"/></svg>',
      shoulders:'<svg '+common+'><path d="M8 4 5 7l1.3 11h11.4L19 7l-3-3-4 2-4-2Z"/><circle class="muscle-mark" cx="6.8" cy="7.2" r="2.2"/><circle class="muscle-mark" cx="17.2" cy="7.2" r="2.2"/></svg>',
      core:'<svg '+common+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="M9.2 8.2h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1zm-3.5 3.4h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1z"/></svg>',
      obliques:'<svg '+common+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="m8.4 8 2 2.3-1.8 5H7.2L7 10zm7.2 0-2 2.3 1.8 5h1.4L17 10z"/></svg>',
      legs:'<svg '+common+'><path d="M9 3h6l.7 7-1.2 11h-3l.5-8-.5 8h-3L7.8 10 9 3Z"/><path class="muscle-mark" d="M8.7 7.2h2.7l.1 5.8H9.1zm3.9 0h2.7l-.4 5.8h-2.4z"/></svg>',
      grip:'<svg '+common+'><path d="M4 7h16v2H4z"/><path d="M7 9v5.5c0 2 1.4 3.5 3.2 3.5H12v-7H9.8v-2Zm10 0v5.5c0 2-1.4 3.5-3.2 3.5H12v-7h2.2v-2Z"/><path class="muscle-mark" d="M7 10h4v3H7zm6 0h4v3h-4z"/></svg>'
    };
    return icons[type] || icons.core;
  }
  function muscleBadge(def){
    return '<span class="muscle-badge muscle-'+escAttr(def.muscle||'core')+'" title="メイン: '+escAttr(def.muscleLabel||'')+'">'+muscleIconSvg(def.muscle)+'<span>'+escHtml(def.muscleLabel||'')+'</span></span>';
  }

  function weightText(def, t){
    if (!def.weight) return '自重';
    return t.weight === '' ? '未設定 kg' : t.weight + ' kg';
  }

  function renderExerciseTargets(){
    const focus = document.querySelector('#focusedExercise');
    const list = document.querySelector('#exerciseTargetList');
    if (!focus || !list) return;

    uiState.focusIndex = Math.max(0, Math.min(exerciseDefs.length-1, Number(uiState.focusIndex || 0)));
    const def = exerciseDefs[uiState.focusIndex];
    const t = targets[def.id];

    focus.innerHTML = '<article class="focused-exercise">' +
      '<div class="focus-top"><div><p class="eyebrow">FOCUS ' + (uiState.focusIndex+1) + ' / ' + exerciseDefs.length + '</p><div class="exercise-name-with-muscle">' + muscleBadge(def) + '<h3>' + escHtml(def.name) + '</h3></div><p class="muted">' + escHtml(def.desc) + '</p></div>' +
      '<div class="focus-nav"><button type="button" class="secondary" id="prevExerciseBtn">←</button><button type="button" class="primary" id="nextExerciseBtn">次へ →</button></div></div>' +
      '<div class="target-input-grid">' +
        (def.weight ? targetNumberField('重量','focusWeight',t.weight,'kg','0.5') : '<div class="target-static"><span>負荷</span><strong>自重</strong></div>') +
        targetTextField(def.metric==='seconds'?'時間':'レップ','focusReps',t.reps,def.metric==='seconds'?'例 20–40秒':'例 8–12') +
        targetNumberField('セット','focusSets',t.sets,'set','1') +
      '</div>' +
      (def.weight ? '<div class="quick-step-row"><button type="button" data-weight-step="-5">−5kg</button><button type="button" data-weight-step="-2.5">−2.5kg</button><button type="button" data-weight-step="2.5">+2.5kg</button><button type="button" data-weight-step="5">+5kg</button></div>' : '') +
      '<div class="quick-step-row"><button type="button" data-set-step="-1">−1 set</button><button type="button" data-set-step="1">+1 set</button><button type="button" id="resetTargetBtn">8–12 × 3 に戻す</button></div>' +
    '</article>';

    const weightInput = focus.querySelector('#focusWeight');
    const repsInput = focus.querySelector('#focusReps');
    const setsInput = focus.querySelector('#focusSets');
    if (weightInput) weightInput.oninput=e=>{ targets[def.id].weight=e.target.value; saveTargets(); renderListOnly(); };
    if (repsInput) repsInput.oninput=e=>{ targets[def.id].reps=e.target.value; saveTargets(); renderListOnly(); };
    if (setsInput) setsInput.oninput=e=>{ targets[def.id].sets=Math.max(1,Number(e.target.value||1)); saveTargets(); renderListOnly(); };

    focus.querySelector('#prevExerciseBtn').onclick=()=>moveFocus(-1);
    focus.querySelector('#nextExerciseBtn').onclick=()=>moveFocus(1);
    focus.querySelectorAll('[data-weight-step]').forEach(btn=>btn.onclick=()=>{
      const cur=Number(targets[def.id].weight||0);
      targets[def.id].weight=Math.max(0,Math.round((cur+Number(btn.dataset.weightStep))*2)/2);
      saveTargets(); renderExerciseTargets();
    });
    focus.querySelectorAll('[data-set-step]').forEach(btn=>btn.onclick=()=>{
      targets[def.id].sets=Math.max(1,Number(targets[def.id].sets||3)+Number(btn.dataset.setStep));
      saveTargets(); renderExerciseTargets();
    });
    focus.querySelector('#resetTargetBtn').onclick=()=>{
      targets[def.id].reps=def.defaultReps;
      targets[def.id].sets=3;
      saveTargets(); renderExerciseTargets();
    };
    renderListOnly();
  }

  function renderListOnly(){
    const list=document.querySelector('#exerciseTargetList');
    if(!list)return;
    list.innerHTML=exerciseDefs.map((def,i)=>{
      const t=targets[def.id];
      return '<button type="button" class="exercise-target-row ' + (i===uiState.focusIndex?'active':'') + '" data-focus-index="' + i + '">' +
        '<div><div class="exercise-name-with-muscle compact">' + muscleBadge(def) + '<strong>' + escHtml(def.name) + '</strong></div><small>' + escHtml(def.desc) + '</small></div>' +
        '<div class="target-summary"><span>' + weightText(def,t) + '</span><span>' + escHtml(t.reps) + '</span><span>' + t.sets + ' sets</span></div>' +
      '</button>';
    }).join('');
    list.querySelectorAll('[data-focus-index]').forEach(btn=>btn.onclick=()=>{
      uiState.focusIndex=Number(btn.dataset.focusIndex);saveUi();renderExerciseTargets();
      document.querySelector('#focusedExercise')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function moveFocus(delta){
    uiState.focusIndex=(uiState.focusIndex+delta+exerciseDefs.length)%exerciseDefs.length;
    saveUi();renderExerciseTargets();
  }

  function targetNumberField(label,id,value,unit,step){
    return '<label class="target-field"><span>' + label + '</span><div><input id="' + id + '" type="number" min="0" step="' + step + '" value="' + escAttr(value) + '" inputmode="decimal"><em>' + unit + '</em></div></label>';
  }
  function targetTextField(label,id,value,placeholder){
    return '<label class="target-field"><span>' + label + '</span><div><input id="' + id + '" type="text" value="' + escAttr(value) + '" placeholder="' + escAttr(placeholder) + '"></div></label>';
  }
  function escHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escAttr(s){return escHtml(s);}

  function augmentWorkoutPanel(){
    const originalOpen = window.openWorkout;
    if (typeof originalOpen !== 'function' || originalOpen.__targetsWrapped) return;

    const wrapped = function(key){
      originalOpen(key);
      document.querySelectorAll('#exerciseList .exercise').forEach(el=>{
        const name=el.dataset.name;
        const def=exerciseDefs.find(x=>x.name===name || (x.id==='seated_leg_press' && name==='レッグプレス'));
        if(!def)return;
        const t=targets[def.id];
        const title=el.querySelector('.exercise-main h3');
        if(title && !el.querySelector('.workout-muscle-badge')){
          const wrap=document.createElement('div');
          wrap.className='exercise-name-with-muscle compact workout-muscle-badge';
          wrap.innerHTML=muscleBadge(def);
          title.parentNode.insertBefore(wrap,title);
          wrap.appendChild(title);
        }
        const meta=el.querySelector('.exercise-meta');
        if(meta){
          meta.insertAdjacentHTML('beforeend','<span class="saved-target">保存設定: ' + weightText(def,t) + ' · ' + escHtml(t.reps) + ' · ' + t.sets + ' sets</span>');
        }
      });
    };
    wrapped.__targetsWrapped=true;
    window.openWorkout=wrapped;

    const start=document.querySelector('#startTodayBtn');
    if(start)start.onclick=e=>window.openWorkout(e.currentTarget.dataset.key);
    document.querySelectorAll('.plan-card').forEach(x=>x.onclick=()=>window.openWorkout(x.dataset.key));
  }

  const style=document.createElement('style');
  style.textContent=`
    .exercise-name-with-muscle{display:flex;align-items:center;gap:10px;min-width:0}.exercise-name-with-muscle h3,.exercise-name-with-muscle strong{margin:0}.exercise-name-with-muscle.compact{gap:8px}.muscle-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;border:1px solid var(--line);background:var(--surface3);border-radius:999px;padding:4px 7px;color:var(--accent);font-size:.68rem;font-weight:900}.muscle-badge svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.muscle-badge svg .muscle-mark{fill:currentColor;stroke:none;opacity:.95}.workout-muscle-badge{margin-bottom:2px}
    .app-tabs{position:sticky;top:0;z-index:50;max-width:1180px;margin:0 auto 6px;padding:8px 20px;display:flex;gap:8px;overflow-x:auto;background:linear-gradient(var(--bg) 75%,transparent)}
    .app-tab-btn{flex:0 0 auto;border:1px solid var(--line);background:var(--surface);color:var(--muted);padding:9px 14px;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}
    .app-tab-btn.active{background:var(--accent);color:#07110c;border-color:var(--accent)}
    .tab-panel{display:grid;gap:18px}
    .focused-exercise{border:1px solid var(--accent);background:var(--surface2);border-radius:18px;padding:18px}
    .focus-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.focus-top h3{font-size:1.35rem;margin:3px 0}.focus-nav{display:flex;gap:8px}
    .target-input-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
    .target-field,.target-static{display:grid;gap:5px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:11px;color:var(--muted);font-size:.75rem}
    .target-field>div{display:flex;align-items:center;gap:7px}.target-field input{width:100%;font-size:1.05rem;font-weight:850;color:var(--text)}.target-field em{font-style:normal;color:var(--muted)}
    .target-static strong{font-size:1.05rem;color:var(--text)}
    .quick-step-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.quick-step-row button{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 11px;font:inherit;cursor:pointer}
    .exercise-target-list{display:grid;gap:8px;margin-top:14px}.exercise-target-row{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;text-align:left;border:1px solid var(--line);background:var(--surface2);color:var(--text);border-radius:13px;padding:12px;cursor:pointer}.exercise-target-row.active{outline:2px solid var(--accent)}.exercise-target-row strong{display:block}.exercise-target-row small{display:block;color:var(--muted);margin-top:2px}.target-summary{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.target-summary span{background:var(--surface3);border:1px solid var(--line);border-radius:999px;padding:5px 8px;color:var(--muted);font-size:.72rem}.saved-target{margin-top:5px;color:var(--accent)!important;font-weight:800;white-space:normal}
    @media(max-width:700px){.app-tabs{padding-inline:12px}.target-input-grid{grid-template-columns:1fr 1fr}.target-input-grid>*:last-child{grid-column:1/-1}.focus-top{flex-direction:column}.focus-nav{width:100%}.focus-nav button{flex:1}.exercise-target-row{grid-template-columns:1fr}.target-summary{justify-content:flex-start}}
  `;
  document.head.appendChild(style);

  buildTabs();
  augmentWorkoutPanel();
})();