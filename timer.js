// Training timer.
(() => {
  const PREF_KEY='training.restTimer.v3';

  const readPrefs=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(PREF_KEY)||'null')||{};
      return {
        duration:Math.max(1,Math.min(3600,Number(raw.duration)||90)),
        quickSingle:Math.max(1,Math.min(3600,Number(raw.quickSingle)||35)),
        quickDouble:Math.max(1,Math.min(3600,Number(raw.quickDouble)||65)),
        sinkId:String(raw.sinkId||''),
        sinkLabel:String(raw.sinkLabel||'')
      };
    }catch{
      return {duration:90,quickSingle:35,quickDouble:65,sinkId:'',sinkLabel:''};
    }
  };

  const prefs=readPrefs();
  const savePrefs=()=>localStorage.setItem(PREF_KEY,JSON.stringify(prefs));

  let duration=prefs.duration;
  let remaining=duration;
  let running=false;
  let runToken=0;
  let endAt=0;
  let tickId=null;
  let wakeLock=null;
  let quickTapTimer=null;
  let trackUrl='';
  let trackDuration=0;
  let mediaPlaying=false;
  let fallbackPreviousRemaining=remaining;

  const timerAudio=new Audio();
  timerAudio.preload='auto';
  timerAudio.playsInline=true;
  timerAudio.volume=0.28;

  let testUrl='';
  const testAudio=new Audio();
  testAudio.preload='auto';
  testAudio.playsInline=true;
  testAudio.volume=0.28;

  const supportsExplicitAudioOutput=()=>(
    window.isSecureContext &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.selectAudioOutput==='function' &&
    typeof HTMLMediaElement!=='undefined' &&
    typeof HTMLMediaElement.prototype.setSinkId==='function'
  );

  // Never play through the unselected/default device speaker.
  // Explicit output selection is not universally supported, especially on phones.
  const audioEnabled=()=>Boolean(prefs.sinkId&&supportsExplicitAudioOutput());

  const formatTime=seconds=>{
    seconds=Math.max(0,Math.ceil(Number(seconds)||0));
    return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  };

  const writeWavHeader=(view,dataSize,sampleRate)=>{
    const writeText=(offset,text)=>{
      for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));
    };
    writeText(0,'RIFF');
    view.setUint32(4,36+dataSize,true);
    writeText(8,'WAVE');
    writeText(12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate,true);
    view.setUint16(32,1,true);
    view.setUint16(34,8,true);
    writeText(36,'data');
    view.setUint32(40,dataSize,true);
  };

  const addTone=(samples,sampleRate,start,length,freq,amplitude=.28)=>{
    const from=Math.max(0,Math.floor(start*sampleRate));
    const to=Math.min(samples.length,Math.floor((start+length)*sampleRate));
    for(let i=from;i<to;i++){
      const local=(i/sampleRate)-start;
      const attack=Math.min(1,local/.012);
      const release=Math.min(1,Math.max(0,(length-local)/.05));
      const envelope=Math.max(0,Math.min(attack,release));
      const wave=Math.sin(2*Math.PI*freq*local);
      const value=samples[i]+Math.round(amplitude*127*envelope*wave);
      samples[i]=Math.max(0,Math.min(255,value));
    }
  };

  const makeTimerTrackUrl=seconds=>{
    seconds=Math.max(1,Math.min(3600,Number(seconds)||1));
    const sampleRate=4000;
    const finalTail=1.42;
    const totalSeconds=seconds+finalTail;
    const dataSize=Math.ceil(totalSeconds*sampleRate);
    const buffer=new ArrayBuffer(44+dataSize);
    const view=new DataView(buffer);
    writeWavHeader(view,dataSize,sampleRate);

    const samples=new Uint8Array(buffer,44,dataSize);
    samples.fill(128);

    // Any duration: sound whenever remaining time crosses a positive multiple of 10.
    // Exact starting time is excluded, so 60 seconds starts silently and first chime is at 50.
    let marker=Math.floor((seconds-.001)/10)*10;
    for(;marker>=10;marker-=10){
      const elapsed=seconds-marker;
      addTone(samples,sampleRate,elapsed,.24,880,.30);
    }

    // Different completion sound begins exactly at 0 remaining.
    addTone(samples,sampleRate,seconds,.28,660,.34);
    addTone(samples,sampleRate,seconds+.40,.28,880,.34);
    addTone(samples,sampleRate,seconds+.80,.42,1100,.36);

    return URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
  };

  const makeFinalTestUrl=()=>{
    if(testUrl)return testUrl;
    const sampleRate=4000;
    const totalSeconds=1.42;
    const dataSize=Math.ceil(totalSeconds*sampleRate);
    const buffer=new ArrayBuffer(44+dataSize);
    const view=new DataView(buffer);
    writeWavHeader(view,dataSize,sampleRate);
    const samples=new Uint8Array(buffer,44,dataSize);
    samples.fill(128);
    addTone(samples,sampleRate,0,.28,660,.34);
    addTone(samples,sampleRate,.40,.28,880,.34);
    addTone(samples,sampleRate,.80,.42,1100,.36);
    testUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
    return testUrl;
  };

  const applyOutput=async el=>{
    if(!supportsExplicitAudioOutput())return;
    if(prefs.sinkId){
      try{
        await el.setSinkId(prefs.sinkId);
        return;
      }catch{
        prefs.sinkId='';
        prefs.sinkLabel='';
        savePrefs();
      }
    }
    try{
      if(el.sinkId&&el.sinkId!=='default')await el.setSinkId('default');
    }catch{}
  };

  const prepareTrack=async(seconds,elapsed=0)=>{
    seconds=Math.max(1,Math.min(3600,Number(seconds)||1));
    if(trackDuration!==seconds||!timerAudio.src){
      timerAudio.pause();
      if(trackUrl)URL.revokeObjectURL(trackUrl);
      trackUrl=makeTimerTrackUrl(seconds);
      trackDuration=seconds;
      timerAudio.src=trackUrl;
      timerAudio.load();
    }
    await applyOutput(timerAudio);
    try{
      timerAudio.currentTime=Math.max(0,Math.min(seconds,Number(elapsed)||0));
    }catch{}
  };

  const setMediaSessionState=state=>{
    if(!('mediaSession'in navigator))return;
    try{
      navigator.mediaSession.playbackState=state;
      if(state==='playing'&&typeof MediaMetadata!=='undefined'){
        navigator.mediaSession.metadata=new MediaMetadata({
          title:'Training Timer',
          artist:'Training'
        });
      }
    }catch{}
  };

  const statusText=()=>{
    if(audioEnabled()){
      return '音声出力: '+(prefs.sinkLabel||'選択済み機器')+'。音量は控えめに設定しています。';
    }
    return '音声出力は未設定のため無音です。本体スピーカーを使いません。出力先の選択に対応するブラウザでのみ音声を有効化できます。';
  };

  const style=document.createElement('style');
  style.textContent=`
    .topbar-actions{display:flex;gap:8px;align-items:center}
    .quick-timer-btn{touch-action:manipulation;position:relative}
    .quick-timer-btn::after{content:attr(data-quick-label);position:absolute;left:50%;bottom:-16px;transform:translateX(-50%);font-size:.52rem;font-weight:850;color:var(--muted);white-space:nowrap;pointer-events:none}
    .timer-card{max-width:680px;width:100%;justify-self:center}
    .timer-card .section-head{margin-bottom:2px}
    .timer-display{font-size:clamp(4rem,16vw,7rem);font-weight:950;letter-spacing:.03em;line-height:1;text-align:center;padding:26px 8px;color:var(--accent);font-variant-numeric:tabular-nums}
    .timer-presets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
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
    .timer-vibration-result{margin:8px 0 0;color:var(--muted);font-size:.78rem;line-height:1.5}
    .timer-vibration-result[data-kind="warning"]{color:var(--gold)}
    .timer-vibration-result[data-kind="success"]{color:var(--accent)}
    .timer-audio-actions button{min-height:37px}
    .timer-audio-actions{display:grid;gap:6px}
    .timer-audio-actions button{white-space:nowrap}.quick-timer-settings{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:10px;align-items:end;margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--surface2)}.quick-timer-settings label{display:grid;gap:5px;color:var(--muted);font-size:.76rem}.quick-timer-settings input{width:100%}.quick-timer-settings-status{grid-column:1/-1;color:var(--accent);font-size:.76rem;min-height:1em}
    @media(max-width:700px){
      .timer-presets{grid-template-columns:repeat(3,1fr)}
      .timer-audio-box{grid-template-columns:1fr}
      .timer-audio-actions{grid-template-columns:1fr 1fr}.quick-timer-settings{grid-template-columns:1fr 1fr}.quick-timer-settings button{grid-column:1/-1}
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
      <button type="button" data-timer-seconds="240">4分</button>
    </div>
    <div class="timer-actions">
      <button type="button" id="restTimerStartBtn" class="primary">開始</button>
      <button type="button" id="restTimerResetBtn" class="secondary">リセット</button>
    </div>
    <div class="timer-custom">
      <label><span>秒数</span><input id="restTimerCustomSeconds" type="number" min="1" max="3600" step="1" inputmode="numeric"></label>
      <button type="button" id="restTimerSetBtn" class="secondary">設定</button>
    </div>
    <div class="timer-audio-box">
      <div>
        <strong>タイマー音</strong>
        <p id="restTimerAudioStatus" class="muted"></p>
        <p class="timer-audio-note">時間ボタンを押すと即開始します。音声は選択済みの出力先でのみ再生されます。画面を表示している間は対応端末で振動を試みます。画面ロック中はWebの振動APIを使えないため、終了通知を有効にすると端末設定に応じて通知で知らせます。</p>
        <p id="restTimerVibrateStatus" class="timer-vibration-result" aria-live="polite"></p>
      </div>
      <div class="timer-audio-actions">
        <button type="button" id="restTimerOutputBtn" class="secondary">出力先を固定</button>
        <button type="button" id="restTimerTestBtn" class="text-btn">終了音テスト</button>
        <button type="button" id="restTimerVibrationTestBtn" class="secondary">振動テスト</button>
        <button type="button" id="restTimerNotifyBtn" class="secondary">ロック時の終了通知を有効化</button>
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
  const syncQuickButtonLabel=()=>{
    quickBtn.dataset.quickLabel=prefs.quickSingle+'/'+prefs.quickDouble;
    quickBtn.setAttribute('aria-label','タイマー。1タップで'+prefs.quickSingle+'秒、2連続タップで'+prefs.quickDouble+'秒');
    quickBtn.title='1タップ: '+prefs.quickSingle+'秒 / 2タップ: '+prefs.quickDouble+'秒';
  };
  syncQuickButtonLabel();
  quickBtn.textContent='⏱';
  actions.insertBefore(quickBtn,themeBtn);

  const settingsCard=document.querySelector('.app-settings-card');
  if(settingsCard&&!settingsCard.querySelector('#quickTimerSettings')){
    const quickSettings=document.createElement('div');
    quickSettings.id='quickTimerSettings';
    quickSettings.className='quick-timer-settings';
    quickSettings.innerHTML='<label><span>1タップ</span><input id="quickTimerSingleInput" type="number" min="1" max="3600" step="1" inputmode="numeric"></label>'+
      '<label><span>2タップ</span><input id="quickTimerDoubleInput" type="number" min="1" max="3600" step="1" inputmode="numeric"></label>'+
      '<button type="button" id="saveQuickTimerBtn" class="primary">保存</button><span id="quickTimerSettingsStatus" class="quick-timer-settings-status"></span>';
    settingsCard.appendChild(quickSettings);
    const single=quickSettings.querySelector('#quickTimerSingleInput');
    const double=quickSettings.querySelector('#quickTimerDoubleInput');
    const status=quickSettings.querySelector('#quickTimerSettingsStatus');
    single.value=String(prefs.quickSingle);
    double.value=String(prefs.quickDouble);
    quickSettings.querySelector('#saveQuickTimerBtn').onclick=()=>{
      const a=Math.round(Number(single.value)),b=Math.round(Number(double.value));
      if(!Number.isFinite(a)||!Number.isFinite(b)||a<1||b<1||a>3600||b>3600){
        status.textContent='1〜3600秒で入力してください。';
        return;
      }
      prefs.quickSingle=a;
      prefs.quickDouble=b;
      savePrefs();
      syncQuickButtonLabel();
      status.textContent='保存しました。';
    };
  }

  const display=card.querySelector('#restTimerDisplay');
  const startBtn=card.querySelector('#restTimerStartBtn');
  const resetBtn=card.querySelector('#restTimerResetBtn');
  const customInput=card.querySelector('#restTimerCustomSeconds');
  const setBtn=card.querySelector('#restTimerSetBtn');
  const outputBtn=card.querySelector('#restTimerOutputBtn');
  const testBtn=card.querySelector('#restTimerTestBtn');
  const vibrationTestBtn=card.querySelector('#restTimerVibrationTestBtn');
  const notifyBtn=card.querySelector('#restTimerNotifyBtn');
  const vibrationStatus=card.querySelector('#restTimerVibrateStatus');
  const audioStatus=card.querySelector('#restTimerAudioStatus');
  const updateVibrationStatus=(msg,kind='warning')=>{
    vibrationStatus.textContent=msg;
    vibrationStatus.dataset.kind=kind;
  };

  const render=()=>{
    display.textContent=formatTime(remaining);
    startBtn.textContent=running?'一時停止':'開始';

    if(document.activeElement!==customInput)customInput.value=String(duration);

    card.querySelectorAll('[data-timer-seconds]').forEach(btn=>{
      btn.classList.toggle('active',Number(btn.dataset.timerSeconds)===duration);
    });

    audioStatus.textContent=statusText();
    outputBtn.hidden=!supportsExplicitAudioOutput();
    notifyBtn.hidden=!(('Notification'in window)&&('serviceWorker'in navigator));
    if(!notifyBtn.hidden&&Notification.permission==='granted'){
      notifyBtn.textContent='終了通知：許可済み';
    }else if(!notifyBtn.hidden&&Notification.permission==='denied'){
      notifyBtn.textContent='終了通知：ブラウザ設定で許可が必要';
    }
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

  const fallbackChimes=(previous,current)=>{
    if(mediaPlaying)return;
    const first=Math.floor((duration-.001)/10)*10;
    for(let marker=first;marker>=10;marker-=10){
      if(previous>marker&&current<=marker){
        playWarningFallback();
        break;
      }
    }
  };

  let warningFallbackUrl='';
  const playWarningFallback=async()=>{
    try{
      if(!warningFallbackUrl){
        const sampleRate=4000;
        const dataSize=Math.ceil(.26*sampleRate);
        const buffer=new ArrayBuffer(44+dataSize);
        const view=new DataView(buffer);
        writeWavHeader(view,dataSize,sampleRate);
        const samples=new Uint8Array(buffer,44,dataSize);
        samples.fill(128);
        addTone(samples,sampleRate,0,.24,880,.30);
        warningFallbackUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));
      }
      if(!audioEnabled())return;
      const el=new Audio(warningFallbackUrl);
      el.playsInline=true;
      el.volume=0.28;
      await applyOutput(el);
      await el.play();
    }catch{}
  };

  const playFinalFallback=async()=>{
    if(!audioEnabled())return;
    try{
      testAudio.pause();
      testAudio.src=makeFinalTestUrl();
      testAudio.currentTime=0;
      await applyOutput(testAudio);
      await testAudio.play();
    }catch{}
  };

  // Vibration requires a supported browser/device and may be blocked in the background.
  const vibrateCompletion=()=>{
    if(document.visibilityState!=='visible')return 'hidden';
    if(typeof navigator.vibrate!=='function')return 'unsupported';
    try{return navigator.vibrate([300,140,300,140,500])?'requested':'rejected';}
    catch{return 'rejected';}
  };
  const vibrationMessage=result=>{
    if(result==='hidden')return '画面ロック中・非表示ではWebの振動APIを使えません。終了通知を許可していればOSの通知を試みます。';
    if(result==='unsupported')return 'このブラウザは振動APIに対応していません。Android版Chromeなどの対応ブラウザで確認してください。';
    if(result==='rejected')return 'ブラウザが振動を拒否しました。端末の振動設定・省電力設定を確認してください。';
    return 'ブラウザに振動要求を送りました。実際に端末が振動したかどうかはWebから検出できません。';
  };
  const showCompletionNotification=async()=>{
    if(!('Notification'in window)||Notification.permission!=='granted'||!('serviceWorker'in navigator))return false;
    try{
      const registration=await navigator.serviceWorker.ready;
      await registration.showNotification('休憩タイマー終了',{
        body:'休憩時間が終わりました。',
        icon:'./training-biceps-192.png?v=2',
        tag:'training-timer-complete',
        renotify:true,
        vibrate:[300,140,300,140,500]
      });
      return true;
    }catch{return false;}
  };

  const finishTimer=()=>{
    if(!running)return;
    ++runToken;
    remaining=0;
    running=false;
    endAt=0;
    stopTick();
    releaseWakeLock();
    render();
    const vibration=vibrateCompletion();
    if(vibration==='hidden'){
      updateVibrationStatus(vibrationMessage(vibration));
      showCompletionNotification();
    }else{
      updateVibrationStatus(vibrationMessage(vibration),vibration==='requested'?'success':'warning');
    }
    if(!mediaPlaying)playFinalFallback();
    setMediaSessionState('none');
  };

  const sync=()=>{
    if(!running)return;

    const previous=fallbackPreviousRemaining;
    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    fallbackPreviousRemaining=remaining;
    fallbackChimes(previous,remaining);

    if(remaining<=0){
      finishTimer();
      return;
    }
    render();
  };

  const startTick=()=>{
    stopTick();
    tickId=setInterval(sync,250);
  };

  const startTimer=async()=>{
    if(running)return;
    if(remaining<=0)remaining=duration;
    const selectedDuration=duration;
    const elapsed=Math.max(0,selectedDuration-remaining);
    const token=++runToken;

    // Begin the countdown synchronously on the actual button click.
    endAt=Date.now()+remaining*1000;
    fallbackPreviousRemaining=remaining;
    running=true;
    startTick();
    requestWakeLock();
    render();

    try{
      await prepareTrack(selectedDuration,elapsed);
      if(!running||token!==runToken)return;
      // Keep a muted media track running when no output is selected.
      // This may help countdown continuity under screen lock without speaker sound.
      timerAudio.muted=!audioEnabled();
      timerAudio.volume=0.28;
      await timerAudio.play();
      if(!running||token!==runToken){
        timerAudio.pause();
        return;
      }
      mediaPlaying=true;
      setMediaSessionState('playing');
    }catch{
      if(token!==runToken)return;
      mediaPlaying=false;
      setMediaSessionState('none');
    }
  };

  const pauseTimer=()=>{
    ++runToken;
    remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    running=false;
    endAt=0;
    stopTick();
    releaseWakeLock();
    timerAudio.pause();
    mediaPlaying=false;
    setMediaSessionState('paused');
    render();
  };

  const startOrPause=()=>{
    if(running){
      pauseTimer();
      return;
    }
    startTimer();
  };

  const reset=()=>{
    ++runToken;
    running=false;
    endAt=0;
    stopTick();
    releaseWakeLock();
    timerAudio.pause();
    try{timerAudio.currentTime=0;}catch{}
    mediaPlaying=false;
    setMediaSessionState('none');
    remaining=duration;
    fallbackPreviousRemaining=remaining;
    render();
  };

  const setDuration=seconds=>{
    seconds=Math.round(Number(seconds));
    if(!Number.isFinite(seconds)||seconds<1)return;

    duration=Math.max(1,Math.min(3600,seconds));
    prefs.duration=duration;
    savePrefs();

    if(trackDuration!==duration){
      timerAudio.pause();
      if(trackUrl){
        URL.revokeObjectURL(trackUrl);
        trackUrl='';
      }
      trackDuration=0;
    }
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
      await applyOutput(timerAudio);
      await applyOutput(testAudio);
      render();
    }catch(error){
      if(error?.name==='AbortError')return;
      prefs.sinkId='';
      prefs.sinkLabel='';
      savePrefs();
      render();
    }
  };

  const testFinal=async()=>{
    if(!audioEnabled()){
      updateVibrationStatus('音声出力が選択されていないため終了音は無音です。');
      return;
    }
    try{
      testAudio.pause();
      testAudio.src=makeFinalTestUrl();
      testAudio.currentTime=0;
      await applyOutput(testAudio);
      await testAudio.play();
    }catch{}
  };

  const primeMedia=async()=>{
    if(!audioEnabled())return;
    try{
      timerAudio.muted=true;
      timerAudio.src=makeFinalTestUrl();
      timerAudio.currentTime=0;
      await timerAudio.play();
      timerAudio.pause();
      timerAudio.currentTime=0;
      timerAudio.muted=false;
      trackDuration=0;
    }catch{}
  };

  timerAudio.addEventListener('timeupdate',()=>{
    if(running&&timerAudio.currentTime>=duration)finishTimer();
  });
  timerAudio.addEventListener('ended',()=>{
    if(running)finishTimer();
    mediaPlaying=false;
    setMediaSessionState('none');
  });

  if('mediaSession'in navigator){
    try{
      navigator.mediaSession.setActionHandler('play',()=>{if(!running)startTimer();});
      navigator.mediaSession.setActionHandler('pause',()=>{if(running)pauseTimer();});
    }catch{}
  }

  card.querySelectorAll('[data-timer-seconds]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      setDuration(btn.dataset.timerSeconds);
      startTimer();
    });
  });

  startBtn.addEventListener('click',startOrPause);
  resetBtn.addEventListener('click',reset);
  setBtn.addEventListener('click',()=>setDuration(customInput.value));
  customInput.addEventListener('keydown',event=>{
    if(event.key==='Enter')setDuration(customInput.value);
  });
  outputBtn.addEventListener('click',configureOutput);
  testBtn.addEventListener('click',testFinal);
  vibrationTestBtn.addEventListener('click',()=>{
    const status=vibrateCompletion();
    updateVibrationStatus(vibrationMessage(status),status==='requested'?'success':'warning');
  });
  notifyBtn.addEventListener('click',async()=>{
    if(!('Notification'in window)||!('serviceWorker'in navigator))return;
    try{
      const permission=await Notification.requestPermission();
      render();
      updateVibrationStatus(permission==='granted'
        ?'終了通知を許可しました。画面ロック中は通知を試みます。振動の有無はOSの通知設定に依存します。'
        :'通知が許可されませんでした。端末・ブラウザの通知設定から変更できます。',
        permission==='granted'?'success':'warning');
    }catch{
      updateVibrationStatus('通知の許可を取得できませんでした。');
    }
  });

  tab.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    showTimerTab();
  });

  quickBtn.addEventListener('click',event=>{
    event.preventDefault();

    // Unlock media playback while we still have a direct user gesture.
    primeMedia();

    if(quickTapTimer){
      clearTimeout(quickTapTimer);
      quickTapTimer=null;
      quickStart(prefs.quickDouble);
      return;
    }

    quickTapTimer=setTimeout(()=>{
      quickTapTimer=null;
      quickStart(prefs.quickSingle);
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
    timerAudio.pause();
    testAudio.pause();
    if(quickTapTimer)clearTimeout(quickTapTimer);
    if(trackUrl)URL.revokeObjectURL(trackUrl);
    if(testUrl)URL.revokeObjectURL(testUrl);
    if(warningFallbackUrl)URL.revokeObjectURL(warningFallbackUrl);
  });

  render();
})();