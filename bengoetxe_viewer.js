// ═══════════════════════════════════════════════════════════
// Bengoetxe 3D Viewer — Power BI embed via GitHub Pages
// Espera: window.RAW_DATA (string pipe-separated desde DAX)
// Espera: THREE.js ya cargado antes de este script
// ═══════════════════════════════════════════════════════════

(function(){
// ── Inyectar CSS ──────────────────────────────────────────
const _style=document.createElement('style');
_style.textContent=`
html,body{height:100%;width:100%}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#070c18;color:#ccc;font-family:system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden}

/* Power BI embed — no header */

#toolbar{display:flex;gap:0;flex-wrap:wrap;align-items:center;padding:8px 12px;background:#0d1525;border-bottom:1px solid #1e2d45;flex-shrink:0}
.tb-group{display:flex;gap:5px;align-items:center;padding:0 10px;border-left:1px solid #2a3f5f}
.tb-group:first-child{border-left:none;padding-left:0}
.tb-group-tag{font-size:8px;color:#3d5060;text-transform:uppercase;letter-spacing:.1em;flex-shrink:0;line-height:1;padding:3px 0}
#toolbar label{font-size:11px;color:#667a8e;display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 10px;border-radius:14px;border:1px solid #1e2d45;background:#0a1320;transition:all .18s ease;user-select:none;white-space:nowrap}
#toolbar label:hover{background:#131f33;border-color:#2a3f5f;color:#8899aa}
#toolbar label input[type=checkbox]{display:none}
#toolbar label .tgl-dot{width:8px;height:8px;border-radius:50%;background:#334455;border:1px solid #3a4f6a;transition:all .18s ease;flex-shrink:0}
#toolbar label.on{color:#c8daea;border-color:#2a4a6a;background:#111e30}
#toolbar label.on .tgl-dot{background:#55cc88;border-color:#55cc88;box-shadow:0 0 5px rgba(85,204,136,.45)}
#toolbar label.accent-violet{color:#7a5aa0}
#toolbar label.accent-violet.on{color:#c084fc;border-color:#4a2d70;background:#1a0e2d}
#toolbar label.accent-violet.on .tgl-dot{background:#c084fc;border-color:#c084fc;box-shadow:0 0 5px rgba(192,132,252,.45)}
#toolbar label.accent-cyan{color:#4a8aaa}
#toolbar label.accent-cyan.on{color:#7dd3fc;border-color:#285570;background:#0d1e2d}
#toolbar label.accent-cyan.on .tgl-dot{background:#7dd3fc;border-color:#7dd3fc;box-shadow:0 0 5px rgba(125,211,252,.45)}
#toolbar label.accent-amber{color:#8a6a30}
#toolbar label.accent-amber.on{color:#ffb347;border-color:#5a4020;background:#1a1508}
#toolbar label.accent-amber.on .tgl-dot{background:#ffb347;border-color:#ffb347;box-shadow:0 0 5px rgba(255,179,71,.45)}
#toolbar label.accent-teal{color:#2a8898}
#toolbar label.accent-teal.on{color:#00ddff;border-color:#1a5a68;background:#081a1e}
#toolbar label.accent-teal.on .tgl-dot{background:#00ddff;border-color:#00ddff;box-shadow:0 0 5px rgba(0,221,255,.45)}
#tip{margin-left:auto;font-size:12px;color:#7dd3fc;min-width:280px;text-align:right;white-space:nowrap}
#main{display:flex;flex:1;overflow:hidden}
#c3d{flex:1;position:relative;cursor:grab}
#c3d:active{cursor:grabbing}
#hoverTip3d{position:absolute;z-index:30;display:none;pointer-events:none;min-width:280px;max-width:400px;padding:7px 9px;border-radius:8px;background:rgba(4,8,18,.96);border:1px solid rgba(100,150,220,.45);box-shadow:0 10px 26px rgba(0,0,0,.42);color:#dbeafe;font-size:11px;line-height:1.35;backdrop-filter:blur(2px);white-space:nowrap}
#hoverTip3d .ht-title{font-size:13px;font-weight:700;margin-bottom:3px;text-align:left}
#hoverTip3d .ht-row{color:#c9d6ea}
#hoverTip3d .ht-muted{color:#8ea3bd}
#hoverTip3d .ht-axis{color:#ffb347;font-weight:600;margin-top:2px}
#hoverTip3d .ht-chart{margin-top:5px;border-top:1px solid rgba(100,150,220,.2);padding-top:4px}
#hoverTip3d .ht-chart-label{font-size:9px;color:#6889aa;margin-bottom:2px;display:flex;justify-content:space-between}
#hoverTip3d .ht-chart-label span{color:#8ea3bd}
#sidebar{width:116px;flex-shrink:0;background:#0d1525;border-left:1px solid #1e2d45;padding:10px 8px;display:flex;flex-direction:column;gap:8px}
.stitle{font-size:11px;font-weight:600;color:#8899aa;text-transform:uppercase;letter-spacing:.05em}
#legend-bar{position:relative;height:160px;width:20px}
.ramp{width:18px;height:160px;border-radius:3px;background:linear-gradient(to bottom,#ff1a00,#ff8800,#ffee00,#22cc55,#0055ff);border:1px solid #2a3f5f}
.lbl{position:absolute;left:24px;font-size:10px;white-space:nowrap}
.lbl.top{top:-1px;color:#ff4422;font-weight:600}
.lbl.mid{top:72px;color:#ddcc00}
.lbl.bot{bottom:-1px;color:#2266ff;font-weight:600}
#stats{font-size:10px;color:#8899aa;line-height:2;border-top:1px solid #1e2d45;padding-top:6px}
#ref-legend{display:flex;align-items:center;gap:6px;font-size:10px;color:#8899aa;border-top:1px solid #1e2d45;padding-top:8px;margin-top:2px}
.ref-swatch{width:16px;height:4px;background:rgba(220,230,255,0.55);border:1px solid rgba(180,200,255,0.6);border-radius:1px;flex-shrink:0}
#info-box{font-size:10px;color:#607080;line-height:1.6;border-top:1px solid #1e2d45;padding-top:6px;margin-top:2px}
#bottombar{display:flex;align-items:center;gap:10px;padding:6px 12px;background:#0d1525;border-top:1px solid #1e2d45;flex-shrink:0}
#bottombar button{padding:4px 12px;font-size:12px;border-radius:6px;border:1px solid #2a3f5f;background:#131f33;color:#ccc;cursor:pointer;flex-shrink:0}
#bottombar button:hover{background:#1a2d4a}
#slider{flex:1;accent-color:#378ADD;cursor:pointer}
#dlabel{font-size:12px;font-weight:600;min-width:96px;text-align:right;color:#ccc;flex-shrink:0}
`;
document.head.appendChild(_style);

// ── Crear estructura HTML ─────────────────────────────────
document.body.innerHTML=`
<div id="toolbar">
  <div class="tb-group">
    <span class="tb-group-tag">Desplaz.</span>
    <label class="accent-violet" data-for="chkVecTotal"><span class="tgl-dot"></span><input type="checkbox" id="chkVecTotal"> Mov. Total (XYZ)</label>
    <label class="accent-cyan on" data-for="chkNoZ"><span class="tgl-dot"></span><input type="checkbox" id="chkNoZ" checked> Mov. en Planta (XY)</label>
    <label class="accent-amber" data-for="chkAz208"><span class="tgl-dot"></span><input type="checkbox" id="chkAz208"> Mov. Ortogonal</label>
  </div>
  <div class="tb-group">
    <span class="tb-group-tag">Visual.</span>
    <label class="on" data-for="chkDeform"><span class="tgl-dot"></span><input type="checkbox" id="chkDeform" checked> Deformar malla</label>
    <label class="on" data-for="chkRef"><span class="tgl-dot"></span><input type="checkbox" id="chkRef" checked> Geometría inicial</label>
    <label class="on" data-for="chkArrows"><span class="tgl-dot"></span><input type="checkbox" id="chkArrows" checked> Flechas</label>
    <label class="on" data-for="chkWire"><span class="tgl-dot"></span><input type="checkbox" id="chkWire" checked> Wireframe</label>
  </div>
  <div class="tb-group">
    <label class="accent-teal" data-for="chkScope"><span class="tgl-dot"></span><input type="checkbox" id="chkScope"> Scope Box</label>
  </div>
  <span id="tip">Pasa el ratón sobre un prisma</span>
</div>

<div id="main">
  <div id="c3d"></div>
  <div id="sidebar">
    <div class="stitle">Escala</div>
    <div id="legend-bar">
      <div class="ramp"></div>
      <div class="lbl top" id="lmax">37 mm</div>
      <div class="lbl mid" id="lmid">18 mm</div>
      <div class="lbl bot" id="lmin">0 mm</div>
    </div>
    <div id="stats">
      <div id="smx">—</div>
      <div id="smd">—</div>
      <div id="smn">—</div>
    </div>
    <div id="ref-legend">
      <div class="ref-swatch"></div>
      <span>Posición inicial</span>
    </div>
    <div id="info-box">
      18 MPs · XYZ reales<br>
      Jul 25 – Jun 26<br><br>
      Todos dX,dY &lt; 0<br>
      → mov. <b style="color:#EF9F27">SW</b><br>
      Az. medio 226°<br><br>
      Máx: MP-437<br>
      37.3 mm (3D)
    </div>
  </div>
</div>

<div id="bottombar">
  <button id="playBtn">▶ Play</button>
  <input type="range" id="slider" min="0" max="196" value="0" step="1">
  <span id="dlabel">2025-07-29</span>
</div>
`;

// ── Registrar event listeners (inline handlers bloqueados por CSP) ──
document.getElementById('chkVecTotal').addEventListener('change',function(){syncDispMode(this);rebuild();});
document.getElementById('chkNoZ').addEventListener('change',function(){syncDispMode(this);rebuild();});
document.getElementById('chkAz208').addEventListener('change',function(){syncDispMode(this);rebuild();});
document.getElementById('chkDeform').addEventListener('change',function(){syncToggle(this);rebuild();});
document.getElementById('chkRef').addEventListener('change',function(){syncToggle(this);toggleRef();});
document.getElementById('chkArrows').addEventListener('change',function(){syncToggle(this);rebuild();});
document.getElementById('chkWire').addEventListener('change',function(){syncToggle(this);rebuild();});
document.getElementById('chkScope').addEventListener('change',function(){syncToggle(this);toggleScope();});
document.getElementById('playBtn').addEventListener('click',function(){togglePlay();});
document.getElementById('slider').addEventListener('input',function(){onSlider(+this.value);});

// ── Código del visor ──────────────────────────────────────
// ── Toggle pill sync ─────────────────────────────────────
const DISP_MODE_IDS=['chkVecTotal','chkNoZ','chkAz208'];
function syncToggle(cb){
  const lbl=cb.closest('label');
  if(lbl) lbl.classList.toggle('on',cb.checked);
}
function syncDispMode(cb){
  if(!cb.checked){cb.checked=true;return;}
  DISP_MODE_IDS.forEach(id=>{
    if(id!==cb.id){
      const other=document.getElementById(id);
      if(other&&other.checked){other.checked=false;syncToggle(other);}
    }
  });
  syncToggle(cb);
}
// ═══ DATOS — inyectados por DAX en Power BI ═══════════════
// RAW_DATA: definido por la medida DAX antes de cargar este script
// Líneas #: coordenadas base (posición 3D) → #MP|X|Y|Z
// Líneas normales: desplazamientos en mm → MP|FECHA|dX|dY|dZ

// Parser: transforma texto plano → DATES, MPs, DISP
const _p=(function(){
  const lines=RAW_DATA.trim().split('\n').filter(l=>l);
  // Separar cabecera (#) de datos
  const hdrLines=lines.filter(l=>l.startsWith('#'));
  const dataLines=lines.filter(l=>!l.startsWith('#'));
  // MPs desde cabecera: posiciones absolutas para la escena 3D
  const mps=hdrLines.map(l=>{const p=l.substring(1).split('|');return{n:p[0],X:+p[1],Y:+p[2],Z:+p[3]};});
  const mpNames=mps.map(m=>m.n);
  const mpIdx={};mpNames.forEach((n,i)=>{mpIdx[n]=i;});
  // Parsear datos de desplazamiento
  const rows=dataLines.map(l=>{const p=l.split('|');return{mp:p[0],f:p[1],dx:+p[2],dy:+p[3],dz:+p[4]};});
  // Fechas únicas ordenadas
  const dates=[...new Set(rows.map(r=>r.f))].sort();
  // Lookup rápido mp+fecha → desplazamientos
  const lk={};rows.forEach(r=>{lk[r.mp+'|'+r.f]=r;});
  // Construir DISP[fecha][mp]=[dX,dY,dZ,planta] — forward fill si falta dato
  const disp=[];
  for(let di=0;di<dates.length;di++){
    const row=[];
    for(let ni=0;ni<mpNames.length;ni++){
      const n=mpNames[ni],c=lk[n+'|'+dates[di]];
      if(!c){row.push(di>0?disp[di-1][ni]:[0,0,0,0]);continue;}
      row.push([c.dx,c.dy,c.dz,Math.round(Math.sqrt(c.dx*c.dx+c.dy*c.dy)*100)/100]);
    }
    disp.push(row);
  }
  // Centroide
  const cx=mps.reduce((s,m)=>s+m.X,0)/mps.length;
  const cy=mps.reduce((s,m)=>s+m.Y,0)/mps.length;
  const cz=mps.reduce((s,m)=>s+m.Z,0)/mps.length;
  return {dates,disp,mps,cx,cy,cz};
})();
const DATES=_p.dates, DISP=_p.disp, MPs=_p.mps;

const cx=_p.cx, cy=_p.cy, cz=_p.cz;
const DSCALE=0.06;
const NODE_R=0.275;
const GMAX={p:37,t:40,az:37};
const SUBDIV=8;
const AZ_PROJ_DEG=208.05;
const AZ_PROJ_RAD=AZ_PROJ_DEG*Math.PI/180;
// Azimut geotécnico: 0° = Norte, 90° = Este. Proyección en el plano XY.
const AZ_PROJ_DX=Math.sin(AZ_PROJ_RAD); // componente Este/Oeste
const AZ_PROJ_DY=Math.cos(AZ_PROJ_RAD); // componente Norte/Sur
function useAzProj(){return !!document.getElementById('chkAz208')?.checked;}
function useVecTotal(){return !!document.getElementById('chkVecTotal')?.checked;}
function getMode(){return useVecTotal()?'t':'p';}
function getAzProj(d){return d[0]*AZ_PROJ_DX+d[1]*AZ_PROJ_DY;}
function getAzProjectedDisp(d){
  const q=getAzProj(d);
  return [q*AZ_PROJ_DX,q*AZ_PROJ_DY,0,Math.abs(q)];
}

// ── Utilidades ────────────────────────────────────────────
function heatCol(t){
  t=Math.max(0,Math.min(1,t));
  const s=[[0,85,255],[0,210,70],[255,220,0],[255,120,0],[255,20,0]];
  const i=t*(s.length-1),lo=Math.floor(i),hi=Math.min(lo+1,s.length-1),f=i-lo;
  return new THREE.Color(
    (s[lo][0]+(s[hi][0]-s[lo][0])*f)/255,
    (s[lo][1]+(s[hi][1]-s[lo][1])*f)/255,
    (s[lo][2]+(s[hi][2]-s[lo][2])*f)/255
  );
}

function getVal(d,mode){
  if(useAzProj()) return Math.abs(getAzProj(d));
  const noZ=document.getElementById('chkNoZ').checked;
  if(mode==='t') return noZ?d[3]:Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
  return d[3];
}

// Posición base (sin deformación)
function basePos(mp){
  return new THREE.Vector3(mp.X-cx, mp.Z-cz, -(mp.Y-cy));
}

// Posición deformada
function defPos(mp,d){
  const b=basePos(mp);
  if(!document.getElementById('chkDeform').checked) return b;
  if(useAzProj()){
    const pd=getAzProjectedDisp(d);
    return new THREE.Vector3(b.x+pd[0]*DSCALE, b.y, b.z-pd[1]*DSCALE);
  }
  const noZ=document.getElementById('chkNoZ').checked;
  return new THREE.Vector3(b.x+d[0]*DSCALE, b.y+(noZ?0:d[2]*DSCALE), b.z-d[1]*DSCALE);
}

function interpInRow(row,t){
  if(row.length===1) return row[0];
  const sc=t*(row.length-1);
  const lo=Math.min(Math.floor(sc),row.length-2);
  const f=sc-lo;
  const a=row[lo],b=row[lo+1];
  return {
    pos:new THREE.Vector3(a.pos.x+(b.pos.x-a.pos.x)*f,a.pos.y+(b.pos.y-a.pos.y)*f,a.pos.z+(b.pos.z-a.pos.z)*f),
    col:new THREE.Color(a.col.r+(b.col.r-a.col.r)*f,a.col.g+(b.col.g-a.col.g)*f,a.col.b+(b.col.b-a.col.b)*f)
  };
}

// ── Constructor de malla densa (bilineal SUBDIV×SUBDIV) ───
// Acepta rows con {pos, col} por punto
function buildDenseMesh(rows){
  const verts=[],cols=[];
  function pushTri(a,b,c){
    [a,b,c].forEach(p=>{verts.push(p.pos.x,p.pos.y,p.pos.z);cols.push(p.col.r,p.col.g,p.col.b);});
  }
  // Paneles entre filas adyacentes
  for(let r=0;r<rows.length-1;r++){
    const R0=rows[r],R1=rows[r+1];
    const nC=Math.max(R0.length,R1.length)-1;
    for(let c=0;c<nC;c++){
      const t0=c/nC,t1=(c+1)/nC;
      const p00=interpInRow(R0,t0),p10=interpInRow(R0,t1);
      const p01=interpInRow(R1,t0),p11=interpInRow(R1,t1);
      for(let si=0;si<SUBDIV;si++){
        for(let sj=0;sj<SUBDIV;sj++){
          const u0=si/SUBDIV,u1=(si+1)/SUBDIV,v0=sj/SUBDIV,v1=(sj+1)/SUBDIV;
          function bl(u,v){
            return {
              pos:new THREE.Vector3(
                (1-u)*(1-v)*p00.pos.x+u*(1-v)*p10.pos.x+(1-u)*v*p01.pos.x+u*v*p11.pos.x,
                (1-u)*(1-v)*p00.pos.y+u*(1-v)*p10.pos.y+(1-u)*v*p01.pos.y+u*v*p11.pos.y,
                (1-u)*(1-v)*p00.pos.z+u*(1-v)*p10.pos.z+(1-u)*v*p01.pos.z+u*v*p11.pos.z
              ),
              col:new THREE.Color(
                (1-u)*(1-v)*p00.col.r+u*(1-v)*p10.col.r+(1-u)*v*p01.col.r+u*v*p11.col.r,
                (1-u)*(1-v)*p00.col.g+u*(1-v)*p10.col.g+(1-u)*v*p01.col.g+u*v*p11.col.g,
                (1-u)*(1-v)*p00.col.b+u*(1-v)*p10.col.b+(1-u)*v*p01.col.b+u*v*p11.col.b
              )
            };
          }
          const a=bl(u0,v0),b=bl(u1,v0),c2=bl(u0,v1),dd=bl(u1,v1);
          pushTri(a,b,c2); pushTri(b,dd,c2);
        }
      }
    }
  }
  return {verts,cols};
}

// ── Construir geometría de referencia (posición inicial) ──
// Igual que buildDenseMesh pero con color blanco fijo
function buildRefMesh(){
  const pts=MPs.map(mp=>{
    const pos=basePos(mp);
    const col=new THREE.Color(1,1,1); // blanco
    return {pos,col};
  });

  const zGroups={};
  pts.forEach((p,i)=>{
    const zk=Math.round(MPs[i].Z);
    if(!zGroups[zk]) zGroups[zk]=[];
    zGroups[zk].push(p);
  });
  // Sort properly by X within each zk group
  const rowsSorted=Object.keys(zGroups).map(Number).sort((a,b)=>b-a).map(zk=>{
    return zGroups[zk].sort((a,b)=>{
      const ia=pts.findIndex(p=>p===a), ib=pts.findIndex(p=>p===b);
      return MPs[ia].X - MPs[ib].X;
    });
  });

  // Build plain vertex arrays (no color variation — all white)
  const verts=[];
  function pushTri(a,b,c){
    [a,b,c].forEach(p=>verts.push(p.pos.x,p.pos.y,p.pos.z));
  }
  for(let r=0;r<rowsSorted.length-1;r++){
    const R0=rowsSorted[r],R1=rowsSorted[r+1];
    const nC=Math.max(R0.length,R1.length)-1;
    for(let c=0;c<nC;c++){
      const t0=c/nC,t1=(c+1)/nC;
      const p00=interpInRow(R0,t0),p10=interpInRow(R0,t1);
      const p01=interpInRow(R1,t0),p11=interpInRow(R1,t1);
      for(let si=0;si<SUBDIV;si++){
        for(let sj=0;sj<SUBDIV;sj++){
          const u0=si/SUBDIV,u1=(si+1)/SUBDIV,v0=sj/SUBDIV,v1=(sj+1)/SUBDIV;
          function bl(u,v){
            return {pos:new THREE.Vector3(
              (1-u)*(1-v)*p00.pos.x+u*(1-v)*p10.pos.x+(1-u)*v*p01.pos.x+u*v*p11.pos.x,
              (1-u)*(1-v)*p00.pos.y+u*(1-v)*p10.pos.y+(1-u)*v*p01.pos.y+u*v*p11.pos.y,
              (1-u)*(1-v)*p00.pos.z+u*(1-v)*p10.pos.z+(1-u)*v*p01.pos.z+u*v*p11.pos.z
            )};
          }
          const a=bl(u0,v0),b=bl(u1,v0),c2=bl(u0,v1),dd=bl(u1,v1);
          pushTri(a,b,c2); pushTri(b,dd,c2);
        }
      }
    }
  }
  return verts;
}

// ── Hover sprite ──────────────────────────────────────────
function makeHoverSprite(){
  let el=document.getElementById('hoverTip3d');
  if(!el){
    el=document.createElement('div');
    el.id='hoverTip3d';
    document.getElementById('c3d').appendChild(el);
  }
  return {el};
}
function hideHoverTip(){
  if(hoverData&&hoverData.el)hoverData.el.style.display='none';
}

// ── Sparkline para tooltip ──────────────────────────────
function getChartValForMP(mpIdx,dateIdx){
  const d=DISP[dateIdx][mpIdx];
  if(!d||d.length<4) return 0;
  if(useAzProj()) return Math.abs(getAzProj(d));
  if(document.getElementById('chkNoZ').checked) return d[3];
  if(useVecTotal()) return Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
  return d[3];
}

function getChartModeName(){
  if(useAzProj()) return 'Mov. Ortogonal ('+AZ_PROJ_DEG.toFixed(2).replace('.',',')+'°)';
  if(document.getElementById('chkNoZ').checked) return 'Mov. en Planta (XY)';
  if(useVecTotal()) return 'Mov. Total (XYZ)';
  return 'Planta';
}

function buildSparklineSVG(mpIdx,currentIdx){
  const W=300, H=50, PAD_L=0, PAD_R=0, PAD_T=4, PAD_B=4;
  const pW=W-PAD_L-PAD_R, pH=H-PAD_T-PAD_B;
  const n=DATES.length;

  // Recopilar valores
  const vals=[];
  let vMax=0;
  for(let i=0;i<n;i++){
    const v=getChartValForMP(mpIdx,i);
    vals.push(v);
    if(v>vMax) vMax=v;
  }
  if(vMax<0.5) vMax=1; // evitar dividir por cero

  // Construir puntos del polyline
  const pts=[];
  for(let i=0;i<n;i++){
    const x=PAD_L+(i/(n-1))*pW;
    const y=PAD_T+pH-(vals[i]/vMax)*pH;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const polyline=pts.join(' ');

  // Area fill: cerrar por abajo
  const areaPath=`M${PAD_L},${PAD_T+pH} `+pts.map((p,i)=>(i===0?'L':'')+p).join(' ')+` L${PAD_L+pW},${PAD_T+pH} Z`;

  // Cursor vertical (fecha actual)
  const cx_pos=PAD_L+(currentIdx/(n-1))*pW;
  const cy_pos=PAD_T+pH-(vals[currentIdx]/vMax)*pH;
  const curVal=vals[currentIdx];

  // Color del punto actual basado en heatCol
  const gmax=useAzProj()?GMAX.az:GMAX[getMode()];
  const dotCol=heatCol(Math.min(curVal/gmax,1));
  const dotRgb=`rgb(${Math.round(dotCol.r*255)},${Math.round(dotCol.g*255)},${Math.round(dotCol.b*255)})`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">
    <defs>
      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#378ADD" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#378ADD" stop-opacity="0.03"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#sparkFill)" stroke="none"/>
    <polyline points="${polyline}" fill="none" stroke="#378ADD" stroke-width="1.2" stroke-linejoin="round"/>
    <line x1="${cx_pos.toFixed(1)}" y1="${PAD_T}" x2="${cx_pos.toFixed(1)}" y2="${PAD_T+pH}" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="2,2"/>
    <circle cx="${cx_pos.toFixed(1)}" cy="${cy_pos.toFixed(1)}" r="3.5" fill="${dotRgb}" stroke="rgba(255,255,255,0.7)" stroke-width="0.8"/>
    <text x="${W-2}" y="${PAD_T+6}" text-anchor="end" fill="#556677" font-size="8" font-family="system-ui">${vMax.toFixed(1)} mm</text>
    <text x="${W-2}" y="${PAD_T+pH}" text-anchor="end" fill="#445566" font-size="8" font-family="system-ui">0</text>
  </svg>`;
}

function updateHoverSprite(hd,mp,d,mode,e,cv){
  const val=getVal(d,mode);
  const gmax=useAzProj()?GMAX.az:GMAX[mode];
  const col=heatCol(Math.min(val/gmax,1));
  const rgb=`rgb(${Math.round(col.r*255)},${Math.round(col.g*255)},${Math.round(col.b*255)})`;
  const azMode=useAzProj();
  const noZMode=document.getElementById('chkNoZ').checked;
  const vecMode=useVecTotal();
  let modeLine='';
  if(azMode){
    const q=getAzProj(d);
    modeLine=`<div class="ht-axis" style="color:#ffb347">Mov. Ortogonal: ${q>=0?'+':''}${q.toFixed(1)} mm</div>`;
  }else if(vecMode){
    const total=Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
    modeLine=`<div class="ht-axis" style="color:#c084fc">Mov. Total (XYZ): ${total.toFixed(1)} mm</div>`;
  }else if(noZMode){
    modeLine=`<div class="ht-axis" style="color:#7dd3fc">Mov. en Planta (XY): ${d[3].toFixed(1)} mm</div>`;
  }

  // Sparkline
  const mpIdx=MPs.indexOf(mp);
  const chartLabel=getChartModeName();
  const sparkSVG=mpIdx>=0?buildSparklineSVG(mpIdx,curIdx):'';
  const chartSection=mpIdx>=0?`
    <div class="ht-chart">
      <div class="ht-chart-label">${chartLabel} <span>${DATES[curIdx]}</span></div>
      ${sparkSVG}
    </div>`:'';

  hd.el.innerHTML=`
    <div class="ht-title" style="color:${rgb}">${mp.n}</div>
    <div class="ht-row">dX ${d[0]>=0?'+':''}${d[0].toFixed(1)} · dY ${d[1]>=0?'+':''}${d[1].toFixed(1)} · dZ ${d[2]>=0?'+':''}${d[2].toFixed(1)} mm</div>
    ${modeLine}
    ${chartSection}`;
  hd.el.style.display='block';

  const rect=cv.getBoundingClientRect();
  const box=hd.el.getBoundingClientRect();
  let x=e.clientX-rect.left+14;
  let y=e.clientY-rect.top+14;
  if(x+box.width>rect.width-8)x=e.clientX-rect.left-box.width-14;
  if(y+box.height>rect.height-8)y=e.clientY-rect.top-box.height-14;
  x=Math.max(8,Math.min(x,rect.width-box.width-8));
  y=Math.max(8,Math.min(y,rect.height-box.height-8));
  hd.el.style.left=x+'px';
  hd.el.style.top=y+'px';
}

// ── Three.js ──────────────────────────────────────────────
let renderer,scene,camera,grp,refGroup,nodeRefs=[],hoverData=null;
let drag=false,prevM={x:0,y:0};
let sTheta=0.45,sPhi=0.88,sR=100,tTheta=0.45,tPhi=0.88;
let curIdx=0,playing=false,playTimer=null;

function buildRefGroup(){
  if(refGroup) scene.remove(refGroup);
  refGroup=new THREE.Group();

  const verts=buildRefMesh();
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  geo.computeVertexNormals();

  // Cara sólida semitransparente blanca
  const matSolid=new THREE.MeshLambertMaterial({
    color:0xd8e8ff,
    transparent:true,
    opacity:0.10,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  refGroup.add(new THREE.Mesh(geo,matSolid));

  // Wireframe blanco con líneas bien visibles
  const wgeo=new THREE.WireframeGeometry(geo);
  const matWire=new THREE.LineBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:0.30
  });
  refGroup.add(new THREE.LineSegments(wgeo,matWire));

  scene.add(refGroup);
}

function buildScene(idx){
  if(grp) scene.remove(grp);
  grp=new THREE.Group();nodeRefs=[];

  const snapDisp=DISP[idx];
  const mode=getMode();
  const azMode=useAzProj();
  const gmax=azMode?GMAX.az:GMAX[mode];
  const showArrows=document.getElementById('chkArrows').checked;
  const showWire=document.getElementById('chkWire').checked;
  const noZ=document.getElementById('chkNoZ').checked;

  const pts=MPs.map((mp,i)=>{
    const d=snapDisp[i];
    const pos=defPos(mp,d);
    const val=getVal(d,mode);
    const t=Math.min(val/gmax,1);
    return {mp,d,pos,val,t,col:heatCol(t)};
  });

  // Agrupar por cota Z
  const zGroups={};
  pts.forEach((p,i)=>{
    const zk=Math.round(MPs[i].Z);
    if(!zGroups[zk]) zGroups[zk]=[];
    zGroups[zk].push(p);
  });
  const rows=Object.keys(zGroups).map(Number).sort((a,b)=>b-a)
    .map(zk=>zGroups[zk].sort((a,b)=>a.mp.X-b.mp.X));

  const {verts,cols}=buildDenseMesh(rows);
  if(verts.length){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    geo.computeVertexNormals();
    grp.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})));
    if(showWire){
      const wgeo=new THREE.WireframeGeometry(geo);
      grp.add(new THREE.LineSegments(wgeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.07})));
    }
  }

  // Nodos radio fijo
  const sGeo=new THREE.SphereGeometry(NODE_R,16,10);
  pts.forEach(p=>{
    const mesh=new THREE.Mesh(sGeo,new THREE.MeshLambertMaterial({color:p.col,emissive:p.col,emissiveIntensity:0.45}));
    mesh.position.copy(p.pos);
    mesh.userData={mp:p.mp,d:p.d};
    grp.add(mesh);nodeRefs.push(mesh);

    if(showArrows){
      let arrowVec=null;
      if(azMode){
        const q=getAzProj(p.d);
        if(Math.abs(q)>0.001) arrowVec=new THREE.Vector3(q*AZ_PROJ_DX,0,-q*AZ_PROJ_DY);
      }else if(p.d[0]||p.d[1]||(noZ?false:p.d[2])){
        const dz=noZ?0:p.d[2];
        arrowVec=new THREE.Vector3(p.d[0],dz,-p.d[1]);
      }
      if(arrowVec&&arrowVec.lengthSq()>0){
        const dir=arrowVec.normalize();
        const len=1.8+p.t*4;
        const arr=new THREE.ArrowHelper(dir,p.pos.clone(),len,p.col.getHex(),len*0.32,len*0.22);
        arr.line.material.transparent=true;arr.line.material.opacity=0.8;
        grp.add(arr);
      }
    }
  });

  if(!hoverData)hoverData=makeHoverSprite();
  hideHoverTip();

  const grid=new THREE.GridHelper(100,18,0x0e1e2e,0x0e1e2e);
  grid.position.y=-9;grp.add(grid);
  scene.add(grp);

  // Stats
  const vals=pts.map(p=>p.val);
  const mx=Math.max(...vals).toFixed(1),mn=Math.min(...vals).toFixed(1);
  const md=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  const unit=azMode?('mm ort.@'+AZ_PROJ_DEG.toFixed(2)+'°'):'mm';
  document.getElementById('lmax').textContent='▲ '+gmax+' mm';
  document.getElementById('lmid').textContent='  '+(gmax/2).toFixed(0)+' mm';
  document.getElementById('lmin').textContent='▼ 0 mm';
  document.getElementById('smx').textContent='🔴 máx: '+mx+' mm';
  document.getElementById('smd').textContent='🟡 med: '+md+' mm';
  document.getElementById('smn').textContent=azMode?'🧭 mov.ort: '+AZ_PROJ_DEG.toFixed(2)+'°':'🔵 mín: '+mn+' mm';
  document.getElementById('dlabel').textContent=DATES[idx];
  document.getElementById('slider').value=idx;
}

function toggleRef(){
  if(refGroup) refGroup.visible=document.getElementById('chkRef').checked;
}

function initThree(){
  const el=document.getElementById('c3d');
  // Fallback: si flex no dio dimensiones, forzar tamaño
  if(!el.clientWidth||!el.clientHeight){
    el.style.width='100%';el.style.height='100%';
    el.style.position='absolute';el.style.top='0';el.style.left='0';
  }
  const w=el.clientWidth||800, h=el.clientHeight||600;
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(w,h);
  renderer.setClearColor(0x070c18,1);
  el.appendChild(renderer.domElement);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(42,w/h,0.1,1000);
  scene.add(new THREE.AmbientLight(0xffffff,0.88));
  const dl=new THREE.DirectionalLight(0xffffff,0.6);dl.position.set(40,80,50);scene.add(dl);
  const dl2=new THREE.DirectionalLight(0x6688aa,0.3);dl2.position.set(-30,20,-40);scene.add(dl2);
  // Resize handler
  window.addEventListener('resize',()=>{
    const rw=el.clientWidth||800,rh=el.clientHeight||600;
    renderer.setSize(rw,rh);
    camera.aspect=rw/rh;camera.updateProjectionMatrix();
  });

  const cv=renderer.domElement;
  let handleDragInfo=null;
  cv.addEventListener('mousedown',e=>{
    try{
      if(scopeActive&&handleMeshes.length){
        const hi=testHandleHit(e,cv);
        if(hi!==null){handleDragInfo=beginHandleDrag(hi,e,cv);if(handleDragInfo)return;}
      }
    }catch(ex){}
    drag=true;prevM={x:e.clientX,y:e.clientY};
  });
  cv.addEventListener('mouseup',()=>{if(handleDragInfo){handleDragInfo=null;return;}drag=false;});
  cv.addEventListener('mouseleave',()=>{
    drag=false;handleDragInfo=null;
    hideHoverTip();
    document.getElementById('tip').textContent='Pasa el ratón sobre un prisma';
  });
  cv.addEventListener('mousemove',e=>{
    if(handleDragInfo){doHandleDrag(handleDragInfo,e,cv);return;}
    if(drag){
      tTheta-=(e.clientX-prevM.x)*0.008;
      tPhi=Math.max(0.08,Math.min(Math.PI-0.08,tPhi-(e.clientY-prevM.y)*0.008));
      prevM={x:e.clientX,y:e.clientY};
      hideHoverTip();
      return;
    }
    // Handle hover cursor
    try{
      if(scopeActive&&handleMeshes.length){
        const hi=testHandleHit(e,cv);
        cv.style.cursor=hi!==null?'pointer':'grab';
      } else { cv.style.cursor='grab'; }
    }catch(ex){ cv.style.cursor='grab'; }
    const rect=cv.getBoundingClientRect();
    const ray=new THREE.Raycaster();
    ray.setFromCamera({
      x:((e.clientX-rect.left)/rect.width)*2-1,
      y:-((e.clientY-rect.top)/rect.height)*2+1
    },camera);
    const hits=ray.intersectObjects(nodeRefs);
    if(hits.length){
      const {mp,d}=hits[0].object.userData;
      const mode=getMode();
      const val=getVal(d,mode);
      const noZ2=document.getElementById('chkNoZ').checked;
      const azMode2=useAzProj();
      const zPart=(noZ2||azMode2)?'  ̶d̶Z̶':(`  dZ ${d[2]>=0?'+':''}${d[2].toFixed(1)}`);
      const azPart=azMode2?(`  mov.ort.${AZ_PROJ_DEG.toFixed(2)}° ${getAzProj(d)>=0?'+':''}${getAzProj(d).toFixed(1)} mm`):'';
      document.getElementById('tip').textContent=
        `${mp.n}  ·  dX ${d[0]>=0?'+':''}${d[0].toFixed(1)}  dY ${d[1]>=0?'+':''}${d[1].toFixed(1)}${zPart}${azPart}  |planta| ${d[3].toFixed(1)} mm`;
      if(hoverData){
        updateHoverSprite(hoverData,mp,d,mode,e,cv);
      }
    } else {
      hideHoverTip();
      document.getElementById('tip').textContent='Pasa el ratón sobre un prisma';
    }
  });
  cv.addEventListener('wheel',e=>{
    e.preventDefault();sR=Math.max(8,Math.min(280,sR+e.deltaY*0.055));
  },{passive:false});
  let pinchDist0=null;
  cv.addEventListener('touchstart',e=>{
    if(e.touches.length===1){drag=true;prevM={x:e.touches[0].clientX,y:e.touches[0].clientY};}
    if(e.touches.length===2)pinchDist0=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  });
  cv.addEventListener('touchend',()=>{drag=false;pinchDist0=null;});
  cv.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(drag&&e.touches.length===1){
      tTheta-=(e.touches[0].clientX-prevM.x)*0.008;
      tPhi=Math.max(0.08,Math.min(Math.PI-0.08,tPhi-(e.touches[0].clientY-prevM.y)*0.008));
      prevM={x:e.touches[0].clientX,y:e.touches[0].clientY};
    }
    if(e.touches.length===2&&pinchDist0){
      const dd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      sR=Math.max(8,Math.min(280,sR*(pinchDist0/dd)));pinchDist0=dd;
    }
  },{passive:false});
  window.addEventListener('resize',()=>{
    const w=el.clientWidth,h=el.clientHeight;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
  });
  (function animate(){
    requestAnimationFrame(animate);
    sTheta+=(tTheta-sTheta)*0.09;sPhi+=(tPhi-sPhi)*0.09;
    camera.position.set(sR*Math.sin(sPhi)*Math.sin(sTheta),sR*Math.cos(sPhi),sR*Math.sin(sPhi)*Math.cos(sTheta));
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    // Second pass: handles without clipping
    try{
      if(scopeActive&&handleScene){
        renderer.clippingPlanes=[];
        renderer.autoClear=false;
        renderer.render(handleScene,camera);
        renderer.autoClear=true;
        renderer.clippingPlanes=scopePlanes;
      }
    }catch(e){}
  })();
}

function rebuild(idx){if(idx===undefined)idx=curIdx;curIdx=idx;buildScene(idx);}
function onSlider(v){rebuild(+v);}
function togglePlay(){
  playing=!playing;
  document.getElementById('playBtn').textContent=playing?'⏸ Pausa':'▶ Play';
  if(playing)playTimer=setInterval(()=>rebuild((curIdx+1)%DATES.length),80);
  else clearInterval(playTimer);
}

// ── Scope Box with draggable face handles ────────────────
const W_DX=0.8826, W_DZ=0.4702;
const P_DX=-0.4702, P_DZ=0.8826;
const FACE_AXES=[
  {nx:W_DX,ny:0,nz:W_DZ,sign:-1},   // 0 wall min ←
  {nx:W_DX,ny:0,nz:W_DZ,sign:1},    // 1 wall max →
  {nx:P_DX,ny:0,nz:P_DZ,sign:-1},   // 2 perp min
  {nx:P_DX,ny:0,nz:P_DZ,sign:1},    // 3 perp max
  {nx:0,ny:1,nz:0,sign:-1},          // 4 cota min ↓
  {nx:0,ny:1,nz:0,sign:1},           // 5 cota max ↑
];
const scopePlanes=[
  new THREE.Plane(new THREE.Vector3(W_DX,0,W_DZ),30),
  new THREE.Plane(new THREE.Vector3(-W_DX,0,-W_DZ),30),
  new THREE.Plane(new THREE.Vector3(P_DX,0,P_DZ),10),
  new THREE.Plane(new THREE.Vector3(-P_DX,0,-P_DZ),10),
  new THREE.Plane(new THREE.Vector3(0,1,0),10),
  new THREE.Plane(new THREE.Vector3(0,-1,0),8),
];
const scopeState={wn:-30,wp:30,pn:-10,pp:10,yn:-10,yp:8};
let scopeBox=null, scopeActive=false;
let handleScene=null, handleMeshes=[];

function toWorld(w,p,y){return new THREE.Vector3(w*W_DX+p*P_DX,y,w*W_DZ+p*P_DZ);}

function toggleScope(){
  scopeActive=document.getElementById('chkScope').checked;
  renderer.clippingPlanes=scopeActive?scopePlanes:[];
  updateScopeVisuals();
}

function applyScopeState(){
  scopePlanes[0].constant=-scopeState.wn;
  scopePlanes[1].constant=scopeState.wp;
  scopePlanes[2].constant=-scopeState.pn;
  scopePlanes[3].constant=scopeState.pp;
  scopePlanes[4].constant=-scopeState.yn;
  scopePlanes[5].constant=scopeState.yp;
}

function updateScopeVisuals(){
  // Remove old
  if(scopeBox){scene.remove(scopeBox);scopeBox=null;}
  if(handleScene){handleScene=null;handleMeshes=[];}
  if(!scopeActive) return;
  applyScopeState();
  const {wn,wp,pn,pp,yn,yp}=scopeState;

  // Wireframe box
  const c=[
    toWorld(wn,pn,yn),toWorld(wp,pn,yn),toWorld(wp,pp,yn),toWorld(wn,pp,yn),
    toWorld(wn,pn,yp),toWorld(wp,pn,yp),toWorld(wp,pp,yp),toWorld(wn,pp,yp)
  ];
  const idx=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const pts=[];idx.forEach(([a,b])=>{pts.push(c[a],c[b]);});
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  scopeBox=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x00ddff,transparent:true,opacity:0.45}));
  scene.add(scopeBox);

  // Handle scene (rendered without clipping)
  handleScene=new THREE.Scene();
  handleScene.add(new THREE.AmbientLight(0xffffff,0.8));
  const hl=new THREE.DirectionalLight(0xffffff,0.4);hl.position.set(20,40,30);handleScene.add(hl);
  handleMeshes=[];

  // Face centers and outward normals
  const wm=(wn+wp)/2, pm=(pn+pp)/2, ym=(yn+yp)/2;
  const faceCenters=[
    toWorld(wn,pm,ym), toWorld(wp,pm,ym),
    toWorld(wm,pn,ym), toWorld(wm,pp,ym),
    toWorld(wm,pm,yn), toWorld(wm,pm,yp)
  ];
  const faceNormals=[
    new THREE.Vector3(-W_DX,0,-W_DZ), new THREE.Vector3(W_DX,0,W_DZ),
    new THREE.Vector3(-P_DX,0,-P_DZ), new THREE.Vector3(P_DX,0,P_DZ),
    new THREE.Vector3(0,-1,0),         new THREE.Vector3(0,1,0)
  ];
  const colors=[0xff4444,0xff4444,0x44ff44,0x44ff44,0x4488ff,0x4488ff];

  const handleHeight=2.0;
  const handleOutset=handleHeight/2+0.06; // base just outside the face, tip pointing outward

  for(let i=0;i<6;i++){
    const coneGeo=new THREE.ConeGeometry(0.7,handleHeight,12);
    const mat=new THREE.MeshLambertMaterial({color:colors[i],emissive:colors[i],emissiveIntensity:0.3,transparent:true,opacity:0.85});
    const mesh=new THREE.Mesh(coneGeo,mat);
    // Orient cone to point outward
    const dir=faceNormals[i].clone().normalize();
    // ConeGeometry is centered on its local Y axis: base at -height/2 and tip at +height/2.
    // Moving the center outward by height/2 places the base on the Scope Box face
    // instead of leaving half of the arrow inside the box.
    mesh.position.copy(faceCenters[i].clone().add(dir.clone().multiplyScalar(handleOutset)));
    const q=new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
    mesh.quaternion.copy(q);
    mesh.userData={faceIdx:i,axis:FACE_AXES[i]};
    handleScene.add(mesh);
    handleMeshes.push(mesh);
  }
}

// ── Handle raycasting and dragging ───────────────────────
function testHandleHit(e,cv){
  if(!handleMeshes.length) return null;
  const rect=cv.getBoundingClientRect();
  const ray=new THREE.Raycaster();
  ray.setFromCamera({
    x:((e.clientX-rect.left)/rect.width)*2-1,
    y:-((e.clientY-rect.top)/rect.height)*2+1
  },camera);
  const hits=ray.intersectObjects(handleMeshes);
  return hits.length?hits[0].object.userData.faceIdx:null;
}

function beginHandleDrag(faceIdx,e,cv){
  const fa=FACE_AXES[faceIdx];
  const axisDir=new THREE.Vector3(fa.nx,fa.ny,fa.nz).multiplyScalar(fa.sign).normalize();
  // Plano de arrastre: contiene el eje de la flecha y mira a la cámara.
  // Antes se usaba axis × cámara, lo que dejaba el plano casi de canto;
  // en las flechas rojas hacía que el movimiento vertical del ratón dominara.
  const camDir=camera.getWorldDirection(new THREE.Vector3()).normalize();
  let planeN=camDir.clone().sub(axisDir.clone().multiplyScalar(camDir.dot(axisDir)));
  if(planeN.lengthSq()<0.001){
    planeN=new THREE.Vector3().crossVectors(axisDir,camera.up);
  }
  planeN.normalize();
  const center=handleMeshes[faceIdx].position.clone();
  const dragPlane=new THREE.Plane().setFromNormalAndCoplanarPoint(planeN,center);
  // Initial intersection
  const rect=cv.getBoundingClientRect();
  const ray=new THREE.Raycaster();
  ray.setFromCamera({
    x:((e.clientX-rect.left)/rect.width)*2-1,
    y:-((e.clientY-rect.top)/rect.height)*2+1
  },camera);
  const hit=new THREE.Vector3();
  if(!ray.ray.intersectPlane(dragPlane,hit)) return null;
  const startDot=hit.dot(axisDir);
  // Current scope value for this face
  const keys=['wn','wp','pn','pp','yn','yp'];
  const startVal=scopeState[keys[faceIdx]];
  return {faceIdx,dragPlane,axisDir,startDot,startVal,key:keys[faceIdx],coordSign:fa.sign};
}

function doHandleDrag(info,e,cv){
  const rect=cv.getBoundingClientRect();
  const ray=new THREE.Raycaster();
  ray.setFromCamera({
    x:((e.clientX-rect.left)/rect.width)*2-1,
    y:-((e.clientY-rect.top)/rect.height)*2+1
  },camera);
  const hit=new THREE.Vector3();
  if(!ray.ray.intersectPlane(info.dragPlane,hit)) return;
  const curDot=hit.dot(info.axisDir);
  const delta=curDot-info.startDot;
  scopeState[info.key]=info.startVal+delta*info.coordSign;
  updateScopeVisuals();
}

function resetScope(){
  scopeState.wn=-30;scopeState.wp=30;
  scopeState.pn=-10;scopeState.pp=10;
  scopeState.yn=-10;scopeState.yp=8;
  updateScopeVisuals();
}

// Double-click to reset scope
document.getElementById('c3d').addEventListener('dblclick',()=>{
  if(scopeActive) resetScope();
});

// ── Esperar al layout del DOM antes de inicializar Three.js ──
setTimeout(function(){
  document.getElementById('slider').max=DATES.length-1;
  initThree();
  buildRefGroup();
  rebuild(0);
}, 300); // fin setTimeout
})();
