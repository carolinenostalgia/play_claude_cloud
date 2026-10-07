/* 红线小镇 · 画面：城市、建筑、小人、车、红线、对话气泡、镜头。 */
'use strict';

const cv = document.getElementById('city');
const ctx = cv.getContext('2d');
let DPR = 1, SW_ = 0, SH_ = 0;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  SW_ = window.innerWidth; SH_ = window.innerHeight;
  cv.width = SW_ * DPR; cv.height = SH_ * DPR;
  cv.style.width = SW_ + 'px'; cv.style.height = SH_ + 'px';
}
resize();
window.addEventListener('resize', resize);

/* ---------- 固定装饰：树、路灯、窗户 ---------- */
let seed = 7;
const srand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const TREES = [], LAMPS = [], FLOWERS = [];
(function decor() {
  const inBuilding = (x, y, pad) => BUILDINGS.some(L => L.kind !== 'area' && x > L.x - pad && x < L.x + L.w + pad && y > L.y - pad && y < L.y + L.h + pad);
  const inYard = (x, y) => BUILDINGS.some(L => {
    if (L.kind === 'area') return false;
    const yd = yardRect(L); return x > yd.x - 6 && x < yd.x + yd.w + 6 && y > yd.y - 6 && y < yd.y + yd.h + 6;
  });
  for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) {
    const bx = ROAD_X[c] + 30, by = ROAD_Y[r] + 30;
    const area = BUILDINGS.find(L => L.kind === 'area' && L.b[0] === c && L.b[1] === r);
    const n = area ? (area.id === 'park' ? 34 : 8) : 7;
    for (let k = 0, tries = 0; k < n && tries < 400; tries++) {
      const x = bx + 14 + srand() * 392, y = by + 14 + srand() * 332;
      if (inBuilding(x, y, 14) || inYard(x, y)) continue;
      if (area && area.pond && ((x - area.pond.x) / (area.pond.rx + 18)) ** 2 + ((y - area.pond.y) / (area.pond.ry + 18)) ** 2 < 1) continue;
      if (area && area.id === 'park') { if (Math.abs(((x - (bx + 210)) / 170) ** 2 + ((y - (by + 180)) / 140) ** 2 - 1) < 0.18) continue; if (dist({ x, y }, area.named.stage) < 40) continue; if (area.pairs.some(p => dist(p.seats[0], { x, y }) < 30)) continue; }
      if (area && area.id === 'fun') { if (dist({ x, y }, area.wheel) < 80 || dist({ x, y }, area.carousel) < 60 || y < by + 90) continue; }
      TREES.push({ x, y, r: 9 + srand() * 7, c: srand() < 0.5 ? '#5a9a4a' : srand() < 0.5 ? '#6fb35b' : '#4f8a3f' });
      k++;
    }
    if (!area) for (let k = 0; k < 10; k++) { const x = bx + 10 + srand() * 400, y = by + 10 + srand() * 340; if (!inBuilding(x, y, 6) && !inYard(x, y)) FLOWERS.push({ x, y, c: pick(['#ff6b6b', '#ffd93d', '#c77dff', '#ffffff']) }); }
  }
  TREES.sort((a, b) => a.y - b.y);
  for (const x of ROAD_X) for (let y = 40; y < WORLD_H; y += 150) if (!ROAD_Y.some(ry => Math.abs(ry - y) < 40)) { LAMPS.push({ x: x - 29, y }); LAMPS.push({ x: x + 29, y: y + 75 }); }
  for (const y of ROAD_Y) for (let x = 40; x < WORLD_W; x += 150) if (!ROAD_X.some(rx => Math.abs(rx - x) < 40)) LAMPS.push({ x, y: y - 29 });
  for (const L of BUILDINGS) {
    if (L.kind === 'area') continue;
    const tall = ['office', 'apartment', 'hospital', 'mall'].includes(L.type);
    L.wallH = Math.round(L.h * (tall ? 0.56 : 0.42));
    L.windows = [];
    const wy0 = L.y + L.h - L.wallH + 8, rows = Math.max(1, Math.floor((L.wallH - 30) / 18)), cols = Math.max(2, Math.floor((L.w - 16) / 20));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = L.x + 10 + c * ((L.w - 20) / cols) + 3, y = wy0 + r * 18;
      if (L.door === 'S' || true) { const dx = Math.abs(x + 5 - L.door.x); if (r === rows - 1 && dx < 14 && L.door.y > L.center.y) continue; }
      L.windows.push({ x, y, w: Math.min(12, (L.w - 20) / cols - 6), h: 11, lit: srand() < 0.65, ph: srand() * 10 });
    }
  }
})();
function yardRect(L) {
  const bx = L.bx, by = L.by, pad = 10;
  if (L.door === 'S') return { x: L.x - pad, y: L.y + L.h, w: L.w + pad * 2, h: by + 360 - (L.y + L.h) };
  if (L.door === 'N') return { x: L.x - pad, y: by, w: L.w + pad * 2, h: L.y - by };
  if (L.door === 'E') return { x: L.x + L.w, y: L.y - pad, w: bx + 420 - (L.x + L.w), h: L.h + pad * 2 };
  return { x: bx, y: L.y - pad, w: L.x - bx, h: L.h + pad * 2 };
}

/* ---------- 光照 ---------- */
function nightAmt() {
  const h = tod() / 60;
  if (h >= 7 && h <= 17.5) return 0;
  if (h > 17.5 && h < 19.5) return (h - 17.5) / 2;
  if (h > 5 && h < 7) return 1 - (h - 5) / 2;
  return 1;
}

/* ---------- 基础图形 ---------- */
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2); }
function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(r, 0.1), 0, Math.PI * 2); }
function shade(hex, k) {
  if (!hex || hex[0] !== '#') return hex;
  let n = parseInt(hex.slice(1).length === 3 ? hex.slice(1).split('').map(x => x + x).join('') : hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ---------- 城市底图 ---------- */
function drawGround(c, B) {
  c.fillStyle = '#a9d18e'; c.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
  // 街区
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x = ROAD_X[i] + 30, y = ROAD_Y[j] + 30;
    c.fillStyle = '#b9dc9c'; c.fillRect(x, y, 420, 360);
  }
  for (const f of FLOWERS) { c.fillStyle = f.c; circ(c, f.x, f.y, 1.6); c.fill(); }
  // 院子（铺地）
  for (const L of BUILDINGS) {
    if (L.kind === 'area') continue;
    const y = yardRect(L);
    c.fillStyle = isHome(L.id) && L.type === 'house' ? '#d8cfb8' : '#e7e0cf';
    c.fillRect(y.x, y.y, y.w, y.h);
    if (L.type === 'house') { c.fillStyle = '#cbbf9f'; c.fillRect(L.door.x - 5, Math.min(L.door.y, y.y + y.h), 10, Math.abs(y.h)); }
  }
  // 人行道
  c.fillStyle = '#d6d2c8';
  for (const x of ROAD_X) c.fillRect(x - 30, 0, 60, WORLD_H);
  for (const y of ROAD_Y) c.fillRect(0, y - 30, WORLD_W, 60);
  c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = 1;
  for (const x of ROAD_X) for (let y = 0; y < WORLD_H; y += 12) { c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x - 20, y); c.moveTo(x + 20, y); c.lineTo(x + 30, y); c.stroke(); }
  for (const y of ROAD_Y) for (let x = 0; x < WORLD_W; x += 12) { c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, y - 20); c.moveTo(x, y + 20); c.lineTo(x, y + 30); c.stroke(); }
  // 路面
  c.fillStyle = '#5a6068';
  for (const x of ROAD_X) c.fillRect(x - 20, 0, 40, WORLD_H);
  for (const y of ROAD_Y) c.fillRect(0, y - 20, WORLD_W, 40);
  // 车道线
  c.strokeStyle = '#f2d06b'; c.lineWidth = 1.4; c.setLineDash([10, 9]);
  for (const x of ROAD_X) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WORLD_H); c.stroke(); }
  for (const y of ROAD_Y) { c.beginPath(); c.moveTo(0, y); c.lineTo(WORLD_W, y); c.stroke(); }
  c.setLineDash([]);
  // 路口 + 斑马线
  for (const x of ROAD_X) for (const y of ROAD_Y) {
    c.fillStyle = '#5a6068'; c.fillRect(x - 20, y - 20, 40, 40);
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (let k = -16; k <= 12; k += 7) {
      c.fillRect(x + k, y - 30, 4, 9); c.fillRect(x + k, y + 21, 4, 9);
      c.fillRect(x - 30, y + k, 9, 4); c.fillRect(x + 21, y + k, 9, 4);
    }
  }
}
function drawTree(c, t) {
  c.fillStyle = 'rgba(0,0,0,.15)'; ell(c, t.x + 2, t.y + 3, t.r * 0.9, t.r * 0.45); c.fill();
  c.fillStyle = '#7a5230'; c.fillRect(t.x - 1.5, t.y - 6, 3, 8);
  c.fillStyle = t.c; circ(c, t.x, t.y - t.r * 0.9, t.r); c.fill();
  c.fillStyle = 'rgba(255,255,255,.14)'; circ(c, t.x - t.r * 0.3, t.y - t.r * 1.2, t.r * 0.45); c.fill();
}
function drawLamp(c, l) {
  c.fillStyle = '#3a3f45'; c.fillRect(l.x - 1, l.y - 16, 2, 16);
  c.fillStyle = '#fff3c4'; circ(c, l.x, l.y - 17, 2.4); c.fill();
}
function signText(c, text, x, y, size, color = '#fff', bg = 'rgba(0,0,0,.45)') {
  c.font = `bold ${size}px "PingFang SC","Microsoft YaHei",sans-serif`;
  const w = c.measureText(text).width;
  c.fillStyle = bg; rr(c, x - w / 2 - 4, y - size * 0.75, w + 8, size * 1.35, 3); c.fill();
  c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y);
}
function drawSeatsAndTables(c, L) {
  for (const p of L.pairs) {
    const [s1, s2] = p.seats, mx = (s1.x + s2.x) / 2, my = (s1.y + s2.y) / 2;
    if (L.type === 'park' || L.type === 'fun' || L.type === 'mall' || L.type === 'books') {
      c.fillStyle = '#8d6e4c'; c.fillRect(s1.x - 8, s1.y - 7, s2.x - s1.x + 16, 5);
      c.fillStyle = '#6d4c33'; c.fillRect(s1.x - 8, s1.y - 11, s2.x - s1.x + 16, 3);
    } else {
      c.fillStyle = '#6d4c41'; c.fillRect(s1.x - 4, s1.y - 4, 8, 4); c.fillRect(s2.x - 4, s2.y - 4, 8, 4);
      c.fillStyle = '#fff'; circ(c, mx, my - 3, 7); c.fill(); c.strokeStyle = '#b08968'; c.lineWidth = 1; c.stroke();
      if (L.type === 'cafe') { c.fillStyle = 'rgba(220,60,60,.75)'; circ(c, mx, my - 26, 15); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(mx, my - 26); c.arc(mx, my - 26, 15, 0, Math.PI / 3); c.fill(); c.beginPath(); c.moveTo(mx, my - 26); c.arc(mx, my - 26, 15, Math.PI * 2 / 3, Math.PI); c.fill(); c.beginPath(); c.moveTo(mx, my - 26); c.arc(mx, my - 26, 15, Math.PI * 4 / 3, Math.PI * 5 / 3); c.fill(); }
    }
  }
}
function drawBuilding(c, L) {
  const roofH = L.h - L.wallH;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(L.x + 5, L.y + 6, L.w, L.h);
  // 屋顶
  c.fillStyle = L.roof; c.fillRect(L.x, L.y, L.w, roofH);
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(L.x, L.y, L.w, 4);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(L.x, L.y + roofH - 4, L.w, 4);
  if (L.type === 'house') { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let y = L.y + 8; y < L.y + roofH - 4; y += 7) { c.beginPath(); c.moveTo(L.x, y); c.lineTo(L.x + L.w, y); c.stroke(); } }
  // 墙
  c.fillStyle = L.color; c.fillRect(L.x, L.y + roofH, L.w, L.wallH);
  c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(L.x, L.y + L.h - 4, L.w, 4);
  for (const w of L.windows) {
    c.fillStyle = L.type === 'office' ? '#6fa8dc' : '#9ec5dd'; c.fillRect(w.x, w.y, w.w, w.h);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(w.x, w.y, w.w * 0.35, w.h);
  }
  // 门
  if (L.door.y > L.center.y) {
    c.fillStyle = '#5d4037'; c.fillRect(L.door.x - 7, L.door.y - 18, 14, 18);
    c.fillStyle = '#ffd54f'; circ(c, L.door.x + 4, L.door.y - 9, 1); c.fill();
  } else {
    c.fillStyle = '#5d4037'; c.fillRect(L.door.x - 8, L.door.y - 2, 16, 5);
  }
  // 特色装饰
  const T = L.type, cx = L.x + L.w / 2, ry = L.y + roofH / 2;
  if (T === 'cafe' || T === 'hotpot' || T === 'flower' || T === 'shop' || T === 'books') {
    const ay = L.door.y > L.center.y ? L.y + roofH : L.y - 2;
    for (let i = 0; i < L.w; i += 10) { c.fillStyle = (i / 10) % 2 ? '#fff' : (T === 'hotpot' ? '#c0392b' : T === 'flower' ? '#f48fb1' : T === 'shop' ? '#3fa36b' : T === 'books' ? '#2e6b4f' : '#c0392b'); c.fillRect(L.x + i, ay, 10, 7); }
  }
  if (T === 'hospital') { c.fillStyle = '#fff'; c.fillRect(cx - 14, ry - 5, 28, 10); c.fillRect(cx - 5, ry - 14, 10, 28); c.fillStyle = '#e53935'; c.fillRect(cx - 12, ry - 3, 24, 6); c.fillRect(cx - 3, ry - 12, 6, 24); }
  if (T === 'hotpot') { for (const dx of [-30, 30]) { c.fillStyle = '#e53935'; ell(c, cx + dx, L.y + roofH + 14, 5, 7); c.fill(); c.fillStyle = '#ffd54f'; c.fillRect(cx + dx - 1, L.y + roofH + 20, 2, 4); } }
  if (T === 'fire') { const y = L.y + L.h + 6; c.fillStyle = '#d32f2f'; rr(c, L.x + 6, y, 54, 22, 3); c.fill(); c.fillStyle = '#90caf9'; c.fillRect(L.x + 44, y + 3, 12, 8); c.fillStyle = '#eee'; c.fillRect(L.x + 8, y + 2, 34, 3); c.fillStyle = '#222'; circ(c, L.x + 16, y + 22, 4); c.fill(); circ(c, L.x + 48, y + 22, 4); c.fill(); }
  if (T === 'studio') { c.fillStyle = L.roof; c.beginPath(); c.moveTo(L.x + 20, L.y); c.lineTo(L.x + 34, L.y - 18); c.lineTo(L.x + 48, L.y); c.moveTo(L.x + L.w - 48, L.y); c.lineTo(L.x + L.w - 34, L.y - 18); c.lineTo(L.x + L.w - 20, L.y); c.fill(); }
  if (T === 'mall') { c.fillStyle = '#ffd166'; for (let i = 0; i < 8; i++) { circ(c, L.x + 20 + i * ((L.w - 40) / 7), L.y + roofH + 6, 2.2); c.fill(); } c.fillStyle = '#a23e72'; rr(c, L.named.door.x + 30, L.y + L.h + 26, 26, 20, 3); c.fill(); signText(c, '售票', L.named.door.x + 43, L.y + L.h + 36, 7, '#fff', 'rgba(0,0,0,0)'); }
  if (T === 'gym') { c.fillStyle = '#444'; c.fillRect(cx - 16, ry - 2, 32, 4); c.fillRect(cx - 20, ry - 8, 6, 16); c.fillRect(cx + 14, ry - 8, 6, 16); c.fillStyle = '#4caf50'; c.fillRect(L.x + 10, L.y + L.h + 18, 50, 26); }
  if (T === 'flower') { for (let i = 0; i < 6; i++) { const x = L.x + 12 + i * 20, y = L.y - 18; c.fillStyle = '#795548'; c.fillRect(x - 5, y, 10, 8); c.fillStyle = ['#e91e63', '#ffeb3b', '#ff5722', '#9c27b0', '#fff', '#f06292'][i]; circ(c, x - 3, y - 2, 3); c.fill(); circ(c, x + 3, y - 1, 3); c.fill(); circ(c, x, y - 5, 3); c.fill(); } }
  if (T === 'market') { for (let i = 0; i < 3; i++) { const x = L.x + L.w - 30 - i * 14, y = L.y - 22; c.strokeStyle = '#90a4ae'; c.lineWidth = 1.5; c.strokeRect(x, y, 10, 7); } }
  if (T === 'cafe') { const p = L.named.counter; c.fillStyle = '#8d6e63'; rr(c, p.x - 14, p.y + 1, 28, 9, 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(p.x - 10, p.y - 3, 5, 4); c.fillRect(p.x + 4, p.y - 3, 5, 4); }
  drawSeatsAndTables(c, L);
  // 招牌
  const label = (L.emoji ? L.emoji + ' ' : '') + L.name;
  signText(c, label, cx, L.type === 'house' ? L.y + roofH / 2 : L.y + Math.min(roofH / 2, 20), L.type === 'house' ? 9 : 12);
}
function drawPark(c, L) {
  const bx = L.bx, by = L.by;
  c.fillStyle = '#93c973'; c.fillRect(bx, by, 420, 360);
  c.strokeStyle = '#e3d3a8'; c.lineWidth = 14; ell(c, bx + 210, by + 180, 170, 140); c.stroke();
  c.lineWidth = 10; c.beginPath(); c.moveTo(bx + 380, by + 180); c.lineTo(bx + 420, by + 180); c.stroke();
  const p = L.pond;
  c.fillStyle = '#6fb7d6'; ell(c, p.x, p.y, p.rx + 5, p.ry + 5); c.fill();
  c.fillStyle = '#4fa3c7'; ell(c, p.x, p.y, p.rx, p.ry); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)';
  const t = G.realT;
  for (let i = 0; i < 4; i++) { ell(c, p.x - 30 + i * 20 + Math.sin(t + i) * 3, p.y - 10 + (i % 2) * 18, 7, 1.5); c.fill(); }
  c.fillStyle = '#4caf50'; circ(c, p.x - 40, p.y + 15, 5); c.fill(); circ(c, p.x + 35, p.y - 18, 4); c.fill();
  // 小鸭子
  const dx = p.x + Math.cos(t * 0.3) * 40, dy = p.y + Math.sin(t * 0.3) * 22;
  c.fillStyle = '#fff59d'; ell(c, dx, dy, 4, 3); c.fill(); circ(c, dx + 3 * Math.sign(-Math.sin(t * 0.3) || 1), dy - 3, 2); c.fill();
  // 舞台
  const s = L.named.stage; c.fillStyle = '#a1887f'; rr(c, s.x - 22, s.y - 8, 44, 16, 3); c.fill(); c.fillStyle = '#8d6e63'; c.fillRect(s.x - 22, s.y + 6, 44, 4);
  c.fillStyle = '#5d4037'; c.fillRect(s.x + 16, s.y - 2, 6, 5);   // 琴盒
  // 入口
  c.fillStyle = '#6d4c41'; c.fillRect(bx + 412, by + 160, 6, 10); c.fillRect(bx + 412, by + 190, 6, 10);
  drawSeatsAndTables(c, L);
  signText(c, '🌳 中央公园', bx + 210, by + 20, 12);
}
function drawFun(c, L) {
  const bx = L.bx, by = L.by, t = G.realT;
  c.fillStyle = '#f2e3c4'; c.fillRect(bx, by, 420, 360);
  c.fillStyle = 'rgba(255,255,255,.4)';
  for (let x = 0; x < 420; x += 30) for (let y = 0; y < 360; y += 30) if (((x + y) / 30) % 2 === 0) c.fillRect(bx + x, by + y, 30, 30);
  // 大门
  c.fillStyle = '#e63946'; c.fillRect(bx + 180, by + 2, 6, 22); c.fillRect(bx + 234, by + 2, 6, 22);
  c.fillStyle = '#ffb703'; rr(c, bx + 174, by - 4, 72, 12, 4); c.fill();
  // 摩天轮
  const w = L.wheel, R = 58;
  c.strokeStyle = '#9aa5b1'; c.lineWidth = 4; c.beginPath(); c.moveTo(w.x - 30, w.y + 78); c.lineTo(w.x, w.y); c.lineTo(w.x + 30, w.y + 78); c.stroke();
  c.strokeStyle = '#d0d7de'; c.lineWidth = 2.5; circ(c, w.x, w.y, R); c.stroke();
  c.lineWidth = 1;
  const cols = ['#e63946', '#ffb703', '#219ebc', '#8ecae6', '#fb8500', '#a8dadc', '#f72585', '#4cc9f0'];
  for (let i = 0; i < 8; i++) {
    const a = t * 0.15 + i * Math.PI / 4, gx = w.x + Math.cos(a) * R, gy = w.y + Math.sin(a) * R;
    c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(gx, gy); c.stroke();
    c.fillStyle = cols[i]; rr(c, gx - 6, gy - 2, 12, 10, 3); c.fill();
  }
  c.fillStyle = '#555'; circ(c, w.x, w.y, 5); c.fill();
  // 旋转木马
  const k = L.carousel;
  c.fillStyle = '#ffe5ec'; circ(c, k.x, k.y, 36); c.fill();
  for (let i = 0; i < 6; i++) { const a = -t * 0.6 + i * Math.PI / 3; c.fillStyle = ['#fff', '#ffc8dd', '#bde0fe'][i % 3]; ell(c, k.x + Math.cos(a) * 26, k.y + Math.sin(a) * 18, 5, 3.5); c.fill(); }
  for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#f72585' : '#fff'; c.beginPath(); c.moveTo(k.x, k.y - 34); c.arc(k.x, k.y - 34, 20, Math.PI + i * Math.PI / 12, Math.PI + (i + 1) * Math.PI / 12); c.fill(); }
  // 冰淇淋车
  const ic = L.named.icecream;
  c.fillStyle = '#ffafcc'; rr(c, ic.x - 18, ic.y + 2, 36, 12, 3); c.fill(); c.fillStyle = '#222'; circ(c, ic.x - 10, ic.y + 15, 3); c.fill(); circ(c, ic.x + 10, ic.y + 15, 3); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(ic.x - 20, ic.y - 24); c.lineTo(ic.x, ic.y - 34); c.lineTo(ic.x + 20, ic.y - 24); c.fill();
  c.fillStyle = '#ff8fab'; c.fillRect(ic.x - 1, ic.y - 24, 2, 26);
  // 气球
  for (let i = 0; i < 4; i++) { const x = bx + 60 + i * 9, y = by + 300 + Math.sin(t * 1.5 + i) * 3; c.strokeStyle = '#999'; c.beginPath(); c.moveTo(x, y); c.lineTo(bx + 72, by + 330); c.stroke(); c.fillStyle = cols[i + 2]; ell(c, x, y, 5, 6); c.fill(); }
  drawSeatsAndTables(c, L);
  signText(c, '🎡 欢乐游乐园', bx + 210, by + 30, 12);
}

/* ---------- 小人 ---------- */
const LONG_SLEEVE = new Set(['hoodie', 'jacket', 'suit', 'labcoat', 'uniform', 'cardigan', 'tang', 'sailor']);
function drawPerson(c, a, x, y, o = {}) {
  const lk = a.look, H = lk.h || 1, Wd = lk.w || 1;
  const pose = o.pose || 'stand', moving = o.moving, ph = o.phase || 0;
  c.save(); c.translate(x, y);
  if (o.scale) c.scale(o.scale, o.scale);
  c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, 0, 0, 7 * Wd, 2.4); c.fill();
  if (o.facing < 0) c.scale(-1, 1);
  if (o.bike) drawBike(c, a);
  if (pose === 'pushup') { drawPushup(c, a, ph); c.restore(); return; }
  const sw = moving ? Math.sin(ph) : 0;
  const run = pose === 'run';
  const bob = moving ? Math.abs(Math.sin(ph)) * (run ? 1.6 : 0.8) : (pose === 'dance' ? Math.abs(Math.sin(G.realT * 6)) * 2 : 0);
  const sit = pose === 'sit' || o.bike;
  const legL = 10 * H, torL = 10 * H;
  const hipY = (sit ? -6 : -legL) - bob, shY = hipY - torL, hy = shY - 4.6;
  const tw = 4.4 * Wd, sk = lk.skin, top = lk.top, bot = lk.bottom;
  const legCol = ['pants', 'overalls'].includes(bot.t) ? bot.c : sk;
  const acc = lk.acc || [];
  // 背后的东西
  if (acc.includes('backpack')) { c.fillStyle = '#c0392b'; rr(c, -tw - 3.5, shY + 1, 5, 8, 2); c.fill(); }
  if (acc.includes('box')) { c.fillStyle = '#ffd400'; c.fillRect(-tw - 8, shY - 4, 9, 11); c.fillStyle = '#333'; c.font = 'bold 4px sans-serif'; c.fillText('外卖', -tw - 7.5, shY + 3); }
  if (acc.includes('guitar') && pose !== 'guitar') { c.fillStyle = '#8d5524'; c.save(); c.translate(-tw - 1, shY + 6); c.rotate(-0.5); ell(c, 0, 3, 3.5, 4.5); c.fill(); c.fillRect(-0.8, -9, 1.6, 9); c.restore(); }
  hairBack(c, lk, hy);
  // 腿
  c.lineCap = 'round';
  const leg = (sx, k) => {
    c.strokeStyle = legCol; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(sx, hipY);
    if (sit) { c.lineTo(sx + 5, hipY + 0.5); c.lineTo(sx + 5.5, -0.5); }
    else c.lineTo(sx + k * sw * (run ? 5 : 3.5), -0.6);
    c.stroke();
    if (bot.t === 'shorts') { c.strokeStyle = bot.c; c.lineWidth = 3; c.beginPath(); c.moveTo(sx, hipY); c.lineTo(sit ? sx + 3 : sx + k * sw * 1.3, hipY + (sit ? 0.5 : 4)); c.stroke(); }
    c.fillStyle = lk.shoes || '#222';
    const fx = sit ? sx + 6 : sx + k * sw * (run ? 5 : 3.5);
    ell(c, fx + 0.8, -0.4, 1.9, 1.1); c.fill();
  };
  leg(-1.7, 1); leg(1.7, -1);
  // 身体
  const dress = top.t === 'dress';
  const bodyCol = top.t === 'none' || top.t === 'crop' ? sk : top.c;
  if (dress) {
    c.fillStyle = top.c; c.beginPath(); c.moveTo(-tw + 0.6, shY); c.lineTo(tw - 0.6, shY); c.lineTo(tw + 3, hipY + 5); c.lineTo(-tw - 3, hipY + 5); c.closePath(); c.fill();
    c.fillStyle = top.c2 || '#fff'; c.fillRect(-tw - 3, hipY + 3.6, tw * 2 + 6, 1.4);
  } else {
    c.fillStyle = bodyCol; rr(c, -tw, shY, tw * 2, torL + 0.5, 2.2); c.fill();
    if (top.t === 'crop') { c.fillStyle = top.c; rr(c, -tw, shY, tw * 2, torL * 0.55, 2); c.fill(); }
    if (top.t === 'tank') { c.fillStyle = top.c; rr(c, -tw + 1.2, shY + 1, tw * 2 - 2.4, torL - 0.5, 2); c.fill(); }
    if (top.t === 'none') { c.fillStyle = shade(sk, -0.18); circ(c, 0.6, hipY - 3, 0.5); c.fill(); }
    if (top.t === 'suit') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-1.8, shY); c.lineTo(1.8, shY); c.lineTo(0, shY + 5); c.fill(); c.fillStyle = top.c2; c.fillRect(-0.6, shY + 1, 1.2, 5); }
    if (top.t === 'jacket' || top.t === 'cardigan' || top.t === 'labcoat') { c.fillStyle = top.c2 || '#fff'; c.fillRect(-1.3, shY + 0.5, 2.6, torL); }
    if (top.t === 'labcoat') { c.fillStyle = top.c; c.fillRect(-tw, hipY - 1, tw * 2, 4.5); }
    if (top.t === 'hoodie') { c.fillStyle = shade(top.c, -0.2); rr(c, -tw + 0.5, shY - 1.5, 4, 3, 1.5); c.fill(); c.fillRect(-2.5, hipY - 4, 5, 2.5); }
    if (top.t === 'apron') { c.fillStyle = top.c2; rr(c, -tw, shY, tw * 2, torL + 0.5, 2.2); c.fill(); c.fillStyle = top.c; c.fillRect(-tw + 1.2, shY + 2.5, tw * 2 - 2.4, torL + 2); }
    if (top.t === 'stripe') { c.fillStyle = top.c2; for (let k = 1; k < torL; k += 2.6) c.fillRect(-tw, shY + k, tw * 2, 1.2); }
    if (top.t === 'sailor') { c.fillStyle = top.c2; c.fillRect(-tw, shY, tw * 2, 2.4); c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(0, shY + 3); c.lineTo(-2, shY + 5.5); c.lineTo(2, shY + 5.5); c.fill(); }
    if (top.t === 'tang') { c.fillStyle = top.c2; for (let k = 2; k < torL; k += 2.5) c.fillRect(-1.2, shY + k, 2.4, 0.9); }
    if (top.t === 'uniform') { c.fillStyle = top.c2; c.fillRect(-tw, shY + torL * 0.55, tw * 2, 1.4); c.fillRect(1, shY + 2, 2, 2); }
    if (top.t === 'vest') { c.fillStyle = top.c2; rr(c, -tw, shY, tw * 2, torL + 0.5, 2.2); c.fill(); c.fillStyle = top.c; c.fillRect(-tw, shY, tw - 1, torL); c.fillRect(1, shY, tw - 1, torL); }
    if (top.t === 'tee' && top.c2) { c.fillStyle = top.c2; circ(c, 0.5, shY + 4.5, 1.6); c.fill(); }
  }
  if (bot.t === 'skirt') { c.fillStyle = bot.c; c.beginPath(); c.moveTo(-tw, hipY - 1.5); c.lineTo(tw, hipY - 1.5); c.lineTo(tw + 2.4, hipY + 4); c.lineTo(-tw - 2.4, hipY + 4); c.closePath(); c.fill(); }
  if (bot.t === 'briefs') { c.fillStyle = bot.c; rr(c, -tw + 0.3, hipY - 2.2, tw * 2 - 0.6, 3.6, 1.2); c.fill(); }
  if (bot.t === 'overalls') { c.fillStyle = bot.c; c.fillRect(-tw + 1, shY + 4, tw * 2 - 2, torL - 3); c.fillRect(-tw + 1.3, shY, 1.2, 4); c.fillRect(tw - 2.5, shY, 1.2, 4); }
  if (bot.t === 'pants' || bot.t === 'shorts') { c.fillStyle = bot.c; c.fillRect(-tw, hipY - 1.5, tw * 2, 2.5); }
  // 胸口字母
  if (o.zoom > 1.7 && !dress) { c.save(); if (o.facing < 0) c.scale(-1, 1); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; c.strokeText(a.id, 0, shY + torL * 0.55); c.fillText(a.id, 0, shY + torL * 0.55); c.restore(); }
  if (acc.includes('tattoo')) { c.fillStyle = '#1e3a5f'; c.fillRect(tw - 0.5, shY + 3, 1.2, 3); }
  if (acc.includes('scarf')) { c.fillStyle = '#e76f51'; c.fillRect(-tw + 0.5, shY - 0.5, tw * 2 - 1, 2.2); c.fillRect(1, shY, 1.8, 6); }
  // 胳膊
  const sleeve = LONG_SLEEVE.has(top.t) ? top.c : sk;
  const short = ['tee', 'stripe', 'dress', 'apron', 'vest'].includes(top.t) ? (top.t === 'apron' || top.t === 'vest' ? top.c2 : top.c) : null;
  const arm = (side, hx, hy2) => {
    const sx = side * (tw + 0.2), sy = shY + 1.2;
    c.strokeStyle = sleeve; c.lineWidth = 2.2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy2); c.stroke();
    if (short && !LONG_SLEEVE.has(top.t)) { c.strokeStyle = short; c.lineWidth = 2.6; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (hx - sx) * 0.35, sy + (hy2 - sy) * 0.35); c.stroke(); }
    c.fillStyle = sk; circ(c, hx, hy2, 1.3); c.fill();
  };
  const t = G.realT;
  let hand = [[-tw - 1 + (-sw * 3), shY + 8], [tw + 1 + sw * 3, shY + 8]];
  if (sit) hand = [[-tw + 3, hipY - 1], [tw + 2, hipY - 1]];
  if (pose === 'wave') hand = [[-tw - 1, shY + 8], [tw + 3 + Math.sin(t * 8) * 2.5, shY - 7]];
  if (pose === 'taichi') { const k = Math.sin(t * 1.2); hand = [[-tw - 3 - k * 2, shY + 2 + k * 2], [tw + 4 + k * 2, shY + 3 - k * 2]]; }
  if (pose === 'dance') { const k = Math.sin(t * 6); hand = [[-tw - 3, shY - 4 + k * 4], [tw + 3, shY - 4 - k * 4]]; }
  if (pose === 'selfie' || o.phone) hand = [hand[0], [tw + (pose === 'selfie' ? 5 : 0.5), pose === 'selfie' ? shY - 6 : hy + 1]];
  if (pose === 'guitar') hand = [[-1, shY + 6], [2.5 + Math.sin(t * 9) * 0.8, shY + 7.5]];
  if (run && !moving) hand = [[-tw - 1, shY + 8], [tw + 1, shY + 8]];
  arm(-1, ...hand[0]);
  if (pose === 'guitar') { c.save(); c.translate(0, shY + 7); c.rotate(-0.35); c.fillStyle = '#b5651d'; ell(c, -1, 0, 4.2, 3.4); c.fill(); c.fillStyle = '#3e2723'; circ(c, -1, 0, 1); c.fill(); c.fillStyle = '#5d4037'; c.fillRect(2.5, -0.8, 9, 1.6); c.restore(); }
  arm(1, ...hand[1]);
  if (pose === 'selfie' || o.phone) { c.fillStyle = '#222'; rr(c, hand[1][0] - 1.2, hand[1][1] - 2.2, 2.4, 4, 0.6); c.fill(); }
  if (acc.includes('handbag')) { c.fillStyle = '#ff006e'; rr(c, hand[0][0] - 2, hand[0][1] - 0.5, 4, 3.4, 1); c.fill(); }
  if (acc.includes('briefcase')) { c.fillStyle = '#4e342e'; c.fillRect(hand[0][0] - 2.5, hand[0][1], 5, 3.5); }
  if (acc.includes('cane')) { c.strokeStyle = '#6d4c41'; c.lineWidth = 1; c.beginPath(); c.moveTo(hand[1][0], hand[1][1]); c.lineTo(hand[1][0] + 1, 0); c.stroke(); }
  // 头
  c.fillStyle = sk; circ(c, 0, hy, 4.6); c.fill();
  if (acc.includes('earring')) { c.fillStyle = '#ffd700'; circ(c, -0.5, hy + 3.2, 0.6); c.fill(); }
  // 脸
  const ex = 1.0;
  if (o.sleep) { c.strokeStyle = '#333'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(ex - 1.8, hy - 0.2); c.lineTo(ex - 0.6, hy - 0.2); c.moveTo(ex + 0.8, hy - 0.2); c.lineTo(ex + 2, hy - 0.2); c.stroke(); }
  else { c.fillStyle = '#222'; circ(c, ex - 1.2, hy - 0.3, 0.55); c.fill(); circ(c, ex + 1.4, hy - 0.3, 0.55); c.fill(); }
  if (acc.includes('blush')) { c.fillStyle = 'rgba(255,120,150,.55)'; circ(c, ex - 2, hy + 1.4, 0.9); c.fill(); circ(c, ex + 2.5, hy + 1.4, 0.9); c.fill(); }
  c.fillStyle = '#7a2e2e';
  if (o.talk && Math.sin(t * 18) > 0) { ell(c, ex + 0.2, hy + 2, 0.9, 0.7); c.fill(); } else { c.fillRect(ex - 0.5, hy + 1.8, 1.4, 0.45); }
  if (acc.includes('glasses')) { c.strokeStyle = '#333'; c.lineWidth = 0.45; circ(c, ex - 1.2, hy - 0.3, 1.25); c.stroke(); circ(c, ex + 1.4, hy - 0.3, 1.25); c.stroke(); }
  if (acc.includes('sunglasses')) { c.fillStyle = '#111'; rr(c, ex - 2.6, hy - 1.3, 5.6, 1.9, 0.8); c.fill(); }
  if (acc.includes('beard')) { c.fillStyle = lk.hair.c === '#dddddd' ? '#eeeeee' : shade(lk.hair.c, 0.1); c.beginPath(); c.arc(0.4, hy + 0.8, 4, 0.15 * Math.PI, 0.85 * Math.PI); c.fill(); }
  if (acc.includes('bigbeard')) { c.fillStyle = '#4e342e'; c.beginPath(); c.moveTo(-3.5, hy + 0.5); c.quadraticCurveTo(0.5, hy + 10, 4.3, hy + 0.5); c.fill(); }
  if (acc.includes('mustache')) { c.fillStyle = '#222'; c.fillRect(ex - 1.4, hy + 1, 3.2, 0.9); }
  hairFront(c, lk, hy);
  hat(c, lk, hy);
  if (acc.includes('headphones')) { c.strokeStyle = '#222'; c.lineWidth = 0.9; c.beginPath(); c.arc(0, hy, 5, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.fillStyle = '#ef233c'; rr(c, -1.2, hy - 1.5, 2.4, 3.4, 1); c.fill(); }
  if (o.phone && pose !== 'selfie') { c.fillStyle = '#222'; rr(c, 3.4, hy - 1.2, 1.6, 3.6, 0.5); c.fill(); }
  c.restore();
}
function hairBack(c, lk, hy) {
  const h = lk.hair, col = h.c;
  c.fillStyle = col;
  if (h.s === 'long' || h.s === 'wavy') { rr(c, -5.2, hy - 2.5, 9.6, 10, 3); c.fill(); if (h.s === 'wavy') { for (let i = 0; i < 4; i++) { circ(c, -4.5 + i * 2.7, hy + 7.5, 1.5); c.fill(); } } }
  if (h.s === 'ponytail') { ell(c, -5.4, hy + 1.8, 1.8, 4.2); c.fill(); }
  if (h.s === 'pigtails') { circ(c, -5.6, hy + 2.5, 2.4); c.fill(); circ(c, 5.4, hy + 2.5, 2.4); c.fill(); c.fillStyle = '#fff'; circ(c, -5.2, hy + 0.4, 0.9); c.fill(); circ(c, 5, hy + 0.4, 0.9); c.fill(); }
  if (h.s === 'afro') { circ(c, 0, hy - 1.5, 7.4); c.fill(); }
  if (h.s === 'perm') { for (let i = 0; i < 9; i++) { const a = Math.PI * (0.9 + i * 0.15); circ(c, Math.cos(a) * 5, hy + Math.sin(a) * 5 + 0.5, 2.4); c.fill(); } }
  if (h.s === 'bob') { rr(c, -5.2, hy - 2.6, 10, 6.6, 2.5); c.fill(); }
}
function hairFront(c, lk, hy) {
  const h = lk.hair, col = h.c;
  c.fillStyle = col;
  if (h.s === 'bald') { c.fillStyle = 'rgba(255,255,255,.35)'; circ(c, 1.2, hy - 3, 1); c.fill(); return; }
  if (h.s === 'afro' || h.s === 'perm') { c.beginPath(); c.arc(0, hy, 4.9, Math.PI * 1.0, Math.PI * 2.0); c.fill(); return; }
  c.beginPath(); c.arc(0, hy - 0.2, 4.9, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(4.4, hy - 1); c.lineTo(-3, hy - 1.4); c.closePath(); c.fill();
  if (h.s === 'bob' || h.s === 'long' || h.s === 'wavy') { c.fillRect(-5, hy - 2, 1.8, 5); }
  if (h.s === 'messy') { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-3 + i * 2, hy - 4); c.lineTo(-2.5 + i * 2 + (i % 2 ? 1.6 : -1.2), hy - 7); c.lineTo(-1.5 + i * 2, hy - 4); c.fill(); } }
  if (h.s === 'mohawk') { c.fillRect(-0.9, hy - 9.5, 2.4, 6); c.beginPath(); c.moveTo(-0.9, hy - 9.5); c.lineTo(3, hy - 8); c.lineTo(1.5, hy - 4); c.fill(); }
  if (h.s === 'bun') { circ(c, -0.5, hy - 5.6, 2.4); c.fill(); }
  if (h.s === 'curly') { for (let i = 0; i < 6; i++) { const a = Math.PI * (1.05 + i * 0.18); circ(c, Math.cos(a) * 4.6, hy + Math.sin(a) * 4.6, 1.7); c.fill(); } }
  if (h.s === 'slick') { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.5; c.beginPath(); c.arc(0, hy, 3.6, Math.PI * 1.2, Math.PI * 1.7); c.stroke(); }
}
function hat(c, lk, hy) {
  const h = lk.hat; if (!h) return;
  const top = hy - 4.4;
  c.fillStyle = h.c;
  switch (h.t) {
    case 'cap': c.beginPath(); c.arc(0, hy - 1, 5, Math.PI, 0); c.fill(); c.fillRect(2, hy - 1.6, 5, 1.4); break;
    case 'chef': c.fillRect(-3.8, top - 3, 7.6, 4); circ(c, -2.4, top - 4, 2.6); c.fill(); circ(c, 2.4, top - 4, 2.6); c.fill(); circ(c, 0, top - 5.6, 2.8); c.fill(); break;
    case 'beret': ell(c, -0.5, top + 0.6, 5.6, 2); c.fill(); circ(c, -0.5, top - 1.4, 0.8); c.fill(); break;
    case 'helmet': c.beginPath(); c.arc(0, hy - 0.5, 5.6, Math.PI, 0); c.fill(); c.fillStyle = '#333'; c.fillRect(-0.6, hy - 6, 1.2, 5.5); break;
    case 'bunny': ell(c, -2, top - 4, 1.4, 4.4); c.fill(); ell(c, 2.2, top - 4.4, 1.4, 4.4); c.fill(); c.fillStyle = '#ffb3c6'; ell(c, -2, top - 4, 0.6, 3); c.fill(); ell(c, 2.2, top - 4.4, 0.6, 3); c.fill(); break;
    case 'police': c.fillRect(-5, top - 0.6, 10, 2.4); rr(c, -4.6, top - 3.4, 9.2, 3.2, 1); c.fill(); c.fillStyle = '#ffd700'; circ(c, 1, top - 1.8, 0.9); c.fill(); c.fillStyle = '#111'; c.fillRect(1.5, top + 1.2, 4.6, 1); break;
    case 'straw': ell(c, 0, top + 1.5, 8, 2); c.fill(); c.beginPath(); c.arc(0, top + 1.5, 4, Math.PI, 0); c.fill(); c.fillStyle = '#e76f51'; c.fillRect(-4, top, 8, 1.1); break;
    case 'beanie': c.beginPath(); c.arc(0, hy - 0.8, 5.1, Math.PI, 0); c.fill(); c.fillStyle = shade(h.c, -0.2); c.fillRect(-5.1, hy - 1.8, 10.2, 1.8); c.fillStyle = '#fff'; circ(c, 0, top - 1.4, 1.4); c.fill(); break;
    case 'tiara': c.beginPath(); c.moveTo(-3, top + 0.8); c.lineTo(-2, top - 1.6); c.lineTo(-0.8, top + 0.2); c.lineTo(0.3, top - 2.6); c.lineTo(1.4, top + 0.2); c.lineTo(2.6, top - 1.6); c.lineTo(3.4, top + 0.8); c.fill(); c.fillStyle = '#ff006e'; circ(c, 0.3, top - 0.5, 0.6); c.fill(); break;
    case 'fireman': c.beginPath(); c.arc(0, hy - 0.8, 5.4, Math.PI, 0); c.fill(); c.fillRect(-7, hy - 1.6, 4, 1.4); c.fillStyle = '#ffd60a'; c.fillRect(1.5, hy - 5.5, 2.4, 3); break;
    case 'catears': c.beginPath(); c.moveTo(-4.2, top + 1.5); c.lineTo(-3.4, top - 3); c.lineTo(-1, top + 0.5); c.fill(); c.beginPath(); c.moveTo(1, top + 0.5); c.lineTo(3.4, top - 3); c.lineTo(4.2, top + 1.5); c.fill(); break;
    case 'nurse': c.fillStyle = '#fff'; rr(c, -3.4, top - 2, 6.8, 2.8, 0.8); c.fill(); c.fillStyle = '#e63946'; c.fillRect(-0.4, top - 1.7, 0.8, 2.2); c.fillRect(-1.1, top - 1, 2.2, 0.8); break;
  }
}
function drawPushup(c, a, ph) {
  const lk = a.look, k = Math.abs(Math.sin(G.realT * 3)) * 2.2;
  c.fillStyle = lk.bottom.c; c.fillRect(-10, -3 - k * 0.3, 7, 2.4);
  c.fillStyle = lk.top.c; c.fillRect(-3, -4 - k * 0.6, 9, 3.2);
  c.strokeStyle = lk.skin; c.lineWidth = 1.8; c.beginPath(); c.moveTo(4, -2.5 - k * 0.6); c.lineTo(4.5, 0); c.stroke();
  c.fillStyle = lk.skin; circ(c, 8.5, -4.5 - k * 0.7, 3.4); c.fill();
  hairFront(c, lk, -4.2 - k * 0.7);
  c.fillStyle = lk.shoes; circ(c, -11, -1, 1.3); c.fill();
}
function drawBike(c) {
  c.strokeStyle = '#333'; c.lineWidth = 0.9;
  circ(c, -6, -3.5, 3.5); c.stroke(); circ(c, 7, -3.5, 3.5); c.stroke();
  c.strokeStyle = '#2a9d8f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, -3.5); c.lineTo(0, -6); c.lineTo(7, -3.5); c.moveTo(0, -6); c.lineTo(5, -10); c.stroke();
}
function drawDog(c, d, facing) {
  c.save(); c.translate(d.x, d.y); if (facing < 0) c.scale(-1, 1);
  c.fillStyle = 'rgba(0,0,0,.18)'; ell(c, 0, 0, 4, 1.4); c.fill();
  c.fillStyle = '#fff'; ell(c, 0, -3.5, 4, 2.6); c.fill(); circ(c, 3.8, -6, 2.4); c.fill(); circ(c, -4, -5.5, 1.4); c.fill();
  c.strokeStyle = '#eee'; c.lineWidth = 1.1; const k = Math.sin(d.phase) * 1.4; c.beginPath(); c.moveTo(-2, -1.5); c.lineTo(-2 + k, 0); c.moveTo(2, -1.5); c.lineTo(2 - k, 0); c.stroke();
  c.fillStyle = '#222'; circ(c, 4.6, -6.4, 0.5); c.fill(); c.fillStyle = '#ff8fab'; circ(c, 2.5, -8, 0.9); c.fill();
  c.restore();
}
function drawCar(c, car) {
  const p = car.lanePos();
  c.save(); c.translate(p.x, p.y); c.rotate(car.hd);
  c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, -12, -5, 26, 13, 4); c.fill();
  const own = car.kind === 'own', w = own && car.owner && car.owner.id === 'S' ? 28 : 24;
  c.fillStyle = car.color; rr(c, -w / 2, -6.5, w, 13, 4); c.fill();
  c.fillStyle = 'rgba(30,40,60,.75)'; rr(c, w / 2 - 9, -5, 4, 10, 1.4); c.fill(); rr(c, -w / 2 + 3, -4.5, 3.5, 9, 1.4); c.fill();
  c.fillStyle = shade(car.color, -0.12); rr(c, -w / 2 + 7, -5, w - 17, 10, 2); c.fill();
  if (car.kind === 'taxi') { c.fillStyle = '#222'; c.fillRect(-3, -2.3, 6, 4.6); c.fillStyle = '#ffeb3b'; c.font = 'bold 3px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', 0, 0.2); }
  c.fillStyle = '#fffde7'; c.fillRect(w / 2 - 1.5, -5.5, 1.5, 2.4); c.fillRect(w / 2 - 1.5, 3.1, 1.5, 2.4);
  c.fillStyle = '#d32f2f'; c.fillRect(-w / 2, -5.5, 1.2, 2.2); c.fillRect(-w / 2, 3.3, 1.2, 2.2);
  c.restore();
}

/* ---------- 每个视窗 ---------- */
let hitTargets = [], viewsNow = [];
function w2s(v, p) { return { x: v.x + v.w / 2 + (p.x - v.cam.x) * v.cam.z, y: v.y + v.h / 2 + (p.y - v.cam.y) * v.cam.z }; }
function s2w(v, sx, sy) { return { x: v.cam.x + (sx - v.x - v.w / 2) / v.cam.z, y: v.cam.y + (sy - v.y - v.h / 2) / v.cam.z }; }
function threadAnchor(a) {
  if (a.inCar) { const p = a.inCar.lanePos(); return { x: p.x, y: p.y - 4 }; }
  if (a.hidden && a.at && LOC[a.at] && LOC[a.at].x !== undefined) { const L = LOC[a.at]; return { x: L.x + L.w / 2, y: L.y + 6 }; }
  return { x: a.x, y: a.y - 16 * (a.look.h || 1) };
}

function renderView(v) {
  const c = ctx, z = v.cam.z;
  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.beginPath(); c.rect(v.x, v.y, v.w, v.h); c.clip();
  c.fillStyle = '#7fa66a'; c.fillRect(v.x, v.y, v.w, v.h);
  c.setTransform(DPR * z, 0, 0, DPR * z, DPR * (v.x + v.w / 2 - v.cam.x * z), DPR * (v.y + v.h / 2 - v.cam.y * z));
  const B = { x0: v.cam.x - v.w / 2 / z - 40, x1: v.cam.x + v.w / 2 / z + 40, y0: v.cam.y - v.h / 2 / z - 60, y1: v.cam.y + v.h / 2 / z + 60 };
  const inB = (x, y, m = 0) => x > B.x0 - m && x < B.x1 + m && y > B.y0 - m && y < B.y1 + m;
  drawGround(c, B);
  for (const L of BUILDINGS) {
    if (L.kind === 'area') { if (inB(L.bx + 210, L.by + 180, 300)) (L.id === 'park' ? drawPark : drawFun)(c, L); }
  }
  // K 警官的岗亭
  const post = LOC.corner.named.post; c.fillStyle = '#f5f5f5'; ell(c, post.x, post.y + 1, 9, 4); c.fill(); c.strokeStyle = '#e53935'; c.lineWidth = 1.5; c.stroke();
  for (const L of BUILDINGS) if (L.kind !== 'area' && inB(L.x + L.w / 2, L.y + L.h / 2, 260)) drawBuilding(c, L);
  // 会动的东西按 y 排序
  const objs = [];
  for (const t of TREES) if (inB(t.x, t.y, 30)) objs.push({ y: t.y, f: () => drawTree(c, t) });
  for (const l of LAMPS) if (inB(l.x, l.y, 30)) objs.push({ y: l.y, f: () => drawLamp(c, l) });
  for (const car of G.cars) { const p = car.lanePos(); if (inB(p.x, p.y, 30)) objs.push({ y: p.y, f: () => drawCar(c, car) }); }
  for (const a of G.agents) {
    if (a.hidden || a.inCar) continue;
    if (!inB(a.x, a.y, 40)) continue;
    const T = a.trip, bike = T && T.mode === 'bike' && a.moving;
    let pose = a.pose;
    if (a.moving) pose = a.goal && a.goal.mode === 'roam' && a.work.pose === 'run' ? 'run' : 'stand';
    if (a.lock === 'date') pose = 'sit';
    if (T && T.stage === 'wait') pose = 'wave';
    objs.push({ y: a.y, f: () => drawPerson(c, a, a.x, a.y, { pose, moving: a.moving, phase: a.phase, facing: a.facing, bike, phone: a.onPhone, talk: a.bubble && a.bubble.kind !== 'think', zoom: z }) });
    if (a.dog) objs.push({ y: a.dog.y, f: () => drawDog(c, a.dog, a.facing) });
  }
  objs.sort((p, q) => p.y - q.y);
  for (const o of objs) o.f();
  // 红线
  drawThreads(c, z);
  // 夜晚
  const n = nightAmt();
  if (n > 0) {
    c.fillStyle = `rgba(12,18,58,${0.58 * n})`; c.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0);
    c.globalCompositeOperation = 'lighter';
    for (const L of BUILDINGS) {
      if (!L.windows || !inB(L.x + L.w / 2, L.y + L.h / 2, 260)) continue;
      const occ = L.inside.size > 0;
      for (const w of L.windows) if (w.lit && (occ || w.ph > 6)) { c.fillStyle = `rgba(255,200,90,${0.55 * n})`; c.fillRect(w.x, w.y, w.w, w.h); }
    }
    for (const l of LAMPS) {
      if (!inB(l.x, l.y, 60)) continue;
      const g = c.createRadialGradient(l.x, l.y - 14, 1, l.x, l.y - 6, 40);
      g.addColorStop(0, `rgba(255,220,140,${0.45 * n})`); g.addColorStop(1, 'rgba(255,220,140,0)');
      c.fillStyle = g; circ(c, l.x, l.y - 6, 40); c.fill();
    }
    for (const car of G.cars) {
      if (car.park) continue;
      const p = car.lanePos(); if (!inB(p.x, p.y, 60)) continue;
      c.save(); c.translate(p.x, p.y); c.rotate(car.hd);
      const g = c.createLinearGradient(12, 0, 60, 0); g.addColorStop(0, `rgba(255,250,200,${0.4 * n})`); g.addColorStop(1, 'rgba(255,250,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(12, -4); c.lineTo(60, -16); c.lineTo(60, 16); c.lineTo(12, 4); c.fill(); c.restore();
    }
    const bar = LOC.bar; if (inB(bar.x, bar.y, 200)) { c.fillStyle = `rgba(255,60,200,${0.35 * n * (0.8 + 0.2 * Math.sin(G.realT * 5))})`; rr(c, bar.x + 20, bar.y + bar.h - bar.wallH - 4, bar.w - 40, 12, 6); c.fill(); }
    const w = LOC.fun.wheel; if (inB(w.x, w.y, 100)) { for (let i = 0; i < 16; i++) { const a = G.realT * 0.15 + i * Math.PI / 8; c.fillStyle = `hsla(${i * 22},100%,65%,${0.7 * n})`; circ(c, w.x + Math.cos(a) * 58, w.y + Math.sin(a) * 58, 2); c.fill(); } }
    c.globalCompositeOperation = 'source-over';
  }
  if (G.rain) { c.fillStyle = 'rgba(70,90,120,.16)'; c.fillRect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); }

  // ---------- 屏幕坐标层 ----------
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (G.rain) {
    c.strokeStyle = 'rgba(200,215,240,.45)'; c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < 110; i++) {
      const x = v.x + ((i * 97.13 + G.realT * 60) % v.w), y = v.y + ((i * 53.7 + G.realT * 700) % v.h);
      c.moveTo(x, y); c.lineTo(x - 3, y + 11);
    }
    c.stroke();
  }
  drawLabels(c, v);
  c.restore();
}

function drawThreads(c, z) {
  const t = G.realT;
  for (const cp of G.couples) {
    const A = threadAnchor(cp.a), Bp = threadAnchor(cp.b);
    const bind = (G.binds || []).find(b => b.c === cp);
    const prog = bind ? clamp(bind.t / 1.1, 0, 1) : 1;
    const d = dist(A, Bp), mx = (A.x + Bp.x) / 2, my = (A.y + Bp.y) / 2 + Math.min(70, d * 0.16) + Math.sin(t * 1.4 + cp.id) * 5;
    const width = (1.6 + cp.stage * 0.6) / z;
    c.strokeStyle = cp.stage >= 3 ? 'rgba(255,40,90,.95)' : 'rgba(225,25,45,.85)';
    c.lineWidth = Math.max(width, 0.6); c.lineCap = 'round';
    c.shadowColor = 'rgba(255,40,60,.7)'; c.shadowBlur = 6;
    c.beginPath(); c.moveTo(A.x, A.y);
    const N = 26;
    for (let i = 1; i <= N * prog; i++) { const u = i / N; c.lineTo((1 - u) * (1 - u) * A.x + 2 * u * (1 - u) * mx + u * u * Bp.x, (1 - u) * (1 - u) * A.y + 2 * u * (1 - u) * my + u * u * Bp.y); }
    c.stroke(); c.shadowBlur = 0;
    if (prog >= 1 && d < 90 && cp.stage >= 1 && Math.random() < 0.03) G.hearts.push({ x: mx, y: my - 20, vx: rand(-6, 6), vy: -rand(14, 24), t: 0, life: 1.6 });
  }
  for (const s of G.snaps) {
    const k = clamp(s.t / 1.4, 0, 1), mx = (s.a.x + s.b.x) / 2, my = (s.a.y + s.b.y) / 2;
    c.strokeStyle = `rgba(225,25,45,${1 - k})`; c.lineWidth = 2 / z;
    for (const [P, sgn] of [[s.a, 1], [s.b, -1]]) {
      const ex = lerp(mx, P.x, k), ey = lerp(my, P.y, k) + k * 30;
      c.beginPath(); c.moveTo(P.x, P.y); c.quadraticCurveTo((P.x + ex) / 2 + sgn * 10 * k, (P.y + ey) / 2 + 20 * k, ex, ey); c.stroke();
    }
  }
}

// 标签、名字、气泡（屏幕坐标）
function badgePos(v, a) {
  if (a.inCar) { const p = w2s(v, a.inCar.lanePos()); return { x: p.x + (a.driving ? -7 : 7) * Math.min(1, v.cam.z), y: p.y - 12 - 6 * v.cam.z }; }
  if (a.hidden && a.at && LOC[a.at] && LOC[a.at].x !== undefined) {
    const L = LOC[a.at], list = [...L.inside].sort((p, q) => p.id < q.id ? -1 : 1), i = list.indexOf(a);
    const base = w2s(v, { x: L.x + L.w / 2, y: L.y + 4 });
    const per = Math.max(4, Math.floor(L.w * v.cam.z / 20)), row = Math.floor(i / per), col = i % per, cnt = Math.min(per, list.length - row * per);
    return { x: base.x + (col - (cnt - 1) / 2) * 19, y: base.y + 10 + row * 19, inside: true };
  }
  const p = w2s(v, { x: a.x, y: a.y - 31 * (a.look.h || 1) - (a.look.hat ? 5 : 0) });
  return { x: p.x, y: p.y - 9 };
}
function drawLabels(c, v) {
  const z = v.cam.z, fz = fitZoom(v);
  const showNames = z > fz * 3.2;
  const focusSet = Director.focusSet();
  const marks = [];
  for (const a of G.agents) {
    const p = badgePos(v, a);
    if (p.x < v.x - 30 || p.x > v.x + v.w + 30 || p.y < v.y - 30 || p.y > v.y + v.h + 30) continue;
    marks.push({ a, p });
  }
  // 建筑里有人：小标题
  for (const L of BUILDINGS) {
    if (!L.inside.size) continue;
    const b = w2s(v, { x: L.x + L.w / 2, y: L.y + 4 });
    if (b.x < v.x - 60 || b.x > v.x + v.w + 60 || b.y < v.y - 60 || b.y > v.y + v.h + 60) continue;
    c.fillStyle = 'rgba(0,0,0,.35)';
    const per = Math.max(4, Math.floor(L.w * z / 20)), n = Math.min(per, L.inside.size), rows = Math.ceil(L.inside.size / per);
    rr(c, b.x - n * 9.5 - 4, b.y - 2, n * 19 + 8, rows * 19 + 4, 10); c.fill();
  }
  const r = clamp(7 + z * 1.6, 8.5, 12);
  const sel = UI.pending ? UI.pending.agent : null;
  for (const { a, p } of marks) {
    const hov = UI.hovered.has(a), foc = focusSet.has(a) || a === sel;
    const R = r * (hov || foc ? 1.25 : 1) * (p.inside ? 0.85 : 1);
    if (a === sel || hov) { c.strokeStyle = '#ff2d55'; c.lineWidth = 3; circ(c, p.x, p.y, R + 4 + Math.sin(G.realT * 8) * 1.5); c.stroke(); }
    c.fillStyle = a.color; circ(c, p.x, p.y, R); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = '#fff'; c.font = `900 ${Math.round(R * 1.15)}px "Arial Black",Arial,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(a.id, p.x, p.y + 0.5);
    if (a.partner) { c.font = `${Math.round(R * 0.9)}px sans-serif`; c.fillText(a.couple && a.couple.stage >= 2 ? '❤️' : '🧶', p.x + R * 0.95, p.y - R * 0.8); }
    if (a.goal && a.goal.act === 'sleep' && a.hidden) { c.font = `${Math.round(R * 0.8)}px sans-serif`; c.fillStyle = '#fff'; c.fillText('z', p.x - R, p.y - R); }
    if ((showNames || foc || hov) && !p.inside) {
      c.font = `600 11px "PingFang SC","Microsoft YaHei",sans-serif`;
      const tw = c.measureText(a.name).width;
      c.fillStyle = 'rgba(20,20,30,.72)'; rr(c, p.x + R + 3, p.y - 8, tw + 10, 16, 8); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(a.name, p.x + R + 8, p.y + 0.5);
    }
    hitTargets.push({ a, x: p.x, y: p.y, r: R + 10, v });
    a._bp = a._bp || {}; a._bp[v.key] = p;
  }
  // 漂浮数字
  for (const f of G.floats) {
    const base = f.ag && f.ag._bp && f.ag._bp[v.key] ? f.ag._bp[v.key] : w2s(v, f);
    const k = f.t / 1.8;
    c.globalAlpha = 1 - k; c.font = '800 14px sans-serif'; c.textAlign = 'center'; c.fillStyle = f.c; c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.strokeText(f.text, base.x + 16, base.y - 18 - k * 30); c.fillText(f.text, base.x + 16, base.y - 18 - k * 30); c.globalAlpha = 1;
  }
  for (const h of G.hearts) {
    const p = w2s(v, h), k = h.t / h.life;
    c.globalAlpha = 1 - k; c.fillStyle = '#ff3b6b'; c.font = `${Math.round(10 + z * 3)}px sans-serif`; c.textAlign = 'center'; c.fillText('❤', p.x, p.y); c.globalAlpha = 1;
  }
  // 气泡
  for (const { a, p } of marks) {
    const b = a.bubble; if (!b) continue;
    const scene = b.kind !== 'think';
    if (!scene && !(z > fz * 2.4 || focusSet.has(a) || UI.hovered.has(a))) continue;
    drawBubble(c, p.x, p.y - r - 6, (b.kind === 'phone' ? '📞 ' : '') + b.text, b, a);
  }
}
function wrapText(c, text, maxW) {
  const out = []; let line = '';
  for (const ch of text) {
    if (c.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch;
  }
  if (line) out.push(line);
  return out;
}
function drawBubble(c, x, y, text, b, a) {
  const think = b.kind === 'think';
  c.font = `${think ? 400 : 600} 13px "PingFang SC","Microsoft YaHei",sans-serif`;
  const lines = wrapText(c, text, 168), lh = 17;
  const w = Math.max(...lines.map(l => c.measureText(l).width)) + 18, h = lines.length * lh + 10;
  const fade = clamp(Math.min(b.t / 0.15, (b.dur - b.t) / 0.3), 0, 1);
  const bx = clamp(x - w / 2, 4, SW_ - w - 4), by = y - h - 8;
  c.globalAlpha = fade * (think ? 0.88 : 1);
  c.fillStyle = think ? '#f4f6fb' : b.kind === 'phone' ? '#e8fff1' : '#fff';
  c.strokeStyle = think ? 'rgba(0,0,0,.18)' : a.color; c.lineWidth = think ? 1 : 2;
  rr(c, bx, by, w, h, think ? 12 : 9); c.fill(); c.stroke();
  if (think) { circ(c, x - 3, by + h + 4, 3); c.fill(); c.stroke(); circ(c, x - 6, by + h + 10, 1.8); c.fill(); }
  else { c.beginPath(); c.moveTo(x - 6, by + h - 1); c.lineTo(x, by + h + 8); c.lineTo(x + 5, by + h - 1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - 6, by + h); c.lineTo(x, by + h + 8); c.lineTo(x + 5, by + h); c.stroke(); }
  c.fillStyle = think ? '#555' : '#1d1d28'; c.textAlign = 'left'; c.textBaseline = 'top';
  lines.forEach((l, i) => c.fillText(l, bx + 9, by + 6 + i * lh));
  c.textBaseline = 'middle'; c.globalAlpha = 1;
}
function fitZoom(v) { return Math.min(v.w / (WORLD_W + 40), v.h / (WORLD_H + 40)); }
