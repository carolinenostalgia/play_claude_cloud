/* 红线小镇 · 导演镜头、输入（鼠标 / 触摸 / 手势）、界面、声音、主循环。 */
'use strict';

/* ---------------- 声音 ---------------- */
let AC = null, muted = false;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d, type = 'sine', vol = 0.08, delay = 0, slide = 0) {
  if (muted || !AC) return;
  const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t0 + d);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.05);
}
function sfx(n) {
  if (!AC) return;
  if (n === 'bind') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.07, i * 0.09));
  if (n === 'ring') for (let i = 0; i < 2; i++) { tone(880, 0.12, 'square', 0.025, i * 0.32); tone(1100, 0.12, 'square', 0.025, i * 0.32 + 0.13); }
  if (n === 'snap') { tone(300, 0.3, 'sawtooth', 0.06, 0, 0.3); tone(120, 0.4, 'sine', 0.08, 0.05); }
  if (n === 'heart') [659, 880].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, i * 0.12));
  if (n === 'love') [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.5, 'triangle', 0.06, i * 0.12));
  if (n === 'bad') tone(220, 0.35, 'triangle', 0.06, 0, 0.7);
  if (n === 'door') tone(700, 0.06, 'square', 0.015);
  if (n === 'pick') tone(990, 0.08, 'sine', 0.06);
  if (n === 'pop') { tone(rand(500, 900), 0.18, 'triangle', 0.03, 0, 0.4); }
}

/* ---------------- 导演 ---------------- */
const PRIO = { bind: 5, moment: 5, breakup: 4, date: 3, job: 3, chase: 3, call: 2, stood: 2, text: 1 };
const Director = {
  mode: 'director', god: false, lastHand: -99,
  cam: { x: WORLD_W / 2, y: WORLD_H / 2, z: 0.6 }, camL: { x: 0, y: 0, z: 1 }, camR: { x: 0, y: 0, z: 1 },
  shot: null, queue: [], letter: 0, sub: null, cards: [], recent: [], recentCouples: [],
  offer(s) { this.queue.push({ s, prio: s.prio || PRIO[s.kind] || 1, at: G.realT }); },
  subtitle(text, dur) { this.sub = { text, t: 0, dur }; },
  card(title, sub) { this.cards.push({ title, sub, t: 0, dur: 3.4 }); },
  // A big moment (moving in, wedding): stay on the couple if we already are, otherwise cut to them
  moment(c, title) {
    const sh = this.shot;
    if (sh && sh.couple === c) { sh.cine = true; if (!sh.scene) sh.until = Math.max(sh.until || 0, G.realT + 8); return; }
    this.offer({ kind: 'moment', c, A: c.a, B: c.b, prio: 5, dur: 9, title });
  },
  focusSet() {
    const s = new Set(), sh = this.shot;
    if (!sh || this.mode !== 'director' || this.god) return s;
    if (sh.A) s.add(sh.A); if (sh.B) s.add(sh.B);
    return s;
  },
  follow(a, secs = 14) {
    if (this.mode !== 'director') setCamMode('director');
    this.shot = { type: 'follow', A: a, until: G.realT + secs, prio: 1.5 };
  },
  shotFrom(q) {
    const s = q.s;
    if (s.kind === 'bind' || s.kind === 'moment') return { type: 'pair', A: s.A, B: s.B, until: G.realT + s.dur, prio: q.prio, cine: true, title: s.title, couple: s.c };
    const A = s.A || (s.c && s.c.a), B = s.B || (s.c && s.c.b);
    if (s.kind === 'chase') return { type: 'follow', A: s.A, until: G.realT + s.dur, prio: q.prio, cine: true, title: s.title };
    if (s.kind === 'stood' || !B) return { type: 'follow', A, scene: s, prio: q.prio, cine: true, title: s.title };
    const far = A && B && dist(focusPt(A), focusPt(B)) > 260;
    return { type: far ? 'split' : 'pair', A, B, scene: s, prio: q.prio, cine: true, title: s.title };
  },
  idle() {
    const r = Math.random();
    // With red threads around, mostly stay on one couple at a time
    if (G.couples.length && r < 0.6) {
      const cs = G.couples.filter(c => !this.recentCouples.includes(c));
      const c = pick(cs.length ? cs : G.couples);
      this.recentCouples.push(c); if (this.recentCouples.length > Math.max(1, G.couples.length - 1)) this.recentCouples.shift();
      if (dist(focusPt(c.a), focusPt(c.b)) < 320) return { type: 'pair', A: c.a, B: c.b, until: G.realT + rand(14, 18), prio: 0, couple: c };
      const A = c.a.hidden && !c.b.hidden ? c.b : c.a;
      return { type: 'follow', A, until: G.realT + rand(12, 15), prio: 0, couple: c };
    }
    if (r < 0.68) return { type: 'wide', until: G.realT + 6, prio: 0 };
    if (r < 0.78) {
      const opts = BUILDINGS.filter(L => L.inside.size > 0 && !isHome(L.id));
      if (opts.length) return { type: 'loc', L: pick(opts), until: G.realT + 8, prio: 0 };
    }
    const pool = [];
    for (const a of G.agents) {
      if (!a.main || this.recent.includes(a)) continue;
      let w = a.hidden ? 0.25 : 2;
      if (a.moving || a.inCar) w *= 1.6;
      if (a.partner) w *= 2;
      if (a.goal && a.goal.act === 'sleep') w *= 0.1;
      pool.push([a, w]);
    }
    let tot = pool.reduce((s, p) => s + p[1], 0), k = Math.random() * tot, A = pool[0][0];
    for (const [a, w] of pool) { k -= w; if (k <= 0) { A = a; break; } }
    this.recent.push(A); if (this.recent.length > 6) this.recent.shift();
    return { type: 'follow', A, until: G.realT + rand(11, 14), prio: 0 };
  },
  update(dt) {
    const k = 1 - Math.exp(-dt * 2.6);
    if (G.realT - this.lastHand < 2.2) this.god = true; else this.god = false;
    const v = { x: 0, y: 0, w: SW_, h: SH_ };
    const fz = fitZoom(v);
    this.queue = this.queue.filter(q => !(q.s.done) && G.realT - q.at < (q.s.kind === 'bind' ? 6 : 40));
    if (this.cards.length) { this.cards[0].t += dt; if (this.cards[0].t >= this.cards[0].dur) this.cards.shift(); }
    if (this.sub) { this.sub.t += dt; if (this.sub.t > this.sub.dur) this.sub = null; }
    if (this.mode === 'free') { this.letter = lerp(this.letter, 0, k * 2); this.shot = this.shot && this.shot.type === 'follow' ? null : this.shot; return; }
    if (this.god) {
      this.letter = lerp(this.letter, 0, k * 2);
      this.cam.x = lerp(this.cam.x, WORLD_W / 2, k); this.cam.y = lerp(this.cam.y, WORLD_H / 2 + 10, k); this.cam.z = lerp(this.cam.z, fz, k);
      return;
    }
    let sh = this.shot;
    const finished = !sh || (sh.scene ? (sh.scene.done && (sh.doneAt = sh.doneAt || G.realT) && G.realT - sh.doneAt > 3) : G.realT > sh.until);
    // The couple we were just watching goes first, then the most important, then the oldest
    const cur = sh && (sh.couple || (sh.scene && sh.scene.c));
    const top = this.queue.slice().sort((p, q) => ((q.s.c === cur) - (p.s.c === cur)) || q.prio - p.prio || p.at - q.at)[0];
    const busy = sh && ((sh.scene && !finished) || sh.prio >= 5);
    const idleLong = sh && !sh.scene && sh.prio < 2 && G.realT - (sh.started || 0) > 4;
    if (top && (finished || (top.prio >= 5 && !(sh && sh.prio >= 5)) || (!busy && idleLong && top.prio >= 2))) {
      this.queue.splice(this.queue.indexOf(top), 1);
      this.cut(this.shotFrom(top));
    } else if (finished) this.cut(this.idle());
    sh = this.shot;
    this.letter = lerp(this.letter, sh.cine ? 1 : 0, k * 1.5);
    if (sh.type === 'split') {
      const half = { w: SW_ / 2, h: SH_ };
      const zf = clamp(fitZoom(half) * 4.2, 1.1, 2.6);
      for (const [cam, a] of [[this.camL, sh.A], [this.camR, sh.B]]) {
        const p = focusPt(a); cam.x = lerp(cam.x, p.x, k); cam.y = lerp(cam.y, p.y, k); cam.z = lerp(cam.z, zf, k);
      }
      if (sh.A && sh.B && dist(focusPt(sh.A), focusPt(sh.B)) < 180) { sh.type = 'pair'; this.cam = { ...this.camL }; }
      return;
    }
    let tx = WORLD_W / 2, ty = WORLD_H / 2 + 10, tz = fz;
    if (sh.type === 'follow') { const p = focusPt(sh.A); tx = p.x; ty = p.y; tz = clamp(fz * 3.6, 1.0, 2.7); }
    if (sh.type === 'pair') {
      const p = focusPt(sh.A), q = focusPt(sh.B);
      tx = (p.x + q.x) / 2; ty = (p.y + q.y) / 2;
      tz = clamp(Math.min(SW_ / (Math.abs(p.x - q.x) + 280), SH_ / (Math.abs(p.y - q.y) + 260)), fz * 1.2, clamp(fz * 4.4, 1.2, 3.1));
      if (sh.scene && sh.scene.phone && dist(p, q) > 320) { sh.type = 'split'; this.camL = { ...this.cam }; this.camR = { ...this.cam }; }
    }
    if (sh.type === 'loc') { tx = sh.L.x + sh.L.w / 2; ty = sh.L.y + sh.L.h / 2; tz = clamp(fz * 2.8, 0.9, 2.1); }
    // 不让镜头拍到城外
    const hw = SW_ / 2 / tz, hh = SH_ / 2 / tz;
    tx = hw * 2 < WORLD_W ? clamp(tx, hw, WORLD_W - hw) : WORLD_W / 2;
    ty = hh * 2 < WORLD_H ? clamp(ty, hh, WORLD_H - hh) : WORLD_H / 2;
    this.cam.x = lerp(this.cam.x, tx, k); this.cam.y = lerp(this.cam.y, ty, k); this.cam.z = lerp(this.cam.z, tz, k);
  },
  cut(sh) {
    const was = this.shot;
    sh.started = G.realT;
    if (!sh.couple && sh.scene) sh.couple = sh.scene.c;
    this.shot = sh;
    if (sh.type === 'split') {
      const p = focusPt(sh.A), q = focusPt(sh.B), z = clamp(fitZoom({ w: SW_ / 2, h: SH_ }) * 4.2, 1.1, 2.6);
      this.camL = { x: p.x, y: p.y, z }; this.camR = { x: q.x, y: q.y, z };
    } else if (sh.cine || (was && was.type === 'split')) {
      // 剧情镜头直接切过去（像剪辑），闲逛镜头才慢慢推
      const p = sh.A ? focusPt(sh.A) : this.cam, q = sh.B ? focusPt(sh.B) : p;
      this.cam = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: Math.max(this.cam.z, fitZoom({ w: SW_, h: SH_ }) * 2.6) };
    }
  },
  caption() {
    const sh = this.shot;
    if (this.mode === 'free') return '';
    if (this.god) return '';
    if (!sh) return '';
    if (sh.title && sh.A && sh.B) return `${sh.title} · ${sh.A.name2} ✕ ${sh.B.name2}`;
    if (sh.title && sh.A) return `${sh.title} · ${sh.A.name2}`;
    if (sh.type === 'follow') return `${sh.A.name2} (${sh.A.job}) · ${describe(sh.A)}`;
    if (sh.type === 'wide') return `Red Thread Town · Day ${day() + 1}, ${WEEK[day() % 7]} ${clockStr()} · ${G.couples.length} red thread${G.couples.length === 1 ? '' : 's'}`;
    if (sh.type === 'loc') return `${sh.L.emoji || ''} ${sh.L.name} · inside: ${[...sh.L.inside].map(a => a.id).sort().join(', ')}`;
    return '';
  },
  views() {
    const sh = this.shot;
    if (this.mode === 'director' && !this.god && sh && sh.type === 'split') {
      const w = Math.floor(SW_ / 2);
      return [{ x: 0, y: 0, w: w - 2, h: SH_, cam: this.camL, key: 'L', who: sh.A }, { x: w + 2, y: 0, w: SW_ - w - 2, h: SH_, cam: this.camR, key: 'R', who: sh.B }];
    }
    return [{ x: 0, y: 0, w: SW_, h: SH_, cam: this.cam, key: 'M' }];
  },
};
function focusPt(a) {
  if (!a) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  if (a.inCar) return a.inCar.lanePos();
  if (a.hidden && a.at && LOC[a.at] && LOC[a.at].x !== undefined) { const L = LOC[a.at]; return { x: L.x + L.w / 2, y: L.y + L.h / 2 }; }
  return { x: a.x, y: a.y - 14 };
}

/* ---------------- 输入：鼠标 / 触摸 / 手势 共用 ---------------- */
const UI = { pending: null, hovered: new Set(), ptr: {}, pan: null };
function hitTest(x, y) {
  let best = null, bd = Infinity;
  for (const h of hitTargets) {
    if (x < h.v.x || x > h.v.x + h.v.w || y < h.v.y || y > h.v.y + h.v.h) continue;
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < h.r && d < bd) { bd = d; best = h.a; }
  }
  if (best) return best;
  // 没点到标签，就找最近的小人身体
  for (const v of viewsNow) {
    if (x < v.x || x > v.x + v.w || y < v.y || y > v.y + v.h) continue;
    const w = s2w(v, x, y);
    for (const a of G.agents) {
      if (!a.main || a.hidden || a.inCar) continue;
      const d = Math.hypot(a.x - w.x, a.y - 14 - w.y) * v.cam.z;
      if (d < 22 && d < bd) { bd = d; best = a; }
    }
  }
  return best;
}
function pDown(id, x, y, kind) {
  audio();
  UI.ptr[id] = { x, y, down: true, kind, sx: x, sy: y, moved: 0 };
  const a = hitTest(x, y);
  if (a) {
    if (UI.pending && UI.pending.agent !== a) { const p = UI.pending.agent; UI.pending = null; tryBind(p, a); UI.ptr[id].used = true; return; }
    if (UI.pending && UI.pending.agent === a) { UI.pending.pid = id; UI.pending.at = G.realT; return; }
    UI.pending = { agent: a, pid: id, at: G.realT };
    sfx('pick');
    toast(`Picked ${a.name2} (${a.job}). Now ${kind === 'hand' ? 'pinch' : 'click'} someone else to tie a red thread.`, 2.2);
    return;
  }
  if (kind !== 'hand') UI.pan = { id, x, y, cam: { ...Director.cam } };
}
function pMove(id, x, y) {
  const p = UI.ptr[id]; if (!p) { UI.ptr[id] = { x, y, down: false }; return; }
  if (p.down) p.moved += Math.hypot(x - p.x, y - p.y);
  p.x = x; p.y = y;
  if (UI.pan && UI.pan.id === id && p.moved > 6) {
    if (Director.mode !== 'free') setCamMode('free');
    const z = Director.cam.z;
    Director.cam.x = UI.pan.cam.x - (x - UI.pan.x) / z; Director.cam.y = UI.pan.cam.y - (y - UI.pan.y) / z;
    clampCam();
  }
}
function pUp(id, x, y) {
  const p = UI.ptr[id];
  if (UI.pan && UI.pan.id === id) {
    if (p && p.moved < 6 && UI.pending && !hitTest(x, y)) { UI.pending = null; toast('Selection cleared', 1); }
    UI.pan = null;
  }
  if (UI.pending && UI.pending.pid === id && p && !p.used && p.moved > 18) {
    const a = hitTest(x, y);
    if (a && a !== UI.pending.agent) { const s = UI.pending.agent; UI.pending = null; tryBind(s, a); }
  }
  if (p) { p.down = false; p.used = false; }
  if (p && p.kind !== 'mouse') delete UI.ptr[id];
}
function clampCam() { const c = Director.cam; c.x = clamp(c.x, 0, WORLD_W); c.y = clamp(c.y, 0, WORLD_H); c.z = clamp(c.z, fitZoom({ w: SW_, h: SH_ }) * 0.9, 4); }

cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pDown('p' + e.pointerId, e.clientX, e.clientY, e.pointerType === 'mouse' ? 'mouse' : 'touch'); });
cv.addEventListener('pointermove', e => pMove('p' + e.pointerId, e.clientX, e.clientY));
cv.addEventListener('pointerup', e => pUp('p' + e.pointerId, e.clientX, e.clientY));
cv.addEventListener('pointercancel', e => pUp('p' + e.pointerId, e.clientX, e.clientY));
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (Director.mode !== 'free') setCamMode('free');
  const v = viewsNow[0], before = s2w(v, e.clientX, e.clientY);
  Director.cam.z *= Math.exp(-e.deltaY * 0.0015); clampCam();
  const after = s2w(v, e.clientX, e.clientY);
  Director.cam.x += before.x - after.x; Director.cam.y += before.y - after.y; clampCam();
}, { passive: false });
// 两指缩放（触摸）
const touches = new Map();
cv.addEventListener('touchstart', e => { for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY }); }, { passive: true });
cv.addEventListener('touchmove', e => {
  const prev = [...touches.values()];
  for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
  if (touches.size === 2 && prev.length === 2) {
    const now = [...touches.values()];
    const d0 = Math.hypot(prev[0].x - prev[1].x, prev[0].y - prev[1].y), d1 = Math.hypot(now[0].x - now[1].x, now[0].y - now[1].y);
    if (d0 > 10) { if (Director.mode !== 'free') setCamMode('free'); Director.cam.z *= d1 / d0; clampCam(); }
    UI.pan = null;
  }
}, { passive: true });
cv.addEventListener('touchend', e => { for (const t of e.changedTouches) touches.delete(t.identifier); }, { passive: true });

// 手势
const handPrev = {};
function pollHands(now) {
  const HI = window.HandInput;
  if (!HI || !HI.ready) return [];
  const hands = HI.poll(now, SW_, SH_);
  const seen = new Set();
  for (const h of hands) {
    seen.add(h.id); Director.lastHand = G.realT;
    const was = handPrev[h.id];
    pMove(h.id, h.x, h.y);
    if (h.pinch && !(was && was.pinch)) pDown(h.id, h.x, h.y, 'hand');
    if (!h.pinch && was && was.pinch) pUp(h.id, h.x, h.y);
    handPrev[h.id] = h;
  }
  for (const id in handPrev) if (!seen.has(id)) { if (handPrev[id].pinch) pUp(id, handPrev[id].x, handPrev[id].y); delete handPrev[id]; delete UI.ptr[id]; }
  return hands;
}

/* ---------------- 界面 ---------------- */
const $ = s => document.querySelector(s);
let toastTimer = 0;
function toast(msg, secs = 3) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); toastTimer = secs; }
function setCamMode(m) {
  Director.mode = m;
  $('#camMode').textContent = m === 'director' ? '🎬 Director cam' : '🖐 Free cam';
  $('#camMode').classList.toggle('on', m === 'director');
  if (m === 'director') Director.shot = null;
}
$('#camMode').addEventListener('click', () => { audio(); setCamMode(Director.mode === 'director' ? 'free' : 'director'); toast(Director.mode === 'director' ? 'The director cuts between shots to show you what everyone is up to' : 'Free cam: drag to pan, scroll or pinch to zoom', 2.4); });
document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => { audio(); setSpeed(+b.dataset.speed); }));
function setSpeed(s) { G.speed = s; document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === s)); }
$('#rosterBtn').addEventListener('click', () => document.body.classList.toggle('roster-open'));
$('#muteBtn').addEventListener('click', () => { muted = !muted; $('#muteBtn').textContent = muted ? '🔇' : '🔊'; audio(); });
$('#logBtn').addEventListener('click', () => document.body.classList.toggle('log-open'));
window.addEventListener('keydown', e => {
  if (e.key === ' ') { setSpeed(G.speed ? 0 : 1); e.preventDefault(); }
  if (e.key === '1') setSpeed(1); if (e.key === '2') setSpeed(2); if (e.key === '3') setSpeed(4);
  if (e.key === 'Escape' && UI.pending) { UI.pending = null; toast('Selection cleared', 1); }
});

// 名单
function buildRoster() {
  const box = $('#people');
  for (const a of G.agents.filter(a => a.main)) {
    const row = document.createElement('div'); row.className = 'person';
    row.innerHTML = `<canvas width="72" height="88"></canvas><div class="info"><div class="nm"><b style="background:${a.color}">${a.id}</b>${a.name}<span class="job">${a.job} · ${TEMPER_NAME[a.temper]}</span></div><div class="home"></div><div class="st"></div><div class="rel"></div></div>`;
    const pc = row.querySelector('canvas').getContext('2d');
    pc.scale(2, 2); drawPerson(pc, a, 18, 41, { scale: 1.12, pose: 'stand', facing: 1 });
    row.addEventListener('click', () => {
      audio();
      if (UI.pending && UI.pending.agent !== a) { const s = UI.pending.agent; UI.pending = null; tryBind(s, a); return; }
      Director.follow(a); toast(`Following ${a.name2} · likes ${a.likes.join(', ')}`, 2.5);
    });
    row.title = `${a.name}, ${a.age}, ${a.job}. Likes: ${a.likes.join(', ')}. Temper: ${TEMPER_NAME[a.temper]}`;
    a.row = row; box.appendChild(row);
  }
}
function heartsHTML(c) {
  const h = c.hearts(), full = Math.floor(h), half = h - full >= 0.5 ? 1 : 0;
  return `<span class="hearts" title="How they feel about each other">${'♥'.repeat(full)}${half ? '<i>♥</i>' : ''}<b>${'♥'.repeat(5 - full - half)}</b></span>`;
}
function refreshRoster() {
  for (const a of G.agents.filter(a => a.main)) {
    a.row.querySelector('.st').textContent = describe(a);
    a.row.querySelector('.home').textContent = `🏠 ${locName(a.home)}${a.home !== a.origHome ? ` (with ${a.partner ? a.partner.name : 'partner'})` : ''}`;
    const c = a.couple, rel = a.row.querySelector('.rel');
    if (c) rel.innerHTML = `<span class="tag s${Math.min(c.stage, 3)}">${c.stage >= 2 ? '❤️' : '🧶'} ${a.partner.id} ${a.partner.name} · ${stageLabel(c)}</span>${heartsHTML(c)}`;
    else rel.innerHTML = a.heartbreakUntil > G.t ? '<span class="tag broken">💔 Just broke up</span>' : a.exes.length ? `<span class="tag single">Single · ex: ${a.exes.join(', ')}</span>` : '<span class="tag single">Single</span>';
    a.row.classList.toggle('sel', UI.pending && UI.pending.agent === a);
  }
  const cbox = $('#couples');
  const sig = G.couples.map(c => `${c.id}:${c.stage}:${c.hearts()}:${c.together}:${c.dates}:${c.date ? 1 : 0}`).join('|');
  if (cbox.dataset.sig !== sig) {
    cbox.dataset.sig = sig;
    cbox.innerHTML = G.couples.length ? '' : '<div class="empty">No red threads yet. Click (or pinch) one person, then another.</div>';
    for (const c of G.couples) {
      const d = document.createElement('div'); d.className = 'couple';
      d.innerHTML = `<div><b style="background:${c.a.color}">${c.a.id}</b>${c.a.name} <span class="heart">${c.stage >= 2 ? '❤️' : '🧶'}</span> <b style="background:${c.b.color}">${c.b.id}</b>${c.b.name}</div>
        <div class="meta">${heartsHTML(c)} ${stageLabel(c)}${c.together ? ` · 🏠 ${locName(c.homeId)}` : ''} · ${c.dates} date${c.dates === 1 ? '' : 's'}${c.date ? ` · next date ${whenStr(c.date.start)}` : ''}</div>
        <div class="acts"><button class="watch">👀 Watch them</button><button class="cut">✂️ Cut the thread</button></div>`;
      d.querySelector('.watch').onclick = () => { Director.follow(c.a, 12); };
      d.querySelector('.cut').onclick = () => { endCouple(c, 'cut'); };
      cbox.appendChild(d);
    }
  }
}
function onLog() {
  const el = $('#log');
  el.innerHTML = G.log.slice(0, 30).map((l, i) => `<div class="ln${i === 0 ? ' new' : ''}"><span class="t">${l.time}</span>${l.html}</div>`).join('');
}

/* ---------------- 摄像头 ---------------- */
$('#camBtn').addEventListener('click', () => startCam());
async function startCam() {
  audio();
  const HI = window.HandInput;
  if (!HI) { toast('Hand tracking is still loading. Try again in a moment.'); return; }
  document.body.classList.add('cam-on');
  $('#camBtn').classList.add('on');
  try {
    await HI.start(p => { $('#camStatus').textContent = p; });
    $('#camStatus').textContent = "Raise a hand for the bird's-eye view. Pinch one person with thumb and index finger, then another.";
    toast("Camera's on! Hold a hand up and pinch a person with your thumb and index finger", 4);
  } catch (err) {
    console.error(err);
    $('#camStatus').textContent = "Can't open the camera: " + (err && err.name === 'NotAllowedError' ? 'permission was denied' : 'not supported on this device');
    toast("Can't open the camera. You can still click people to tie threads.", 4);
  }
}

/* ---------------- 叠加层：黑边、字幕、卡片、手 ---------------- */
function drawOverlay(views, hands) {
  const c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const D = Director, lb = D.letter * Math.min(64, SH_ * 0.085);
  if (views.length === 2) {
    c.fillStyle = '#111'; c.fillRect(views[0].w, 0, 4, SH_);
    for (const v of views) {
      if (!v.who) continue;
      const txt = `📞 ${v.who.name2} · ${describe(v.who)}`;
      c.font = '600 13px "Nunito","Segoe UI",system-ui,sans-serif';
      const w = c.measureText(txt).width + 20;
      c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, v.x + 12, lb + 62, w, 26, 13); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, v.x + 22, lb + 75);
    }
  }
  if (lb > 0.5) { c.fillStyle = '#000'; c.fillRect(0, 0, SW_, lb); c.fillRect(0, SH_ - lb, SW_, lb); }
  // 镜头说明
  const cap = D.caption();
  if (cap) {
    c.font = '600 14px "Nunito","Segoe UI",system-ui,sans-serif';
    const tw = Math.min(c.measureText(cap).width, SW_ - 40);
    const y = SH_ - Math.max(lb, 0) - (lb > 8 ? -lb / 2 : 26);
    if (lb <= 8) { c.fillStyle = 'rgba(15,15,25,.6)'; rr(c, SW_ / 2 - tw / 2 - 14, y - 14, tw + 28, 28, 14); c.fill(); }
    c.fillStyle = lb > 8 ? '#f5f5f5' : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText((D.shot && D.shot.cine ? '🎬 ' : '👁 ') + cap, SW_ / 2, y, SW_ - 40);
  }
  if (D.sub) {
    const s = D.sub, a = clamp(Math.min(s.t / 0.2, (s.dur - s.t) / 0.3), 0, 1);
    c.globalAlpha = a;
    c.font = 'italic 600 17px "Nunito","Segoe UI",system-ui,sans-serif';
    const lines = wrapText(c, s.text, Math.min(560, SW_ - 60));
    const y0 = SH_ - lb - 70 - (lines.length - 1) * 22;
    lines.forEach((l, i) => { c.textAlign = 'center'; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 4; c.strokeText(l, SW_ / 2, y0 + i * 22); c.fillStyle = '#fff6d6'; c.fillText(l, SW_ / 2, y0 + i * 22); });
    c.globalAlpha = 1;
  }
  for (const k of G.confetti) {
    c.save(); c.translate(k.x * SW_, k.y * SH_); c.rotate(k.r); c.fillStyle = k.col; c.fillRect(-4, -2, 8, 4); c.restore();
  }
  const cd = D.cards[0];
  if (cd) {
    const a = clamp(Math.min(cd.t / 0.35, (cd.dur - cd.t) / 0.5), 0, 1), sc = 0.9 + 0.1 * clamp(cd.t / 0.35, 0, 1);
    c.save(); c.globalAlpha = a; c.translate(SW_ / 2, SH_ * 0.36); c.scale(sc, sc);
    c.font = '900 40px "Nunito","Segoe UI",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 8; c.strokeStyle = 'rgba(80,0,20,.55)'; c.strokeText(cd.title, 0, 0); c.fillStyle = '#fff'; c.fillText(cd.title, 0, 0);
    c.font = '600 16px "Nunito","Segoe UI",system-ui,sans-serif'; c.lineWidth = 4; c.strokeText(cd.sub, 0, 40); c.fillStyle = '#ffe3ea'; c.fillText(cd.sub, 0, 40);
    c.restore();
  }
  // 正在牵的线
  if (UI.pending) {
    const a = UI.pending.agent;
    let from = null;
    for (const v of views) if (a._bp && a._bp[v.key]) { from = a._bp[v.key]; break; }
    const ptr = UI.ptr[UI.pending.pid] || Object.values(UI.ptr).find(p => p.kind === 'mouse') || Object.values(UI.ptr)[0];
    if (from && ptr) {
      const mx = (from.x + ptr.x) / 2, my = (from.y + ptr.y) / 2 + 30 + Math.sin(G.realT * 4) * 6;
      c.strokeStyle = 'rgba(230,20,50,.9)'; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -G.realT * 30;
      c.beginPath(); c.moveTo(from.x, from.y); c.quadraticCurveTo(mx, my, ptr.x, ptr.y); c.stroke(); c.setLineDash([]);
    }
    if (G.realT - UI.pending.at > 14) UI.pending = null;
  }
  // 手
  for (const h of hands) {
    const hov = hitTest(h.x, h.y);
    c.lineWidth = 3; c.strokeStyle = h.pinch ? '#ff2d55' : '#fff';
    c.fillStyle = h.pinch ? 'rgba(255,45,85,.55)' : 'rgba(255,255,255,.18)';
    circ(c, h.x, h.y, h.pinch ? 11 : 17); c.fill(); c.stroke();
    c.font = '18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(h.pinch ? '🤏' : '✋', h.x + 22, h.y - 20);
    if (hov) { c.font = '600 12px sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.strokeText(hov.name2, h.x, h.y + 30); c.fillText(hov.name2, h.x, h.y + 30); }
  }
  if (D.god && hands.length) {
    const t = "🖐 Bird's-eye view · pinch one person, then another = red thread · lower your hand to keep watching";
    c.font = '600 14px "Nunito","Segoe UI",system-ui,sans-serif';
    const w = Math.min(c.measureText(t).width + 30, SW_ - 20);
    c.fillStyle = 'rgba(180,10,40,.82)'; rr(c, SW_ / 2 - w / 2, SH_ - 54, w, 32, 16); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(t, SW_ / 2, SH_ - 38, SW_ - 40);
  }
}

/* ---------------- 自言自语、天气 ---------------- */
let thinkT = 0, chatT = 0;
function ambient(dt) {
  thinkT -= dt; chatT -= dt;
  if (thinkT <= 0) {
    thinkT = rand(0.9, 1.8);
    const a = Math.random() < 0.85 ? pick(G.agents.filter(p => p.main)) : pick(G.agents);
    if (!a.bubble && !a.lock && !a.onPhone) {
      let text, tone = 'neutral';
      const g = a.goal;
      if (g && g.act === 'sleep' && a.hidden) text = pick(CONTEXT_THOUGHTS.sleep);
      else if (a.trip && a.trip.stage === 'wait') text = pick(CONTEXT_THOUGHTS.wait);
      else if (a.trip && a.trip.stage === 'ride') text = pick(CONTEXT_THOUGHTS.taxi);
      else if (a.heartbreakUntil > G.t && Math.random() < 0.6) { text = pick(CONTEXT_THOUGHTS.heartbroken); tone = 'sad'; }
      else if (a.partner && Math.random() < 0.35) { const sour = a.couple.mood() === 'sour'; text = sour ? pick(['Why is it always like this...', `Is ${a.partner.name} even thinking about me?`, 'I need some space.']) : fillT(pick(CONTEXT_THOUGHTS.inlove), { p: a.partner.name }); tone = sour ? 'sad' : 'happy'; }
      else if (G.rain && !a.hidden && Math.random() < 0.3) text = pick(CONTEXT_THOUGHTS.rain);
      else if (a.moving && Math.random() < 0.3) text = pick(CONTEXT_THOUGHTS.walk);
      else if (!a.partner && Math.random() < 0.12) text = pick(CONTEXT_THOUGHTS.single);
      else text = pick(a.thoughts);
      a.say(text, 3.4, 'think', null, tone);
    }
  }
  if (chatT <= 0) {
    chatT = rand(5, 9);
    const vis = G.agents.filter(a => !a.hidden && !a.inCar && !a.lock && !a.onPhone && !a.bubble && !a.moving);
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const p = vis[i], q = vis[j];
      if (p.partner === q || dist(p, q) > 70) continue;
      const [l1, l2] = pick(L.smallTalk);
      p.say(l1, 3, 'say', q); setTimeout(() => q.say(l2, 3, 'say', p), 1500);
      return;
    }
  }
}
function weather() {
  if (G.t < G.nextWeather) return;
  if (G.rain) { G.rain = false; G.nextWeather = G.t + rand(300, 1100); log('🌤 The rain stopped'); }
  else if (Math.random() < 0.35) { G.rain = true; G.nextWeather = G.t + rand(60, 200); log('🌧 It started raining'); }
  else G.nextWeather = G.t + rand(240, 700);
}

/* ---------------- 主循环 ---------------- */
let last = performance.now(), rosterT = 0, lastDay = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  G.realT += dt;
  const hands = pollHands(now);
  const playing = G.speed > 0;
  if (playing) {
    const h = tod() / 60;
    const busy = G.scenes.length > 0 || G.couples.some(c => c.date && G.t > c.date.start - 90);
    const fast = (h >= 23.6 || h < 5.6) && !busy ? 5 : 1;
    const drama = G.scenes.some(s => s.kind === 'date' || s.kind === 'breakup' || s.kind === 'stood');
    const dtG = dt * BASE_RATE * (drama ? Math.min(G.speed, 1) : G.speed) * fast;   // 演剧情的时候慢放
    const steps = Math.max(1, Math.ceil(dtG / 1.2));
    for (let i = 0; i < steps; i++) {
      G.t += dtG / steps;
      for (const a of G.agents) a.update(dtG / steps);
      robberTick(dtG / steps);
      for (const c of G.cars) c.update(dtG / steps);
    }
    for (const c of G.couples.slice()) c.tick();
    jobEvents();
    weather();
    if (day() !== lastDay) { lastDay = day(); log(`🌅 Day ${day() + 1} (${WEEK[day() % 7]}) begins`); for (const a of G.agents) for (const k in a.plans) if (+k < day() - 1) delete a.plans[k]; }
    for (const s of G.scenes) s.update(dt);
    G.scenes = G.scenes.filter(s => !s.done);
    ambient(dt);
  }
  for (const a of G.agents) if (a.bubble) { a.bubble.t += playing ? dt : 0; if (a.bubble.t > a.bubble.dur) a.bubble = null; }
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.8);
  for (const h of G.hearts) { h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; } G.hearts = G.hearts.filter(h => h.t < h.life);
  for (const s of G.snaps) s.t += dt; G.snaps = G.snaps.filter(s => s.t < 1.4);
  for (const r of G.rockets) {
    r.t += dt; if (r.t < 0) continue;
    r.y += r.vy * dt; r.vy += 60 * dt;
    if (r.t > 0.75) { r.done = true; for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, v = rand(30, 90); G.sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: Math.random() < 0.2 ? '#ffffff' : r.col, t: 0, life: rand(1, 1.8) }); } if (Math.random() < 0.5) sfx('pop'); }
  }
  G.rockets = G.rockets.filter(r => !r.done);
  for (const s of G.sparks) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; s.vx *= 0.98; } G.sparks = G.sparks.filter(s => s.t < s.life);
  for (const k of G.confetti) { k.t += dt; k.x += k.vx * dt; k.y += k.vy * dt; k.r += k.vr * dt; } G.confetti = G.confetti.filter(k => k.y < 1.1);
  if (G.binds) { for (const b of G.binds) b.t += dt; G.binds = G.binds.filter(b => b.t < 1.2); }
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('#toast').classList.remove('show'); }

  Director.update(dt);
  // 悬停
  UI.hovered.clear();
  for (const id in UI.ptr) { const p = UI.ptr[id]; const a = hitTest(p.x, p.y); if (a) UI.hovered.add(a); }
  cv.style.cursor = UI.hovered.size ? 'pointer' : Director.mode === 'free' ? 'grab' : 'default';

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  hitTargets = [];
  viewsNow = Director.views();
  for (const v of viewsNow) renderView(v);
  drawOverlay(viewsNow, hands);

  rosterT -= dt;
  if (rosterT <= 0) {
    rosterT = 0.5; refreshRoster();
    document.body.classList.toggle('has-couple', G.couples.length > 0);
    const n = nightAmt();
    $('#clock').innerHTML = `Day ${day() + 1} · ${WEEK[day() % 7]} <b>${clockStr()}</b> ${G.rain ? '🌧' : n > 0.5 ? '🌙' : '☀️'}`;
  }
  requestAnimationFrame(frame);
}

/* ---------------- 开局 ---------------- */
function boot() {
  initCars();
  PEOPLE.forEach((d, i) => { const a = new Agent(d, i); G.agents.push(a); G.byId[a.id] = a; });
  for (const a of G.agents) a.basePlan(0);
  // 先跑一会儿，让大家散开到各自的位置
  for (let i = 0; i < 60; i++) { G.t += 0.5; for (const a of G.agents) a.update(0.5); for (const c of G.cars) c.update(0.5); }
  buildRoster(); refreshRoster();
  log('🏙 Morning in Red Thread Town. Six people with letters A–F are waiting for you to tie some red threads.');
  Director.cam.z = fitZoom({ w: SW_, h: SH_ });
  requestAnimationFrame(frame);
}
$('#introPlay').addEventListener('click', () => { audio(); document.body.classList.remove('intro'); });
$('#introCam').addEventListener('click', () => { audio(); document.body.classList.remove('intro'); startCam(); });
boot();
