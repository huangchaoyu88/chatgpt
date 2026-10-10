(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DirectionGame = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const VERSION = 2;
  const animals = ['🐻','🐱','🐸','🐰','🐼','🦊','🐵','🐤','🐶'];
  const stages = [
    {title:'左右草原',icon:'🌱',min:3,max:4,dirs:['左','右','左','右','左']},
    {title:'上下森林',icon:'🌳',min:3,max:4,dirs:['上','下','上','下','上']},
    {title:'四方山谷',icon:'⛰️',min:4,max:5,dirs:['左','右','上','下','右']},
    {title:'寶藏城堡',icon:'🏰',min:5,max:6,dirs:['左','右','上','下','下']}
  ];
  const sides = ['左','右','上','下'];
  const fromStart = side => side === '左' || side === '上';
  const ordinal = q => fromStart(q.side) ? q.target + 1 : q.count - q.target;
  const order = q => Array.from({length:q.count},(_,i)=>fromStart(q.side)?i:q.count-1-i);
  function shuffle(list, random=Math.random) {
    const a = [...list];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function makeQuestions(random=Math.random) {
    const all=[];
    stages.forEach((stage,level)=>{
      let dirs=shuffle(stage.dirs,random);
      // The first two questions compare opposite ends of the same queue.
      if(level<2){const pair=level===0?['左','右']:['上','下'];const extra=stage.dirs.filter((_,i)=>i>1);dirs=[...pair,...shuffle(extra,random)];}
      dirs.forEach((side,j)=>{
        const count=stage.min+Math.floor(random()*(stage.max-stage.min+1));
        const possible=Array.from({length:count},(_,i)=>i).filter(i=>2*i!==count-1);
        let q={level,count,line:shuffle(animals,random).slice(0,count),target:possible[Math.floor(random()*possible.length)],side};
        if(level<2&&j===1)q={...all[all.length-1],line:[...all[all.length-1].line],side};
        all.push(q);
      });
    });
    return all;
  }
  function create(random=Math.random){return {version:VERSION,index:0,phase:'question',questions:makeQuestions(random),records:Array.from({length:20},()=>({attempts:[],assisted:false,solved:false}))};}
  function answer(state,n){
    if(state.phase!=='question'||state.index>=20)return null;
    const r=state.records[state.index],q=state.questions[state.index];
    if(r.solved||!Number.isInteger(n)||n<1||n>q.count||r.attempts.includes(n))return null;
    r.attempts.push(n);
    r.solved=n===ordinal(q);
    return {correct:r.solved,independent:r.solved&&r.attempts.length===1&&!r.assisted};
  }
  function advance(state){
    if(state.phase!=='question'||!state.records[state.index]?.solved)return false;
    state.index++;
    state.phase=state.index===20?'treasure':state.index%5===0?'checkpoint':'question';
    return true;
  }
  function stats(state){
    return sides.map(side=>{
      const rows=state.records.filter((_,i)=>state.questions[i].side===side);
      return {side,total:rows.length,solved:rows.filter(r=>r.solved).length,independent:rows.filter(r=>r.solved&&r.attempts.length===1&&!r.assisted).length};
    });
  }
  const stars=state=>state.records.filter(r=>r.solved).length;
  const independent=state=>stats(state).reduce((n,s)=>n+s.independent,0);
  function valid(s){
    if(!s||s.version!==VERSION||!Number.isInteger(s.index)||s.index<0||s.index>20||!['question','checkpoint','treasure','done'].includes(s.phase))return false;
    if(!Array.isArray(s.questions)||s.questions.length!==20||!Array.isArray(s.records)||s.records.length!==20)return false;
    if((s.phase==='done'||s.phase==='treasure')!==(s.index===20)||s.phase==='checkpoint'&&(s.index===0||s.index%5!==0))return false;
    for(let i=0;i<20;i++){
      const q=s.questions[i],r=s.records[i],stage=stages[Math.floor(i/5)];
      if(!q||q.level!==Math.floor(i/5)||!stage.dirs.includes(q.side)||!Number.isInteger(q.count)||q.count<stage.min||q.count>stage.max)return false;
      if(!Array.isArray(q.line)||q.line.length!==q.count||new Set(q.line).size!==q.count||q.line.some(a=>!animals.includes(a)))return false;
      if(!Number.isInteger(q.target)||q.target<0||q.target>=q.count||2*q.target===q.count-1)return false;
      if(!r||typeof r.assisted!=='boolean'||typeof r.solved!=='boolean'||!Array.isArray(r.attempts)||r.attempts.length>q.count||new Set(r.attempts).size!==r.attempts.length||r.attempts.some(n=>!Number.isInteger(n)||n<1||n>q.count))return false;
      if(r.solved!==r.attempts.includes(ordinal(q))||r.solved&&r.attempts.at(-1)!==ordinal(q)||i<s.index&&!r.solved||i>s.index&&(r.solved||r.attempts.length||r.assisted))return false;
      if(s.phase==='checkpoint'&&i===s.index&&(r.attempts.length||r.assisted))return false;
    }
    return stats(s).every(s=>s.total===5);
  }
  return {VERSION,animals,stages,sides,fromStart,ordinal,order,makeQuestions,create,answer,advance,stars,independent,stats,valid};
});
