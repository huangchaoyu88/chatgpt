const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const path=require("node:path");const root=path.join(__dirname,"..");let context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,"events.js"),"utf8"),context);
const records=context.window.ATLAS_EVENTS;assert(Array.isArray(records)&&records.length>=9);
assert.equal(new Set(records.map(e=>e.id)).size,records.length,"unique event IDs");
for(const e of records){assert(["traffic","crime","disaster","legend"].includes(e.category));assert(e.lat>21.5&&e.lat<26&&e.lng>119&&e.lng<123);assert(e.precision);assert(e.sources.length>0);assert(e.sources.every(s=>/^https:\/\//.test(s.url)));if(e.category==="legend")assert(/傳|故事|靈異|超自然|口述/.test(e.body));}
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");for(const file of ["events.js","app.js","style.css"])assert(page.includes("./"+file));console.log("✓ "+records.length+" entries validated; page asset references valid");
