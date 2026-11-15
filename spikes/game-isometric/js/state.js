'use strict';
/* 게임 상태와 규칙.
   CFG의 숫자는 모두 목업용 가정값입니다. 팀이 정하지 않은 값이며 README의 "가정값" 표와 같습니다.
   재화 역할은 DECISIONS D-003을 따릅니다: 자재는 차에서만 얻는 희소 재화, 골드는 시설이 버는 재화. */
const CFG = {
  MAT_PER_KM: 1,            // GAM-001: 1km당 1개 (draft 예시)
  WEEK_A: 200,              // GAM-001 주간 상한 제안의 기준 거리 A(km)
  DAILY_MAT: 7,             // GAM-025: 일일 항목 하나의 자재. 주간 최대 4×7×7=196 ≈ A
  DAILY: {                  // GAM-026~029: 판정 기준
    time: { min: 20 },      // 오늘 누적 운전 시간(분) 이상
    accel: { max: 2 },      // 오늘 누적 급가속·급감속 횟수 이하
    brake: { max: 1 },      // 오늘 누적 급제동 횟수 이하
    turn: { min: 3 },       // 오늘 누적 방향 지시등 사용 횟수 이상
    minJudge: 5,            // 이보다 짧은 운행은 횟수 항목 판정에서 뺌(분)
  },
  REST: { drive: 120, rest: 15, mat: 15 },    // GAM-030: 연속 운전 기준·휴식 인정 시간(분)·자재 (미정)
  OIL: { km: 10000, days: 365, mat: 30 },     // GAM-006: 주기 예시 데이터. 기록형, 주기마다 한 번 (D-004)
  CHECK: { mat: 10, coolDays: 7 },            // GAM-048: 차량이 확인하는 항목의 자재와 같은 항목의 보상 간격(일)
  PET: { max: 3, cooldown: 240 },             // GAM-032: 쿨타임(분) (미정)
  RESIDENTS_MAX: 6,                           // 섬을 돌아다니는 주민 수 상한 (기본 2명 + 생산 시설 수, GAM-032)
  TILE: { prices: [2000, 8000, 24000], maxRing: 2 },     // 땅 넓히기: 둘레별 칸당 골드(원래 섬 안·첫째·둘째 둘레), 최대 둘레 (미정)
  STOCK_HOURS: 60,                            // GAM-031: 약 2.5일치까지 쌓임
  STOCK_SHOW_SEC: 300,                        // 이만큼(초) 생산하면 완성품 표시
  LV: {                                       // GAM-040, GAM-041
    max: 40,
    breaks: { 10: 15, 20: 30, 30: 60 },       // 이 레벨에서 다음으로 올릴 때 드는 자재(단계 돌파)
    costK: 600, costR: 1.22,                  // 골드 비용 = 1레벨 초당 수익 × costK × costR^(레벨−1)
  },
  CITY_PRICE: n => 30 + 15 * (n - 1) + (n - 1) * (n - 1),   // GAM-039: 보유 도시 n곳일 때 다음 도시의 자재 가격
  GRADES: [                                   // GAM-042: 시설 레벨 합으로 정함. 행정 구역 이름을 쓰지 않음(D-004)
    { name: '새싹', min: 0 }, { name: '잎새', min: 8 }, { name: '꽃', min: 20 }, { name: '열매', min: 40 }, { name: '나무', min: 70 },
  ],
  CITY_FAC: ['local', 'bakery', 'market', 'cafe'],   // 새로 연 도시에 있는 생산 시설. local은 그 권역의 특산 건물(cities.js LOCAL)
};

/* 시설. rate는 1레벨의 초당 골드(목업용 가정값). cost는 짓는 데 드는 자재. */
const FAC = {
  stop: { name: '정류장' },
  bakery: { name: '빵집', rate: 1, icon: 'bread' },
  flower: { name: '꽃집', rate: .8, icon: 'coin' },
  shop: { name: '상점' },
  garage: { name: '정비소' },
  lighthouse: { name: '등대' },
  market: { name: '시장', cost: 8, rate: 1.5, icon: 'coin', combo: { near: 'stop', name: '야시장', icon: 'lantern' }, hint: '정류장 옆 · 야시장' },
  park: { name: '공원', gold: 1600, hint: '무대 옆 · 야외 공연' },     // 장식 건물: 골드, 개수 제한 없음 (GAM-004)
  stage: { name: '무대', gold: 3000, combo: { near: 'park', name: '야외 공연', icon: 'note' }, hint: '공원 옆 · 야외 공연' },
  cafe: { name: '카페', cost: 12, rate: 2, icon: 'cup' },
  local: { name: '특산 건물', rate: 1.2, icon: 'star' },   // 다른 도시의 업그레이드 시설. 이름·모양은 권역마다 다름
};
const BUILDABLE = ['market', 'cafe', 'park', 'stage'];   // 생산 시설은 섬에 종류별 하나, 장식 건물은 제한 없음

const DECOR = {
  flowerbed: { name: '꽃밭', price: 600 },
  bench: { name: '벤치', price: 900 },
  lamp: { name: '가로등', price: 1500 },
  fountain: { name: '분수', price: 4000 },
  tree_round: { name: '둥근 나무', price: 500 },
  tree_pine: { name: '소나무', price: 500 },
  tree_palm: { name: '야자수', price: 800 },
  bush: { name: '덤불', price: 300 },
  grass: { name: '풀숲', price: 200 },
};
const NATURE = ['tree_round', 'tree_pine', 'tree_palm', 'bush', 'grass'];
/* 땅 종류. build: 건물·장식을 놓을 수 있음, walk: 주민이 걸어 다님 (GAM-047) */
const TILE_TYPES = {
  g: { name: '잔디', build: true, walk: true }, s: { name: '모래', build: true, walk: true },
  p: { name: '돌길', build: true, walk: true }, f: { name: '꽃밭', build: true, walk: true },
  w: { name: '연못', build: false, walk: false },
};
const GRID = { min: -2, max: 11 };          // 땅을 넓힐 수 있는 범위(원래 섬 10×10 + 바깥 두 둘레 = 최대 14×14)
/* 처음부터 있는 나무·풀. 새로 시작할 때 이 자리에 장식으로 깔리고 옮기거나 보관함에 넣을 수 있습니다 */
const TREES = [
  [3.5, 0.6, 'pine'], [6.4, 0.6, 'pine'], [2.5, 1.5, 'round'], [7.5, 1.5, 'round'], [5.6, 1.4, 'bush'],
  [1.4, 2.4, 'pine'], [8.5, 2.5, 'pine'], [4.6, 2.5, 'round'], [0.5, 3.5, 'round'], [9.5, 3.5, 'round'],
  [1.4, 3.5, 'bush'], [7.6, 2.6, 'bush'], [0.5, 4.5, 'pine'], [0.5, 6.5, 'round'], [9.5, 6.4, 'bush'],
  [6.4, 9.45, 'palm'], [2.5, 8.6, 'bush'], [9.5, 7.5, 'palm'], [3.5, 9.45, 'bush'], [8.4, 8.5, 'bush'],
];
const TREE_DECOR = { round: 'tree_round', pine: 'tree_pine', palm: 'tree_palm', bush: 'bush' };
const naturalDecor = () => TREES.map(([x, y, kind]) => ({ type: TREE_DECOR[kind], x: Math.floor(x), y: Math.floor(y) }));

const DAILY_ITEMS = [
  { id: 'time', name: '운전 시간', icon: 'clock', unit: '분' },
  { id: 'accel', name: '급가속·급감속', icon: 'gauge', unit: '회' },
  { id: 'brake', name: '급제동', icon: 'brake', unit: '회' },
  { id: 'turn', name: '방향 지시등', icon: 'turn', unit: '회' },
];
/* GAM-048: 차량이 스스로 확인하는 관리 항목 (Safety, CAR_SAFETY) */
const CHECKS = {
  oil: { name: '엔진오일 양', icon: 'drop', api: 'getEngineOilLevelState' },
  washer: { name: '워셔액', icon: 'washer', api: 'hasLowWasherFluidWarning' },
};

const START_CLOCK = 14 * 60 + 32;        // 2026-11-14(토) 14:32 (SCREENS.md 6절)
const SAVE_KEY = 'gam-mockup-v3';   // v3: 건물 id·땅 넓히기·장식 나무. 이전 저장은 읽지 않음

const pad2 = n => String(n).padStart(2, '0');
const dayOf = clock => Math.floor(clock / 1440);
const weekOf = day => Math.floor((day + 5) / 7);   // 월요일에 바뀜. 0일째는 토요일
const hourOf = clock => ((clock % 1440) + 1440) % 1440 / 60;
function fmtDate(day) {
  const d = new Date(2026, 10, 14 + day);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fmtClock(clock) {
  const m = ((Math.floor(clock) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
const fmtNum = n => Math.round(n).toLocaleString('ko-KR');
const _short = new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 });
const fmtShort = n => (n < 10000 ? fmtNum(n) : _short.format(Math.floor(n)));
const fmtRate = r => (r < 10 ? r.toFixed(1) : fmtShort(r));

function freshState() {
  return {
    v: 3,
    gear: 'P',
    clock: START_CLOCK,
    mat: 3, gold: 1000,                // 시작하자마자 장식 하나(벤치 900)를 살 수 있게
    odo: 34512,
    week: { i: weekOf(0), km: 0 },
    sim: { km: 11, min: 24, accel: 0, brake: 0, turn: 6 },
    home: null,                      // 본거지 도시 id. 처음 실행할 때 고름 (GAM-038)
    cities: {},                      // 보유 도시. id → { home } 또는 { lv: {type: 레벨}, stock: {type: 골드}, day }
    built: {                         // 본거지 섬의 건물: id → { type, x, y }. 옮겨도 id가 같아 레벨·쌓인 골드가 따라감
      bakery: { type: 'bakery', x: 5, y: 4 }, flower: { type: 'flower', x: 3, y: 4 },
    },
    seq: 0,                          // 새 건물 id 번호
    extra: {},                       // 바꾼 땅·넓힌 땅: 'x,y' → 땅 종류 (GAM-047)
    stock: { bakery: 2400, flower: 1200 },
    lv: {},                          // 본거지 생산 시설의 레벨. 없으면 1
    away: 0,                         // 마지막으로 요약을 본 뒤 쌓인 골드 (GAM-044)
    decor: naturalDecor(),           // { type, x, y }. 기본 나무·풀도 장식
    inv: {},                         // 보관함: type → 개수
    bought: {},                      // 상점에서 산 횟수: type → 개수 (가격 상승 기준)
    pets: {},                        // 주민 id → { n: 남은 하트, acc: 충전 경과(분) }
    daily: { time: 0, accel: 0, brake: 0, turn: 0, done: {} },
    delivery: null,
    rest: null,                      // { state:'active'|'done', acc }
    oil: { lastDay: -347, lastOdo: 25512, dueOdo: 35512, dueDay: 18, quest: false },
    care: {
      filter: { dueOdo: 40712, dueDay: 140 },
      rotate: { dueOdo: 37312, dueDay: null },
    },
    sig: { oil: 'normal', washer: 'normal' },                 // 차량 신호 관측값 (시뮬레이터)
    check: { oil: { active: false, last: -99 }, washer: { active: false, last: -99 } },
    loc: 'gg:성남', locPerm: true,  // 차량 위치(FusedLocation 대신)와 위치 권한
    foot: {},                        // 발자국: 도시 id → 첫 관측 날짜(일). 좌표·경로는 저장하지 않음 (GAM-043)
    tripSeen: [], newFoot: [],
    warn: { tire: false, heat: false },
    sound: true,
    tripRestVoiced: false,
  };
}

let state = freshState();

/* ---- 이벤트 ---- */
const _subs = {};
function on(evt, fn) { (_subs[evt] = _subs[evt] || []).push(fn); }
function emit(evt, data) { (_subs[evt] || []).forEach(fn => fn(data)); }

/* ---- 저장 (GAM-N04) ---- */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경에서는 건너뜀 */ } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.v === 3) state = Object.assign(freshState(), s);
  } catch (e) { /* 손상된 저장은 버림 */ }
}
function resetState() { state = freshState(); save(); emit('reset'); }

/* ---- 운행 자재: 주간 완만한 상한 (GAM-001 제안) ---- */
const A = () => CFG.WEEK_A;
function weekMat(d) { d = Math.floor(d); return Math.min(d, A()) + Math.floor(Math.max(0, Math.min(d, 2 * A()) - A()) / 2); }
const weekTier = d => (d < A() ? 1 : d < 2 * A() ? .5 : 0);

/* ---- 본거지 섬의 시설 ---- */
function producers() {
  return Object.entries(state.built).filter(([, b]) => FAC[b.type].rate).map(([id, b]) => ({ id, type: b.type, x: b.x, y: b.y }));
}
const hasProducer = type => producers().some(p => p.type === type);
function buildingAt(x, y) { return Object.entries(state.built).find(([, b]) => b.x === x && b.y === y) || null; }
function typeAt(x, y) {
  const b = buildingAt(x, y);
  if (b) return b[1].type;
  const f = FIXED.find(o => o.x === x && o.y === y);
  return f ? f.type : null;
}
function isNear(x, y, type) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => typeAt(x + dx, y + dy) === type);
}
/* 조합이 맞은 시설 좌표 목록 */
function comboSites(type) {
  const c = FAC[type].combo; if (!c) return [];
  return Object.values(state.built).filter(b => b.type === type).map(b => [b.x, b.y]).filter(([x, y]) => isNear(x, y, c.near));
}

/* ---- 놓을 수 있는 칸, 땅 넓히기·바꾸기·없애기 (GAM-004, GAM-047) ---- */
const onCat = (x, y) => Math.floor(CAT_POS.x) === x && Math.floor(CAT_POS.y) === y;
function tileEmpty(x, y) { return !typeAt(x, y) && !state.decor.some(d => d.x === x && d.y === y) && !onCat(x, y); }
/* 건물·장식을 놓을 수 있는 빈 땅인가: 놓을 수 있는 땅 종류이고 위에 아무것도 없음 */
function canBuildAt(x, y) { return !!(TILE_TYPES[tileAt(x, y)] || {}).build && tileEmpty(x, y); }
const baseTile = (x, y) => (MAP[y] && MAP[y][x]) || '.';
const tileRing = (x, y) => Math.max(0, -x, -y, x - 9, y - 9);
const isBridge = (x, y) => y === 5 && (x < 0 || x > 9);
const tilePrice = (x, y) => CFG.TILE.prices[tileRing(x, y)];
const inLandLimit = (x, y) => tileRing(x, y) <= CFG.TILE.maxRing && x >= GRID.min && y >= GRID.min && x <= GRID.max && y <= GRID.max;
function canBuyTile(x, y) {
  if (!inLandLimit(x, y) || isLand(x, y) || isBridge(x, y)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isLand(x + dx, y + dy));
}
function landStats() {
  let max = 0;
  for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) if (inLandLimit(x, y) && !isBridge(x, y) && baseTile(x, y) === '.') max++;
  return { bought: Object.keys(state.extra).filter(k => { const [x, y] = k.split(',').map(Number); return baseTile(x, y) === '.'; }).length, max };
}
function buyTile(x, y, type = 'g') {
  if (state.gear !== 'P' || !canBuyTile(x, y) || !TILE_TYPES[type]) return false;
  const price = tilePrice(x, y); if (state.gold < price) return false;
  state.gold -= price; state.extra[x + ',' + y] = type;
  save(); emit('change');
  return true;
}
/* 종류 바꾸기: 위에 아무것도 없는 땅만, 무료. 도로·주차 자리는 바꾸지 않음 */
function canPaintTile(x, y, type) { const cur = tileAt(x, y); return !!TILE_TYPES[type] && !!TILE_TYPES[cur] && cur !== type && tileEmpty(x, y); }
function paintTile(x, y, type) {
  if (state.gear !== 'P' || !canPaintTile(x, y, type)) return false;
  const key = x + ',' + y;
  if (baseTile(x, y) === type) delete state.extra[key]; else state.extra[key] = type;
  save(); emit('change');
  return true;
}
/* 없애기: 골드로 산 빈 땅만 바다로 되돌림. 골드는 돌려주지 않음 */
const canRemoveTile = (x, y) => baseTile(x, y) === '.' && isLand(x, y) && tileEmpty(x, y);
function removeTile(x, y) {
  if (state.gear !== 'P' || !canRemoveTile(x, y)) return false;
  delete state.extra[x + ',' + y];
  save(); emit('change');
  return true;
}

/* ---- 섬을 돌아다니는 주민. 모두 쓰다듬을 수 있음 (GAM-032) ---- */
const RESIDENT_KINDS = ['dog', 'duck', 'cat'];
function residentIds() { const n = Math.min(CFG.RESIDENTS_MAX, 2 + producers().length); return Array.from({ length: n }, (_, i) => 'r' + i); }
const residentKind = rid => RESIDENT_KINDS[+rid.slice(1) % RESIDENT_KINDS.length];
function petState(rid) { return state.pets[rid] || (state.pets[rid] = { n: CFG.PET.max, acc: 0 }); }

/* ---- 레벨·수익 (GAM-040~042) ---- */
const tierOf = L => (L > 30 ? 3 : L > 20 ? 2 : L > 10 ? 1 : 0);
const incomeAt = (type, L) => FAC[type].rate * L * Math.pow(2, tierOf(L));
const upCost = (type, L) => Math.round(FAC[type].rate * CFG.LV.costK * Math.pow(CFG.LV.costR, L - 1));
const breakMat = L => CFG.LV.breaks[L] || 0;

/* 사이트: 도시 하나의 생산 시설 하나. { city, key, type } */
function sitesOf(city) {
  const c = state.cities[city]; if (!c) return [];
  if (c.home) return producers().map(p => ({ city, key: p.id, type: p.type, x: p.x, y: p.y }));
  return CFG.CITY_FAC.map(t => ({ city, key: t, type: t }));
}
function lvOf(s) { const c = state.cities[s.city]; return (c.home ? state.lv[s.key] : c.lv[s.key]) || 1; }
function stockOf(s) { const c = state.cities[s.city]; return (c.home ? state.stock[s.key] : c.stock[s.key]) || 0; }
function setStock(s, v) { const c = state.cities[s.city]; if (c.home) state.stock[s.key] = v; else c.stock[s.key] = v; }
const rateOf = s => incomeAt(s.type, lvOf(s));
const capOf = s => rateOf(s) * CFG.STOCK_HOURS * 3600;
const ownedIds = () => Object.keys(state.cities);
const cityRate = city => sitesOf(city).reduce((a, s) => a + rateOf(s), 0);
const totalRate = () => ownedIds().reduce((a, c) => a + cityRate(c), 0);
const cityStock = city => sitesOf(city).reduce((a, s) => a + Math.floor(stockOf(s)), 0);
const lvSum = city => sitesOf(city).reduce((a, s) => a + lvOf(s), 0);
function gradeOf(city) { const n = lvSum(city); let g = 0; CFG.GRADES.forEach((d, i) => { if (n >= d.min) g = i; }); return g; }
const homeSite = key => sitesOf(state.home).find(s => s.key === key);

/* 레벨 올리기. 구간 레벨에서는 자재가 든다(단계 돌파). 성공하면 { ok, L, grade:[전,후] } */
function upgrade(s) {
  const L = lvOf(s);
  if (L >= CFG.LV.max) return { err: 'max' };
  const g = upCost(s.type, L), m = breakMat(L);
  if (state.gold < g || state.mat < m) return { err: 'lack', gold: Math.max(0, g - state.gold), mat: Math.max(0, m - state.mat) };
  const g0 = gradeOf(s.city);
  state.gold -= g; state.mat -= m;
  const c = state.cities[s.city];
  if (c.home) state.lv[s.key] = L + 1; else c.lv[s.key] = L + 1;
  save(); emit('change');
  return { ok: true, L: L + 1, broke: m > 0, grade: [g0, gradeOf(s.city)] };
}
function collectSite(s) {
  const n = Math.floor(stockOf(s));
  if (n <= 0) return 0;
  setStock(s, stockOf(s) - n); state.gold += n;
  return n;
}
function collectCity(city) { const n = sitesOf(city).reduce((a, s) => a + collectSite(s), 0); save(); emit('change'); return n; }
function collectAll() { const n = ownedIds().reduce((a, c) => a + sitesOf(c).reduce((b, s) => b + collectSite(s), 0), 0); state.away = 0; save(); emit('change'); return n; }
function collect(id) { const s = homeSite(id); if (!s) return 0; const n = collectSite(s); save(); emit('change'); return n; }
const stockCap = id => { const s = homeSite(id); return s ? capOf(s) : 0; };

/* ---- 도시 (GAM-039) ---- */
const cityPrice = () => CFG.CITY_PRICE(ownedIds().length);
const nextPrice = () => CFG.CITY_PRICE(ownedIds().length + 1);
function pickHome(id) {
  if (state.home) return false;
  state.home = id; state.cities[id] = { home: true };
  save(); emit('change');
  return true;
}
function openCity(id) {
  if (state.cities[id] || !CITIES[id]) return { err: 'owned' };
  const p = cityPrice();
  if (state.mat < p) return { err: 'lack', mat: p - state.mat };
  state.mat -= p;                                        // 차감과 보유를 함께 반영 (GAM-039)
  const lv = {}, stock = {};
  CFG.CITY_FAC.forEach(t => { lv[t] = 1; stock[t] = 0; });
  state.cities[id] = { lv, stock, day: dayOf(state.clock) };
  save(); emit('change');
  return { ok: true, price: p };
}

/* ---- 정비 ---- */
function oilLeft() {
  return { km: Math.max(0, state.oil.dueOdo - state.odo), days: Math.max(0, state.oil.dueDay - dayOf(state.clock)) };
}
function checkOil() {
  const l = oilLeft();
  if ((l.km <= 0 || l.days <= 0) && !state.oil.quest) { state.oil.quest = true; emit('oilDue'); }
}
function setOilPreset(p) {
  const day = dayOf(state.clock);
  const o = state.oil;
  if (p === 'ok') { o.dueOdo = state.odo + 4200; o.dueDay = day + 96; o.quest = false; }
  if (p === 'soon') { o.dueOdo = state.odo + 1000; o.dueDay = day + 18; o.quest = false; }
  if (p === 'due') { o.dueOdo = state.odo; }
  checkOil(); save(); emit('change');
}
/* 주기형 정비: 사용자 기록으로 완료. 퀘스트일 때만, 주기마다 한 번 자재 (GAM-007, D-004) */
function recordOil(day, odo) {
  const o = state.oil;
  o.lastDay = day; o.lastOdo = odo;
  o.dueOdo = odo + CFG.OIL.km; o.dueDay = day + CFG.OIL.days;
  const wasQuest = o.quest; o.quest = false;
  if (wasQuest) state.mat += CFG.OIL.mat;
  save(); emit('change');
  return wasQuest ? CFG.OIL.mat : 0;
}
/* 차량이 확인하는 항목: 부족이 관측되면 퀘스트, 정상으로 돌아오면 입력 없이 완료 (GAM-048) */
function setSig(k, v) {
  state.sig[k] = v;
  const q = state.check[k], day = dayOf(state.clock);
  if (v === 'low' && !q.active) { q.active = true; save(); emit('checkNew', k); }
  else if (v === 'normal' && q.active) {
    q.active = false;
    let mat = 0;
    if (day - q.last >= CFG.CHECK.coolDays) { mat = CFG.CHECK.mat; q.last = day; state.mat += mat; }   // 같은 항목을 반복 보상하지 않음
    save(); emit('checkDone', { k, mat });
  }
  /* 'error'(읽기 실패)는 부족으로도 정상으로도 보지 않는다 (GAM-UC-002 E7) */
  save(); emit('change');
}
const careDue = () => state.oil.quest || Object.values(state.check).some(q => q.active);

/* ---- 시간 ---- */
let _tickSave = 0;
function advance(mins, quiet) {
  if (mins <= 0) return;
  const d0 = dayOf(state.clock);
  state.clock += mins;
  ownedIds().forEach(c => sitesOf(c).forEach(s => {
    const before = stockOf(s), after = Math.min(capOf(s), before + rateOf(s) * mins * 60);
    if (after > before) { setStock(s, after); state.away += after - before; }
  }));
  residentIds().map(petState).forEach(p => {
    if (p.n >= CFG.PET.max) { p.acc = 0; return; }
    p.acc += mins;
    while (p.acc >= CFG.PET.cooldown && p.n < CFG.PET.max) { p.n++; p.acc -= CFG.PET.cooldown; }
    if (p.n >= CFG.PET.max) p.acc = 0;
  });
  if (state.gear === 'P' && state.rest && state.rest.state === 'active') {
    state.rest.acc += mins;
    if (state.rest.acc >= CFG.REST.rest) { state.rest.state = 'done'; state.mat += CFG.REST.mat; emit('restDone'); }
  }
  const d1 = dayOf(state.clock);
  if (d1 !== d0) {
    state.daily = { time: 0, accel: 0, brake: 0, turn: 0, done: {} };
    state.rest = null;               // 전날 돌발 퀘스트는 보상 없이 끝남
    if (weekOf(d1) !== state.week.i) { state.week = { i: weekOf(d1), km: 0 }; emit('newWeek'); }
    emit('newDay');
  }
  checkOil();
  if (quiet) { emit('tick'); if (++_tickSave >= 15) { _tickSave = 0; save(); } return; }
  save(); emit('change');
}
function jumpTo(target) {
  const now = state.clock % 1440;
  if (target === 'next') { advance(1440 - now + 8.5 * 60); return; }
  if (target === 'week') {                 // 다음 월요일 08:30
    const day = dayOf(state.clock), toMon = 7 - ((day + 5) % 7);
    advance(toMon * 1440 - now + 8.5 * 60); return;
  }
  let diff = target * 60 - now; if (diff <= 0) diff += 1440;
  advance(diff);
}

/* ---- 위치·발자국 (GAM-043) ---- */
function setLoc(id) {
  state.loc = id;
  if (state.gear === 'D' && state.locPerm && !state.tripSeen.includes(id)) state.tripSeen.push(id);
  save(); emit('change');
}
function setLocPerm(onOff) { state.locPerm = onOff; if (!onOff) state.tripSeen = []; save(); emit('change'); }

/* ---- 운행 ---- */
function startTrip() {
  state.gear = 'D';
  state.tripRestVoiced = false;
  state.tripSeen = state.locPerm ? [state.loc] : [];      // 주행 중에는 관측만 하고 알리지 않음
  save(); emit('gear'); emit('change');
  checkRestTrigger();
}
/* 주행 중 연속 운전 시간이 기준을 넘으면 돌발 퀘스트 (GAM-030) */
function checkRestTrigger() {
  if (state.gear !== 'D' || state.tripRestVoiced) return;
  if (state.sim.min >= CFG.REST.drive && !state.rest) {          // 하루 한 번만 (가정)
    state.tripRestVoiced = true;
    state.rest = { state: 'active', acc: 0 };
    save(); emit('restVoice'); emit('change');
  }
}
/* 주차: 이번 운행을 판정하고 택배를 만든다 (GAM-UC-001 B3) */
function endTrip() {
  const s = state.sim, day = dayOf(state.clock);
  state.gear = 'P';
  if (state.locPerm) state.tripSeen.forEach(id => { if (state.foot[id] == null) { state.foot[id] = day; state.newFoot.push(id); } });
  state.tripSeen = [];
  if (s.km > 0) {
    const odo0 = state.odo;
    state.odo += s.km;
    const wk0 = state.week.km, wk1 = wk0 + s.km;
    const mat = (weekMat(wk1) - weekMat(wk0)) * CFG.MAT_PER_KM;    // 구간 경계를 넘어도 잃거나 두 번 받지 않음
    state.week.km = wk1;
    const d = state.daily;
    const allDoneBefore = DAILY_ITEMS.every(it => d.done[it.id]);
    d.time += s.min; d.accel += s.accel; d.brake += s.brake; d.turn += s.turn;
    const short = s.min < CFG.DAILY.minJudge;
    let safe = 0;
    const items = DAILY_ITEMS.map(it => {
      let status, value = d[it.id];
      if (d.done[it.id]) status = 'kept';                         // 이미 달성, 다시 보상하지 않음
      else if (short && (it.id === 'accel' || it.id === 'brake')) status = 'skip';
      else {
        const c = CFG.DAILY[it.id];
        const ok = c.min != null ? value >= c.min : value <= c.max;
        status = ok ? 'ok' : 'no';
        if (ok) { d.done[it.id] = true; safe += CFG.DAILY_MAT; }
      }
      return { id: it.id, status, value };
    });
    const prev = state.delivery;
    /* 아직 받지 않은 택배에 담긴 보상은 '달성'으로 남긴다 */
    if (prev) items.forEach(it => { const p = prev.items.find(q => q.id === it.id); if (p && p.status === 'ok') it.status = 'ok'; });
    state.delivery = {
      km: s.km + (prev ? prev.km : 0),
      mat: mat + (prev ? prev.mat : 0),
      safe: safe + (prev ? prev.safe : 0),
      odo0: prev ? prev.odo0 : odo0, odo1: state.odo,
      wk0: prev ? prev.wk0 : wk0, wk1,
      allDoneBefore, items,
    };
  }
  checkOil(); save(); emit('gear'); emit('change');
}
function claimDelivery() {
  const d = state.delivery; if (!d) return null;
  state.mat += d.mat + d.safe; state.delivery = null;
  save(); emit('change');
  return d;
}

/* ---- 건설·옮기기·쓰다듬기·상점 ---- */
/* 생산 시설은 자재, 섬에 종류별 하나. 장식 건물(공원·무대)은 골드, 개수 제한 없음. 빈 땅 어디에나 짓습니다 (GAM-004) */
const buildCost = type => ({ mat: FAC[type].cost || 0, gold: FAC[type].gold || 0 });
function build(type, x, y) {
  if (state.gear !== 'P' || !BUILDABLE.includes(type) || !canBuildAt(x, y)) return false;
  if (FAC[type].rate && hasProducer(type)) return false;
  const c = buildCost(type);
  if (state.mat < c.mat || state.gold < c.gold) return false;
  state.mat -= c.mat; state.gold -= c.gold;
  const id = 'b' + (++state.seq);
  state.built[id] = { type, x, y };
  if (FAC[type].rate) { state.stock[id] = 0; state.lv[id] = 1; }
  save(); emit('change');
  return id;
}
/* 건물 옮기기: 레벨·쌓인 골드는 id에 붙어 따라감. 고정 건물(등대·상점·정류장·정비소)은 옮기지 않음 (GAM-046) */
function moveBuilding(id, x, y) {
  const b = state.built[id];
  if (state.gear !== 'P' || !b || !canBuildAt(x, y)) return false;
  b.x = x; b.y = y; save(); emit('change');
  return true;
}
function pet(id) {
  if (!residentIds().includes(id)) return false;
  const p = petState(id);
  if (p.n <= 0) return false;
  p.n--; save(); emit('change');
  return true;
}
/* 같은 종류를 살 때마다 값이 오름. 기본으로 깔린 나무·풀은 산 것으로 세지 않음 */
const decorPrice = type => Math.round(DECOR[type].price * 1.25 ** (state.bought[type] || 0));
function buyDecor(type) {
  const price = decorPrice(type);
  if (state.gold < price) return false;
  state.gold -= price;
  state.bought[type] = (state.bought[type] || 0) + 1;
  state.inv[type] = (state.inv[type] || 0) + 1;
  save(); emit('change');
  return true;
}
function placeDecor(type, x, y) {
  if (!state.inv[type] || !canBuildAt(x, y)) return false;
  state.inv[type]--;
  state.decor.push({ type, x, y });
  save(); emit('change');
  return true;
}
function moveDecor(fx, fy, x, y) {
  const d = state.decor.find(o => o.x === fx && o.y === fy);
  if (state.gear !== 'P' || !d || !canBuildAt(x, y)) return false;
  d.x = x; d.y = y; save(); emit('change');
  return true;
}
function pickupDecor(x, y) {
  const i = state.decor.findIndex(d => d.x === x && d.y === y);
  if (i < 0) return null;
  const [d] = state.decor.splice(i, 1);
  state.inv[d.type] = (state.inv[d.type] || 0) + 1;
  save(); emit('change');
  return d.type;
}
function setWarn(kind, onOff) { state.warn[kind] = onOff; save(); emit('warn'); emit('change'); }

function questBadge() {
  let n = DAILY_ITEMS.filter(it => !state.daily.done[it.id]).length;
  if (state.oil.quest) n++;
  if (state.rest && state.rest.state === 'active') n++;
  n += Object.values(state.check).filter(q => q.active).length;
  return n;
}
