const STORAGE_KEY='calisthenicsTracker.v1';
const state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{history:[],baseline:{pullups:0,dips:0,pushups:0,deadHang:0,handstand:0,lsit:0},theme:'dark'};

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
function recommendedKey(){const strength=state.history.filter(h=>['A','B','C','D'].includes(h.key));if(!strength.length)return 'A';const last=strength[strength.length-1];const lastDate=new Date(last.iso);const now=new Date();if(lastDate.toDateString()===now.toDateString())return 'M';const order=['A','B','C','D'];return order[(order.indexOf(last.key)+1)%order.length];}
function renderToday(){const key=recommendedKey(),w=workouts[key];document.querySelector('#todayLabel').textContent=`${localDate()} · ${w.code}`;document.querySelector('#todayTitle').textContent=w.title;document.querySelector('#todaySummary').textContent=w.desc;document.querySelector('#startTodayBtn').dataset.key=key;}
function renderPlan(){const grid=document.querySelector('#planGrid');const rec=recommendedKey();grid.innerHTML=weekly.map(x=>{const w=workouts[x.key];return `<article class="plan-card ${rec===x.key?'active':''}" data-key="${x.key}"><span class="plan-code">${x.day} · ${w.code}</span><h3>${w.title}</h3><p class="muted">${w.desc}</p><ul>${w.items.slice(1,4).map(i=>`<li>${i[0]}</li>`).join('')}</ul></article>`}).join('');grid.querySelectorAll('.plan-card').forEach(el=>el.onclick=()=>openWorkout(el.dataset.key));}
function renderSkills(){document.querySelector('#skillsGrid').innerHTML=skillDefs.map(([k,n,target,sub,max,u])=>{const v=Number(state.baseline[k]||0),pct=Math.min(100,Math.round(v/max*100));return `<article class="skill"><div class="skill-top"><h3>${n}</h3><strong>${v}${u}</strong></div><div class="progress"><span style="width:${pct}%"></span></div><small>目標 ${target} · ${sub}</small></article>`}).join('');}
function renderStats(){document.querySelector('#sessionCount').textContent=state.history.length;const start=weekStart().getTime();const count=state.history.filter(h=>new Date(h.iso).getTime()>=start&&h.key!=='M').length;document.querySelector('#weekCount').textContent=`${count} / 4`;
 const weeks=new Set(state.history.filter(h=>h.key!=='M').map(h=>weekStart(new Date(h.iso)).toISOString().slice(0,10)));let streak=0;let cursor=weekStart();while(weeks.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-7)}document.querySelector('#streakCount').textContent=streak;}
function renderHistory(){const root=document.querySelector('#history');if(!state.history.length){root.innerHTML='<div class="empty">まだ記録はありません。最初の1回を完了するとここに残ります。</div>';return}root.innerHTML=[...state.history].reverse().slice(0,20).map(h=>`<div class="history-item"><div>${new Date(h.iso).toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}</div><div><strong>${workouts[h.key]?.title||h.key}</strong><p>${h.done}/${h.total}項目完了${h.notes?` · ${escapeHtml(h.notes)}`:''}</p></div><span class="pill">${workouts[h.key]?.code||''}</span></div>`).join('');}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
let currentKey='A';
function openWorkout(key){currentKey=key;const w=workouts[key];document.querySelector('#workoutCode').textContent=w.code;document.querySelector('#workoutTitle').textContent=w.title;document.querySelector('#workoutDesc').textContent=w.desc;document.querySelector('#workoutNotes').value='';document.querySelector('#exerciseList').innerHTML=w.items.map((i,idx)=>`<article class="exercise"><div class="exercise-main"><input type="checkbox" id="ex${idx}"><label for="ex${idx}"><h3>${i[0]}</h3><p>${i[1]}</p></label><div class="exercise-meta">${i[2]}</div></div>${i[3]?`<div class="exercise-tools"><button type="button" class="mini-btn timer-start" data-seconds="${i[3]}">休憩 ${Number(i[3])/60%1===0?Number(i[3])/60+'分':i[3]+'秒'}</button></div>`:''}</article>`).join('');document.querySelectorAll('.timer-start').forEach(b=>b.onclick=()=>openTimer(Number(b.dataset.seconds)));document.querySelector('#workoutDialog').showModal();}
function completeWorkout(){const boxes=[...document.querySelectorAll('#exerciseList input[type=checkbox]')];const done=boxes.filter(x=>x.checked).length;state.history.push({iso:new Date().toISOString(),key:currentKey,done,total:boxes.length,notes:document.querySelector('#workoutNotes').value.trim()});save();document.querySelector('#workoutDialog').close();renderAll();}
let timerId=null,timerLeft=90;
function openTimer(s){timerLeft=s;drawTimer();document.querySelector('#timerDialog').showModal();startTimer();}
function drawTimer(){const m=Math.floor(timerLeft/60),s=timerLeft%60;document.querySelector('#timerValue').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{timerLeft--;drawTimer();if(timerLeft<=0){clearInterval(timerId);if(navigator.vibrate)navigator.vibrate([200,100,200]);}},1000)}
function setTimer(s){timerLeft=s;drawTimer();startTimer();}
function editBaseline(){const f=document.querySelector('#baselineForm');Object.entries(state.baseline).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v});document.querySelector('#baselineDialog').showModal();}
function saveBaseline(){const f=new FormData(document.querySelector('#baselineForm'));for(const [k,v] of f.entries())state.baseline[k]=Number(v)||0;save();document.querySelector('#baselineDialog').close();renderSkills();}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`calisthenics-training-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
function setTheme(t){state.theme=t;document.documentElement.classList.toggle('light',t==='light');save();}
function renderAll(){renderToday();renderPlan();renderSkills();renderStats();renderHistory();}

document.querySelector('#startTodayBtn').onclick=e=>openWorkout(e.currentTarget.dataset.key);
document.querySelector('#mobilityBtn').onclick=()=>openWorkout('M');document.querySelector('#completeWorkoutBtn').onclick=completeWorkout;document.querySelector('#resetChecksBtn').onclick=()=>document.querySelectorAll('#exerciseList input[type=checkbox]').forEach(x=>x.checked=false);document.querySelector('#editBaselineBtn').onclick=editBaseline;document.querySelector('#saveBaselineBtn').onclick=saveBaseline;document.querySelector('#exportBtn').onclick=exportData;document.querySelector('#themeBtn').onclick=()=>setTheme(state.theme==='light'?'dark':'light');document.querySelectorAll('.timer-actions button').forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.seconds)));document.querySelector('#timerClose').onclick=()=>{clearInterval(timerId);document.querySelector('#timerDialog').close()};
setTheme(state.theme||'dark');renderAll();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
