/* ═══════════════════════════════════════════════════════════════════════════
   visor-idw.js · Motor IDW para Power BI (HTML Content, versión con scripts)
   ───────────────────────────────────────────────────────────────────────────
   Formato multi-fecha (con slider integrado):

     <div id="idw-root" style="position:absolute;inset:0;"></div>
     <script>window.IDW_DATA = {
       fechas: ["29/04/2026","05/05/2026","20/05/2026"],   // orden ascendente
       hitos: [
         // [id, lat, lon, "serie dz alineada con fechas, ';' separador, vacío = sin medición"]
         ["H1.01", 43.2309635, -2.8365123, "-1.2;-2.0;-3.5"],
         ["H1.02", 43.2311000, -2.8362000, ";-4.1;-5.8"],
         ...
       ]
     };</script>
     <script src="https://l5ag.github.io/Hitos/visor-idw.js"></script>

   También acepta el formato antiguo de una sola fecha:
     { fecha:"09/06/2026", hitos:[["H1.01",lat,lon,dz], ...] }

   El slider acumula: para la fecha seleccionada cada hito usa su última
   medición anterior o igual a esa fecha. Los datos viajan dentro del visual.
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

  // ── Normalización de datos (multi-fecha o formato antiguo) ────────────────
  function num(s) {
    if (s === '' || s === null || s === undefined) return null;
    if (typeof s === 'number') return isNaN(s) ? null : s;
    var x = parseFloat(String(s).trim().replace(',', '.'));
    return isNaN(x) ? null : x;
  }
  function parseData(raw) {
    var multi = raw.hitos.length && typeof raw.hitos[0][3] === 'string' && raw.hitos[0][3].indexOf(';') >= 0;
    if ((raw.fechas && raw.fechas.length) || multi) {
      var hitos = raw.hitos.map(function (h) {
        return { id: h[0], lat: h[1], lon: h[2], serie: String(h[3]).split(';').map(num) };
      });
      var nF = raw.fechas && raw.fechas.length ? raw.fechas.length : 0;
      hitos.forEach(function (h) { if (h.serie.length > nF) nF = h.serie.length; });
      var fechas = [];
      for (var i = 0; i < nF; i++) {
        fechas.push(raw.fechas && raw.fechas[i] ? raw.fechas[i] : 'F' + (i + 1));
      }
      hitos.forEach(function (h) { while (h.serie.length < nF) h.serie.push(null); });
      return { fechas: fechas, hitos: hitos };
    }
    return {
      fechas: [raw.fecha || ''],
      hitos: raw.hitos.map(function (h) {
        return { id: h[0], lat: h[1], lon: h[2], serie: [num(h[3]) === null ? 0 : num(h[3])] };
      })
    };
  }
  // Acumulado: última medición con índice ≤ i
  function dzAt(h, i) {
    for (var k = i; k >= 0; k--) if (h.serie[k] !== null && !isNaN(h.serie[k])) return h.serie[k];
    return null;
  }

  // ── Render principal ───────────────────────────────────────────────────────
  function render() {
    var raw = window.IDW_DATA;
    var root = document.getElementById('idw-root');
    if (!root) return;
    if (!raw || !raw.hitos || !raw.hitos.length) {
      root.style.cssText += ';display:flex;align-items:center;justify-content:center;background:#0d1117;color:#e6edf3;font:13px Consolas,monospace;';
      root.textContent = 'IDW: sin datos (window.IDW_DATA vac\u00edo o truncado)';
      return;
    }
    root.style.background = '#0d1117';
    var data = parseData(raw);
    var nF = data.fechas.length;

    // Proyección local equirectangular (metros) — bbox fijo con todos los hitos
    var lat0 = 0;
    data.hitos.forEach(function (h) { lat0 += h.lat; });
    lat0 /= data.hitos.length;
    var mLat = 111320, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
    data.hitos.forEach(function (h) { h.x = h.lon * mLon; h.y = h.lat * mLat; });

    var map = L.map(root, { zoomControl: false, attributionControl: false, maxZoom: 20 });
    L.control.zoom({ position: 'topright' }).addTo(map);
    var baseLayers = {
      sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 18 }),
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19 }),
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 17 })
    };
    var activeBase = 'sat';
    baseLayers.sat.addTo(map);
    var llBounds = L.latLngBounds(data.hitos.map(function (p) { return [p.lat, p.lon]; }));
    map.fitBounds(llBounds, { padding: [30, 30] });
    map.createPane('bands');
    map.getPane('bands').style.opacity = 0.78;
    map.getPane('bands').style.zIndex = 410;

    var ttStyle = document.createElement('style');
    ttStyle.textContent =
      '.idw-tt{background:#161b22!important;color:#e6edf3!important;border:1px solid #2be2ec!important;border-radius:6px!important;font-size:12px!important;padding:5px 9px!important;white-space:nowrap;}' +
      '.idw-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:#30363d;outline:none;cursor:pointer;}' +
      '.idw-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#388bfd;border:none;box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:pointer;}' +
      '.idw-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}' +
      '.idw-btn{width:26px;height:24px;border-radius:4px;border:1px solid #30363d;background:#21262d;color:#e6edf3;font:700 12px Consolas,monospace;cursor:pointer;line-height:1;flex-shrink:0;}' +
      '.idw-btn:hover{border-color:#388bfd;color:#388bfd;}' +
      '.idw-lbtn{display:block;width:100%;text-align:left;padding:5px 9px;margin-bottom:4px;border-radius:5px;border:1px solid #30363d;background:#21262d;color:#e6edf3;font:12px Consolas,monospace;cursor:pointer;}' +
      '.idw-lbtn.active{border-color:#388bfd;color:#388bfd;background:rgba(56,139,253,.15);}' +
      '.idw-mini{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:#30363d;outline:none;cursor:pointer;width:100%;}' +
      '.idw-mini::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}' +
      '.idw-mini::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#388bfd;border:none;cursor:pointer;}';
    document.head.appendChild(ttStyle);

    var icon = L.divIcon({
      className: '',
      html: '<svg width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="4" fill="#2be2ec" stroke="rgba(0,0,0,.6)" stroke-width="1.3"/><circle cx="5.5" cy="5.5" r="1.6" fill="#fff" opacity=".75"/></svg>',
      iconSize: [11, 11], iconAnchor: [5.5, 5.5]
    });

    var bandGroup = null, hitoGroup = null;
    // Parámetros de interpolación (ajustables desde el panel)
    var interpMode = 'accum';   // 'accum' = última medición ≤ fecha | 'exact' = solo hitos medidos esa fecha
    var idwPower = 2;           // exponente IDW (QGIS usa 2 por defecto)
    var EXT_PAD = 40;           // margen del ráster alrededor de los puntos (m)
    var MAX_CELLS = 200000;     // tope de celdas (celda adaptativa)
    var CLUSTER_DIST = 250;     // distancia máx (m) para agrupar hitos en una misma superficie

    // Agrupa puntos en cúmulos espaciales (unión por cercanía < CLUSTER_DIST)
    function clusterPts(pts, dist) {
      var d2max = dist * dist, clusters = [];
      var assigned = new Array(pts.length);
      for (var i = 0; i < pts.length; i++) assigned[i] = -1;
      for (var s = 0; s < pts.length; s++) {
        if (assigned[s] >= 0) continue;
        var idc = clusters.length, stack = [s], cl = [pts[s]];
        assigned[s] = idc;
        while (stack.length) {
          var a = stack.pop();
          for (var j = 0; j < pts.length; j++) {
            if (assigned[j] >= 0) continue;
            var dx = pts[a].x - pts[j].x, dy = pts[a].y - pts[j].y;
            if (dx * dx + dy * dy <= d2max) { assigned[j] = idc; cl.push(pts[j]); stack.push(j); }
          }
        }
        clusters.push(cl);
      }
      return clusters;
    }

    function tooltip(fecha, lo, hi) {
      return '<div style="font-family:Consolas,monospace;font-size:11px;min-width:150px;">'
        + '<div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid #30363d;padding-bottom:3px;margin-bottom:3px;"><span style="color:#7d8590;">Fecha</span><b>' + fecha + '</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota mín</span><b>' + lo.toFixed(2) + ' mm</b></div>'
        + '<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:#7d8590;">Δ Cota máx</span><b>' + hi.toFixed(2) + ' mm</b></div>'
        + '</div>';
    }

    function update(idx) {
      var fecha = data.fechas[idx];
      var pts = [];
      data.hitos.forEach(function (h) {
        var dz = interpMode === 'exact' ? h.serie[idx] : dzAt(h, idx);
        if (dz !== null && dz !== undefined && !isNaN(dz)) pts.push({ id: h.id, lat: h.lat, lon: h.lon, x: h.x, y: h.y, dz: dz });
      });
      if (bandGroup) { map.removeLayer(bandGroup); bandGroup = null; }
      if (hitoGroup) { map.removeLayer(hitoGroup); hitoGroup = null; }
      if (!pts.length) return;

      bandGroup = L.featureGroup();

      // Una superficie IDW independiente por cúmulo de hitos (como los ráster de QGIS)
      clusterPts(pts, CLUSTER_DIST).forEach(function (cpts) {
        if (cpts.length < 3) return;
        renderSurface(cpts, fecha);
      });
      bandGroup.addTo(map);

      hitoGroup = L.featureGroup();
      pts.forEach(function (p) {
        L.marker([p.lat, p.lon], { icon: icon })
          .bindTooltip('<b style="color:#2be2ec">' + p.id + '</b><br>Δ Cota: <b>' + p.dz.toFixed(1) + ' mm</b>', { direction: 'top', offset: [0, -6], className: 'idw-tt' })
          .addTo(hitoGroup);
      });
      hitoGroup.addTo(map);
    }

    function renderSurface(pts, fecha) {
      // Extensión local: bbox de los puntos del cúmulo + margen
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var bbox = {
        w: Math.min.apply(null, xs) - EXT_PAD, e: Math.max.apply(null, xs) + EXT_PAD,
        s: Math.min.apply(null, ys) - EXT_PAD, n: Math.max.apply(null, ys) + EXT_PAD
      };
      // Celda adaptativa: parte de CELL y crece si la malla supera MAX_CELLS
      var cell = CELL;
      var W = Math.max(8, Math.round((bbox.e - bbox.w) / cell));
      var H = Math.max(8, Math.round((bbox.n - bbox.s) / cell));
      if (W * H > MAX_CELLS) {
        cell *= Math.sqrt(W * H / MAX_CELLS);
        W = Math.max(8, Math.round((bbox.e - bbox.w) / cell));
        H = Math.max(8, Math.round((bbox.n - bbox.s) / cell));
      }
      var PW = W + 2, PH = H + 2;
      var xSpan = bbox.e - bbox.w, ySpan = bbox.n - bbox.s;
      function gToLL(pt) {
        var xm = bbox.w + xSpan * (pt[0] - 1) / (W - 1);
        var ym = bbox.n - ySpan * (pt[1] - 1) / (H - 1);
        return [ym / mLat, xm / mLon];
      }

      var grid = computeGrid(pts, bbox, W, H, idwPower);
      var pg = new Float64Array(PW * PH);
      for (var r = 0; r < H; r++) pg.set(grid.subarray(r * W, r * W + W), (r + 1) * PW + 1);

      var mn = 0, mx = 0;
      for (var i = 0; i < grid.length; i++) { if (grid[i] < mn) mn = grid[i]; if (grid[i] > mx) mx = grid[i]; }
      var minInt = Math.max(-30, Math.floor(mn)), maxInt = Math.min(30, Math.ceil(mx));

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
        }).bindTooltip(tooltip(fecha, job.lo, job.hi), { sticky: true, className: 'idw-tt', direction: 'top' })
          .addTo(bandGroup);
      });
    }

    // Badge de fecha (arriba-dcha) — solo cuando no hay slider
    var badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:10px;left:186px;z-index:1000;font:700 14px Consolas,monospace;color:#388bfd;background:rgba(22,27,34,.92);border:1px solid #388bfd;border-radius:99px;padding:4px 14px;';
    if (nF > 1) badge.style.display = 'none';
    root.appendChild(badge);

    var current = nF - 1;
    var pending = null, timer = null;
    var syncUI = function () {};
    function requestUpdate(idx) {
      current = idx;
      badge.textContent = data.fechas[idx];
      syncUI();
      pending = idx;
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        update(pending);
      }, 120);
    }

    // Barra de fechas (solo si hay más de una)
    if (nF > 1) {
      var bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:207px;right:10px;bottom:10px;z-index:1000;display:flex;align-items:center;gap:14px;background:rgba(13,17,23,.92);border:1px solid #30363d;border-radius:6px;padding:8px 14px;font-family:Consolas,monospace;box-shadow:0 4px 16px rgba(0,0,0,.45);';
      var lab0 = document.createElement('span');
      lab0.textContent = data.fechas[0];
      lab0.style.cssText = 'font-size:12px;color:#e6edf3;flex-shrink:0;';
      var range = document.createElement('input');
      range.type = 'range'; range.min = 0; range.max = nF - 1; range.step = 1; range.value = nF - 1;
      range.className = 'idw-range';
      range.style.cssText = 'flex:1;min-width:80px;';
      var lab1 = document.createElement('span');
      lab1.textContent = data.fechas[nF - 1];
      lab1.style.cssText = 'font-size:12px;color:#7d8590;flex-shrink:0;';
      var count = document.createElement('span');
      count.style.cssText = 'font-size:12px;color:#7d8590;flex-shrink:0;';
      var prev = document.createElement('button');
      prev.textContent = '‹'; prev.className = 'idw-btn';
      var next = document.createElement('button');
      next.textContent = '›'; next.className = 'idw-btn';
      var cur = document.createElement('span');
      cur.style.cssText = 'font:700 13px Consolas,monospace;color:#388bfd;flex-shrink:0;';
      bar.appendChild(lab0); bar.appendChild(range); bar.appendChild(lab1);
      bar.appendChild(count); bar.appendChild(prev); bar.appendChild(next); bar.appendChild(cur);
      root.appendChild(bar);

      syncUI = function () {
        var p = nF > 1 ? current / (nF - 1) * 100 : 100;
        range.value = current;
        range.style.background = 'linear-gradient(to right,#388bfd 0%,#388bfd ' + p + '%,#30363d ' + p + '%,#30363d 100%)';
        count.textContent = (current + 1) + ' / ' + nF;
        cur.textContent = data.fechas[current];
      };

      range.addEventListener('input', function () { requestUpdate(+range.value); });
      prev.addEventListener('click', function () { if (current > 0) requestUpdate(current - 1); });
      next.addEventListener('click', function () { if (current < nF - 1) requestUpdate(current + 1); });

      // Evitar que arrastrar el slider mueva el mapa
      L.DomEvent.disableClickPropagation(bar);
      syncUI();
    }

    // ── Panel de control (Reproductor · Capas base · IDW) ────────────────
    var panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;top:0;bottom:0;left:0;z-index:1000;width:172px;overflow-y:auto;background:rgba(13,17,23,.94);border-right:1px solid #30363d;padding:12px;font-family:Consolas,monospace;color:#e6edf3;box-shadow:4px 0 16px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:12px;';
    function section(title) {
      var s = document.createElement('div');
      var h = document.createElement('div');
      h.textContent = title;
      h.style.cssText = 'font:700 10px Consolas,monospace;letter-spacing:.08em;color:#7d8590;text-transform:uppercase;margin-bottom:6px;';
      s.appendChild(h);
      return s;
    }

    // Reproductor (solo con más de una fecha)
    if (nF > 1) {
      var speed = 800, playing = null;
      var sRep = section('Reproductor');
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';
      var playBtn = document.createElement('button');
      playBtn.textContent = '▶';
      playBtn.className = 'idw-btn';
      var spd = document.createElement('input');
      spd.type = 'range'; spd.min = 200; spd.max = 2000; spd.step = 100; spd.value = speed;
      spd.className = 'idw-mini'; spd.style.flex = '1';
      var spdVal = document.createElement('span');
      spdVal.textContent = speed + 'ms';
      spdVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:44px;text-align:right;';
      var stopPlay = function () { clearInterval(playing); playing = null; playBtn.textContent = '▶'; };
      var startPlay = function () {
        playBtn.textContent = '❚❚';
        playing = setInterval(function () {
          requestUpdate(current >= nF - 1 ? 0 : current + 1);
        }, speed);
      };
      playBtn.addEventListener('click', function () { if (playing) stopPlay(); else startPlay(); });
      spd.addEventListener('input', function () {
        speed = +spd.value; spdVal.textContent = speed + 'ms';
        if (playing) { clearInterval(playing); playing = setInterval(function () { requestUpdate(current >= nF - 1 ? 0 : current + 1); }, speed); }
      });
      row.appendChild(playBtn); row.appendChild(spd); row.appendChild(spdVal);
      sRep.appendChild(row);
      panel.appendChild(sRep);
    }

    // Capas base
    var sBase = section('Capas base');
    var baseNames = { sat: '🛰 Satélite', osm: '🗺 Calles', topo: '⛰ Topográfico' };
    var baseBtns = {};
    Object.keys(baseNames).forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'idw-lbtn' + (k === activeBase ? ' active' : '');
      b.textContent = baseNames[k];
      b.addEventListener('click', function () {
        if (k === activeBase) return;
        map.removeLayer(baseLayers[activeBase]);
        baseLayers[k].addTo(map);
        baseBtns[activeBase].classList.remove('active');
        activeBase = k;
        b.classList.add('active');
      });
      baseBtns[k] = b;
      sBase.appendChild(b);
    });
    panel.appendChild(sBase);

    // Interpolación: modo + exponente
    var sInt = section('Interpolación');
    var mExact = document.createElement('button');
    mExact.className = 'idw-lbtn';
    mExact.textContent = 'Fecha exacta';
    mExact.title = 'Solo hitos medidos en la fecha seleccionada (como QGIS)';
    var mAccum = document.createElement('button');
    mAccum.className = 'idw-lbtn active';
    mAccum.textContent = 'Acumulado';
    mAccum.title = 'Última medición de cada hito hasta la fecha seleccionada';
    function setMode(m) {
      if (interpMode === m) return;
      interpMode = m;
      mExact.classList.toggle('active', m === 'exact');
      mAccum.classList.toggle('active', m === 'accum');
      update(current);
    }
    mExact.addEventListener('click', function () { setMode('exact'); });
    mAccum.addEventListener('click', function () { setMode('accum'); });
    var pRow = document.createElement('div');
    pRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:2px;';
    var pLab = document.createElement('span');
    pLab.textContent = 'Exp.';
    pLab.style.cssText = 'font-size:10px;color:#7d8590;';
    var pw = document.createElement('input');
    pw.type = 'range'; pw.min = 1; pw.max = 4; pw.step = 0.5; pw.value = idwPower;
    pw.className = 'idw-mini'; pw.style.flex = '1';
    var pwVal = document.createElement('span');
    pwVal.textContent = idwPower.toFixed(1);
    pwVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:26px;text-align:right;';
    pw.addEventListener('change', function () {
      idwPower = +pw.value; pwVal.textContent = idwPower.toFixed(1);
      update(current);
    });
    pw.addEventListener('input', function () { pwVal.textContent = (+pw.value).toFixed(1); });
    pRow.appendChild(pLab); pRow.appendChild(pw); pRow.appendChild(pwVal);
    sInt.appendChild(mAccum); sInt.appendChild(mExact); sInt.appendChild(pRow);
    panel.appendChild(sInt);

    // IDW: toggle + opacidad
    var sIdw = section('IDW Cotas');
    var tgl = document.createElement('button');
    tgl.className = 'idw-lbtn active';
    tgl.textContent = '🌡 Bandas IDW';
    var idwOn = true;
    tgl.addEventListener('click', function () {
      idwOn = !idwOn;
      map.getPane('bands').style.display = idwOn ? '' : 'none';
      tgl.classList.toggle('active', idwOn);
    });
    var oRow = document.createElement('div');
    oRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:2px;';
    var oLab = document.createElement('span');
    oLab.textContent = 'Opac.';
    oLab.style.cssText = 'font-size:10px;color:#7d8590;';
    var op = document.createElement('input');
    op.type = 'range'; op.min = 0; op.max = 100; op.step = 1; op.value = 78;
    op.className = 'idw-mini'; op.style.flex = '1';
    var opVal = document.createElement('span');
    opVal.textContent = '78%';
    opVal.style.cssText = 'font-size:10px;color:#388bfd;min-width:32px;text-align:right;';
    op.addEventListener('input', function () {
      map.getPane('bands').style.opacity = op.value / 100;
      opVal.textContent = op.value + '%';
    });
    oRow.appendChild(oLab); oRow.appendChild(op); oRow.appendChild(opVal);
    sIdw.appendChild(tgl); sIdw.appendChild(oRow);
    panel.appendChild(sIdw);
    root.appendChild(panel);
    L.DomEvent.disableClickPropagation(panel);

    // Diagnóstico: aviso si no hay ninguna medición válida
    var totalMed = 0;
    data.hitos.forEach(function (h) { h.serie.forEach(function (s) { if (s !== null) totalMed++; }); });
    if (!totalMed) {
      var warnEl = document.createElement('div');
      warnEl.textContent = '\u26a0 ' + data.hitos.length + ' hitos pero 0 mediciones v\u00e1lidas \u2014 revisa la columna \u0394 COTAA (mm) en la medida';
      warnEl.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:1000;font:600 12px Consolas,monospace;color:#f0b429;background:rgba(22,27,34,.94);border:1px solid #f0b429;border-radius:8px;padding:6px 14px;';
      root.appendChild(warnEl);
    }

    badge.textContent = data.fechas[current];
    update(current);
  }

  loadLeaflet(render);
})();
