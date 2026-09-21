// Training UI v2: simple tabs + compact exercise editor.
(() => {
  if (typeof state === 'undefined') return;

  const TARGET_KEY='training.exerciseTargets.v2';
  const UI_KEY='training.ui.v2';
  const EXERCISE_HISTORY_KEY='training.exerciseHistory.v1';
  const WEIGHT_GOAL_KEY='training.weightGoals.v1';
  const WEIGHT_ACHIEVEMENT_KEY='training.weightAchievements.v1';

  const exercises=[
    {id:'seated_leg_press',goalKg:120,name:'シーテッド・レッグプレス',desc:'座ってプレートを押し、椅子側が動くタイプ。市ヶ谷店マシンエリア。',muscle:'legs',label:'脚',weight:true,reps:'12'},
    {id:'linear_leg_press',goalKg:160,name:'リニアレッグプレス',desc:'プレートロード式のレッグプレス。市ヶ谷店フリーウェイトエリア。',muscle:'legs',label:'脚',weight:true,reps:'12'},
    {id:'leg_extension',goalKg:60,name:'レッグ・エクステンション',desc:'膝を伸ばして太ももの前側を鍛える。',muscle:'legs',label:'太もも',weight:true,reps:'12'},
    {id:'seated_leg_curl',goalKg:50,name:'シーテッド・レッグ・カール',desc:'座って膝を曲げ、太ももの裏側を鍛える。',muscle:'legs',label:'ハム',weight:true,reps:'12'},
    {id:'hip_abductor',goalKg:70,name:'ヒップアブダクター',desc:'脚を外側へ開いてお尻の横側を鍛える。',muscle:'legs',label:'臀部',weight:true,reps:'12'},
    {id:'hip_adductor',goalKg:70,name:'ヒップアダクター',desc:'脚を内側へ閉じて内ももを鍛える。',muscle:'legs',label:'内もも',weight:true,reps:'12'},
    {id:'ab_crunch',goalKg:55,name:'アブドミナル',desc:'座って上体を丸め、腹筋を鍛えるマシン。',muscle:'core',label:'腹',weight:true,reps:'12'},
    {id:'rotary_torso',goalKg:45,name:'トーソ・ローテーション',desc:'体幹を固定しながら左右へ回旋して脇腹を鍛える。',muscle:'obliques',label:'脇腹',weight:true,reps:'12'},
    {id:'lat_pulldown',goalKg:60,name:'ラットプルダウン',desc:'頭上のバーを胸方向へ引いて背中を鍛える。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'dead_hang',name:'デッドハング',desc:'バーにぶら下がって保持。',muscle:'grip',label:'握力',weight:false,reps:'20–40秒'},
    {id:'pec_fly',goalKg:50,name:'ペクトラル・フライ',desc:'腕を開いた位置から前へ閉じて胸を鍛える。',muscle:'chest',label:'胸',weight:true,reps:'12'},
    {id:'rear_delt',goalKg:40,name:'リア・デルトイド',desc:'腕を後方へ開いて肩の後ろ側を鍛える。同じ複合マシンの逆向き動作。',muscle:'shoulders',label:'肩後部',weight:true,reps:'12'},
    {id:'chest_press',goalKg:60,name:'チェスト・プレス',desc:'座って前へ押して胸を鍛える。',muscle:'chest',label:'胸',weight:true,reps:'12'},
    {id:'shoulder_press',goalKg:40,name:'ショルダー・プレス',desc:'座って頭上へ押して肩を鍛える。',muscle:'shoulders',label:'肩',weight:true,reps:'12'},
    {id:'seated_row',goalKg:60,name:'シーテッド・ロー',desc:'座ってハンドルを身体へ引き、背中を鍛える。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'chest_supported_row',goalKg:70,name:'アイソラテラル・ロー',desc:'左右独立のレバーを後方へ引くロー。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'high_row_machine',goalKg:70,name:'アイソラテラル・ハイロー',desc:'左右独立の頭上レバーを下方向へ引くハイロー。',muscle:'back',label:'背中',weight:true,reps:'12'},
    {id:'lateral_raise',goalKg:30,name:'ラテラルレイズ',desc:'腕を横へ上げて肩の横側を鍛えるマシン。',muscle:'shoulders',label:'肩',weight:true,reps:'12'},
    {id:'assisted_dip',name:'アシスト・ディップ',desc:'補助付きディップ。胸・三頭筋を鍛える。補助重量は大きいほど軽くなる。',muscle:'chest',label:'胸・三頭',weight:true,weightLabel:'補助重量',goalDirection:'down',reps:'12'},
    {id:'assisted_chin',name:'アシスト・チンニング',desc:'補助付き懸垂。背中・二頭筋を鍛える。補助重量は大きいほど軽くなる。',muscle:'back',label:'背中・二頭',weight:true,weightLabel:'補助重量',goalDirection:'down',reps:'12'},
    {id:'biceps_machine',goalKg:30,name:'バイセップス',desc:'肘を曲げて上腕二頭筋を鍛えるマシン。',muscle:'arms',label:'二頭',weight:true,reps:'12'},
    {id:'triceps_machine',goalKg:40,name:'トライセップス',desc:'肘を伸ばして上腕三頭筋を鍛えるマシン。',muscle:'arms',label:'三頭',weight:true,reps:'12'},
    {id:'treadmill',name:'トレッドミル',desc:'ランニング／ウォーキング用。有酸素マシン。市ヶ谷店は8台。',muscle:'cardio',label:'有酸素',weight:false,loadLabel:'—',metricLabel:'時間',unit:'分',reps:'10',defaultSets:1},
    {id:'cross_trainer',name:'クロストレーナー',desc:'腕と脚を連動させる低衝撃の有酸素マシン。市ヶ谷店は2台。',muscle:'cardio',label:'有酸素',weight:false,loadLabel:'—',metricLabel:'時間',unit:'分',reps:'10',defaultSets:1},
    {id:'recumbent_bike',name:'リカンベントバイク',desc:'背もたれ付きの座位バイク。市ヶ谷店は2台。',muscle:'cardio',label:'有酸素',weight:false,loadLabel:'—',metricLabel:'時間',unit:'分',reps:'10',defaultSets:1},
    {id:'upright_bike',name:'アップライトバイク',desc:'一般的な直立姿勢のエアロバイク。市ヶ谷店は2台。',muscle:'cardio',label:'有酸素',weight:false,loadLabel:'—',metricLabel:'時間',unit:'分',reps:'10',defaultSets:1},
    {id:'back_extension',name:'バックエクステンション',desc:'背面を伸展して脊柱起立筋を中心に鍛える。市ヶ谷店フリーウェイトエリア。',muscle:'back',label:'腰背部',weight:false,reps:'12'}
  ];

  const catalogPrograms={
    4:[
      {key:'A',code:'UPPER A',title:'Upper A · 胸 / 背中 / 肩 / 腕',desc:'上半身の基本種目をまとめる日。',items:[
        ['chest_press','main'],['lat_pulldown','main'],['shoulder_press','secondary'],['seated_row','secondary'],['lateral_raise','accessory'],['biceps_machine','accessory'],['triceps_machine','accessory']
      ]},
      {key:'B',code:'LOWER A',title:'Lower A · 脚 / 腹',desc:'脚の前後と体幹を鍛える日。',items:[
        ['seated_leg_press','main'],['seated_leg_curl','main'],['leg_extension','secondary'],['hip_abductor','accessory'],['ab_crunch','core'],['rotary_torso','core']
      ]},
      {key:'C',code:'UPPER B',title:'Upper B · 胸 / 背中 / 肩 / 腕',desc:'上半身を別のマシンでもう一度刺激する日。',items:[
        ['pec_fly','main'],['chest_supported_row','main'],['high_row_machine','secondary'],['rear_delt','accessory'],['chest_press','secondary'],['lat_pulldown','secondary']
      ]},
      {key:'D',code:'LOWER B',title:'Lower B · 脚 / 臀部 / 腹',desc:'下半身を別パターンでもう一度鍛える日。',items:[
        ['linear_leg_press','main'],['seated_leg_curl','main'],['leg_extension','secondary'],['hip_adductor','accessory'],['back_extension','accessory'],['ab_crunch','core']
      ]}
    ],
    5:[
      {key:'A',code:'PUSH',title:'Push · 胸 / 肩 / 三頭',desc:'押す筋肉を集中して鍛える日。',items:[
        ['chest_press','main'],['shoulder_press','main'],['pec_fly','secondary'],['lateral_raise','accessory'],['triceps_machine','accessory']
      ]},
      {key:'B',code:'PULL',title:'Pull · 背中 / 二頭 / 握力',desc:'引く筋肉と懸垂の土台を鍛える日。',items:[
        ['lat_pulldown','main'],['seated_row','main'],['high_row_machine','secondary'],['rear_delt','accessory'],['biceps_machine','accessory'],['dead_hang','accessory']
      ]},
      {key:'C',code:'LEGS + ABS',title:'Legs · 脚 / 臀部 / 腹',desc:'下半身全体と腹筋を鍛える日。',items:[
        ['seated_leg_press','main'],['seated_leg_curl','main'],['leg_extension','secondary'],['hip_abductor','accessory'],['hip_adductor','accessory'],['ab_crunch','core']
      ]},
      {key:'D',code:'UPPER',title:'Upper · 上半身総合',desc:'上半身を2回目の刺激で伸ばす日。',items:[
        ['pec_fly','main'],['chest_supported_row','main'],['lat_pulldown','secondary'],['shoulder_press','secondary'],['lateral_raise','accessory'],['triceps_machine','accessory']
      ]},
      {key:'E',code:'LOWER + ABS',title:'Lower · 脚 / 臀部 / 腹',desc:'下半身を別パターンでもう一度刺激する日。',items:[
        ['linear_leg_press','main'],['seated_leg_curl','main'],['leg_extension','secondary'],['hip_adductor','accessory'],['back_extension','accessory'],['rotary_torso','core'],['ab_crunch','core']
      ]}
    ]
  };

  function exerciseById(id){return exercises.find(e=>e.id===id)}
  function activeCatalogProgram(){return catalogPrograms[Number(state.programMode)===4?4:5]}
  const exercisePartFilters=[
    ['all','すべて'],
    ['chest','胸'],
    ['back','背中'],
    ['shoulders','肩'],
    ['arms','腕'],
    ['core','腹'],
    ['legs','脚'],
    ['grip','握力'],
    ['cardio','有酸素']
  ];
  function matchesExercisePart(e,part){
    if(!part||part==='all')return true;
    if(part==='core')return e.muscle==='core'||e.muscle==='obliques';
    return e.muscle===part;
  }

  function applyCatalogTemplates(){
    if(typeof templates==='undefined')return;
    const defs=activeCatalogProgram();
    for(const day of defs){
      templates[day.key]={
        code:day.code,
        title:day.title,
        desc:day.desc,
        items:day.items.map(([id,role])=>{
          const e=exerciseById(id);
          return [e?e.name:id,role];
        })
      };
    }
    if(Number(state.programMode)===4 && templates.E) delete templates.E;
  }

  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
  const legacy=read('trainingQuest.exerciseTargets.v1',{});
  const targets=read(TARGET_KEY,{});
  const ui=read(UI_KEY,{tab:'today',openExercise:null,progressExercise:null,exerciseSearch:'',exercisePart:'all',todayMenuKey:null});
  let exerciseHistory=read(EXERCISE_HISTORY_KEY,[]);
  if(!Array.isArray(exerciseHistory)) exerciseHistory=[];
  const weightGoals=read(WEIGHT_GOAL_KEY,{});
  const weightAchievements=read(WEIGHT_ACHIEVEMENT_KEY,{});

  for(const e of exercises){
    const old=targets[e.id]||legacy[e.id]||{};
    const migratedReps=(old.reps==='8–12'||old.reps==='8-12')?e.reps:(old.reps||e.reps); targets[e.id]={weight:old.weight??'',reps:migratedReps,sets:Math.max(1,Number(old.sets||e.defaultSets||3))};
  }
  const saveTargets=()=>localStorage.setItem(TARGET_KEY,JSON.stringify(targets));
  const saveUi=()=>localStorage.setItem(UI_KEY,JSON.stringify(ui));
  const saveExerciseHistory=()=>localStorage.setItem(EXERCISE_HISTORY_KEY,JSON.stringify(exerciseHistory));
  const saveWeightGoals=()=>localStorage.setItem(WEIGHT_GOAL_KEY,JSON.stringify(weightGoals));
  const saveWeightAchievements=()=>localStorage.setItem(WEIGHT_ACHIEVEMENT_KEY,JSON.stringify(weightAchievements));
  saveTargets();

  const automaticRecommendedKey=typeof recommendedKey==='function'?recommendedKey:null;
  recommendedKey=function(){
    const keys=activeCatalogProgram().map(x=>x.key);
    if(ui.todayMenuKey&&keys.includes(ui.todayMenuKey))return ui.todayMenuKey;
    const auto=automaticRecommendedKey?automaticRecommendedKey():keys[0];
    return keys.includes(auto)?auto:keys[0];
  };

  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function googleImageUrl(name){
    return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(String(name||'')+' exercise machine');
  }
  function googleImageName(def){
    return '<span class="google-image-name" role="link" tabindex="0" data-google-image="'+esc(def.name)+'" title="Google画像検索で見る">'+esc(def.name)+'</span>';
  }
  function icon(type){
    const c='viewBox="0 0 24 24" aria-hidden="true"';
    const m={
      chest:'<svg '+c+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8.2 8.5c1.4-1 2.6-1 3.8.1 1.2-1.1 2.4-1.1 3.8-.1v3c-1.5.8-2.7.8-3.8-.1-1.1.9-2.3.9-3.8.1v-3Z"/></svg>',
      back:'<svg '+c+'><path d="M8 3.5 5.5 6.5 6.5 18h11l1-11.5L16 3.5l-4 2-4-2Z"/><path class="muscle-mark" d="M8 7.5 11 10v5l-3.2-2.2L8 7.5Zm8 0-3 2.5v5l3.2-2.2L16 7.5Z"/></svg>',
      shoulders:'<svg '+c+'><path d="M8 4 5 7l1.3 11h11.4L19 7l-3-3-4 2-4-2Z"/><circle class="muscle-mark" cx="6.8" cy="7.2" r="2.2"/><circle class="muscle-mark" cx="17.2" cy="7.2" r="2.2"/></svg>',
      core:'<svg '+c+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="M9.2 8.2h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1zm-3.5 3.4h2.1v2.5H9.2zm3.5 0h2.1v2.5h-2.1z"/></svg>',
      obliques:'<svg '+c+'><path d="M8 3.5 6 7l1 11h10l1-11-2-3.5-4 2-4-2Z"/><path class="muscle-mark" d="m8.4 8 2 2.3-1.8 5H7.2L7 10zm7.2 0-2 2.3 1.8 5h1.4L17 10z"/></svg>',
      legs:'<svg '+c+'><path d="M9 3h6l.7 7-1.2 11h-3l.5-8-.5 8h-3L7.8 10 9 3Z"/><path class="muscle-mark" d="M8.7 7.2h2.7l.1 5.8H9.1zm3.9 0h2.7l-.4 5.8h-2.4z"/></svg>',
      grip:'<svg '+c+'><path d="M4 7h16v2H4z"/><path d="M7 9v5.5c0 2 1.4 3.5 3.2 3.5H12v-7H9.8v-2Zm10 0v5.5c0 2-1.4 3.5-3.2 3.5H12v-7h2.2v-2Z"/><path class="muscle-mark" d="M7 10h4v3H7zm6 0h4v3h-4z"/></svg>',
      arms:'<svg '+c+'><path d="M7 5c1.5 0 2.5 1 2.8 2.4L10.5 10H13l.7-2.6C14 6 15 5 16.5 5H18v4h-1.2l-.6 4.5c-.2 2-1.8 3.5-3.8 3.5h-.8c-2 0-3.6-1.5-3.8-3.5L7.2 9H6V5h1Z"/><path class="muscle-mark" d="M7.5 7.2h2.2l.8 3.3H8zm6.8 0h2.2l-.5 3.3h-2.5z"/></svg>',
      cardio:'<svg '+c+'><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/><path class="muscle-mark" d="m7.5 11 2.2 0 1-2.3 2.1 5 1.1-2.7h2.6v1.8h-1.4l-2.2 4.2-2.2-5.1-.4.9H7.5z"/></svg>'
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
    if(summary)summary.classList.add('legacy-training-level-hidden');
    document.querySelector('#heroLevel')?.classList.add('legacy-training-level-hidden');
    document.querySelector('#heroPhase')?.classList.add('legacy-training-level-hidden');
    document.querySelector('.xp-row')?.classList.add('legacy-training-level-hidden');
    document.querySelector('#levelHint')?.classList.add('legacy-training-level-hidden');
    document.querySelector('#currentLevelStat')?.closest('.stat')?.classList.add('legacy-training-level-hidden');
    document.querySelector('#levelSessionCount')?.closest('.stat')?.classList.add('legacy-training-level-hidden');
    [summary,plan,level].filter(Boolean).forEach(x=>x.dataset.appSection='program');
    if(plan)plan.classList.add('legacy-program-hidden');
    if(level)level.classList.add('legacy-level-map-hidden');
    const catalogProgramCard=document.createElement('section');
    catalogProgramCard.className='card catalog-program-card';
    catalogProgramCard.dataset.appSection='program';
    catalogProgramCard.innerHTML='<div class="section-head"><div><p class="eyebrow">WEEKLY PLAN</p><h2 id="catalogProgramTitle"></h2></div><span class="pill">種目タブと共通</span></div><div id="catalogProgramGrid" class="catalog-program-grid"></div>';
    if(level)level.parentNode.insertBefore(catalogProgramCard,level);else shell.appendChild(catalogProgramCard);

    const weightGoalCard=document.createElement('section');
    weightGoalCard.className='card weight-goals-card';
    weightGoalCard.dataset.appSection='program';
    weightGoalCard.innerHTML='<div class="section-head"><div><p class="eyebrow">WEIGHT LEVELS</p><h2>重量目標 · Lv1〜10</h2></div><span class="pill">正しいフォーム · 12回 × 3セット</span></div><p class="muted weight-goal-intro">Lv10を長期目標として、Lv1=55%から5%刻み。目標重量は自由に調整でき、12回×3セットの保存記録から各種目のLvを自動判定します。</p><div id="weightGoalsGrid" class="weight-goals-grid"></div>';
    if(level)level.parentNode.insertBefore(weightGoalCard,level);else shell.appendChild(weightGoalCard);

    if(progress){progress.dataset.appSection='progress';setupExerciseProgress(progress);}
    if(history)history.dataset.appSection='history';

    const ex=document.createElement('section');
    ex.className='card exercise-manager';
    ex.dataset.appSection='exercises';
    ex.innerHTML='<div class="section-head simple-head"><div><p class="eyebrow">EXERCISES</p><h2>種目</h2></div></div><label class="exercise-search"><span>検索</span><input id="exerciseSearchInput" type="search" placeholder="種目名・部位で検索" value="'+esc(ui.exerciseSearch||'')+'"></label><div id="exercisePartFilters" class="exercise-part-filters">'+exercisePartFilters.map(([id,label])=>'<button type="button" data-exercise-part="'+id+'">'+label+'</button>').join('')+'</div><p id="exerciseSearchCount" class="muted exercise-search-count"></p><div id="simpleExerciseList" class="simple-exercise-list"></div>';
    shell.appendChild(ex);

    const exerciseHistoryCard=document.createElement('section');
    exerciseHistoryCard.className='card exercise-log-history-card';
    exerciseHistoryCard.dataset.appSection='history';
    exerciseHistoryCard.innerHTML='<div class="section-head simple-head"><div><p class="eyebrow">EXERCISE LOG</p><h2>種目記録</h2></div></div><div id="exerciseLogHistory"></div>';
    shell.appendChild(exerciseHistoryCard);

    const nav=document.createElement('nav');
    nav.id='simpleTabs';
    nav.className='simple-tabs';
    nav.innerHTML=[
      ['today','今日'],['exercises','種目'],['program','プログラム'],['progress','進捗'],['history','履歴']
    ].map(([id,label])=>'<button type="button" data-simple-tab="'+id+'">'+label+'</button>').join('');
    header.insertAdjacentElement('afterend',nav);
    nav.addEventListener('click',e=>{const b=e.target.closest('[data-simple-tab]');if(b)showTab(b.dataset.simpleTab)});

    const heroActions=document.querySelector('.hero-actions');
    if(heroActions&&!document.querySelector('#todayMenuSelect')){
      const chooser=document.createElement('label');
      chooser.className='today-menu-chooser';
      chooser.innerHTML='<span>今日やるメニュー</span><select id="todayMenuSelect"></select>';
      heroActions.insertBefore(chooser,heroActions.firstChild);
      chooser.querySelector('select').addEventListener('change',e=>{
        ui.todayMenuKey=e.target.value;
        saveUi();
        if(typeof renderHero==='function')renderHero();
        if(typeof renderPlan==='function')renderPlan();
        renderCatalogProgram();
        renderTodayMenuSelector();
      });
    }

    // Hide redundant controls; functionality remains available through the remaining UI/automatic progression.
    ['recoveryBtn','levelUpBtn','resetLevelBtn','exportBtn'].forEach(id=>{const n=document.getElementById(id);if(n)n.classList.add('ui-redundant')});

    const searchInput=document.querySelector('#exerciseSearchInput');
    if(searchInput)searchInput.addEventListener('input',()=>{ui.exerciseSearch=searchInput.value;saveUi();renderExercises();});
    const partFilters=document.querySelector('#exercisePartFilters');
    if(partFilters)partFilters.addEventListener('click',e=>{
      const btn=e.target.closest('[data-exercise-part]');
      if(!btn)return;
      const selected=btn.dataset.exercisePart;
      ui.exercisePart=(ui.exercisePart===selected&&selected!=='all')?'all':selected;
      saveUi();
      renderExercises();
    });
    applyCatalogTemplates();
    renderTodayMenuSelector();
    renderCatalogProgram();
    renderWeightGoals();
    const modeSelect=document.querySelector('#programModeSelect');
    if(modeSelect)modeSelect.addEventListener('change',()=>setTimeout(()=>{
      applyCatalogTemplates();
      const keys=activeCatalogProgram().map(x=>x.key);
      if(ui.todayMenuKey&&!keys.includes(ui.todayMenuKey))ui.todayMenuKey=null;
      saveUi();
      if(typeof renderAll==='function')renderAll();
      renderTodayMenuSelector();
      renderCatalogProgram();
    },0));
    renderExercises();
    renderExerciseHistory();
    renderExerciseProgress();
    showTab(ui.tab||'today');
  }

  function showTab(id){
    if(!['today','exercises','program','progress','history'].includes(id))id='today';
    ui.tab=id;saveUi();
    document.querySelectorAll('[data-app-section]').forEach(el=>el.classList.toggle('app-section-hidden',el.dataset.appSection!==id));
    document.querySelectorAll('[data-simple-tab]').forEach(b=>b.classList.toggle('active',b.dataset.simpleTab===id));
    if(id==='today')renderTodayMenuSelector();
    if(id==='program'){renderCatalogProgram();renderWeightGoals();}
    window.scrollTo(0,0);
  }

  function renderExercises(){
    const root=document.querySelector('#simpleExerciseList');
    if(!root)return;
    const q=String(ui.exerciseSearch||'').trim().toLocaleLowerCase('ja');
    const part=ui.exercisePart||'all';
    const filtered=exercises.filter(e=>{
      const searchMatch=!q||[e.name,e.label,e.desc,e.muscle].some(v=>String(v||'').toLocaleLowerCase('ja').includes(q));
      return searchMatch&&matchesExercisePart(e,part);
    });
    document.querySelectorAll('[data-exercise-part]').forEach(b=>b.classList.toggle('active',b.dataset.exercisePart===part));
    const count=document.querySelector('#exerciseSearchCount');
    if(count)count.textContent=(q||part!=='all')?filtered.length+' / '+exercises.length+'種目':'全'+exercises.length+'種目';
    root.innerHTML=filtered.map(e=>{
      const t=targets[e.id],open=ui.openExercise===e.id;
      const weight=e.weight?(t.weight===''?'未設定':esc(t.weight)+' kg'):(e.loadLabel||'自重');
      return '<article class="simple-exercise '+(open?'open':'')+'" data-exercise-id="'+e.id+'">'+
        '<button type="button" class="simple-exercise-summary">'+
          '<div class="exercise-title-line">'+badge(e)+'<div><strong>'+googleImageName(e)+'</strong><small>'+esc(e.desc)+'</small></div></div>'+
          '<div class="exercise-values"><span>'+weight+'</span><span>'+esc(t.reps)+'</span><span>'+t.sets+' set</span></div>'+
        '</button>'+
        (open?'<div class="simple-editor">'+
          (e.weight?field(e.weightLabel||'重量','weight',t.weight,'number','kg'):'<div class="simple-static"><span>負荷</span><strong>'+(e.loadLabel||'自重')+'</strong></div>')+
          field(e.metricLabel||(e.id==='dead_hang'?'時間':'レップ'),'reps',t.reps,'text',e.unit||'')+
          field('セット','sets',t.sets,'number','')+
          '<div class="simple-editor-actions"><span class="save-record-status" aria-live="polite"></span><button type="button" class="primary save-exercise-record">保存</button></div>'+
        '</div>':'')+
      '</article>';
    }).join('');
    if(!filtered.length)root.innerHTML='<div class="empty">該当する種目がありません。</div>';

    root.querySelectorAll('[data-google-image]').forEach(link=>{
      const open=e=>{
        e.preventDefault();
        e.stopPropagation();
        window.open(googleImageUrl(link.dataset.googleImage),'_blank','noopener,noreferrer');
      };
      link.onclick=open;
      link.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){open(e);}};
    });
    root.querySelectorAll('.simple-exercise-summary').forEach(btn=>btn.onclick=()=>{
      const id=btn.closest('.simple-exercise').dataset.exerciseId;
      ui.openExercise=ui.openExercise===id?null:id;saveUi();renderExercises();
    });
    root.querySelectorAll('.save-exercise-record').forEach(btn=>btn.onclick=()=>saveExerciseRecord(btn.closest('.simple-exercise')));
    root.querySelectorAll('.simple-editor input').forEach(inp=>inp.oninput=()=>{
      const box=inp.closest('.simple-exercise'),id=box.dataset.exerciseId;
      if(inp.dataset.field==='sets')targets[id].sets=Math.max(1,Number(inp.value||1));
      else targets[id][inp.dataset.field]=inp.value;
      saveTargets();
      const t=targets[id];
      const vals=box.querySelectorAll('.exercise-values span');
      const def=exercises.find(x=>x.id===id);
      if(vals[0])vals[0].textContent=def.weight?(t.weight===''?'未設定':t.weight+' kg'):(def.loadLabel||'自重');
      if(vals[1])vals[1].textContent=t.reps;
      if(vals[2])vals[2].textContent=t.sets+' set';
    });
  }
  function qualifiedWeightRecords(def){
    return exerciseHistory.filter(r=>
      r.exerciseId===def.id &&
      Number(r.sets)>=3 &&
      Number(r.metric)>=12 &&
      Number.isFinite(Number(r.weight)) &&
      Number(r.weight)>0
    );
  }

  function achievedWeight(def){
    const records=qualifiedWeightRecords(def);
    if(!records.length)return null;
    const values=records.map(r=>Number(r.weight));
    return def.goalDirection==='down'?Math.min(...values):Math.max(...values);
  }

  function goalStatus(def,current,goal){
    if(!Number.isFinite(goal)||goal<=0)return {text:'目標未設定',pct:0,done:false};
    if(current==null)return {text:'12回×3セットの達成記録なし',pct:0,done:false};
    if(def.goalDirection==='down'){
      if(current<=goal)return {text:'達成',pct:100,done:true};
      const diff=current-goal;
      return {text:'あと補助 '+formatNumber(diff)+' kg減',pct:Math.max(0,Math.min(99,(goal/current)*100)),done:false};
    }
    if(current>=goal)return {text:'達成',pct:100,done:true};
    return {text:'あと '+formatNumber(goal-current)+' kg',pct:Math.max(0,Math.min(99,(current/goal)*100)),done:false};
  }

  const weightLevelPercents=[55,60,65,70,75,80,85,90,95,100];
  function roundToMachineStep(v){return Math.max(2.5,Math.round(v/2.5)*2.5)}
  function levelMilestones(goal){
    return weightLevelPercents.map(p=>roundToMachineStep(goal*p/100));
  }
  function achievedLevel(current,goal){
    if(current==null||!Number.isFinite(goal)||goal<=0)return 0;
    const ms=levelMilestones(goal);
    let lv=0;
    ms.forEach((w,i)=>{if(current>=w)lv=i+1;});
    return lv;
  }
  function nextLevelWeight(level,goal){
    const ms=levelMilestones(goal);
    if(level>=10)return ms[9];
    return ms[Math.max(0,level)];
  }

  function renderWeightGoals(){
    const root=document.querySelector('#weightGoalsGrid');
    if(!root)return;
    const defs=exercises.filter(e=>e.weight&&e.goalDirection!=='down'&&Number.isFinite(Number(e.goalKg)));
    root.innerHTML=defs.map(def=>{
      const current=achievedWeight(def);
      const rawGoal=weightGoals[def.id];
      const goal=rawGoal===''||rawGoal==null?Number(def.goalKg):Number(rawGoal);
      const status=goalStatus(def,current,goal);
      const level=achievedLevel(current,goal);
      const nextWeight=nextLevelWeight(level,goal);
      const milestones=levelMilestones(goal);
      const currentText=current==null?'—':formatNumber(current)+' kg';
      return '<article class="weight-goal-item '+(status.done?'done':'')+'" data-goal-exercise="'+def.id+'">'+
        '<div class="weight-goal-head">'+badge(def)+'<div><strong><a class="google-image-anchor" href="'+esc(googleImageUrl(def.name))+'" target="_blank" rel="noopener noreferrer" title="Google画像検索で見る">'+esc(def.name)+'</a></strong><small>現在達成 '+currentText+'</small></div><span class="weight-level-badge">Lv'+level+'</span></div>'+
        '<div class="weight-level-next"><span>'+(level>=10?'Lv10達成':'次 Lv'+(level+1))+'</span><strong>'+formatNumber(nextWeight)+' kg</strong></div>'+
        '<label class="weight-goal-input"><span>Lv10目標</span><div><input type="number" min="0" step="0.5" inputmode="decimal" value="'+(Number.isFinite(goal)?esc(goal):'')+'" placeholder="kg"><em>kg</em></div></label>'+
        '<div class="weight-goal-progress"><span style="width:'+Math.max(0,Math.min(100,level/10*100))+'%"></span></div>'+
        '<div class="weight-level-scale"><span>Lv1 '+formatNumber(milestones[0])+'kg</span><span>Lv5 '+formatNumber(milestones[4])+'kg</span><span>Lv10 '+formatNumber(milestones[9])+'kg</span></div>'+
        '<p class="weight-goal-status">'+(current==null?'12回×3セットの達成記録なし':(level>=10?'Lv10達成':'Lv'+level+' · 次まで '+formatNumber(Math.max(0,nextWeight-current))+' kg'))+'</p>'+
      '</article>';
    }).join('');

    root.querySelectorAll('[data-goal-exercise]').forEach(card=>{
      const id=card.dataset.goalExercise;
      const input=card.querySelector('input');
      input.addEventListener('change',()=>{
        const def=exerciseById(id);
        const v=Number(input.value);
        weightGoals[id]=Number.isFinite(v)&&v>0?String(v):String(def.goalKg);
        saveWeightGoals();
        renderWeightGoals();
      });
    });
  }

  function renderTodayMenuSelector(){
    const select=document.querySelector('#todayMenuSelect');
    if(!select)return;
    const defs=activeCatalogProgram();
    const key=recommendedKey();
    select.innerHTML=defs.map(day=>'<option value="'+day.key+'">'+esc(day.title)+'</option>').join('');
    select.value=key;
  }

  function renderCatalogProgram(){
    const title=document.querySelector('#catalogProgramTitle');
    const grid=document.querySelector('#catalogProgramGrid');
    if(!title||!grid)return;
    const defs=activeCatalogProgram();
    title.textContent='週'+(Number(state.programMode)===4?'4':'5')+'メニュー';
    const selectedKey=recommendedKey();
    grid.innerHTML=defs.map(day=>'<article class="catalog-day '+(day.key===selectedKey?'selected-today':'')+'"><div class="catalog-day-head"><span class="plan-code">'+esc(day.code)+'</span><h3>'+esc(day.title)+'</h3><p>'+esc(day.desc)+'</p></div><div class="catalog-day-exercises">'+day.items.map(([id])=>{const e=exerciseById(id);if(!e)return '';const t=targets[id];return '<button type="button" class="catalog-program-exercise" data-catalog-exercise="'+id+'">'+badge(e)+'<span><strong>'+esc(e.name)+'</strong><small>'+(e.weight?(t.weight===''?'重量未設定':esc(t.weight)+' kg'):(e.loadLabel||'自重'))+' · '+esc(t.reps)+' · '+t.sets+' set</small></span></button>';}).join('')+'</div></article>').join('');
    grid.querySelectorAll('[data-catalog-exercise]').forEach(btn=>btn.onclick=()=>openExerciseFromProgram(btn.dataset.catalogExercise));
  }

  function openExerciseFromProgram(id){
    ui.tab='exercises';
    ui.openExercise=id;
    ui.exerciseSearch='';
    ui.exercisePart='all';
    saveUi();
    const input=document.querySelector('#exerciseSearchInput');
    if(input)input.value='';
    showTab('exercises');
    renderExercises();
    requestAnimationFrame(()=>document.querySelector('[data-exercise-id="'+id+'"]')?.scrollIntoView({behavior:'smooth',block:'center'}));
  }

  function exerciseGoal(def){
    const raw=weightGoals[def.id];
    const v=raw===''||raw==null?Number(def.goalKg):Number(raw);
    return Number.isFinite(v)&&v>0?v:null;
  }

  function currentExerciseLevel(def){
    const goal=exerciseGoal(def);
    return goal?achievedLevel(achievedWeight(def),goal):0;
  }

  function ensureAchievementPopup(){
    if(document.querySelector('#weightAchievement'))return;
    const el=document.createElement('div');
    el.id='weightAchievement';
    el.className='weight-achievement';
    el.hidden=true;
    el.innerHTML='<div class="achievement-burst" aria-hidden="true"></div><div class="achievement-card"><p class="eyebrow">ACHIEVEMENT UNLOCKED</p><div class="achievement-level"></div><h2 class="achievement-name"></h2><p class="achievement-detail"></p><button type="button" class="primary achievement-close">OK</button></div>';
    document.body.appendChild(el);
    el.querySelector('.achievement-close').onclick=()=>{el.hidden=true;};
    el.onclick=e=>{if(e.target===el)el.hidden=true;};
  }

  function showWeightAchievement(def,oldLevel,newLevel,weight){
    ensureAchievementPopup();
    const el=document.querySelector('#weightAchievement');
    const jumped=Math.max(1,newLevel-oldLevel);
    el.querySelector('.achievement-level').textContent='Lv '+newLevel;
    el.querySelector('.achievement-name').textContent=def.name;
    el.querySelector('.achievement-detail').textContent=formatNumber(weight)+' kg · 12回 × 3セット達成'+(jumped>1?' · '+jumped+' Lvアップ':'');
    const burst=el.querySelector('.achievement-burst');
    burst.innerHTML=Array.from({length:18},(_,i)=>'<i style="--i:'+i+';--r:'+(18+(i%7)*5)+'px"></i>').join('');
    el.hidden=false;
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }

  function saveExerciseRecord(box){
    const id=box?.dataset.exerciseId;
    const def=exercises.find(x=>x.id===id);
    const t=targets[id];
    if(!def||!t)return;

    const weight=def.weight?Number(t.weight):null;
    if(def.weight&&(!Number.isFinite(weight)||weight<=0)){
      setSaveStatus(box,'重量を入力してください',true);
      return;
    }
    const metric=parseMetric(t.reps);
    if(!Number.isFinite(metric)||metric<=0){
      setSaveStatus(box,def.metricLabel==='時間'?'時間を入力してください':(def.id==='dead_hang'?'秒数を入力してください':'レップ数を入力してください'),true);
      return;
    }

    const oldLevel=(def.weight&&def.goalDirection!=='down'&&Number.isFinite(Number(def.goalKg)))?currentExerciseLevel(def):0;
    const now=new Date();
    exerciseHistory.push({
      id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),
      iso:now.toISOString(),
      exerciseId:def.id,
      exerciseName:def.name,
      weight:def.weight?weight:null,
      reps:String(t.reps),
      metric,
      sets:Number(t.sets||def.defaultSets||3)
    });
    saveExerciseHistory();
    ui.progressExercise=def.id;saveUi();
    setSaveStatus(box,'保存しました · '+formatDate(now),false);
    renderExerciseProgress();
    renderExerciseHistory();
    renderWeightGoals();
    if(def.weight&&def.goalDirection!=='down'&&Number(t.sets)>=3&&metric>=12){
      const newLevel=currentExerciseLevel(def);
      const notified=Number(weightAchievements[def.id]||0);
      const baseline=Math.max(oldLevel,notified);
      if(newLevel>baseline){
        weightAchievements[def.id]=newLevel;
        saveWeightAchievements();
        showWeightAchievement(def,baseline,newLevel,weight);
      }
    }
  }

  function parseMetric(value){
    if(typeof value==='number')return value;
    const m=String(value??'').replace(',','.').match(/\d+(?:\.\d+)?/);
    return m?Number(m[0]):NaN;
  }
  function setSaveStatus(box,msg,isError){
    const el=box?.querySelector('.save-record-status');
    if(!el)return;
    el.textContent=msg;
    el.classList.toggle('error',!!isError);
  }
  function formatDate(d){
    return new Date(d).toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit'});
  }
  function formatDateTime(d){
    return new Date(d).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function setupExerciseProgress(card){
    if(!card||card.querySelector('#exerciseProgressPanel'))return;
    const oldHead=card.querySelector('.section-head');
    const oldSummary=card.querySelector('#progressSummary');
    const oldChart=card.querySelector('#progressChart');
    [oldHead,oldSummary,oldChart].filter(Boolean).forEach(x=>x.classList.add('legacy-progress-hidden'));

    const panel=document.createElement('div');
    panel.id='exerciseProgressPanel';
    panel.innerHTML='<div class="section-head progress-head"><div><p class="eyebrow">PROGRESS</p><h2>種目別進捗</h2></div><label class="select-label">種目<select id="exerciseProgressSelect"></select></label></div><div id="exerciseProgressSummary" class="chart-stats"></div><div id="exerciseProgressCurve" class="exercise-progress-curve"></div><div id="exerciseProgressRows" class="exercise-progress-rows"></div>';
    card.appendChild(panel);

    const sel=panel.querySelector('#exerciseProgressSelect');
    sel.innerHTML=exercises.map(e=>'<option value="'+e.id+'">'+esc(e.name)+'</option>').join('');
    sel.onchange=()=>{ui.progressExercise=sel.value;saveUi();renderExerciseProgress();};
  }

  function renderExerciseProgress(){
    const select=document.querySelector('#exerciseProgressSelect');
    const summary=document.querySelector('#exerciseProgressSummary');
    const chart=document.querySelector('#exerciseProgressCurve');
    const rows=document.querySelector('#exerciseProgressRows');
    if(!select||!summary||!chart||!rows)return;

    const firstWithData=exercises.find(e=>exerciseHistory.some(r=>r.exerciseId===e.id));
    const id=exercises.some(e=>e.id===ui.progressExercise)?ui.progressExercise:(firstWithData?.id||exercises[0].id);
    ui.progressExercise=id;saveUi();select.value=id;
    const def=exercises.find(e=>e.id===id);
    const data=exerciseHistory.filter(r=>r.exerciseId===id).sort((a,b)=>new Date(a.iso)-new Date(b.iso));

    if(!data.length){
      summary.innerHTML='';
      chart.innerHTML='<div class="empty">まだ保存された記録がありません。</div>';
      rows.innerHTML='';
      return;
    }

    const values=data.map(r=>def.weight?Number(r.weight):Number(r.metric)).filter(Number.isFinite);
    const latest=data[data.length-1];
    const latestValue=def.weight?Number(latest.weight):Number(latest.metric);
    const best=def.weight?Math.max(...values):Math.max(...values);
    const first=values[0];
    const unit=def.weight?'kg':(def.unit||'秒');
    summary.innerHTML='<article><span>最新</span><strong>'+latestValue+unit+'</strong></article><article><span>最高</span><strong>'+best+unit+'</strong></article><article><span>初回比</span><strong>'+((latestValue-first)>0?'+':'')+(latestValue-first)+unit+'</strong></article>';

    chart.innerHTML=buildCurveSvg(data,def);
    rows.innerHTML='<div class="progress-log-head"><span>日付</span><span>負荷</span><span>レップ/時間</span><span>セット</span></div>'+[...data].reverse().map(r=>'<div class="progress-log-row"><span>'+formatDate(r.iso)+'</span><span>'+(def.weight?r.weight+' kg':'自重')+'</span><span>'+esc(r.reps)+'</span><span>'+r.sets+'</span></div>').join('');
  }

  function buildCurveSvg(data,def){
    const W=860,H=290,pL=56,pR=22,pT=22,pB=48,pW=W-pL-pR,pH=H-pT-pB;
    const vals=data.map(r=>def.weight?Number(r.weight):Number(r.metric));
    let min=Math.min(...vals),max=Math.max(...vals);
    if(min===max){min=Math.max(0,min-1);max=max+1;}
    const pad=Math.max((max-min)*0.15,def.weight?1:2);
    min=Math.max(0,min-pad);max=max+pad;
    const pts=data.map((r,i)=>{
      const v=def.weight?Number(r.weight):Number(r.metric);
      return {x:pL+(data.length===1?pW/2:i/(data.length-1)*pW),y:pT+(max-v)/(max-min)*pH,v,r};
    });
    let d='';
    if(pts.length===1)d='M '+pts[0].x+' '+pts[0].y;
    else{
      d='M '+pts[0].x+' '+pts[0].y;
      for(let i=0;i<pts.length-1;i++){
        const a=pts[i],b=pts[i+1],mx=(a.x+b.x)/2;
        d+=' C '+mx+' '+a.y+', '+mx+' '+b.y+', '+b.x+' '+b.y;
      }
    }
    const grid=[];for(let i=0;i<=4;i++){const y=pT+pH*i/4;const v=max-(max-min)*i/4;grid.push('<line x1="'+pL+'" y1="'+y+'" x2="'+(W-pR)+'" y2="'+y+'" class="exercise-chart-grid"/><text x="'+(pL-8)+'" y="'+(y+4)+'" text-anchor="end" class="exercise-chart-text">'+formatNumber(v)+'</text>');}
    const every=Math.max(1,Math.ceil(pts.length/6));
    const labels=pts.map((p,i)=>(i%every===0||i===pts.length-1)?'<text x="'+p.x+'" y="'+(H-16)+'" text-anchor="middle" class="exercise-chart-text">'+new Date(p.r.iso).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})+'</text>':'').join('');
    const circles=pts.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" class="exercise-chart-dot"><title>'+formatDateTime(p.r.iso)+' · '+p.v+(def.weight?'kg':(def.unit||'秒'))+' · '+esc(p.r.reps)+' · '+p.r.sets+'set</title></circle>').join('');
    return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(def.name)+'の進捗グラフ">'+grid.join('')+'<path d="'+d+'" class="exercise-chart-line"/>'+circles+labels+'<text x="12" y="18" class="exercise-chart-unit">'+(def.weight?'kg':(def.unit||'秒'))+'</text></svg>';
  }
  function formatNumber(v){
    return Math.abs(v-Math.round(v))<0.01?String(Math.round(v)):v.toFixed(1);
  }

  function renderExerciseHistory(){
    const root=document.querySelector('#exerciseLogHistory');
    if(!root)return;
    if(!exerciseHistory.length){root.innerHTML='<div class="empty">まだ種目記録はありません。</div>';return;}
    root.innerHTML=[...exerciseHistory].reverse().slice(0,60).map(r=>{
      const def=exercises.find(e=>e.id===r.exerciseId)||{name:r.exerciseName||r.exerciseId,weight:r.weight!=null};
      return '<div class="exercise-history-row"><span>'+formatDateTime(r.iso)+'</span><strong>'+esc(def.name)+'</strong><span>'+(r.weight!=null?r.weight+' kg':(def.loadLabel||'自重'))+' · '+esc(r.reps)+(def.unit&&!String(r.reps).includes(def.unit)?' '+def.unit:'')+' · '+r.sets+' set</span></div>';
    }).join('');
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
    .ui-redundant,.legacy-training-level-hidden{display:none!important}
    .app-section-hidden{display:none!important}
    .simple-tabs{position:sticky;top:0;z-index:80;max-width:1180px;margin:0 auto;padding:8px 20px;display:flex;gap:8px;overflow-x:auto;background:var(--bg)}
    .simple-tabs button{flex:0 0 auto;border:1px solid var(--line);background:var(--surface);color:var(--muted);padding:9px 14px;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}
    .simple-tabs button.active{background:var(--accent);color:#07110c;border-color:var(--accent)}
    .legacy-program-hidden,.legacy-level-map-hidden{display:none!important}.simple-head{margin-bottom:6px}.exercise-search{display:grid;gap:6px;margin-top:10px;color:var(--muted);font-size:.76rem}.exercise-search input{width:100%;font-size:1rem}.exercise-part-filters{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.exercise-part-filters button{border:1px solid var(--line);background:var(--surface2);color:var(--muted);border-radius:999px;padding:7px 11px;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}.exercise-part-filters button.active{background:var(--accent);border-color:var(--accent);color:#07110c}.exercise-search-count{margin:8px 0 0;font-size:.76rem}.simple-exercise-list{display:grid;gap:8px;margin-top:10px}
    .simple-exercise{border:1px solid var(--line);background:var(--surface2);border-radius:14px;overflow:hidden}.simple-exercise.open{border-color:var(--accent)}
    .simple-exercise-summary{width:100%;border:0;background:transparent;color:var(--text);padding:13px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;text-align:left;cursor:pointer}
    .exercise-title-line{display:flex;gap:10px;align-items:center;min-width:0}.exercise-title-line strong{display:block}.google-image-name,.google-image-anchor{color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;cursor:pointer}.google-image-name:hover,.google-image-anchor:hover{color:var(--accent)}.google-image-name:focus-visible,.google-image-anchor:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:3px}.exercise-title-line small{display:block;color:var(--muted);margin-top:2px}
    .muscle-badge{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;border:1px solid var(--line);background:var(--surface3);border-radius:999px;padding:4px 7px;color:var(--accent);font-size:.68rem;font-weight:900}
    .muscle-badge svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.muscle-badge .muscle-mark{fill:currentColor;stroke:none}
    .exercise-values{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.exercise-values span{border:1px solid var(--line);border-radius:999px;padding:5px 8px;color:var(--muted);font-size:.72rem}
    .simple-editor{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:0 13px 13px}.simple-editor-actions{grid-column:1/-1;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-top:2px}.save-record-status{margin-right:auto;color:var(--accent);font-size:.78rem}.save-record-status.error{color:var(--danger)}.simple-field,.simple-static{display:grid;gap:5px;color:var(--muted);font-size:.72rem}.simple-field>div{display:flex;align-items:center;gap:6px}.simple-field input{width:100%;font-weight:800}.simple-field em{font-style:normal}.simple-static strong{color:var(--text);font-size:1rem}
    .weight-achievement{position:fixed;inset:0;z-index:500;display:grid;place-items:center;background:rgba(0,0,0,.68);padding:20px}.weight-achievement[hidden]{display:none!important}.achievement-card{position:relative;z-index:2;width:min(420px,92vw);text-align:center;background:var(--surface);border:1px solid var(--accent);border-radius:22px;padding:28px 22px;box-shadow:0 20px 80px rgba(0,0,0,.45);animation:achievementPop .55s cubic-bezier(.2,.9,.2,1.25)}.achievement-level{font-size:3rem;font-weight:950;color:var(--accent);line-height:1;margin:8px 0}.achievement-card h2{margin:8px 0}.achievement-detail{color:var(--muted)}.achievement-close{min-width:120px;margin-top:10px}.achievement-burst{position:absolute;inset:50% auto auto 50%;width:1px;height:1px;z-index:1}.achievement-burst i{position:absolute;width:8px;height:8px;border-radius:2px;background:var(--accent);transform:rotate(calc(var(--i)*20deg)) translateY(0);opacity:0}.weight-achievement.play .achievement-burst i{animation:achievementBurst .9s ease-out forwards;animation-delay:calc(var(--i)*12ms)}@keyframes achievementPop{0%{transform:scale(.65);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}@keyframes achievementBurst{0%{opacity:1;transform:rotate(calc(var(--i)*20deg)) translateY(0) scale(1)}100%{opacity:0;transform:rotate(calc(var(--i)*20deg)) translateY(calc(-1 * var(--r) * 5)) scale(.4)}}
    .weight-goal-intro{margin-top:-4px}.weight-goals-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.weight-goal-item{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:12px}.weight-goal-item.done{border-color:var(--accent)}.weight-goal-head{display:flex;gap:8px;align-items:center}.weight-level-badge{margin-left:auto;border:1px solid var(--accent);color:var(--accent);border-radius:999px;padding:5px 8px;font-weight:900;font-size:.75rem}.weight-level-next{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:8px 10px;background:var(--surface);border-radius:10px}.weight-level-next span{color:var(--muted);font-size:.72rem}.weight-level-next strong{font-size:.95rem}.weight-level-scale{display:flex;justify-content:space-between;gap:8px;margin-top:6px;color:var(--muted);font-size:.65rem}.weight-goal-head strong,.weight-goal-head small{display:block}.weight-goal-head small{color:var(--muted);margin-top:2px;font-size:.72rem}.weight-goal-input{display:grid;gap:5px;margin-top:10px;color:var(--muted);font-size:.72rem}.weight-goal-input>div{display:flex;align-items:center;gap:6px}.weight-goal-input input{width:100%;font-weight:800}.weight-goal-input em{font-style:normal}.weight-goal-progress{height:7px;background:var(--surface3);border-radius:999px;overflow:hidden;margin-top:10px}.weight-goal-progress span{display:block;height:100%;background:var(--accent);border-radius:inherit}.weight-goal-status{margin:7px 0 0;color:var(--muted);font-size:.72rem}.weight-goal-item.done .weight-goal-status{color:var(--accent);font-weight:800}.catalog-program-grid{display:grid;gap:12px}.catalog-day{border:1px solid var(--line);background:var(--surface2);border-radius:15px;padding:14px}.catalog-day-head h3{margin:3px 0}.catalog-day-head p{margin:0;color:var(--muted);font-size:.82rem}.catalog-day-exercises{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:12px}.catalog-program-exercise{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:12px;padding:9px;display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer}.catalog-program-exercise>span:last-child{min-width:0}.catalog-program-exercise strong,.catalog-program-exercise small{display:block}.catalog-program-exercise small{color:var(--muted);font-size:.7rem;margin-top:2px}.legacy-progress-hidden{display:none!important}.exercise-progress-curve{min-height:260px;overflow-x:auto}.exercise-progress-curve svg{display:block;width:100%;min-width:620px;height:auto}.exercise-chart-grid{stroke:var(--line);stroke-width:1}.exercise-chart-line{fill:none;stroke:var(--accent);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.exercise-chart-dot{fill:var(--surface);stroke:var(--accent);stroke-width:4}.exercise-chart-text,.exercise-chart-unit{fill:var(--muted);font:12px Inter,"Noto Sans JP",system-ui,sans-serif}.exercise-progress-rows{margin-top:12px;border-top:1px solid var(--line)}.progress-log-head,.progress-log-row{display:grid;grid-template-columns:1.2fr .8fr 1fr .7fr;gap:10px;padding:9px 4px;border-bottom:1px solid var(--line);font-size:.82rem}.progress-log-head{color:var(--muted);font-size:.72rem;font-weight:800}.exercise-history-row{display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);align-items:center}.exercise-history-row>span{color:var(--muted);font-size:.8rem}.hero-actions{max-width:260px}.hero-actions #startTodayBtn{width:100%}
    @media(max-width:700px){.weight-goals-grid{grid-template-columns:1fr}.catalog-day-exercises{grid-template-columns:1fr}.simple-tabs{padding-inline:12px}.simple-exercise-summary{grid-template-columns:1fr}.exercise-values{justify-content:flex-start}.simple-editor{grid-template-columns:1fr 1fr}.simple-editor>*:last-child{grid-column:1/-1}.progress-log-head,.progress-log-row{grid-template-columns:1fr .7fr 1fr .6fr;font-size:.74rem}.exercise-history-row{grid-template-columns:1fr}.exercise-history-row>span:last-child{margin-top:-6px}}
  `;
  document.head.appendChild(style);

  applyCatalogTemplates();
  if(typeof renderAll==='function')renderAll();
  setupSections();
  renderTodayMenuSelector();
  renderWeightGoals();
  wrapWorkout();
})();