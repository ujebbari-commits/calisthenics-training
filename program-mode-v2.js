// Training Quest: selectable 4/5-day programs, separate progression vs today's level, explicit level-up choice.
(() => {
  if (typeof state === 'undefined' || typeof templates === 'undefined' || typeof levels === 'undefined') return;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
  state.programMode = Number(stored.programMode || 5) === 4 ? 4 : 5;
  state.trainingLevel = Math.max(1, Math.min(15, Number(stored.trainingLevel || state.level || 1)));
  state.levelDecisionDismissed = Number(stored.levelDecisionDismissed || 0);

  const clone = obj => JSON.parse(JSON.stringify(obj));
  const fourTemplates = clone(templates);
  const fiveTemplates = {
    A:{code:'PUSH',title:'Push · 胸 / 肩 / 三頭',desc:'押す筋肉を集中して鍛える日。',items:[
      ['ウォームアップ','warm'],['チェストプレス','main'],['ショルダープレス','main'],['インクラインチェストプレス','secondary'],['ペックフライ','accessory'],['ラテラルレイズ','accessory'],['トライセプスプレスダウン','accessory'],['ショートフィニッシャー','finisher']
    ]},
    B:{code:'PULL',title:'Pull · 背中 / 二頭',desc:'引く筋肉と懸垂の土台を鍛える日。',items:[
      ['ウォームアップ','warm'],['ラットプルダウン','main'],['シーテッドロー','main'],['ハイロー','secondary'],['アシスト懸垂','secondary'],['リアデルトフライ','accessory'],['バイセプスカール','accessory'],['ショートフィニッシャー','finisher']
    ]},
    C:{code:'LEGS + ABS',title:'Legs · 脚 / 臀部 / 腹筋',desc:'下半身全体と腹筋を鍛える日。',items:[
      ['ウォームアップ','warm'],['レッグプレス','main'],['レッグカール','main'],['レッグエクステンション','secondary'],['ヒップスラスト / グルートドライブ','secondary'],['カーフレイズ','accessory'],['アブドミナルクランチ','core'],['デッドバグ','core'],['ショートフィニッシャー','finisher']
    ]},
    D:{code:'UPPER',title:'Upper · 上半身総合',desc:'胸・背中・肩・腕を2回目の刺激で伸ばす日。',items:[
      ['ウォームアップ','warm'],['インクラインチェストプレス','main'],['ハイロー','main'],['ラットプルダウン','secondary'],['ショルダープレス','secondary'],['ラテラルレイズ','accessory'],['トライセプスプレスダウン','accessory'],['バイセプスカール','accessory'],['ショートフィニッシャー','finisher']
    ]},
    E:{code:'LOWER + ABS',title:'Lower · 脚 / 臀部 / 腹筋',desc:'下半身を別パターンでもう一度刺激する日。',items:[
      ['ウォームアップ','warm'],['ハックスクワット / レッグプレス','main'],['ブルガリアンスクワット','secondary'],['レッグカール','secondary'],['ヒップスラスト / グルートドライブ','secondary'],['カーフレイズ','accessory'],['リバースクランチ','core'],['アブドミナルクランチ','core'],['ショートフィニッシャー','finisher']
    ]},
    R: clone(fourTemplates.R)
  };

  const currentKeys = () => state.programMode === 5 ? ['A','B','C','D','E'] : ['A','B','C','D'];
  const xpPerSession = () => state.programMode === 5 ? 20 : 25;
  const trainingInfo = () => levels[state.trainingLevel - 1];

  function applyProgramMode(){
    const source = state.programMode === 5 ? fiveTemplates : fourTemplates;
    Object.keys(templates).forEach(k => delete templates[k]);
    Object.entries(source).forEach(([k,v]) => templates[k] = clone(v));
  }
  applyProgramMode();

  function prescriptionAt(level, role){
    const l = levels[level - 1];
    if(role==='warm')return {sets:'3〜5分',reps:'＋軽い準備セット',rest:'—'};
    if(role==='finisher')return {sets:l.finisher,reps:'任意・短時間',rest:'—'};
    if(role==='recovery')return {sets:'2',reps:'楽に10〜15回',rest:'30〜60秒'};
    if(role==='main')return {sets:l.mainSets,reps:l.mainReps,rest:'2〜3分'};
    if(role==='secondary')return {sets:l.secondarySets,reps:l.secondaryReps,rest:'90〜120秒'};
    if(role==='accessory')return {sets:l.accessorySets,reps:l.accessoryReps,rest:'60〜90秒'};
    if(role==='core')return {sets:l.coreSets,reps:'10〜15回',rest:'60〜90秒'};
    return {sets:2,reps:'10〜15回',rest:'60〜90秒'};
  }

  adjustedItems = function(key){
    const list = templates[key].items.map(([name,role]) => ({name,role,...prescriptionAt(state.trainingLevel,role)}));
    let out = list;
    if(state.programMode===4 && key==='D' && state.trainingLevel<6) out = out.filter(x=>x.name!=='ルーマニアンデッドリフト');
    if(state.programMode===4 && key==='C' && state.trainingLevel<3) out = out.filter(x=>x.name!=='アシスト懸垂');
    if(state.trainingLevel<4) out = out.filter(x=>x.name!=='ショートフィニッシャー');
    return out;
  };

  const sessionMatchesProgram = h => {
    const mode = Number(h.programMode || 4);
    return mode === state.programMode && currentKeys().includes(h.key);
  };

  strengthHistoryForCurrentLevel = function(){
    return state.history.filter(h => sessionMatchesProgram(h));
  };

  recommendedKey = function(){
    const h = strengthHistoryForCurrentLevel();
    const order = currentKeys();
    if(!h.length) return order[0];
    const idx = order.indexOf(h[h.length-1].key);
    return order[(idx < 0 ? 0 : idx + 1) % order.length];
  };

  function earnedXpFor(h){
    if(new Date(h.iso) < new Date(state.levelStartedAt)) return 0;
    if(Number.isFinite(Number(h.xpEarned))) return Number(h.xpEarned);
    // Legacy entries: old 4-day sessions at the current progression level were worth 25 XP.
    if(!h.programMode && ['A','B','C','D'].includes(h.key) && Number(h.level)===Number(state.level)) return 25;
    return 0;
  }

  xp = function(){
    return Math.min(100, state.history.reduce((sum,h)=>sum+earnedXpFor(h),0));
  };

  sessionLevelCount = function(){
    return state.history.filter(h=>earnedXpFor(h)>0).length;
  };

  canLevelUp = function(){ return state.level < 15 && xp() >= 100; };
  levelUpHint = function(){
    if(state.level===15) return '最大レベル。重量・回数・フォームの自己ベスト更新を続ける。';
    if(xp()>=100) return '100 XP達成。次のLvへ進むか、今のLvを続けるか選べます。';
    return `次のLv候補まであと ${100-xp()} XP。${state.programMode===5?'週5なら1回20 XP':'週4なら1回25 XP'}。`;
  };

  function ensureControls(){
    const card = document.querySelector('.level-summary-card');
    if(!card || document.querySelector('#trainingControls')) return;
    const controls = document.createElement('div');
    controls.id='trainingControls';
    controls.className='training-controls';
    controls.innerHTML=`
      <label>週間プログラム<select id="programModeSelect"><option value="4">週4メニュー</option><option value="5">週5メニュー</option></select></label>
      <label>今日使うLv<select id="trainingLevelSelect"></select></label>
      <div class="training-control-status"><span>基準Lv</span><strong id="baseLevelLabel"></strong><small id="xpEligibilityLabel"></small></div>`;
    const rules = card.querySelector('#levelRules');
    card.insertBefore(controls, rules);
    controls.querySelector('#trainingLevelSelect').innerHTML=levels.map(l=>`<option value="${l.n}">Lv${l.n} · ${esc(l.name)}</option>`).join('');
    controls.querySelector('#programModeSelect').onchange=e=>{
      state.programMode=Number(e.target.value)===4?4:5;
      applyProgramMode(); save(); renderAll(); syncControls();
    };
    controls.querySelector('#trainingLevelSelect').onchange=e=>{
      state.trainingLevel=Math.max(1,Math.min(15,Number(e.target.value)));
      save(); renderAll(); syncControls();
    };
  }

  function syncControls(){
    ensureControls();
    const p=document.querySelector('#programModeSelect'),t=document.querySelector('#trainingLevelSelect');
    if(p)p.value=String(state.programMode); if(t)t.value=String(state.trainingLevel);
    const b=document.querySelector('#baseLevelLabel'),x=document.querySelector('#xpEligibilityLabel');
    if(b)b.textContent=`Lv${state.level}`;
    if(x)x.textContent=state.trainingLevel<state.level?'今日のLvは基準Lvより低いため、このセッションはXPなし':'このセッションはXP対象';
  }

  renderHero = function(){
    const l=trainingInfo(), key=recommendedKey(), w=templates[key], value=xp();
    document.querySelector('#heroLevel').textContent=`BASE LV ${state.level}`;
    document.querySelector('#heroPhase').textContent=`TODAY LV ${state.trainingLevel} · ${l.phase}`;
    document.querySelector('#todayLabel').textContent=`${localDate()} · ${w.code} · ${state.programMode} DAYS`;
    document.querySelector('#todayTitle').textContent=w.title;
    const xpText=state.trainingLevel<state.level?'XPなし':`+${xpPerSession()} XP対象`;
    document.querySelector('#todaySummary').textContent=`${w.desc} 今日Lv${state.trainingLevel}：主要${l.mainSets}セット / RIR ${l.rir} · ${xpText}`;
    document.querySelector('#startTodayBtn').dataset.key=key;
    document.querySelector('#xpFill').style.width=`${value}%`;
    document.querySelector('#xpText').textContent=`${value} / 100 XP`;
    document.querySelector('#levelHint').textContent=levelUpHint();
    document.querySelector('#levelUpBtn').disabled=!canLevelUp();
  };

  renderLevelSummary = function(){
    const l=trainingInfo();
    document.querySelector('#levelTitle').textContent=`今日 Lv${l.n} · ${l.name}`;
    document.querySelector('#levelDescription').textContent=`${l.desc} 基準レベルはLv${state.level}。今日の難易度はいつでもLv1〜15から選べます。`;
    document.querySelector('#levelRules').innerHTML=[
      ['主要種目',`${l.mainSets}セット × ${l.mainReps}`],['補助種目',`${l.secondarySets}〜${l.accessorySets}セット`],['余力',`RIR ${l.rir}`],['有酸素',`${l.finisher}のみ`]
    ].map(x=>`<div class="rule"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
    syncControls();
  };

  renderStats = function(){
    document.querySelector('#currentLevelStat').textContent=`${state.level} / 15`;
    document.querySelector('#levelSessionCount').textContent=`${sessionLevelCount()} / ${state.programMode}`;
    const ws=weekStart().getTime();
    const count=state.history.filter(h=>['A','B','C','D','E'].includes(h.key)&&new Date(h.iso).getTime()>=ws).length;
    document.querySelector('#weekCount').textContent=`${count} / ${state.programMode}`;
    const weeks=new Set(state.history.filter(h=>['A','B','C','D','E'].includes(h.key)).map(h=>weekStart(new Date(h.iso)).toISOString().slice(0,10)));
    let streak=0,cursor=weekStart(); while(weeks.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-7);} document.querySelector('#streakCount').textContent=streak;
  };

  renderPlan = function(){
    const rec=recommendedKey();
    const card=document.querySelector('#planGrid')?.closest('.card');
    const h2=card?.querySelector('.section-head h2'); if(h2)h2.textContent=`週${state.programMode}メニュー`;
    const intro=document.querySelector('.section-intro'); if(intro)intro.textContent=`100 XPで進級確認。週4は1回25 XP、週5は1回20 XP。今日のLvを基準Lvより下げたセッションはXPなし。`;
    document.querySelector('#planGrid').innerHTML=currentKeys().map(k=>{
      const w=templates[k],items=adjustedItems(k).filter(x=>!['ウォームアップ','ショートフィニッシャー'].includes(x.name));
      return `<article class="plan-card ${k===rec?'active':''}" data-key="${k}"><span class="plan-code">${w.code}</span><h3>${w.title}</h3><p class="muted">${w.desc}</p><ul>${items.slice(0,5).map(i=>`<li>${esc(i.name)} · ${i.sets}×${i.reps}</li>`).join('')}</ul></article>`;
    }).join('');
    document.querySelectorAll('.plan-card').forEach(x=>x.onclick=()=>openWorkout(x.dataset.key));
  };

  renderLevelGrid = function(){
    document.querySelector('#levelGrid').innerHTML=levels.map(l=>{
      const today=l.n===state.trainingLevel,base=l.n===state.level;
      return `<article class="level-card ${today?'current':''}" data-level="${l.n}" role="button" tabindex="0"><span class="lv">LV ${l.n}</span>${base?'<span class="lock">BASE</span>':''}<h3>${esc(l.name)}</h3><p>${esc(l.phase)} · 主要${l.mainSets}セット · RIR ${esc(l.rir)}</p>${today?'<small class="today-level-mark">TODAY</small>':''}</article>`;
    }).join('');
    document.querySelectorAll('.level-card').forEach(card=>{
      const choose=()=>{state.trainingLevel=Number(card.dataset.level);save();renderAll();syncControls();};
      card.onclick=choose; card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};
    });
  };

  renderHistory = function(){
    const root=document.querySelector('#history');
    if(!state.history.length){root.innerHTML='<div class="empty">まだ記録はありません。</div>';return;}
    root.innerHTML=[...state.history].reverse().slice(0,30).map(h=>{
      const mode=Number(h.programMode||4); const source=mode===5?fiveTemplates:fourTemplates; const w=source[h.key]||fourTemplates[h.key];
      const results=(h.results||[]).filter(r=>Number(r.weight)>0||Number(r.reps)>0||Number(r.best)>0);
      const xpPart=Number(h.xpEarned)>0?` · +${h.xpEarned} XP`:h.xpEarned===0&&h.key!=='R'?' · XPなし':'';
      return `<div class="history-item"><div>${new Date(h.iso).toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}</div><div><strong>${w?.title||h.key}${h.level?` · Lv${h.level}`:''}</strong><p>${results.length?`${results.length}種目をベスト記録`:''}${xpPart}${h.notes?` · ${esc(h.notes)}`:''}</p></div><span class="pill">${w?.code||''}</span></div>`;
    }).join('');
  };

  let activeSessionLevel=state.trainingLevel;
  openWorkout = function(key){
    activeWorkoutKey=key; activeSessionLevel=state.trainingLevel;
    const w=templates[key],items=adjustedItems(key),l=levels[activeSessionLevel-1];
    document.querySelector('#workoutCode').textContent=`${w.code} · TODAY LV ${activeSessionLevel}`;
    document.querySelector('#workoutTitle').textContent=w.title;
    document.querySelector('#workoutDesc').textContent=`${w.desc} 基本はRIR ${l.rir}。基準Lv${state.level}${activeSessionLevel<state.level?'より低いためXPなし':'以上なのでXP対象'}。`;
    document.querySelector('#exerciseList').innerHTML=items.map((x,i)=>{
      const d=exerciseDB[x.name]||{}; const isTrack=!['warm','finisher','recovery'].includes(x.role);
      const bodyweight=['アシスト懸垂','アシストディップス','ブルガリアンスクワット','デッドバグ','リバースクランチ'].includes(x.name);
      return `<article class="exercise" data-index="${i}" data-name="${esc(x.name)}"><div class="exercise-main"><div><h3>${esc(x.name)}</h3><p>${esc(d.muscle||'')}</p><div class="exercise-tags"><span class="tag">${esc(x.role)}</span>${!['warm','finisher','recovery'].includes(x.role)?`<span class="tag">RIR ${esc(l.rir)}</span>`:''}</div></div><div class="exercise-meta"><strong>${esc(String(x.sets))} × ${esc(String(x.reps))}</strong><span>休憩 ${esc(x.rest)}</span></div></div>${guideHTML(x.name)}${isTrack?`<div class="quick-log"><span>終了後だけ入力（任意）</span><label>${bodyweight?'補助/負荷 kg':'重量 kg'}<input class="log-weight" type="number" min="0" step="0.5" inputmode="decimal" placeholder="例 25"></label><label>ベスト回数<input class="log-reps" type="number" min="0" step="1" inputmode="numeric" placeholder="例 10"></label></div>`:''}</article>`;
    }).join('');
    document.querySelector('#workoutNotes').value='';
    const eligible=key!=='R'&&activeSessionLevel>=state.level;
    document.querySelector('#completeWorkoutBtn').textContent=key==='R'?'回復日を記録':eligible?`セッション完了 +${xpPerSession()} XP`:'セッション完了 · XPなし';
    document.querySelector('#workoutBackdrop').hidden=false;document.querySelector('#workoutPanel').hidden=false;document.body.style.overflow='hidden';
    document.querySelectorAll('.exercise-guide').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open)return;const box=d.querySelector('.google-images-box');if(!box||box.dataset.loaded)return;const f=box.querySelector('iframe'),p=box.querySelector('.google-images-placeholder');f.src=googleImageUrl(box.dataset.query,true);f.hidden=false;p.hidden=true;box.dataset.loaded='1';}));
  };

  function ensureDecisionPanel(){
    if(document.querySelector('#levelDecisionPanel'))return;
    const back=document.createElement('div'); back.id='levelDecisionBackdrop';back.className='overlay-backdrop';back.hidden=true;
    const panel=document.createElement('section'); panel.id='levelDecisionPanel';panel.className='small-panel';panel.hidden=true;
    panel.innerHTML=`<div class="panel-shell"><div class="dialog-head"><div><p class="eyebrow">100 XP</p><h2>次のLvへ進みますか？</h2></div><button id="closeDecisionBtn" class="icon-btn">×</button></div><p id="levelDecisionText" class="level-description"></p><div class="level-decision-actions"><button id="stayLevelBtn" class="secondary">今のLvを続ける</button><button id="advanceLevelBtn" class="primary">次のLvへ進む</button></div><p class="muted">今のLvを続けても、後から「レベルアップ」から進めます。</p></div>`;
    document.body.append(back,panel);
    const close=()=>{back.hidden=true;panel.hidden=true;};
    back.onclick=close;panel.querySelector('#closeDecisionBtn').onclick=close;
    panel.querySelector('#stayLevelBtn').onclick=()=>{state.levelDecisionDismissed=state.level;save();close();renderAll();};
    panel.querySelector('#advanceLevelBtn').onclick=()=>{close();advanceProgressionLevel();};
  }

  function openDecision(force=false){
    if(!canLevelUp())return;
    if(!force&&state.levelDecisionDismissed===state.level)return;
    ensureDecisionPanel();
    document.querySelector('#levelDecisionText').textContent=`基準Lv${state.level}で100 XPに到達しました。Lv${state.level+1}へ進むか、Lv${state.level}を続けるか選んでください。`;
    document.querySelector('#levelDecisionBackdrop').hidden=false;document.querySelector('#levelDecisionPanel').hidden=false;
  }

  function advanceProgressionLevel(){
    if(!canLevelUp()||state.level>=15)return;
    state.level++;
    state.unlockedLevel=Math.max(state.unlockedLevel,state.level);
    state.trainingLevel=state.level;
    state.levelStartedAt=todayISO();
    state.levelDecisionDismissed=0;
    save();renderAll();syncControls();showToast(`基準Lv ${state.level} に進みました`);
  }

  levelUp = function(){ openDecision(true); };

  completeWorkout = function(){
    if(!activeWorkoutKey)return;
    const results=[];
    document.querySelectorAll('#exerciseList .exercise').forEach(el=>{const weight=Number(el.querySelector('.log-weight')?.value||0),reps=Number(el.querySelector('.log-reps')?.value||0);if(weight>0||reps>0)results.push({exercise:el.dataset.name,weight,reps,best:reps});});
    const before=xp();
    let earned=0;
    if(activeWorkoutKey!=='R' && activeSessionLevel>=state.level && before<100) earned=Math.min(xpPerSession(),100-before);
    state.history.push({iso:todayISO(),key:activeWorkoutKey,level:activeWorkoutKey==='R'?null:activeSessionLevel,baseLevel:state.level,programMode:state.programMode,xpEarned:earned,results,notes:document.querySelector('#workoutNotes').value.trim()});
    save();closeWorkout();renderAll();syncControls();
    showToast(activeWorkoutKey==='R'?'回復日を記録しました':earned?`セッション完了。+${earned} XP`:'セッション完了。XPなし');
    if(before<100&&xp()>=100) setTimeout(()=>openDecision(false),120);
  };

  openLevelPanel = function(){
    const s=document.querySelector('#manualLevelSelect');
    s.innerHTML=levels.map(l=>`<option value="${l.n}" ${l.n===state.level?'selected':''}>Lv${l.n} · ${esc(l.name)}</option>`).join('');
    const p=document.querySelector('#levelPanel .muted'); if(p)p.textContent='ここで変更するのはXPを貯める「基準Lv」です。今日のトレーニングLvは画面上の「今日使うLv」から自由に選べます。';
    const head=document.querySelector('#levelPanel h2');if(head)head.textContent='基準Lv設定';
    document.querySelector('#levelBackdrop').hidden=false;document.querySelector('#levelPanel').hidden=false;
  };
  applyManualLevel = function(){
    const n=Number(document.querySelector('#manualLevelSelect').value);if(!n)return;
    state.level=n;state.unlockedLevel=Math.max(state.unlockedLevel,n);state.trainingLevel=n;state.levelStartedAt=todayISO();state.levelDecisionDismissed=0;
    save();closeLevelPanel();renderAll();syncControls();showToast(`基準LvをLv${n}に設定しました`);
  };

  // Rebind handlers that app.js stored by direct reference during init().
  document.querySelector('#completeWorkoutBtn').onclick=completeWorkout;
  document.querySelector('#levelUpBtn').onclick=levelUp;
  document.querySelector('#resetLevelBtn').onclick=openLevelPanel;
  document.querySelector('#applyManualLevelBtn').onclick=applyManualLevel;

  const style=document.createElement('style');
  style.textContent=`
    .training-controls{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:10px;margin:16px 0}.training-controls label,.training-control-status{display:grid;gap:5px;background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:10px;color:var(--muted);font-size:.78rem}.training-controls select{width:100%;padding:8px}.training-control-status strong{color:var(--accent);font-size:1.1rem}.training-control-status small{line-height:1.4}.level-card{cursor:pointer}.level-card .today-level-mark{display:inline-block;margin-top:8px;color:var(--accent);font-weight:900}.level-decision-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}@media(max-width:700px){.training-controls{grid-template-columns:1fr}.level-decision-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  ensureControls();
  renderAll();
  syncControls();
})();