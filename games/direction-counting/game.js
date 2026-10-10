(() => {
  'use strict';
  const E=DirectionGame,T=GameText.html,$=id=>document.getElementById(id),KEY='bunny-direction-session-v2';
  const numbers=['one','two','three','four','five','six'];
  const info={
    '左':{css:'left',start:'左邊',move:'往右數',arrow:'→',voice:'questionLeft'},
    '右':{css:'right',start:'右邊',move:'往左數',arrow:'←',voice:'questionRight'},
    '上':{css:'up',start:'上面',move:'往下數',arrow:'↓',voice:'questionUp'},
    '下':{css:'down',start:'下面',move:'往上數',arrow:'↑',voice:'questionDown'}
  };
  const names={'🐻':'熊','🐱':'貓','🐸':'青蛙','🐰':'兔','🐼':'熊貓','🦊':'狐狸','🐵':'猴','🐤':'小雞','🐶':'狗'};
  let state=null,screen='home',soundOn=true,guideGeneration=0,guiding=false;
  const set=(id,text)=>{$(id).innerHTML=T(text);};
  document.querySelectorAll('[data-zh]').forEach(el=>{el.innerHTML=T(el.textContent);});
  function notice(text){set('storageNote',text);$('storageNote').hidden=false;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notice('這個視窗無法保留進度，請先完成這次尋寶。');}}
  try{const raw=localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw);if(E.valid(value))state=value;else{localStorage.removeItem(KEY);notice('舊進度無法讀取，請重新開始。');}}soundOn=localStorage.getItem('bunny-sound')!=='off';}catch{notice('這個視窗無法保留進度，請先完成這次尋寶。');}
  const voice=createGameVoice({audio:$('voice'),lines:GAME_VOICES,synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,status:s=>{
    if(screen!=='play')return;
    const messages={playing:'',tap:'點「再聽一次」，就能聽題目。',fallback:'正在使用備用語音。',unavailable:'語音暫時無法播放，請點喇叭再試。'};
    set('audioStatus',messages[s]||'');
  }});
  voice.enable(soundOn);
  function updateSound(){set('sound',soundOn?'🔊 聲音開':'🔇 聲音關');$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'關閉語音':'開啟語音');}
  function clearCount(){document.querySelectorAll('.counted').forEach(el=>el.classList.remove('counted'));document.querySelectorAll('.count-label').forEach(el=>el.remove());}
  function cancelWork(){guideGeneration++;guiding=false;voice.cancel();clearCount();set('help','🐾 一起數');}
  function show(id){screen=id;['home','play','checkpoint','done'].forEach(x=>{$(x).hidden=x!==id;});window.scrollTo({top:0,behavior:'auto'});}
  function home(){cancelWork();show('home');const resumable=state&&state.phase!=='done';$('resume').hidden=!resumable;set('resume','▶ 繼續尋寶');set('start',resumable?'重新開始':'🐾 開始尋寶');}
  function start(){cancelWork();state=E.create();save();render();}
  function render(){cancelWork();if(state.phase==='done'){result();return;}if(state.phase==='checkpoint'||state.phase==='treasure'){checkpoint();return;}question();}
  function progress(){const earned=E.stars(state),current=state.records[state.index];const completed=Math.min(20,state.index+(current?.solved?1:0));$('stars').textContent='⭐ '+earned+'/20';$('bar').style.width=completed/20*100+'%';$('progress').setAttribute('aria-valuenow',String(completed));}
  function question(){
    show('play');const q=state.questions[state.index],r=state.records[state.index],d=info[q.side],vertical=q.side==='上'||q.side==='下';
    set('roundName',E.stages[q.level].title);set('questionNumber','第 '+(q.level+1)+' 關 · 第 '+(state.index%5+1)+' / 5 題');progress();
    $('directionCue').innerHTML='<div class="cue '+d.css+'"><div class="cue-start">'+T('從'+d.start+'起點')+'</div><div class="cue-motion"><span class="arrow" aria-hidden="true">'+d.arrow+'</span>'+T(d.move)+'</div></div>';
    const startIndex=E.fromStart(q.side)?0:q.count-1;
    const endpoints=vertical?['上面','下面']:['左邊','右邊'];
    const labels='<div class="position-labels"><span class="'+(E.fromStart(q.side)?'active':'')+'">'+T(endpoints[0])+'</span><span class="'+(!E.fromStart(q.side)?'active':'')+'">'+T(endpoints[1])+'</span></div>';
    const animals=q.line.map((a,i)=>'<div class="animal '+(i===q.target?'selected ':'')+(i===startIndex?'start':'')+'" data-index="'+i+'" role="img" aria-label="'+names[a]+(i===q.target?'，星星目標':'')+(i===startIndex?'，起點':'')+'"><span class="emoji" aria-hidden="true">'+a+'</span>'+(i===q.target?'<span class="target-mark" aria-hidden="true">★</span>':'')+(i===startIndex?'<span class="start-flag">'+T('起點')+'</span>':'')+'</div>').join('');
    $('board').innerHTML='<div class="board '+(vertical?'vertical':'horizontal')+'" data-direction="'+q.side+'">'+labels+'<div class="line">'+animals+'</div><span class="count-rail" aria-hidden="true">'+d.arrow+'</span></div>';
    set('questionText','★ 圈起來的是第幾個？');$('questionText').tabIndex=-1;
    $('answers').innerHTML=Array.from({length:q.count},(_,i)=>'<button class="answer" data-n="'+(i+1)+'" aria-label="第 '+(i+1)+' 個">'+(i+1)+'</button>').join('');
    $('answers').querySelectorAll('button').forEach(b=>b.onclick=()=>choose(Number(b.dataset.n)));
    set('audioStatus','');feedback(r.solved?'答對了！⭐ 收集一顆星星。':r.attempts.length?'再試一次，兔兔可以陪你數。':'先找綠色起點，再跟著箭頭數。',!r.solved&&r.attempts.length>0);
    refreshAnswers();$('questionText').focus({preventScroll:true});if(!r.solved)voice.play(d.voice);
  }
  function refreshAnswers(){
    if(!state||screen!=='play')return;
    const q=state.questions[state.index],r=state.records[state.index];
    $('answers').querySelectorAll('button').forEach(b=>{const n=Number(b.dataset.n),wrong=r.attempts.includes(n)&&n!==E.ordinal(q);b.disabled=r.solved||guiding||wrong;b.classList.toggle('wrong',wrong);b.classList.toggle('correct',r.solved&&n===E.ordinal(q));});
    $('help').disabled=r.solved;$('next').hidden=!r.solved;
    set('next',state.index%5===4?'🎁 打開寶箱':'下一題 →');
  }
  function feedback(text,bad=false){set('feedback',text);$('feedback').classList.toggle('bad',Boolean(bad));}
  function choose(n){
    if(guiding)return;const event=E.answer(state,n);if(!event)return;cancelWork();save();progress();refreshAnswers();
    if(event.correct){feedback('答對了！⭐ 收集一顆星星。');voice.play('correct');$('next').focus({preventScroll:true});$('stars').classList.remove('celebrate');void $('stars').offsetWidth;$('stars').classList.add('celebrate');}
    else{feedback('再試一次，兔兔可以陪你數。',true);voice.play('retry');$('help').focus({preventScroll:true});}
  }
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function help(){
    if(guiding){cancelWork();refreshAnswers();return;}
    const r=state.records[state.index];if(r.solved)return;
    cancelWork();const generation=guideGeneration;guiding=true;r.assisted=true;save();set('help','⏹ 停止數數');refreshAnswers();
    const q=state.questions[state.index],order=E.order(q).slice(0,E.ordinal(q));feedback('從綠色起點，一起數到星星。');
    await Promise.all([voice.play('hint'),wait(600)]);
    for(let i=0;i<order.length;i++){
      if(generation!==guideGeneration)return;
      document.querySelectorAll('.counted').forEach(el=>el.classList.remove('counted'));
      const animal=$('board').querySelector('[data-index="'+order[i]+'"]');animal.classList.add('counted');
      const label=document.createElement('span');label.className='count-label';label.textContent=String(i+1);animal.append(label);
      await Promise.all([voice.play(numbers[i]),wait(850)]);
    }
    if(generation!==guideGeneration)return;
    guiding=false;set('help','🐾 再一起數');feedback('數到星星了！請選剛才的數字。');refreshAnswers();voice.play('helpEnd');
  }
  function checkpoint(){
    show('checkpoint');const final=state.phase==='treasure';$('chest').textContent=final?'🏰':'🎁';set('checkpointTitle','第 '+state.index/5+' 關完成！');set('checkpointMessage',final?'20 顆星星！最後的寶箱出現了！':'5 顆星星！兔兔準備好下一關了。');set('continue',final?'✨ 打開最後寶箱':'打開下一關寶箱');$('checkpointTitle').focus({preventScroll:true});voice.play(final?'finalCheckpoint':'checkpoint');
  }
  function result(){show('done');set('resultStars','⭐ 收集 '+E.stars(state)+' / 20 顆星星');set('resultIndependent','自己一次答對 '+E.independent(state)+' / 20 題');$('directionResults').innerHTML=E.stats(state).map(s=>'<div class="direction-result"><strong>'+T(s.side)+'</strong><span>'+T('自己答對')+'</span><b>'+s.independent+' / '+s.total+'</b></div>').join('');$('resultTitle').focus({preventScroll:true});voice.play('finish');}
  function currentVoice(){if(screen==='play'&&!state.records[state.index].solved)return info[state.questions[state.index].side].voice;return null;}
  $('sound').onclick=()=>{cancelWork();soundOn=!soundOn;voice.enable(soundOn);updateSound();refreshAnswers();try{localStorage.setItem('bunny-sound',soundOn?'on':'off');}catch{}const key=currentVoice();if(soundOn&&key)voice.play(key);};
  $('replay').onclick=()=>{cancelWork();soundOn=true;voice.enable(true);updateSound();refreshAnswers();voice.play(info[state.questions[state.index].side].voice);};
  $('help').onclick=help;$('pause').onclick=()=>{save();home();};$('resume').onclick=()=>render();
  function closePrompt(){ $('restartPrompt').hidden=true;document.querySelectorAll('main > :not(#restartPrompt)').forEach(el=>{el.inert=false;}); }
  $('start').onclick=()=>{if(state&&state.phase!=='done'){cancelWork();$('restartPrompt').hidden=false;document.querySelectorAll('main > :not(#restartPrompt)').forEach(el=>{el.inert=true;});$('cancelRestart').focus();}else start();};
  $('cancelRestart').onclick=()=>{closePrompt();render();};$('confirmRestart').onclick=()=>{closePrompt();start();};
  $('restartPrompt').addEventListener('keydown',e=>{if(e.key==='Escape'){closePrompt();$('start').focus();}if(e.key==='Tab'){const buttons=[$('cancelRestart'),$('confirmRestart')];if(e.shiftKey&&document.activeElement===buttons[0]){e.preventDefault();buttons[1].focus();}else if(!e.shiftKey&&document.activeElement===buttons[1]){e.preventDefault();buttons[0].focus();}}});
  $('next').onclick=()=>{if(E.advance(state)){save();render();}};
  $('continue').onclick=()=>{state.phase=state.phase==='treasure'?'done':'question';save();render();};
  $('again').onclick=start;$('homeButton').onclick=home;
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelWork();refreshAnswers();if(state)save();}});
  window.addEventListener('pagehide',()=>{cancelWork();if(state)save();});
  $('stageMap').innerHTML=E.stages.map((s,i)=>'<div class="stage-tile"><span aria-hidden="true">'+s.icon+'</span>'+T('第 '+(i+1)+' 關')+'<br>'+T(s.title)+'</div>').join('');
  updateSound();home();
})();
