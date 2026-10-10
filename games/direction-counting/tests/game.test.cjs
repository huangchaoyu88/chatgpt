const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../engine.js');
const Text=require('../text.js')(require('../phonetics.json'));
const Voice=require('../audio.js');
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
test('500 games cover every direction exactly 5 times and exclude ambiguous middle targets',()=>{
 for(let seed=1;seed<=500;seed++){
  const s=E.create(rng(seed));assert.ok(E.valid(s));assert.equal(s.questions.length,20);
  for(const side of E.sides)assert.equal(s.questions.filter(q=>q.side===side).length,5);
  for(const q of s.questions){assert.notEqual(q.target+1,q.count-q.target);assert.equal(E.order(q)[E.ordinal(q)-1],q.target);}
  for(const i of [0,5]){assert.deepEqual(s.questions[i].line,s.questions[i+1].line);assert.equal(s.questions[i].target,s.questions[i+1].target);assert.notEqual(E.ordinal(s.questions[i]),E.ordinal(s.questions[i+1]));}
 }
});
test('all four direction formulas have independent fixed expectations',()=>{
 for(const [side,want] of [['左',2],['右',5],['上',2],['下',5]])assert.equal(E.ordinal({side,count:6,target:1}),want);
 assert.deepEqual(E.order({side:'下',count:4}),[3,2,1,0]);
});
test('full 20-question game awards all solved stars, tracks help/errors separately, and visits 4 chests',()=>{
 const s=E.create(rng(91)),checkpoints=[];
 for(let i=0;i<20;i++){
  const n=E.ordinal(s.questions[i]);assert.equal(E.advance(s),false);
  if(i===0){E.answer(s,n===1?2:1);assert.ok(E.valid(JSON.parse(JSON.stringify(s))));}
  if(i===1)s.records[i].assisted=true;
  assert.ok(E.answer(s,n).correct);assert.equal(E.answer(s,n),null);assert.equal(E.stars(s),i+1);
  assert.ok(E.advance(s));assert.ok(E.valid(s));
  if(s.phase==='checkpoint'||s.phase==='treasure'){checkpoints.push(s.index);if(s.phase==='checkpoint')s.phase='question';}
 }
 assert.deepEqual(checkpoints,[5,10,15,20]);assert.equal(s.phase,'treasure');assert.equal(E.independent(s),18);assert.equal(E.stars(s),20);s.phase='done';assert.ok(E.valid(s));
});
test('invalid or tampered saves cannot crash resume or fabricate completed progress',()=>{
 for(const broken of [null,{},[],{version:1},'test'])assert.equal(E.valid(broken),false);
 const s=E.create(rng(5));s.questions[0].line[0]='<img>';assert.equal(E.valid(s),false);
 const t=E.create(rng(5));t.index=10;assert.equal(E.valid(t),false);
 const u=E.create(rng(5));u.records[0].solved=true;assert.equal(E.valid(u),false);
});
test('visible vocabulary has pronunciations, including polyphonic words and neutral tones',()=>{
 const source=['index.html','game.js','engine.js','voices.json'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
 const missing=[...new Set([...source].filter(c=>/[\u3400-\u9fff]/.test(c)&&!Text.tokens(c)[0].sound))];
 assert.deepEqual(missing,[],'Missing phonetics: '+missing.join(''));
 assert.deepEqual(Text.tokens('寶藏藏寶圖獲得數字重新').map(x=>x.sound),['ㄅㄠˇ','ㄗㄤˋ','ㄘㄤˊ','ㄅㄠˇ','ㄊㄨˊ','ㄏㄨㄛˋ','ㄉㄜˊ','ㄕㄨˋ','ㄗˋ','ㄔㄨㄥˊ','ㄒㄧㄣ']);
 assert.match(Text.html('的'),/class="neutral">˙/);assert.ok(!Text.html('<img onerror="x">').includes('<img'));
});
class Media extends EventTarget{constructor(){super();this.pauses=0;this.behavior=()=>Promise.resolve();}play(){return this.behavior();}pause(){this.pauses++;}}
test('audio cancellation settles the old request and stale play rejection cannot trigger fallback',async()=>{
 const audio=new Media();let rejectOld,fallbacks=0;audio.behavior=()=>new Promise((_,reject)=>{rejectOld=reject;});
 const v=Voice({audio,lines:{a:'a',b:'b'},synth:{cancel(){},speak(){fallbacks++;}},Utterance:function(){},timeout:100});
 const first=v.play('a');audio.behavior=()=>Promise.resolve();const second=v.play('b');rejectOld(new Error('old request'));audio.dispatchEvent(new Event('ended'));assert.equal(await first,false);assert.equal(await second,true);assert.equal(fallbacks,0);
});
test('blocked autoplay reports a replay action, and mute prevents any new media playback',async()=>{
 const audio=new Media(),status=[];audio.behavior=()=>Promise.reject(Object.assign(new Error('gesture'),{name:'NotAllowedError'}));
 const v=Voice({audio,lines:{a:'a'},status:s=>status.push(s),timeout:100});assert.equal(await v.play('a'),false);assert.ok(status.includes('tap'));
 v.enable(false);audio.behavior=()=>{throw new Error('must stay muted');};assert.equal(await v.play('a'),false);
});
test('media errors use bounded fallback and network timeouts settle',async()=>{
 const audio=new Media(),status=[];let spoken=0;const synth={cancel(){},speak(u){spoken++;queueMicrotask(()=>u.onend());}};
 const v=Voice({audio,lines:{a:'a'},synth,Utterance:function(text){this.text=text;},status:s=>status.push(s),timeout:15});
 const done=v.play('a');audio.dispatchEvent(new Event('error'));assert.equal(await done,true);assert.equal(spoken,1);assert.ok(status.includes('fallback'));
 const silent=Voice({audio:new Media(),lines:{a:'a'},timeout:15,status:s=>status.push(s)});assert.equal(await silent.play('a'),false);assert.ok(status.includes('unavailable'));
});
