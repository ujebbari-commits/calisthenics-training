// Training Quest UI v1: tabs + focused exercise targets.
(() => {
  if (typeof state === 'undefined') return;

  const TARGET_KEY = 'trainingQuest.exerciseTargets.v1';
  const UI_KEY = 'trainingQuest.exerciseUi.v1';

  const exerciseDefs = [
    {id:'seated_leg_press', name:'シーテッド・レッグプレス', desc:'座ってプレートを押し、椅子側が動くタイプ。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'leg_extension', name:'レッグエクステンション', desc:'太ももの前側。膝を伸ばすマシン。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'ab_crunch', name:'アブドミナルクランチ', desc:'座ってかがみながら肘側のパッドを押す腹筋マシン。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'rotary_torso', name:'ロータリートルソー', desc:'膝を台に乗せて上半身を固定し、下半身を左右へ動かすタイプ。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'lat_pulldown', name:'ラットプルダウン', desc:'頭上のバーを胸方向へ引く。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'dead_hang', name:'デッドハング', desc:'バーにぶら下がって保持。回数ではなく時間で管理。', weight:false, metric:'seconds', defaultReps:'20–40秒'},
    {id:'pec_fly', name:'ペックフライ', desc:'腕を開いた位置から前へ閉じる胸のマシン。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'chest_press', name:'チェストプレス', desc:'座って前へ押す胸のマシン。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'shoulder_press', name:'ショルダープレス', desc:'座って頭上へ押す肩のマシン。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'chest_supported_row', name:'チェストサポート・ロー（仮）', desc:'体が斜め・顔は下向きで、左右のバーを後ろへ引くマシン。正式名称が分かるまで仮名。', weight:true, metric:'reps', defaultReps:'8–12'},
    {id:'high_row_machine', name:'ハイロー / プルダウン系（仮）', desc:'座って頭上の左右バーを下へ引く。ウェイトスタックは身体の後ろ側。正式名称が分かるまで仮名。', weight:true, metric:'reps', defaultReps:'8–12'}
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
      '<div class="focus-top"><div><p class="eyebrow">FOCUS ' + (uiState.focusIndex+1) + ' / ' + exerciseDefs.length + '</p><h3>' + escHtml(def.name) + '</h3><p class="muted">' + escHtml(def.desc) + '</p></div>' +
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
        '<div><strong>' + escHtml(def.name) + '</strong><small>' + escHtml(def.desc) + '</small></div>' +
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