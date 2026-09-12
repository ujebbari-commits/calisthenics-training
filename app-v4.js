// v4 UX fixes: Yomitan-friendly workout panel + lazy Google Images exercise search.
(() => {
  const originalOpenWorkout = window.openWorkout;
  if (typeof originalOpenWorkout !== 'function') return;

  const imageQueries = {
    'ウォームアップ':'calisthenics shoulder scapula warm up exercise',
    'アシスト懸垂':'assisted pull up machine exercise form',
    'シーテッドロー':'seated row machine exercise form',
    'デッドハング':'dead hang exercise form',
    'ハンギング・ニー・レイズ':'hanging knee raise exercise form',
    'Tuck L-sit / Support hold':'tuck L sit support hold dip bars exercise',
    'モビリティ':'calisthenics shoulder hip mobility exercises',
    '壁倒立':'wall handstand exercise form',
    'アシストディップス':'assisted dip machine exercise form',
    'プッシュアップ':'push up exercise proper form',
    'パイクプッシュアップ':'pike push up exercise form',
    'サポートホールド':'support hold dip bars exercise',
    'レッグプレス':'leg press machine exercise form',
    'ブルガリアンスクワット':'Bulgarian split squat exercise form',
    'アシスト・ピストルスクワット':'assisted pistol squat exercise form',
    'カーフレイズ':'calf raise exercise form',
    'Hollow body hold':'hollow body hold exercise form',
    '壁倒立 / 倒立練習':'wall handstand practice exercise',
    '懸垂系':'pull up exercise proper form',
    'ディップス系':'dip exercise proper form calisthenics',
    'L-sit progression':'L sit progression tuck one leg full exercise',
    '深い自重スクワット':'deep bodyweight squat exercise form',
    'モビリティ・フロー':'calisthenics mobility flow exercise',
    '手首':'wrist mobility handstand exercise',
    '肩':'shoulder overhead mobility wall slide exercise',
    '胸椎':'thoracic mobility cat cow rotation exercise',
    '股関節':'90 90 hip mobility cossack squat exercise',
    'ハムストリング':'hamstring mobility stretch exercise form',
    '足首':'ankle mobility knee to wall exercise'
  };

  const workoutDialog = document.querySelector('#workoutDialog');
  if (!workoutDialog) return;

  let backdrop = document.querySelector('#workoutBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'workoutBackdrop';
    backdrop.className = 'workout-backdrop';
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
  }

  function closeWorkoutPanel() {
    if (workoutDialog.open) workoutDialog.close();
  }

  function cleanupWorkoutPanel() {
    backdrop.hidden = true;
    document.body.classList.remove('workout-panel-open');
    workoutDialog.classList.remove('yomitan-friendly-dialog');
  }

  backdrop.addEventListener('click', closeWorkoutPanel);
  workoutDialog.addEventListener('close', cleanupWorkoutPanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && workoutDialog.open && workoutDialog.classList.contains('yomitan-friendly-dialog')) {
      e.preventDefault();
      closeWorkoutPanel();
    }
  });

  function googleImageUrl(query, embedded = false) {
    const base = 'https://www.google.com/search';
    const params = new URLSearchParams({ tbm: 'isch', q: query, hl: 'ja' });
    if (embedded) params.set('igu', '1');
    return `${base}?${params.toString()}`;
  }

  function attachGoogleImageBoxes() {
    document.querySelectorAll('#exerciseList .exercise-guide').forEach(details => {
      if (details.querySelector('.google-images-box')) return;

      const exercise = details.closest('.exercise');
      const name = exercise?.querySelector('h3')?.textContent?.trim() || 'exercise';
      const query = imageQueries[name] || `${name} exercise form calisthenics`;
      const openUrl = googleImageUrl(query, false);

      const box = document.createElement('div');
      box.className = 'google-images-box';
      box.dataset.query = query;
      box.innerHTML = `
        <div class="google-images-head">
          <div>
            <strong>Google Images</strong>
            <span>${query}</span>
          </div>
          <a href="${openUrl}" target="_blank" rel="noopener noreferrer">Google画像で開く</a>
        </div>
        <div class="google-images-frame-wrap">
          <div class="google-images-placeholder">Google画像検索を読み込んでいます...</div>
          <iframe class="google-images-frame" title="${name} のGoogle画像検索" loading="lazy" referrerpolicy="no-referrer-when-downgrade" hidden></iframe>
        </div>
        <p class="google-images-note">Google側の埋め込み制限で表示されない場合は「Google画像で開く」を使ってください。</p>`;
      details.appendChild(box);

      const load = () => {
        if (!details.open || box.dataset.loaded === '1') return;
        const iframe = box.querySelector('.google-images-frame');
        const placeholder = box.querySelector('.google-images-placeholder');
        iframe.src = googleImageUrl(query, true);
        iframe.hidden = false;
        if (placeholder) placeholder.hidden = true;
        box.dataset.loaded = '1';
      };
      details.addEventListener('toggle', load);
      load();
    });
  }

  window.openWorkout = function(key) {
    // app-v3 normally calls showModal(), which puts the dialog in the browser top layer.
    // Temporarily suppress that call so Yomitan can remain above this panel.
    const realShowModal = workoutDialog.showModal;
    workoutDialog.showModal = () => {};
    try {
      originalOpenWorkout(key);
    } finally {
      workoutDialog.showModal = realShowModal;
    }

    if (workoutDialog.open) workoutDialog.close();
    workoutDialog.classList.add('yomitan-friendly-dialog');
    attachGoogleImageBoxes();
    backdrop.hidden = false;
    document.body.classList.add('workout-panel-open');
    workoutDialog.show();
  };

  const style = document.createElement('style');
  style.textContent = `
    body.workout-panel-open{overflow:hidden}
    .workout-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:900}
    #workoutDialog.yomitan-friendly-dialog[open]{position:fixed;top:4vh;left:50%;transform:translateX(-50%);margin:0;z-index:901;max-height:92vh}
    #workoutDialog.yomitan-friendly-dialog::backdrop{display:none}
    .google-images-box{margin-top:12px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}
    .google-images-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--surface2)}
    .google-images-head>div{display:grid;gap:2px;min-width:0}
    .google-images-head strong{font-size:.86rem;color:var(--text)}
    .google-images-head span{font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .google-images-head a{flex:0 0 auto;color:var(--accent);font-size:.78rem;font-weight:800;text-decoration:none}
    .google-images-frame-wrap{position:relative;min-height:250px;background:#fff}
    .google-images-frame{display:block;width:100%;height:250px;border:0;background:#fff}
    .google-images-frame[hidden]{display:none}
    .google-images-placeholder{position:absolute;inset:0;display:grid;place-items:center;padding:18px;color:#666;background:#fff;text-align:center;font-size:.85rem}
    .google-images-placeholder[hidden]{display:none}
    .google-images-note{margin:0;padding:8px 10px;color:var(--muted);font-size:.72rem;line-height:1.5}
    @media(max-width:520px){
      #workoutDialog.yomitan-friendly-dialog[open]{top:2vh;width:calc(100vw - 16px);max-height:96vh}
      .google-images-head{align-items:flex-start;flex-direction:column}
      .google-images-frame,.google-images-frame-wrap{height:220px;min-height:220px}
    }
  `;
  document.head.appendChild(style);
})();
