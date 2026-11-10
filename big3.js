// BIG3-only weekly strength planner. No changes to the normal workout schedule.
(() => {
  'use strict';
  const KEY='training.big3Planner.v1';
  const PLATES=[25,20,15,10,5,2.5,1.25]; // one of each per side
  const LIFTS={
    bench:{id:'heavy_bench_press',name:'ベンチプレス（スミス）',bar:9,initial:49,reps:5,sets:3},
    squat:{id:'barbell_squat',name:'スクワット',bar:20,initial:70,reps:8,sets:3},
    dead:{id:'deadlift',name:'デッドリフト',bar:20,initial:110,reps:5,sets:3}
  };
  // Factors refer to the last completed work-set weight, never 1RM.
  const DAYS=[
    {name:'月曜日',focus:'スクワット重点',items:[
      ['squat','高重量',1,3,5,'2〜3','4〜5分'],
      ['bench','高重量',1,3,5,'1〜2','3〜5分'],
      ['dead','軽め・フォーム',.75,2,3,'4以上','2〜3分']
    ]},
    {name:'火曜日',focus:'ベンチ軽め',items:[
      ['bench','軽め・フォーム',.8,3,5,'4以上','2〜3分']
    ]},
    {name:'水曜日',focus:'デッドリフト重点',items:[
      ['dead','高重量',1,3,5,'1〜2','4〜5分'],
      ['squat','軽め・フォーム',.8,2,5,'4以上','2〜3分'],
      ['bench','中重量・反復',.9,3,6,'2〜3','3〜4分']
    ]},
    {name:'木曜日',focus:'休養',items:[]},
    {name:'金曜日',focus:'ベンチ強度・下半身中重量',items:[
      ['bench','強度重視',1.05,3,3,'1〜2','4〜5分'],
      ['squat','中重量',.9,3,5,'2〜3','3〜4分'],
      ['dead','中重量',.9,2,5,'2〜3','3〜4分']
    ]},
    {name:'土曜日',focus:'ベンチ軽め',items:[
      ['bench','軽め・スピード',.8,2,6,'4以上','2〜3分']
    ]},
    {name:'日曜日',focus:'休養',items:[]}
  ];
  const fmt=v=>Number.isInteger(v)?String(v):String(Math.round(v*100)/100);
  const esc=v=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const read=(k,fallback)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?fallback:v;}catch{return fallback;}};
  const maxWeight=bar=>bar+PLATES.reduce((s,n)=>s+n,0)*2;
  const possible=(()=>{
    const out=[];
    for(let bits=0;bits<(1<<PLATES.length);bits++){
      const p=PLATES.filter((_,i)=>bits&(1<<i));
      out.push({plates:p,side:p.reduce((s,n)=>s+n,0)});
    }
    return out;
  })();
  function platesFor(target,bar){
    if(!Number.isFinite(target))return null;
    let best=null;
    for(const p of possible){
      const total=bar+p.side*2,error=Math.abs(total-target);
      const x={total,side:p.side,plates:p.plates,error,requested:target};
      if(best===null||error<best.error-1e-7||
        (Math.abs(error-best.error)<1e-7&&(total<best.total-1e-7||
        (Math.abs(total-best.total)<1e-7&&p.plates.length<best.plates.length))))best=x;
    }
    return best;
  }
  function qualifiedHistoryWeight(id){
    const meta=LIFTS[id],history=read('training.exerciseHistory.v1',[]);
    if(!Array.isArray(history))return null;
    const weights=[];
    for(const r of history){
      if(r.exerciseId!==meta.id)continue;
      if(r.recordKind==='big3-detail'||r.recordKind==='set-detail'){
        if(Array.isArray(r.setsDetail)&&r.setsDetail.length){
          const work=r.setsDetail.filter(x=>x.type==='working'&&Number(x.reps)>=meta.reps&&Number(x.weight)>0)
            .map(x=>Number(x.weight)).sort((a,b)=>b-a);
          if(work.length>=meta.sets)weights.push(work[meta.sets-1]);
        }else if(Number(r.qualificationWeight)>0)weights.push(Number(r.qualificationWeight));
      }else if(Number(r.sets)>=meta.sets&&Number(r.metric)>=meta.reps&&Number(r.weight)>0){
        weights.push(Number(r.weight));
      }
    }
    return weights.length?Math.max(...weights):null;
  }
  const init=()=>{
    const weights={};
    for(const id of Object.keys(LIFTS)){
      const m=LIFTS[id],recent=qualifiedHistoryWeight(id);
      weights[id]=platesFor(recent==null?m.initial:recent,m.bar).total;
    }
    return {version:1,week:1,weights};
  };
  let settings=read(KEY,null);
  if(!settings||settings.version!==1||!settings.weights)settings=init();
  if(!Number.isInteger(settings.week)||settings.week<1)settings.week=1;
  for(const id of Object.keys(LIFTS)){
    const bar=LIFTS[id].bar,v=Number(settings.weights[id]);
    if(!Number.isFinite(v)||v<bar||v>maxWeight(bar))settings.weights[id]=LIFTS[id].initial;
  }
  const save=()=>localStorage.setItem(KEY,JSON.stringify(settings));
  save();
  function warmups(id,total,role){
    const bar=LIFTS[id].bar,light=role.includes('軽め');
    const suggestions=light?[[bar,id==='dead'?5:8],[total*.7,3]]:
      [[bar,id==='dead'?5:8],[total*.6,5],[total*.8,3],[total*.9,1]];
    const seen=new Set();
    return suggestions.map(([w,reps])=>({...platesFor(w,bar),reps}))
      .filter(x=>{if(x.total>=total||seen.has(x.total))return false;seen.add(x.total);return true;});
  }
  function plan(){
    return DAYS.map(day=>({...day,items:day.items.map(([id,role,factor,sets,reps,rir,rest])=>{
      const meta=LIFTS[id],work=platesFor(settings.weights[id]*factor,meta.bar);
      return {id,name:meta.name,bar:meta.bar,role,factor,sets,reps,rir,rest,work,warmups:warmups(id,work.total,role)};
    })}));
  }
  function platesLabel(x){
    return x.plates.length?x.plates.map(v=>fmt(v)+'kg').join(' ＋ '):'なし';
  }
  function setLine(kind,load,bar,reps,sets){
    return '<div class="big3-set-row '+(kind==='本番'?'working':'warm')+'">'+
      '<span class="big3-set-type">'+kind+'</span>'+
      '<div><b>'+fmt(load.total)+'kg</b><span>左右各：'+esc(platesLabel(load))+' <small>（片側'+fmt(load.side)+'kg）</small></span>'+
      (load.error>.01?'<small class="big3-rounded">指定'+fmt(load.requested)+'kg → 使用可能重量に調整</small>':'')+
      '</div><strong>'+reps+'回 × '+sets+'セット</strong></div>';
  }
  function liftCard(e){
    return '<article class="big3-lift">'+
      '<div class="big3-lift-head"><div><h4>'+esc(e.name)+'</h4><span>'+esc(e.role)+' · 余力'+esc(e.rir)+'回</span></div>'+
      '<strong>'+fmt(e.work.total)+'kg</strong></div>'+
      '<div class="big3-sets">'+e.warmups.map((x,i)=>setLine('アップ'+(i+1),x,e.bar,x.reps,1)).join('')+
      setLine('本番',e.work,e.bar,e.reps,e.sets)+'</div>'+
      '<p class="big3-note">本番セット間：'+esc(e.rest)+'。総重量はバー込み。</p></article>';
  }
  function dayCard(day,index){
    return '<article class="big3-day'+(day.items.length?'':' rest')+'">'+
      '<div class="big3-day-head"><div><strong>DAY '+(index+1)+' · '+day.name+'</strong><span>'+esc(day.focus)+'</span></div>'+
      '<small>'+(day.items.length?day.items.length+'種目':'休養')+'</small></div>'+
      (day.items.length?'<div class="big3-day-lifts">'+day.items.map(liftCard).join('')+'</div>':'')+
      '</article>';
  }
  function mount(root){
    if(!root||root.dataset.big3Mounted)return;
    root.dataset.big3Mounted='true';
    const forms=Object.keys(LIFTS).map(id=>{
      const m=LIFTS[id];
      return '<label class="big3-base">'+
        '<span>'+m.name+'</span><input type="number" inputmode="decimal" min="'+m.bar+'" step="2.5" data-big3-weight="'+id+'" value="'+fmt(settings.weights[id])+'">'+
        '<small>基準：'+m.reps+'回×'+m.sets+'セット達成／バー'+m.bar+'kg</small></label>';
    }).join('');
    const checkboxes=Object.keys(LIFTS).map(id=>'<label><input type="checkbox" data-big3-done="'+id+'"><span>'+
      LIFTS[id].name+'：+2.5kg</span></label>').join('');
    root.innerHTML='<div class="section-head"><div><p class="eyebrow">BIG3 STRENGTH</p><h2>BIG3 · 筋力プランナー</h2></div><span class="pill" id="big3WeekBadge"></span></div>'+
      '<div class="big3-root"><p class="big3-note">ベンチ週5日、スクワット週3日、デッド週3日。ほかの種目は無視し、筋力重視で強度を分散した独立プランです。</p>'+
      '<div class="big3-baselines">'+forms+'</div>'+
      '<div class="big3-toolbar"><button type="button" id="big3Recalculate" class="primary">週間メニューを計算</button>'+
      '<button type="button" id="big3HistoryLoad" class="secondary">記録から重量を取得</button></div>'+
      '<p id="big3Message" class="big3-message" role="status" aria-live="polite"></p>'+
      '<p class="big3-note">プレート：片側に25 / 20 / 15 / 10 / 5 / 2.5 / 1.25kgを各1枚まで。スミスは指定抵抗9kgで計算します。実際の負荷は機種により異なる場合があります。軽・中・重の比率は達成重量を基準とする推定値で、1RMの百分率ではありません。</p>'+
      '<div class="big3-week-head"><h3 id="big3WeekTitle"></h3><div id="big3Counts"></div></div>'+
      '<div class="big3-days" id="big3Days"></div>'+
      '<section class="big3-progression"><h3>次の週を作成</h3>'+
      '<p class="big3-note">安全なフォームで予定の本番セットを完遂し、余裕があった種目だけチェックしてください。チェックした種目の基準重量のみ2.5kg増量します。</p>'+
      checkboxes+'<button type="button" id="big3NextWeek" class="primary">次週のメニューを作成</button>'+
      '<p class="big3-note">失敗・痛み・疲労が残る場合は増量せず、必要に応じて基準重量を下げて再計算してください。</p></section></div>';
    const msg=(text,isError=false)=>{
      const el=root.querySelector('#big3Message');el.textContent=text;el.classList.toggle('error',isError);
    };
    const render=()=>{
      root.querySelector('#big3WeekBadge').textContent='第'+settings.week+'週';
      root.querySelector('#big3WeekTitle').textContent='第'+settings.week+'週 · 週間メニュー';
      const p=plan(),count={bench:0,squat:0,dead:0};
      p.forEach(d=>d.items.forEach(x=>count[x.id]++));
      root.querySelector('#big3Counts').innerHTML='<span>ベンチ '+count.bench+'日</span><span>スクワット '+count.squat+'日</span><span>デッド '+count.dead+'日</span>';
      root.querySelector('#big3Days').innerHTML=p.map(dayCard).join('');
      for(const id of Object.keys(LIFTS))root.querySelector('[data-big3-weight="'+id+'"]').value=fmt(settings.weights[id]);
    };
    root.querySelector('#big3Recalculate').addEventListener('click',()=>{
      const next={};
      for(const id of Object.keys(LIFTS)){
        const meta=LIFTS[id],input=root.querySelector('[data-big3-weight="'+id+'"]'),value=Number(input.value);
        if(!input.value.trim()||!Number.isFinite(value)||value<meta.bar||value>maxWeight(meta.bar)){
          msg(meta.name+'の重量が範囲外です。バー重量〜プレートの最大重量で入力してください。',true);return;
        }
        next[id]=platesFor(value,meta.bar).total;
      }
      settings.weights=next;save();render();
      msg('週間メニューを更新しました。装着可能なプレート重量に合わせて調整しています。');
    });
    root.querySelector('#big3HistoryLoad').addEventListener('click',()=>{
      let updated=0;
      for(const id of Object.keys(LIFTS)){
        const best=qualifiedHistoryWeight(id);
        if(best!=null){settings.weights[id]=platesFor(best,LIFTS[id].bar).total;updated++;}
      }
      save();render();
      msg(updated?updated+'種目を過去の達成記録から更新しました。':'達成条件を満たす記録がありません。',!updated);
    });
    root.querySelector('#big3NextWeek').addEventListener('click',()=>{
      const selected=[...root.querySelectorAll('[data-big3-done]:checked')],next={...settings.weights};
      for(const box of selected){
        const id=box.dataset.big3Done,bar=LIFTS[id].bar,target=next[id]+2.5;
        if(target>maxWeight(bar)){msg(LIFTS[id].name+'はプレートの上限に達しています。',true);return;}
        next[id]=platesFor(target,bar).total;
      }
      settings.weights=next;settings.week++;save();
      selected.forEach(box=>{box.checked=false;});render();
      msg('第'+settings.week+'週を作成しました。'+(selected.length?'チェックした種目のみ増量しました。':'重量は据え置きです。'));
      root.scrollIntoView({behavior:'smooth',block:'start'});
    });
    render();
  }
  window.TrainingBig3={mount,platesFor,qualifiedHistoryWeight,plan,getSettings:()=>JSON.parse(JSON.stringify(settings))};
})();
