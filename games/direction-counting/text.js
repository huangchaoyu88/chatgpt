(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.GameText=factory(root.PHONETICS);})(typeof globalThis==='object'?globalThis:this,function(dictionary){
const phrases={'寶藏':['ㄅㄠˇ','ㄗㄤˋ'],'藏寶圖':['ㄘㄤˊ','ㄅㄠˇ','ㄊㄨˊ'],'獲得':['ㄏㄨㄛˋ','ㄉㄜˊ'],'數字':['ㄕㄨˋ','ㄗˋ'],'重新':['ㄔㄨㄥˊ','ㄒㄧㄣ'],'重播':['ㄔㄨㄥˊ','ㄅㄛˋ']};
const keys=Object.keys(phrases).sort((a,b)=>b.length-a.length);
function tokens(text){const out=[];for(let i=0;i<text.length;){const phrase=keys.find(p=>text.startsWith(p,i));if(phrase){[...phrase].forEach((c,j)=>out.push({char:c,sound:phrases[phrase][j]}));i+=phrase.length;}else{const c=String.fromCodePoint(text.codePointAt(i));out.push({char:c,sound:dictionary[c]||null});i+=c.length;}}return out;}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(text){return tokens(String(text)).map(({char,sound})=>{if(!sound)return escape(char);const neutral=sound.includes('˙'),tone=(sound.match(/[ˊˇˋ]/)||[''])[0],symbols=sound.replace(/[ˊˇˋ˙]/g,'');return '<ruby><span class="han">'+escape(char)+'</span><rt aria-hidden="true">'+(neutral?'<span class="neutral">˙</span>':'')+'<span class="zy">'+symbols+'</span><span class="tone">'+tone+'</span></rt></ruby>';}).join('');}
return {tokens,html};
});
