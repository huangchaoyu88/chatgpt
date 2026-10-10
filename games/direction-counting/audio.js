(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createGameVoice=factory;})(typeof globalThis==='object'?globalThis:this,function({audio,lines,synth,Utterance,status=()=>{},timeout=18000}){
  let enabled=true,sequence=0,pending=null;
  function cancel(){sequence++;if(pending)pending(false);pending=null;audio.pause();if(synth)synth.cancel();}
  function enable(value){enabled=value;if(!value)cancel();}
  function play(key){
    cancel();if(!enabled||!lines[key])return Promise.resolve(false);
    const id=sequence;
    return new Promise(resolve=>{
      let complete=false,timer=null,fallbackUsed=false;
      const cleanup=()=>{clearTimeout(timer);audio.removeEventListener('ended',ended);audio.removeEventListener('error',failed);};
      const finish=value=>{if(complete)return;complete=true;cleanup();if(pending===finish)pending=null;resolve(value);};
      const ended=()=>{if(id===sequence)finish(true);};
      const fallback=()=>{
        if(id!==sequence||complete)return;
        cleanup();audio.pause();
        if(fallbackUsed||!synth||!Utterance){status('unavailable');finish(false);return;}
        fallbackUsed=true;status('fallback');
        const u=new Utterance(lines[key]);u.lang='zh-TW';u.rate=.85;
        u.onend=()=>{if(id===sequence)finish(true);};u.onerror=()=>{if(id===sequence){status('unavailable');finish(false);}};
        timer=setTimeout(()=>{if(id===sequence){synth.cancel();status('unavailable');finish(false);}},timeout);
        try{synth.speak(u);}catch{status('unavailable');finish(false);}
      };
      const failed=()=>fallback();pending=finish;
      audio.addEventListener('ended',ended);audio.addEventListener('error',failed);
      audio.src='./audio/'+key+'.mp3?v=2.0.0';audio.playbackRate=1;
      timer=setTimeout(fallback,timeout);
      try{Promise.resolve(audio.play()).then(()=>{if(id===sequence&&!complete)status('playing');}).catch(error=>{
        if(id!==sequence||complete)return;
        if(error.name==='NotAllowedError'){audio.pause();status('tap');finish(false);}else fallback();
      });}catch{fallback();}
    });
  }
  return {play,cancel,enable};
});
