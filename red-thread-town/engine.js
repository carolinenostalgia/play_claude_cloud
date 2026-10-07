/* 红线小镇 · 引擎：城市路网、寻路、车辆、居民日程、恋爱与剧情、导演镜头。 */
'use strict';

const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const manh = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const fillT = (s, v) => s.replace(/\{(\w)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const lerp = (a, b, t) => a + (b - a) * t;

const SW = 25, LANE = 8;          // 人行道离路中心线的距离、车道偏移
const BASE_RATE = 3;              // 1 倍速时，每秒现实时间 = 3 游戏分钟
const WALK = 14, BIKE = 26, CAR = 40;   // 每游戏分钟走多少像素

const G = {
  t: 7.5 * 60,            // 游戏时间（分钟，从第 0 天 0 点起）
  speed: 1, realT: 0,
  agents: [], byId: {}, cars: [], couples: [], scenes: [],
  floats: [], snaps: [], hearts: [], log: [], rockets: [], sparks: [], confetti: [],
  rain: false, rainUntil: 0, nextWeather: 9 * 60,
};
const day = () => Math.floor(G.t / 1440);
const tod = () => G.t - day() * 1440;
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function clockStr(t = G.t) {
  const d = Math.floor(t / 1440), m = Math.floor(t - d * 1440);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function whenStr(t) {
  const dd = Math.floor(t / 1440) - day();
  return `${dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : 'the day after tomorrow'} at ${clockStr(t)}`;
}

/* ---------------- 路网 ---------------- */
function makeGraph() { return { nodes: [], adj: [], segs: [] }; }
function addEdge(g, a, b) {
  const w = dist(g.nodes[a], g.nodes[b]);
  g.adj[a].push({ to: b, w }); g.adj[b].push({ to: a, w }); g.segs.push({ a, b });
}
const SWG = makeGraph(), RDG = makeGraph();
const nx = ROAD_X.length, ny = ROAD_Y.length;
(function buildGraphs() {
  // 人行道：每个路口四个角
  const sid = (i, j, c) => (j * nx + i) * 4 + c;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) for (let c = 0; c < 4; c++) {
    SWG.nodes.push({ x: ROAD_X[i] + (c === 1 || c === 2 ? SW : -SW), y: ROAD_Y[j] + (c >= 2 ? SW : -SW) });
    SWG.adj.push([]);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    for (let c = 0; c < 4; c++) addEdge(SWG, sid(i, j, c), sid(i, j, (c + 1) % 4));   // 斑马线
    if (i + 1 < nx) { addEdge(SWG, sid(i, j, 1), sid(i + 1, j, 0)); addEdge(SWG, sid(i, j, 2), sid(i + 1, j, 3)); }
    if (j + 1 < ny) { addEdge(SWG, sid(i, j, 3), sid(i, j + 1, 0)); addEdge(SWG, sid(i, j, 2), sid(i, j + 1, 1)); }
  }
  // 车道：路口
  const rid = (i, j) => j * nx + i;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { RDG.nodes.push({ x: ROAD_X[i], y: ROAD_Y[j] }); RDG.adj.push([]); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (i + 1 < nx) addEdge(RDG, rid(i, j), rid(i + 1, j));
    if (j + 1 < ny) addEdge(RDG, rid(i, j), rid(i, j + 1));
  }
})();

function projectSeg(p, A, B) {
  const dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy || 1;
  const t = clamp(((p.x - A.x) * dx + (p.y - A.y) * dy) / L2, 0, 1);
  return { x: A.x + dx * t, y: A.y + dy * t };
}
function nearestOn(g, p) {
  let best = null;
  for (const s of g.segs) {
    const q = projectSeg(p, g.nodes[s.a], g.nodes[s.b]), d = dist(p, q);
    if (!best || d < best.d) best = { x: q.x, y: q.y, a: s.a, b: s.b, d };
  }
  return best;
}
function dijkstra(g, starts, ends) {
  const n = g.nodes.length, D = new Array(n).fill(Infinity), P = new Array(n).fill(-1), done = new Array(n).fill(false);
  for (const s of starts) if (s.w < D[s.n]) D[s.n] = s.w;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && D[i] < Infinity && (u < 0 || D[i] < D[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (const e of g.adj[u]) if (D[u] + e.w < D[e.to]) { D[e.to] = D[u] + e.w; P[e.to] = u; }
  }
  let bestEnd = null;
  for (const e of ends) if (!bestEnd || D[e.n] + e.w < D[bestEnd.n] + bestEnd.w) bestEnd = e;
  const path = [];
  for (let u = bestEnd.n; u >= 0; u = P[u]) path.unshift(g.nodes[u]);
  return path;
}
// 在图上从 p 走到 q（两点会先吸附到最近的线段上）
function route(g, p, q) {
  const s = nearestOn(g, p), e = nearestOn(g, q);
  const same = (s.a === e.a && s.b === e.b) || (s.a === e.b && s.b === e.a);
  if (same) return [{ x: s.x, y: s.y }, { x: e.x, y: e.y }];
  const mid = dijkstra(g,
    [{ n: s.a, w: dist(s, g.nodes[s.a]) }, { n: s.b, w: dist(s, g.nodes[s.b]) }],
    [{ n: e.a, w: dist(e, g.nodes[e.a]) }, { n: e.b, w: dist(e, g.nodes[e.b]) }]);
  return [{ x: s.x, y: s.y }, ...mid.map(n => ({ x: n.x, y: n.y })), { x: e.x, y: e.y }];
}
function walkRoute(from, to) {
  const r = route(SWG, from, to);
  return [from, ...r, to];
}
const nearestCurb = p => { const q = nearestOn(SWG, p); return { x: q.x, y: q.y }; };
const nearestRoad = p => { const q = nearestOn(RDG, p); return { x: q.x, y: q.y }; };

/* ---------------- 地点 ---------------- */
const LOC = {};
for (const d of LOC_DEFS) {
  const bx = ROAD_X[d.b[0]] + 30, by = ROAD_Y[d.b[1]] + 30;
  const [rx, ry, w, h] = d.rect;
  const L = { ...d, x: bx + rx, y: by + ry, w, h, bx, by, inside: new Set(), pairs: [], singles: [], named: {} };
  const cx = L.x + w / 2, cy = L.y + h / 2;
  L.door = d.door === 'S' ? { x: cx, y: L.y + h } : d.door === 'N' ? { x: cx, y: L.y } : d.door === 'E' ? { x: L.x + w, y: cy } : { x: L.x, y: cy };
  L.access = nearestCurb(L.door);
  L.roadPt = nearestRoad(L.access);
  L.center = { x: cx, y: cy };
  LOC[d.id] = L;
}
// 关键位置（相对街区左上角）
function rel(id, x, y) { const L = LOC[id]; return { x: L.bx + x, y: L.by + y }; }
function setSpots(id, named, pairs, singles) {
  const L = LOC[id];
  for (const k in named) L.named[k] = rel(id, ...named[k]);
  L.pairs = pairs.map(([p, q]) => ({ seats: [rel(id, ...p), rel(id, ...q)], taken: null }));
  L.singles = (singles || []).map(p => ({ ...rel(id, ...p), taken: null }));
}
setSpots('cafe', { counter: [205, 268] }, [[[55, 298], [85, 298]], [[130, 298], [160, 298]], [[55, 336], [85, 336]], [[130, 336], [160, 336]]], [[245, 300], [255, 336], [25, 320], [200, 336]]);
setSpots('hotpot', {}, [[[308, 290], [338, 290]], [[362, 290], [392, 290]], [[308, 332], [338, 332]]], [[392, 332]]);
setSpots('bar', {}, [[[45, 300], [75, 300]], [[115, 300], [145, 300]], [[185, 300], [215, 300]], [[45, 338], [75, 338]]], [[115, 338], [150, 338]]);
setSpots('mall', { door: [175, 226], plaza: [80, 262] }, [[[50, 322], [80, 322]], [[140, 322], [170, 322]], [[215, 290], [245, 290]], [[215, 334], [245, 334]]], [[110, 260], [200, 270], [60, 290]]);
setSpots('gym', { yard: [325, 290] }, [[[262, 322], [292, 322]], [[352, 322], [382, 322]]], [[300, 280]]);
setSpots('books', {}, [[[268, 38], [298, 38]], [[350, 38], [380, 38]]], []);
setSpots('flower', { front: [305, 38] }, [], []);
setSpots('park', { stage: [300, 186] }, [[[70, 92], [100, 92]], [[290, 300], [320, 300]], [[90, 290], [120, 290]], [[300, 66], [330, 66]]], []);
setSpots('fun', { icecream: [205, 302] }, [[[245, 252], [275, 252]], [[55, 112], [85, 112]], [[330, 302], [360, 302]], [[150, 62], [180, 62]]], []);
// 公园的湖、游乐园的设施
LOC.park.pond = { ...rel('park', 175, 185), rx: 70, ry: 48 };
LOC.fun.wheel = rel('fun', 300, 125);
LOC.fun.carousel = rel('fun', 110, 245);
// 虚拟地点
LOC.corner = { id: 'corner', name: 'Bright St. Crossing', kind: 'point', inside: new Set(), pairs: [], singles: [], named: { post: { x: ROAD_X[2] + 36, y: ROAD_Y[1] + 36 } } };
LOC.corner.access = { x: ROAD_X[2] + SW, y: ROAD_Y[1] + SW }; LOC.corner.door = LOC.corner.named.post; LOC.corner.center = LOC.corner.door;
LOC.road = { id: 'road', name: 'the road', kind: 'virtual', inside: new Set(), pairs: [], singles: [], named: {} };
LOC.city = { id: 'city', name: 'town', kind: 'virtual', inside: new Set(), pairs: [], singles: [], named: {} };
const BUILDINGS = LOC_DEFS.map(d => LOC[d.id]);
const ROAM_TARGETS = BUILDINGS.filter(L => L.kind !== 'area' && !['fy1', 'fy2', 'fy3', 'fy4', 'wt1', 'wt2', 'wt3', 'wt4'].includes(L.id));
const locName = id => (LOC[id] ? LOC[id].name : id);
const isHome = id => /^(fy|wt|apt)/.test(id);

function randomInArea(L) {
  for (let k = 0; k < 30; k++) {
    const p = { x: L.bx + rand(25, 395), y: L.by + rand(25, 335) };
    if (L.pond && ((p.x - L.pond.x) / (L.pond.rx + 10)) ** 2 + ((p.y - L.pond.y) / (L.pond.ry + 10)) ** 2 < 1) continue;
    if (L.wheel && dist(p, L.wheel) < 60) continue;
    if (L.carousel && dist(p, L.carousel) < 45) continue;
    return p;
  }
  return { x: L.bx + 210, y: L.by + 330 };
}

/* ---------------- 车辆 ---------------- */
let carSeq = 0;
class Car {
  constructor(kind, color) {
    this.id = ++carSeq; this.kind = kind; this.color = color;
    const n = pick(RDG.nodes); this.x = n.x; this.y = n.y; this.hd = 0;
    this.path = null; this.pi = 0; this.state = 'roam'; this.onArrive = null;
    this.passenger = null; this.driver = null; this.owner = null; this.park = null; this.wait = 0;
  }
  go(to, cb) {
    this.park = null;
    this.path = route(RDG, this, to); this.path.unshift({ x: this.x, y: this.y });
    this.pi = 0; this.onArrive = cb;
  }
  parkAt(p) {
    const q = nearestOn(RDG, p);
    this.x = q.x; this.y = q.y; this.path = null; this.park = { x: q.x, y: q.y };
    const A = RDG.nodes[q.a], B = RDG.nodes[q.b];
    this.hd = Math.atan2(B.y - A.y, B.x - A.x);
  }
  lanePos() {
    const off = this.park ? LANE + 7 : LANE;
    return { x: this.x - Math.sin(this.hd) * off, y: this.y + Math.cos(this.hd) * off };
  }
  update(dtG) {
    if (this.state === 'parked' || !this.path) {
      if (this.state === 'roam' && !this.path && this.wait <= 0) this.go(pick(RDG.nodes), null);
      this.wait -= dtG;
      return;
    }
    let step = CAR * dtG * (this.kind === 'npc' ? 0.85 : 1);
    // 前车太近就停
    const me = this.lanePos();
    for (const o of G.cars) {
      if (o === this || !o.path || o.state === 'parked') continue;
      if (Math.abs(((o.hd - this.hd + Math.PI * 3) % (Math.PI * 2)) - Math.PI) > 0.5) continue;
      const op = o.lanePos(), dx = op.x - me.x, dy = op.y - me.y;
      const ahead = dx * Math.cos(this.hd) + dy * Math.sin(this.hd), side = -dx * Math.sin(this.hd) + dy * Math.cos(this.hd);
      if (ahead > 0 && ahead < 30 && Math.abs(side) < 6) { step = 0; break; }
    }
    while (step > 0 && this.path) {
      const tgt = this.path[this.pi + 1];
      if (!tgt) { this.arrive(); break; }
      const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
      if (d > 0.01) this.hd = Math.atan2(dy, dx);
      if (d <= step) { this.x = tgt.x; this.y = tgt.y; this.pi++; step -= d; }
      else { this.x += dx / d * step; this.y += dy / d * step; step = 0; }
    }
  }
  arrive() {
    this.path = null;
    const cb = this.onArrive; this.onArrive = null;
    if (cb) cb(this); else this.wait = rand(0, 6);
  }
}
const NPC_COLORS = ['#e76f51', '#2a9d8f', '#8ecae6', '#6d6875', '#a8dadc', '#90be6d', '#f8961e', '#577590', '#b5838d'];
function initCars() {
  for (let i = 0; i < 5; i++) G.cars.push(new Car('taxi', '#ffcc00'));
  for (let i = 0; i < 8; i++) G.cars.push(new Car('npc', NPC_COLORS[i % NPC_COLORS.length]));
}
function requestTaxi(a) {
  let best = null, bd = Infinity;
  for (const c of G.cars) {
    if (c.kind !== 'taxi' || c.state !== 'roam' || c.offDuty) continue;
    if (c.driver && c.driver.wantHome) continue;
    const d = manh(c, a);
    if (d < bd) { bd = d; best = c; }
  }
  if (!best) return false;
  best.state = 'pickup'; best.passenger = a;
  best.go(nearestRoad(a), car => {
    if (!a.trip || a.trip.stage !== 'wait') { car.state = 'roam'; car.passenger = null; return; }
    a.inCar = car; a.trip.stage = 'ride'; car.state = 'carry';
    sfx('door');
    car.go(nearestRoad(a.trip.dest), car2 => {
      car2.state = 'roam'; car2.passenger = null; car2.wait = 2;
      dropOff(a, car2);
      if (car2.driver && car2.driver.wantHome) taxiGoHome(car2);
    });
  });
  return true;
}
function dropOff(a, car) {
  a.inCar = null;
  const curb = nearestCurb(car.lanePos());
  a.x = curb.x; a.y = curb.y;
  if (a.trip) { a.trip.stage = 'move'; a.trip.path = [curb, a.trip.dest]; a.trip.pi = 0; }
}

/* ---------------- 居民 ---------------- */
const HUES = [0, 210, 120, 300, 30, 180, 270, 60, 330, 150, 240, 15, 195, 285, 90, 345, 165, 45, 225, 315, 105, 255, 75, 135, 20, 200];
class Agent {
  constructor(def, i) {
    Object.assign(this, def);
    this.color = `hsl(${HUES[i]}, 72%, ${[45, 52, 40][i % 3]}%)`;
    this.origHome = def.home;
    const h = LOC[this.home];
    this.x = h.door.x; this.y = h.door.y;
    this.at = this.home; h.inside.add(this); this.hidden = true;
    this.plans = {}; this.extras = []; this.goal = null; this.trip = null; this.inCar = null;
    this.facing = 1; this.phase = Math.random() * 6; this.moving = false; this.pose = 'stand';
    this.bubble = null; this.lock = null; this.onPhone = false; this.partner = null; this.couple = null; this.exes = [];
    this.heartbreakUntil = -1; this.dateReady = false; this.seat = null; this.spot = null;
    this.wanderTo = null; this.pauseT = 0; this.roamTo = null;
    if (def.car || def.taxi) {
      const c = new Car(def.taxi ? 'taxi' : 'own', def.taxi ? '#ffcc00' : def.car);
      c.owner = this; c.state = 'parked'; c.parkAt(LOC[this.home].access);
      if (def.taxi) { c.driver = this; c.offDuty = true; }
      this.car = c; G.cars.push(c);
    }
    if (def.dog) this.dog = { x: this.x + 8, y: this.y, phase: 0 };
  }
  get name2() { return this.main ? `${this.id} ${this.name}` : this.name; }
  say(text, dur, kind = 'say', to = null, tone = 'neutral') { this.bubble = { text, t: 0, dur, kind, to, tone }; }

  basePlan(d) {
    if (this.plans[d]) return this.plans[d];
    const D = d * 1440, H = h => D + h * 60, items = [], w = this.work;
    const dow = d % 7, workday = w.days === 'all' ? Math.random() > 0.08 : dow < 5;
    const wake = this.wake + rand(-0.3, 0.3);
    const lastH = Math.min(this.sleep < 6 ? 23.6 : this.sleep, 23.6) + rand(-0.3, 0.2);
    const home = (s, e, act = 'home') => items.push({ start: H(s), end: H(e), loc: this.home, act, mode: 'inside', label: act === 'sleep' ? 'sleeping' : pick(['relaxing at home', 'binge-watching at home', 'cooking at home', 'zoning out at home']) });
    home(0, wake, 'sleep');
    let cur = wake;
    const hobby = (s, e) => {
      let [loc, label, mode] = HOBBY_PLACES[pick(this.likes)];
      if (Math.random() < 0.18) [loc, label, mode] = pick([['shop', 'buying snacks', 'inside'], ['market', 'buying groceries', 'inside'], ['park', 'taking a walk', 'wander'], ['cafe', 'having coffee', 'spot']]);
      if (loc === this.work.loc && workday) [loc, label, mode] = ['park', 'taking a walk', 'wander'];
      items.push({ start: H(s), end: H(e), loc, act: 'fun', mode, label });
    };
    if (workday) {
      const ws = Math.max(w.start + rand(-0.15, 0.15), wake + 0.4);
      let we = w.end + rand(-0.2, 0.3);
      if (this.special === 'overtime' && Math.random() < 0.3) { we += rand(1.5, 2.5); this.overtimeDay = d; }   // the boss wants "just one more thing"

      const job = { loc: w.loc, act: 'work', mode: w.mode, label: w.label, pose: w.pose, spot: w.spot, targets: w.targets };
      if (w.mode === 'inside' && we - ws > 6 && ws < 11.5 && Math.random() < 0.55) {
        const wl = LOC[w.loc] && LOC[w.loc].door ? LOC[w.loc].door : LOC.cafe.door;
        const [lloc, lmode] = pick([['cafe', 'spot'], ['hotpot', 'inside'], ['shop', 'inside'], ['market', 'inside']].sort((p, q) => manh(LOC[p[0]].door, wl) - manh(LOC[q[0]].door, wl)).slice(0, 2));
        items.push({ ...job, start: H(ws), end: H(12) });
        items.push({ start: H(12.05), end: H(12.9), loc: lloc, act: 'lunch', mode: lmode, label: 'having lunch' });
        items.push({ ...job, start: H(12.95), end: H(we) });
      } else items.push({ ...job, start: H(ws), end: H(we) });
      if (ws - cur > 2.2 && Math.random() < 0.35) hobby(cur + 0.4, Math.min(cur + 1.6, ws - 0.6));
      cur = we;
    } else {
      if (Math.random() < 0.8) { const s = Math.max(cur + 0.5, 10 + rand(0, 2)); hobby(s, s + rand(1.5, 3)); cur = s + 3.2; }
    }
    if (lastH - cur > 1.8 && Math.random() < 0.8) {
      const s = cur + rand(0.3, 0.9), e = Math.min(s + rand(1.2, 2.6), lastH - 0.3);
      if (e - s > 0.8) hobby(s, e);
    }
    items.sort((p, q) => p.start - q.start);
    // 空档都填成在家
    const out = []; let t = D;
    for (const it of items) {
      if (it.start < t) it.start = t;
      if (it.end <= it.start) continue;
      if (it.start - t > 45) out.push({ start: t, end: it.start, loc: this.home, act: 'home', mode: 'inside', label: 'relaxing at home' });
      else if (out.length) out[out.length - 1].end = it.start;
      else it.start = t;
      out.push(it); t = it.end;
    }
    if (t < H(lastH)) { out.push({ start: t, end: H(lastH), loc: this.home, act: 'home', mode: 'inside', label: 'relaxing at home' }); t = H(lastH); }
    out.push({ start: t, end: D + 1440, loc: this.home, act: 'sleep', mode: 'inside', label: 'sleeping' });
    // 结婚后会搬家：home 用最新的
    this.plans[d] = out;
    return out;
  }
  plan(d = day()) {
    let items = this.basePlan(d).map(it => (isHome(it.loc) ? { ...it, loc: this.home } : it));
    for (const ex of this.extras) {
      if (ex.end <= d * 1440 || ex.start >= (d + 1) * 1440) continue;
      const nxt = [];
      for (const it of items) {
        if (it.end <= ex.start || it.start >= ex.end) { nxt.push(it); continue; }
        if (it.start < ex.start) nxt.push({ ...it, end: ex.start });
        if (it.end > ex.end) nxt.push({ ...it, start: ex.end });
      }
      nxt.push(ex); items = nxt.sort((p, q) => p.start - q.start);
    }
    return items;
  }
  itemAt(t) {
    const d = Math.floor(t / 1440);
    const items = this.plan(d);
    for (let i = items.length - 1; i >= 0; i--) if (items[i].start <= t && t < items[i].end) return { it: items[i], next: items[i + 1] || this.plan(d + 1)[0] };
    return { it: items[0], next: items[1] };
  }
  modeFor(d) {
    if (this.go === 'bike') return 'bike';
    if (this.go === 'car' && this.car && !this.taxi && this.car.state === 'parked' && dist(this.car.lanePos(), this) < 160) return 'car';
    if (this.go === 'taxi') return d > 380 ? 'taxi' : 'walk';
    return d > 700 ? 'taxi' : 'walk';
  }
  travelMin(it) {
    const L = LOC[it.loc];
    if (!L || !L.door) return 6;
    const d = manh(this.anchor(), L.door), m = this.modeFor(d);
    return d / (m === 'walk' ? WALK : m === 'bike' ? BIKE : CAR) + (m === 'taxi' ? 10 : 4);
  }
  currentGoal() {
    const { it, next } = this.itemAt(G.t);
    if (next && next.loc !== it.loc && ((this.goal && sameItem(this.goal, next)) || G.t >= next.start - this.travelMin(next))) return next;
    return it;
  }
  anchor() {
    if (this.inCar) return this.inCar.lanePos();
    return { x: this.x, y: this.y };
  }
  awake() { return this.goal && this.goal.act !== 'sleep'; }

  update(dtG) {
    if (this.dog) this.dogTick(dtG);
    if (this.lock) { this.moving = false; return; }
    if (this.chase) { this.chaseTick(dtG); return; }
    if (this.driving) { this.driveTick(); return; }
    const g = this.currentGoal();
    if (g !== this.goal && !(this.goal && sameItem(g, this.goal))) { this.goal = g; this.newGoal(g); }
    if (this.trip) { this.tripTick(dtG); return; }
    this.activityTick(dtG);
  }
  dogTick() {
    const d = this.dog, tx = this.x - this.facing * 9, ty = this.y + 3;
    d.x += (tx - d.x) * 0.08; d.y += (ty - d.y) * 0.08; d.phase += 0.3;
  }
  leave() {
    if (this.at && LOC[this.at]) LOC[this.at].inside.delete(this);
    if (this.spot) { this.spot.taken = null; this.spot = null; }
    this.hidden = false; this.at = null; this.pose = 'stand'; this.wanderTo = null; this.roamTo = null; this.dateReady = false;
  }
  destFor(g) {
    const L = LOC[g.loc];
    if (g.mode === 'date') return this.seat || L.door;
    if (g.mode === 'spot') {
      if (g.spot && L.named[g.spot]) return L.named[g.spot];
      const s = L.singles.find(s => !s.taken) || null;
      if (s) { s.taken = this; this.spot = s; return s; }
      return { x: L.door.x + rand(-30, 30), y: L.door.y + rand(14, 28) * (L.door.y > L.center.y ? 1 : -1) };
    }
    if (g.mode === 'patrol') return L.named.post;
    if (g.mode === 'wander') return L.kind === 'area' ? randomInArea(L) : L.door;
    return L.door;
  }
  newGoal(g) {
    if (this.inCar && !this.driving) { this.goal = null; return; }   // 车上的乘客先到站，下车后再换目标
    if (this.trip && this.trip.stage === 'wait') this.cancelTaxi();
    this.trip = null;
    if (g.mode === 'drive') {
      if (g.end - G.t < 45) { if (this.at !== this.home) { this.leave(); this.startTrip({ ...g, loc: this.home, mode: 'inside' }, LOC[this.home].door); } return; }
      if (this.car.state === 'parked') { this.leave(); this.startTrip(g, this.car.lanePos(), 'toTaxi'); }
      return;
    }
    if (g.mode === 'roam') { this.leave(); this.at = 'city'; this.roamTo = null; this.pauseT = 0; return; }
    if (g.mode === 'date' && g.couple) g.couple.ensureSeats(g.loc);
    if (this.at === g.loc) {   // 同一个地方换活动
      const keep = this.spot; this.leave();
      const dest = this.destFor(g);
      this.trip = { g, dest, mode: 'walk', stage: 'move', path: [{ x: this.x, y: this.y }, dest], pi: 0 };
      if (keep && keep !== this.spot) keep.taken = null;
      return;
    }
    this.leave();
    this.startTrip(g, this.destFor(g));
  }
  startTrip(g, dest, special) {
    const from = { x: this.x, y: this.y };
    const d = manh(from, dest);
    if (special === 'toTaxi') {
      this.trip = { g, dest, mode: 'walk', stage: 'move', path: walkRoute(from, nearestCurb(dest)), pi: 0, toTaxi: true };
      return;
    }
    const mode = this.modeFor(d);
    const T = this.trip = { g, dest, mode, stage: 'move', path: null, pi: 0, wait: 0 };
    if (mode === 'walk' || mode === 'bike') T.path = walkRoute(from, dest);
    else { T.stage = 'curb'; T.path = [from, nearestCurb(mode === 'car' ? this.car.lanePos() : from)]; }
  }
  follow(dtG, speed) {
    const T = this.trip;
    let step = speed * dtG;
    this.moving = true;
    while (step > 0) {
      const tgt = T.path[T.pi + 1];
      if (!tgt) return true;
      const dx = tgt.x - this.x, dy = tgt.y - this.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.3) this.facing = dx > 0 ? 1 : -1;
      if (d <= step) { this.x = tgt.x; this.y = tgt.y; T.pi++; step -= d; }
      else { this.x += dx / d * step; this.y += dy / d * step; step = 0; }
    }
    this.phase += dtG * (T.mode === 'bike' ? 1.2 : 2.2) * (this.pose === 'run' ? 1.6 : 1);
    return !T.path[T.pi + 1];
  }
  tripTick(dtG) {
    const T = this.trip;
    if (T.stage === 'move' || T.stage === 'curb') {
      const sp = T.mode === 'bike' ? BIKE : WALK * (this.work.pose === 'run' && this.goal.mode === 'roam' ? 1.6 : 1);
      if (this.follow(dtG, T.stage === 'curb' ? WALK : sp)) {
        if (T.toTaxi) { this.boardTaxi(); return; }
        if (T.stage === 'curb') {
          if (T.mode === 'car') {
            const car = this.car; this.inCar = car; T.stage = 'ride'; car.state = 'driving'; sfx('door');
            car.go(nearestRoad(T.dest), c => { c.state = 'parked'; c.parkAt(c); dropOff(this, c); });
          } else { T.stage = 'wait'; T.wait = 0; this.moving = false; }
          return;
        }
        this.trip = null; this.moving = false; this.arrive(T.g);
      }
      return;
    }
    if (T.stage === 'wait') {
      this.moving = false; T.wait += dtG;
      if (!T.called || T.wait > T.called + 25) { if (requestTaxi(this)) T.called = T.wait + 0.001; }
      if (T.wait > 70) { T.mode = 'walk'; T.stage = 'move'; T.path = walkRoute({ x: this.x, y: this.y }, T.dest); T.pi = 0; this.cancelTaxi(); }
      return;
    }
    if (T.stage === 'ride') { const p = this.inCar.lanePos(); this.x = p.x; this.y = p.y; this.moving = false; }
  }
  cancelTaxi() { for (const c of G.cars) if (c.passenger === this && c.state === 'pickup') { c.state = 'roam'; c.passenger = null; c.path = null; } }
  boardTaxi() {
    const car = this.car; this.trip = null; this.driving = true; this.inCar = car; this.at = 'road';
    car.state = 'roam'; car.offDuty = false; car.path = null; car.park = null; this.wantHome = false;
    log(`🚕 ${this.name2} starts a taxi shift`);
  }
  driveTick() {
    const p = this.car.lanePos(); this.x = p.x; this.y = p.y; this.moving = false;
    const g = this.currentGoal();
    if (g.mode !== 'drive') this.wantHome = true;
    if (this.wantHome && this.car.state === 'roam') taxiGoHome(this.car);
  }
  arrive(g) {
    const L = LOC[g.loc];
    this.at = g.loc; this.moving = false;
    if (g.mode === 'inside' || (g.mode === 'wander' && L.kind !== 'area')) { this.hidden = true; L.inside.add(this); this.x = L.door.x; this.y = L.door.y; return; }
    this.hidden = false;
    if (g.mode === 'date') { this.dateReady = true; this.pose = 'sit'; this.arrivedAt = G.t; return; }
    if (g.mode === 'spot') { this.pose = g.pose || (g.act === 'work' ? 'stand' : 'sit'); return; }
    if (g.mode === 'patrol') { this.pose = 'wave'; return; }
    if (g.mode === 'wander') { this.pose = g.pose || 'stand'; this.pauseT = rand(2, 8); }
  }
  activityTick(dtG) {
    const g = this.goal;
    if (!g) return;
    this.moving = false;
    if (g.mode === 'wander' && this.at === g.loc && LOC[g.loc].kind === 'area') {
      if (this.pauseT > 0) { this.pauseT -= dtG; this.pose = g.pose || 'stand'; return; }
      if (!this.wanderTo) this.wanderTo = { path: [{ x: this.x, y: this.y }, randomInArea(LOC[g.loc])], pi: 0 };
      this.trip = { g, mode: 'walk', stage: 'wander', path: this.wanderTo.path, pi: 0 };
      const done = this.follow(dtG, WALK * 0.6 * (g.pose === 'taichi' ? 0.5 : 1));
      this.trip = null;
      if (done) { this.wanderTo = null; this.pauseT = rand(4, 14); }
      else this.wanderTo.pi = 0;
      return;
    }
    if (g.mode === 'roam') {
      if (this.pauseT > 0) { this.pauseT -= dtG; return; }
      if (!this.roamTo) {
        const L = g.targets ? LOC[pick(g.targets)] : pick(ROAM_TARGETS.concat([LOC.park, LOC.fun]));
        const dest = L.kind === 'area' ? randomInArea(L) : L.door;
        this.roamTo = { g, mode: this.go === 'bike' ? 'bike' : 'walk', stage: 'move', path: walkRoute({ x: this.x, y: this.y }, dest), pi: 0, L };
      }
      this.trip = this.roamTo;
      const sp = this.roamTo.mode === 'bike' ? BIKE : WALK * (g.pose === 'run' ? 1.7 : 1);
      const done = this.follow(dtG, sp);
      this.trip = null;
      if (done) {
        this.pauseT = rand(5, 12);
        if (this.id === 'Ivan') this.say(pick(['Your food is here!', 'Delivery! Five stars, please!', `Delivery for ${this.roamTo.L.name}!`]), 2.6);
        if (this.id === 'F') this.say(pick([`📸 ${this.roamTo.L.name}: 10 out of 10!`, 'Photo first, then eat!', `Trying everything on the menu at ${this.roamTo.L.name}.`, 'Mmm... this goes on the blog!', 'Okay, ONE more bite.']), 3, 'say', null, 'happy');
        this.roamTo = null;
      }
    }
  }
}
function sameItem(a, b) { return a.start === b.start && a.loc === b.loc && a.act === b.act; }
function taxiGoHome(car) {
  const a = car.driver;
  car.state = 'homing';
  car.go(LOC[a.home].roadPt, c => {
    c.state = 'parked'; c.offDuty = true; c.parkAt(c);
    a.driving = false; a.wantHome = false; a.inCar = null; a.at = null;
    const curb = nearestCurb(c.lanePos()); a.x = curb.x; a.y = curb.y;
    a.goal = null;
  });
}

/* ---------------- 恋爱 ---------------- */
function compat(a, b) {
  const shared = a.likes.filter(x => b.likes.includes(x)).length;
  const key = [a.temper, b.temper].sort().join('-');
  return shared * 0.6 + (TEMPER_MATCH[key] || 0) + (a.temper === 'warm' || b.temper === 'warm' ? 0.15 : 0);
}
const STAGES = ['Just tied', 'Flirting', 'Dating', 'Living together', 'Married'];
const stageLabel = c => c.stage === 4 && !c.together ? 'Married · living apart' : STAGES[c.stage];
let coupleSeq = 0;
class Couple {
  constructor(a, b) {
    this.id = ++coupleSeq; this.a = a; this.b = b;
    this.compat = compat(a, b);
    // Honeymoon: everyone starts near full hearts, then drifts. Poor matches sour within a game day or so.
    this.aff = rand(86, 96);
    this.drift = Math.max(-0.5, 1.9 - 1.15 * this.compat + rand(-0.5, 0.6));   // affection lost per game hour
    this.stage = 0; this.dates = 0; this.calls = 0; this.date = null; this.scene = null; this.together = false; this.reply = null;
    this.born = G.t; this.bornReal = G.realT; this.nextCall = G.t + rand(8, 25); this.nextText = G.t + rand(40, 90);
    this.lastDay = day(); this.lastT = G.t; this.broken = false;
    a.partner = b; b.partner = a; a.couple = this; b.couple = this;
  }
  other(x) { return x === this.a ? this.b : this.a; }
  stars() { return clamp(Math.round(2.5 + this.compat * 1.1), 1, 5); }
  hearts() { return Math.round(this.aff / 10) / 2; }   // 0–5 in half hearts
  mood() { return this.aff >= 70 ? 'sweet' : this.aff >= 40 ? 'normal' : 'sour'; }
  bump(d, who) {
    this.aff = clamp(this.aff + d, 0, 100);
    this.bumpSeq = (this.bumpSeq || 0) + 1; this.lastBump = d;
    const t = who || pick([this.a, this.b]);
    G.floats.push({ x: t.x, y: t.y - 40, text: d >= 0 ? `❤ +${Math.round(d)}` : `💔 ${Math.round(d)}`, c: d >= 0 ? '#ff4d6d' : '#6c757d', t: 0, ag: t });
  }
  ensureSeats(locId) {
    if (this.seatsLoc === locId && this.seats) return;
    this.releaseSeats();
    const L = LOC[locId];
    let pr = L.pairs.find(p => !p.taken);
    if (pr) { pr.taken = this; this.seats = pr; this.a.seat = pr.seats[0]; this.b.seat = pr.seats[1]; }
    else {
      const d = L.door, s = d.y > L.center.y ? 1 : -1;
      this.seats = null; this.a.seat = { x: d.x - 14 + rand(-20, 20), y: d.y + 20 * s }; this.b.seat = { x: this.a.seat.x + 28, y: this.a.seat.y };
    }
    this.seatsLoc = locId;
  }
  releaseSeats() { if (this.seats) this.seats.taken = null; this.seats = null; this.seatsLoc = null; this.a.seat = null; this.b.seat = null; }
  tick() {
    if (this.broken) return;
    const dt = G.t - this.lastT; this.lastT = G.t;
    if (dt > 0 && dt < 600) this.aff = clamp(this.aff - this.drift * dt / 60, 0, 100);
    if (day() !== this.lastDay) { this.lastDay = day(); this.drift += rand(-0.35, 0.35); }
    if (this.scene) return;
    const { a, b } = this;
    const free = !a.lock && !b.lock && !a.onPhone && !b.onPhone;
    if (this.aff < 18 && !a.lock && !b.lock) { startBreakup(this); return; }
    if (this.together && this.aff < 35 && free) { startMoveOut(this); return; }
    if (this.reply && G.t >= this.reply.at && this.reply.from.awake() && free) { startLateReply(this); return; }
    if (G.t >= this.nextText && a.awake() && b.awake() && free && !a.dateReady && !b.dateReady) { startText(this); return; }
    if (this.date) {
      const D = this.date;
      if (a.dateReady && b.dateReady && !a.lock && !b.lock) { startDateScene(this); return; }
      if (G.t > D.start + 75) {
        const r = a.dateReady ? a : b.dateReady ? b : null;
        if (r) startStoodUp(this, r); else this.clearDate();
      }
      return;
    }
    if (G.t >= this.nextCall && a.awake() && b.awake() && !a.lock && !b.lock && !a.onPhone && !b.onPhone) startCall(this);
  }
  clearDate() {
    for (const p of [this.a, this.b]) { p.extras = p.extras.filter(x => x.couple !== this); p.dateReady = false; p.goal = null; }
    this.date = null; this.releaseSeats();
  }
}
function chooseVenue(c) {
  const shared = c.a.likes.filter(x => c.b.likes.includes(x));
  const pool = shared.length && Math.random() < 0.75 ? shared : c.a.likes.concat(c.b.likes);
  let v = INTERESTS[pick(pool)].venue;
  if (c.stage >= 2 && Math.random() < 0.3) v = pick(['fun', 'park', 'bar']);
  return v;
}
function freeAt(a, s, e, skipWork) {
  for (let d = Math.floor(s / 1440); d <= Math.floor(e / 1440); d++)
    for (const it of a.plan(d)) if (it.end > s && it.start < e && ((it.act === 'work' && !skipWork) || it.act === 'sleep' || it.act === 'date')) return false;
  return true;
}
function scheduleDate(c, venue) {
  let s = Math.ceil((G.t + 35) / 30) * 30, found = null;
  for (let k = 0; k < 120 && !found; k++, s += 30) {
    const h = (s % 1440) / 60;
    if (h < 9 || h > 21) continue;
    if (freeAt(c.a, s - 15, s + 130) && freeAt(c.b, s - 15, s + 130)) found = s;
  }
  let skipper = null;
  if (!found) {   // 实在凑不上：有一个人翘班去约会
    s = Math.ceil((G.t + 35) / 30) * 30;
    for (let k = 0; k < 96 && !found; k++, s += 30) {
      const h = (s % 1440) / 60;
      if (h < 10 || h > 21) continue;
      for (const [x, y] of [[c.a, c.b], [c.b, c.a]]) if (!found && freeAt(x, s - 15, s + 130, true) && freeAt(y, s - 15, s + 130)) { found = s; skipper = x; }
    }
  }
  if (!found) { log(`📅 ${c.a.name2} and ${c.b.name2} want a date, but they're both too busy`); return; }
  if (skipper) log(`🙈 ${skipper.name2} is skipping work for a date`);
  const item = who => ({ start: found, end: found + 170, loc: venue, act: 'date', mode: 'date', couple: c, label: `on a date with ${c.other(who).name}` });
  c.a.extras.push(item(c.a)); c.b.extras.push(item(c.b));
  c.date = { start: found, loc: venue };
  log(`📅 ${c.a.name2} and ${c.b.name2} will ${VENUES[venue].verb} at ${locName(venue)} ${whenStr(found)}`);
}

/* ---------------- 剧情（对话序列） ---------------- */
let sceneSeq = 0;
class Scene {
  constructor(kind, couple, lines, opts = {}) {
    this.id = ++sceneSeq; this.kind = kind; this.c = couple; this.lines = lines; this.i = -1; this.t = 0; this.next = 0.6;
    Object.assign(this, opts);
    this.done = false; this.startReal = G.realT;
  }
  update(dt) {
    if (this.done) return;
    this.t += dt;
    if (this.t < this.next) return;
    this.i++;
    if (this.i >= this.lines.length && this.drain) { const more = this.drain(); this.drain = null; if (more && more.length) this.lines.push(...more); }
    const ln = this.lines[this.i];
    if (!ln) { this.end(); return; }
    this.said = this.said || new Set();
    if (ln.who && this.said.has(ln.text)) ln.text = pick(['Me too!', 'Same here!', 'Haha, same!', 'Ditto!']);
    this.said.add(ln.text);
    ln.text = ln.text.replace(/(^|[!?] )([a-z])/g, (m, p, ch) => p + ch.toUpperCase());   // a topic word can start a sentence
    const dur = ln.dur || clamp(1.8 + ln.text.length * 0.07, 2.6, 6.5);
    const to = ln.who && this.c && (ln.who === this.c.a || ln.who === this.c.b) && this.kind !== 'stood' ? this.c.other(ln.who) : null;
    const seq = this.c ? this.c.bumpSeq : 0;
    if (ln.fx) ln.fx();
    let tone = ln.tone;
    if (!tone && this.c && this.c.bumpSeq !== seq && Math.abs(this.c.lastBump) >= 1) tone = this.c.lastBump > 0 ? 'happy' : 'sad';
    if (!tone) tone = this.tone || (this.c ? { sweet: 'happy', sour: 'sad' }[this.c.mood()] : null) || 'neutral';
    if (ln.who) ln.who.say(ln.text, dur + 0.3, this.kind === 'text' ? 'text' : this.kind === 'call' || this.phone ? 'phone' : 'say', to, tone);
    else Director.subtitle(ln.text, dur + 0.2);
    if (ln.sfx) sfx(ln.sfx);
    this.next = this.t + dur;
  }
  end() {
    this.done = true;
    if (this.c) this.c.scene = null;
    if (this.onEnd) this.onEnd();
  }
}
function runScene(s) { G.scenes.push(s); if (s.c) s.c.scene = s; Director.offer(s); return s; }
const T_ = (pool, who, v) => fillT(pick(pool[who.temper] || pool), v);

function startCall(c) {
  const ia = Math.random() < EXTRO[c.a.temper] / (EXTRO[c.a.temper] + EXTRO[c.b.temper]);
  const A = ia ? c.a : c.b, B = c.other(A);
  const venue = chooseVenue(c), vName = locName(venue), verb = VENUES[venue].verb;
  const v = { a: A.name, b: B.name, p: vName, v: verb };
  const lines = [];
  let agreed = false;
  const fightP = c.stage >= 1 || c.aff < 45 ? 0.08 + (c.aff < 45 ? 0.4 : c.aff < 65 ? 0.12 : 0) + (['grumpy', 'tsun'].includes(A.temper) ? 0.08 : 0) : 0;
  let kind = 'call';
  if (c.calls === 0) {
    lines.push({ who: A, text: fillT(pick(L.meetCute), { b: B.name, p: locName(pick(['cafe', 'mall', 'park', 'shop', 'books'])) }) });
    lines.push({ who: B, text: T_(L.meetReply, B, v) });
    lines.push({ who: A, text: fillT(pick(L.invite), v) });
    agreed = Math.random() < (c.compat > -0.4 ? 0.92 : 0.6);
    lines.push({ who: B, text: pick(agreed ? L.inviteYes : L.inviteNo), fx: () => c.bump(agreed ? 3 : -3, A) });
  } else if (Math.random() < fightP) {
    kind = 'fight';
    lines.push({ who: A, text: fillT(pick(L.callHi), v) });
    lines.push({ who: A, text: fillT(pick(L.fightStart), v), sfx: 'bad' });
    const soft = ['warm', 'shy'].includes(B.temper);
    lines.push({ who: B, text: T_(L.fightBack, B, v), fx: () => c.bump(soft ? -rand(2, 5) : -rand(7, 13), A) });
    lines.push({ who: A, text: soft ? "...Fine. I wasn't perfect either." : pick(['Hmph!', 'Think about what you did!', "I'm hanging up!"]) });
  } else {
    lines.push({ who: A, text: fillT(pick(L.callHi), v) });
    lines.push({ who: B, text: fillT(pick(L.callStatus), { s: statusPhrase(B) }) });
    lines.push({ who: A, text: T_(L.callChat, A, v) });
    lines.push({ who: B, text: T_(L.callChat, B, v), fx: () => c.bump(rand(1, 4), B) });
    if (c.stage >= 2) lines.push({ who: pick([A, B]), text: pick(L.callLove), fx: () => c.bump(2, A), tone: 'happy' });
    if (Math.random() < 0.55 + c.stage * 0.12) {
      lines.push({ who: A, text: fillT(pick(L.invite), v) });
      agreed = Math.random() < (c.aff - 10) / 60;
      lines.push({ who: B, text: pick(agreed ? L.inviteYes : L.inviteNo), fx: () => { if (!agreed) c.bump(-2, A); } });
    }
  }
  c.calls++;
  A.onPhone = B.onPhone = true;
  sfx('ring');
  log(kind === 'fight' ? `📞 ${A.name2} calls ${B.name2}... and they fight` : `📞 ${A.name2} calls ${B.name2}`);
  runScene(new Scene(kind === 'fight' ? 'call' : 'call', c, lines, {
    title: kind === 'fight' ? 'Fighting on the phone' : c.calls === 1 ? 'The first call' : 'A long phone chat', A, B, phone: true, tone: kind === 'fight' ? 'sad' : null,
    onEnd() {
      A.onPhone = B.onPhone = false;
      c.nextCall = G.t + [rand(240, 600), rand(200, 520), rand(160, 420), rand(300, 700)][c.stage];
      if (agreed && !c.date) scheduleDate(c, venue);
    },
  }));
}
function statusPhrase(a) {
  if (a.trip) return 'on my way';
  const g = a.goal; if (!g) return 'spacing out';
  if (g.act === 'home') return 'lying around at home';
  return g.label;
}
function startDateScene(c) {
  const { a, b } = c;
  a.lock = b.lock = 'date';
  a.facing = a.x < b.x ? 1 : -1; b.facing = -a.facing;
  const n = c.dates + 1, venue = c.date.loc, v = { p: locName(venue), n };
  const lines = [];
  const late = Math.abs((a.arrivedAt || 0) - (b.arrivedAt || 0));
  if (late > 25) {
    const early = (a.arrivedAt || 0) < (b.arrivedAt || 0) ? a : b, lateOne = c.other(early);
    lines.push({ who: early, text: L.late[1] });
    lines.push({ who: lateOne, text: L.late[0], fx: () => c.bump(-rand(3, 7), early) });
  }
  for (const [x, y] of [[a, b], [b, a]]) lines.push({ who: x, text: T_(n === 1 ? L.greetFirst : L.greetAgain, x, { ...v, b: y.name }) });
  const topics = ri(2, 3);
  let sp = Math.random() < 0.5 ? a : b;
  for (let k = 0; k < topics; k++) {
    const ls = c.other(sp);
    const t = Math.random() < 0.7 ? pick(sp.likes) : pick(ls.likes);
    const yes = ls.likes.includes(t);
    lines.push({ who: sp, text: Math.random() < 0.5 ? pick(INTERESTS[t].lines) : fillT(pick(L.ask), { b: ls.name, t }) });
    lines.push({
      who: ls, text: T_(yes ? L.love : L.meh, ls, { t }),
      fx: () => c.bump(yes ? rand(5, 9) : (['warm', 'romantic'].includes(ls.temper) ? rand(0, 2) : -rand(2, 6)), ls),
    });
    sp = ls;
  }
  if (Math.random() < 0.55) {
    const s1 = pick([a, b]), s2 = c.other(s1), ok = c.aff + rand(-15, 25) > 50;
    lines.push({ who: s1, text: T_(L.praise, s1, {}) });
    lines.push({ who: s2, text: T_(ok ? L.praiseYes : L.praiseNo, s2, {}), fx: () => c.bump(ok ? rand(3, 7) : -rand(2, 5), s2) });
  }
  if (Math.random() < 0.6) {
    const inc = pick(L.incidents), s1 = pick([a, b]);
    let x = inc.who ? G.byId[inc.who] : pick(G.agents.filter(p => p !== a && p !== b));
    if (x === a || x === b) x = pick(G.agents.filter(p => p !== a && p !== b));
    const d = c.stage < (inc.need || 0) ? rand(0, 2) : rand(inc.d[0], inc.d[1]);
    lines.push({ who: null, text: fillT(inc.text, { a: s1.name, b: c.other(s1).name, x: x.name }), fx: () => c.bump(d, s1) });
  }
  if (c.aff < 45 && Math.random() < 0.5) lines.push({ who: pick([a, b]), text: pick(L.awkward), fx: () => c.bump(-2) });
  const md = c.aff < 45 ? 'sour' : c.aff >= 78 ? 'sweet' : null;
  if (md && Math.random() < 0.8) {
    const ex = pick(DATE_MOOD[md]), s1 = pick([a, b]);
    ex.forEach((t, i) => {
      const ln = { who: i % 2 ? c.other(s1) : s1, text: t, tone: md === 'sour' ? 'sad' : 'happy' };
      if (i === ex.length - 1) ln.fx = () => c.bump(md === 'sour' ? -rand(3, 7) : rand(2, 5), s1);
      lines.push(ln);
    });
  }
  log(`💞 ${a.name2} and ${b.name2}: date #${n} at ${locName(venue)}`);
  runScene(new Scene('date', c, lines, {
    title: `Date #${n} · ${locName(venue)}`,
    drain() { return dateEnding(c); },
    onEnd() {
      a.lock = b.lock = null; c.dates++;
      c.clearDate();
      c.nextCall = G.t + rand(120, 400);
      if (c.pendingBreak) { c.pendingBreak = false; endCouple(c, 'breakup', a); }
    },
  }));
}
function dateEnding(c) {
  const { a, b } = c, out = [];
  const conf = EXTRO[a.temper] + Math.random() * 0.5 > EXTRO[b.temper] + Math.random() * 0.5 ? a : b, oth = c.other(conf);
  if (c.aff < 15) {
    out.push({ who: conf, text: T_(L.breakup, conf, {}), sfx: 'bad', tone: 'sad' });
    out.push({ who: oth, text: pick(L.breakupReply), tone: 'sad' });
    c.pendingBreak = true;
    return out;
  }
  if (c.stage === 0 && c.aff >= 55) {
    out.push({ who: null, text: '(Something in the air between them has changed...)', fx: () => { c.stage = 1; Director.card('💗 Flirting', `${a.name2} ✕ ${b.name2}`); log(`💗 ${a.name2} and ${b.name2} are starting to flirt`); sfx('heart'); } });
  } else if (c.stage === 1 && c.aff >= 68 && c.dates >= 1) {
    const ok = Math.random() < (c.aff - 40) / 40;
    out.push({ who: conf, text: T_(L.confess, conf, { b: oth.name }), sfx: 'heart', tone: 'happy' });
    out.push({
      who: oth, text: T_(ok ? L.accept : L.reject, oth, {}),
      fx: () => {
        if (ok) { c.stage = 2; c.bump(8, conf); Director.card('❤️ Together!', `${conf.name2} confessed, and it worked`); log(`❤️ ${conf.name2} confessed to ${oth.name2}, and it worked!`); sfx('love'); burstHearts(conf, oth); }
        else { c.bump(-14, conf); Director.card('💧 Turned down', `${oth.name2}: "Let's just be friends."`); log(`💧 ${conf.name2} confessed to ${oth.name2} and was turned down`); sfx('bad'); }
      },
    });
  } else if ((c.stage === 2 || c.stage === 4) && !c.together && c.aff >= 72 && c.dates >= 2) {
    const ok = Math.random() < (c.aff - 50) / 35;
    out.push({ who: conf, text: fillT(pick(MOVE_IN.ask), { b: oth.name }), sfx: 'heart', tone: 'happy' });
    out.push({
      who: oth, text: pick(ok ? MOVE_IN.yes : MOVE_IN.no),
      fx: () => {
        if (!ok) { c.bump(-6, conf); log(`🙅 ${oth.name2} isn't ready to move in with ${conf.name2}`); return; }
        const home = moveIn(c);
        if (c.stage === 2) c.stage = 3;
        c.bump(6, oth);
        log(`🏠 ${a.name2} and ${b.name2} are moving in together at ${locName(home)}!`);
        celebrate(c, '🏠 Moving in together!', `${a.name2} ❤ ${b.name2} · new home: ${locName(home)}`, home);
      },
    });
  } else if (c.stage === 3 && c.aff >= 84 && c.dates >= 4 && Math.random() < 0.55) {
    out.push({ who: null, text: `(${conf.name} kneels down and pulls out a little box)` });
    out.push({ who: conf, text: fillT(pick(L.propose), { b: oth.name }), sfx: 'heart', tone: 'happy' });
    out.push({ who: oth, text: pick(L.wed), fx: () => { c.stage = 4; c.bump(8, conf); log(`💒 ${a.name2} and ${b.name2} got married!`); celebrate(c, '💒 Just married!', `${a.name2} ❤ ${b.name2}`, c.homeId); } });
  }
  const good = c.aff >= 42;
  out.push({ who: a, text: T_(good ? L.byeGood : L.byeBad, a, {}), tone: good ? 'happy' : 'sad' });
  out.push({ who: b, text: T_(good ? L.byeGood : L.byeBad, b, {}), tone: good ? 'happy' : 'sad' });
  return out;
}
// Move into one home (a house beats an apartment)
function moveIn(c) {
  const home = c.a.origHome.startsWith('apt') && !c.b.origHome.startsWith('apt') ? c.b.origHome : c.a.origHome;
  c.a.home = c.b.home = home; c.homeId = home; c.together = true;
  c.a.goal = c.b.goal = null;
  return home;
}
const MOVE_IN = {
  ask: ['{b}... what if we lived together?', "I keep wishing I didn't have to say goodbye at night. Move in with me?", 'My place has room for two toothbrushes. Just saying.', 'Should we get a place together?'],
  yes: ["Yes! Let's do it!", "I thought you'd never ask!", 'Only if I get the side of the bed by the window.', "(nods, smiling) Okay. Let's."],
  no: ["Isn't it a bit soon?", 'I like having my own space...', 'Can we wait a little longer?'],
  out: ['I think I need my own space for a while.', 'Maybe living together was too soon.', "I can't keep doing this. I'm moving out.", "We fight every night. I'm going back to my place."],
  outReply: ["...If that's what you want.", 'Fine! Take your stuff!', "Please don't go.", '(silence)', "Don't forget your mug."],
};
function startMoveOut(c) {
  const { a, b } = c;
  const mover = a.origHome !== c.homeId ? a : b.origHome !== c.homeId ? b : null;
  const A = mover || a, B = c.other(A);
  const lines = [
    { who: A, text: fillT(pick(L.fightStart), { p: locName(pick(['fun', 'mall', 'park'])) }), sfx: 'bad' },
    { who: B, text: T_(L.fightBack, B, {}) },
    { who: A, text: pick(MOVE_IN.out) },
    { who: B, text: pick(MOVE_IN.outReply) },
  ];
  if (mover) lines.push({ who: null, text: `(${mover.name} packs a box and heads back to ${locName(mover.origHome)}.)` });
  const phone = !(dist(a, b) < 120 && !a.hidden && !b.hidden);
  A.onPhone = B.onPhone = phone;
  runScene(new Scene('breakup', c, lines, {
    title: 'Moving out', A, B, phone, prio: 4, tone: 'sad',
    onEnd() {
      a.onPhone = b.onPhone = false;
      c.together = false; if (c.stage === 3) c.stage = 2;
      if (mover) { mover.home = mover.origHome; mover.goal = null; }
      c.aff = clamp(c.aff + 8, 0, 100);   // a little relief after the fight
      Director.card('📦 Moving out', `${a.name2} and ${b.name2} live apart now`);
      log(`📦 ${a.name2} and ${b.name2} stopped living together${mover ? `. ${mover.name} moved back to ${locName(mover.origHome)}` : ''}`);
      sfx('bad');
    },
  }));
}

/* ---------------- Texting ---------------- */
function startText(c) {
  const ia = Math.random() < EXTRO[c.a.temper] / (EXTRO[c.a.temper] + EXTRO[c.b.temper]);
  const A = ia ? c.a : c.b, B = c.other(A);
  const m = c.mood(), busy = B.goal && B.goal.act === 'work';
  c.nextText = G.t + rand(50, 150);
  const v = { a: A.name, b: B.name, p: locName(pick(['cafe', 'mall', 'park', 'shop', 'books', 'bar'])), s: statusPhrase(B) };
  const lateP = c.reply ? 0 : (m === 'sour' ? 0.35 : m === 'normal' ? 0.15 : 0.05) + (busy ? 0.12 : 0);
  const lines = [];
  let pool = m, title = { sweet: 'Sweet texts 💬', normal: 'Texting 💬', sour: 'Cold texts 💬' }[m];
  if (Math.random() < lateP) {
    lines.push({ who: A, text: pick(LATE.ask) });
    lines.push({ who: null, text: fillT(pick(LATE.read), { b: B.name }), fx: () => c.bump(-1, A) });
    c.reply = { from: B, to: A, sent: G.t, at: G.t + rand(90, 300) };
    title = 'Left on read 👀';
    log(`👀 ${B.name2} left ${A.name2} on read`);
  } else {
    if (Math.random() < (m === 'sour' ? 0.14 : 0.07)) { pool = 'surprise'; title = 'A little surprise 🎁'; }
    const ex = pick(TEXTS[pool]), [lo, hi] = TEXT_DELTA[pool];
    ex.forEach((t, i) => {
      const ln = { who: i % 2 ? B : A, text: fillT(t, v) };
      if (i === ex.length - 1) ln.fx = () => c.bump(rand(lo, hi), B);
      lines.push(ln);
    });
    if (pool === 'surprise') log(`🎁 ${A.name2} surprised ${B.name2}`);
    if (pool === 'sour') log(`💬 ${A.name2} and ${B.name2} are bickering by text`);
  }
  A.onPhone = B.onPhone = true;
  const tone = title.startsWith('Left') ? 'sad' : { sweet: 'happy', surprise: 'happy', sour: 'sad', normal: 'neutral' }[pool];
  runScene(new Scene('text', c, lines, { title, A, B, phone: true, tone, onEnd() { A.onPhone = B.onPhone = false; } }));
}
function startLateReply(c) {
  const r = c.reply; c.reply = null;
  const hrs = Math.max(1, Math.round((G.t - r.sent) / 60));
  const chill = ['warm', 'shy', 'romantic'].includes(r.to.temper) && c.aff > 50;
  const lines = [
    { who: r.from, text: pick(LATE.sorry) },
    { who: r.to, text: fillT(pick(chill ? LATE.fine : LATE.angry), { h: hrs, b: r.from.name }), fx: () => c.bump(chill ? 0 : -Math.min(12, 2 + hrs * 2), r.to) },
  ];
  log(`⌛ ${r.from.name2} replied to ${r.to.name2} ${hrs} hour${hrs === 1 ? '' : 's'} late`);
  r.from.onPhone = r.to.onPhone = true;
  runScene(new Scene('text', c, lines, { title: `Replying ${hrs}h late`, A: r.from, B: r.to, phone: true, tone: 'neutral', onEnd() { r.from.onPhone = r.to.onPhone = false; } }));
}

/* ---------------- Big moments: fireworks + confetti ---------------- */
function celebrate(c, title, sub, homeId) {
  Director.card(title, sub);
  Director.moment(c, title);
  sfx('love'); burstHearts(c.a, c.b, 40);
  const spots = [{ x: (c.a.x + c.b.x) / 2, y: (c.a.y + c.b.y) / 2 }];
  if (homeId && LOC[homeId]) spots.push(LOC[homeId].center);
  for (let i = 0; i < 14; i++) {
    const s = spots[i % spots.length];
    G.rockets.push({ x: s.x + rand(-70, 70), y: s.y + 10, vy: -rand(120, 170), t: -i * 0.35 - rand(0, 0.2), col: pick(['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ffffff', '#b388ff']) });
  }
  for (let i = 0; i < 160; i++) G.confetti.push({ x: rand(0, 1), y: rand(-0.6, 0), vx: rand(-0.05, 0.05), vy: rand(0.12, 0.3), r: rand(0, 6), vr: rand(-6, 6), col: pick(['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#b388ff']), t: 0 });
}
function startStoodUp(c, waiting) {
  const other = c.other(waiting);
  waiting.lock = 'date';
  const lines = [
    { who: waiting, text: fillT(pick(L.stoodUp), { b: other.name }) },
    { who: waiting, text: "Forget it, I'm leaving.", fx: () => c.bump(-rand(10, 16), waiting) },
  ];
  log(`⏰ ${other.name2} stood up ${waiting.name2}`);
  runScene(new Scene('stood', c, lines, { title: 'Stood up', A: waiting, tone: 'sad', onEnd() { waiting.lock = null; c.clearDate(); c.nextCall = G.t + rand(60, 200); } }));
}
function startBreakup(c) {
  const { a, b } = c;
  const A = EXTRO[a.temper] > EXTRO[b.temper] ? a : b, B = c.other(A);
  const near = dist(a, b) < 120 && !a.hidden && !b.hidden;
  A.onPhone = B.onPhone = !near;
  const lines = [
    { who: A, text: fillT(pick(L.fightStart), { p: locName(pick(['fun', 'mall', 'park'])) }), sfx: near ? 'bad' : 'ring' },
    { who: B, text: T_(L.fightBack, B, {}) },
    { who: A, text: T_(L.breakup, A, {}), sfx: 'bad' },
    { who: B, text: pick(L.breakupReply) },
  ];
  runScene(new Scene(near ? 'breakup' : 'call', c, lines, {
    title: near ? 'About to break up...' : 'Breaking up by phone', A, B, phone: !near, prio: 4, tone: 'sad',
    onEnd() { A.onPhone = B.onPhone = false; endCouple(c, 'breakup', A); },
  }));
}
function endCouple(c, why, who) {
  if (c.broken) return;
  c.broken = true;
  const { a, b } = c;
  if (c.date) c.clearDate();
  G.snaps.push({ a: a.anchor(), b: b.anchor(), t: 0 });
  for (const p of [a, b]) {
    p.partner = null; p.couple = null; p.exes.push(c.other(p).id); p.heartbreakUntil = G.t + 1440;
    if (p.home !== p.origHome) { p.home = p.origHome; p.goal = null; }
    c.together = false;
  }
  G.couples = G.couples.filter(x => x !== c);
  sfx('snap');
  if (why === 'cut') { Director.card('✂️ Thread cut', `${a.name2} and ${b.name2} are single again`); log(`✂️ You cut the red thread between ${a.name2} and ${b.name2}`); }
  else { Director.card('💔 Broke up', `${a.name2} and ${b.name2} · free to pair again`); log(`💔 ${(who || a).name2} and ${c.other(who || a).name2} broke up. Both are single and can be paired again`); }
}
function tryBind(a, b) {
  if (a === b) return false;
  if (a.partner || b.partner) {
    const t = a.partner ? a : b;
    toast(`${t.name2} is already tied to ${t.partner.name2}. You can cut that thread in the list on the right.`);
    sfx('bad');
    return false;
  }
  const c = new Couple(a, b);
  G.couples.push(c);
  G.binds = G.binds || []; G.binds.push({ c, t: 0 });
  sfx('bind');
  Director.card('🧶 Red thread tied', `${a.name2} ❤ ${b.name2} · match ${'★'.repeat(c.stars())}${'☆'.repeat(5 - c.stars())}`);
  Director.offer({ kind: 'bind', c, A: a, B: b, prio: 5, dur: 4.5, title: 'Matchmaker at work' });
  log(`🧶 You tied a red thread between ${a.name2} and ${b.name2} (match ${'★'.repeat(c.stars())})`);
  return true;
}
function burstHearts(a, b, n = 20) {
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 20 };
  for (let i = 0; i < n; i++) G.hearts.push({ x: m.x + rand(-20, 20), y: m.y + rand(-10, 10), vx: rand(-14, 14), vy: rand(-36, -12), t: 0, life: rand(1.4, 2.6) });
}

/* ---------------- 日志 ---------------- */
function log(html) {
  G.log.unshift({ time: `Day ${day() + 1} ${clockStr()}`, html });
  if (G.log.length > 80) G.log.pop();
  if (typeof onLog === 'function') onLog();
}

/* ---------------- 描述（字幕、名单用） ---------------- */
function describe(a) {
  const c = a.couple;
  if (c && c.scene && !c.scene.done) {
    const k = c.scene.kind;
    if (k === 'date') return `on a date with ${a.partner.name}`;
    if (k === 'breakup') return `arguing with ${a.partner.name}`;
    if (k === 'call') return `on the phone with ${a.partner.name}`;
    if (k === 'stood') return 'fuming after being stood up';
  }
  if (a.chase) return 'chasing a thief! 🚔';
  if (a.driving) {
    const f = a.car.passenger;
    return f && a.car.state === 'carry' ? `driving a taxi with ${f.name2} in the back` : f ? `on the way to pick up ${f.name2}` : 'cruising around in the taxi';
  }
  const g = a.goal;
  if (!g) return 'spacing out';
  const where = locName(g.loc);
  const T = a.trip;
  if (T) {
    const to = isHome(g.loc) ? 'home' : `to ${where}${g.act === 'date' ? ' for a date' : g.act === 'lunch' ? ' for lunch' : ''}`;
    if (T.stage === 'wait') return `hailing a taxi to go ${to}`;
    if (T.stage === 'ride') return T.mode === 'car' ? `driving ${to}` : `taking a taxi ${to}`;
    if (T.toTaxi) return 'walking to the taxi';
    return `${T.mode === 'bike' ? 'cycling' : 'walking'} ${to}`;
  }
  if (g.mode === 'roam') return g.label;
  if (g.act === 'sleep') return 'asleep at home 💤';
  if (g.act === 'home') return g.label;
  if (g.act === 'date') return `at ${where}, waiting for ${a.partner ? a.partner.name : 'someone'}`;
  return `${g.label} at ${where}`;
}

/* ---------------- Job drama: the doctor's emergencies, the police officer's chases ---------------- */
G.nextEmergency = G.t + rand(240, 700);
G.nextCase = G.t + rand(150, 500);
G.robber = null;
const ROBBER_LOOK = { skin: '#e0ac69', hair: { s: 'short', c: '#111' }, hat: { t: 'beanie', c: '#111' }, top: { t: 'stripe', c: '#222', c2: '#eee' }, bottom: { t: 'pants', c: '#111' }, shoes: '#111', acc: ['sunglasses', 'backpack'], h: 1.0, w: 1.0 };
function jobCall(who, lines, title, onEnd) {
  who.onPhone = true;
  sfx('ring');
  runScene(new Scene('job', null, lines, { title, A: who, phone: true, prio: 3, tone: 'sad', onEnd() { who.onPhone = false; onEnd(); } }));
}
function jobEvents() {
  const doc = G.agents.find(a => a.special === 'emergency'), cop = G.agents.find(a => a.special === 'police');
  if (doc && G.t >= G.nextEmergency) {
    if (doc.lock || doc.onPhone || (doc.goal && doc.goal.emergency)) G.nextEmergency = G.t + 20;
    else {
      G.nextEmergency = G.t + rand(600, 1400);
      const h = tod() / 60, night = h < 6 || h > 22;
      jobCall(doc, [
        { who: null, text: `(${doc.name}'s phone rings${night ? ' in the middle of the night' : h < 9 ? ' at dawn' : ''}. It's the hospital.)` },
        { who: doc, text: pick(["Hello? ...A car crash? I'm on my way!", 'Dr. Ava speaking. ...Code blue? Five minutes!', "Again?! ...Okay. Prep the OR, I'm coming.", "...How many injured? Don't move them, I'm coming."]) },
      ], '🚑 Emergency call', () => {
        const start = G.t, end = G.t + rand(120, 220);
        doc.extras.push({ start, end, loc: 'hospital', act: 'work', mode: 'inside', label: 'handling an emergency 🚑', emergency: true });
        doc.goal = null;
        log(`🚑 ${doc.name2} was called in for an emergency`);
        const c = doc.couple;
        if (c && c.date && c.date.start < end + 60) {
          c.clearDate(); c.bump(-6, c.other(doc));
          c.other(doc).say(pick(['An emergency? Again?!', '...I understand. Go save lives.', "Seriously? We had plans!"]), 3.5, 'text', doc, 'sad');
          log(`💔 ${doc.name2} had to cancel a date with ${c.other(doc).name2}`);
        }
      });
    }
  }
  if (cop && G.t >= G.nextCase && !G.robber) {
    if (cop.lock || cop.onPhone || cop.chase || cop.inCar) G.nextCase = G.t + 20;
    else {
      G.nextCase = G.t + rand(500, 1200);
      const L = LOC[pick(['market', 'shop', 'mall', 'bar', 'hotpot', 'books'])];
      jobCall(cop, [
        { who: null, text: `(${cop.name}'s radio crackles: "Robbery at ${L.name}! Suspect on foot!")` },
        { who: cop, text: pick(['On my way!', 'Copy that. In pursuit!', 'Not on my watch.', "Ugh, I was about to eat. Fine. Going!"]) },
      ], '🚔 Police call', () => {
        const far = pick(ROAM_TARGETS.filter(x => manh(x.door, L.door) > 600));
        G.robber = { x: L.door.x, y: L.door.y, look: ROBBER_LOOK, phase: 0, facing: 1, path: walkRoute(L.door, far.door), pi: 0, t: 0, caught: 0 };
        cop.leave(); cop.trip = null; cop.hidden = false; cop.chase = true; cop.chaseT = 0;
        log(`🚔 ${cop.name2} is chasing a thief from ${L.name}!`);
        Director.offer({ kind: 'chase', A: cop, prio: 3, dur: 22, title: '🚔 Chase!' });
      });
    }
  }
}
function robberTick(dtG) {
  const r = G.robber; if (!r) return;
  r.t += dtG;
  if (r.caught) { if (G.realT - r.caught > 2.5) G.robber = null; return; }
  let step = WALK * 1.45 * dtG;
  while (step > 0) {
    const tgt = r.path[r.pi + 1];
    if (!tgt) { const far = pick(ROAM_TARGETS); r.path = walkRoute({ x: r.x, y: r.y }, far.door); r.pi = 0; break; }
    const dx = tgt.x - r.x, dy = tgt.y - r.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 0.3) r.facing = dx > 0 ? 1 : -1;
    if (d <= step) { r.x = tgt.x; r.y = tgt.y; r.pi++; step -= d; } else { r.x += dx / d * step; r.y += dy / d * step; step = 0; }
  }
  r.phase += dtG * 3.2;
  if (r.t > 260) { log('🦹 The thief got away this time...'); G.robber = null; for (const a of G.agents) if (a.chase) { a.chase = false; a.goal = null; } }
}
Agent.prototype.chaseTick = function (dtG) {
  const r = G.robber;
  if (!r || r.caught) { this.chase = false; this.goal = null; this.moving = false; return; }
  const dx = r.x - this.x, dy = r.y - this.y, d = Math.hypot(dx, dy), step = WALK * 1.75 * dtG;
  this.moving = true; this.pose = 'stand'; this.facing = dx > 0 ? 1 : -1; this.phase += dtG * 3.5;
  if (d < 14) {
    r.caught = G.realT;
    this.say(pick(["Freeze! You're under arrest! 🚔", 'Gotcha! Hands where I can see them!', "End of the line, buddy."]), 3.5, 'say', null, 'happy');
    log(`🚔 ${this.name2} caught the thief!`);
    Director.card('🚔 Caught!', `${this.name2} got the thief`);
    sfx('heart'); this.chase = false; this.goal = null; this.moving = false;
    return;
  }
  this.x += dx / d * Math.min(step, d); this.y += dy / d * Math.min(step, d);
};
