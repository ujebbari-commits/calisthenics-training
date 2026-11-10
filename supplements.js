// Daily supplement check-in. Stored separately from food/macronutrient records.
(() => {
  'use strict';
  const root=document.querySelector('#nutritionPanel');
  if(!root)return;
  const viewDate=root.querySelector('#nutritionViewDate');
  if(!viewDate)return;

  const KEY='training.supplements.v1';
  const SUPPLEMENTS=[
    {
      id:'vitaminD',
      title:'ビタミンD',
      product:'Nature In ビタミンD3 2000IU',
      instruction:'1日1粒（50μg）を毎日。食後に摂取（脂溶性）。',
      caution:'禁止：1日100μg以上の摂取'
    },
    {
      id:'caffeine',
      title:'カフェイン',
      product:'Nature In カフェイン 200mg',
      instruction:'だるい日だけ1粒（200mg）。トレーニング約60分前。週1〜2回まで。',
      caution:'禁止：1日2粒以上／就寝前6時間以内／ほかのカフェインとの併用'
    }
  ];
  const asLocalDate=(date=new Date())=>
    date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  const dateAtNoon=value=>{
    const [y,m,d]=String(value).split('-').map(Number);
    return new Date(y,m-1,d,12,0,0,0);
  };
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&asLocalDate(dateAtNoon(value))===value;
  const plusDays=(value,n)=>{const date=dateAtNoon(value);date.setDate(date.getDate()+n);return asLocalDate(date);};
  const mondayOf=value=>{const date=dateAtNoon(value);date.setDate(date.getDate()-(date.getDay()+6)%7);return asLocalDate(date);};
  const shortDate=value=>{const a=String(value).split('-');return a.length===3?Number(a[1])+'/'+Number(a[2]):value;};
  const escaped=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function read(){
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!saved||typeof saved!=='object'||Array.isArray(saved))return {};
      const days=saved.days;
      if(!days||typeof days!=='object'||Array.isArray(days))return {};
      return Object.fromEntries(Object.entries(days).filter(([date,entry])=>
        validDate(date)&&entry&&typeof entry==='object'&&!Array.isArray(entry)));
    }catch{return {};}
  }
  let days=read();
  const save=()=>localStorage.setItem(KEY,JSON.stringify({version:1,days}));
  const countCaffeine=day=>{
    const start=mondayOf(day),end=plusDays(start,6);
    return Object.entries(days).filter(([key,entry])=>key>=start&&key<=end&&entry.caffeine===true).length;
  };
  const selectedDay=()=>validDate(viewDate.value)?viewDate.value:asLocalDate();

  const section=document.createElement('section');
  section.className='nutrition-section nutrition-supplements-section';
  section.setAttribute('aria-labelledby','nutritionSupplementsTitle');
  section.innerHTML='<div class="nutrition-section-heading">'+
    '<h3 id="nutritionSupplementsTitle">サプリ記録</h3><span id="nutritionSupplementsDate"></span></div>'+
    '<p class="nutrition-supplements-note">飲んだサプリにチェックしてください。記録は日付ごとに保存され、食品のタンパク質・カロリーには加算しません。</p>'+
    '<div class="nutrition-supplements-list">'+SUPPLEMENTS.map(s=>
      '<label class="nutrition-supplement-card" data-supplement="'+escaped(s.id)+'">'+
        '<span class="nutrition-supplement-check"><input type="checkbox" data-supplement-check="'+escaped(s.id)+'" aria-label="'+escaped(s.title)+'を摂取済みにする">'+
          '<span class="nutrition-supplement-name"><strong>'+escaped(s.title)+'</strong><small>'+escaped(s.product)+'</small></span>'+
          '<span class="nutrition-supplement-state" data-supplement-state="'+escaped(s.id)+'">未記録</span></span>'+
        '<span class="nutrition-supplement-guidance">'+escaped(s.instruction)+'</span>'+
        '<span class="nutrition-supplement-caution">'+escaped(s.caution)+'</span>'+
      '</label>').join('')+'</div>'+
    '<p id="nutritionCaffeineWeekly" class="nutrition-supplement-weekly"></p>'+
    '<p id="nutritionSupplementsStatus" class="nutrition-status" role="status" aria-live="polite"></p>';
  const nextSection=root.querySelector('.nutrition-quick-section');
  if(nextSection)nextSection.insertAdjacentElement('beforebegin',section);
  else root.appendChild(section);
  const message=section.querySelector('#nutritionSupplementsStatus');

  function render(){
    const day=selectedDay(),record=days[day]||{};
    section.querySelector('#nutritionSupplementsDate').textContent=
      shortDate(day)+(day===asLocalDate()?'（今日）':'')+'の記録';
    for(const item of SUPPLEMENTS){
      const checked=record[item.id]===true;
      const checkbox=section.querySelector('[data-supplement-check="'+item.id+'"]');
      const card=section.querySelector('[data-supplement="'+item.id+'"]');
      checkbox.checked=checked;
      card.classList.toggle('taken',checked);
      section.querySelector('[data-supplement-state="'+item.id+'"]').textContent=
        checked?'摂取済み':'未記録';
    }
    const weekly=countCaffeine(day),start=mondayOf(day);
    const output=section.querySelector('#nutritionCaffeineWeekly');
    output.textContent='カフェイン：'+shortDate(start)+'〜'+shortDate(plusDays(start,6))+'の摂取記録 '+
      weekly+'回／週2回まで'+(weekly>2?'（設定した頻度を超えています）':'');
    output.classList.toggle('over-limit',weekly>2);
  }
  function update(id,taken){
    const day=selectedDay();
    if(day>asLocalDate()){
      render();
      message.textContent='未来の日付には記録できません。';
      return;
    }
    const entry={...(days[day]||{})};
    if(taken)entry[id]=true;
    else delete entry[id];
    if(Object.keys(entry).length)days[day]=entry;
    else delete days[day];
    try{save();}catch(err){
      // In-memory state is restored from the last persisted value on failure.
      days=read();render();
      message.textContent='記録を保存できませんでした。ブラウザの保存設定をご確認ください。';
      return;
    }
    render();
    const title=SUPPLEMENTS.find(x=>x.id===id).title;
    message.textContent=shortDate(day)+'の'+title+'を'+(taken?'摂取済みとして保存しました。':'未記録に戻しました。')+
      (id==='caffeine'&&countCaffeine(day)>2?' 週2回の設定上限を超えています。':'');
  }
  section.querySelectorAll('[data-supplement-check]').forEach(input=>{
    input.addEventListener('change',()=>update(input.dataset.supplementCheck,input.checked));
  });
  viewDate.addEventListener('change',()=>{
    message.textContent='';
    render();
  });
  root.querySelector('#nutritionToday')?.addEventListener('click',()=>{
    message.textContent='';
    render();
  });
  render();
  // Extend the existing ChatGPT export without modifying the food journal schema.
  const nutritionExport=window.trainingNutritionExportData;
  if(typeof nutritionExport==='function'){
    window.trainingNutritionExportData=()=>({...nutritionExport(),supplementLog:{version:1,days}});
  }
  window.trainingSupplementLogExportData=()=>({version:1,days:JSON.parse(JSON.stringify(days))});
})();
