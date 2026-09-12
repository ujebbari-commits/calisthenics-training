// v3 UX layer: one best-set entry per exercise + beginner-friendly exercise guides.
(() => {
  const exerciseGuides={
    'ウォームアップ':'本番の種目に入る前に、指定された関節をゆっくり動かして体温を上げます。痛みが出るほど伸ばす必要はありません。「動きやすくなった」と感じる程度で十分です。',
    'アシスト懸垂':'アシスト付きチンニングマシンで行う懸垂です。膝または足をパッドに乗せ、バーを握って胸をバーへ近づけます。反動で跳ねず、肩をすくめないようにします。アシスト重量は大きいほど楽になります。',
    'シーテッドロー':'座ってハンドルを手前へ引くマシン種目です。胸を軽く張り、肘を後ろへ引いて背中を使います。肩が耳に近づかないようにし、戻すときも重りを急に落としません。',
    'デッドハング':'懸垂バーを握り、足を床から離してぶら下がるだけの種目です。握力と肩まわりの土台を作ります。肘は伸ばし、肩に鋭い痛みが出る場合は中止します。',
    'ハンギング・ニー・レイズ':'バーにぶら下がったまま膝を胸方向へ持ち上げる腹筋種目です。脚を振るより、お腹を丸めて骨盤を少し持ち上げる意識を持ちます。反動が大きくなる前に止めます。',
    'Tuck L-sit / Support hold':'平行バーやディップスバーを両手で押して体を支えます。Support holdは肘を伸ばして浮いた姿勢を保つだけ。Tuck L-sitはそこから膝を胸へ引き上げます。肩を下へ押し続けるのがポイントです。',
    'モビリティ':'単に柔らかくするストレッチではなく、関節を自分でコントロールできる可動域を広げる練習です。反動を使わず、肩・股関節・足首などを痛くない範囲で大きく動かします。',
    '壁倒立':'壁を安全装置として使う倒立です。手を肩幅程度に置き、肘を伸ばし、床を強く押します。腰を反らしすぎず、お腹とお尻に軽く力を入れて体を一直線に近づけます。',
    'アシストディップス':'アシスト付きディップスマシンで、腕と胸で体を押し上げます。膝または足をパッドに乗せ、肘を曲げてゆっくり下がり、バーを押して戻ります。アシスト重量は大きいほど楽になります。肩に違和感が出ない深さで止めます。',
    'プッシュアップ':'いわゆる腕立て伏せです。頭からかかとまでを一直線に保ち、胸を床へ近づけてから押し戻します。腰だけが落ちたり、お尻だけが高くならないようにします。',
    'パイクプッシュアップ':'お尻を高く上げた逆V字の姿勢で行う腕立て伏せです。通常の腕立てより肩を強く使い、将来の倒立腕立てにつながります。頭を真下ではなく、両手の少し前へ下ろすイメージです。',
    'サポートホールド':'ディップスバーを握り、肘を完全に伸ばして体を浮かせたまま静止します。肩をすくめず、バーを下へ押し続けます。ディップスやL-sitの基礎になる姿勢です。',
    'レッグプレス':'座った状態で足裏でプレートを押す脚のマシン種目です。膝とつま先の向きをそろえ、腰がシートから大きく浮かない範囲まで下ろします。膝を伸ばし切ってロックしないようにします。',
    'ブルガリアンスクワット':'後ろ足をベンチなどに乗せ、前脚を中心にしゃがむ片脚種目です。前足に体重を乗せ、膝とつま先を同じ方向へ向けます。左右は同じ回数で行います。',
    'アシスト・ピストルスクワット':'片脚だけで深くしゃがむピストルスクワットを、支柱やラックにつかまって練習します。支えを使ってバランスを取り、できる範囲までゆっくり下降して立ち上がります。',
    'カーフレイズ':'つま先立ちになって、ふくらはぎを鍛える種目です。かかとをしっかり下げて伸ばしたあと、できるだけ高く持ち上げます。反動で跳ねないようにします。',
    'Hollow body hold':'仰向けで腰を床へ押しつけ、肩と脚を少し浮かせて静止する体幹種目です。腰が床から浮く場合は、膝を曲げたり脚を高くして難易度を下げます。倒立やL-sitの姿勢づくりに使います。',
    '壁倒立 / 倒立練習':'まず壁倒立で姿勢を確認し、余裕があれば壁から少し足を離す練習をします。長時間粘るより、形の良い短い試技を繰り返します。手首や肩に痛みが出たら終了します。',
    '懸垂系':'その日の状態に合わせて、通常の懸垂またはアシスト懸垂を選びます。DAY Aより少し楽な強度にして、反動なし・最後までコントロールできるフォームを優先します。',
    'ディップス系':'通常のディップスが難しければアシストディップスを使います。DAY Bより少し楽な強度で、肩に無理のない深さと安定したフォームを優先します。',
    'L-sit progression':'両手で体を支え、脚を前へ浮かせるL-sitの段階練習です。最初は膝を曲げたTuck、次に片脚だけ伸ばすone-leg、最後に両脚を伸ばすfullへ進みます。',
    '深い自重スクワット':'重りを持たず、足裏を床につけたままできるだけ深くしゃがみます。膝とつま先を同じ方向にし、下まで急に落ちず、ゆっくりコントロールします。',
    'モビリティ・フロー':'肩・背骨・股関節などのモビリティ動作を止まらずにつなげて行います。速さより、呼吸しながら大きな可動域を自分でコントロールすることを優先します。',
    '手首':'四つ這いで手のひらを床につけ、肘を伸ばしたまま体を前後・左右へゆっくり動かします。倒立で手首に体重をかける準備です。痛みが出る角度までは押し込みません。',
    '肩':'壁スライドなどで、腕を頭上まで上げる動きを練習します。腰を大きく反ってごまかさず、肩甲骨も一緒に動かします。倒立で必要なオーバーヘッド可動域の練習です。',
    '胸椎':'胸椎は背中のうち胸の高さにある部分です。Cat-Cowや四つ這いでの回旋を使って、背中を丸める・反らす・ひねる動きをゆっくり行います。',
    '股関節':'90/90やCossack squatで、股関節を内外へ回したり横方向へ深く動かします。膝だけを無理にねじらず、股関節から動く意識を持ちます。',
    'ハムストリング':'太ももの裏側の筋肉です。膝を軽く曲げてもよいので、腰を丸めるだけではなく股関節から前へ倒れます。反動をつけず、強い痛みの手前で止めます。',
    '足首':'かかとを床につけたまま、膝をつま先方向へ前に出します。スクワットで深くしゃがむための足首の可動域を作ります。土踏まずが大きく潰れない範囲で行います。'
  };

  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const info=item=>({trackable:/^(\d+)\s*[×x]/i.test(item[2]||''),unit:(item[2]||'').includes('秒')?'秒':'回',perSide:/\/\s*脚/.test(item[2]||'')});
  const hasValue=r=>Number.isFinite(Number(r?.best))||(Array.isArray(r?.values)&&r.values.some(v=>Number.isFinite(Number(v))));
  const bestValue=r=>{if(Number.isFinite(Number(r?.best)))return Number(r.best);const v=(r?.values||[]).map(Number).filter(Number.isFinite);return v.length?Math.max(...v):null;};

  sessionResultSummary=function(h){
    const tracked=(h.results||[]).filter(hasValue);
    return tracked.length?` · ${tracked.length}種目をベスト記録`:'';
  };

  allExerciseNames=function(){
    const names=[];
    Object.values(workouts).forEach(w=>w.items.forEach(i=>{if(info(i).trackable&&!names.includes(i[0]))names.push(i[0]);}));
    state.history.forEach(h=>(h.results||[]).forEach(r=>{if(r.exercise&&hasValue(r)&&!names.includes(r.exercise))names.push(r.exercise);}));
    return names;
  };

  exerciseSeries=function(name){
    const rows=[];
    state.history.forEach(h=>{
      const r=(h.results||[]).find(x=>x.exercise===name&&hasValue(x));
      if(!r)return;
      const best=bestValue(r);
      if(best!==null)rows.push({iso:h.iso,unit:r.unit||'',best});
    });
    return rows;
  };

  renderProgressChart=function(){
    const name=document.querySelector('#progressExerciseSelect')?.value||'';
    const rows=exerciseSeries(name);
    const chart=document.querySelector('#progressChart');
    const summary=document.querySelector('#progressSummary');
    if(!chart||!summary)return;
    if(!name||!rows.length){summary.innerHTML='';chart.innerHTML='<div class="empty">この種目の記録はまだありません。トレーニング画面で「今回のベストセット」を1回だけ入力すると、ここに推移が表示されます。</div>';return;}
    const unit=rows.at(-1).unit||'',values=rows.map(r=>r.best),latest=values.at(-1),best=Math.max(...values),first=values[0],diff=latest-first;
    summary.innerHTML=`<article><span>最新</span><strong>${latest}${unit}</strong></article><article><span>自己ベスト</span><strong>${best}${unit}</strong></article><article><span>初回比</span><strong>${diff>0?'+':''}${diff}${unit}</strong></article>`;
    const W=860,H=300,padL=54,padR=20,padT=20,padB=46,plotW=W-padL-padR,plotH=H-padT-padB;
    const nice=v=>v<=10?Math.ceil(v):v<=50?Math.ceil(v/5)*5:v<=200?Math.ceil(v/10)*10:Math.ceil(v/50)*50;
    const ymax=Math.max(1,nice(Math.max(...values)*1.12));
    const points=rows.map((r,i)=>({x:padL+(rows.length===1?plotW/2:(i/(rows.length-1))*plotW),y:padT+plotH-(r.best/ymax)*plotH,row:r,v:r.best}));
    const grid=[];for(let i=0;i<=4;i++){const v=ymax*(4-i)/4,y=padT+plotH*i/4;grid.push(`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" class="chart-grid-line"/><text x="${padL-10}" y="${y+4}" text-anchor="end" class="chart-axis-text">${Number.isInteger(v)?v:v.toFixed(1)}</text>`);}
    const every=Math.max(1,Math.ceil(rows.length/6));
    const labels=points.map((p,i)=>{if(i%every!==0&&i!==points.length-1)return '';const d=new Date(p.row.iso).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'});return `<text x="${p.x}" y="${H-16}" text-anchor="middle" class="chart-axis-text">${d}</text>`;}).join('');
    const poly=points.map(p=>`${p.x},${p.y}`).join(' '),dots=points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot"><title>${new Date(p.row.iso).toLocaleDateString('ja-JP')}: ${p.v}${unit}</title></circle>`).join('');
    chart.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)}のベストセット推移グラフ">${grid.join('')}<line x1="${padL}" y1="${padT+plotH}" x2="${W-padR}" y2="${padT+plotH}" class="chart-axis"/><polyline points="${poly}" class="chart-line"/>${dots}${labels}<text x="${padL}" y="14" class="chart-unit">${esc(unit)}</text></svg>`;
  };

  renderProgressControls=function(){
    const select=document.querySelector('#progressExerciseSelect');if(!select)return;
    const current=select.value,names=allExerciseNames();select.innerHTML=names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    const withData=names.find(n=>exerciseSeries(n).length);if(current&&names.includes(current))select.value=current;else if(withData)select.value=withData;else if(names.length)select.value=names[0];renderProgressChart();
  };

  openWorkout=function(key){
    currentKey=key;const w=workouts[key];
    document.querySelector('#workoutCode').textContent=w.code;document.querySelector('#workoutTitle').textContent=w.title;document.querySelector('#workoutDesc').textContent=w.desc;document.querySelector('#workoutNotes').value='';
    document.querySelector('#exerciseList').innerHTML=w.items.map((item,idx)=>{const m=info(item),guide=exerciseGuides[item[0]]||'フォームを優先し、痛みが出ない範囲でゆっくり行います。分からない場合はスタッフに器具の使い方を確認してください。';const best=m.trackable?`<label class="best-entry"><span>今回のベストセット${m.perSide?'（片脚あたり）':''}</span><span class="best-input-wrap"><input class="result-input" data-ex="${idx}" type="number" min="0" step="1" inputmode="numeric" placeholder="0"><strong>${m.unit}</strong></span></label>`:'';return `<article class="exercise"><div class="exercise-main"><input type="checkbox" id="ex${idx}"><label for="ex${idx}"><h3>${item[0]}</h3><p>${item[1]}</p></label><div class="exercise-meta">${item[2]}</div></div><details class="exercise-guide"><summary>やり方・用語説明</summary><p>${esc(guide)}</p></details>${best}${item[3]?`<div class="exercise-tools"><button type="button" class="mini-btn timer-start" data-seconds="${item[3]}">休憩 ${Number(item[3])/60%1===0?Number(item[3])/60+'分':item[3]+'秒'}</button></div>`:''}</article>`;}).join('');
    document.querySelectorAll('.timer-start').forEach(b=>b.onclick=()=>openTimer(Number(b.dataset.seconds)));
    document.querySelectorAll('.result-input').forEach(inp=>inp.addEventListener('input',()=>{if(inp.value!=='')document.querySelector(`#ex${inp.dataset.ex}`).checked=true;}));
    document.querySelector('#workoutDialog').showModal();
  };

  completeWorkout=function(){
    const w=workouts[currentKey],boxes=[...document.querySelectorAll('#exerciseList input[type=checkbox]')];
    const results=w.items.map((item,idx)=>{const m=info(item);if(!m.trackable)return null;const input=document.querySelector(`.result-input[data-ex="${idx}"]`);if(!input||input.value==='')return null;const best=Number(input.value);return Number.isFinite(best)?{exercise:item[0],prescription:item[2],unit:m.unit,best}:null;}).filter(Boolean);
    state.history.push({version:3,iso:new Date().toISOString(),key:currentKey,done:boxes.filter(x=>x.checked).length,total:boxes.length,notes:document.querySelector('#workoutNotes').value.trim(),results});save();document.querySelector('#workoutDialog').close();renderAll();
  };

  resetWorkoutInputs=function(){document.querySelectorAll('#exerciseList input[type=checkbox]').forEach(x=>x.checked=false);document.querySelectorAll('#exerciseList .result-input').forEach(x=>x.value='');document.querySelector('#workoutNotes').value='';};

  document.querySelector('#completeWorkoutBtn').onclick=completeWorkout;
  document.querySelector('#resetChecksBtn').onclick=resetWorkoutInputs;
  document.querySelector('#progressExerciseSelect').onchange=renderProgressChart;
  const metric=document.querySelector('#progressMetricSelect');if(metric?.closest('label'))metric.closest('label').remove();
  const help=document.querySelector('.entry-help');if(help)help.textContent='種目が終わったらチェックするだけでOKです。記録を残したい種目だけ、その日の「ベストセット」を1回入力してください。毎セット入力する必要はありません。';

  const style=document.createElement('style');style.textContent=`
    .exercise-guide{margin:10px 0 0;border-top:1px solid var(--line);padding-top:9px}.exercise-guide summary{cursor:pointer;color:var(--accent);font-weight:750;font-size:.84rem}.exercise-guide p{margin:8px 0 2px;color:var(--muted);font-size:.86rem;line-height:1.65}.best-entry{margin-top:11px;padding:10px 11px;border:1px solid var(--line);border-radius:11px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted);font-size:.82rem}.best-input-wrap{display:flex;align-items:center;gap:7px}.best-input-wrap input{width:78px;padding:8px;text-align:right;font-variant-numeric:tabular-nums}.best-input-wrap strong{color:var(--accent)}@media(max-width:520px){.best-entry{align-items:flex-start;flex-direction:column}.best-input-wrap{width:100%}.best-input-wrap input{width:100%}}
  `;document.head.appendChild(style);
  renderProgressControls();
})();
