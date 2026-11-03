// Nutrition journal: label-based nutrition scaled to the eaten mass.
// All data stays in this browser's localStorage; no external nutrition database.
(() => {
  const STORAGE_KEY='training.nutrition.v1';
  const root=document.querySelector('#nutritionPanel');
  if(!root)return;

  function read(){
    try{
      const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{};
      return {
        foods:Array.isArray(data.foods)?data.foods:[],
        entries:Array.isArray(data.entries)?data.entries:[]
      };
    }catch{return {foods:[],entries:[]};}
  }
  const data=read();
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=v=>{
    const n=Number(v)||0;
    return (Math.round((n+Number.EPSILON)*10)/10).toLocaleString('ja-JP',{maximumFractionDigits:1});
  };
  const asLocalDate=(d=new Date())=>{
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  };
  const atNoon=date=>{
    const p=String(date).split('-').map(Number);
    return new Date(p[0],p[1]-1,p[2],12,0,0);
  };
  const plusDays=(date,n)=>{
    const d=atNoon(date);d.setDate(d.getDate()+n);return asLocalDate(d);
  };
  const mondayOf=date=>{
    const d=atNoon(date);d.setDate(d.getDate()-(d.getDay()+6)%7);return asLocalDate(d);
  };
  const labelDate=date=>{
    const p=String(date).split('-');return p.length===3?Number(p[1])+'/'+Number(p[2]):date;
  };
  const validDay=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&asLocalDate(atNoon(date))===date;
  const makeId=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,9);
  const dateToday=asLocalDate();
  let viewingDay=dateToday, editingId=null, trendMode='daily';
  const nutritionOf=e=>({
    protein:Number(e.consumedGrams)/Number(e.labelGrams)*Number(e.proteinGrams),
    calories:Number(e.consumedGrams)/Number(e.labelGrams)*Number(e.calories)
  });
  const totals=rows=>rows.reduce((a,e)=>{
    const n=nutritionOf(e);
    return {protein:a.protein+n.protein,calories:a.calories+n.calories};
  },{protein:0,calories:0});
  const entriesForDay=day=>data.entries.filter(e=>e.date===day);
  const entriesForWeek=monday=>{
    const end=plusDays(monday,6);
    return data.entries.filter(e=>e.date>=monday&&e.date<=end);
  };
  const field=(id,label,placeholder='',type='number')=>
    '<label class="nutrition-field"><span>'+label+'</span><input id="'+id+'" name="'+id+'" type="'+type+'" '+(type==='number'?'min="0" step="any" inputmode="decimal"':'')+
    ' placeholder="'+esc(placeholder)+'" required></label>';

  root.innerHTML=
    '<div class="section-head simple-head"><div><p class="eyebrow">NUTRITION</p><h2>栄養記録</h2><p class="muted">商品に記載された数値から、食べた量に応じて自動計算</p></div></div>'+
    '<div class="nutrition-summary-select"><label>集計する日<input id="nutritionViewDate" type="date" value="'+dateToday+'"></label><button type="button" id="nutritionToday" class="secondary">今日</button></div>'+
    '<div class="nutrition-summary-grid">'+
      '<div class="nutrition-summary-block"><strong>日別 <span id="nutritionDailyDate"></span></strong><div class="nutrition-stat-grid"><div><span>タンパク質</span><b id="nutritionDailyProtein">0 g</b></div><div><span>カロリー</span><b id="nutritionDailyCalories">0 kcal</b></div></div></div>'+
      '<div class="nutrition-summary-block"><strong>週別 <span id="nutritionWeekDate"></span></strong><div class="nutrition-stat-grid"><div><span>タンパク質</span><b id="nutritionWeeklyProtein">0 g</b></div><div><span>カロリー</span><b id="nutritionWeeklyCalories">0 kcal</b></div></div></div>'+
    '</div>'+
    '<section class="nutrition-section"><h3>食品を記録</h3>'+
      '<form id="nutritionFoodForm" novalidate>'+
        '<label class="nutrition-field"><span>登録済み食品から選択（任意）</span><select id="nutritionExistingFood"><option value="">新しい食品を入力</option></select></label>'+
        '<div class="nutrition-entry-grid">'+
          field('nutritionName','食品名','例：オートミール','text')+
          field('nutritionLabelGrams','栄養表示の基準量 (g)','例：65')+
          field('nutritionLabelProtein','その基準量のタンパク質 (g)','例：12')+
          field('nutritionLabelCalories','その基準量のカロリー (kcal)','例：250')+
          field('nutritionConsumedGrams','実際に食べた量 (g)','例：130')+
          '<label class="nutrition-field"><span>摂取日</span><input id="nutritionEntryDate" type="date" value="'+dateToday+'" required></label>'+
        '</div>'+
        '<p class="nutrition-example">例：商品に「65g当たりタンパク質12g・250kcal」とあれば、基準量65、タンパク質12、カロリー250。実際に130g食べたら、24g・500kcalと計算します。</p>'+
        '<div class="nutrition-form-actions"><button type="button" class="secondary" id="nutritionCancelEdit" hidden>編集を中止</button><button type="submit" class="primary" id="nutritionSubmit">食事を追加</button></div>'+
        '<p class="nutrition-status" id="nutritionStatus" aria-live="polite"></p>'+
      '</form>'+
    '</section>'+
    '<section class="nutrition-section"><div class="nutrition-section-heading"><h3>この日の摂取記録</h3><span id="nutritionEntryCount"></span></div><div id="nutritionEntries"></div></section>'+
    '<section class="nutrition-section"><div class="nutrition-section-heading"><h3>摂取量の推移</h3><div class="nutrition-trend-tabs"><button type="button" data-trend="daily" class="active">日別（14日）</button><button type="button" data-trend="weekly">週別（8週）</button></div></div>'+
      '<p class="nutrition-trend-hint">未記録の日・週はグラフ上で0と表示しますが、実際の摂取量が0だったとは限りません。</p>'+
      '<div class="nutrition-chart-wrap"><h4>タンパク質 (g)</h4><div id="nutritionProteinChart"></div></div>'+
      '<div class="nutrition-chart-wrap"><h4>カロリー (kcal)</h4><div id="nutritionCalorieChart"></div></div>'+
    '</section>';

  const el=id=>root.querySelector('#'+id);
  function renderFoodOptions(){
    const select=el('nutritionExistingFood');
    const old=select.value;
    select.innerHTML='<option value="">新しい食品を入力</option>'+
      [...data.foods].sort((a,b)=>a.name.localeCompare(b.name,'ja')).map(f=>
        '<option value="'+esc(f.id)+'">'+esc(f.name)+' ('+fmt(f.labelGrams)+'g当たり)</option>'
      ).join('');
    select.value=data.foods.some(f=>f.id===old)?old:'';
  }
  function populateFood(food){
    el('nutritionName').value=food?.name||'';
    el('nutritionLabelGrams').value=food?.labelGrams??'';
    el('nutritionLabelProtein').value=food?.proteinGrams??'';
    el('nutritionLabelCalories').value=food?.calories??'';
    el('nutritionConsumedGrams').value=food?.labelGrams??'';
  }
  function resetEntryForm(){
    editingId=null;
    el('nutritionFoodForm').reset();
    el('nutritionEntryDate').value=viewingDay;
    el('nutritionExistingFood').value='';
    el('nutritionSubmit').textContent='食事を追加';
    el('nutritionCancelEdit').hidden=true;
  }
  function summary(){
    const daily=totals(entriesForDay(viewingDay));
    const monday=mondayOf(viewingDay);
    const weekly=totals(entriesForWeek(monday));
    el('nutritionDailyDate').textContent=labelDate(viewingDay);
    el('nutritionWeekDate').textContent=labelDate(monday)+'〜'+labelDate(plusDays(monday,6));
    el('nutritionDailyProtein').textContent=fmt(daily.protein)+' g';
    el('nutritionDailyCalories').textContent=fmt(daily.calories)+' kcal';
    el('nutritionWeeklyProtein').textContent=fmt(weekly.protein)+' g';
    el('nutritionWeeklyCalories').textContent=fmt(weekly.calories)+' kcal';
  }
  function renderEntries(){
    const list=el('nutritionEntries');
    const entries=[...entriesForDay(viewingDay)].sort((a,b)=>b.createdAt-a.createdAt);
    el('nutritionEntryCount').textContent=entries.length+'件';
    if(!entries.length){list.innerHTML='<p class="nutrition-empty">この日の記録はありません。</p>';return;}
    list.innerHTML=entries.map(e=>{
      const n=nutritionOf(e);
      return '<article class="nutrition-entry">'+
        '<div class="nutrition-entry-main"><strong>'+esc(e.name)+'</strong>'+
          '<small>'+fmt(e.consumedGrams)+'g摂取 · 商品表示 '+fmt(e.labelGrams)+'g当たり：P '+fmt(e.proteinGrams)+'g / '+fmt(e.calories)+'kcal</small></div>'+
        '<div class="nutrition-entry-totals"><b>'+fmt(n.protein)+'g P</b><b>'+fmt(n.calories)+'kcal</b></div>'+
        '<div class="nutrition-entry-actions"><button type="button" class="secondary" data-nutrition-edit="'+esc(e.id)+'">編集</button><button type="button" class="secondary" data-nutrition-delete="'+esc(e.id)+'">削除</button></div>'+
      '</article>';
    }).join('');
    list.querySelectorAll('[data-nutrition-edit]').forEach(btn=>btn.onclick=()=>{
      const record=data.entries.find(e=>e.id===btn.dataset.nutritionEdit);
      if(!record)return;
      editingId=record.id;
      el('nutritionExistingFood').value=data.foods.some(f=>f.id===record.foodId)?record.foodId:'';
      populateFood(record);
      el('nutritionConsumedGrams').value=record.consumedGrams;
      el('nutritionEntryDate').value=record.date;
      el('nutritionSubmit').textContent='変更を保存';
      el('nutritionCancelEdit').hidden=false;
      el('nutritionStatus').textContent='編集中：'+record.name;
      el('nutritionFoodForm').scrollIntoView({behavior:'smooth',block:'center'});
    });
    list.querySelectorAll('[data-nutrition-delete]').forEach(btn=>btn.onclick=()=>{
      const record=data.entries.find(e=>e.id===btn.dataset.nutritionDelete);
      if(!record||!window.confirm('「'+record.name+'」の摂取記録を削除しますか？'))return;
      data.entries=data.entries.filter(e=>e.id!==record.id);
      if(editingId===record.id)resetEntryForm();
      save();render();
      el('nutritionStatus').textContent='記録を削除しました。';
    });
  }
  function trendRows(){
    if(trendMode==='weekly'){
      const monday=mondayOf(viewingDay);
      return Array.from({length:8},(_,i)=>{
        const week=plusDays(monday,(i-7)*7);
        return {label:labelDate(week),day:week,...totals(entriesForWeek(week))};
      });
    }
    return Array.from({length:14},(_,i)=>{
      const day=plusDays(viewingDay,i-13);
      return {label:labelDate(day),day,...totals(entriesForDay(day))};
    });
  }
  function chartSvg(points,key,unit){
    const W=750,H=200,L=44,R=18,T=16,B=39,plotW=W-L-R,plotH=H-T-B;
    const actualMax=Math.max(0,...points.map(p=>p[key]));
    const max=Math.max(1,Math.ceil(actualMax*1.1));
    const xy=points.map((p,i)=>{
      const x=L+(points.length<=1?plotW/2:i/(points.length-1)*plotW);
      const y=T+plotH*(1-p[key]/max);
      return {x,y,p};
    });
    const grid=Array.from({length:5},(_,i)=>{
      const y=T+i*plotH/4,value=max*(4-i)/4;
      return '<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" class="nutrition-chart-grid"/>'+
        '<text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" class="nutrition-chart-text">'+fmt(value)+'</text>';
    }).join('');
    const path=xy.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
    const labels=xy.map((p,i)=>i%Math.max(1,Math.ceil(points.length/7))===0||i===points.length-1?
      '<text x="'+p.x+'" y="'+(H-14)+'" text-anchor="middle" class="nutrition-chart-text">'+esc(p.p.label)+'</text>':'').join('');
    const circles=xy.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="4.5" class="nutrition-chart-point"><title>'+esc(p.p.day)+'：'+fmt(p.p[key])+' '+unit+'</title></circle>').join('');
    return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(key==='protein'?'タンパク質':'カロリー')+'の'+(trendMode==='weekly'?'週別':'日別')+'推移">'+
      grid+'<path d="'+path+'" class="nutrition-chart-line"/>'+circles+labels+
      '</svg>';
  }
  function renderTrends(){
    root.querySelectorAll('[data-trend]').forEach(btn=>btn.classList.toggle('active',btn.dataset.trend===trendMode));
    const points=trendRows();
    el('nutritionProteinChart').innerHTML=chartSvg(points,'protein','g');
    el('nutritionCalorieChart').innerHTML=chartSvg(points,'calories','kcal');
  }
  function render(){
    el('nutritionViewDate').value=viewingDay;
    summary();renderEntries();renderTrends();
  }

  el('nutritionExistingFood').addEventListener('change',e=>{
    const food=data.foods.find(f=>f.id===e.target.value);
    populateFood(food);
  });
  el('nutritionViewDate').addEventListener('change',e=>{
    if(!validDay(e.target.value))return;
    viewingDay=e.target.value;
    if(!editingId)el('nutritionEntryDate').value=viewingDay;
    render();
  });
  el('nutritionToday').onclick=()=>{
    viewingDay=asLocalDate();
    if(!editingId)el('nutritionEntryDate').value=viewingDay;
    render();
  };
  root.querySelectorAll('[data-trend]').forEach(btn=>btn.onclick=()=>{
    trendMode=btn.dataset.trend;renderTrends();
  });
  el('nutritionCancelEdit').onclick=()=>{
    resetEntryForm();el('nutritionStatus').textContent='編集を中止しました。';
  };
  el('nutritionFoodForm').addEventListener('submit',e=>{
    e.preventDefault();
    const status=el('nutritionStatus');
    const name=el('nutritionName').value.trim();
    const date=el('nutritionEntryDate').value;
    const labelGrams=Number(el('nutritionLabelGrams').value);
    const proteinGrams=Number(el('nutritionLabelProtein').value);
    const calories=Number(el('nutritionLabelCalories').value);
    const consumedGrams=Number(el('nutritionConsumedGrams').value);
    const allNumbers=[labelGrams,proteinGrams,calories,consumedGrams];
    const rawValues=['nutritionLabelGrams','nutritionLabelProtein','nutritionLabelCalories','nutritionConsumedGrams'];
    if(!name||name.length>120||!validDay(date)||rawValues.some(id=>!el(id).value.trim())||
      allNumbers.some(x=>!Number.isFinite(x))||
      labelGrams<=0||consumedGrams<=0||proteinGrams<0||calories<0){
      status.textContent='食品名・日付・正しいグラム数と栄養値を入力してください。';
      return;
    }
    if(date>asLocalDate()){
      status.textContent='未来の日付は記録できません。';return;
    }
    const chosenId=el('nutritionExistingFood').value;
    let food=data.foods.find(f=>f.id===chosenId);
    if(!food){
      food=data.foods.find(f=>f.name===name&&f.labelGrams===labelGrams&&
        f.proteinGrams===proteinGrams&&f.calories===calories);
    }
    if(!food){food={id:makeId()};data.foods.push(food);}
    Object.assign(food,{name,labelGrams,proteinGrams,calories});
    const old=data.entries.find(x=>x.id===editingId);
    const record={id:old?.id||makeId(),createdAt:old?.createdAt||Date.now(),date,
      foodId:food.id,name,labelGrams,proteinGrams,calories,consumedGrams};
    if(old)Object.assign(old,record);
    else data.entries.push(record);
    save();
    viewingDay=date;
    renderFoodOptions();
    resetEntryForm();
    render();
    el('nutritionStatus').textContent=old?'記録を更新しました。':'摂取記録を追加しました。';
  });

  renderFoodOptions();
  render();
  // Share current nutrition information with the existing training-data export.
  window.trainingNutritionExportData=()=>({
    schema:'training-nutrition.v1',
    foodLibrary:data.foods,
    entries:data.entries
  });
})();
