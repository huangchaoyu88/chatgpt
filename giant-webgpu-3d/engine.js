
'use strict';
// Procedural road-bike mesh: CPU geometry construction, GPU rendering exclusively through WebGPU/WGSL.
const canvas = document.getElementById('gpu');
const errorBox=document.getElementById('error');
const showError = msg=>{ document.getElementById('loading').style.display='none'; errorBox.style.display='flex'; if(msg) document.getElementById('errorText').textContent=msg; };
const V=(x,y,z=0)=>[x,y,z],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,t)=>a.map(x=>x*t),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{const d=Math.hypot(...a);return d>1e-8?mul(a,1/d):[0,1,0];},mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const rgb=(s)=>{let x=s.replace('#','');return [parseInt(x.substring(0,2),16),parseInt(x.substring(2,4),16),parseInt(x.substring(4,6),16)].map(v=>v/255)};
const C={white:rgb('#e5e9e5'),bright:rgb('#f4f6f1'),whiteShadow:rgb('#c6d1cd'),silver:rgb('#8d9a9f'),aluminium:rgb('#bec5c9'),darkSilver:rgb('#6d7b83'),black:rgb('#1d252a'),rubber:rgb('#0c1115'),blackSilver:rgb('#303b40'),tape:rgb('#151b21'),chain:rgb('#8f999c'),graphite:rgb('#434e56'),logo:rgb('#9da8a4')};
const layers={frame:[],wheels:[],drive:[],cockpit:[],detail:[]};
let active='frame';const sets=layers;
const put=(p,n,c,metal=0)=>sets[active].push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],metal);
function triangle(a,b,c,color,metal=0){const n=norm(cross(sub(b,a),sub(c,a)));put(a,n,color,metal);put(b,n,color,metal);put(c,n,color,metal)}
function quad(a,b,c,d,color,metal=0){triangle(a,b,c,color,metal);triangle(a,c,d,color,metal)}
function cylinder(a,b,r,color,seg=10,metal=.2,rx=r){const d=norm(sub(b,a));let u=norm(cross(d,[0,0,1]));if(Math.hypot(...u)<.01)u=norm(cross(d,[0,1,0]));const v=norm(cross(d,u));for(let i=0;i<seg;i++){let th=2*Math.PI*i/seg,th2=2*Math.PI*(i+1)/seg;const ring=(center,t)=>add(center,add(mul(u,Math.cos(t)*r),mul(v,Math.sin(t)*rx)));const n1=norm(add(mul(u,Math.cos(th)/r),mul(v,Math.sin(th)/rx))),n2=norm(add(mul(u,Math.cos(th2)/r),mul(v,Math.sin(th2)/rx)));const p=ring(a,th),q=ring(a,th2),p2=ring(b,th),q2=ring(b,th2);put(p,n1,color,metal);put(q,n2,color,metal);put(q2,n2,color,metal);put(p,n1,color,metal);put(q2,n2,color,metal);put(p2,n1,color,metal);
const nn=mul(d,-1);put(a,nn,color,metal);put(q,nn,color,metal);put(p,nn,color,metal);put(b,d,color,metal);put(p2,d,color,metal);put(q2,d,color,metal);}}
function cone(a,b,ra,rb,color,seg=12,metal=.3){const d=norm(sub(b,a));let u=norm(cross(d,[0,0,1]));if(Math.hypot(...u)<.01)u=[1,0,0];const v=norm(cross(d,u));for(let i=0;i<seg;i++){const t=i*2*Math.PI/seg,s=(i+1)*2*Math.PI/seg;const a1=add(a,add(mul(u,ra*Math.cos(t)),mul(v,ra*Math.sin(t)))),a2=add(a,add(mul(u,ra*Math.cos(s)),mul(v,ra*Math.sin(s))));const b1=add(b,add(mul(u,rb*Math.cos(t)),mul(v,rb*Math.sin(t)))),b2=add(b,add(mul(u,rb*Math.cos(s)),mul(v,rb*Math.sin(s))));let n1=norm(add(mul(u,Math.cos(t)),mul(v,Math.sin(t)))),n2=norm(add(mul(u,Math.cos(s)),mul(v,Math.sin(s))));put(a1,n1,color,metal);put(a2,n2,color,metal);put(b2,n2,color,metal);put(a1,n1,color,metal);put(b2,n2,color,metal);put(b1,n1,color,metal);}}
function ring(cx,cy,r,tube,z,color,seg=72,side=10,metal=.4){for(let i=0;i<seg;i++){const a=2*Math.PI*i/seg,b=2*Math.PI*(i+1)/seg;for(let j=0;j<side;j++){const t=2*Math.PI*j/side,s=2*Math.PI*(j+1)/side;const point=(u,v)=>[cx+(r+tube*Math.cos(v))*Math.cos(u),cy+(r+tube*Math.cos(v))*Math.sin(u),z+tube*Math.sin(v)];const normal=(u,v)=>[Math.cos(v)*Math.cos(u),Math.cos(v)*Math.sin(u),Math.sin(v)];const p=point(a,t),q=point(b,t),rr=point(b,s),ss=point(a,s);const n=normal(a,t),nq=normal(b,t),nr=normal(b,s),ns=normal(a,s);put(p,n,color,metal);put(q,nq,color,metal);put(rr,nr,color,metal);put(p,n,color,metal);put(rr,nr,color,metal);put(ss,ns,color,metal);}}}
function path(points,r,color,seg=9,metal=.0){if(points.length<2)return;for(let i=0;i<points.length-1;i++){cylinder(points[i],points[i+1],r,color,seg,metal)}for(let i=1;i<points.length-1;i++){sphere(points[i],r*1.07,color,5,9,metal)}}
function sphere(o,r,col,rings=5,seg=10,metal=.25){for(let i=0;i<rings;i++){const a=-Math.PI/2+Math.PI*i/rings,b=-Math.PI/2+Math.PI*(i+1)/rings;for(let j=0;j<seg;j++){const u=2*Math.PI*j/seg,v=2*Math.PI*(j+1)/seg;const p=(el,az)=>add(o,[r*Math.cos(el)*Math.cos(az),r*Math.sin(el),r*Math.cos(el)*Math.sin(az)]);const p1=p(a,u),p2=p(a,v),p3=p(b,v),p4=p(b,u);for(let pair of [[p1,p2,p3],[p1,p3,p4]])for(let point of pair)put(point,norm(sub(point,o)),col,metal);}}}
function box(x1,y1,z1,x2,y2,z2,col,metal=.3){const a=[x1,y1,z1],b=[x2,y1,z1],c=[x2,y2,z1],d=[x1,y2,z1],e=[x1,y1,z2],f=[x2,y1,z2],g=[x2,y2,z2],h=[x1,y2,z2];for(let q of [[a,d,c,b],[e,f,g,h],[a,e,h,d],[b,c,g,f],[d,h,g,c],[a,b,f,e]])quad(...q,col,metal)}
function bitmap(text,origin,angle,px=.021,z=.084,col=C.logo){const font={G:['01110','10001','10000','10111','10001','10001','01110'],I:['11111','00100','00100','00100','00100','00100','11111'],A:['01110','10001','10001','11111','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],T:['11111','00100','00100','00100','00100','00100','00100']};const dir=[Math.cos(angle),Math.sin(angle)],vert=[-Math.sin(angle),Math.cos(angle)],cols=text.length*6-1;for(let k=0;k<text.length;k++)for(let y=0;y<7;y++)for(let x=0;x<5;x++)if(font[text[k]]?.[y]?.[x]==='1'){let u=(k*6+x-(cols-1)/2)*px,v=(3-y)*px;const p=(du,dv)=>[origin[0]+dir[0]*(u+du)+vert[0]*(v+dv),origin[1]+dir[1]*(u+du)+vert[1]*(v+dv),z];quad(p(-px*.45,-px*.45),p(px*.45,-px*.45),p(px*.45,px*.45),p(-px*.45,px*.45),col,.35)}}
// Dimensions are approximate because the input photo is a single view.
const RH=V(-1.29,.86,0),FH=V(1.29,.86,0),BB=V(-.23,.66,0),ST=V(-.48,1.73,0),HT=V(.80,1.94,0),HB=V(1.01,1.56,0);
function makeWheel(c,isRear){active='wheels';const [x,y]=c;ring(x,y,.815,.044,0,C.rubber,92,12,.05);ring(x,y,.769,.016,0,C.blackSilver,84,10,.55);ring(x,y,.742,.021,0,C.silver,84,10,.75);ring(x,y,.726,.009,0,C.blackSilver,84,8,.6);ring(x,y,.842,.0035,-.013,C.graphite,84,6,.1);
// Alternating spoke angles with true spatial lacing.
// Laced spokes are built once in the refinement pass below (32 per wheel).
cylinder([x,y,-.117],[x,y,.117],.036,C.blackSilver,12,.45);cylinder([x,y,-.137],[x,y,-.117],.048,C.silver,12,.7);cylinder([x,y,.117],[x,y,.137],.047,C.darkSilver,12,.72);for(const z of [-.115,.115])sphere([x,y,z],.043,C.black,5,10,.35);
// Valve and rim graphic accents.
let aa=isRear?2.62:.85;cylinder([x+.739*Math.cos(aa),y+.739*Math.sin(aa),-.01],[x+.785*Math.cos(aa),y+.785*Math.sin(aa),-.01],.008,C.aluminium,7,.7);
for(let i=0;i<7;i++){let a=.35+i*.031+(isRear?1.7:3.2);cylinder([x+.752*Math.cos(a),y+.752*Math.sin(a),.027],[x+.754*Math.cos(a+.013),y+.754*Math.sin(a+.013),.027],.005,C.silver,5,.65)}}
makeWheel(RH,true);makeWheel(FH,false);
active='frame';
// Alloy triangular frame, tuned to the photo's gently sloped top-tube and straight fork.
cylinder(BB,ST,.059,C.white,18,.42,.049);cylinder(ST,HT,.049,C.bright,17,.42,.039);cylinder(BB,HB,.075,C.white,20,.46,.052);
// Painting/highlights along the two dominant tubes.
cylinder(mix(BB,HB,.07),mix(BB,HB,.90),.016,C.bright,10,.14,.013);
cylinder(HT,HB,.085,C.whiteShadow,18,.55,.077);cylinder(mix(HT,HB,.08),mix(HT,HB,.86),.079,C.white,18,.48,.071);
// Seatstay and chainstay are paired on the near and far side.
for(const z of [-.071,.071]){cylinder([RH[0],RH[1],z],[ST[0]+.013,ST[1]-.08,z*.65],.029,C.white,13,.32,.023);cylinder([RH[0],RH[1],z],[BB[0]-.02,BB[1]-.025,z*.80],.036,C.whiteShadow,13,.29,.027)}
// Fork crown and two gently rake-forward blades.
cylinder([1.032,1.52,0],[1.075,1.42,0],.075,C.white,14,.33,.065);
for(const z of [-.092,.092]){cone([1.07,1.43,z*.62],[1.23,.94,z],.059,.037,C.white,16,.36);cone([1.23,.94,z],[FH[0],FH[1],z],.038,.026,C.bright,12,.35)}
cylinder([RH[0],RH[1],-.13],[RH[0],RH[1],.13],.025,C.aluminium,12,.8);cylinder([FH[0],FH[1],-.15],[FH[0],FH[1],.15],.025,C.aluminium,12,.8);
// Saddle clamp collar and tube seams.
cylinder(mix(BB,ST,.91),mix(BB,ST,.96),.070,C.silver,16,.73,.059);sphere(ST,.062,C.bright,8,12,.38);sphere(BB,.069,C.whiteShadow,8,12,.43);
bitmap('GIANT',[.40,1.185],Math.atan2(HB[1]-BB[1],HB[0]-BB[0]),.023,.074,C.logo);
// Chainset, rear sprockets and derailleur.
active='drive';
const bx=BB[0],by=BB[1],rx=RH[0],ry=RH[1];
// Cassette at the rear hub with stepped cogs.
// Individual cassette cogs are added in the drivetrain refinement pass below.
ring(bx,by,.264,.019,.155,C.black,48,9,.6);ring(bx,by,.208,.018,.188,C.graphite,46,9,.5);
ring(bx,by,.148,.012,.202,C.blackSilver,42,8,.6);
for(let i=0;i<5;i++){const a=2*Math.PI*i/5+.3;cylinder([bx+Math.cos(a)*.057,by+Math.sin(a)*.057,.192],[bx+Math.cos(a)*.228,by+Math.sin(a)*.228,.171],.028,C.blackSilver,10,.55)}
// Teeth, visible near the outer sprocket edge.
for(let i=0;i<42;i++){const a=i*2*Math.PI/42;const o=[bx+.280*Math.cos(a),by+.280*Math.sin(a),.155];cylinder(o,[bx+.292*Math.cos(a),by+.292*Math.sin(a),.155],.006,C.blackSilver,6,.28)}
// Chain run with individual link pins and around the two sprockets.
const chainZ=.185,cr=.272,rr=.145;
const upper1=[rx,ry+rr,chainZ],upper2=[bx,by+cr,chainZ],lower1=[rx,ry-rr,chainZ],lower2=[bx,by-cr,chainZ];
path([upper1,upper2],.009,C.chain,6,.7);path([lower1,lower2],.009,C.chain,6,.7);
for(let i=0;i<19;i++){const t=i/18;for(let [a,b] of [[upper1,upper2],[lower1,lower2]])sphere(mix(a,b,t),.014,i%2?C.silver:C.darkSilver,3,6,.65)}
for(let i=0;i<16;i++){let a=-Math.PI/2+i*Math.PI/15;const p=[bx+cr*Math.cos(a),by+cr*Math.sin(a),chainZ];sphere(p,.013,C.chain,3,6,.5)}
for(let i=0;i<12;i++){let a=Math.PI/2+i*Math.PI/11;const p=[rx+rr*Math.cos(a),ry+rr*Math.sin(a),chainZ];sphere(p,.013,C.chain,3,6,.5)}
// Bottom-bracket, crank arms and platform pedals.
cylinder([bx,by,-.21],[bx,by,.22],.063,C.blackSilver,15,.55);cylinder([bx,by,.20],[bx,by,.245],.074,C.graphite,16,.55);
const pedalA=[bx+.360,by-.054,.24],pedalB=[bx-.355,by+.054,-.23];cylinder([bx,by,.238],pedalA,.041,C.black,13,.43);cylinder([bx,by,-.226],pedalB,.042,C.blackSilver,13,.43);
box(pedalA[0]-.075,pedalA[1]-.031,pedalA[2]-.14,pedalA[0]+.075,pedalA[1]+.031,pedalA[2]+.14,C.black,.16);box(pedalB[0]-.075,pedalB[1]-.033,pedalB[2]-.14,pedalB[0]+.075,pedalB[1]+.033,pedalB[2]+.14,C.black,.16);
for(let a of [pedalA,pedalB]){for(let s of [-1,1])box(a[0]-.05,a[1]+s*.023,a[2]-.115,a[0]+.05,a[1]+s*.027,a[2]+.115,C.graphite,.28)}
// Rear derailleur body, guide wheels, rear dropout.
sphere([rx-.105,ry-.105,.184],.072,C.black,6,12,.35);cylinder([rx-.08,ry-.115,.182],[rx-.16,ry-.32,.185],.035,C.blackSilver,12,.3);sphere([rx-.156,ry-.32,.185],.057,C.black,7,12,.3);ring(rx-.156,ry-.32,.038,.009,.211,C.silver,24,6,.65);path([[rx-.17,ry-.21,.203],[rx-.20,ry-.33,.203],[rx-.17,ry-.35,.203]],.009,C.chain,7,.48);
active='cockpit';
// Black anodized seat post and anatomically tapered racing saddle.
cylinder([ST[0],ST[1]-.035,0],[-.54,2.255,0],.042,C.blackSilver,14,.5);
for(let z of [-.075,.075])path([[-.75,2.255,z],[-.60,2.226,z],[-.37,2.235,z*.72],[-.19,2.27,z*.4]],.010,C.silver,7,.75);
const stations=[[-.91,2.316,.087],[-.81,2.340,.159],[-.66,2.337,.164],[-.50,2.325,.134],[-.35,2.307,.085],[-.15,2.298,.038]];
for(let i=0;i<stations.length-1;i++){let [x,y,w]=stations[i],[u,v,q]=stations[i+1];let z0=.01;quad([x,y,w],[u,v,q],[u,v,-q],[x,y,-w],C.black,.08);quad([x,y-.075,w*.84],[x,y,w],[x,y,-w],[x,y-.075,-w*.84],C.tape,.1);quad([u,v-.075,q*.84],[u,v,q],[x,y,w],[x,y-.075,w*.84],C.blackSilver,.1);quad([x,y,-w],[u,v,-q],[u,v-.075,-q*.84],[x,y-.075,-w*.84],C.tape,.12)}
// Stem, headset and steer tube.
cylinder([.81,1.85,0],[.76,2.19,0],.042,C.blackSilver,15,.45);cylinder([.76,2.19,0],[1.09,2.245,0],.051,C.black,14,.43);sphere([1.09,2.245,0],.056,C.graphite,9,12,.4);
// Drop handlebars: tapered bar, wide flares and swept-back hooked drops.
for(const sg of [-1,1]){const z=.36*sg;path([[1.08,2.245,0],[1.14,2.235,z*.50],[1.27,2.255,z*.92],[1.45,2.267,z],[1.60,2.249,z],[1.65,2.183,z],[1.645,2.056,z],[1.595,1.955,z],[1.47,1.935,z],[1.37,1.947,z]],.031,C.tape,11,.13);
// Brake lever bodies and rubber hoods.
cone([1.62,2.254,z],[1.71,2.335,z],.046,.034,C.black,12,.22);
path([[1.68,2.276,z],[1.72,2.19,z],[1.72,2.01,z]],.016,C.blackSilver,8,.46);
cylinder([1.45,2.265,z],[1.49,2.264,z],.035,C.graphite,10,.25)}
// Thin central exposed clamp section and brake-hood detailing.
cylinder([1.09,2.245,-.08],[1.09,2.245,.08],.039,C.silver,12,.62);
active='detail';
// Side-pull calipers, pad carriers, housing and derailleur cables.
function brake(cx,cy){sphere([cx,cy,.10],.048,C.blackSilver,6,12,.44);path([[cx,cy,.096],[cx-.15,cy-.13,.11]],.020,C.black,9,.35);path([[cx,cy,.096],[cx+.15,cy-.13,.11]],.020,C.black,9,.35);for(let s of [-1,1]){box(cx+s*.13-.035,cy-.16,.087,cx+s*.13+.035,cy-.12,.153,C.tape,.2)}cylinder([cx,cy,-.08],[cx,cy,.17],.012,C.silver,9,.85)}
brake(1.087,1.665);brake(-.73,1.58);
// Bowden cables visible in side view, routed in 3D arcs from handlebars.
path([[1.695,2.28,.37],[1.73,2.18,.38],[1.67,1.95,.37],[1.52,1.77,.25],[1.10,1.68,.12]],.011,C.black,8,.05);
path([[1.70,2.28,-.36],[1.50,2.29,-.29],[1.17,2.17,-.14],[.87,2.02,.07],[.35,1.85,.08],[-.30,1.73,.07],[-.73,1.59,.11]],.010,C.black,8,.04);
path([[1.65,2.19,.38],[1.50,2.05,.24],[1.09,1.90,.08],[.35,1.38,.12],[-.41,.82,.20],[-1.16,.60,.18],[-1.40,.74,.19]],.009,C.blackSilver,8,.15);
// Bottle bosses and skewer quick release levers.
for(let p of [[-.01,.89,.071],[.38,1.21,.073],[-.37,1.17,.07],[-.40,1.42,.07]])sphere(p,.016,C.darkSilver,5,8,.7);
path([[FH[0],FH[1],.138],[FH[0]+.10,FH[1]+.08,.18]],.010,C.silver,8,.7);
path([[RH[0],RH[1],.137],[RH[0]-.07,RH[1]+.09,.17]],.010,C.silver,8,.7);


// Second pass of photographic detail: deeper rim brake tracks, crossed lacing and cassette machining.
active='wheels';
for(const [hub,isRear] of [[RH,true],[FH,false]]){
 const [x,y]=hub;
 for(let j=0;j<2;j++){
   const z=j?0.055:-0.055;
   ring(x,y,0.751,0.0065,z,C.aluminium,96,7,0.83); // machined brake track
   ring(x,y,0.770,0.004,z*.67,C.blackSilver,96,6,0.56); // rim edge
 }
 for(let i=0;i<32;i++){
   const t=2*Math.PI*i/32;
   const side=i%2?1:-1;
   const flangeZ=side*(isRear?0.089:0.082);
   const phi=t+side*(isRear?0.19:0.15);
   cylinder([x+Math.cos(phi)*0.046,y+Math.sin(phi)*0.046,flangeZ],
            [x+Math.cos(t)*0.735,y+Math.sin(t)*0.735,side*0.017],0.0025,C.silver,5,0.75);
   cylinder([x+Math.cos(t)*0.725,y+Math.sin(t)*0.725,side*0.017],
            [x+Math.cos(t)*0.741,y+Math.sin(t)*0.741,side*0.017],0.005,C.darkSilver,6,0.76);
 }
}
active='drive';
// Nested 2x crank and the 8-sprocket cassette, with subtle tooth pattern and guide pulleys.
for(let cog=0;cog<8;cog++){
 let radius=0.087+cog*0.011,z=0.126-cog*0.014;
 ring(rx,ry,radius,0.0045,z,C.aluminium,42,6,0.82);
 for(let k=0;k<19+cog;k++){
  const a=2*Math.PI*k/(19+cog);
  cylinder([rx+radius*Math.cos(a),ry+radius*Math.sin(a),z],
    [rx+(radius+0.006)*Math.cos(a),ry+(radius+0.006)*Math.sin(a),z],0.003,C.darkSilver,5,0.70);
 }
}
for(const [r,z,count] of [[0.260,0.164,40],[0.203,0.191,30]]){
 for(let k=0;k<count;k++){
  const a=k*2*Math.PI/count;
  cylinder([bx+r*Math.cos(a),by+r*Math.sin(a),z],
    [bx+(r+0.010)*Math.cos(a),by+(r+0.010)*Math.sin(a),z],0.004,C.aluminium,5,0.72);
 }
}
for(const [x,y] of [[rx-.153,ry-.31],[rx-.113,ry-.16]]){
 ring(x,y,0.040,0.007,0.218,C.darkSilver,24,6,0.82);
 cylinder([x,y,0.214],[x,y,0.235],0.011,C.silver,8,0.85);
}
sphere([bx,by,0.253],0.026,C.silver,7,12,0.88);

// WEBGPU ENGINE v2 — one renderer, WGSL-only lighting, shadow-map depth pass, MSAA & dynamic scaling.
const shader = /* wgsl */`
struct Globals {
  mvp:mat4x4<f32>, lightMVP:mat4x4<f32>, eye:vec4<f32>, key:vec4<f32>,
  fill:vec4<f32>, params:vec4<f32>, accents:vec4<f32>
};
@group(0) @binding(0) var<uniform> U:Globals;
@group(0) @binding(1) var shadowDepth:texture_depth_2d;
@group(0) @binding(2) var shadowSampler:sampler_comparison;
struct VertOut { @builtin(position) clip:vec4<f32>, @location(0) world:vec3<f32>,
  @location(1) normal:vec3<f32>, @location(2) color:vec3<f32>, @location(3) finish:f32 };
@vertex fn bikeVS(@location(0) pos:vec3<f32>,@location(1) n:vec3<f32>,@location(2) paint:vec4<f32>)->VertOut {
 var o:VertOut; o.clip=U.mvp*vec4<f32>(pos,1.0); o.world=pos;
 o.normal=n; o.color=paint.xyz; o.finish=paint.w; return o;
}
@vertex fn floorVS(@location(0) pos:vec3<f32>)->VertOut {
 var o:VertOut; o.clip=U.mvp*vec4<f32>(pos,1.0); o.world=pos;
 o.normal=vec3<f32>(0.0,1.0,0.0);o.color=vec3<f32>(0.2);o.finish=0.0;return o;
}
@vertex fn shadowVS(@location(0) pos:vec3<f32>)->@builtin(position) vec4<f32> {
 return U.lightMVP*vec4<f32>(pos,1.0);
}
fn visibility(pos:vec3<f32>, bias:f32)->f32 {
 let projected=U.lightMVP*vec4<f32>(pos,1.0);
 let clip=projected.xyz/projected.w;
 let uv=clip.xy*vec2<f32>(0.5,-0.5)+vec2<f32>(0.5);
 if (any(uv<vec2<f32>(0.0)) || any(uv>vec2<f32>(1.0)) || clip.z<=0.0 || clip.z>=1.0) { return 1.0; }
 let inv=1.0/vec2<f32>(textureDimensions(shadowDepth));
 // Low: 1 sample, Medium: 4 samples, High: 9 samples.
 let radius=select(0,1,U.params.z>0.5);
 var total=0.0;var count=0.0;
 for(var y=-radius;y<=radius;y=y+1) {
   for(var x=-radius;x<=radius;x=x+1) {
     if (U.params.z<1.5 && (x==1 || y==1)) {continue;}
     total+=textureSampleCompare(shadowDepth,shadowSampler,uv+vec2<f32>(f32(x),f32(y))*inv,clip.z-bias);
     count+=1.0;
   }
 }
 return total/max(1.0,count);
}
fn tonemap(linear:vec3<f32>)->vec3<f32> {
 let x=max(linear*U.params.w,vec3<f32>(0.0));
 let mapped=(x*(2.51*x+vec3<f32>(0.03)))/(x*(2.43*x+vec3<f32>(0.59))+vec3<f32>(0.14));
 return pow(clamp(mapped,vec3<f32>(0.0),vec3<f32>(1.0)),vec3<f32>(1.0/2.2));
}
@fragment fn bikeFS(v:VertOut)->@location(0) vec4<f32> {
 let N=normalize(v.normal);let V=normalize(U.eye.xyz-v.world);
 let L=normalize(U.key.xyz);let H=normalize(L+V);
 let NoL=max(0.0,dot(N,L)), NoV=max(0.015,dot(N,V)), NoH=max(0.0,dot(N,H)), VoH=max(0.0,dot(V,H));
 // Finish encodes the source mesh's coating strength; light silver pieces are metallic.
 let metallic=smoothstep(0.54,0.86,v.finish);
 let rough=clamp(0.65-0.46*v.finish,0.18,0.82);
 let a=rough*rough;let a2=a*a;
 let denom=NoH*NoH*(a2-1.0)+1.0;
 let distribution=a2/(3.14159265*denom*denom+0.0001);
 let k=(rough+1.0)*(rough+1.0)/8.0;
 let geometry=(NoV/(NoV*(1.0-k)+k))*(NoL/(NoL*(1.0-k)+k));
 let F0=mix(vec3<f32>(0.042),v.color,metallic);
 let fresnel=F0+(vec3<f32>(1.0)-F0)*pow(1.0-VoH,5.0);
 let specular=(distribution*geometry*fresnel)/(4.0*NoL*NoV+0.002);
 let softFill=max(0.0,dot(N,normalize(U.fill.xyz)))*0.24;
 let hemisphere=0.28+0.26*max(N.y,0.0)+softFill;
 let coat=pow(max(dot(N,H),0.0),90.0)*(1.0-metallic)*0.14;
 let vis=visibility(v.world,0.0014+0.0012*(1.0-NoL));
 var cool=vec3<f32>(1.0);
 if (U.params.x>0.5 && U.params.x<1.5) { cool=vec3<f32>(1.14,0.96,0.84); }
 if (U.params.x>1.5) { cool=vec3<f32>(0.77,0.98,1.22); }
 let direct=(v.color*(vec3<f32>(1.0)-fresnel)*(1.0-metallic)/3.14159265 + specular)
       *NoL*3.0*cool*vis;
 let ambient=v.color*(1.0-0.76*metallic)*hemisphere;
 let rim=pow(1.0-max(0.0,dot(N,V)),3.0)*0.11*U.accents.xyz;
 return vec4<f32>(tonemap(direct+ambient+vec3<f32>(coat*vis)+rim),1.0);
}
@fragment fn floorFS(v:VertOut)->@location(0) vec4<f32> {
 let p=v.world.xz;let d=length(p);
 let uv=abs(fract(p*2.25)-vec2<f32>(0.5));
 let grid=1.0-smoothstep(0.477,0.496,max(uv.x,uv.y));
 var base=vec3<f32>(0.115,0.152,0.179);
 if (U.params.x>0.5 && U.params.x<1.5) {base=vec3<f32>(0.18,0.155,0.139);}
 if (U.params.x>1.5) {base=vec3<f32>(0.085,0.145,0.166);}
 let vis=visibility(v.world,0.0025);
 let c=base+grid*exp(-d*0.35)*vec3<f32>(0.038,0.064,0.067);
 let shaded=c*(0.36+0.64*vis);
 return vec4<f32>(tonemap(shaded),clamp(exp(-d*0.19)*0.92,0.12,0.93));
}
`;
function persp(fov,aspect,near,far){const o=new Float32Array(16),f=1/Math.tan(fov/2);o[0]=f/aspect;o[5]=f;o[10]=far/(near-far);o[11]=-1;o[14]=far*near/(near-far);return o;}
function look(eye,focus,up=[0,1,0]){const z=norm(sub(eye,focus)),x=norm(cross(up,z)),y=cross(z,x),o=new Float32Array(16);o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-dot(x,eye);o[13]=-dot(y,eye);o[14]=-dot(z,eye);o[15]=1;return o;}
function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let n=0;for(let k=0;k<4;k++)n+=a[k*4+r]*b[c*4+k];o[c*4+r]=n;}return o;}
function ortho(l,r,b,t,n,f){const o=new Float32Array(16);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=1/(n-f);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=n/(n-f);o[15]=1;return o;}
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const scenePresets=[
 {name:'中性攝影棚',key:[-3.3,6.0,4.0],fill:[2.4,3.0,-3.8],accent:[0.58,0.78,0.88],clear:[0.075,0.10,0.128],exposure:1.17},
 {name:'暖光棚拍',key:[-3.0,5.2,4.4],fill:[1.8,2.0,-2.3],accent:[0.92,0.77,0.55],clear:[0.118,0.102,0.09],exposure:1.08},
 {name:'冷光展示',key:[-4.0,7.0,3.5],fill:[2.8,3.2,-4.3],accent:[0.5,0.88,1.0],clear:[0.045,0.094,0.12],exposure:1.25}
];
const tiers={low:{dpr:0.85,cap:0.80e6,msaa:1,shadow:512,min:0.55,target:48},medium:{dpr:1.25,cap:1.55e6,msaa:4,shadow:1024,min:0.65,target:52},high:{dpr:1.85,cap:2.80e6,msaa:4,shadow:2048,min:0.68,target:55}};
let quality=matchMedia('(max-width:650px)').matches?'medium':'high',studio=0,autoScale=true,dynamicScale=1;
let device=null,adapter=null,context=null,format=null,generation=0,running=false;
let mainPipe=null,floorPipe=null,shadowPipe=null,bgl=null,globalBuffer=null,globalBind=null;
let shadowTex=null,shadowView=null,shadowSampler=null,depthTex=null,depthView=null,msaaTex=null,msaaView=null;
let groups=[],floorBuffer=null,outputWidth=0,outputHeight=0,renderSamples=0,shadowSize=0;
let orbit={az:.10,el:.14,radius:5.6,focus:[.02,1.18,0]},target={az:.10,el:.14,radius:5.6,focus:[.02,1.18,0]},spinning=false;
let fps=0,fpsAvg=60,frames=0,frameStart=0,frameLast=0,lastScaleUpdate=0,losses=0,restartTimer=null;
const visible={frame:true,wheels:true,drive:true,cockpit:true,detail:true};
const $=id=>document.getElementById(id);
const perf=$('perf'),status=$('status'),toast=$('tourDescription');
function setStatus(msg){status.textContent=msg;}
function updatePerf(){if(!perf)return;let x=tiers[quality];perf.textContent=`${Math.round(fps)} FPS  ·  ${outputWidth}×${outputHeight}  ·  ${Math.round(dynamicScale*100)}%\n${quality.toUpperCase()} · ${x.msaa}× MSAA · ${x.shadow}px SHADOW`;
window.__bikeRendererInfo={fps:Math.round(fps),width:outputWidth,height:outputHeight,quality,scene:studio,autoScale,dynamicScale,shadowSize,msaa:renderSamples,vertexCount:window.__bikeVertexCount||0,deviceLosses:losses,active:running};}
function disposeTargets(){for(const t of [depthTex,msaaTex,shadowTex])try{t?.destroy()}catch(_){} depthTex=null;msaaTex=null;shadowTex=null;}
function resize(){if(!device)return;const tier=tiers[quality],dpr=Math.min(3,window.devicePixelRatio||1);
 let scale=tier.dpr*Math.min(dpr,1.5)*dynamicScale;
 const cw=Math.max(1,canvas.clientWidth),ch=Math.max(1,canvas.clientHeight);
 scale=Math.min(scale,Math.sqrt(tier.cap/(cw*ch)));
 const maxDim=device.limits.maxTextureDimension2D;
 const w=clamp(Math.round(cw*scale),1,maxDim),h=clamp(Math.round(ch*scale),1,maxDim);
 if(w===outputWidth&&h===outputHeight&&depthTex&&renderSamples===tier.msaa)return;
 outputWidth=w;outputHeight=h;canvas.width=w;canvas.height=h;
 depthTex?.destroy();msaaTex?.destroy();
 depthTex=device.createTexture({size:[w,h],sampleCount:tier.msaa,format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});
 depthView=depthTex.createView();
 if(tier.msaa>1){msaaTex=device.createTexture({size:[w,h],sampleCount:tier.msaa,format,usage:GPUTextureUsage.RENDER_ATTACHMENT});msaaView=msaaTex.createView();}else{msaaTex=null;msaaView=null;}
 renderSamples=tier.msaa;
}
function createShadow(){const dimension=tiers[quality].shadow;
 shadowTex?.destroy();shadowTex=device.createTexture({size:[dimension,dimension],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
 shadowView=shadowTex.createView();shadowSize=dimension;
 globalBind=device.createBindGroup({layout:bgl,entries:[{binding:0,resource:{buffer:globalBuffer}},{binding:1,resource:shadowView},{binding:2,resource:shadowSampler}]});
}
function createPipelines(){const module=device.createShaderModule({label:'Road Studio WGSL 2',code:shader});
 const layout=device.createPipelineLayout({bindGroupLayouts:[bgl]});
 const bikeBuffers=[{arrayStride:40,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x4'}]}];
 const floorBuffers=[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:'float32x3'}]}];
 const samples=tiers[quality].msaa;
 const depth={format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'};
 mainPipe=device.createRenderPipeline({label:'PBR bicycle + PCF shadows',layout,vertex:{module,entryPoint:'bikeVS',buffers:bikeBuffers},fragment:{module,entryPoint:'bikeFS',targets:[{format}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:depth,multisample:{count:samples}});
 floorPipe=device.createRenderPipeline({label:'Shadow-receiving studio floor',layout,vertex:{module,entryPoint:'floorVS',buffers:floorBuffers},fragment:{module,entryPoint:'floorFS',targets:[{format,blend:{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'less'},multisample:{count:samples}});
 shadowPipe=device.createRenderPipeline({label:'True bicycle depth shadow map',layout,vertex:{module,entryPoint:'shadowVS',buffers:[{arrayStride:40,attributes:[{shaderLocation:0,offset:0,format:'float32x3'}]}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less',depthBias:2,depthBiasSlopeScale:1.6}});
}
function setQuality(next){if(!tiers[next]||quality===next)return;quality=next;dynamicScale=1;
 document.querySelectorAll('[data-quality]').forEach(b=>b.classList.toggle('active',b.dataset.quality===quality));
 if(device){createPipelines();createShadow();resize();}updatePerf();}
function setScene(index){studio=clamp(Number(index)||0,0,2);document.querySelectorAll('[data-studio]').forEach(b=>b.classList.toggle('active',Number(b.dataset.studio)===studio));updatePerf();}
function maybeAdjustScale(now){if(!autoScale||!fps||now-lastScaleUpdate<1800)return;lastScaleUpdate=now;
 const tier=tiers[quality],previous=dynamicScale;
 if(fpsAvg<tier.target-7)dynamicScale=Math.max(tier.min,dynamicScale-0.08);
 else if(fpsAvg>tier.target+4)dynamicScale=Math.min(1,dynamicScale+0.045);
 if(Math.abs(previous-dynamicScale)>0.001)resize();}
function gpuLost(info,oldGeneration){if(oldGeneration!==generation)return;running=false;generation++;device=null;
 losses++;updatePerf();setStatus(`GPU 中斷，恢復中 (${losses})…`);$('loading').style.display='flex';$('loading').style.opacity='1';
 clearTimeout(restartTimer);
 if(losses>4){showError('WebGPU 多次中斷，已停止重試。請重新整理並切換低畫質。');return;}
 restartTimer=setTimeout(()=>startGPU().catch(e=>{console.error(e);gpuStartFail(e);}),400+losses*700);
}
function gpuStartFail(err){console.error('GPU init failed',err);if(losses<4){losses++;setStatus('嘗試重新連線 GPU…');restartTimer=setTimeout(()=>startGPU().catch(gpuStartFail),Math.min(4400,600*losses));}
 else showError('無法初始化 WebGPU：'+(err.message||err)+ '。請確認瀏覽器支援 WebGPU。');}
async function startGPU(){if(!navigator.gpu){showError('瀏覽器不支援 WebGPU。請透過 HTTPS 使用最新版 Chrome／Edge（不提供 WebGL 備援）。');return;}
 const myGen=++generation;
 adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 if(!adapter)throw new Error('找不到 WebGPU Adapter');
 const newDevice=await adapter.requestDevice();if(myGen!==generation){newDevice.destroy();return;}
 device=newDevice;
 device.lost.then(info=>gpuLost(info,myGen));
 device.addEventListener?.('uncapturederror',e=>console.warn('WebGPU validation:',e.error?.message||e));
 context=canvas.getContext('webgpu');if(!context)throw new Error('Canvas 無法建立 WebGPU Context');
 format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});
 groups=[];disposeTargets();outputWidth=0;outputHeight=0;
 bgl=device.createBindGroupLayout({entries:[
  {binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}},
  {binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'depth'}},
  {binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'comparison'}}
 ]});
 globalBuffer=device.createBuffer({size:208,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 shadowSampler=device.createSampler({compare:'less-equal',magFilter:'linear',minFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'});
 createPipelines();createShadow();
 for(const [name,vertices] of Object.entries(sets)){
  const raw=new Float32Array(vertices),buffer=device.createBuffer({size:Math.max(4,raw.byteLength),usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
  if(raw.byteLength)device.queue.writeBuffer(buffer,0,raw);groups.push({name,buffer,count:raw.length/10});
 }
 const floorVertices=new Float32Array([-12,-0.065,-12,12,-0.065,-12,12,-0.065,12,-12,-0.065,-12,12,-0.065,12,-12,-0.065,12]);
 floorBuffer=device.createBuffer({size:floorVertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(floorBuffer,0,floorVertices);
 window.__bikeVertexCount=groups.reduce((s,g)=>s+g.count,0);
 resize();if(myGen!==generation)return;
 setStatus('LIVE · WEBGPU');$('error').style.display='none';$('loading').style.opacity='0';
 setTimeout(() => {if(myGen===generation)$('loading').style.display='none';},350);
 running=true;updatePerf();frameLast=performance.now();frameStart=frameLast;frames=0;fpsAvg=60;
 requestAnimationFrame(now=>render(now,myGen));
}
function render(now,myGen){if(!running||!device||myGen!==generation)return;
 const delta=Math.min(0.05,Math.max(0.001,(now-frameLast)/1000));frameLast=now;
 if(spinning)target.az+=delta*0.32;
 const smoothing=1-Math.exp(-delta*7.5);
 for(const key of ['az','el','radius'])orbit[key]+=(target[key]-orbit[key])*smoothing;
 for(let i=0;i<3;i++)orbit.focus[i]+=(target.focus[i]-orbit.focus[i])*smoothing;
 resize();const aspect=canvas.width/canvas.height;
 const radius=orbit.radius*(aspect<0.78?1.43:aspect<1?1.22:1);
 const center=orbit.focus,eye=[center[0]+radius*Math.sin(orbit.az)*Math.cos(orbit.el),center[1]+radius*Math.sin(orbit.el),center[2]+radius*Math.cos(orbit.az)*Math.cos(orbit.el)];
 const vp=multiply(persp(0.74,aspect,0.055,110),look(eye,center));
 const scene=scenePresets[studio],key=scene.key;
 const lamp=multiply(ortho(-4.5,4.5,-4.1,4.1,0.08,18),look(key,[0,0.8,0]));
 const data=new Float32Array(52);data.set(vp,0);data.set(lamp,16);data.set([...eye,1],32);
 data.set([...norm(key),1],36);data.set([...norm(scene.fill),1],40);
 data.set([studio,now*0.001,quality==='low'?0:quality==='medium'?1:2,scene.exposure],44);
 data.set([...scene.accent,1],48);device.queue.writeBuffer(globalBuffer,0,data);
 const encoder=device.createCommandEncoder({label:'Bike+Studio frame'});
 const shadowPass=encoder.beginRenderPass({label:'Real shadow depth pass',colorAttachments:[],depthStencilAttachment:{view:shadowView,depthLoadOp:'clear',depthClearValue:1,depthStoreOp:'store'}});
 shadowPass.setPipeline(shadowPipe);shadowPass.setBindGroup(0,globalBind);
 for(const g of groups)if(visible[g.name]){shadowPass.setVertexBuffer(0,g.buffer);shadowPass.draw(g.count);}
 shadowPass.end();
 const screenView=context.getCurrentTexture().createView();
 const c=scene.clear;
 const colorAttachment={view:renderSamples>1?msaaView:screenView,loadOp:'clear',storeOp:'store',clearValue:{r:c[0],g:c[1],b:c[2],a:1}};
 if(renderSamples>1)colorAttachment.resolveTarget=screenView;
 const pass=encoder.beginRenderPass({label:'PBR + MSAA studio pass',colorAttachments:[colorAttachment],depthStencilAttachment:{view:depthView,depthLoadOp:'clear',depthClearValue:1,depthStoreOp:'store'}});
 pass.setBindGroup(0,globalBind);pass.setPipeline(floorPipe);pass.setVertexBuffer(0,floorBuffer);pass.draw(6);
 pass.setPipeline(mainPipe);for(const g of groups)if(visible[g.name]){pass.setVertexBuffer(0,g.buffer);pass.draw(g.count);}pass.end();
 device.queue.submit([encoder.finish()]);
 frames++;if(now-frameStart>=900){fps=frames*1000/(now-frameStart);fpsAvg=fpsAvg*0.35+fps*0.65;frames=0;frameStart=now;maybeAdjustScale(now);updatePerf();}
 requestAnimationFrame(time=>render(time,myGen));
}
// Camera, close-ups and guided tours; no other rendering API is used.
const shots={
 side:{az:0,el:0.09,radius:5.65,focus:[0,1.16,0],label:'全車側面｜車架比例與幾何'},
 angle:{az:0.72,el:0.23,radius:5.5,focus:[0,1.16,0],label:'45° 斜角｜車架與輪組'},
 front:{az:Math.PI/2,el:0.1,radius:5.6,focus:[0,1.2,0],label:'正面｜輪組及彎把'},
 top:{az:0.24,el:1.29,radius:6.5,focus:[0,1.23,0],label:'俯視｜把手寬度及結構'},
 frame:{az:0.35,el:0.11,radius:2.95,focus:[0.12,1.30,0],label:'車架特寫｜白色烤漆'},
 wheels:{az:0.41,el:0.1,radius:2.75,focus:[1.29,0.92,0],label:'輪組特寫｜編輻、輪圈與圈煞'},
 drive:{az:0.13,el:0.15,radius:2.70,focus:[-0.65,0.76,0.15],label:'傳動特寫｜雙齒盤、鏈條與後變速器'},
 cockpit:{az:0.78,el:0.25,radius:2.48,focus:[0.94,2.15,0],label:'操控特寫｜彎把、煞變與坐墊'}
};
let tourTimer=null,tourIndex=0;
const tourSequence=['side','angle','frame','wheels','drive','cockpit','front'];
function announce(message){toast.textContent=message;toast.classList.add('visible');}
function setView(name){const p=shots[name];if(!p)return;
 target.az=p.az;target.el=p.el;target.radius=p.radius;target.focus=p.focus.slice();
 document.querySelectorAll('[data-view],[data-focus]').forEach(el=>el.classList.toggle('active',el.dataset.view===name||el.dataset.focus===name));announce(p.label);
}
function stopTour(){clearInterval(tourTimer);tourTimer=null;$('tour').classList.remove('active');$('tour').setAttribute('aria-pressed','false');}
function startTour(){stopTour();tourIndex=0;setView(tourSequence[tourIndex]);$('tour').classList.add('active');$('tour').setAttribute('aria-pressed','true');tourTimer=setInterval(()=>{tourIndex=(tourIndex+1)%tourSequence.length;setView(tourSequence[tourIndex]);},4400);}
let pointers=new Map(),lastPinch=0;
canvas.addEventListener('pointerdown',ev=>{canvas.setPointerCapture(ev.pointerId);pointers.set(ev.pointerId,[ev.clientX,ev.clientY]);lastPinch=0;spinning=false;$('spin').classList.remove('active');stopTour();});
canvas.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const prev=pointers.get(ev.pointerId),dx=ev.clientX-prev[0],dy=ev.clientY-prev[1];pointers.set(ev.pointerId,[ev.clientX,ev.clientY]);if(pointers.size===1){target.az-=dx*0.008;target.el=clamp(target.el+dy*0.008,-1.36,1.45);}else if(pointers.size>=2){const a=[...pointers.values()],dist=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(lastPinch)target.radius=clamp(target.radius*lastPinch/dist,1.8,13);lastPinch=dist;}});
for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{pointers.delete(e.pointerId);lastPinch=0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();stopTour();target.radius=clamp(target.radius*Math.exp(e.deltaY*0.0009),1.8,13);},{passive:false});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{stopTour();setView(b.dataset.view);}));
document.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>{stopTour();setView(b.dataset.focus);}));
document.querySelectorAll('[data-quality]').forEach(b=>b.addEventListener('click',()=>setQuality(b.dataset.quality)));
document.querySelectorAll('[data-studio]').forEach(b=>b.addEventListener('click',()=>setScene(b.dataset.studio)));
document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('change',()=>{visible[el.dataset.layer]=el.checked;}));
$('autoScale').addEventListener('change',e=>{autoScale=e.target.checked;if(!autoScale)dynamicScale=1;resize();updatePerf();});
$('reset').addEventListener('click',()=>{stopTour();spinning=false;$('spin').classList.remove('active');setView('side');});
$('spin').addEventListener('click',()=>{stopTour();spinning=!spinning;$('spin').classList.toggle('active',spinning);});
$('zoomIn').addEventListener('click',()=>target.radius=clamp(target.radius*0.83,1.8,13));
$('zoomOut').addEventListener('click',()=>target.radius=clamp(target.radius*1.2,1.8,13));
$('tour').addEventListener('click',()=>tourTimer?stopTour():startTour());
$('retry').addEventListener('click',()=>{losses=0;clearTimeout(restartTimer);$('error').style.display='none';startGPU().catch(gpuStartFail);});
window.addEventListener('pagehide',()=>{stopTour();running=false;});
window.addEventListener('pageshow',event=>{if(event.persisted&&!running)startGPU().catch(gpuStartFail);});
document.querySelectorAll('[data-quality]').forEach(b=>b.classList.toggle('active',b.dataset.quality===quality));
updatePerf();setView('side');
startGPU().catch(gpuStartFail);