const STORAGE_KEY='calisthenicsTracker.v1';
const LEGACY=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{};
const todayISO=()=>new Date().toISOString();
const state={
  history:Array.isArray(LEGACY.history)?LEGACY.history:[],
  baseline:LEGACY.baseline||{},
  theme:LEGACY.theme||'dark',
  level:Number(LEGACY.level||1),
  levelStartedAt:LEGACY.levelStartedAt||todayISO(),
  unlockedLevel:Number(LEGACY.unlockedLevel||LEGACY.level||1)
};
state.level=Math.max(1,Math.min(15,state.level));
state.unlockedLevel=Math.max(state.level,Math.min(15,state.unlockedLevel));

const levels=[
  {n:1,name:'Reboot',phase:'Foundation',desc:'数年ぶりの継続トレーニングに身体を戻す。マシン中心でフォームと回復力を作る。',mainSets:2,secondarySets:2,accessorySets:2,coreSets:2,mainReps:'10–15',secondaryReps:'10–15',accessoryReps:'12–15',rir:'3',finisher:'なし〜4分'},
  {n:2,name:'Foundation+',phase:'Foundation',desc:'Lv1の種目を維持しながら、主要種目のセット数を少し増やす。',mainSets:3,secondarySets:2,accessorySets:2,coreSets:2,mainReps:'10–15',secondaryReps:'10–15',accessoryReps:'12–15',rir:'3',finisher:'4分'},
  {n:3,name:'Base I',phase:'Base',desc:'8〜12回帯へ移行し、筋肥大向けの標準的な負荷に慣れる。',mainSets:3,secondarySets:3,accessorySets:2,coreSets:2,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'12–15',rir:'2–3',finisher:'4分'},
  {n:4,name:'Base II',phase:'Base',desc:'全身の週間ボリュームを増やす。フォームを崩さず前回より1回か少し重く。',mainSets:3,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'2',finisher:'4〜6分'},
  {n:5,name:'Boss I',phase:'Checkpoint',desc:'最初のチェックポイント。重量を無理に跳ね上げず、ベストセットを更新する。',mainSets:3,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
  {n:6,name:'Growth I',phase:'Hypertrophy',desc:'主要種目の一部を4セットに。全身の筋肉量を増やすフェーズへ。',mainSets:4,secondarySets:3,accessorySets:2,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'2',finisher:'4分'},
  {n:7,name:'Growth II',phase:'Hypertrophy',desc:'高品質なセット数を増やしつつ、補助種目は短くまとめる。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4〜6分'},
  {n:8,name:'Growth III',phase:'Hypertrophy',desc:'同じ回数帯で少し重い重量を扱う。毎セット失敗までは行かない。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'7–11',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
  {n:9,name:'Strength Size I',phase:'Strength + Size',desc:'最初の主要種目だけ6〜10回帯へ。筋力と筋肥大を両立する。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4分'},
  {n:10,name:'Boss II',phase:'Checkpoint',desc:'主要種目の重量更新を狙う第2チェックポイント。フォーム優先。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
  {n:11,name:'Density I',phase:'Density',desc:'補助種目をスーパーセットで短時間にまとめ、同じ時間で高品質な量をこなす。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4分'},
  {n:12,name:'Density II',phase:'Density',desc:'主要種目の質を保ちながら、全身の総セット数を安定させる。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4〜6分'},
  {n:13,name:'Mastery I',phase:'Mastery',desc:'重量・可動域・コントロールを同時に伸ばす。反動で数字だけを増やさない。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–9',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'4分'},
  {n:14,name:'Mastery II',phase:'Mastery',desc:'週間ボリュームの上限付近。回復が悪い日は1セット減らしてよい。',mainSets:4,secondarySets:4,accessorySets:4,coreSets:3,mainReps:'6–9',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'4〜6分'},
  {n:15,name:'Boss III',phase:'Endgame',desc:'Lv15。主要種目のベストを更新しつつ、継続可能な全身プログラムとして回す。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'5–8',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'6分'}
];

const exerciseDB={
  'チェストプレス':{muscle:'胸・三頭筋',guide:'座ってバーを前へ押す胸の基本マシン。肩をすくめず、胸を軽く張る。押すときは力強く、戻すときは2〜3秒かけてコントロール。',q:'chest press machine exercise proper form'},
  'インクラインチェストプレス':{muscle:'上胸・三頭筋',guide:'少し斜め上へ押すチェストプレス。上胸と肩前部を使う。腰を大きく反らさず、肩甲骨をシートへ安定させる。',q:'incline chest press machine exercise form'},
  'ラットプルダウン':{muscle:'広背筋・二頭筋',guide:'頭上のバーを胸上部へ引く背中の基本種目。胸を軽く上げ、肘を下へ引く。バーを首の後ろへ下ろさない。',q:'lat pulldown machine proper form'},
  'シーテッドロー':{muscle:'背中・二頭筋',guide:'座ってハンドルを手前へ引く。肩をすくめず、肘を後ろへ。戻すときも背中が丸まりすぎない範囲でコントロールする。',q:'seated row machine proper form'},
  'ハイロー':{muscle:'広背筋・上背部',guide:'頭上〜前方の左右ハンドルを下方向へ引くマシン。肘を腰方向へ引き、肩をすくめない。',q:'high row machine exercise proper form'},
  'ショルダープレス':{muscle:'肩・三頭筋',guide:'座ってハンドルを頭上へ押す。腰を反りすぎず、肘を真横より少し前に置くと肩に優しい。',q:'shoulder press machine exercise form'},
  'ラテラルレイズ':{muscle:'肩の横',guide:'ダンベルまたはマシンで腕を横へ上げる。肩をすくめず、反動を使わず肩の高さ付近まで。',q:'lateral raise exercise proper form'},
  'リアデルトフライ':{muscle:'肩後部・上背部',guide:'ペックデックを逆向きに使うなどして腕を後ろへ開く。肩甲骨を強く寄せすぎず、肩の後ろで動かす。',q:'rear delt fly machine exercise form'},
  'ペックフライ':{muscle:'胸',guide:'腕を開いた位置から前へ閉じる胸の補助種目。肩を前へ突き出さず、無理に深く開きすぎない。',q:'pec deck fly machine exercise form'},
  'トライセプスプレスダウン':{muscle:'上腕三頭筋',guide:'ケーブルを肘を固定したまま下へ押す。肩ではなく肘の曲げ伸ばしで動かす。',q:'triceps pressdown cable proper form'},
  'バイセプスカール':{muscle:'上腕二頭筋',guide:'肘を大きく前後させず、前腕を曲げて上腕二頭筋を縮める。反動で身体を振らない。',q:'biceps curl machine proper form'},
  'レッグプレス':{muscle:'大腿四頭筋・臀部',guide:'足裏でプレートを押す。膝とつま先を同じ方向へ。腰がシートから浮くほど深く下ろさない。',q:'leg press machine proper form'},
  'ハックスクワット / レッグプレス':{muscle:'大腿四頭筋・臀部',guide:'ハックスクワットがあれば使い、なければレッグプレスでOK。膝とつま先の向きを揃え、可動域をコントロールする。',q:'hack squat machine proper form'},
  'レッグカール':{muscle:'ハムストリング',guide:'膝を曲げて太ももの裏を鍛えるマシン。腰を浮かせず、戻すときに重りを落とさない。',q:'seated leg curl machine exercise form'},
  'レッグエクステンション':{muscle:'大腿四頭筋',guide:'膝を伸ばして太ももの前を鍛える。勢いで蹴り上げず、上で一瞬止めてゆっくり戻す。',q:'leg extension machine proper form'},
  'ヒップスラスト / グルートドライブ':{muscle:'臀部',guide:'背中を支えた状態で股関節を伸ばし、お尻で身体を持ち上げる。上で腰を反るのではなく臀部を締める。',q:'hip thrust glute drive machine form'},
  'ブルガリアンスクワット':{muscle:'脚・臀部',guide:'後ろ足をベンチに乗せ、前脚中心でしゃがむ。最初は自重でも十分。左右同じ回数。',q:'Bulgarian split squat proper form'},
  'ルーマニアンデッドリフト':{muscle:'ハムストリング・臀部',guide:'膝を少し曲げ、背中をまっすぐ保って股関節を後ろへ引く。腰で持ち上げる種目ではない。Lv6以降でフォームに不安があればスタッフに確認。',q:'Romanian deadlift dumbbell proper form'},
  'カーフレイズ':{muscle:'ふくらはぎ',guide:'かかとを下げてからつま先立ち。反動で跳ねず、上でも下でもコントロールする。',q:'calf raise machine exercise proper form'},
  'レッグプレス・カーフレイズ':{muscle:'ふくらはぎ',guide:'レッグプレスのプレートに足の前半分を置き、膝をほぼ固定したまま足首だけを動かす。かかとをゆっくり下げてふくらはぎを伸ばし、つま先で押して最大まで上げる。足が滑らない位置を使い、膝をロックし切らない。',q:'leg press calf raise proper form'},
  'アブドミナルクランチ':{muscle:'腹筋',guide:'肋骨を骨盤へ近づけるように身体を丸める腹筋マシン。腕や腰で押し込まず、お腹を縮める。',q:'abdominal crunch machine proper form'},
  'リバースクランチ':{muscle:'腹筋',guide:'仰向けで膝を胸へ近づけ、最後に骨盤を少し床から持ち上げる。脚を振らず腹筋で丸める。',q:'reverse crunch proper form'},
  'デッドバグ':{muscle:'体幹',guide:'腰を床へ軽く押し付けたまま脚を交互に伸ばす。腰が浮くなら脚を遠くまで伸ばさない。',q:'dead bug exercise proper form'},
  'アシスト懸垂':{muscle:'背中・二頭筋',guide:'補助付き懸垂。アシスト重量は大きいほど楽。反動なしで胸をバー方向へ近づける。',q:'assisted pull up machine proper form'},
  'アシストディップス':{muscle:'胸・三頭筋',guide:'補助付きディップス。肩に違和感が出ない深さまで下がって押し戻す。アシスト重量は大きいほど楽。',q:'assisted dip machine proper form'},
  'ウォームアップ':{muscle:'全身',guide:'3〜5分だけ軽く歩くか自転車。その後、最初の主要種目を軽い重量で1〜2セット。長い有酸素は不要。',q:'gym dynamic warm up resistance training'},
  'ショートフィニッシャー':{muscle:'心肺',guide:'任意。合計4〜6分だけ。30秒少し速め→60秒ゆっくりを繰り返す。筋肥大の主役ではないので疲れていたら省略。',q:'short interval treadmill workout gym'}
};

const templates={
  A:{code:'UPPER A',title:'上半身 A',desc:'胸・背中・肩・腕をバランスよく。',items:[
    ['ウォームアップ','warm'],['チェストプレス','main'],['ラットプルダウン','main'],['ショルダープレス','secondary'],['シーテッドロー','secondary'],['ラテラルレイズ','accessory'],['トライセプスプレスダウン','accessory'],['バイセプスカール','accessory'],['ショートフィニッシャー','finisher']
  ]},
  B:{code:'LOWER A',title:'下半身 A + 腹筋',desc:'太もも前後・臀部・ふくらはぎ・腹筋。',items:[
    ['ウォームアップ','warm'],['レッグプレス','main'],['レッグカール','main'],['レッグエクステンション','secondary'],['ヒップスラスト / グルートドライブ','secondary'],['カーフレイズ','accessory'],['アブドミナルクランチ','core'],['デッドバグ','core'],['ショートフィニッシャー','finisher']
  ]},
  C:{code:'UPPER B',title:'上半身 B',desc:'角度を変えて胸・背中・肩・腕をもう一度。',items:[
    ['ウォームアップ','warm'],['インクラインチェストプレス','main'],['ハイロー','main'],['アシスト懸垂','secondary'],['ペックフライ','secondary'],['リアデルトフライ','accessory'],['トライセプスプレスダウン','accessory'],['バイセプスカール','accessory'],['ショートフィニッシャー','finisher']
  ]},
  D:{code:'LOWER B',title:'下半身 B + 腹筋',desc:'脚・臀部・体幹を別パターンで刺激。',items:[
    ['ウォームアップ','warm'],['ハックスクワット / レッグプレス','main'],['ブルガリアンスクワット','secondary'],['レッグカール','secondary'],['ルーマニアンデッドリフト','secondary'],['カーフレイズ','accessory'],['リバースクランチ','core'],['アブドミナルクランチ','core'],['ショートフィニッシャー','finisher']
  ]},
  R:{code:'RECOVERY',title:'回復日',desc:'長い有酸素はせず、15〜25分だけ軽く動く。XP対象外。',items:[
    ['ウォームアップ','recovery'],['デッドバグ','recovery'],['リバースクランチ','recovery'],['ショートフィニッシャー','recovery']
  ]}
};

const levelInfo=()=>levels[state.level-1];
const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const localDate=d=>new Date(d||Date.now()).toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit'});
const daysSince=iso=>Math.floor((Date.now()-new Date(iso).getTime())/86400000);
const weekStart=(d=new Date())=>{const x=new Date(d);const day=x.getDay();x.setDate(x.getDate()+(day===0?-6:1-day));x.setHours(0,0,0,0);return x;};

function sessionLevelCount(){return state.history.filter(h=>h.level===state.level&&['A','B','C','D'].includes(h.key)&&new Date(h.iso)>=new Date(state.levelStartedAt)).length;}
function xp(){return Math.min(100,sessionLevelCount()*25);}
function canLevelUp(){return state.level<15&&sessionLevelCount()>=4&&daysSince(state.levelStartedAt)>=7;}
function levelUpHint(){
  if(state.level===15)return '最大レベル。ここからは重量・回数・フォームの自己ベスト更新を続ける。';
  const sessions=sessionLevelCount(),days=daysSince(state.levelStartedAt);
  const needSessions=Math.max(0,4-sessions),needDays=Math.max(0,7-days);
  if(canLevelUp())return '条件達成。次のレベルへ進めます。';
  const bits=[];if(needSessions)bits.push(`あと${needSessions}セッション`);if(needDays)bits.push(`あと${needDays}日`);return `Lvアップまで ${bits.join('・')}。急ぐ必要はなく、1〜2週間で進級する設計です。`;
}

function prescription(role){
  const l=levelInfo();
  if(role==='warm')return {sets:'3〜5分',reps:'＋軽い準備セット',rest:'—'};
  if(role==='finisher')return {sets:l.finisher,reps:'任意・短時間',rest:'—'};
  if(role==='recovery')return {sets:'2',reps:'楽に10〜15回',rest:'30〜60秒'};
  if(role==='main')return {sets:l.mainSets,reps:l.mainReps,rest:'2〜3分'};
  if(role==='secondary')return {sets:l.secondarySets,reps:l.secondaryReps,rest:'90〜120秒'};
  if(role==='accessory')return {sets:l.accessorySets,reps:l.accessoryReps,rest:'60〜90秒'};
  if(role==='core')return {sets:l.coreSets,reps:'10〜15回',rest:'60〜90秒'};
  return {sets:2,reps:'10〜15回',rest:'60〜90秒'};
}

function adjustedItems(key){
  const list=templates[key].items.map(([name,role])=>({name,role,...prescription(role)}));
  if(key==='D'&&state.level<6)return list.filter(x=>x.name!=='ルーマニアンデッドリフト');
  if(key==='C'&&state.level<3)return list.filter(x=>x.name!=='アシスト懸垂');
  if(state.level<4)return list.filter(x=>x.name!=='ショートフィニッシャー');
  return list;
}

function strengthHistoryForCurrentLevel(){return state.history.filter(h=>h.level===state.level&&['A','B','C','D'].includes(h.key)&&new Date(h.iso)>=new Date(state.levelStartedAt));}
function recommendedKey(){
  const h=strengthHistoryForCurrentLevel();
  if(!h.length)return 'A';
  const order=['A','B','C','D'];
  return order[(order.indexOf(h[h.length-1].key)+1)%4];
}

function renderHero(){
  const l=levelInfo(),key=recommendedKey(),w=templates[key],value=xp();
  document.querySelector('#heroLevel').textContent=`LV ${state.level}`;
  document.querySelector('#heroPhase').textContent=l.phase;
  document.querySelector('#todayLabel').textContent=`${localDate()} · ${w.code}`;
  document.querySelector('#todayTitle').textContent=w.title;
  document.querySelector('#todaySummary').textContent=`${w.desc} Lv${state.level}設定：主要 ${l.mainSets}セット / RIR ${l.rir}`;
  document.querySelector('#startTodayBtn').dataset.key=key;
  document.querySelector('#xpFill').style.width=`${value}%`;
  document.querySelector('#xpText').textContent=`${value} / 100 XP`;
  document.querySelector('#levelHint').textContent=levelUpHint();
  document.querySelector('#levelUpBtn').disabled=!canLevelUp();
}

function renderLevelSummary(){
  const l=levelInfo();
  document.querySelector('#levelTitle').textContent=`Lv${l.n} · ${l.name}`;
  document.querySelector('#levelDescription').textContent=l.desc;
  document.querySelector('#levelRules').innerHTML=[
    ['主要種目',`${l.mainSets}セット × ${l.mainReps}`],
    ['補助種目',`${l.secondarySets}〜${l.accessorySets}セット`],
    ['余力',`RIR ${l.rir}`],
    ['有酸素',`${l.finisher}のみ`]
  ].map(x=>`<div class="rule"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
}

function renderStats(){
  document.querySelector('#currentLevelStat').textContent=`${state.level} / 15`;
  document.querySelector('#levelSessionCount').textContent=`${sessionLevelCount()} / 4`;
  const ws=weekStart().getTime();
  const count=state.history.filter(h=>['A','B','C','D'].includes(h.key)&&new Date(h.iso).getTime()>=ws).length;
  document.querySelector('#weekCount').textContent=`${count} / 4`;
  const weeks=new Set(state.history.filter(h=>['A','B','C','D'].includes(h.key)).map(h=>weekStart(new Date(h.iso)).toISOString().slice(0,10)));
  let streak=0,cursor=weekStart();while(weeks.has(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-7);}document.querySelector('#streakCount').textContent=streak;
}

function renderPlan(){
  const rec=recommendedKey();
  document.querySelector('#planGrid').innerHTML=['A','B','C','D'].map(k=>{
    const w=templates[k],items=adjustedItems(k).filter(x=>!['ウォームアップ','ショートフィニッシャー'].includes(x.name));
    return `<article class="plan-card ${k===rec?'active':''}" data-key="${k}"><span class="plan-code">${w.code}</span><h3>${w.title}</h3><p class="muted">${w.desc}</p><ul>${items.slice(0,4).map(i=>`<li>${esc(i.name)} · ${i.sets}×${i.reps}</li>`).join('')}</ul></article>`;
  }).join('');
  document.querySelectorAll('.plan-card').forEach(x=>x.onclick=()=>openWorkout(x.dataset.key));
}

function renderLevelGrid(){
  document.querySelector('#levelGrid').innerHTML=levels.map(l=>{
    const status=l.n<state.level?'done':l.n===state.level?'current':l.n<=state.unlockedLevel?'':'locked';
    return `<article class="level-card ${status}"><span class="lv">LV ${l.n}</span>${status==='locked'?'<span class="lock">LOCK</span>':''}<h3>${esc(l.name)}</h3><p>${esc(l.phase)} · 主要${l.mainSets}セット · RIR ${esc(l.rir)}</p></article>`;
  }).join('');
}

function allTrackedNames(){
  const s=new Set();
  Object.keys(templates).forEach(k=>adjustedItems(k).forEach(x=>{if(!['warm','finisher','recovery'].includes(x.role))s.add(x.name);}));
  state.history.forEach(h=>(h.results||[]).forEach(r=>r.exercise&&s.add(r.exercise)));
  return [...s];
}
function seriesFor(name){
  const assisted=['アシスト懸垂','アシストディップス'].includes(name);
  return state.history.flatMap(h=>{
    const r=(h.results||[]).find(x=>x.exercise===name);
    if(!r)return[];
    const weight=Number(r.weight||0),reps=Number(r.reps||r.best||0);
    const value=assisted&&weight>0?weight:(weight>0?weight:reps);
    if(!Number.isFinite(value)||value<=0)return[];
    return[{iso:h.iso,value,unit:assisted&&weight>0?'補助kg':(weight>0?'kg':'回'),reps,level:h.level||null,assisted}];
  });
}
function renderProgressControls(){
  const sel=document.querySelector('#progressExerciseSelect'),old=sel.value,names=allTrackedNames();
  sel.innerHTML=names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  if(old&&names.includes(old))sel.value=old;else{const d=names.find(n=>seriesFor(n).length);if(d)sel.value=d;}
  renderProgressChart();
}
function renderProgressChart(){
  const name=document.querySelector('#progressExerciseSelect').value,rows=seriesFor(name),chart=document.querySelector('#progressChart'),summary=document.querySelector('#progressSummary');
  if(!rows.length){summary.innerHTML='';chart.innerHTML='<div class="empty">まだ記録がありません。各セッションの最後に、残したい種目だけ重量とベスト回数を入力してください。</div>';return;}
  const values=rows.map(r=>r.value),latest=rows.at(-1),first=values[0],isAssist=latest.assisted&&latest.unit==='補助kg';
  const best=isAssist?Math.min(...values):Math.max(...values),diff=latest.value-first;
  summary.innerHTML=`<article><span>最新</span><strong>${latest.value}${latest.unit}${latest.reps?` × ${latest.reps}回`:''}</strong></article><article><span>${isAssist?'最小補助':'最高'}</span><strong>${best}${latest.unit}</strong></article><article><span>初回比</span><strong>${diff>0?'+':''}${diff}${latest.unit}</strong></article>`;
  const W=860,H=280,pL=54,pR=20,pT=20,pB=44,pW=W-pL-pR,pH=H-pT-pB,max=Math.max(...values),yMax=Math.max(1,Math.ceil(max*1.15/5)*5);
  const pts=rows.map((r,i)=>({x:pL+(rows.length===1?pW/2:i/(rows.length-1)*pW),y:pT+pH-r.value/yMax*pH,r}));
  const grid=[];for(let i=0;i<=4;i++){const v=yMax*(4-i)/4,y=pT+pH*i/4;grid.push(`<line x1="${pL}" y1="${y}" x2="${W-pR}" y2="${y}" class="chart-grid-line"/><text x="${pL-8}" y="${y+4}" text-anchor="end" class="chart-axis-text">${Number.isInteger(v)?v:v.toFixed(1)}</text>`)}
  const labels=pts.map((p,i)=>i%Math.max(1,Math.ceil(rows.length/6))===0||i===pts.length-1?`<text x="${p.x}" y="${H-15}" text-anchor="middle" class="chart-axis-text">${new Date(p.r.iso).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}</text>`:'').join('');
  chart.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img"><g>${grid.join('')}</g><polyline points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" class="chart-line"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"><title>${p.r.value}${p.r.unit}${p.r.reps&&p.r.unit==='kg'?` × ${p.r.reps}回`:''}</title></circle>`).join('')}${labels}<text x="12" y="18" class="chart-unit">${latest.unit}</text></svg>`;
}

function renderHistory(){
  const root=document.querySelector('#history');
  if(!state.history.length){root.innerHTML='<div class="empty">まだ記録はありません。</div>';return;}
  root.innerHTML=[...state.history].reverse().slice(0,30).map(h=>{
    const w=templates[h.key];const results=(h.results||[]).filter(r=>Number(r.weight)>0||Number(r.reps)>0||Number(r.best)>0);
    return `<div class="history-item"><div>${new Date(h.iso).toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}</div><div><strong>${w?.title||h.key}${h.level?` · Lv${h.level}`:''}</strong><p>${results.length?`${results.length}種目をベスト記録`:''}${h.notes?`${results.length?' · ':''}${esc(h.notes)}`:''}</p></div><span class="pill">${w?.code||''}</span></div>`;
  }).join('');
}

function googleImageUrl(q,embedded=false){const p=new URLSearchParams({tbm:'isch',q,hl:'ja'});if(embedded)p.set('igu','1');return `https://www.google.com/search?${p}`;}
function guideHTML(name){
  const d=exerciseDB[name]||{muscle:'',guide:'フォームを崩さず、痛みのない範囲で行います。',q:`${name} exercise proper form`};
  const imageUrl=googleImageUrl(d.q,true);
  return `<details class="exercise-guide"><summary>やり方・用語説明</summary><p>${esc(d.guide)}</p><div class="google-images-box" data-query="${esc(d.q)}"><div class="google-images-head"><div><strong>Google Images</strong><span>${esc(d.q)}</span></div><a href="${googleImageUrl(d.q)}" target="_blank" rel="noopener noreferrer">別タブで開く</a></div><div class="google-images-frame-wrap"><iframe class="google-images-frame" src="${esc(imageUrl)}" title="Google画像検索：${esc(d.q)}" loading="eager" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div></details>`;
}

let activeWorkoutKey=null;
function openWorkout(key){
  activeWorkoutKey=key;const w=templates[key],items=adjustedItems(key),l=levelInfo();
  document.querySelector('#workoutCode').textContent=`${w.code} · LV ${state.level}`;
  document.querySelector('#workoutTitle').textContent=w.title;
  document.querySelector('#workoutDesc').textContent=`${w.desc} 基本はRIR ${l.rir}。フォームが崩れる前に止める。`;
  document.querySelector('#exerciseList').innerHTML=items.map((x,i)=>{
    const d=exerciseDB[x.name]||{};const isTrack=!['warm','finisher','recovery'].includes(x.role);
    const bodyweight=['アシスト懸垂','アシストディップス','ブルガリアンスクワット','デッドバグ','リバースクランチ'].includes(x.name);
    return `<article class="exercise" data-index="${i}" data-name="${esc(x.name)}"><div class="exercise-main"><div><h3>${esc(x.name)}</h3><p>${esc(d.muscle||'')}</p><div class="exercise-tags"><span class="tag">${esc(x.role)}</span>${x.role!=='warm'&&x.role!=='finisher'&&x.role!=='recovery'?`<span class="tag">RIR ${esc(l.rir)}</span>`:''}</div></div><div class="exercise-meta"><strong>${esc(String(x.sets))} × ${esc(String(x.reps))}</strong><span>休憩 ${esc(x.rest)}</span></div></div>${guideHTML(x.name)}${isTrack?`<div class="quick-log"><span>終了後だけ入力（任意）</span><label>${bodyweight?'補助/負荷 kg':'重量 kg'}<input class="log-weight" type="number" min="0" step="0.5" inputmode="decimal" placeholder="例 25"></label><label>ベスト回数<input class="log-reps" type="number" min="0" step="1" inputmode="numeric" placeholder="例 10"></label></div>`:''}</article>`;
  }).join('');
  document.querySelector('#workoutNotes').value='';
  document.querySelector('#completeWorkoutBtn').textContent=key==='R'?'回復日を記録':'セッション完了 +25 XP';
  document.querySelector('#workoutBackdrop').hidden=false;document.querySelector('#workoutPanel').hidden=false;document.body.style.overflow='hidden';

}
function closeWorkout(){document.querySelector('#workoutBackdrop').hidden=true;document.querySelector('#workoutPanel').hidden=true;document.body.style.overflow='';}
function completeWorkout(){
  if(!activeWorkoutKey)return;const results=[];
  document.querySelectorAll('#exerciseList .exercise').forEach(el=>{const weight=Number(el.querySelector('.log-weight')?.value||0),reps=Number(el.querySelector('.log-reps')?.value||0);if(weight>0||reps>0)results.push({exercise:el.dataset.name,weight,reps,best:reps});});
  state.history.push({iso:todayISO(),key:activeWorkoutKey,level:activeWorkoutKey==='R'?null:state.level,results,notes:document.querySelector('#workoutNotes').value.trim()});
  save();closeWorkout();renderAll();showToast(activeWorkoutKey==='R'?'回復日を記録しました':'セッション完了。+25 XP');
}

function levelUp(){
  if(!canLevelUp())return;if(state.level>=15)return;state.level++;state.unlockedLevel=Math.max(state.unlockedLevel,state.level);state.levelStartedAt=todayISO();save();renderAll();showToast(`LV ${state.level} にレベルアップ`);
}
function openLevelPanel(){const s=document.querySelector('#manualLevelSelect');s.innerHTML=levels.map(l=>`<option value="${l.n}" ${l.n===state.level?'selected':''}>Lv${l.n} · ${esc(l.name)}</option>`).join('');document.querySelector('#levelBackdrop').hidden=false;document.querySelector('#levelPanel').hidden=false;}
function closeLevelPanel(){document.querySelector('#levelBackdrop').hidden=true;document.querySelector('#levelPanel').hidden=true;}
function applyManualLevel(){const n=Number(document.querySelector('#manualLevelSelect').value);if(!n)return;state.level=n;state.unlockedLevel=Math.max(state.unlockedLevel,n);state.levelStartedAt=todayISO();save();closeLevelPanel();renderAll();showToast(`Lv${n} に設定しました`);}
function showToast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.hidden=true,2200);}
function exportJSON(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`training-quest-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function renderAll(){renderHero();renderLevelSummary();renderStats();renderPlan();renderLevelGrid();renderProgressControls();renderHistory();}

function init(){
  document.documentElement.classList.toggle('light',state.theme==='light');
  document.querySelector('#themeBtn').onclick=()=>{state.theme=state.theme==='light'?'dark':'light';document.documentElement.classList.toggle('light',state.theme==='light');save();};
  document.querySelector('#startTodayBtn').onclick=e=>openWorkout(e.currentTarget.dataset.key);
  document.querySelector('#recoveryBtn').onclick=()=>openWorkout('R');
  document.querySelector('#levelUpBtn').onclick=levelUp;
  document.querySelector('#closeWorkoutBtn').onclick=closeWorkout;document.querySelector('#closeWorkoutBottomBtn').onclick=closeWorkout;document.querySelector('#workoutBackdrop').onclick=closeWorkout;
  document.querySelector('#completeWorkoutBtn').onclick=completeWorkout;
  document.querySelector('#resetLevelBtn').onclick=openLevelPanel;document.querySelector('#closeLevelBtn').onclick=closeLevelPanel;document.querySelector('#levelBackdrop').onclick=closeLevelPanel;document.querySelector('#applyManualLevelBtn').onclick=applyManualLevel;
  document.querySelector('#progressExerciseSelect').onchange=renderProgressChart;
  document.querySelector('#exportBtn').onclick=exportJSON;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!document.querySelector('#workoutPanel').hidden)closeWorkout();if(!document.querySelector('#levelPanel').hidden)closeLevelPanel();}});
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  renderAll();
}
init();
