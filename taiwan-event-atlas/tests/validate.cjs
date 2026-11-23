const assert=require("node:assert/strict");const fs=require("node:fs");const vm=require("node:vm");const path=require("node:path");
const root=path.join(__dirname,"..");const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,"events.js"),"utf8"),ctx);
const records=ctx.window.ATLAS_EVENTS;assert(Array.isArray(records)&&records.length>=40);
assert.equal(new Set(records.map(e=>e.id)).size,records.length,"IDs must be unique");
const typeCounts={traffic:0,crime:0,disaster:0,legend:0};
for(const e of records){
 assert(Object.hasOwn(typeCounts,e.category),e.id+" category");typeCounts[e.category]++;
 assert(typeof e.lat==="number"&&e.lat>21&&e.lat<27,e.id+" latitude");
 assert(typeof e.lng==="number"&&e.lng>118&&e.lng<123,e.id+" longitude");
 assert(["title","city","place","precision","summary","body"].every(k=>typeof e[k]==="string"&&e[k].length>=3),e.id+" core fields");
 assert(Array.isArray(e.sources)&&e.sources.length>0,e.id+" sources");
 assert(e.sources.every(s=>s.name&&/^https:\/\//.test(s.url)),e.id+" source links");
 if(e.date!==null){assert(/^\d{4}-\d{2}-\d{2}$/.test(e.date),e.id+" date format");assert.equal(e.year,Number(e.date.slice(0,4)),e.id+" year match");assert(Number.isFinite(Date.parse(e.date)),e.id+" valid date")}
 else assert(e.year===null||Number.isInteger(e.year),e.id+" unknown year");
 if(e.category==="legend")assert(/傳|民俗|口述|故事|靈異|信仰/.test(e.body),e.id+" legend disclosure");
}
assert(new Set(records.map(x=>x.city)).size>=14,"geographic diversity");
assert(Object.values(typeCounts).every(n=>n>=5),"all event categories represented");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");for(const file of ["events.js","app.js","style.css"])assert(page.includes("./"+file));
console.log("✓ "+records.length+" entries; "+new Set(records.map(x=>x.city)).size+" cities/counties; distribution: "+JSON.stringify(typeCounts));

// Detailed event narrative rollout: each revised record must be approximately 150 characters.
const detailedIds=records.map(r=>r.id);
for(const id of detailedIds){const r=records.find(e=>e.id===id);assert(r,"Missing detailed event "+id);assert([...r.body].length>=133&&[...r.body].length<=174,"Narrative length outside review window "+id);}

const appendedIds = ["ci611-penghu-2002","alishan-train-2011","n3-landslide-2010","bazhang-river-2000","chen-wen-chen-1981"];
for(const id of appendedIds){const r=records.find(x=>x.id===id);assert(r,"Missing appended entry "+id);assert([...r.body].length>=140&&[...r.body].length<=160,id+" not 140-160 characters");assert(r.sources.length>0,id+" missing sources");}

for(const e of records){assert([...e.body].length>=140&&[...e.body].length<=174,e.id+' narrative length must be 140–174 chars');}

for(const id of ["healthy-kindergarten-bus-1992","changhua-qiaoyou-fire-2021","weierkang-fire-1995"]){const e=records.find(x=>x.id===id);assert(e,id+" exists");assert([...e.body].length>=140&&[...e.body].length<=160,id+" narrative length");assert(e.sources.length>=2,id+" sources");}

// This run: verify new source-backed event narratives and prevent duplicate IDs.
for(const id of ["meiling-tourbus-2006","smangus-bus-2012","aloha-okayama-2017"]){const e=records.find(x=>x.id===id);assert(e,"Missing new entry "+id);assert([...e.body].length>=140&&[...e.body].length<=160,id+" narrative must be 140–160 chars");assert(e.sources.length>=2,id+" requires corroborating sources");}

for(const id of ["eastern-science-park-fire-2001","nanya-chiayi-fire-2010","longde-shipyard-2021"]){const e=records.find(x=>x.id===id);assert(e,id+" missing");assert([...e.body].length>=140&&[...e.body].length<=160,id+" narrative");assert(e.sources.length>=2,id+" sources");}

for(const id of ["xinwu-bowling-fire-2015","yujing-arson-2019"]){const e=records.find(x=>x.id===id);assert(e,id+" missing");assert([...e.body].length>=140&&[...e.body].length<=160,id+" length");assert(e.sources.length>=2,id+" sources");}

for(const id of ["houfeng-bridge-collapse-2008","tainan-police-attack-2022"]){const e=records.find(x=>x.id===id);assert(e,"missing event "+id);assert([...e.body].length>=140&&[...e.body].length<=160,id+" narrative length");assert(e.sources.length>=2,id+" sources");}
