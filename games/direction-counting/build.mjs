import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const source=path.dirname(fileURLToPath(import.meta.url));
const target=path.resolve(source,'../../_site');
const preview=process.argv.includes('--preview');
const voices=JSON.parse(await readFile(path.join(source,'voices.json'),'utf8'));
const phonetics=JSON.parse(await readFile(path.join(source,'phonetics.json'),'utf8'));
await rm(target,{recursive:true,force:true});await mkdir(path.join(target,'audio'),{recursive:true});
for(const file of ['index.html','style.css','engine.js','text.js','audio.js','game.js'])await copyFile(path.join(source,file),path.join(target,file));
await writeFile(path.join(target,'voices.js'),'window.GAME_VOICES='+JSON.stringify(voices)+';\n');
await writeFile(path.join(target,'phonetics.js'),'window.PHONETICS='+JSON.stringify(phonetics)+';\n');
for(const key of Object.keys(voices)){
  const file=path.join(source,'audio',key+'.mp3');
  try{const bytes=await readFile(file);if(bytes.length<1000)throw new Error('Empty audio: '+key);await copyFile(file,path.join(target,'audio',key+'.mp3'));}catch(error){if(!preview)throw error;}
}
await writeFile(path.join(target,'.nojekyll'),'');
await writeFile(path.join(target,'build-info.json'),JSON.stringify({version:'2.0.0',commit:process.env.GITHUB_SHA||'local-preview',voice:'zh-TW-HsiaoChenNeural',audioCount:Object.keys(voices).length,preview}));
console.log('Site packaged:',target);
