(function(){
"use strict";
const records=Array.isArray(window.ATLAS_EVENTS)?window.ATLAS_EVENTS:[];
const labels={religion:"宗教信仰",paranormal:"靈異傳聞",mystery:"神秘事件",folklore:"鄉野傳奇",myth:"神仙志怪"};
const byId=(id)=>document.getElementById(id);
const state={category:"all",region:"all",query:"",year:2026,sort:"newest",selected:null};
const els={list:byId("eventList"),count:byId("resultCount"),pins:byId("pinCount"),search:byId("search"),region:byId("region"),sort:byId("sort"),year:byId("year"),yearText:byId("yearText"),detail:byId("detail")};
let map=null;
const layers=new Map();
const safe=(s)=>String(s??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pretty=(r)=>r.date?r.date.replace(/-/g," / "):"流傳年代不詳";
const isLegend=()=>true;
const status=()=>"傳說／未經客觀證實";
const hue=(c)=>({religion:"#e7b765",paranormal:"#af9cdb",mystery:"#4fb5ba",folklore:"#79bb96",myth:"#e58080"})[c];
function filtered(){
 let a=records.filter(r=>(state.category==="all"||r.category===state.category)&&(state.region==="all"||r.city===state.region)&&(!r.year||r.year<=state.year));
 if(state.query){const s=state.query.toLocaleLowerCase("zh-Hant");a=a.filter(r=>[r.title,r.place,r.city,r.summary,r.body].some(t=>t.toLocaleLowerCase("zh-Hant").includes(s)));}
 return a.sort((a,b)=>state.sort==="name"?a.title.localeCompare(b.title,"zh-Hant"):(state.sort==="oldest"?1:-1)*((a.year||0)-(b.year||0)));
}
function initRegions(){Array.from(new Set(records.map(r=>r.city))).sort((a,b)=>a.localeCompare(b,"zh-Hant")).forEach(city=>{let o=document.createElement("option");o.value=city;o.textContent=city;els.region.appendChild(o)});byId("count-all").textContent=records.length;}
function renderList(items){
 els.list.innerHTML="";
 if(!items.length){els.list.innerHTML='<div class="empty-state">沒有符合條件的事件。<br>可試著清除搜尋，或改選其他類型。</div>';return;}
 items.forEach(r=>{
 const btn=document.createElement("button");btn.type="button";btn.className="event-card"+(state.selected===r.id?" selected":"");btn.setAttribute("aria-label","開啟："+r.title);
 btn.innerHTML='<div class="event-card-top"><span class="type"><i class="dot '+r.category+'"></i>'+safe(labels[r.category])+'</span><span>'+safe(r.year||"年代不詳")+'</span></div><h3>'+safe(r.title)+'</h3><p>'+safe(r.summary)+'</p><div class="card-bottom"><span class="card-location">⌁ '+safe(r.city)+'</span><span class="card-badge '+(isLegend(r)?"legend-status":"")+'">'+status(r)+'</span></div>';
 btn.addEventListener("click",()=>openRecord(r.id,true));els.list.appendChild(btn);
 });
}
function updateMarkers(items){
 if(!map)return;
 const keys=new Set(items.map(r=>r.id));
 records.forEach(r=>{const m=layers.get(r.id);if(!m)return;if(keys.has(r.id)){if(!map.hasLayer(m))m.addTo(map)}else if(map.hasLayer(m)){map.removeLayer(m)}});
}
function update(){
 const items=filtered();
 els.count.textContent=items.length;els.pins.textContent=items.length;
 renderList(items);updateMarkers(items);
 Array.from(document.querySelectorAll("#categories button")).forEach(b=>{const on=b.dataset.category===state.category;b.classList.toggle("active",on);b.setAttribute("aria-pressed",on?"true":"false")});
 if(state.selected&&!items.find(r=>r.id===state.selected))closeDetail();
}
function deepLink(r){const u=new URL(location.href);u.searchParams.set("id",r.id);return u.toString();}
function openRecord(id,fly){
 const r=records.find(x=>x.id===id);if(!r)return;
 state.selected=id;
 byId("detailNumber").textContent="ARCHIVE / "+String(records.indexOf(r)+1).padStart(3,"0");
 byId("detailCategory").textContent="● "+labels[r.category];
 byId("detailCategory").style.color=hue(r.category);
 byId("detailStatus").textContent=status(r);byId("detailStatus").classList.toggle("legend-status",isLegend(r));
 byId("detailTitle").textContent=r.title;
 byId("detailMeta").textContent=pretty(r)+"  ·  "+r.place;
 byId("detailSummary").textContent=r.summary;
 byId("detailBody").textContent=r.body;
 byId("precisionText").textContent=r.precision;
 byId("sourceLinks").innerHTML="";
 r.sources.forEach(s=>{const a=document.createElement("a");a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=s.name+" ↗";byId("sourceLinks").appendChild(a)});
 els.detail.classList.add("open");els.detail.setAttribute("aria-hidden","false");
 layers.forEach((m,k)=>{const el=m.getElement();if(el){const pin=el.querySelector(".pin");if(pin)pin.classList.toggle("selected",k===id)}});
 if(map&&fly)map.flyTo([r.lat,r.lng],Math.max(map.getZoom(),10),{duration:.8});
 const url=new URL(location.href);url.searchParams.set("id",id);history.replaceState(null,"",url);
 renderList(filtered());
}
function closeDetail(){
 state.selected=null;els.detail.classList.remove("open");els.detail.setAttribute("aria-hidden","true");
 layers.forEach(m=>{const el=m.getElement();if(el){const pin=el.querySelector(".pin");if(pin)pin.classList.remove("selected")}});
 const url=new URL(location.href);url.searchParams.delete("id");history.replaceState(null,"",url);
 renderList(filtered());
}
function initMap(){
 if(!window.L){byId("mapFallback").hidden=false;return;}
 map=L.map("map",{zoomControl:false,worldCopyJump:false,scrollWheelZoom:true,minZoom:6,maxZoom:17});
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);
 L.control.zoom({position:"bottomright"}).addTo(map);
 records.forEach(r=>{
 const icon=L.divIcon({className:"",html:'<div class="pin '+r.category+'"><i></i></div>',iconSize:[25,25],iconAnchor:[12,12]});
 const marker=L.marker([r.lat,r.lng],{icon,title:r.title,alt:r.title,keyboard:true});
 marker.on("click",()=>openRecord(r.id,false));layers.set(r.id,marker);
 });
 resetMap(false);updateMarkers(filtered());setTimeout(()=>map.invalidateSize(),70);
}
function resetMap(animate){if(!map)return;map.fitBounds([[21.89,119.42],[25.32,122.1]],{padding:[26,26],maxZoom:9,animate:animate!==false});}
document.querySelectorAll("#categories button").forEach(b=>b.addEventListener("click",()=>{state.category=b.dataset.category;update()}));
els.search.addEventListener("input",e=>{state.query=e.target.value.trim();update()});
els.region.addEventListener("change",e=>{state.region=e.target.value;update()});
els.sort.addEventListener("change",e=>{state.sort=e.target.value;update()});
els.year.addEventListener("input",e=>{state.year=+e.target.value;els.yearText.textContent=state.year;update()});
byId("reset").addEventListener("click",()=>{state.category="all";state.region="all";state.query="";state.year=2026;state.sort="newest";els.search.value="";els.region.value="all";els.sort.value="newest";els.year.value="2026";els.yearText.textContent="2026";update();resetMap(true)});
byId("home").addEventListener("click",()=>resetMap(true));
byId("random").addEventListener("click",()=>{const a=filtered();if(a.length)openRecord(a[Math.floor(Math.random()*a.length)].id,true)});
byId("closeDetail").addEventListener("click",closeDetail);
byId("shareBtn").addEventListener("click",async()=>{const r=records.find(x=>x.id===state.selected);if(!r)return;const b=byId("shareBtn");try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(deepLink(r));b.textContent="已複製事件連結 ✓"}else{prompt("請複製事件連結",deepLink(r));b.textContent="事件連結已顯示"}}catch(e){prompt("請複製事件連結",deepLink(r))}setTimeout(()=>b.textContent="複製此事件連結 ↗",1700)});
function about(open){byId("aboutModal").hidden=!open;if(open){byId("closeAbout").focus()}else{byId("aboutLink").focus();if(location.hash==="#about")history.replaceState(null,"",location.pathname+location.search)}}
byId("aboutLink").addEventListener("click",e=>{e.preventDefault();about(true)});
byId("closeAbout").addEventListener("click",()=>about(false));
byId("aboutBackdrop").addEventListener("click",()=>about(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!byId("aboutModal").hidden)about(false);else if(state.selected)closeDetail()}if(e.key==="/"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();els.search.focus()}});
initRegions();initMap();update();
const linked=new URL(location.href).searchParams.get("id");if(linked&&records.some(r=>r.id===linked))openRecord(linked,true);
})();