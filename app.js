const STORAGE_KEY='calisthenicsTracker.v1';
const defaultState={history:[],baseline:{pullups:0,dips:0,pushups:0,deadHang:0,handstand:0,lsit:0},theme:'dark'};
const loaded=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{};
const state={
  history:Array.isArray(loaded.history)?loaded.history:[],
  baseline:{...defaultState.baseline,...(loaded.baseline||{})},
  theme:loaded.theme||'dark'
};

const workouts={
 A:{code:'DAY A',title:'Pull + Core',desc:'引く力と体幹。懸垂を最優先で伸ばす日。',items:[
  ['ウォームアップ','肩回し・肩甲骨・軽いラットプル','5分',''],
  ['アシスト懸垂','胸をバー方向へ。反動なし。','4 × 5–8','120'],
  ['シーテッドロー','肩をすくめず、肘を後ろへ。','3 × 8–12','90'],
  ['デッドハング','肩に痛みがない範囲でぶら下がる。','3 × 20–40秒','60'],
  ['ハンギング・ニー・レイズ','骨盤を丸めて膝を上げる。','3 × 8–12','90'],
  ['Tuck L-sit / Support hold','平行バーで肩を押し下げる。','4 × 10–20秒','60'],
  ['モビリティ','肩・広背筋・ハムストリング。','8分',''] ]},
 B:{code:'DAY B',title:'Push + Handstand',desc:'押す力と倒立の土台。肩と手首を丁寧に。',items:[
  ['ウォームアップ','手首・肩・肩甲骨。','6分',''],
  ['壁倒立','腹側または背中側。姿勢優先。','5 × 20–40秒','60'],
  ['アシストディップス','肩が前に抜けない深さまで。','4 × 5–8','120'],
  ['プッシュアップ','一直線を維持。','3 × 8–15','90'],
  ['パイクプッシュアップ','頭を前方へ下ろし肩で押す。','3 × 6–10','90'],
  ['サポートホールド','ディップバーで肘を伸ばして静止。','3 × 20–30秒','60'],
  ['モビリティ','手首・胸・肩のオーバーヘッド。','8分',''] ]},
 C:{code:'DAY C',title:'Legs + Mobility',desc:'片脚の強さと下半身可動域。ピストルスクワットの準備。',items:[
  ['ウォームアップ','足首・股関節・深いスクワット。','6分',''],
  ['レッグプレス','可動域を保てる重量。','4 × 8–12','120'],
  ['ブルガリアンスクワット','左右同じ回数。','3 × 8–10 / 脚','90'],
  ['アシスト・ピストルスクワット','支えを使い、ゆっくり下降。','3 × 5–8 / 脚','90'],
  ['カーフレイズ','最下部で伸ばす。','3 × 12–20','60'],
  ['Hollow body hold','腰を床から浮かせない。','4 × 20–30秒','60'],
  ['モビリティ','足首・股関節・ハムストリング。','12分',''] ]},
 D:{code:'DAY D',title:'Full Body + Skill',desc:'全身をつなげる日。筋力より技術を優先。',items:[
  ['ウォームアップ','手首・肩・股関節。','6分',''],
  ['壁倒立 / 倒立練習','失敗回数ではなく良い試技を積む。','10分','60'],
  ['懸垂系','Aより軽め。フォーム優先。','3 × 6–10','120'],
  ['ディップス系','Bより軽め。フォーム優先。','3 × 6–10','120'],
  ['L-sit progression','Tuck → one-leg → full。','5 × 8–20秒','60'],
  ['深い自重スクワット','コントロールして最大可動域。','3 × 12–20','60'],
  ['モビリティ・フロー','肩・背骨・股関節を連続で動かす。','12分',''] ]},
 M:{code:'OPTIONAL',title:'Mobility / Recovery',desc:'疲れていてもできる20分。追い込まない。',items:[
  ['手首','四つ這いで前後・左右へ荷重。','3分',''],
  ['肩','壁スライド・肩甲骨運動。','4分',''],
  ['胸椎','Cat-Cow・胸椎回旋。','3分',''],
  ['股関節','90/90・Cossack squat。','4分',''],
  ['ハムストリング','前屈を反動なしで。','3分',''],
  ['足首','膝をつま先方向へ前に出す。','3分',''] ]}
};

const weekly=[{key:'A',day:'目安 月'},{key:'B',day:'目安 水'},{key:'C',day:'目安 金'},{key:'D',day:'目安 日'}];
const skillDefs=[
 ['pullups','懸垂','10回','0→10回',10,'回'],['dips','ディップス','10回','0→10回',10,'回'],['deadHang','デッドハング','60秒','握力・肩の土台',60,'秒'],
 ['handstand','壁倒立','60秒','倒立の姿勢作り',60,'秒'],['lsit','L-sit','20秒','Tuckから進級',20,'秒'],['pushups','腕立て','30回','押す力の基礎',30,'回']
];

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function localDate(d=new Date()){return d.toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit'});}
function weekStart(d=new Date()){const x=new Date(d);const day=x.getDay();const diff=(day===0?-6:1-day);x.setDate(x.getDate()+diff);x.setHours(0,0,0,0);return x;}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function roundNice(v){if(v<=10)return Math.ceil(v);if(v<=50)return Math.ceil(v/5)*5;if(v<=200)return Math.ceil(v/10)*10;return Math.ceil(v/50)*50;}

function metricInfo(item){
  const p=item[2]||'';
  const setMatch=p.match(/^(\d+)\s*[×x]/i);
  const setCount=setMatch?Number(setMatch[1]):1;
  let unit='回';
  if(p.includes('秒'))unit='秒';
  else if(p.includes('分')&&!setMatch)unit='分';
  const perSide=/\/\s*脚/.test(p);
  return {setCount,unit,perSide};
}

function recommendedKey(){
  const strength=state.history.filter(h=>['A','B','C','D'].includes(h.key));
  if(!strength.length)return 'A';
  const last=strength[strength.length-1];
  const lastDate=new Date(last.iso);
  const now=new Date();
  if(lastDate.toDateString()===now.toDateString())return 'M';
  const order=['A','B','C','D'];
  return order[(order.indexOf(last.key)+1)%order.length];
}

function renderToday(){
  const key=recommendedKey(),w=workouts[key];
  document.querySelector('#todayLabel').textContent=`${localDate()} · ${w.code}`;
  document.querySelector('#todayTitle').textContent=w.title;
  document.querySelector('#todaySummary').textContent=w.desc;
  document.querySelector('#startTodayBtn').dataset.key=key;
}

function renderPlan(){
  const grid=document.querySelector('#planGrid');
  const rec=recommendedKey();
  grid.innerHTML=weekly.map(x=>{
    const w=workouts[x.key];
    return `<article class="plan-card ${rec===x.key?'active':''}" data-key="${x.key}">
      <span class="plan-code">${x.day} · ${w.code}</span>
      <h3>${w.title}</h3><p class="muted">${w.desc}</p>
      <ul>${w.items.slice(1,4).map(i=>`<li>${i[0]}</li>`).join('')}</ul>
    </article>`;
  }).join('');
  grid.querySelectorAll('.plan-card').forEach(el=>el.onclick=()=>openWorkout(el.dataset.key));
}

function renderSkills(){
  document.querySelector('#skillsGrid').innerHTML=skillDefs.map(([k,n,target,sub,max,u])=>{
    const v=Number(state.baseline[k]||0),pct=Math.min(100,Math.round(v/max*100));
    return `<article class="skill"><div class="skill-top"><h3>${n}</h3><strong>${v}${u}</strong></div>
      <div class="progress"><span style="width:${pct}%"></span></div><small>目標 ${target} · ${sub}</small></article>`;
  }).join('');
}

function renderStats(){
  document.querySelector('#sessionCount').textContent=state.history.length;
  const start=weekStart().getTime();
  const count=state.history.filter(h=>new Date(h.iso).getTime()>=start&&h.key!=='M').length;
  document.querySelector('#weekCount').textContent=`${count} / 4`;
  const weeks=new Set(state.history.filter(h=>h.key!=='M').map(h=>weekStart(new Date(h.iso)).toISOString().slice(0,10)));
  let streak=0,cursor=weekStart();
  while(weeks.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-7);}
  document.querySelector('#streakCount').textContent=streak;
}

function sessionResultSummary(h){
  if(!Array.isArray(h.results)||!h.results.length)return '';
  const tracked=h.results.filter(r=>Array.isArray(r.values)&&r.values.length);
  if(!tracked.length)return '';
  return ` · ${tracked.length}種目を数値記録`;
}

function renderHistory(){
  const root=document.querySelector('#history');
  if(!state.history.length){
    root.innerHTML='<div class="empty">まだ記録はありません。最初の1回を完了するとここに残ります。</div>';
    return;
  }
  root.innerHTML=[...state.history].reverse().slice(0,20).map(h=>`<div class="history-item">
    <div>${new Date(h.iso).toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}</div>
    <div><strong>${workouts[h.key]?.title||h.key}</strong><p>${h.done}/${h.total}項目完了${sessionResultSummary(h)}${h.notes?` · ${escapeHtml(h.notes)}`:''}</p></div>
    <span class="pill">${workouts[h.key]?.code||''}</span>
  </div>`).join('');
}

function allExerciseNames(){
  const names=[];
  Object.values(workouts).forEach(w=>w.items.forEach(i=>{if(!names.includes(i[0]))names.push(i[0]);}));
  state.history.forEach(h=>(h.results||[]).forEach(r=>{if(r.exercise&&!names.includes(r.exercise))names.push(r.exercise);}));
  return names;
}

function exerciseSeries(name){
  const rows=[];
  state.history.forEach(h=>{
    const r=(h.results||[]).find(x=>x.exercise===name&&Array.isArray(x.values)&&x.values.length);
    if(r){
      const vals=r.values.map(Number).filter(Number.isFinite);
      if(vals.length)rows.push({
        iso:h.iso,
        unit:r.unit||'',
        best:Number.isFinite(r.best)?r.best:Math.max(...vals),
        total:Number.isFinite(r.total)?r.total:vals.reduce((a,b)=>a+b,0),
        values:vals
      });
    }
  });
  return rows;
}

function renderProgressControls(){
  const select=document.querySelector('#progressExerciseSelect');
  const current=select.value;
  const names=allExerciseNames();
  select.innerHTML=names.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
  const withData=names.find(n=>exerciseSeries(n).length);
  if(current&&names.includes(current))select.value=current;
  else if(withData)select.value=withData;
  else if(names.length)select.value=names[0];
  renderProgressChart();
}

function renderProgressChart(){
  const name=document.querySelector('#progressExerciseSelect').value;
  const metric=document.querySelector('#progressMetricSelect').value;
  const rows=exerciseSeries(name);
  const chart=document.querySelector('#progressChart');
  const summary=document.querySelector('#progressSummary');

  if(!rows.length){
    summary.innerHTML='';
    chart.innerHTML='<div class="empty">この種目の数値記録はまだありません。トレーニング画面で各セットの実績を入力すると、ここに推移が表示されます。</div>';
    return;
  }

  const unit=rows[rows.length-1].unit||'';
  const values=rows.map(r=>r[metric]);
  const latest=values[values.length-1];
  const best=Math.max(...values);
  const first=values[0];
  const diff=latest-first;
  summary.innerHTML=`
    <article><span>最新</span><strong>${latest}${unit}</strong></article>
    <article><span>自己ベスト</span><strong>${best}${unit}</strong></article>
    <article><span>初回比</span><strong>${diff>0?'+':''}${diff}${unit}</strong></article>`;

  const W=860,H=300,padL=54,padR=20,padT=20,padB=46;
  const plotW=W-padL-padR,plotH=H-padT-padB;
  const ymax=Math.max(1,roundNice(Math.max(...values)*1.12));
  const points=rows.map((r,i)=>{
    const x=padL+(rows.length===1?plotW/2:(i/(rows.length-1))*plotW);
    const y=padT+plotH-(r[metric]/ymax)*plotH;
    return {x,y,row:r,v:r[metric]};
  });
  const grid=[];
  for(let i=0;i<=4;i++){
    const v=ymax*(4-i)/4;
    const y=padT+plotH*i/4;
    grid.push(`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" class="chart-grid-line"/>
      <text x="${padL-10}" y="${y+4}" text-anchor="end" class="chart-axis-text">${Number.isInteger(v)?v:v.toFixed(1)}</text>`);
  }
  const labelEvery=Math.max(1,Math.ceil(rows.length/6));
  const xLabels=points.map((p,i)=>{
    if(i%labelEvery!==0&&i!==points.length-1)return '';
    const d=new Date(p.row.iso);
    const label=d.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'});
    return `<text x="${p.x}" y="${H-16}" text-anchor="middle" class="chart-axis-text">${label}</text>`;
  }).join('');
  const poly=points.map(p=>`${p.x},${p.y}`).join(' ');
  const dots=points.map(p=>{
    const d=new Date(p.row.iso).toLocaleDateString('ja-JP');
    return `<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"><title>${d}: ${p.v}${unit}</title></circle>`;
  }).join('');

  chart.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(name)}の推移グラフ">
    ${grid.join('')}
    <line x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}" class="chart-axis"/>
    <polyline points="${poly}" class="chart-line"/>
    ${dots}${xLabels}
    <text x="${padL}" y="14" class="chart-unit">${escapeHtml(unit)}</text>
  </svg>`;
}

let currentKey='A';

function resultInputs(item,idx){
  const info=metricInfo(item);
  const sideNote=info.perSide?'（片脚あたり）':'';
  const inputs=Array.from({length:info.setCount},(_,setIdx)=>{
    const label=info.setCount>1?`Set ${setIdx+1}`:'実績';
    return `<label>${label}<input class="result-input" data-ex="${idx}" data-set="${setIdx}" type="number" min="0" step="1" inputmode="numeric" placeholder="${info.unit}"></label>`;
  }).join('');
  return `<div class="result-entry"><div class="result-entry-head"><span>今回の実績 ${sideNote}</span><strong>${info.unit}</strong></div><div class="set-inputs">${inputs}</div></div>`;
}

function openWorkout(key){
  currentKey=key;
  const w=workouts[key];
  document.querySelector('#workoutCode').textContent=w.code;
  document.querySelector('#workoutTitle').textContent=w.title;
  document.querySelector('#workoutDesc').textContent=w.desc;
  document.querySelector('#workoutNotes').value='';
  document.querySelector('#exerciseList').innerHTML=w.items.map((i,idx)=>`<article class="exercise">
    <div class="exercise-main">
      <input type="checkbox" id="ex${idx}">
      <label for="ex${idx}"><h3>${i[0]}</h3><p>${i[1]}</p></label>
      <div class="exercise-meta">${i[2]}</div>
    </div>
    ${resultInputs(i,idx)}
    ${i[3]?`<div class="exercise-tools"><button type="button" class="mini-btn timer-start" data-seconds="${i[3]}">休憩 ${Number(i[3])/60%1===0?Number(i[3])/60+'分':i[3]+'秒'}</button></div>`:''}
  </article>`).join('');
  document.querySelectorAll('.timer-start').forEach(b=>b.onclick=()=>openTimer(Number(b.dataset.seconds)));
  document.querySelectorAll('.result-input').forEach(inp=>inp.addEventListener('input',()=>{
    const ex=inp.dataset.ex;
    const any=[...document.querySelectorAll(`.result-input[data-ex="${ex}"]`)].some(x=>x.value!=='');
    document.querySelector(`#ex${ex}`).checked=any;
  }));
  document.querySelector('#workoutDialog').showModal();
}

function completeWorkout(){
  const w=workouts[currentKey];
  const boxes=[...document.querySelectorAll('#exerciseList input[type=checkbox]')];
  const results=w.items.map((item,idx)=>{
    const info=metricInfo(item);
    const values=[...document.querySelectorAll(`.result-input[data-ex="${idx}"]`)]
      .map(x=>x.value===''?null:Number(x.value))
      .filter(v=>Number.isFinite(v));
    if(!values.length)return null;
    return {
      exercise:item[0],
      prescription:item[2],
      unit:info.unit,
      values,
      best:Math.max(...values),
      total:values.reduce((a,b)=>a+b,0)
    };
  }).filter(Boolean);
  const done=boxes.filter(x=>x.checked).length;
  state.history.push({
    version:2,
    iso:new Date().toISOString(),
    key:currentKey,
    done,
    total:boxes.length,
    notes:document.querySelector('#workoutNotes').value.trim(),
    results
  });
  save();
  document.querySelector('#workoutDialog').close();
  renderAll();
}

function resetWorkoutInputs(){
  document.querySelectorAll('#exerciseList input[type=checkbox]').forEach(x=>x.checked=false);
  document.querySelectorAll('#exerciseList .result-input').forEach(x=>x.value='');
  document.querySelector('#workoutNotes').value='';
}

let timerId=null,timerLeft=90;
function openTimer(s){timerLeft=s;drawTimer();document.querySelector('#timerDialog').showModal();startTimer();}
function drawTimer(){const m=Math.floor(timerLeft/60),s=timerLeft%60;document.querySelector('#timerValue').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{timerLeft--;drawTimer();if(timerLeft<=0){clearInterval(timerId);if(navigator.vibrate)navigator.vibrate([200,100,200]);}},1000);}
function setTimer(s){timerLeft=s;drawTimer();startTimer();}

function editBaseline(){
  const f=document.querySelector('#baselineForm');
  Object.entries(state.baseline).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});
  document.querySelector('#baselineDialog').showModal();
}
function saveBaseline(){
  const f=new FormData(document.querySelector('#baselineForm'));
  for(const [k,v] of f.entries())state.baseline[k]=Number(v)||0;
  save();
  document.querySelector('#baselineDialog').close();
  renderSkills();
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`calisthenics-training-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function setTheme(t){state.theme=t;document.documentElement.classList.toggle('light',t==='light');save();}
function renderAll(){renderToday();renderPlan();renderSkills();renderStats();renderProgressControls();renderHistory();}

document.querySelector('#startTodayBtn').onclick=e=>openWorkout(e.currentTarget.dataset.key);
document.querySelector('#mobilityBtn').onclick=()=>openWorkout('M');
document.querySelector('#completeWorkoutBtn').onclick=completeWorkout;
document.querySelector('#resetChecksBtn').onclick=resetWorkoutInputs;
document.querySelector('#editBaselineBtn').onclick=editBaseline;
document.querySelector('#saveBaselineBtn').onclick=saveBaseline;
document.querySelector('#exportBtn').onclick=exportData;
document.querySelector('#themeBtn').onclick=()=>setTheme(state.theme==='light'?'dark':'light');
document.querySelector('#progressExerciseSelect').onchange=renderProgressChart;
document.querySelector('#progressMetricSelect').onchange=renderProgressChart;
document.querySelectorAll('.timer-actions button').forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.seconds)));
document.querySelector('#timerClose').onclick=()=>{clearInterval(timerId);document.querySelector('#timerDialog').close();};

setTheme(state.theme||'dark');
renderAll();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
