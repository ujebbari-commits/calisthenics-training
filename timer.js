// Training timer.
(() => {
  const PREF_KEY='training.restTimer.v2';

  const readPrefs=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(PREF_KEY)||'null')||{};
      return {
        duration:Math.max(1,Math.min(3600,Number(raw.duration)||90)),
        sinkId:String(raw.sinkId||''),
        sinkLabel:String(raw.sinkLabel||'')
      };
    }catch{
      return {duration:90,sinkId:'',sinkLabel:''};
    }
  };

  const prefs=readPrefs();
  const savePrefs=()=>localStorage.setItem(PREF_KEY,JSON.stringify(prefs));

  let duration=prefs.duration;
  let remaining=duration;
  let running=false;
  let endAt=0;
  let tickId=null;
  let wakeLock=null;
  let audio=null;
  let beepUrl='';
  let quickTapTimer=null;

  const supportsExplicitAudioOutput=()=>(
    window.isSecureContext &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.selectAudioOutput==='function' &&
    typeof HTMLMediaElement!=='undefined' &&
    typeof HTMLMediaElement.prototype.setSinkId==='function'
  );

  const formatTime=seconds=>{
    seconds=Math.max(0,Math.ceil(Number(seconds)||0));
    return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  };

  const makeBeepUrl=()=>{
    if(beepUrl)return beepUrl;

    const sampleRate=44100;
    const totalSeconds=2.4;
    const samples=Math.floor(sampleRate*totalSeconds);
    const buffer=new ArrayBuffer(44+samples*2);
    const view=new DataView(buffer);
    const writeText=(offset,text)=>{
      for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));
    };

    writeText(0,'RIFF');
    view.setUint32(4,36+samples*2,true);
    writeText(8,'WAVE');
    writeText(12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*2,true);
    view.setUint16(32,2,true);
    view.setUint16(34,16,true);
    writeText(36,'data');
    view.setUint32(40,samples*2,true);

    for(let i=0;i<samples;i++){
      const t=i/sampleRate;
      const patternPeriod=.48;
      const pulseLength=.24;
      const local=t%patternPeriod;

      let value=0;
      if(t<2.16&&local<pulseLength){
        const attack=Math.min(1,local/.015);
        const release=Math.min(1,Math.max(0,(pulseLength-local)/.05));
        const envelope=Math.max(0,Math.min(attack,release));
        value=.30*envelope*Math.sin(2*Math.PI*880*local);
      }
      view.setInt16(44+i*2,Math.max(-1,Math.min(1,value))*32767,true);
    }

    beepUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
    return beepUrl;
  };

  const ensureAudio=async()=>{
    if(!audio){
      audio=new Audio(makeBeepUrl());
      audio.preload='auto';
      audio.playsInline=true;
    }

    if(supportsExplicitAudioOutput()){
      if(prefs.sinkId){
        try{
          await audio.setSinkId(prefs.sinkId);
        }catch{
          prefs.sinkId='';
          prefs.sinkLabel='';
          savePrefs();
          try{await audio.setSinkId('default');}catch{}
        }
      }else{
        try{
          if(audio.sinkId&&audio.sinkId!=='default')await audio.setSinkId('default');
        }catch{}
      }
    }

    return audio;
  };

  const statusText=()=>{
    if(prefs.sinkId&&supportsExplicitAudioOutput()){
      return '終了音: '+(prefs.sinkLabel||'選択済みの音声出力')+'。';
    }
    if(supportsExplicitAudioOutput()){
      return '終了音は端末の現在のメディア出力先に従います。必要な場合は出力先を固定できます。';
    }
    return '終了音はAndroidの現在のメディア出力先に従います。イヤホン / Bluetooth接続中は通常そちらから再生されます。';
  };

  const style=document.createElement('style');
  style.textContent=`
    .topbar-actions{display:flex;gap:8px;align-items:center}
    .quick-timer-btn{touch-action:manipulation;position:relative}
    .quick-timer-btn::after{content:'30/60';position:absolute;left:50%;bottom:-16px;transform:translateX(-50%);font-size:.52rem;font-weight:850;color:var(--muted);white-space:nowrap;pointer-events:none}
    .timer-card{max-width:680px;width:100%;justify-self:center}
    .timer-card .section-head{margin-bottom:2px}
    .timer-display{font-size:clamp(4rem,16vw,7rem);font-weight:950;letter-spacing:.03em;line-height:1;text-align:center;padding:26px 8px;color:var(--accent);font-variant-numeric:tabular-nums}
    .timer-presets{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
    .timer-presets button{border:1px solid var(--line);background:var(--surface2);color:var(--text);border-radius:12px;padding:10px 8px;font:inherit;font-weight:800;cursor:pointer}
    .timer-presets button.active{border-color:var(--accent);color:var(--accent);background:var(--surface3)}
    .timer-actions{display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-top:12px}
    .timer-actions button{min-height:52px;font-size:1rem}
    .timer-custom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
    .timer-custom label{display:grid;gap:5px;color:var(--muted);font-size:.76rem}
    .timer-custom input{width:100%}
    .timer-audio-box{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;margin-top:18px;padding:14px;background:var(--surface2);border:1px solid var(--line);border-radius:14px}
    .timer-audio-box p{margin:5px 0 0;font-size:.78rem}
    .timer-audio-note{color:var(--muted);opacity:.9}
    .timer-audio-actions{display:grid;gap:6px}
    .timer-audio-actions button{white-space:nowrap}
    @media(max-width:700px){
      .timer-presets{grid-template-columns:repeat(3,1fr)}
      .timer-audio-box{grid-template-columns:1fr}
      .timer-audio-actions{grid-template-columns:1fr 1fr}
    }
  `;
  document.head.appendChild(style);

  const shell=document.querySelector('.shell');
  const nav=document.querySelector('#simpleTabs');
  const themeBtn=document.querySelector('#themeBtn');
  if(!shell||!nav||!themeBtn)return;

  const card=document.createElement('section');
  card.className='card timer-card app-section-hidden';
  card.dataset.appSection='timer';
  card.innerHTML=`
    <div class="section-head simple-head">
      <div><h2>タイマー</h2></div>
    </div>
    <div id="restTimerDisplay" class="timer-display">01:30</div>
    <div class="timer-presets">
      <button type="button" data-timer-seconds="30">30秒</button>
      <button type="button" data-timer-seconds="60">60秒</button>
      <button type="button" data-timer-seconds="90">90秒</button>
      <button type="button" data-timer-seconds="120">2分</button>
      <button type="button" data-timer-seconds="180">3分</button>
    </div>
    <div class="timer-actions">
      <button type="button" id="restTimerStartBtn" class="primary">開始</button>
      <button type="button" id="restTimerResetBtn" class="secondary">リセット</button>
    </div>
    <div class="timer-custom">
      <label><span>秒数</span><input id="restTimerCustomSeconds" type="number" min="10" max="3600" step="10" inputmode="numeric"></label>
      <button type="button" id="restTimerSetBtn" class="secondary">設定</button>
    </div>
    <div class="timer-audio-box">
      <div>
        <strong>終了音</strong>
        <p id="restTimerAudioStatus" class="muted"></p>
        <p class="timer-audio-note">Web版ではAndroidのメディア出力に従うため、イヤホン未接続時は本体スピーカーから鳴る場合があります。</p>
      </div>
      <div class="timer-audio-actions">
        <button type="button" id="restTimerOutputBtn" class="secondary">出力先を固定</button>
        <button type="button" id="restTimerTestBtn" class="text-btn">テスト音</button>
      </div>
    </div>
  `;
  shell.appendChild(card);

  const tab=document.createElement('button');
  tab.type='button';
  tab.dataset.simpleTab='timer';
  tab.textContent='タイマー';
  const exercisesTab=nav.querySelector('[data-simple-tab="exercises"]');
  nav.insertBefore(tab,exercisesTab||null);

  const topbar=themeBtn.parentElement;
  let actions=topbar.querySelector('.topbar-actions');
  if(!actions){
    actions=document.createElement('div');
    actions.className='topbar-actions';
    topbar.insertBefore(actions,themeBtn);
    actions.appendChild(themeBtn);
  }

  const quickBtn=document.createElement('button');
  quickBtn.type='button';
  quickBtn.className='icon-btn quick-timer-btn';
  quickBtn.setAttribute('aria-label','タイマー。1タップで30秒、2連続タップで60秒');
  quickBtn.title='1タップ: 30秒 / 2タップ: 60秒';
  quickBtn.textContent='⏱';
  actions.insertBefore(quickBtn,themeBtn);

  const display=card.querySelector('#restTimerDisplay');
  const startBtn=card.querySelector('#restTimerStartBtn');
  const resetBtn=card.querySelector('#restTimerResetBtn');
  const customInput=card.querySelector('#restTimerCustomSeconds');
  const setBtn=card.querySelector('#restTimerSetBtn');
  const outputBtn=card.querySelector('#restTimerOutputBtn');
  const testBtn=card.querySelector('#restTimerTestBtn');
  const audioStatus=card.querySelector('#restTimerAudioStatus');

  const render=()=>{
    display.textContent=formatTime(remaining);
    startBtn.textContent=running?'一時停止':'開始';

    if(document.activeElement!==customInput)customInput.value=String(duration);

    card.querySelectorAll('[data-timer-seconds]').forEach(btn=>{
      btn.classList.toggle('active',Number(btn.dataset.timerSeconds)===duration);
    });

    audioStatus.textContent=statusText();
    outputBtn.hidden=!supportsExplicitAudioOutput();
    testBtn.disabled=false;
  };

  const releaseWakeLock=async()=>{
    if(!wakeLock)return;
    try{await wakeLock.release();}catch{}
    wakeLock=null;
  };

  const requestWakeLock=async()=>{
    if(!running||document.visibilityState!=='visible'||!('wakeLock'in navigator))return;
    try{
      wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release',()=>{wakeLock=null;});
    }catch{}
  };

  const stopTick=()=>{
    if(tickId){
      clearInterval(tickId);
      tickId=null;
    }
  };

  const playAlert=async()=>{
    try{
      const el=await ensureAudio();
      el.pause();
      el.currentTime=0;
      el.muted=false;
      await el.play();
    }catch{}
  };

  const primeAlert=async()=>{
    try{
      const el=await ensureAudio();
      el.muted=true;
      el.currentTime=0;
      await el.play();
      el.pause();
      el.currentTime=0;
      el.muted=false;
    }catch{}
  };

  const sync=()=>{
    if(!running)return;

    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    if(remaining<=0){
      running=false;
      endAt=0;
      stopTick();
      releaseWakeLock();
      render();

      if(navigator.vibrate)navigator.vibrate([180,100,180]);
      playAlert();
      return;
    }

    render();
  };

  const startTick=()=>{
    stopTick();
    tickId=setInterval(sync,250);
  };

  const startTimer=()=>{
    if(running)return;
    if(remaining<=0)remaining=duration;

    endAt=Date.now()+remaining*1000;
    running=true;
    startTick();
    requestWakeLock();
    primeAlert();
    render();
  };

  const startOrPause=()=>{
    if(running){
      remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
      running=false;
      endAt=0;
      stopTick();
      releaseWakeLock();
      render();
      return;
    }

    startTimer();
  };

  const reset=()=>{
    running=false;
    endAt=0;
    stopTick();
    releaseWakeLock();
    remaining=duration;
    render();
  };

  const setDuration=seconds=>{
    seconds=Math.round(Number(seconds));
    if(!Number.isFinite(seconds)||seconds<1)return;

    seconds=Math.round(seconds/10)*10;
    duration=Math.max(10,Math.min(3600,seconds));
    prefs.duration=duration;
    savePrefs();
    reset();
  };

  const showTimerTab=()=>{
    document.querySelectorAll('[data-app-section]').forEach(el=>{
      el.classList.toggle('app-section-hidden',el!==card);
    });
    document.querySelectorAll('[data-simple-tab]').forEach(btn=>{
      btn.classList.toggle('active',btn===tab);
    });
    window.scrollTo(0,0);
  };

  const quickStart=seconds=>{
    setDuration(seconds);
    showTimerTab();
    startTimer();
  };

  const configureOutput=async()=>{
    if(!supportsExplicitAudioOutput())return;

    try{
      const device=await navigator.mediaDevices.selectAudioOutput();

      if(!device||!device.deviceId||device.deviceId==='default'){
        prefs.sinkId='';
        prefs.sinkLabel='';
      }else{
        prefs.sinkId=device.deviceId;
        prefs.sinkLabel=device.label||'選択済みの音声出力';
      }

      savePrefs();
      await ensureAudio();
      render();
    }catch(error){
      if(error?.name==='AbortError')return;
      prefs.sinkId='';
      prefs.sinkLabel='';
      savePrefs();
      render();
    }
  };

  card.querySelectorAll('[data-timer-seconds]').forEach(btn=>{
    btn.addEventListener('click',()=>setDuration(btn.dataset.timerSeconds));
  });

  startBtn.addEventListener('click',startOrPause);
  resetBtn.addEventListener('click',reset);
  setBtn.addEventListener('click',()=>setDuration(customInput.value));
  customInput.addEventListener('keydown',event=>{
    if(event.key==='Enter')setDuration(customInput.value);
  });
  outputBtn.addEventListener('click',configureOutput);
  testBtn.addEventListener('click',playAlert);

  tab.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    showTimerTab();
  });

  quickBtn.addEventListener('click',event=>{
    event.preventDefault();

    // Prime media immediately while this is still a direct user gesture.
    primeAlert();

    if(quickTapTimer){
      clearTimeout(quickTapTimer);
      quickTapTimer=null;
      quickStart(60);
      return;
    }

    quickTapTimer=setTimeout(()=>{
      quickTapTimer=null;
      quickStart(30);
    },280);
  });

  document.addEventListener('visibilitychange',()=>{
    if(!running)return;
    sync();
    if(document.visibilityState==='visible')requestWakeLock();
  });

  window.addEventListener('beforeunload',()=>{
    stopTick();
    releaseWakeLock();
    if(quickTapTimer)clearTimeout(quickTapTimer);
    if(beepUrl)URL.revokeObjectURL(beepUrl);
  });

  render();
})();