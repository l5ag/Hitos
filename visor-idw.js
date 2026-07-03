/* ═══════════════════════════════════════════════════════════════════════════
   visor-idw.js · Motor IDW para Power BI (HTML Content, versión con scripts)
   ───────────────────────────────────────────────────────────────────────────
   Uso desde una medida DAX (ver "PowerBI IDW DAX.html"):

     <div id="idw-root" style="position:absolute;inset:0;"></div>
     <script>window.IDW_DATA = {
       fecha: "09/06/2026",
       hitos: [["H1.01", 43.2309635, -2.8365123, -3.2], ...]  // [id, lat, lon, dZ mm]
     };</script>
     <script src="https://TU_USUARIO.github.io/TU_REPO/powerbi/visor-idw.js"></script>

   Los datos viajan dentro del visual (nunca salen de Power BI / SharePoint).
   Este archivo solo contiene código.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Escala de colores (anclas cada 2 mm, bandas cada 1 mm) ────────────────
  var NEG_ANCHORS = [
    [-2, [250, 210, 120]], [-4, [232, 190, 70]], [-6, [196, 58, 28]],
    [-8, [141, 27, 27]], [-10, [93, 18, 22]], [-14, [43, 10, 14]]
  ];
  var POS_ANCHORS = [
    [2, [148, 196, 223]], [4, [104, 170, 207]], [6, [64, 141, 191]],
    [8, [39, 108, 170]], [10, [26, 77, 138]], [14, [16, 42, 99]]
  ];
  function rampColor(anchors, v) {
    var a = anchors;
    if ((v - a[0][0]) * (a[a.length - 1][0] - a[0][0]) <= 0) return a[0][1].join(',');
    for (var i = 0; i < a.length - 1; i++) {
      var v0 = a[i][0], c0 = a[i][1], v1 = a[i + 1][0], c1 = a[i + 1][1];
      var t = (v - v0) / (v1 - v0);
      if (t >= 0 && t <= 1) {
        return c0.map(function (c, k) { return Math.round(c + (c1[k] - c) * t); }).join(',');
      }
    }
    return a[a.length - 1][1].join(',');
  }
  var NEG_LEVELS = [], POS_LEVELS = [], v;
  for (v = -2; v >= -13; v--) NEG_LEVELS.push({ level: v, color: rampColor(NEG_ANCHORS, v - 0.5), deep: v <= -10 });
  NEG_LEVELS.push({ level: -14, color: '43,10,14', deep: true });
  for (v = 2; v <= 13; v++) POS_LEVELS.push({ level: v, color: rampColor(POS_ANCHORS, v + 0.5) });
  POS_LEVELS.push({ level: 14, color: '16,42,99' });

  // ── Carga dinámica de Leaflet ──────────────────────────────────────────────
  function loadLeaflet(cb) {
    if (window.L) return cb();
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  // ── IDW normalizado (todos los puntos) sobre malla local en metros ────────
  var CELL = 4, PAD = 120;
  function computeGrid(pts, bbox, W, H, power) {
    var N = pts.length, halfP = power / 2;
    var grid = new Float64Array(W * H);
    var xSpan = bbox.e - bbox.w, ySpan = bbox.n - bbox.s;
    for (var row = 0; row < H; row++) {
      var ym = bbox.n - ySpan * row / (H - 1), base = row * W;
      for (var col = 0; col < W; col++) {
        var xm = bbox.w + xSpan * col / (W - 1);
        var sw = 0, swz = 0, exact = null;
        for (var j = 0; j < N; j++) {
          var dx = xm - pts[j].x, dy = ym - pts[j].y, d2 = dx * dx + dy * dy;
          if (d2 < 0.25) { exact = pts[j].dz; break; }
          var w = halfP === 1 ? 1 / d2 : 1 / Math.pow(d2, halfP);
          sw += w; swz += w * pts[j].dz;
        }
        grid[base + col] = exact !== null ? exact : (sw > 0 ? swz / sw : 0);
      }
    }
    return grid;
  }

  // ── Marching squares + costura de anillos ─────────────────────────────────
  function marchingSegs(grid, W, H, level) {
    var segs = [];
    function lerp(a, b) { return Math.abs(b - a) < 1e-12 ? 0.5 : (level - a) / (b - a); }
    for (var r = 0; r < H - 1; r++) {
      for (var c = 0; c < W - 1; c++) {
        var tl = grid[r * W + c], tr = grid[r * W + c + 1], br = grid[(r + 1) * W + c + 1], bl = grid[(r + 1) * W + c];
        var idx = (tl >= level ? 8 : 0) | (tr >= level ? 4 : 0) | (br >= level ? 2 : 0) | (bl >= level ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        var top = [c + lerp(tl, tr), r], right = [c + 1, r + lerp(tr, br)],
            bottom = [c + lerp(bl, br), r + 1], left = [c, r + lerp(tl, bl)];
        var T = [null, [left, bottom], [bottom, right], [left, right], [top, right], null, [top, bottom], [top, left],
                 [top, left], [top, bottom], null, [top, right], [left, right], [bottom, right], [left, bottom], null];
        if (idx === 5) { segs.push([top, left]); segs.push([bottom, right]); }
        else if (idx === 10) { segs.push([top, right]); segs.push([bottom, left]); }
        else if (T[idx]) segs.push(T[idx]);
      }
    }
    return segs;
  }
  function stitchRings(segs) {
    if (!segs.length) return [];
    var PREC = 1e4;
    function key(p) { return Math.round(p[0] * PREC) + ',' + Math.round(p[1] * PREC); }
    var adj = new Map();
    segs.forEach(function (sg, i) {
      [key(sg[0]), key(sg[1])].forEach(function (k, end) {
        if (!adj.has(k)) adj.set(k, []);
        adj.get(k).push({ i: i, end: end });
      });
    });
    var used = new Uint8Array(segs.length), rings = [];
    for (var si = 0; si < segs.length; si++) {
      if (used[si]) continue;
      var ring = [], ci = si, cEnd = 0, startKey = key(segs[si][0]);
      for (var it = 0; it <= segs.length; it++) {
        if (used[ci]) break;
        used[ci] = 1;
        ring.push(segs[ci][cEnd]);
        var ek = key(segs[ci][1 - cEnd]);
        if (ek === startKey && ring.length > 2) { rings.push(ring); break; }
        var cand = adj.get(ek) || [], nxt = null;
        for (var q = 0; q < cand.length; q++) if (!used[cand[q].i]) { nxt = cand[q]; break; }
        if (!nxt) break;
        ci = nxt.i; cEnd = nxt.end;
      }
    }
    return rings;
  }

  // ── Render principal ───────────────────────────────────────────────────────
  function render() {
    var data = window.IDW_DATA;
    var root = document.getElementById('idw-root');
    if (!data || !root) return;
    root.style.background = '#0d1117';

    // Proyección local equirectangular (metros)
    var lat0 = 0, n = data.hitos.length;
    data.hitos.forEach(function (h) { lat0 += h[1]; });
    lat0 /= n;
    var mLat = 111320, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
    var pts = data.hitos.map(function (h) {
      return { id: h[0], lat: h[1], lon: h[2], x: h[2] * mLon, y: h[1] * mLat, dz: +h[3] || 0 };
    });

    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var bbox = {
      w: Math.min.apply(null, xs) - PAD, e: Math.max.apply(null, xs) + PAD,
      s: Math.min.apply(null, ys) - PAD, n: Math.max.apply(null, ys) + PAD
    };
    var W = Math.round((bbox.e - bbox.w) / CELL), H = Math.round((bbox.n - bbox.s) / CELL);
    var grid = computeGrid(pts, bbox, W, H, 2);

    // Acolchar con 0 para cerrar anillos
    var PW = W + 2, PH = H + 2, pg = new Float64Array(PW * PH);
    for (var r = 0; r < H; r++) pg.set(grid.subarray(r * W, r * W + W), (r + 1) * PW + 1);

    var mn = 0, mx = 0;
    for (var i = 0; i < grid.length; i++) { if (grid[i] < mn) mn = grid[i]; if (grid[i] > mx) mx = grid[i]; }
    var minInt = Math.max(-30, Math.floor(mn)), maxInt = Math.min(30, Math.ceil(mx));

    var map = L.map(root, { zoomControl: true, attributionControl: false, maxZoom: 20 });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 18 }).addTo(map);
    // Fijar la vista ANTES de añadir capas vectoriales (si no, se proyectan degeneradas)
    var llBounds = L.latLngBounds(pts.map(function (p) { return [p.lat, p.lon]; }));
    map.fitBounds(llBounds, { padding: [30, 30] });
    map.createPane('bands');
    map.getPane('bands').style.opacity = 0.78;
    map.getPane('bands').style.zIndex = 410;

    var xSpan = bbox.e - bbox.w, ySpan = bbox.n - bbox.s;
    function gToLL(pt) {
      var xm = bbox.w + xSpan * (pt[0] - 1) / (W - 1);
      var ym = bbox.n - ySpan * (pt[1] - 1) / (H - 1);
      return [ym / mLat, xm / mLon];
    }

    var jobs = [];
    NEG_LEVELS.forEach(function (b, i2) {
      if (minInt >= b.level) return;
      var next = NEG_LEVELS[i2 + 1];
      jobs.push({ level: b.level, invert: true, color: b.color, deep: !!b.deep, lo: next ? next.level : Math.min(mn, b.level), hi: b.level });
    });
    POS_LEVELS.forEach(function (b, i2) {
      if (maxInt <= b.level) return;
      var next = POS_LEVELS[i2 + 1];
      jobs.push({ level: b.level, invert: false, color: b.color, deep: false, lo: b.level, hi: next ? next.level : Math.max(mx, b.level) });
    });

    function tooltip(lo, hi) {
      return '<div style="font-family:Consolas,monospace;font-size:11px;min-width:150px;">'
        + '<div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #30363d;padding-bottom:3px;margin-bottom:3px;"><span style="color:#7d8590;">Fecha</span><b>' + data.fecha + '</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota mín</span><b>' + lo.toFixed(2) + ' mm</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota máx</span><b>' + hi.toFixed(2) + ' mm</b></div>'
        + '</div>';
    }

    var ttStyle = document.createElement('style');
    ttStyle.textContent = '.idw-tt{background:#161b22!important;color:#e6edf3!important;border:1px solid #2be2ec!important;border-radius:6px!important;font-size:12px!important;padding:5px 9px!important;white-space:nowrap;}';
    document.head.appendChild(ttStyle);

    var group = L.featureGroup();
    jobs.forEach(function (job) {
      var segs;
      if (job.invert) {
        var neg = new Float64Array(PW * PH);
        for (var k = 0; k < neg.length; k++) neg[k] = -pg[k];
        segs = marchingSegs(neg, PW, PH, -job.level);
      } else {
        segs = marchingSegs(pg, PW, PH, job.level);
      }
      var rings = stitchRings(segs).filter(function (rg) { return rg.length > 3; });
      if (!rings.length) return;
      L.polygon(rings.map(function (rg) { return rg.map(gToLL); }), {
        pane: 'bands', smoothFactor: job.deep ? 0 : 1,
        fillColor: 'rgb(' + job.color + ')', fillOpacity: 1, fillRule: 'evenodd',
        color: 'rgb(35,35,35)', weight: 0.6, opacity: 0.55
      }).bindTooltip(tooltip(job.lo, job.hi), { sticky: true, className: 'idw-tt', direction: 'top' })
        .addTo(group);
    });
    group.addTo(map);

    // Hitos
    var icon = L.divIcon({
      className: '',
      html: '<svg width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4" fill="#2be2ec" stroke="rgba(0,0,0,.6)" stroke-width="1.3"/><circle cx="5.5" cy="5.5" r="1.6" fill="#fff" opacity=".75"/></svg>',
      iconSize: [11, 11], iconAnchor: [5.5, 5.5]
    });
    var hg = L.featureGroup();
    pts.forEach(function (p) {
      L.marker([p.lat, p.lon], { icon: icon })
        .bindTooltip('<b style="color:#2be2ec">' + p.id + '</b><br>Δ Cota: <b>' + p.dz.toFixed(1) + ' mm</b>', { direction: 'top', offset: [0, -6], className: 'idw-tt' })
        .addTo(hg);
    });
    hg.addTo(map);

    // Badge de fecha
    var badge = document.createElement('div');
    badge.textContent = data.fecha;
    badge.style.cssText = 'position:absolute;top:10px;right:10px;z-index:1000;font:700 14px Consolas,monospace;color:#388bfd;background:rgba(22,27,34,.92);border:1px solid #388bfd;border-radius:99px;padding:4px 14px;';
    root.appendChild(badge);
  }

  loadLeaflet(render);
})();
