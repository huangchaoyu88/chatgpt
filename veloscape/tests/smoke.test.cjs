const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const nodes=new Map(), clock={now:1000};
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{style:{},textContent:'',classList:{add(){},remove(){}},addEventListener(){}});return nodes.get(id)},addEventListener(){}};
 const context=vm.createContext({document,performance:{now:()=>clock.now},setInterval(){},setTimeout(){},clearTimeout(){},console,AbortController,Float32Array,DataView,ArrayBuffer});
 const stop=script.lastIndexOf('try{glRenderer=nativeRenderer();');
 assert.ok(stop>0);
 vm.runInContext(script.slice(0,stop)+'\ndrawCharts=()=>{};',context);
 return {run:src=>vm.runInContext(src,context),clock};
}
test('browser script parses',()=>new vm.Script(script));
test('demo route is finite and 5.2 km',()=>{const {run}=harness();assert.equal(run('demoRoute().at(-1).s'),5200);assert.equal(run('demoRoute().every(p=>Number.isFinite(p.y))'),true)});
test('invalid route leaves current origin and altitude intact',()=>{const {run}=harness();run('geoOrigin=[121,25];hasAlt=true;altBase=10');assert.throws(()=>run('geoRoute([[181,25],[181,26]])'));assert.throws(()=>run('geoRoute([[121,25],[121.00001,25]])'));assert.equal(run('geoOrigin[0]'),121);assert.equal(run('altBase'),10)});
test('route resampling and geo conversion',()=>{const {run}=harness();const d=run('route=geoRoute([[121.49,25.02,10],[121.491,25.02,12]]);total=route.at(-1).s;total');assert.ok(d>100&&d<102);assert.equal(run('route.every(p=>Number.isFinite(p.y))'),true);assert.equal(run('Math.abs(localToGeo(...geoToLocal(121.5,25.03,geoOrigin),geoOrigin)[0]-121.5)<1e-9'),true)});
test('FTMS speed and cadence, no stale input',()=>{const {run,clock}=harness();run('bleDevice={gatt:{connected:true}};let pkt=new DataView(new ArrayBuffer(6));pkt.setUint16(0,4,true);pkt.setUint16(2,2530,true);pkt.setUint16(4,160,true);ftmsData(pkt)');assert.equal(run('rideTarget()'),25.3);assert.equal(run('bleCadence'),80);clock.now=4600;assert.equal(run('rideTarget()'),0)});
test('CSC counter wraparound and wheel speed',()=>{const {run}=harness();run('let p=new DataView(new ArrayBuffer(7));p.setUint8(0,1);p.setUint32(1,4294967295,true);p.setUint16(5,65000,true);cscData(p);p.setUint32(1,1,true);p.setUint16(5,488,true);cscData(p)');assert.ok(Math.abs(run('bleSpeed')-15.12)<.001)});
test('real mesh finite, road and building generated',()=>{const {run}=harness();run("route=geoRoute([[121.49,25.02,10],[121.491,25.02,12]]);total=route.at(-1).s;let cells=liveCells(route);let dem={height:(x,z)=>x/1000,base:10};route=route.map(p=>({...p,y:dem.height(p.x,p.z)+.28}));realWorld={cells,dem,origin:geoOrigin,features:[{tags:{building:'yes','building:levels':'3'},geometry:[{lon:121.4901,lat:25.0201},{lon:121.4902,lat:25.0201},{lon:121.4902,lat:25.0202},{lon:121.4901,lat:25.0202},{lon:121.4901,lat:25.0201}]},{tags:{highway:'cycleway'},geometry:[{lon:121.49,lat:25.02},{lon:121.491,lat:25.02}]}]};buildReal()");assert.equal(run('meshData.v.every(Number.isFinite)'),true);assert.equal(run('realWorld.buildings'),1);assert.equal(run('realWorld.roads'),1)});
