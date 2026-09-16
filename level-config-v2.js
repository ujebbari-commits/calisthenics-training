// Level difficulty is independent from DOMS / soreness.
// Soreness may change today's exercise choice, but never changes level difficulty or progression.
(() => {
  if (typeof levels === 'undefined' || !Array.isArray(levels) || levels.length < 15) return;

  const configs = [
    {n:1,name:'Foundation I',phase:'Foundation',desc:'筋肥大の標準ベースライン。筋肉痛の有無とは切り離し、主要種目3セットから全身の基礎を作る。',mainSets:3,secondarySets:2,accessorySets:2,coreSets:2,mainReps:'10–15',secondaryReps:'10–15',accessoryReps:'12–15',rir:'3',finisher:'なし〜4分'},
    {n:2,name:'Foundation II',phase:'Foundation',desc:'主要種目は3セットを維持し、補助種目のトレーニング量を少し増やす。',mainSets:3,secondarySets:3,accessorySets:2,coreSets:2,mainReps:'10–15',secondaryReps:'10–15',accessoryReps:'12–15',rir:'3',finisher:'4分'},
    {n:3,name:'Base I',phase:'Base',desc:'8〜12回帯へ移行し、筋肥大向けの標準的な負荷を扱う。',mainSets:3,secondarySets:3,accessorySets:2,coreSets:2,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'12–15',rir:'2–3',finisher:'4分'},
    {n:4,name:'Base II',phase:'Base',desc:'補助種目を含む週間ボリュームを増やし、前回より1回または少し重い重量を狙う。',mainSets:3,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'2',finisher:'4〜6分'},
    {n:5,name:'Boss I',phase:'Checkpoint',desc:'最初のチェックポイント。フォームを保ちながら主要種目のベストセット更新を狙う。',mainSets:3,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
    {n:6,name:'Growth I',phase:'Hypertrophy',desc:'主要種目を4セットへ。筋肥大に必要な高品質な週間ボリュームを増やす。',mainSets:4,secondarySets:3,accessorySets:2,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'2',finisher:'4分'},
    {n:7,name:'Growth II',phase:'Hypertrophy',desc:'主要4セットを維持し、補助種目も増やして全身の筋肥大刺激を強める。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'8–12',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4〜6分'},
    {n:8,name:'Growth III',phase:'Hypertrophy',desc:'同じセット数で少し重い重量を扱える回数帯へ移行する。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'7–11',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
    {n:9,name:'Strength Size I',phase:'Strength + Size',desc:'主要種目を6〜10回帯へ。筋力向上と筋肥大を同時に狙う。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4分'},
    {n:10,name:'Boss II',phase:'Checkpoint',desc:'第2チェックポイント。主要種目の重量または回数の自己ベスト更新を狙う。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'6分'},
    {n:11,name:'Density I',phase:'Density',desc:'補助種目を効率よくまとめ、限られた時間で高品質なトレーニング量を確保する。',mainSets:4,secondarySets:3,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4分'},
    {n:12,name:'Density II',phase:'Density',desc:'主要種目と補助種目の両方で十分な週間ボリュームを安定してこなす。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–10',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1–2',finisher:'4〜6分'},
    {n:13,name:'Mastery I',phase:'Mastery',desc:'重量・可動域・コントロールを同時に伸ばし、主要セットを限界の約1回手前まで高品質に行う。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'6–9',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'4分'},
    {n:14,name:'Mastery II',phase:'Mastery',desc:'高いトレーニング量と強度を両立する上級フェーズ。フォームを保てる範囲で漸進的過負荷を続ける。',mainSets:4,secondarySets:4,accessorySets:4,coreSets:3,mainReps:'6–9',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'4〜6分'},
    {n:15,name:'Boss III',phase:'Endgame',desc:'最終レベル。主要種目は5〜8回の高負荷帯も使い、筋力と筋肥大の自己ベストを継続的に更新する。',mainSets:4,secondarySets:4,accessorySets:3,coreSets:3,mainReps:'5–8',secondaryReps:'8–12',accessoryReps:'10–15',rir:'1',finisher:'6分'}
  ];

  configs.forEach((cfg, i) => Object.assign(levels[i], cfg));

  const summaryCard = document.querySelector('.level-summary-card');
  if (summaryCard && !document.querySelector('#sorenessRuleNote')) {
    const note = document.createElement('p');
    note.id = 'sorenessRuleNote';
    note.className = 'entry-help';
    note.textContent = 'レベル難易度・XP・進級条件は筋肉痛とは無関係です。筋肉痛が強い日は、その日の部位変更・回復日・休養で調整します。';
    summaryCard.appendChild(note);
  }

  if (typeof renderAll === 'function') renderAll();
})();
