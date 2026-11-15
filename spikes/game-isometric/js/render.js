'use strict';
/* 섬 그리기. 그래픽은 전부 캔버스 도형으로 직접 그립니다(외부 이미지 없음).
   좌표: 타일 (x, y)는 화면에서 x가 오른쪽 아래, y가 왼쪽 아래로 늘어납니다. z는 픽셀 높이입니다. */
const W = 1920, H = 1080, TW = 144, TH = 72, OX = 930, OY = 225, CLIFF = 36;
const iso = (x, y, z) => [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2 - (z || 0)];
/* 화면 확대: 섬이 16:9 화면을 채우도록 월드 전체를 키웁니다. scr는 월드→화면, unScr는 화면→월드 */
const VIEW = { z: 1.25, px: 930, py: 585, tx: 960, ty: 596 };
/* 사용자 확대(uz)와 이동(px, py, 월드 좌표). 섬 크기에 맞춘 기본 배율(baseZ)에 곱합니다 (GAM-048) */
const CAM = { uz: 1, px: 0, py: 0, baseZ: 1.25 };
function applyCam() {
  CAM.uz = Math.max(.75, Math.min(2.2, CAM.uz)); CAM.px = Math.max(-700, Math.min(700, CAM.px)); CAM.py = Math.max(-450, Math.min(450, CAM.py));
  VIEW.z = CAM.baseZ * CAM.uz; VIEW.px = 930 + CAM.px; VIEW.py = 585 + CAM.py;
}
const scr = p => [(p[0] - VIEW.px) * VIEW.z + VIEW.tx, (p[1] - VIEW.py) * VIEW.z + VIEW.ty];
const unScr = (x, y) => [(x - VIEW.tx) / VIEW.z + VIEW.px, (y - VIEW.ty) / VIEW.z + VIEW.py];
function applyView(c) { c.setTransform(VIEW.z, 0, 0, VIEW.z, VIEW.tx - VIEW.px * VIEW.z, VIEW.ty - VIEW.py * VIEW.z); }
const unIso = (sx, sy) => { const a = (sx - OX) / (TW / 2), b = (sy - OY) / (TH / 2); return [(a + b) / 2, (b - a) / 2]; };

/* g 잔디, r 도로, p 광장, s 모래, k 주차 자리, . 바다 */
const MAP = [
  '...gggg...',
  '..gggggg..',
  '.gggggggg.',
  'gggggggggg',
  'gggggggggg',
  'rrrrrrrrrr',
  'gppggggkgg',
  '.ppggggggs',
  '..ggggsss.',
  '...ssss...',
];
/* 바꾼 땅·넓힌 땅(state.extra)이 원래 지형보다 먼저 (GAM-047) */
const tileAt = (x, y) => (state.extra && state.extra[x + ',' + y]) || (MAP[y] && MAP[y][x]) || '.';
const isLand = (x, y) => tileAt(x, y) !== '.';

/* 옮길 수 없는 고정 건물. 빵집·꽃집은 state.built의 건물이라 옮길 수 있음. 나무·풀은 장식(state.decor) */
const FIXED = [
  { type: 'lighthouse', x: 4, y: 0 }, { type: 'shop', x: 1, y: 4 },
  { type: 'stop', x: 8, y: 4 }, { type: 'garage', x: 6, y: 6 },
];
const LAMPS = [[2.5, 4.86], [4.5, 4.86], [6.5, 4.86], [3.2, 6.2], [8.9, 6.2]];
const CAT_POS = { x: 7.3, y: 7.35 };
const HGT = { local: 120, bakery: 130, flower: 125, shop: 130, stop: 100, garage: 115, lighthouse: 215, market: 105, park: 70, stage: 115, cafe: 125 };

/* ---------- 색 ---------- */
const _hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const _sc = {};
function shade(h, f) {
  const k = h + f; if (_sc[k]) return _sc[k];
  const [r, g, b] = _hex(h), t = f < 0 ? 0 : 255, a = Math.abs(f);
  return _sc[k] = `rgb(${r + (t - r) * a | 0},${g + (t - g) * a | 0},${b + (t - b) * a | 0})`;
}
function mixHex(a, b, t) { const A = _hex(a), B = _hex(b); return `rgb(${A.map((v, i) => v + (B[i] - v) * t | 0).join(',')})`; }
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const easeOutBack = e => { const c = 1.9; return 1 + (c + 1) * Math.pow(e - 1, 3) + c * Math.pow(e - 1, 2); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- 시간대 ---------- */
/* [시, 섬 색조(곱하기), 바다 위, 바다 아래, 불빛] */
const SKY = [
  [0, '#5a66b4', '#1c2b62', '#0f1a46', 1],
  [5, '#6570b8', '#24356e', '#142052', 1],
  [6.6, '#f6c3ae', '#f4b9a6', '#6f9cc6', .3],
  [8, '#ffffff', '#8ae2ee', '#43b5d9', 0],
  [16.6, '#ffffff', '#8ae2ee', '#43b5d9', 0],
  [18, '#ffddb6', '#ffc79c', '#5fa9cb', .5],
  [19.2, '#dd9ea8', '#c98296', '#4b5d9e', .9],
  [20.6, '#6470ba', '#213069', '#111c4a', 1],
  [24, '#5a66b4', '#1c2b62', '#0f1a46', 1],
];
function envAt(hour) {
  let i = 0; while (i < SKY.length - 2 && hour >= SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = clamp((hour - a[0]) / (b[0] - a[0]), 0, 1);
  return {
    tint: mixHex(a[1], b[1], t), seaTop: mixHex(a[2], b[2], t), seaBot: mixHex(a[3], b[3], t),
    L: a[4] + (b[4] - a[4]) * t,
    warm: Math.max(0, 1 - Math.abs(hour - 18.3) / 1.7),
    white: a[1] === '#ffffff' && b[1] === '#ffffff',
  };
}

/* ---------- 렌더 상태 ---------- */
const cv = document.getElementById('world');
const ctx = cv.getContext('2d');
const layA = document.createElement('canvas'), layB = document.createElement('canvas');
layA.width = layB.width = W; layA.height = layB.height = H;
const ca = layA.getContext('2d'), cb = layB.getContext('2d');

const R = {
  t: 0, clock: START_CLOCK, env: envAt(14.5), L: 0, tire: 0, heat: 0,
  hits: [], em: { quads: [], glows: [] }, parts: [], oparts: [],
  born: {}, bump: {}, nightMarket: false, concert: false, acc: {},
};

/* ---------- 탈것·주민 ---------- */
const car = { x: 7.5, y: 6.5, axis: 'y', dir: 1, path: [], visible: true, moving: false };
const truck = { x: 19, y: 5.28, axis: 'x', dir: -1, path: [], visible: false, parked: false, moving: false };
/* 섬을 돌아다니는 주민. 건물 칸을 가로지르지 않고, 가끔 시설에 들렀다 물건을 들고 나옴(연출, 수익 없음) */
const RES = { list: [] };
function walkable(x, y) { return isLand(x, y) && (TILE_TYPES[tileAt(x, y)] || { walk: true }).walk && !typeAt(x, y) && !onCat(x, y); }
function lineClear(ax, ay, bx, by) {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / .15);
  for (let i = 1; i <= n; i++) { const t = i / n; if (!walkable(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t))) return false; }
  return true;
}
function walkSpot(near) {
  for (let i = 0; i < 80; i++) {
    const x = GRID.min + Math.random() * (GRID.max - GRID.min + 1) | 0, y = GRID.min + Math.random() * (GRID.max - GRID.min + 1) | 0;
    if (!walkable(x, y) || (near && Math.hypot(x - near.x, y - near.y) > 4)) continue;
    const tx = x + .25 + Math.random() * .5, ty = y + .25 + Math.random() * .5;
    if (near && !lineClear(near.x, near.y, tx, ty)) continue;
    return [tx, ty];
  }
  return near ? [near.x, near.y] : [2.5, 6.6];
}
function syncResidents() {
  const ids = residentIds();
  while (RES.list.length > ids.length) RES.list.pop();
  while (RES.list.length < ids.length) {
    const id = ids[RES.list.length], [x, y] = walkSpot();
    RES.list.push({ id, kind: residentKind(id), x, y, tx: x, ty: y, wait: Math.random() * 2, dir: 1, jump: 0, carry: null, going: null });
  }
}
const catAnim = { jump: 0 };

function stepVehicle(v, dt, speed) {
  if (!v.path.length) { v.moving = false; return; }
  const p = v.path[0], dx = p.x - v.x, dy = p.y - v.y, dist = Math.hypot(dx, dy), st = speed * dt;
  if (dist > 0.001) {
    if (Math.abs(dx) > Math.abs(dy)) { v.axis = 'x'; v.dir = (dx > 0 ? 1 : -1) * (p.rev ? -1 : 1); }
    else { v.axis = 'y'; v.dir = (dy > 0 ? 1 : -1) * (p.rev ? -1 : 1); }
  }
  if (dist <= st) {
    v.x = p.x; v.y = p.y; v.path.shift();
    if (!v.path.length) { v.moving = false; if (v.onArrive) { const f = v.onArrive; v.onArrive = null; f(); } }
  } else { v.x += dx / dist * st; v.y += dy / dist * st; v.moving = true; }
}
function carDepart() {
  car.visible = true;
  car.path = car.y > 5.8 ? [{ x: 7.5, y: 5.72, rev: true }, { x: 19, y: 5.72 }] : [{ x: 19, y: 5.72 }];
  car.onArrive = () => { car.visible = false; };
}
function carArrive() {
  if (!car.visible) { car.x = 19; car.y = 5.72; }
  car.visible = true;
  car.path = [{ x: 7.5, y: 5.72 }, { x: 7.5, y: 6.5 }];
  car.onArrive = () => emit('carParked');
}
function truckArrive() {
  if (truck.parked) return;
  if (!truck.visible || truck.x < 8.4) truck.x = 19;
  truck.visible = true;
  truck.path = [{ x: 8.45, y: 5.28 }];
  truck.onArrive = () => { truck.parked = true; emit('truckParked'); };
}
function truckLeave() {
  truck.parked = false;
  truck.path = [{ x: -13, y: 5.28 }];
  truck.onArrive = () => { truck.visible = false; };
}
/* 저장된 상태에 맞춰 탈것을 바로 놓는다 */
function placeVehicles() {
  car.path = []; truck.path = []; car.onArrive = truck.onArrive = null;
  if (state.gear === 'P') { car.x = 7.5; car.y = 6.5; car.axis = 'y'; car.dir = 1; car.visible = true; }
  else car.visible = false;
  if (state.delivery) { truck.x = 8.45; truck.y = 5.28; truck.axis = 'x'; truck.dir = -1; truck.visible = true; truck.parked = true; }
  else { truck.visible = false; truck.parked = false; }
}

/* ---------- 입자 ---------- */
function part(list, p) { if (list.length < 500) list.push(Object.assign({ life: 0, max: 1, vx: 0, vy: 0, g: 0, size: 6, rot: 0, vr: 0 }, p)); }
function burst(kind, x, y, n, o) {
  o = o || {};
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (o.speed || 160) * (.4 + Math.random() * .8);
    part(o.world ? R.parts : R.oparts, {
      kind, x: x + (Math.random() - .5) * (o.spread || 10), y: y + (Math.random() - .5) * (o.spread || 10),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), g: o.g == null ? 300 : o.g,
      max: (o.life || .8) * (.7 + Math.random() * .6), size: (o.size || 8) * (.7 + Math.random() * .6),
      color: o.colors ? o.colors[i % o.colors.length] : o.color, rot: Math.random() * 6, vr: (Math.random() - .5) * 8,
    });
  }
}
function fxBuild(x, y) {
  const [cx, cy] = iso(x + .5, y + .5);
  burst('dust', cx, cy + 6, 16, { world: true, speed: 150, g: -40, life: .7, size: 20, color: '#e9dcc0', spread: 60 });
  burst('star', cx, cy - 50, 16, { speed: 330, up: 140, g: 520, life: 1.1, size: 12, colors: ['#ffd24a', '#fff', '#ff8fa3', '#7fe0c3'] });
  part(R.oparts, { kind: 'ring', x: cx, y: cy, max: .6, size: 30 });
}
function fxHearts(sx, sy) { burst('heart', sx, sy, 6, { speed: 90, up: 200, g: -60, life: 1, size: 20, spread: 30 }); }
function fxCoins(sx, sy, n) { burst('coin', sx, sy, Math.min(14, n), { speed: 220, up: 260, g: 760, life: .8, size: 16, spread: 20 }); }

/* ---------- 도형 도우미 ---------- */
function quad(c, pts, fill, stroke, lw) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1.5; c.stroke(); }
}
function wbox(c, x0, y0, x1, y1, z0, z1, col, topCol) {
  quad(c, [iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x0, y1, z0)], col);
  quad(c, [iso(x1, y0, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x1, y0, z0)], shade(col, -.15));
  quad(c, [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)], topCol || shade(col, .14));
}
function disc(c, x, y, r, fill, stroke, lw) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
}
function oval(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
function signDisc(c, p, r, bg, icon, col) {
  disc(c, p[0], p[1], r, bg, '#ffffff', 3);
  drawIcon(c, icon, p[0], p[1], r * 1.3, col || '#ffffff');
}
function glow(x, y, r, color, a, flat) { R.em.glows.push({ x, y, r, color: color || '255,205,130', a: a == null ? 1 : a, flat: flat || 1 }); }

/* 타일 하나를 기준으로 건물을 그리는 도우미 */
function mk(c, tx, ty) {
  const P = (u, v, z) => iso(tx + u, ty + v, z);
  const o = {
    P,
    top(u0, v0, u1, v1, z, col) { quad(c, [P(u0, v0, z), P(u1, v0, z), P(u1, v1, z), P(u0, v1, z)], col); },
    L(u0, u1, v, z0, z1, col) { quad(c, [P(u0, v, z1), P(u1, v, z1), P(u1, v, z0), P(u0, v, z0)], col); },
    Rf(u, v0, v1, z0, z1, col) { quad(c, [P(u, v0, z1), P(u, v1, z1), P(u, v1, z0), P(u, v0, z0)], col); },
    box(u0, v0, u1, v1, z0, z1, col, topCol) {
      o.L(u0, u1, v1, z0, z1, col); o.Rf(u1, v0, v1, z0, z1, shade(col, -.15)); o.top(u0, v0, u1, v1, z1, topCol || shade(col, .14));
    },
    winL(u0, u1, v, z0, z1, frame) {
      const pts = [P(u0, v, z1), P(u1, v, z1), P(u1, v, z0), P(u0, v, z0)];
      quad(c, pts, '#8fd0ee', frame || '#ffffff', 3);
      R.em.quads.push(pts);
    },
    winR(u, v0, v1, z0, z1, frame) {
      const pts = [P(u, v0, z1), P(u, v1, z1), P(u, v1, z0), P(u, v0, z0)];
      quad(c, pts, '#79bfe0', frame || '#eef3f8', 3);
      R.em.quads.push(pts);
    },
    /* 용마루가 u 방향인 박공지붕 */
    gableU(u0, v0, u1, v1, z, rh, col, wall) {
      const vm = (v0 + v1) / 2;
      quad(c, [P(u0, v0, z), P(u1, v0, z), P(u1, vm, z + rh), P(u0, vm, z + rh)], shade(col, -.25));
      quad(c, [P(u1, v0, z), P(u1, v1, z), P(u1, vm, z + rh)], shade(wall, -.15));
      quad(c, [P(u0, vm, z + rh), P(u1, vm, z + rh), P(u1, v1, z), P(u0, v1, z)], col);
    },
    hip(u0, v0, u1, v1, z, rh, col) {
      const A = P((u0 + u1) / 2, (v0 + v1) / 2, z + rh);
      quad(c, [P(u0, v0, z), P(u1, v0, z), A], shade(col, -.3));
      quad(c, [P(u0, v0, z), P(u0, v1, z), A], shade(col, -.3));
      quad(c, [P(u1, v0, z), P(u1, v1, z), A], shade(col, -.16));
      quad(c, [P(u0, v1, z), P(u1, v1, z), A], col);
    },
    cyl(u, v, r, z0, z1, col, topCol) {
      const [cx, cy0] = P(u, v, z0), cy1 = P(u, v, z1)[1], rx = r * TW * .7071, ry = r * TH * .7071;
      const g = c.createLinearGradient(cx - rx, 0, cx + rx, 0);
      g.addColorStop(0, shade(col, .1)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, -.22));
      c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy0, rx, ry, 0, 0, Math.PI);
      c.lineTo(cx - rx, cy1); c.lineTo(cx + rx, cy1); c.closePath(); c.fill();
      oval(c, cx, cy1, rx, ry, topCol || shade(col, .16));
    },
    /* v 평면 앞으로 내민 줄무늬 차양 */
    awn(u0, u1, v, zt, zb, out, c1, c2, n) {
      const du = (u1 - u0) / n;
      for (let i = 0; i < n; i++) {
        const a = u0 + du * i, b = a + du;
        quad(c, [P(a, v, zt), P(b, v, zt), P(b, v + out, zb), P(a, v + out, zb)], i % 2 ? c2 : c1);
        quad(c, [P(a, v + out, zb), P(b, v + out, zb), P(b, v + out, zb - 7), P(a, v + out, zb - 7)], shade(i % 2 ? c2 : c1, -.12));
      }
    },
    base(col) { quad(c, [P(.03, .03), P(.97, .03), P(.97, .97), P(.03, .97)], col || 'rgba(60,80,40,.16)'); },
  };
  return o;
}

/* ---------- 시설 ---------- */
const DRAW = {
  /* 특산 건물: 앞밭(작물 색)과 작은 창고, 글자 간판. 권역마다 색과 글자가 다릅니다 */
  local(c, x, y, regionId) {
    const L = localOf(regionId) || { mark: '특', color: '#58c46b' }, b = mk(c, x, y); b.base('rgba(90,70,30,.18)');
    for (let i = 0; i < 4; i++) {
      b.top(.06, .5 + i * .115, .5, .57 + i * .115, 2, '#a5794a');
      for (let j = 0; j < 4; j++) { const p = b.P(.12 + j * .11, .535 + i * .115, 8); disc(c, p[0], p[1] + 3, 5, '#5aa455'); disc(c, p[0], p[1] - 3, 6.5, L.color); }
    }
    b.box(.54, .12, .92, .56, 0, 50, '#fff3dc');
    b.L(.64, .8, .56, 0, 34, shade(L.color, -.25));
    b.winR(.92, .22, .44, 18, 38);
    b.gableU(.5, .08, .96, .6, 50, 30, L.color, '#fff3dc');
    const s = b.P(.3, .26, 50); c.strokeStyle = '#7a5a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(s[0], s[1] + 46); c.lineTo(s[0], s[1]); c.stroke();
    disc(c, s[0], s[1], 23, '#fff8ea', L.color, 5);
    c.save(); c.font = '26px Jua, sans-serif'; c.fillStyle = '#4a3b2a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L.mark, s[0], s[1] + 2); c.restore();
  },
  bakery(c, x, y) {
    const b = mk(c, x, y); b.base();
    b.box(.12, .14, .88, .86, 0, 66, '#ffe9c6');
    b.L(.43, .6, .86, 0, 42, '#b06a3e'); quad(c, [b.P(.46, .86, 38), b.P(.57, .86, 38), b.P(.57, .86, 24), b.P(.46, .86, 24)], '#ffd9a0');
    b.winL(.18, .36, .86, 20, 46); b.winL(.66, .82, .86, 20, 46);
    b.winR(.88, .32, .68, 22, 48);
    b.awn(.14, .86, .86, 60, 48, .16, '#ff8fa3', '#fff6f0', 6);
    b.gableU(.05, .07, .95, .93, 66, 42, '#e0715a', '#ffe9c6');
    b.box(.2, .22, .33, .35, 84, 118, '#c9a383');
    const s = b.P(1.0, .98, 44); c.strokeStyle = '#8a5a2b'; c.lineWidth = 4; c.beginPath(); c.moveTo(s[0], s[1] + 46); c.lineTo(s[0], s[1]); c.stroke();
    signDisc(c, s, 19, '#fff3d6', 'bread');
  },
  flower(c, x, y) {
    const b = mk(c, x, y); b.base();
    b.box(.14, .14, .86, .86, 0, 60, '#cdeedd');
    b.L(.56, .72, .86, 0, 40, '#4e9f7c');
    b.winL(.2, .48, .86, 16, 44);
    b.winR(.86, .3, .7, 20, 44);
    b.awn(.16, .84, .86, 56, 44, .15, '#5cc48e', '#f4fff8', 6);
    b.hip(.07, .07, .93, .93, 60, 48, '#f590ac');
    const cols = ['#ff6b8b', '#ffd24a', '#b58cff', '#ff9d4d', '#ffffff', '#ff6b8b'];
    b.box(.14, .92, .5, 1.0, 0, 8, '#b98452');
    cols.forEach((col, i) => { const p = b.P(.17 + i * .06, .96, 14 + (i % 2) * 3); disc(c, p[0], p[1], 6.500, col); });
    for (let i = 0; i < 3; i++) { const p = b.P(.98, .3 + i * .2, 10); disc(c, p[0], p[1], 8, '#58b368'); disc(c, p[0], p[1] - 7, 5, cols[i + 1]); }
  },
  shop(c, x, y) {
    const b = mk(c, x, y); b.base();
    b.box(.1, .12, .9, .88, 0, 70, '#cfe2ff');
    b.L(.6, .78, .88, 0, 42, '#3f72c8'); quad(c, [b.P(.63, .88, 38), b.P(.75, .88, 38), b.P(.75, .88, 20), b.P(.63, .88, 20)], '#a8d6f5');
    b.winL(.16, .52, .88, 14, 46);
    b.winR(.9, .3, .7, 22, 48);
    b.awn(.12, .88, .88, 62, 50, .16, '#ffcf3f', '#fffaf0', 6);
    b.box(.07, .09, .93, .91, 70, 77, '#9fbdf0');
    b.box(.18, .46, .82, .54, 77, 116, '#ff9d4d');
    const p = b.P(.5, .54, 97); disc(c, p[0], p[1], 17, '#fff8ea'); drawIcon(c, 'cart', p[0], p[1], 24, '#e0782a');
  },
  stop(c, x, y) {
    const b = mk(c, x, y);
    b.box(.08, .3, .92, .94, 0, 5, '#ddd6c6');
    b.L(.14, .86, .4, 5, 58, 'rgba(170,222,240,.6)');
    b.box(.3, .46, .7, .56, 5, 17, '#b98452');
    b.box(.12, .38, .17, .43, 5, 62, '#f4f6f8'); b.box(.83, .38, .88, .43, 5, 62, '#f4f6f8');
    b.box(.83, .68, .88, .73, 5, 62, '#f4f6f8'); b.box(.12, .68, .17, .73, 5, 62, '#f4f6f8');
    b.box(.06, .32, .94, .78, 62, 69, '#39b3a2');
    R.em.quads.push([b.P(.2, .4, 50), b.P(.8, .4, 50), b.P(.8, .4, 40), b.P(.2, .4, 40)]);
    const s = b.P(.95, .88, 86); c.strokeStyle = '#6c7786'; c.lineWidth = 5; c.beginPath(); c.moveTo(s[0], s[1] + 86); c.lineTo(s[0], s[1]); c.stroke();
    signDisc(c, s, 21, '#39b3a2', 'truck');
  },
  garage(c, x, y) {
    const b = mk(c, x, y); b.base();
    b.box(.08, .1, .92, .9, 0, 62, '#d3dbe6');
    b.winL(.2, .44, .9, 22, 46, '#f4f6f8');
    b.L(.58, .76, .9, 0, 40, '#5d7396');
    const door = [b.P(.92, .2, 46), b.P(.92, .8, 46), b.P(.92, .8, 0), b.P(.92, .2, 0)];
    quad(c, door, '#39424f'); R.em.quads.push(door);
    for (let i = 0; i < 3; i++) b.Rf(.92, .2, .8, 34 + i * 4.500, 37 + i * 4.500, '#aab5c4');
    b.Rf(.92, .14, .86, 48, 58, '#ffb02e');
    b.box(.05, .07, .95, .93, 62, 69, '#7c8ca4');
    const s = b.P(.5, .5, 110); c.strokeStyle = '#6c7786'; c.lineWidth = 6; c.beginPath(); c.moveTo(s[0], s[1] + 42); c.lineTo(s[0], s[1]); c.stroke();
    signDisc(c, s, 25, '#ffb02e', 'wrench');
    for (let i = 0; i < 3; i++) { const p = b.P(.16, 1.02, 5 + i * 9); oval(c, p[0], p[1], 15, 8, '#2f3540'); oval(c, p[0], p[1], 7, 3.500, '#7c8ca4'); }
  },
  lighthouse(c, x, y) {
    const b = mk(c, x, y);
    const r0 = b.P(.5, .5); oval(c, r0[0], r0[1] + 4, 62, 30, '#9aa3ad'); oval(c, r0[0] - 8, r0[1], 50, 24, '#b7bfc8');
    b.cyl(.5, .5, .24, 0, 34, '#ffffff'); b.cyl(.5, .5, .225, 34, 62, '#ef6b5b', '#ef6b5b');
    b.cyl(.5, .5, .21, 62, 92, '#ffffff'); b.cyl(.5, .5, .195, 92, 120, '#ef6b5b', '#ef6b5b');
    b.cyl(.5, .5, .27, 120, 127, '#56677c');
    b.cyl(.5, .5, .15, 127, 152, '#ffe79a', '#ffe79a');
    const t = b.P(.5, .5, 152), rx = .2 * TW * .7071;
    quad(c, [[t[0] - rx, t[1]], [t[0] + rx, t[1]], [t[0], t[1] - 32]], '#d95a4c'); oval(c, t[0], t[1], rx, rx / 2, '#d95a4c');
    const d = b.P(.5, .72, 0); quad(c, [[d[0] - 8, d[1] - 2], [d[0] + 8, d[1] + 6], [d[0] + 8, d[1] - 20], [d[0] - 8, d[1] - 28]], '#56677c');
    const lamp = b.P(.5, .5, 140); glow(lamp[0], lamp[1], 70, '255,235,150', 1);
  },
  market(c, x, y) {
    const b = mk(c, x, y); b.base('rgba(120,90,50,.18)');
    b.box(.12, .12, .17, .17, 0, 74, '#f4f6f8'); b.box(.83, .12, .88, .17, 0, 74, '#f4f6f8');
    b.box(.16, .2, .84, .42, 0, 22, '#c98b4e');
    ['#ff8a3d', '#ff8a3d', '#7ccf5a', '#ff5d5d', '#ffd24a', '#7ccf5a'].forEach((col, i) => { const p = b.P(.24 + i * .1, .31, 27); disc(c, p[0], p[1], 7, col); });
    b.box(.2, .62, .42, .84, 0, 15, '#d9a05b'); b.box(.56, .62, .78, .84, 0, 15, '#d9a05b');
    [[.26, .68, '#ff8a3d'], [.36, .7, '#ff8a3d'], [.3, .78, '#ffd24a'], [.62, .68, '#7ccf5a'], [.72, .72, '#ff5d5d'], [.66, .8, '#7ccf5a']]
      .forEach(([u, v, col]) => { const p = b.P(u, v, 19); disc(c, p[0], p[1], 7, col); });
    b.box(.12, .86, .17, .91, 0, 56, '#f4f6f8'); b.box(.83, .86, .88, .91, 0, 56, '#f4f6f8');
    const n = 6, du = .84 / n;
    for (let i = 0; i < n; i++) {
      const a = .08 + du * i, e = a + du, col = i % 2 ? '#fff6f0' : '#ff6b5e';
      quad(c, [b.P(a, .08, 78), b.P(e, .08, 78), b.P(e, .98, 58), b.P(a, .98, 58)], col);
      quad(c, [b.P(a, .98, 58), b.P(e, .98, 58), b.P(e, .98, 49), b.P(a, .98, 49)], shade(i % 2 ? '#fff6f0' : '#ff6b5e', -.12));
    }
    quad(c, [b.P(.92, .08, 78), b.P(.92, .98, 58), b.P(.92, .98, 49), b.P(.92, .08, 69)], shade('#ff6b5e', -.25));
    if (R.nightMarket) {
      const a = b.P(.1, .98, 54), e = b.P(.92, .98, 54);
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + e[0]) / 2, (a[1] + e[1]) / 2 + 16, e[0], e[1]); c.stroke();
      for (let i = 1; i < 6; i++) {
        const t = i / 6, px = a[0] + (e[0] - a[0]) * t, py = a[1] + (e[1] - a[1]) * t + Math.sin(t * Math.PI) * 14 + 8;
        oval(c, px, py, 7, 9, i % 2 ? '#ff6b4a' : '#ffd24a');
        glow(px, py, 26, i % 2 ? '255,130,90' : '255,215,110', .45);
      }
      const g = b.P(.5, .7, 6); glow(g[0], g[1], 150, '255,180,100', .32, .55);
      /* 정류장까지 이어지는 등불 줄 */
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => typeAt(x + dx, y + dy) === 'stop');
      if (nb) {
        const s0 = b.P(.86, .9, 58), s1 = iso(x + nb[0] + .95, y + nb[1] + .88, 84);
        c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(s0[0], s0[1]); c.quadraticCurveTo((s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2 + 26, s1[0], s1[1]); c.stroke();
        for (let i = 1; i < 6; i++) {
          const t = i / 6, px = s0[0] + (s1[0] - s0[0]) * t, py = s0[1] + (s1[1] - s0[1]) * t + Math.sin(t * Math.PI) * 13 + 9;
          oval(c, px, py, 7, 9, i % 2 ? '#ffd24a' : '#ff6b4a'); glow(px, py, 28, i % 2 ? '255,215,110' : '255,130,90', .6);
        }
      }
      /* 포장마차와 구경 온 병아리 */
      if (tileAt(x - 1, y) === 'g' && !typeAt(x - 1, y)) {
        b.box(-.46, .58, -.14, .8, 0, 20, '#c98b4e');
        b.box(-.46, .58, -.43, .61, 20, 50, '#f4f6f8'); b.box(-.17, .77, -.14, .8, 20, 50, '#f4f6f8');
        for (let i = 0; i < 4; i++) quad(c, [b.P(-.5 + i * .1, .54, 54), b.P(-.4 + i * .1, .54, 54), b.P(-.4 + i * .1, .86, 46), b.P(-.5 + i * .1, .86, 46)], i % 2 ? '#fff6f0' : '#ffb02e');
        const pot = b.P(-.3, .69, 24); oval(c, pot[0], pot[1], 12, 6, '#4a4f5c'); glow(pot[0], pot[1] - 10, 60, '255,190,110', .7);
      }
      [[.28, 1.04, 0], [.62, 1.06, 1.700], [-.2, 1.03, 3.100]].forEach(([u, v, ph]) => {
        const p = b.P(u, v), hop = Math.abs(Math.sin(R.t * 5 + ph)) * 7;
        oval(c, p[0], p[1] + 1, 9, 4, 'rgba(40,60,40,.2)');
        disc(c, p[0], p[1] - 10 - hop, 10, '#ffe066'); disc(c, p[0] + 3, p[1] - 13 - hop, 1.800, '#4a3b2a');
        quad(c, [[p[0] + 8, p[1] - 11 - hop], [p[0] + 15, p[1] - 9 - hop], [p[0] + 8, p[1] - 7 - hop]], '#ff9d2e');
      });
    }
    R.em.quads.push([b.P(.18, .42, 20), b.P(.82, .42, 20), b.P(.82, .42, 4), b.P(.18, .42, 4)]);
  },
  park(c, x, y) {
    const b = mk(c, x, y);
    b.top(.04, .04, .96, .96, 0, '#8fd06a');
    b.box(.04, .04, .96, .1, 0, 12, '#5fae56'); b.box(.04, .1, .1, .96, 0, 12, '#5fae56');
    const p = b.P(.42, .5); oval(c, p[0], p[1], 40, 20, '#7fd4ea'); oval(c, p[0] - 8, p[1] - 4, 16, 6, 'rgba(255,255,255,.6)');
    const s = b.P(.42, .5); disc(c, s[0] + 14, s[1] + 4, 5, '#ffffff');
    b.box(.6, .74, .86, .82, 6, 11, '#c98b4e'); b.box(.6, .74, .86, .77, 11, 22, '#c98b4e');
    [[.2, .82, '#ff6b8b'], [.3, .88, '#ffd24a'], [.82, .5, '#b58cff'], [.9, .6, '#ffffff'], [.15, .3, '#ffd24a']]
      .forEach(([u, v, col]) => { const q = b.P(u, v, 4); disc(c, q[0], q[1], 5, col); });
    const tp = b.P(.76, .26); drawTree(c, tp[0], tp[1], 'round', 31, .85);
  },
  stage(c, x, y) {
    const b = mk(c, x, y); b.base('rgba(80,60,120,.18)');
    b.box(.08, .1, .92, .18, 0, 86, '#7e5fe0');
    for (let i = 0; i < 6; i++) b.L(.1 + i * .14, .13 + i * .14, .18, 14, 84, '#6a4bd0');
    b.box(.08, .18, .92, .92, 0, 14, '#d2a676', '#e6c08e');
    b.box(.08, .5, .13, .55, 14, 86, '#f4f6f8'); b.box(.87, .5, .92, .55, 14, 86, '#f4f6f8');
    b.box(.04, .06, .96, .58, 86, 94, '#4d3aa0');
    b.box(.14, .7, .26, .82, 14, 42, '#3a3340'); b.box(.74, .7, .86, .82, 14, 42, '#3a3340');
    [.2, .8].forEach(u => { const p = b.P(u, .82, 30); disc(c, p[0], p[1], 6, '#8a8296'); });
    const m = b.P(.5, .6, 14); c.strokeStyle = '#3a3340'; c.lineWidth = 3; c.beginPath(); c.moveTo(m[0], m[1]); c.lineTo(m[0], m[1] - 30); c.stroke(); disc(c, m[0], m[1] - 32, 5, '#3a3340');
    [['255,90,160', .25], ['90,220,255', .5], ['255,220,90', .75]].forEach(([col, u], i) => {
      const p = b.P(u, .58, 84); disc(c, p[0], p[1], 6, `rgb(${col})`);
      const f = b.P(u + Math.sin(R.t * 1.5 + i * 2) * .12, .7, 16);
      if (R.concert) glow(f[0], f[1], 80, col, .75, .6);
      glow(p[0], p[1], 26, col, .9);
    });
  },
  cafe(c, x, y) {
    const b = mk(c, x, y); b.base();
    b.box(.14, .12, .86, .8, 0, 18, '#b9744a'); b.box(.14, .12, .86, .8, 18, 62, '#f6dfc0');
    b.L(.58, .74, .8, 0, 42, '#7a4a2c');
    b.winL(.2, .5, .8, 18, 48);
    b.winR(.86, .26, .68, 20, 48);
    b.awn(.16, .84, .8, 58, 47, .14, '#8c5a3c', '#f6dfc0', 6);
    b.hip(.07, .05, .93, .87, 62, 44, '#3d9a8b');
    const s = b.P(.86, .12, 96); c.strokeStyle = '#6c7786'; c.lineWidth = 5; c.beginPath(); c.moveTo(s[0], s[1] + 40); c.lineTo(s[0], s[1]); c.stroke();
    signDisc(c, s, 20, '#8c5a3c', 'cup', '#fff3d6');
    b.cyl(.3, .96, .08, 0, 16, '#f4f6f8');
    const u = b.P(.3, .96, 16); c.strokeStyle = '#8a5a2b'; c.lineWidth = 3; c.beginPath(); c.moveTo(u[0], u[1]); c.lineTo(u[0], u[1] - 38); c.stroke();
    quad(c, [[u[0] - 30, u[1] - 34], [u[0] + 30, u[1] - 34], [u[0], u[1] - 56]], '#ff8fa3'); quad(c, [[u[0] - 10, u[1] - 34], [u[0] + 10, u[1] - 34], [u[0], u[1] - 56]], '#fff6f0');
  },
};

const DECOR_DRAW = {
  flowerbed(c, x, y) {
    const b = mk(c, x, y);
    b.box(.22, .28, .78, .72, 0, 8, '#b98452', '#7a5a3a');
    ['#ff6b8b', '#ffd24a', '#b58cff', '#ffffff', '#ff9d4d', '#ff6b8b', '#ffd24a', '#b58cff'].forEach((col, i) => {
      const p = b.P(.3 + (i % 4) * .13, .38 + (i >> 2) * .2, 12 + (i % 3) * 2); disc(c, p[0], p[1], 3.500, '#58b368'); disc(c, p[0], p[1] - 6, 6.500, col);
    });
  },
  bench(c, x, y) {
    const b = mk(c, x, y);
    b.box(.26, .42, .3, .58, 0, 9, '#6c7786'); b.box(.7, .42, .74, .58, 0, 9, '#6c7786');
    b.box(.24, .4, .76, .6, 9, 14, '#c98b4e'); b.box(.24, .4, .76, .45, 14, 28, '#c98b4e');
  },
  lamp(c, x, y) { const p = iso(x + .5, y + .5); drawLamp(c, p[0], p[1]); },
  tree_round(c, x, y) { const p = iso(x + .5, y + .5); drawTree(c, p[0], p[1], 'round', x * 3 + y); },
  tree_pine(c, x, y) { const p = iso(x + .5, y + .5); drawTree(c, p[0], p[1], 'pine', x * 3 + y); },
  tree_palm(c, x, y) { const p = iso(x + .5, y + .5); drawTree(c, p[0], p[1], 'palm', x * 3 + y); },
  bush(c, x, y) { const p = iso(x + .5, y + .5); drawTree(c, p[0], p[1], 'bush', x * 3 + y); },
  grass(c, x, y) {
    for (let i = 0; i < 5; i++) {
      const p = iso(x + .25 + (i % 3) * .25, y + .3 + (i >> 1) * .2), h = 16 + (i % 2) * 8;
      c.strokeStyle = ['#4f9a45', '#65b356', '#3f8a3a'][i % 3]; c.lineWidth = 4; c.lineCap = 'round';
      [-7, 0, 7].forEach(dx => { c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(p[0] + dx * .6, p[1] - h * .6, p[0] + dx, p[1] - h); c.stroke(); });
    }
  },
  fountain(c, x, y) {
    const b = mk(c, x, y);
    b.cyl(.5, .5, .36, 0, 12, '#d3dbe6', '#7fd4ea');
    b.cyl(.5, .5, .09, 12, 36, '#d3dbe6'); b.cyl(.5, .5, .17, 36, 41, '#d3dbe6', '#7fd4ea');
    const t = b.P(.5, .5, 41);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + R.t * .6, dx = Math.cos(a) * 34, dy = Math.sin(a) * 15;
      c.beginPath(); c.moveTo(t[0], t[1] - 4); c.quadraticCurveTo(t[0] + dx * .6, t[1] - 34 + Math.sin(R.t * 5 + i) * 3, t[0] + dx, t[1] + 26 + dy); c.stroke();
    }
    disc(c, t[0], t[1] - 6, 4, '#ffffff');
  },
};

/* ---------- 나무·가로등 ---------- */
function drawTree(c, sx, sy, kind, seed, s) {
  s = s || 1;
  const sw = Math.sin(R.t * 1.3 + seed) * 2.500;
  oval(c, sx + 4, sy + 2, 26 * s, 11 * s, 'rgba(40,70,40,.2)');
  if (kind === 'round') {
    c.fillStyle = '#9a6a3c'; c.fillRect(sx - 5 * s, sy - 26 * s, 10 * s, 28 * s);
    disc(c, sx - 16 * s + sw * .6, sy - 44 * s, 23 * s, '#58b85c'); disc(c, sx + 17 * s + sw * .6, sy - 42 * s, 22 * s, '#4faf55');
    disc(c, sx + sw, sy - 60 * s, 30 * s, '#66c466'); disc(c, sx - 9 * s + sw, sy - 68 * s, 14 * s, '#86d67c');
  } else if (kind === 'pine') {
    c.fillStyle = '#8a5a34'; c.fillRect(sx - 4 * s, sy - 16 * s, 8 * s, 18 * s);
    [[36, 14, 58, '#3f9d6a'], [29, 38, 78, '#4bad74'], [21, 60, 98, '#5cbd80']].forEach(([w, b0, t0, col]) =>
      quad(c, [[sx - w * s, sy - b0 * s], [sx + w * s, sy - b0 * s], [sx + sw, sy - t0 * s]], col));
  } else if (kind === 'palm') {
    c.strokeStyle = '#b98452'; c.lineWidth = 9 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + 14 * s, sy - 44 * s, sx + 6 * s + sw, sy - 86 * s); c.stroke();
    const tx = sx + 6 * s + sw, ty = sy - 86 * s;
    [[-52, 6], [-40, -22], [0, -34], [40, -22], [52, 8]].forEach(([dx, dy], i) => {
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + dx * .5 * s, ty + (dy - 22) * s, tx + dx * s, ty + dy * s);
      c.quadraticCurveTo(tx + dx * .5 * s, ty + (dy - 4) * s, tx, ty); c.fillStyle = i % 2 ? '#4faf55' : '#66c466'; c.fill();
    });
    disc(c, tx - 4, ty + 5, 5, '#8a5a2b'); disc(c, tx + 5, ty + 6, 5, '#8a5a2b');
  } else {
    disc(c, sx - 12 * s, sy - 12 * s, 16 * s, '#58b85c'); disc(c, sx + 12 * s, sy - 10 * s, 15 * s, '#4faf55'); disc(c, sx, sy - 20 * s, 18 * s, '#66c466');
    if (seed % 2 < 1) { disc(c, sx - 8 * s, sy - 22 * s, 4, '#ff8fa3'); disc(c, sx + 10 * s, sy - 14 * s, 4, '#ffd24a'); }
  }
}
function drawLamp(c, sx, sy) {
  oval(c, sx + 2, sy + 1, 9, 4, 'rgba(40,60,40,.25)');
  c.fillStyle = '#5c6878'; c.fillRect(sx - 2.500, sy - 62, 5, 62);
  c.fillStyle = '#5c6878'; c.fillRect(sx - 9, sy - 66, 18, 5);
  disc(c, sx, sy - 72, 9, R.L > .2 ? '#fff0b8' : '#f4f1e4', '#5c6878', 2);
  glow(sx, sy - 72, 46, '255,215,140', .75); glow(sx, sy - 4, 120, '255,200,120', .3, .5);
}

/* ---------- 주민 ---------- */
function drawPet(c, kind, sx, sy, p) {
  const t = R.t, hop = p.moving ? Math.abs(Math.sin(t * 10)) * 5 : 0;
  const j = p.jump > 0 ? Math.sin(Math.min(1, p.jump / .45) * Math.PI) * 26 : 0;
  const sq = p.jump > 0 ? Math.sin(Math.min(1, p.jump / .45) * Math.PI * 2) * .1 : (R.concert && kind !== 'cat' ? Math.sin(t * 8) * .05 : 0);
  oval(c, sx, sy + 2, 22, 9, 'rgba(40,60,40,.22)');
  c.save(); c.translate(sx, sy - hop - j); c.scale((p.dir || 1) * 1.35 * (1 - sq), 1.35 * (1 + sq)); c.lineCap = 'round';
  const leg = p.moving ? Math.sin(t * 14) * 3 : 0;
  if (kind === 'dog') {
    c.strokeStyle = '#d9954a'; c.lineWidth = 6; c.beginPath(); c.moveTo(-15, -17); c.quadraticCurveTo(-25, -24, -21, -33 + Math.sin(t * 9) * 3); c.stroke();
    c.fillStyle = '#e0a45a'; c.fillRect(-12 + leg, -8, 6, 9); c.fillRect(6 - leg, -8, 6, 9);
    oval(c, 0, -17, 18, 12, '#f0c07a'); oval(c, 2, -13, 12, 7, '#fff4dc');
    quad(c, [[5, -39], [9, -49], [14, -39]], '#d9954a'); quad(c, [[15, -41], [22, -49], [23, -38]], '#d9954a');
    disc(c, 14, -30, 13, '#f0c07a'); oval(c, 22, -26, 7, 5.500, '#fff4dc');
    disc(c, 27, -27.500, 2.600, '#4a3b2a'); disc(c, 17, -33, 2.300, '#4a3b2a');
    c.strokeStyle = '#ff7d8f'; c.lineWidth = 3; c.beginPath(); c.arc(8, -22, 8, .5, 2.200); c.stroke();
  } else if (kind === 'duck') {
    oval(c, -5 + leg, -1, 6, 3, '#ff9d2e'); oval(c, 5 - leg, -1, 6, 3, '#ff9d2e');
    oval(c, 0, -14, 16, 12, '#ffffff'); quad(c, [[-14, -18], [-24, -24], [-14, -10]], '#ffffff');
    oval(c, -3, -13, 9, 6, '#eef1f4');
    disc(c, 11, -30, 10.500, '#ffffff'); oval(c, 22, -28, 7, 3.800, '#ff9d2e');
    disc(c, 14, -32, 2.200, '#4a3b2a'); disc(c, 9, -26, 3, 'rgba(255,143,163,.6)');
  } else {
    c.strokeStyle = '#8f9bb0'; c.lineWidth = 6; c.beginPath(); c.moveTo(-10, -6); c.quadraticCurveTo(-24, -6, -20, -22 + Math.sin(t * 3) * 4); c.stroke();
    oval(c, 0, -16, 13, 16, '#a7b2c4'); oval(c, 0, -10, 12.500, 11, '#4a78c2'); c.fillStyle = '#4a78c2'; c.fillRect(-7, -27, 4, 12); c.fillRect(3, -27, 4, 12);
    quad(c, [[-12, -46], [-9, -56], [-3, -47]], '#a7b2c4'); quad(c, [[3, -47], [9, -56], [12, -46]], '#a7b2c4');
    disc(c, 0, -39, 13, '#a7b2c4'); oval(c, 0, -35, 6, 4.500, '#ffffff');
    c.fillStyle = '#ffb02e'; c.beginPath(); c.ellipse(0, -46, 13, 7, 0, Math.PI, 0); c.fill(); c.fillRect(-2, -48, 18, 4);
    disc(c, -5, -40, 2, '#4a3b2a'); disc(c, 5, -40, 2, '#4a3b2a'); disc(c, 0, -36, 1.600, '#ff8fa3');
    c.save(); c.translate(16, -20); c.rotate(-.5 + Math.sin(t * 2.500) * .15); drawIcon(c, 'wrench', 0, 0, 20, '#6c7786'); c.restore();
  }
  c.restore();
}

/* ---------- 탈것 ---------- */
const roadZ = x => R.tire * 5 * Math.sin(R.t * 6 + x * 1.3);
function drawVehicle(c, kind, v) {
  const isT = kind === 'truck', len = isT ? .84 : .62, wid = isT ? .34 : .3, ax = v.axis === 'x', d = v.dir;
  const zb = v.y < 6 ? roadZ(v.x) : 0, h = len / 2, w = wid / 2;
  const pt = (s, ww, z) => ax ? iso(v.x + s * d, v.y + ww, z + zb) : iso(v.x + ww, v.y + s * d, z + zb);
  const box = (s0, s1, z0, z1, col, topCol, inset) => {
    const a = Math.min(s0 * d, s1 * d), e = Math.max(s0 * d, s1 * d), i = inset || 0;
    if (ax) wbox(c, v.x + a, v.y - w + i, v.x + e, v.y + w - i, z0 + zb, z1 + zb, col, topCol);
    else wbox(c, v.x - w + i, v.y + a, v.x + w - i, v.y + e, z0 + zb, z1 + zb, col, topCol);
  };
  quad(c, [pt(-h - .04, -w - .03, -zb), pt(h + .04, -w - .03, -zb), pt(h + .04, w + .05, -zb), pt(-h - .04, w + .05, -zb)], 'rgba(30,40,60,.22)');
  const wheel = s => { const p = pt(s, w, 7); disc(c, p[0], p[1], 8.500, '#2f3540'); disc(c, p[0], p[1], 3.500, '#aab5c4'); };
  const lights = () => {
    const front = d > 0, col = front ? '#fff3b0' : '#ff5a4a';
    [-w * .62, w * .62].forEach(ww => { const p = ax ? iso(v.x + h, v.y + ww, 15 + zb) : iso(v.x + ww, v.y + h, 15 + zb); disc(c, p[0], p[1], 4, col); });
  };
  if (!isT) {
    box(-h, h, 6, 23, '#2f7df6');
    wheel(-h * .58); wheel(h * .58);
    box(-h * .6, h * .3, 23, 38, '#bfe3ff', '#f5f9ff', .025);
    lights();
  } else {
    const parts = [
      () => { box(-h, h * .2, 9, 56, '#fff3d6'); const p = pt(-h * .4, w, 34); if (ax) { quad(c, [pt(-h, w, 26), pt(h * .2, w, 26), pt(h * .2, w, 18), pt(-h, w, 18)], '#ffb02e'); drawIcon(c, 'crate', p[0], p[1] - 8, 26); } },
      () => { box(h * .26, h, 9, 40, '#ffb02e'); if (ax) quad(c, [pt(h * .4, w, 36), pt(h * .86, w, 36), pt(h * .86, w, 24), pt(h * .4, w, 24)], '#bfe3ff'); },
    ];
    box(-h, h, 5, 9, '#4a4f5c');
    if (d > 0) { parts[0](); parts[1](); } else { parts[1](); parts[0](); }
    wheel(-h * .62); wheel(h * .62);
    lights();
  }
  const f = pt(h, 0, 14), r = pt(-h, 0, 14), far = pt(h + .9, 0, 0);
  glow(f[0], f[1], 46, '255,240,180', .9); glow(far[0], far[1], 120, '255,235,170', .4, .5); glow(r[0], r[1], 22, '255,80,60', .7);
  return pt(0, 0, 0);
}

/* ---------- 바닥 ---------- */
function drawTile(c, x, y) {
  const ch = tileAt(x, y), z = ch === 'r' ? roadZ(x + .5) : 0;
  const T = [iso(x, y, z), iso(x + 1, y, z), iso(x + 1, y + 1, z), iso(x, y + 1, z)];
  if (!isLand(x, y + 1)) {
    quad(c, [T[3], T[2], iso(x + 1, y + 1, -CLIFF), iso(x, y + 1, -CLIFF)], '#deb57e');
    quad(c, [iso(x, y + 1, -CLIFF + 12), iso(x + 1, y + 1, -CLIFF + 12), iso(x + 1, y + 1, -CLIFF), iso(x, y + 1, -CLIFF)], '#bd9462');
  }
  if (!isLand(x + 1, y)) {
    quad(c, [T[1], T[2], iso(x + 1, y + 1, -CLIFF), iso(x + 1, y, -CLIFF)], '#c79d68');
    quad(c, [iso(x + 1, y, -CLIFF + 12), iso(x + 1, y + 1, -CLIFF + 12), iso(x + 1, y + 1, -CLIFF), iso(x + 1, y, -CLIFF)], '#a98252');
  }
  if (ch === 'g') {
    quad(c, T, (x + y) & 1 ? '#a8de7a' : '#9fd670');
    const hsh = hash(x * 13 + y * 7);
    if (hsh < .45) for (let i = 0; i < 3; i++) {
      const p = iso(x + .2 + hash(x * 3 + y * 11 + i) * .6, y + .2 + hash(x * 5 + y * 3 + i * 7) * .6);
      disc(c, p[0], p[1], 3, ['#ffffff', '#ffe27a', '#ffb3c4'][(x + y + i) % 3]);
    }
  } else if (ch === 'r') {
    quad(c, T, '#a9a8b4');
    if (R.tire > .01) quad(c, T, `rgba(255,170,40,${R.tire * (.22 + .18 * Math.sin(R.t * 6 + x))})`);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.lineCap = 'butt';
    [[.12, .38], [.62, .88]].forEach(([a, b]) => { const p = iso(x + a, y + .5, z), q = iso(x + b, y + .5, z); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); });
    c.strokeStyle = '#d9d6cc'; c.lineWidth = 3;
    [0, 1].forEach(v => { const p = iso(x, y + v, z), q = iso(x + 1, y + v, z); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); });
  } else if (ch === 'p') {
    quad(c, T, '#f4e5c9');
    c.strokeStyle = '#e2cfa9'; c.lineWidth = 2;
    [.33, .66].forEach(f => {
      let p = iso(x + f, y), q = iso(x + f, y + 1); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
      p = iso(x, y + f); q = iso(x + 1, y + f); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
    });
    if (R.heat > .01) quad(c, T, `rgba(255,70,40,${R.heat * (.2 + .12 * Math.sin(R.t * 4 + x + y))})`);
  } else if (ch === 's') {
    quad(c, T, '#f8e8b8');
    if (hash(x * 9 + y) < .6) { const p = iso(x + .3 + hash(x + y) * .4, y + .5); disc(c, p[0], p[1], 3, '#f0c9a0'); }
  } else if (ch === 'f') {
    quad(c, T, (x + y) & 1 ? '#a8de7a' : '#9fd670');
    for (let i = 0; i < 9; i++) {
      const p = iso(x + .12 + hash(x * 7 + y * 13 + i) * .76, y + .12 + hash(x * 11 + y * 5 + i * 3) * .76);
      disc(c, p[0], p[1] + 2, 3, '#5aa455'); disc(c, p[0], p[1] - 2, 4.5, ['#ff6b8b', '#ffd24a', '#b58cff', '#ffffff', '#ff9d4d'][(i + x + y) % 5]);
    }
  } else if (ch === 'w') {
    quad(c, T, '#f4e2b8');
    quad(c, [iso(x + .12, y + .12), iso(x + .88, y + .12), iso(x + .88, y + .88), iso(x + .12, y + .88)], '#6cc6e4');
    const sp = iso(x + .4 + .1 * Math.sin(R.t * 1.5 + x), y + .45); oval(c, sp[0], sp[1], 14, 4, 'rgba(255,255,255,.55)');
  } else if (ch === 'k') {
    quad(c, T, '#bcbfca');
    quad(c, [iso(x + .12, y + .12), iso(x + .88, y + .12), iso(x + .88, y + .88), iso(x + .12, y + .88)], null, '#ffffff', 3);
  }
}
function drawBridgeTile(c, x) {
  const z = roadZ(x + .5);
  quad(c, [iso(x, 5, -CLIFF), iso(x + 1, 5, -CLIFF), iso(x + 1, 6, -CLIFF), iso(x, 6, -CLIFF)], 'rgba(20,50,90,.16)');
  if (((x % 3) + 3) % 3 === 0) {
    const p = iso(x + .5, 6, 0); c.fillStyle = '#9a8572'; c.fillRect(p[0] - 9, p[1] - 6, 18, CLIFF + 8);
    oval(c, p[0], p[1] + CLIFF + 2, 16, 6, 'rgba(255,255,255,.45)');
  }
  quad(c, [iso(x, 6, z), iso(x + 1, 6, z), iso(x + 1, 6, z - 10), iso(x, 6, z - 10)], '#b08a5e');
  quad(c, [iso(x, 5, z), iso(x + 1, 5, z), iso(x + 1, 6, z), iso(x, 6, z)], '#dcc097');
  c.strokeStyle = '#c9aa7e'; c.lineWidth = 2;
  [.25, .5, .75].forEach(f => { const p = iso(x + f, 5, z), q = iso(x + f, 6, z); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); });
  bridgeRail(c, x, 5, z);
}
function bridgeRail(c, x, y, z) {
  c.strokeStyle = '#f4efe2'; c.lineWidth = 4; c.lineCap = 'round';
  const a = iso(x, y, z + 14), b = iso(x + 1, y, z + 14);
  c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  [0, .5].forEach(f => { const p = iso(x + f, y, z); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - 14); c.stroke(); });
}
function drawSea(c, env) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, env.seaTop); g.addColorStop(1, env.seaBot);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (env.warm > 0) {
    const s = c.createRadialGradient(180, 60, 0, 180, 60, 1000);
    s.addColorStop(0, `rgba(255,200,130,${.65 * env.warm})`); s.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = s; c.fillRect(0, 0, W, H);
  }
  if (env.L > .85) {
    const a = (env.L - .85) / .15, mx = 1752, my = 500;
    const mg = c.createRadialGradient(mx, my, 0, mx, my, 150);
    mg.addColorStop(0, `rgba(255,250,225,${.3 * a})`); mg.addColorStop(1, 'rgba(255,250,225,0)');
    c.fillStyle = mg; c.fillRect(mx - 150, my - 150, 300, 300);
    disc(c, mx, my, 40, `rgba(255,250,228,${.92 * a})`); disc(c, mx - 12, my - 8, 9, `rgba(230,225,200,${.5 * a})`); disc(c, mx + 14, my + 12, 6, `rgba(230,225,200,${.5 * a})`);
    c.strokeStyle = `rgba(255,250,225,${.22 * a})`; c.lineWidth = 4; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const y = my + 74 + i * 32, w = 26 + i * 7 + Math.sin(R.t * 2 + i) * 9; c.beginPath(); c.moveTo(mx - w, y); c.lineTo(mx + w, y); c.stroke(); }
    for (let i = 0; i < 40; i++) {
      const x = hash(i + 900) * W, y = hash(i + 950) * H, tw = .3 + .7 * Math.abs(Math.sin(R.t * (.6 + hash(i) * 1.2) + i));
      disc(c, x, y, 1.6 + hash(i + 3) * 1.4, `rgba(255,255,255,${.35 * a * tw})`);
    }
  }
  c.save(); applyView(c);
  const sh = 1 + Math.sin(R.t * .9) * .025;
  [[2.25, .1], [1.62, .2]].forEach(([k, al]) => {
    c.fillStyle = `rgba(200,250,245,${al * (1 - env.L * .55)})`;
    c.beginPath();
    for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) if (isLand(x, y)) {
      const [cx, cy] = iso(x + .5, y + .5, -CLIFF), rw = TW / 2 * k * sh, rh = TH / 2 * k * sh;
      c.moveTo(cx, cy - rh); c.lineTo(cx + rw, cy); c.lineTo(cx, cy + rh); c.lineTo(cx - rw, cy); c.closePath();
    }
    c.fill();
  });
  c.restore();
  c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 64; i++) {
    const x = (hash(i) * W + R.t * (5 + hash(i + 50) * 8)) % (W + 60) - 30, y = hash(i + 200) * H;
    c.strokeStyle = `rgba(255,255,255,${(.1 + .12 * Math.sin(R.t * 1.4 + i)) * (1 - env.L * .5)})`;
    c.beginPath(); c.moveTo(x - 15, y); c.quadraticCurveTo(x, y - 6, x + 15, y); c.stroke();
  }
}
function drawBoat(c) {
  const a = R.t * .12, x = 330 + Math.cos(a) * 110, y = 815 + Math.sin(a) * 45, d = Math.sin(a) > 0 ? -1 : 1, bob = Math.sin(R.t * 2) * 2;
  c.save(); c.translate(x, y + bob); c.scale(d, 1);
  oval(c, 0, 12, 40, 7, 'rgba(255,255,255,.3)');
  quad(c, [[-30, 0], [32, 0], [22, 13], [-22, 13]], '#b9744a');
  c.fillStyle = '#8a5a2b'; c.fillRect(-2, -52, 4, 54);
  quad(c, [[4, -50], [4, -6], [32, -6]], '#ffffff'); quad(c, [[-4, -42], [-4, -6], [-24, -6]], '#ffe9a8');
  c.restore();
  oval(c, 1560, 300, 54, 22, '#f8e8b8'); drawTree(c, 1560, 296, 'palm', 5, .8);
}

/* ---------- 말풍선(섬 위 표시) ---------- */
/* 섬 위 표시는 위치만 섬을 따라가고, 크기는 확대(CAM.uz)와 상관없이 일정 (GAM-048) */
function markerScale(c, x, y) { const k = 1 / CAM.uz; c.translate(x, y); c.scale(k, k); c.translate(-x, -y); return k; }
function bubble(c, x, y, icon, o) {
  o = o || {};
  c.save(); const k = markerScale(c, x, y);
  const r = o.r || 38, bob = Math.sin(R.t * 3 + (o.phase || 0)) * 5; y += bob;
  if (o.pulse) { const k = (R.t * 1.2) % 1; disc(c, x, y, r + k * 26, null, `rgba(255,255,255,${.8 * (1 - k)})`, 5); }
  c.save(); c.shadowColor = 'rgba(40,30,20,.3)'; c.shadowBlur = 14; c.shadowOffsetY = 5;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.moveTo(x - 12, y + r - 5); c.lineTo(x, y + r + 15); c.lineTo(x + 12, y + r - 5);
  c.fillStyle = o.bg || '#ffffff'; c.fill(); c.restore();
  drawIcon(c, icon, x, y, r * 1.2, o.color);
  if (o.badge != null) {
    const txt = String(o.badge); c.font = '26px Jua, "Malgun Gothic", sans-serif'; const tw = c.measureText(txt).width + 22;
    c.fillStyle = o.badgeBg || '#ff5d7a'; c.beginPath(); c.roundRect(x + r - 24, y - r - 8, Math.max(34, tw), 34, 17); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + r - 24 + Math.max(34, tw) / 2, y - r + 10);
  }
  c.restore();
  if (o.hit) R.hits.push(Object.assign({ test: (px, py) => Math.hypot(px - x, py - y) < (r + 16) * k }, o.hit));
}

/* ---------- 갱신 ---------- */
function every(key, sec, dt) { R.acc[key] = (R.acc[key] || 0) + dt; if (R.acc[key] >= sec) { R.acc[key] = 0; return true; } return false; }
function update(dt) {
  const diff = state.clock - R.clock;
  R.clock = Math.abs(diff) < .5 ? state.clock : R.clock + diff * Math.min(1, dt * 2.200);
  R.env = envAt(hourOf(R.clock)); R.L = R.env.L;
  R.tire += ((state.warn.tire ? 1 : 0) - R.tire) * Math.min(1, dt * 4);
  R.heat += ((state.warn.heat ? 1 : 0) - R.heat) * Math.min(1, dt * 3);

  stepVehicle(car, dt, 3.400); stepVehicle(truck, dt, 3);
  if (car.moving && car.visible && every('cdust', .09, dt)) { const p = iso(car.x, car.y); part(R.parts, { kind: 'dust', x: p[0], y: p[1], vy: -20, max: .5, size: 9, color: '#f1ead8' }); }
  if (truck.moving && every('tdust', .09, dt)) { const p = iso(truck.x, truck.y); part(R.parts, { kind: 'dust', x: p[0], y: p[1], vy: -20, max: .5, size: 11, color: '#f1ead8' }); }

  const ring = Object.keys(state.extra).reduce((m, k) => { const [x, y] = k.split(',').map(Number); return Math.max(m, tileRing(x, y)); }, 0);
  CAM.baseZ += ([1.25, 1.08, .94][ring] - CAM.baseZ) * Math.min(1, dt * 3);
  applyCam();
  if (place) updatePlaceBar();
  syncResidents();
  const prods = producers();
  RES.list.forEach(p => {
    if (p.jump > 0) p.jump = Math.max(0, p.jump - dt);
    if (p.wait > 0) { p.wait -= dt; p.moving = false; return; }
    const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy);
    if (dist < .03) {
      p.wait = 1 + Math.random() * 3; p.moving = false;
      p.carry = p.going; p.going = null;
      let pr = prods.length && Math.random() < .35 ? prods[Math.random() * prods.length | 0] : null;
      if (pr && !lineClear(p.x, p.y, pr.x + .5, pr.y + 1.12)) pr = null;
      if (pr) { p.tx = pr.x + .5; p.ty = pr.y + 1.12; p.going = FAC[pr.type].icon; }
      else [p.tx, p.ty] = walkSpot(p);
      return;
    }
    p.x += dx / dist * .55 * dt; p.y += dy / dist * .55 * dt; p.moving = true;
    const sdx = (dx - dy); if (Math.abs(sdx) > .01) p.dir = sdx > 0 ? 1 : -1;
  });
  if (catAnim.jump > 0) catAnim.jump = Math.max(0, catAnim.jump - dt);

  const bk = state.built.bakery;
  if (bk && every('smoke', .45, dt)) { const p = iso(bk.x + .26, bk.y + .28, 120); part(R.parts, { kind: 'smoke', x: p[0], y: p[1], vx: 8, vy: -34, max: 2.200, size: 9, color: '#ffffff' }); }

  const nm = comboSites('market').length > 0 && R.L > .4;
  if (nm && !R.nightMarket) emit('nightMarket');
  R.nightMarket = nm;
  if (nm && every('steam', .3, dt)) comboSites('market').forEach(([x, y]) => { const p = iso(x + .3 + Math.random() * .4, y + .3, 30); part(R.parts, { kind: 'smoke', x: p[0], y: p[1], vy: -40, max: 1.400, size: 7, color: '#fff3e0' }); });
  const cs = comboSites('stage'); R.concert = cs.length > 0;
  if (R.concert && every('note', .5, dt)) cs.forEach(([x, y]) => {
    const p = iso(x + .2 + Math.random() * .6, y + .5, 60);
    part(R.oparts, { kind: 'note', x: p[0], y: p[1], vx: (Math.random() - .5) * 50, vy: -70, max: 1.800, size: 26, color: ['#ff5aa0', '#5adcff', '#ffd24a'][Math.random() * 3 | 0] });
  });
  if (R.heat > .3 && every('heat', .08, dt)) {
    const p = iso(1.1 + Math.random() * 1.800, 6.100 + Math.random() * 1.800);
    part(R.oparts, { kind: 'heat', x: p[0], y: p[1], vy: -60 - Math.random() * 40, max: 1.400, size: 14 + Math.random() * 10, rot: Math.random() * 6 });
  }
  if (R.L > .6 && every('fly', .5, dt)) {
    const x = 1 + Math.random() * 8, y = 1 + Math.random() * 7; if (isLand(x | 0, y | 0)) { const p = iso(x, y, 20 + Math.random() * 30); part(R.oparts, { kind: 'firefly', x: p[0], y: p[1], vx: (Math.random() - .5) * 20, vy: -8, max: 3, size: 3 }); }
  }
  [R.parts, R.oparts].forEach(list => {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]; p.life += dt;
      if (p.life >= p.max) { list.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  });
}

function drawParts(c, list) {
  list.forEach(p => {
    const k = p.life / p.max, a = 1 - k;
    if (p.kind === 'smoke') disc(c, p.x, p.y, p.size * (1 + k * 1.800), `rgba(255,255,255,${.5 * a})`);
    else if (p.kind === 'dust') disc(c, p.x, p.y, p.size * (.6 + k), `rgba(241,234,216,${.7 * a})`);
    else if (p.kind === 'star') {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, a * 2); c.fillStyle = p.color;
      c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? p.size * .42 : p.size, an = i * Math.PI / 4; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.restore();
    } else if (p.kind === 'heart') { c.globalAlpha = Math.min(1, a * 1.600); drawIcon(c, 'heart', p.x, p.y, p.size * (1 + k * .5)); c.globalAlpha = 1; }
    else if (p.kind === 'coin') { c.globalAlpha = Math.min(1, a * 3); drawIcon(c, 'coin', p.x, p.y, p.size * 1.500); c.globalAlpha = 1; }
    else if (p.kind === 'note') { c.globalAlpha = Math.min(1, a * 1.500); drawIcon(c, 'note', p.x + Math.sin(p.life * 4) * 8, p.y, p.size, p.color); c.globalAlpha = 1; }
    else if (p.kind === 'ring') {
      const s = 1 + k * 1.600; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 8 * a + 1;
      c.beginPath(); c.moveTo(p.x, p.y - TH / 2 * s); c.lineTo(p.x + TW / 2 * s, p.y); c.lineTo(p.x, p.y + TH / 2 * s); c.lineTo(p.x - TW / 2 * s, p.y); c.closePath(); c.stroke();
    } else if (p.kind === 'heat') {
      c.strokeStyle = `rgba(255,90,50,${.55 * Math.sin(k * Math.PI)})`; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p.x, p.y);
      c.bezierCurveTo(p.x - p.size * .6, p.y - p.size * .7, p.x + p.size * .6, p.y - p.size * 1.400, p.x, p.y - p.size * 2.100); c.stroke();
    } else if (p.kind === 'firefly') disc(c, p.x, p.y, p.size, `rgba(230,255,140,${Math.sin(k * Math.PI) * .9 * R.L})`);
  });
}

/* ---------- 한 프레임 ---------- */
function draw() {
  const env = R.env, c = ca, driving = state.gear === 'D';
  R.hits.length = 0; R.em.quads.length = 0; R.em.glows.length = 0;
  drawSea(ctx, env);

  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); applyView(c);
  drawBoat(c);
  for (let x = -13; x < 0; x++) drawBridgeTile(c, x);
  for (let d = GRID.min * 2; d <= GRID.max * 2; d++) for (let x = GRID.min; x <= GRID.max; x++) { const y = d - x; if (y >= GRID.min && y <= GRID.max && isLand(x, y)) drawTile(c, x, y); }
  for (let x = 10; x < 20; x++) drawBridgeTile(c, x);

  /* 짓기·옮기기·장식: 놓을 수 있는 빈 땅을, 땅 모드: 고를 수 있는 칸을 강조 */
  if (place) {
    const a = .22 + .12 * Math.sin(R.t * 5);
    for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) {
      if (place.kind === 'tile' ? !tileOk(x, y) : !canBuildAt(x, y)) continue;
      const pts = [iso(x + .08, y + .08), iso(x + .92, y + .08), iso(x + .92, y + .92), iso(x + .08, y + .92)];
      if (place.kind === 'tile' && place.act === 'remove') quad(c, pts, `rgba(240,96,77,${a})`, 'rgba(255,255,255,.9)', 3);
      else if (place.kind === 'tile') { quad(c, pts, `rgba(170,230,140,${a + .1})`); quad(c, pts, null, 'rgba(255,255,255,.9)', 3); }
      else quad(c, pts, `rgba(255,255,255,${a})`);
    }
  }

  const objs = [];
  const fac = (type, x, y, key, o) => objs.push({ d: x + y + 1, f: () => drawFacility(c, type, x, y, key, o) });
  FIXED.forEach(f => fac(f.type, f.x, f.y, f.type));
  Object.entries(state.built).forEach(([id, b]) => { if (!(place && place.kind === 'move' && place.id === id)) fac(b.type, b.x, b.y, id); });
  LAMPS.forEach(([x, y]) => objs.push({ d: x + y, f: () => { const p = iso(x, y); drawLamp(c, p[0], p[1]); } }));
  state.decor.forEach(dc => !(place && place.kind === 'decorMove' && place.fx === dc.x && place.fy === dc.y) && objs.push({
    d: dc.x + dc.y + 1, f: () => {
      DECOR_DRAW[dc.type](c, dc.x, dc.y);
      const [cx, cy] = iso(dc.x + .5, dc.y + .5);
      R.hits.push({ kind: 'decor', x: dc.x, y: dc.y, test: (px, py) => Math.abs(px - cx) < 50 && py > cy - 60 && py < cy + 26 });
    },
  }));
  RES.list.forEach(p => objs.push({
    d: p.x + p.y, f: () => {
      const s = iso(p.x, p.y); drawPet(c, p.kind, s[0], s[1], p);
      if (p.carry) drawIcon(c, p.carry, s[0] + 21, s[1] - 36, 25);
      R.hits.push({ kind: 'pet', id: p.id, sx: s[0], sy: s[1], test: (px, py) => Math.hypot(px - s[0], py - (s[1] - 30)) < 50 });
    },
  }));
  objs.push({
    d: CAT_POS.x + CAT_POS.y, f: () => {
      const s = iso(CAT_POS.x, CAT_POS.y); drawPet(c, 'cat', s[0], s[1], { dir: -1, jump: catAnim.jump });
      R.hits.push({ kind: 'cat', test: (px, py) => Math.hypot(px - s[0], py - (s[1] - 36)) < 54 });
    },
  });
  if (car.visible) objs.push({ d: car.x + car.y, f: () => drawVehicle(c, 'car', car) });
  if (truck.visible) objs.push({
    d: truck.x + truck.y, f: () => {
      const s = drawVehicle(c, 'truck', truck);
      if (truck.parked) R.hits.push({ kind: 'truck', test: (px, py) => Math.abs(px - s[0]) < 80 && py > s[1] - 90 && py < s[1] + 40 });
    },
  });
  for (let x = -13; x < 20; x++) if (x < 0 || x > 9) objs.push({ d: x + 6.500, f: () => bridgeRail(c, x, 6, roadZ(x + .5)) });
  if (place) {
    const fl = .62 + .12 * Math.sin(R.t * 6);
    objs.push({
      d: place.x + place.y + 1.010, f: () => {
        const ok = place.kind === 'tile' ? tileOk(place.x, place.y) : canBuildAt(place.x, place.y);
        const pts = [iso(place.x + .04, place.y + .04), iso(place.x + .96, place.y + .04), iso(place.x + .96, place.y + .96), iso(place.x + .04, place.y + .96)];
        quad(c, pts, ok ? 'rgba(120,230,140,.4)' : 'rgba(255,90,80,.4)', ok ? '#58c46b' : '#f0604d', 4);
        c.save(); c.globalAlpha = fl; c.translate(0, -8 - Math.sin(R.t * 3) * 4);
        const T4 = [iso(place.x, place.y), iso(place.x + 1, place.y), iso(place.x + 1, place.y + 1), iso(place.x, place.y + 1)];
        if (place.kind === 'tile') quad(c, T4, place.act === 'remove' ? 'rgba(120,200,230,.85)' : { g: '#a8de7a', s: '#f8e8b8', p: '#f4e5c9', f: '#c8e88a', w: '#6cc6e4' }[place.tile || 'g']);
        else (place.kind === 'decor' || place.kind === 'decorMove' ? DECOR_DRAW : DRAW)[place.type](c, place.x, place.y);
        c.restore();
      },
    });
  }
  objs.sort((a, b) => a.d - b.d).forEach(o => o.f());
  drawParts(c, R.parts);

  if (env.white) ctx.drawImage(layA, 0, 0);
  else {
    cb.globalCompositeOperation = 'source-over'; cb.clearRect(0, 0, W, H); cb.drawImage(layA, 0, 0);
    cb.globalCompositeOperation = 'multiply'; cb.fillStyle = env.tint; cb.fillRect(0, 0, W, H);
    cb.globalCompositeOperation = 'destination-in'; cb.drawImage(layA, 0, 0);
    ctx.drawImage(layB, 0, 0);
  }

  ctx.save(); applyView(ctx);
  if (R.L > .02) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, R.L * 1.150); ctx.fillStyle = '#ffdf8e';
    R.em.quads.forEach(pts => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); });
    ctx.globalCompositeOperation = 'lighter';
    R.em.glows.forEach(g => {
      ctx.save(); ctx.translate(g.x, g.y); ctx.scale(1, g.flat);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, g.r);
      gr.addColorStop(0, `rgba(${g.color},${.6 * g.a * R.L})`); gr.addColorStop(1, `rgba(${g.color},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, g.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    const lp = iso(4.5, .5, 140), an = R.t * .7, dx = Math.cos(an) - Math.sin(an), dy = (Math.cos(an) + Math.sin(an)) / 2, len = 620;
    const ex = lp[0] + dx * len, ey = lp[1] + dy * len, nx = -dy * 90, ny = dx * 90;
    const bg = ctx.createLinearGradient(lp[0], lp[1], ex, ey);
    bg.addColorStop(0, `rgba(255,240,170,${.5 * R.L})`); bg.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(lp[0], lp[1]); ctx.lineTo(ex + nx, ey + ny); ctx.lineTo(ex - nx, ey - ny); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (R.heat > .01) {
    const p = iso(2, 7, 30);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(p[0], p[1]); ctx.scale(1, .6);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 260);
    gr.addColorStop(0, `rgba(255,70,30,${(.3 + .1 * Math.sin(R.t * 4)) * R.heat})`); gr.addColorStop(1, 'rgba(255,70,30,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 260, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  drawParts(ctx, R.oparts);
  if (!driving) drawMarkers(ctx);
  ctx.restore();
}

function drawFacility(c, type, x, y, key, o) {
  const [cx, cy] = iso(x + .5, y + .5), base = cy + TH * .3;
  let sx = 1, sy = 1;
  if (R.born[key] != null) { const e = (R.t - R.born[key]) / .6; if (e < 1) sx = sy = Math.max(.02, easeOutBack(Math.max(0, e))); else delete R.born[key]; }
  if (R.bump[key] != null) { const e = (R.t - R.bump[key]) / .4; if (e < 1) { const w = Math.sin(e * Math.PI * 2) * (1 - e); sy *= 1 - .14 * w; sx *= 1 + .09 * w; } else delete R.bump[key]; }
  c.save(); c.translate(cx, base); c.scale(sx, sy); c.translate(-cx, -base);
  DRAW[type](c, x, y);
  const tier = FAC[type].rate && state.home ? tierOf(state.lv[key] || 1) : 0;   // 단계 돌파 외형 (GAM-041)
  if (tier) {
    const top = iso(x + .5, y + .5, (HGT[type] || 90) + 8);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.roundRect(top[0] - 22 * tier - 10, top[1] - 22, 44 * tier + 20, 44, 22); c.fill();
    for (let i = 0; i < tier; i++) drawIcon(c, 'star', top[0] - 22 * (tier - 1) + 44 * i, top[1], 38);
  }
  c.restore();
  R.hits.push({ kind: 'fac', type, x, y, key, test: (px, py) => Math.abs(px - cx) < TW * .46 && py > cy - (HGT[type] || 90) && py < cy + TH * .45 });
}

/* 섬 위 표시: 택배, 완성품, 하트, 정비 알림. 밤에도 어두워지지 않게 마지막에 그린다. */
function drawMarkers(c) {
  const goal = state.home && typeof nextGoal === 'function' ? nextGoal().pid : null;
  if (state.home) producers().forEach((p, i) => {
    if (p.id === goal) drawGoalBadge(c, p);
    const site = homeSite(p.id), n = Math.floor(state.stock[p.id] || 0);
    if (!site || n < rateOf(site) * CFG.STOCK_SHOW_SEC || R.born[p.id] != null) return;
    const s = iso(p.x + .5, p.y + .5, HGT[p.type] + (tierOf(lvOf(site)) ? 84 : 34)), full = n >= capOf(site) - 1;
    bubble(c, s[0], s[1], FAC[p.type].icon, { phase: i * 1.700, badge: full ? 'MAX' : fmtShort(n), badgeBg: full ? '#f0604d' : '#f2a516', hit: { kind: 'stock', id: p.id, sx: s[0], sy: s[1] } });
  });
  RES.list.forEach((p, i) => {
    const n = petState(p.id).n, s = iso(p.x, p.y, 92 + Math.sin(R.t * 3 + i) * 4);
    c.save(); markerScale(c, s[0], s[1] + 20);
    for (let k = 0; k < CFG.PET.max; k++) disc(c, s[0] - 14 + k * 14, s[1] + 26, 4.500, k < n ? '#ff5d7a' : 'rgba(255,255,255,.75)', 'rgba(74,59,42,.25)', 1);
    if (n > 0) drawIcon(c, 'heart', s[0], s[1], 34);
    c.restore();
  });
  if (careDue()) {                                   // 정비 시기(GAM-007)와 차량이 확인한 부족(GAM-048)
    const s = iso(CAT_POS.x, CAT_POS.y, 128);
    bubble(c, s[0], s[1], 'wrench', { bg: '#ffb02e', color: '#ffffff', pulse: true, badge: '!', hit: { kind: 'cat' } });
  }
  if (state.rest && state.rest.state === 'active' && car.visible && !car.moving) {
    const s = iso(car.x, car.y, 96);
    bubble(c, s[0], s[1], 'cup', { color: '#8c5a3c', badge: Math.max(0, CFG.REST.rest - state.rest.acc) + '분', badgeBg: '#8c5a3c', hit: { kind: 'rest' } });
  }
  if (truck.parked && state.delivery) {
    const s = iso(truck.x, truck.y, 124);
    bubble(c, s[0], s[1], 'crate', { r: 44, pulse: true, badge: '!', hit: { kind: 'truck' } });
  }
}

/* 장식을 놓을 수 있는 자리인가 (규칙은 state.js canBuildAt) */
const canDecor = (x, y) => canBuildAt(x, y);
/* 아래 줄 다음 목표가 가리키는 시설 하나에만 작은 표시: 레벨업은 초록 화살표, 돌파는 주황 별 (GAM-040) */
function drawGoalBadge(c, p) {
  const site = homeSite(p.id); if (!site) return;
  const s = iso(p.x + .82, p.y + .82, (HGT[p.type] || 100) * .55), brk = breakMat(lvOf(site)) > 0, pulse = 1 + .1 * Math.sin(R.t * 5);
  c.save(); markerScale(c, s[0], s[1]);
  disc(c, s[0], s[1], 21 * pulse, brk ? '#ffb02e' : '#58c46b', '#ffffff', 4);
  drawIcon(c, brk ? 'star' : 'up', s[0], s[1], 24, '#ffffff');
  c.restore();
}

/* 짓기 창·상점에 쓰는 작은 그림 */
function thumb(kind, type, w, h, regionId) {
  const el = document.createElement('canvas'); el.width = w; el.height = h;
  const c = el.getContext('2d'), s = w / (kind === 'decor' ? 165 : 215);
  c.translate(w / 2, h * .74); c.scale(s, s); c.translate(-OX, -(OY + TH / 2));
  const keepL = R.L; R.L = 0;
  quad(c, [iso(0, 0), iso(1, 0), iso(1, 1), iso(0, 1)], kind === 'decor' ? '#f4e5c9' : '#a8de7a');
  (kind === 'decor' ? DECOR_DRAW : DRAW)[type](c, 0, 0, regionId);
  R.L = keepL; R.em.quads.length = 0; R.em.glows.length = 0;
  return el;
}

let _last = 0;
function frame(now) {
  const t = now / 1000, dt = Math.min(.05, t - _last || .016); _last = t; R.t = t;
  update(dt); draw();
  requestAnimationFrame(frame);
}
