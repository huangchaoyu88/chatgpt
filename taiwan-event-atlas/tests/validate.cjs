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
const detailedIds=["taroko-2021","puyuma-2018","taichung-metro-2023","metro-2014","ba-xian-2015","kaohsiung-2014","ge235-taipei-2015","sanxia-2025","chi-chi-1999","mingyang-2023","chengzhongcheng-2021","taoyuan-tourbus-2016"];
for(const id of detailedIds){const r=records.find(e=>e.id===id);assert(r,"Missing detailed event "+id);assert([...r.body].length>=133&&[...r.body].length<=174,"Narrative length outside review window "+id);}
