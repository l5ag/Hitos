// ═══════════════════════════════════════════════════════════
// Hitos RGT Viewer — Power BI embed via GitHub Pages
// Expects: window.RAW_DATA + Leaflet loaded before this script
// ═══════════════════════════════════════════════════════════
(function(){
// ── CSS ───────────────────────────────────────────────────
const _s=document.createElement('style');
_s.textContent=`
html,body{height:100%;width:100%;margin:0;overflow:hidden}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--panel:#161b22;--border:#30363d;--text:#e6edf3;--muted:#7d8590;--accent:#388bfd}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text)}
.app{display:flex;flex-direction:column;height:100%}
.topbar{height:40px;background:var(--panel);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 14px;flex-shrink:0;z-index:1000}
.topbar h1{font-size:13px;font-weight:700}
.topbar-sub{font-size:11px;color:var(--muted)}
.topbar-sep{flex:1}
.topbar-count{font-size:11px;font-weight:600;background:rgba(56,139,253,.15);color:var(--accent);padding:3px 10px;border-radius:99px;border:1px solid var(--accent)}
#map{flex:1;width:100%;background:var(--bg)}
.bottombar{height:42px;background:var(--panel);border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 14px;flex-shrink:0;z-index:1000}
.bottombar button{font-size:11px;font-weight:600;padding:4px 10px;border-radius:5px;background:var(--panel);color:var(--text);border:1px solid var(--border);cursor:pointer;font-family:inherit}
.bottombar button:hover{background:var(--border)}
.bottombar input[type=range]{flex:1;accent-color:var(--accent)}
#dlabel{font-family:'Consolas',monospace;font-size:12px;font-weight:700;color:var(--accent);min-width:80px;text-align:right}
.idw-legend{display:flex;gap:6px;align-items:center;margin-left:8px}
.idw-legend .sw{width:10px;height:10px;border-radius:2px;border:1px solid rgba(255,255,255,.2)}
.idw-legend span{font-size:10px;color:var(--muted)}
.leaflet-popup-content-wrapper{background:var(--panel)!important;border:1px solid var(--border)!important;border-radius:8px!important;box-shadow:0 6px 24px rgba(0,0,0,.6)!important;padding:0!important}
.leaflet-popup-content{margin:10px 14px!important;color:var(--text);font-size:12px;line-height:1.5}
.leaflet-popup-content .ph{font-weight:700;font-size:14px;color:var(--accent);margin-bottom:4px}
.leaflet-popup-content .pv{font-family:'Consolas',monospace;font-size:13px}
.leaflet-popup-tip{background:var(--panel)!important;border:1px solid var(--border)!important}
`;
document.head.appendChild(_s);

// ── HTML ──────────────────────────────────────────────────
document.body.innerHTML=`
<div class="app">
  <div class="topbar">
    <h1>Hitos RGT · Galdakao</h1>
    <span class="topbar-sub">Δ Cota (mm)</span>
    <span class="topbar-sep"></span>
    <span class="topbar-count" id="hitosCount">—</span>
  </div>
  <div id="map"></div>
  <div class="bottombar">
    <button id="playBtn">▶ Play</button>
    <input type="range" id="slider" min="0" max="0" value="0" step="1">
    <span id="dlabel">—</span>
    <div class="idw-legend">
      <div class="sw" style="background:#2166ac"></div><span>+5</span>
      <div class="sw" style="background:#67a9cf"></div><span>+2</span>
      <div class="sw" style="background:#f7f7f7"></div><span>0</span>
      <div class="sw" style="background:#ef8a62"></div><span>-2</span>
      <div class="sw" style="background:#b2182b"></div><span>-10</span>
    </div>
  </div>
</div>
`;

// ── Parse RAW_DATA ────────────────────────────────────────
var lines=RAW_DATA.trim().split('\n').filter(function(l){return l;});
var hitos=[], readings={}, dates=[], fronts=[], trace=[];
lines.forEach(function(l){
  if(l.charAt(0)==='#'){
    var p=l.substring(1).split('|');
    hitos.push({name:p[0],lat:+p[1],lng:+p[2]});
  } else if(l.charAt(0)==='F'){
    var p=l.split('|');
    var pair=p[2].split(':');
    fronts.push({date:p[1],name:pair[0],pk:+pair[1]});
  } else if(l.charAt(0)==='T'){
    var p=l.split('|');
    trace.push({pk:+p[1],lat:+p[2],lng:+p[3]});
  } else {
    var p=l.split('|');
    var date=p[0];
    if(!readings[date]) readings[date]={};
    for(var i=1;i<p.length;i++){
      var kv=p[i].split(':');
      readings[date][kv[0]]=+kv[1];
    }
    if(dates.indexOf(date)<0) dates.push(date);
  }
});
dates.sort();

var hitoMap={};
hitos.forEach(function(h){hitoMap[h.name]=h;});

document.getElementById('hitosCount').textContent=hitos.length+' hitos · '+dates.length+' fechas';
document.getElementById('slider').max=dates.length-1;
document.getElementById('slider').value=dates.length-1;

// ── Variables (assigned in setTimeout init) ───────────────
var map, idwLayer=null;
var markers={}, frontMarkers={};
var curIdx=dates.length-1, playing=false, playTimer=null;

// ── Color scale: Blue(+) → white(0) → red(-) ─────────────
function elevToColor(v){
  if(v>=0){
    var t=Math.min(v/5,1);
    return 'rgb('+Math.round(247*(1-t)+33*t)+','+Math.round(247*(1-t)+102*t)+','+Math.round(247*(1-t)+172*t)+')';
  } else {
    var t=Math.min(Math.abs(v)/10,1);
    return 'rgb('+Math.round(247*(1-t)+178*t)+','+Math.round(247*(1-t)+24*t)+','+Math.round(247*(1-t)+43*t)+')';
  }
}

function makeIcon(color,r){
  r=r||5;
  return L.divIcon({
    className:'',
    html:'<svg width="'+(r*2+4)+'" height="'+(r*2+4)+'" viewBox="0 0 '+(r*2+4)+' '+(r*2+4)+'">'+
      '<circle cx="'+(r+2)+'" cy="'+(r+2)+'" r="'+r+'" fill="'+color+'" stroke="rgba(0,0,0,.6)" stroke-width="1.5"/>'+
      '<circle cx="'+(r+2)+'" cy="'+(r+2)+'" r="'+Math.max(1,r/3)+'" fill="white" opacity=".6"/>'+
    '</svg>',
    iconSize:[r*2+4,r*2+4],iconAnchor:[r+2,r+2],popupAnchor:[0,-r-4]
  });
}

// ── IDW interpolation ─────────────────────────────────────
var IDW_RES=0.00015, IDW_POWER=2;

function computeIDW(dateIdx){
  var date=dates[dateIdx];
  var rd=readings[date];
  if(!rd) return [];
  var pts=[];
  Object.keys(rd).forEach(function(name){
    var h=hitoMap[name];
    if(h) pts.push({lat:h.lat,lng:h.lng,val:rd[name]});
  });
  if(pts.length<3) return [];
  var lats=pts.map(function(p){return p.lat;}),lngs=pts.map(function(p){return p.lng;});
  var latMin=Math.min.apply(null,lats)-IDW_RES*3,latMax=Math.max.apply(null,lats)+IDW_RES*3;
  var lngMin=Math.min.apply(null,lngs)-IDW_RES*3,lngMax=Math.max.apply(null,lngs)+IDW_RES*3;
  var cells=[];
  for(var lat=latMin;lat<latMax;lat+=IDW_RES){
    for(var lng=lngMin;lng<lngMax;lng+=IDW_RES){
      var wSum=0,vSum=0;
      for(var k=0;k<pts.length;k++){
        var d=Math.sqrt(Math.pow(lat-pts[k].lat,2)+Math.pow(lng-pts[k].lng,2));
        if(d<1e-10){wSum=1;vSum=pts[k].val;break;}
        var w=1/Math.pow(d,IDW_POWER);
        wSum+=w;vSum+=w*pts[k].val;
      }
      cells.push({lat:lat,lng:lng,val:wSum?vSum/wSum:0});
    }
  }
  return cells;
}

function renderIDW(dateIdx){
  if(idwLayer){map.removeLayer(idwLayer);idwLayer=null;}
  var cells=computeIDW(dateIdx);
  if(!cells.length) return;
  var rects=[];
  for(var i=0;i<cells.length;i++){
    rects.push(L.rectangle(
      [[cells[i].lat,cells[i].lng],[cells[i].lat+IDW_RES,cells[i].lng+IDW_RES]],
      {fillColor:elevToColor(cells[i].val),fillOpacity:0.55,stroke:false,interactive:false}
    ));
  }
  idwLayer=L.layerGroup(rects).addTo(map);
}

function updateMarkers(dateIdx){
  var date=dates[dateIdx];
  var rd=readings[date]||{};
  hitos.forEach(function(h){
    var val=rd[h.name];
    var color=val!==undefined?elevToColor(val):'#2be2ec';
    var r=val!==undefined?Math.max(4,Math.min(10,Math.abs(val)*1.5)):5;
    if(markers[h.name]) markers[h.name].marker.setIcon(makeIcon(color,r));
  });
}

function updatePopup(name){
  var di=+document.getElementById('slider').value;
  var date=dates[di];
  var rd=readings[date];
  var val=rd&&rd[name]!==undefined?rd[name]:null;
  var valStr=val!==null?val.toFixed(1):'—';
  var color=val!==null?elevToColor(val):'#7d8590';
  if(markers[name]) markers[name].marker.setPopupContent(
    '<div class="ph">'+name+'</div>'+
    '<div class="pv" style="color:'+color+'">Δ Cota: '+valStr+' mm</div>'+
    '<div style="font-size:11px;color:#7d8590;margin-top:4px">'+date+'</div>'
  ).openPopup();
}

// ── Tunnel fronts ─────────────────────────────────────────
var FRONT_COLORS={OLBE:'#ff6b35',OLAP:'#3fb950',ABGA:'#388bfd',ABHO:'#d29922'};

function pkToLatLng(pk){
  if(!trace.length) return null;
  for(var i=0;i<trace.length-1;i++){
    if(trace[i].pk<=pk&&trace[i+1].pk>=pk){
      var t=(pk-trace[i].pk)/(trace[i+1].pk-trace[i].pk);
      return [trace[i].lat+(trace[i+1].lat-trace[i].lat)*t, trace[i].lng+(trace[i+1].lng-trace[i].lng)*t];
    }
  }
  if(pk<=trace[0].pk) return [trace[0].lat,trace[0].lng];
  var last=trace[trace.length-1];
  return [last.lat,last.lng];
}

function updateFronts(dateIdx){
  var date=dates[dateIdx];
  ['OLBE','OLAP','ABGA','ABHO'].forEach(function(name){
    var lastPk=null;
    for(var i=0;i<fronts.length;i++){
      if(fronts[i].name===name&&fronts[i].date<=date) lastPk=fronts[i].pk;
    }
    if(lastPk!==null&&frontMarkers[name]){
      var ll=pkToLatLng(lastPk);
      if(ll){frontMarkers[name].setLatLng(ll);frontMarkers[name].setOpacity(1);}
    } else if(frontMarkers[name]){
      frontMarkers[name].setOpacity(0);
    }
  });
}

// ── Navigation ────────────────────────────────────────────
function goTo(idx){
  curIdx=Math.max(0,Math.min(dates.length-1,idx));
  document.getElementById('slider').value=curIdx;
  document.getElementById('dlabel').textContent=dates[curIdx]||'—';
  updateMarkers(curIdx);
  updateFronts(curIdx);
  renderIDW(curIdx);
}

function togglePlay(){
  playing=!playing;
  document.getElementById('playBtn').textContent=playing?'⏸ Pausa':'▶ Play';
  if(playing) playTimer=setInterval(function(){goTo((curIdx+1)%dates.length);},600);
  else clearInterval(playTimer);
}

// ── Event listeners ───────────────────────────────────────
document.getElementById('playBtn').addEventListener('click',togglePlay);
document.getElementById('slider').addEventListener('input',function(){goTo(+this.value);});

// ── Init: wait for layout then create map ─────────────────
setTimeout(function(){
  var el=document.getElementById('map');
  if(!el.clientHeight) el.style.height=(window.innerHeight-82)+'px';

  map=L.map('map',{zoomControl:false,maxZoom:19});
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    attribution:'Esri',maxZoom:19,maxNativeZoom:18
  }).addTo(map);

  // Place markers
  var lls=[];
  hitos.forEach(function(h){
    var ll=[h.lat,h.lng];
    lls.push(ll);
    var m=L.marker(ll,{icon:makeIcon('#2be2ec')});
    m.bindPopup('',{maxWidth:260});
    m.on('click',function(){updatePopup(h.name);});
    m.addTo(map);
    markers[h.name]={marker:m,ll:ll};
  });
  if(lls.length) map.fitBounds(L.latLngBounds(lls).pad(0.15));

  // Trace line
  if(trace.length>1){
    var traceLL=trace.map(function(t){return [t.lat,t.lng];});
    L.polyline(traceLL,{color:'rgba(255,255,255,0.25)',weight:2,dashArray:'6,4'}).addTo(map);
  }

  // Front markers
  ['OLBE','OLAP','ABGA','ABHO'].forEach(function(name){
    var color=FRONT_COLORS[name]||'#fff';
    var icon=L.divIcon({
      className:'',
      html:'<svg width="28" height="28" viewBox="0 0 28 28">'+
        '<circle cx="14" cy="14" r="10" fill="'+color+'" opacity=".85" stroke="#000" stroke-width="1.5"/>'+
        '<text x="14" y="18" text-anchor="middle" font-size="9" font-weight="700" fill="#000">'+name.substring(0,2)+'</text>'+
      '</svg>',
      iconSize:[28,28],iconAnchor:[14,14]
    });
    var m=L.marker([0,0],{icon:icon,opacity:0});
    m.addTo(map);
    frontMarkers[name]=m;
  });

  map.invalidateSize();
  goTo(dates.length-1);
},400);

})();
