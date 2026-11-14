'use strict';
/* 게임 상태와 규칙.
   CFG의 숫자는 모두 목업용 가정값입니다. 팀이 정하지 않은 값이며 README의 "가정값" 표와 같습니다. */
const CFG = {
  MAT_PER_KM: 1,            // GAM-001 메모: 1km당 자재 수 (미정)
  WEEK_KM_A: 200,           // GAM-001·GAM-Q27 제안: 주간 기준 거리 A(km). A까지 1배, A~2A 0.5배, 2A 초과 0
  DAILY_MAT: 7,             // D-003: 안전운전 일일 항목 보상(자재). 주간 최대가 A와 비슷하도록 (7개 × 4항목 × 7일 ≈ 200)
  DAILY: {                  // GAM-Q21~Q24: 판정 기준 (미정)
    time: { min: 20 },      // 오늘 누적 운전 시간(분) 이상
    accel: { max: 2 },      // 오늘 누적 급가속·급감속 횟수 이하
    brake: { max: 1 },      // 오늘 누적 급제동 횟수 이하
    turn: { min: 3 },       // 오늘 누적 방향 지시등 사용 횟수 이상
    minJudge: 5,            // 이보다 짧은 운행은 횟수 항목 판정에서 뺌(분)
  },
  REST: { drive: 120, rest: 15, mat: 10 },    // GAM-Q26: 연속 운전 기준·휴식 인정 시간(분), 보상 자재 (미정)
  OIL: { km: 10000, days: 365, mat: 20 },     // GAM-Q5: 주기 예시 데이터. D-004: 기록형 정비도 자재, 주기마다 한 번
  PET: { max: 3, cooldown: 240 },             // GAM-032: 쿨타임(분) (미정)
  RESIDENTS_MAX: 6,                           // 도시마다 돌아다니는 주민 수 상한 (기본 주민 + 생산 시설 수)
  TILE: { prices: [1000, 4000, 12000], maxRing: 2 },   // 땅 넓히기: 둘레별 칸당 골드(원래 섬 안·첫째·둘째 둘레), 최대 둘레 (미정)
  STOCK_HOURS: 60,                            // GAM-031: 약 2.5일치까지 쌓임
  STOCK_SHOW: 100,                            // 이만큼(골드) 쌓이면 완성품 표시
};

/* 시설. rate가 있으면 골드를 만드는 생산 시설입니다. 실제 수익은 economy.js의 FAC_ECON을 씁니다. */
const FAC = {
  stop: { name: '정류장' },
  bakery: { name: '빵집', rate: true, icon: 'bread' },
  flower: { name: '꽃집', rate: true, icon: 'coin' },
  shop: { name: '상점' },
  garage: { name: '정비소' },
  lighthouse: { name: '등대' },
  market: { name: '시장', cost: 8, rate: true, icon: 'coin', combo: { near: 'stop', name: '야시장', icon: 'lantern' }, hint: '정류장 옆 · 야시장' },
  park: { name: '공원', gold: 800, hint: '무대 옆 · 야외 공연' },                // 장식 건물: 골드, 개수 제한 없음
  stage: { name: '무대', gold: 1500, combo: { near: 'park', name: '야외 공연', icon: 'note' }, hint: '공원 옆 · 야외 공연' },
  cafe: { name: '카페', cost: 12, rate: true, icon: 'cup' },
  local: { name: '특산 건물', cost: 10, rate: true, icon: 'star' },   // 이름과 모양은 권역마다 다름 (cities.js)
};
const BUILDABLE = ['local', 'market', 'cafe', 'park', 'stage'];
/* 시설 이름. 특산 건물은 도시가 속한 권역의 이름을 씁니다. */
function facName(type, cityId = state.cur) { return type === 'local' ? cityLocal(cityId).name : FAC[type].name; }

/* 옮길 수 없는 고정 건물. 정류장·정비소·실제 경고의 이상 현상은 본거지에만 있습니다(GAM-034 메모). */
const HOME_FIXED = [
  { type: 'lighthouse', x: 4, y: 0 }, { type: 'shop', x: 1, y: 4 },
  { type: 'stop', x: 8, y: 4 }, { type: 'garage', x: 6, y: 6 },
];
const CITY_FIXED = [{ type: 'lighthouse', x: 4, y: 0 }, { type: 'shop', x: 1, y: 4 }];
/* 처음부터 있는 나무·풀. 새 도시를 만들 때 이 자리에 장식으로 깔리고, 옮기거나 보관함에 넣을 수 있습니다. 정비소 주민 자리 */
const TREES = [
  [3.5, 0.6, 'pine'], [6.4, 0.6, 'pine'], [2.5, 1.5, 'round'], [7.5, 1.5, 'round'], [5.6, 1.4, 'bush'],
  [1.4, 2.4, 'pine'], [8.5, 2.5, 'pine'], [4.6, 2.5, 'round'], [0.5, 3.5, 'round'], [9.5, 3.5, 'round'],
  [1.4, 3.5, 'bush'], [7.6, 2.6, 'bush'], [0.5, 4.5, 'pine'], [0.5, 6.5, 'round'], [9.5, 6.4, 'bush'],
  [6.4, 9.45, 'palm'], [2.5, 8.6, 'bush'], [9.5, 7.5, 'palm'], [3.5, 9.45, 'bush'], [8.4, 8.5, 'bush'],
];
const TREE_DECOR = { round: 'tree_round', pine: 'tree_pine', palm: 'tree_palm', bush: 'bush' };
const naturalDecor = () => TREES.map(([x, y, kind]) => ({ type: TREE_DECOR[kind], x: Math.floor(x), y: Math.floor(y) }));
const CAT_POS = { x: 7.3, y: 7.35 };
const GRID = { min: -2, max: 11 };          // 땅을 넓힐 수 있는 범위(원래 섬 10×10 + 바깥 두 둘레 = 최대 14×14)

const DECOR = {
  flowerbed: { name: '꽃밭', price: 300 },
  bench: { name: '벤치', price: 400 },
  lamp: { name: '가로등', price: 600 },
  fountain: { name: '분수', price: 1500 },
  tree_round: { name: '둥근 나무', price: 250 },
  tree_pine: { name: '소나무', price: 250 },
  tree_palm: { name: '야자수', price: 400 },
  bush: { name: '덤불', price: 150 },
  grass: { name: '풀숲', price: 100 },
};
/* 넓힌 땅에 깔 수 있는 땅 종류. build: 건물·장식을 놓을 수 있음, walk: 주민이 걸어 다님 */
const TILE_TYPES = {
  g: { name: '잔디', build: true, walk: true },
  s: { name: '모래', build: true, walk: true },
  p: { name: '돌길', build: true, walk: true },
  f: { name: '꽃밭', build: true, walk: true },
  w: { name: '연못', build: false, walk: false },
};

const DAILY_ITEMS = [
  { id: 'time', name: '운전 시간', icon: 'clock', unit: '분' },
  { id: 'accel', name: '급가속·급감속', icon: 'gauge', unit: '회' },
  { id: 'brake', name: '급제동', icon: 'brake', unit: '회' },
  { id: 'turn', name: '방향 지시등', icon: 'turn', unit: '회' },
];

const START_CLOCK = 14 * 60 + 32;        // 2026-11-14 14:32 (SCREENS.md 6절)
const SAVE_KEY = 'gam-mockup-v2';

const pad2 = n => String(n).padStart(2, '0');
const dayOf = clock => Math.floor(clock / 1440);
const hourOf = clock => ((clock % 1440) + 1440) % 1440 / 60;
/* 월요일에 바뀌는 주 번호. 0일째(2026-11-14)는 토요일입니다. */
const weekOf = day => Math.floor((day + 5) / 7);
function fmtDate(day) {
  const d = new Date(2026, 10, 14 + day);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fmtClock(clock) {
  const m = ((Math.floor(clock) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
const fmtNum = n => Math.round(n).toLocaleString('ko-KR');
/* 큰 골드는 만·억 단위로 줄여 씁니다 */
function fmtBig(n) {
  n = Math.floor(n);
  if (n < 10000) return fmtNum(n);
  if (n < 1e8) return (n / 1e4).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + '만';
  return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '억';
}
const fmtRate = r => r < 10 ? r.toFixed(1) : fmtBig(r);

function newCity(id, home) {
  return {
    built: home                                  // 건물 id → { type, x, y }. 옮겨도 id가 같아 레벨·쌓인 골드가 따라감
      ? { bakery: { type: 'bakery', x: 5, y: 4 }, flower: { type: 'flower', x: 3, y: 4 } }
      : { starter: { type: starterType(id), x: 5, y: 4 } },
    seq: 0,                                      // 새 건물 id 번호
    extra: {},                                   // 골드로 넓힌 땅 'x,y' → 땅 종류(TILE_TYPES)
    stock: home ? { bakery: 220, flower: 120 } : { starter: 0 },
    levels: {},                                  // 생산 시설 id → 레벨
    decor: naturalDecor(),                       // { type, x, y }. 기본 나무·풀도 장식
    pets: {},                                    // 주민 id → { n: 남은 하트, acc: 충전 경과(분) }
    grade: 0,                                    // 알린 적 있는 가장 높은 등급
    natural: true,                               // 기본 나무·풀을 장식으로 깔았음
  };
}

function freshState() {
  return {
    v: 2,
    savedAt: Date.now(),
    home: DEFAULT_HOME, homePicked: false, cur: DEFAULT_HOME,
    cities: { [DEFAULT_HOME]: newCity(DEFAULT_HOME, true) },
    footprints: {},                  // 도시 id → 첫 관측 날짜(일). 좌표·경로·시각은 저장하지 않음 (GAM-039)
    footNew: [],                     // 지도에서 아직 보지 않은 새 발자국
    footprintOn: true,
    week: 0, weekKm: 0,              // GAM-001 제안: 이번 주 누적 운행 거리
    deliveries: 0,
    offlineSummary: null,
    gear: 'P',
    clock: START_CLOCK,
    mat: 0, gold: 300,
    odo: 34512,
    sim: { km: 11, min: 24, accel: 0, brake: 0, turn: 6, seen: [] },
    inv: {},                         // 보관함: type → 개수
    bought: {},                      // 상점에서 산 횟수: type → 개수 (가격 상승 기준)
    daily: { time: 0, accel: 0, brake: 0, turn: 0, done: {} },
    delivery: null,
    rest: null,                      // { state:'active'|'done', acc }
    oil: { lastDay: -347, lastOdo: 25512, dueOdo: 35512, dueDay: 18, quest: false, thanked: false },
    care: {
      filter: { dueOdo: 40712, dueDay: 140 },
      rotate: { dueOdo: 37312, dueDay: null },
    },
    warn: { tire: false, heat: false },
    sound: true,
    tripRestVoiced: false,
  };
}

let state = freshState();
const C = (id = state.cur) => state.cities[id];
const atHome = () => state.cur === state.home;

/* ---- 이벤트 ---- */
const _subs = {};
function on(evt, fn) { (_subs[evt] = _subs[evt] || []).push(fn); }
function emit(evt, data) { (_subs[evt] || []).forEach(fn => fn(data)); }

/* ---- 저장 (GAM-N04) ---- */
function save() { state.savedAt = Math.max(state.savedAt || 0, Date.now()); try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경에서는 건너뜀 */ } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.v === 2 && s.cities && s.cities[s.home]) {
      state = Object.assign(freshState(), s);
      state.sim = Object.assign(freshState().sim, s.sim);
      /* 이전 저장에 없는 도시 칸(주민 하트 등)을 채웁니다 */
      Object.keys(state.cities).forEach(id => {
        const old = state.cities[id], built = {};
        /* 이전 저장: 좌표 키('x,y') 건물과 고정 생산 시설을 id 건물로 바꿉니다. id가 그대로라 레벨·쌓인 골드가 이어집니다. */
        if (old.seq == null) {
          if (id === state.home) { built.bakery = { type: 'bakery', x: 5, y: 4 }; built.flower = { type: 'flower', x: 3, y: 4 }; }
          else built.starter = { type: starterType(id), x: 5, y: 4 };
          Object.entries(old.built || {}).forEach(([k, b]) => { const [x, y] = k.split(',').map(Number); built[k] = { type: b.type, x, y }; });
          old.built = built;
        }
        /* 이전 저장: 고정이던 기본 나무·풀을 같은 자리의 장식으로 바꿉니다(이미 무언가 있는 칸은 건너뜀) */
        if (!old.natural) {
          old.decor = old.decor || [];
          naturalDecor().forEach(d => {
            const taken = old.decor.some(o => o.x === d.x && o.y === d.y) || Object.values(old.built || {}).some(b => b.x === d.x && b.y === d.y);
            if (!taken) old.decor.push(d);
          });
          old.natural = true;
        }
        if (Array.isArray(old.extra)) old.extra = Object.fromEntries(old.extra.map(k => [k, 'g']));   // 이전 저장: 넓힌 땅은 잔디
        state.cities[id] = Object.assign(newCity(id, false), { stock: {}, built: {} }, old);
      });
      if (!state.cities[state.cur]) state.cur = state.home;
    }
  } catch (e) { /* 손상된 저장은 버림 */ }
}
function resetState() { state = freshState(); save(); emit('reset'); }

/* ---- 도시의 건물과 생산 시설 ---- */
function cityFixed(id = state.cur) { return id === state.home ? HOME_FIXED : CITY_FIXED; }
function producers(id = state.cur) {
  const city = state.cities[id]; if (!city) return [];
  return Object.entries(city.built).filter(([, b]) => FAC[b.type].rate).map(([bid, b]) => ({ id: bid, type: b.type, x: b.x, y: b.y }));
}
function buildingAt(x, y, id = state.cur) { return Object.entries(state.cities[id].built).find(([, b]) => b.x === x && b.y === y) || null; }
/* 돌아다니는 주민. 본거지는 2명, 다른 도시는 1명에 생산 시설마다 1명씩 늘어납니다. 모두 쓰다듬을 수 있습니다(GAM-032). */
const RESIDENT_KINDS = ['dog', 'duck', 'cat'];
function residentIds(id = state.cur) {
  if (!state.cities[id]) return [];
  const n = Math.min(CFG.RESIDENTS_MAX, (id === state.home ? 2 : 1) + producers(id).length);
  return Array.from({ length: n }, (_, i) => 'r' + i);
}
const residentKind = rid => RESIDENT_KINDS[+rid.slice(1) % RESIDENT_KINDS.length];
function petState(rid, id = state.cur) { const c = state.cities[id], pets = c.pets || (c.pets = {}); return pets[rid] || (pets[rid] = { n: CFG.PET.max, acc: 0 }); }
function hasProducer(type, id = state.cur) { return producers(id).some(p => p.type === type); }

function typeAt(x, y) {
  const b = buildingAt(x, y);
  if (b) return b[1].type;
  const f = cityFixed().find(o => o.x === x && o.y === y);
  return f ? f.type : null;
}
function isNear(x, y, type) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => typeAt(x + dx, y + dy) === type);
}
/* 조합이 맞은 시설 좌표 목록 */
function comboSites(type) {
  const c = FAC[type].combo; if (!c) return [];
  return Object.values(C().built).filter(b => b.type === type).map(b => [b.x, b.y]).filter(([x, y]) => isNear(x, y, c.near));
}
/* 건물·장식을 놓을 수 있는 빈 땅인가: 잔디·광장·모래이고, 건물·장식·나무·정비소 주민 자리가 아님 */
function canBuildAt(x, y) {
  if (!(TILE_TYPES[tileAt(x, y)] || {}).build || typeAt(x, y)) return false;
  if (C().decor.some(d => d.x === x && d.y === y)) return false;
  if (atHome() && Math.floor(CAT_POS.x) === x && Math.floor(CAT_POS.y) === y) return false;
  return true;
}
/* ---- 땅 넓히기: 땅과 맞닿은 바다 칸을 골드로 사고 땅 종류를 고릅니다. 다리 자리는 사지 않습니다 ----
   둘레: 원래 섬 10×10 안의 바다 = 0, 바깥 첫 줄 = 1, 둘째 줄 = 2. 같은 둘레는 같은 값, 바깥 둘레일수록 비쌈 */
const tileRing = (x, y) => Math.max(0, -x, -y, x - 9, y - 9);
const isBridge = (x, y) => y === 5 && (x < 0 || x > 9);
function tilePrice(x, y) { return CFG.TILE.prices[tileRing(x, y)]; }
function inLandLimit(x, y) { return tileRing(x, y) <= CFG.TILE.maxRing && x >= GRID.min && y >= GRID.min && x <= GRID.max && y <= GRID.max; }
function canBuyTile(x, y) {
  if (!inLandLimit(x, y) || isLand(x, y) || isBridge(x, y)) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isLand(x + dx, y + dy));
}
/* 땅 종류 바꾸기와 없애기. 위에 아무것도 없는 칸만 됩니다. 바꾸기는 무료, 없애기는 산 땅만이며 골드를 돌려주지 않습니다 */
const baseTile = (x, y) => BASE_MAP[y]?.[x] || '.';
function tileEmpty(x, y) {
  if (typeAt(x, y) || C().decor.some(d => d.x === x && d.y === y)) return false;
  return !(atHome() && Math.floor(CAT_POS.x) === x && Math.floor(CAT_POS.y) === y);
}
function canPaintTile(x, y, type) { const cur = tileAt(x, y); return !!TILE_TYPES[type] && !!TILE_TYPES[cur] && cur !== type && tileEmpty(x, y); }
function paintTile(x, y, type) {
  if (state.gear !== 'P' || !canPaintTile(x, y, type)) return false;
  const key = x + ',' + y;
  if (baseTile(x, y) === type) delete C().extra[key]; else C().extra[key] = type;   // 원래 종류로 돌아가면 기록을 지움
  save(); emit('change');
  return true;
}
function canRemoveTile(x, y) { return baseTile(x, y) === '.' && isLand(x, y) && tileEmpty(x, y); }
function removeTile(x, y) {
  if (state.gear !== 'P' || !canRemoveTile(x, y)) return false;
  delete C().extra[x + ',' + y];
  save(); emit('change');
  return true;
}
/* 넓힌 칸 수와 최대로 넓힐 수 있는 칸 수 */
function landStats() {
  let max = 0;
  for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++)
    if (inLandLimit(x, y) && !isBridge(x, y) && (BASE_MAP[y]?.[x] || '.') === '.') max++;
  return { bought: Object.keys(C().extra).filter(k => { const [x, y] = k.split(',').map(Number); return baseTile(x, y) === '.'; }).length, max };
}
function buyTile(x, y, type = 'g') {
  if (state.gear !== 'P' || !canBuyTile(x, y) || !TILE_TYPES[type]) return false;
  const price = tilePrice(x, y); if (state.gold < price) return false;
  state.gold -= price; C().extra[x + ',' + y] = type;
  save(); emit('change');
  return true;
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
/* 기록형 정비(GAM-007). 퀘스트가 열린 주기에 한 번만 자재를 줍니다(D-004). */
function recordOil(day, odo) {
  if (state.gear !== 'P') return 0;
  const o = state.oil;
  o.lastDay = day; o.lastOdo = odo;
  o.dueOdo = odo + CFG.OIL.km; o.dueDay = day + CFG.OIL.days;
  const wasQuest = o.quest; o.quest = false;
  if (wasQuest) state.mat += CFG.OIL.mat;
  save(); emit('change');
  return wasQuest ? CFG.OIL.mat : 0;
}

/* ---- 시간 ---- */
function syncWeek() {
  const w = weekOf(dayOf(state.clock));
  if (state.week !== w) { state.week = w; state.weekKm = 0; }
}
function advance(mins) {
  if (mins <= 0) return;
  const d0 = dayOf(state.clock);
  state.clock += mins;
  advanceProduction(mins * 60);
  Object.keys(state.cities).forEach(id => residentIds(id).forEach(rid => {
    const p = petState(rid, id);
    if (p.n >= CFG.PET.max) { p.acc = 0; return; }
    p.acc += mins;
    while (p.acc >= CFG.PET.cooldown && p.n < CFG.PET.max) { p.n++; p.acc -= CFG.PET.cooldown; }
    if (p.n >= CFG.PET.max) p.acc = 0;
  }));
  if (state.gear === 'P' && state.rest && state.rest.state === 'active') {
    state.rest.acc += mins;
    if (state.rest.acc >= CFG.REST.rest) { state.rest.state = 'done'; state.mat += CFG.REST.mat; emit('restDone'); }
  }
  if (dayOf(state.clock) !== d0) {
    state.daily = { time: 0, accel: 0, brake: 0, turn: 0, done: {} };
    state.rest = null;               // 전날 돌발 퀘스트는 보상 없이 끝남
    syncWeek();
    emit('newDay');
  }
  checkOil(); save(); emit('change');
}
function jumpTo(target) {
  const now = state.clock % 1440;
  if (target === 'next') { advance(1440 - now + 8.5 * 60); return; }
  let diff = target * 60 - now; if (diff <= 0) diff += 1440;
  advance(diff);
}

/* ---- 운행 ---- */
/* GAM-001 제안: 주간 거리 자재 M(d) = min(d, A) + ⌊max(0, min(d, 2A) − A) ÷ 2⌋ */
function weekMat(d) {
  const A = CFG.WEEK_KM_A; d = Math.floor(d);
  return (Math.min(d, A) + Math.floor(Math.max(0, Math.min(d, 2 * A) - A) / 2)) * CFG.MAT_PER_KM;
}
function weekTier(d) { const A = CFG.WEEK_KM_A; return d < A ? '1배' : d < 2 * A ? '0.5배' : '가득 참'; }
function startTrip() {
  if (state.gear === 'D') return;
  state.gear = 'D';
  state.tripRestVoiced = false;
  save(); emit('gear'); emit('change');
  checkRestTrigger();
}
/* 주행 중 연속 운전 시간이 기준을 넘으면 돌발 퀘스트 (GAM-030) */
function checkRestTrigger() {
  if (state.gear !== 'D' || state.tripRestVoiced) return;
  if (state.sim.min >= CFG.REST.drive && !state.rest) {          // 하루 한 번만 (GAM-Q26 가정)
    state.tripRestVoiced = true;
    state.rest = { state: 'active', acc: 0 };
    save(); emit('restVoice'); emit('change');
  }
}
/* 시뮬레이터: 운행 중 위치가 어느 도시 권역에서 관측됨 (FusedLocation 대체). 주행 중에는 알리지 않습니다. */
function observeLocation(id) {
  if (!CITY_BY_ID[id] || state.sim.seen.includes(id)) return;
  state.sim.seen.push(id); save(); emit('change');
}
/* 주차: 이번 운행을 판정하고 택배를 만든다 (GAM-UC-001 B3) */
function endTrip() {
  if (state.gear !== 'D') { state.gear = 'P'; save(); emit('gear'); emit('change'); return; }
  const s = state.sim, day = dayOf(state.clock);
  state.gear = 'P';
  state.cur = state.home;                                       // 차는 본거지 정류장으로 돌아옵니다
  /* 발자국: 표시만 하고 재화·가격에 쓰지 않습니다 (D-004) */
  if (state.footprintOn) s.seen.forEach(id => { if (state.footprints[id] == null) { state.footprints[id] = day; state.footNew.push(id); } });
  s.seen = [];
  if (s.km > 0) {
    syncWeek();
    const odo0 = state.odo;
    state.odo += s.km;
    const before = state.weekKm;
    state.weekKm += Math.floor(s.km);
    const matKm = weekMat(state.weekKm) - weekMat(before);
    const d = state.daily;
    const allDoneBefore = DAILY_ITEMS.every(it => d.done[it.id]);
    d.time += s.min; d.accel += s.accel; d.brake += s.brake; d.turn += s.turn;
    const short = s.min < CFG.DAILY.minJudge;
    let matSafety = 0;
    const items = DAILY_ITEMS.map(it => {
      let status, value = d[it.id];
      if (d.done[it.id]) status = 'kept';                         // 이미 달성, 다시 보상하지 않음
      else if (short && (it.id === 'accel' || it.id === 'brake')) status = 'skip';
      else {
        const c = CFG.DAILY[it.id];
        const ok = c.min != null ? value >= c.min : value <= c.max;
        status = ok ? 'ok' : 'no';
        if (ok) { d.done[it.id] = true; matSafety += CFG.DAILY_MAT; }
      }
      return { id: it.id, status, value };
    });
    const prev = state.delivery;
    /* 아직 받지 않은 택배에 담긴 보상은 '달성'으로 남긴다 */
    if (prev) items.forEach(it => { const p = prev.items.find(q => q.id === it.id); if (p && p.status === 'ok') it.status = 'ok'; });
    const sumKm = s.km + (prev ? prev.km : 0), mk = matKm + (prev ? prev.matKm : 0), ms = matSafety + (prev ? prev.matSafety : 0);
    state.delivery = {
      km: sumKm, matKm: mk, matSafety: ms, mat: mk + ms,
      odo0: prev ? prev.odo0 : odo0, odo1: state.odo,
      weekKm: state.weekKm, tier: weekTier(state.weekKm),
      reduced: mk < sumKm * CFG.MAT_PER_KM,
      allDoneBefore, items,
    };
  }
  checkOil(); save(); emit('gear'); emit('change');
}
function claimDelivery() {
  const d = state.delivery; if (!d || state.gear !== 'P') return null;
  state.deliveries++;
  state.mat += d.mat; state.delivery = null;
  save(); emit('change');
  return d;
}

/* ---- 건설·수확·쓰다듬기·상점 (지금 보고 있는 도시) ---- */
/* 생산 시설은 자재, 도시마다 종류별 하나. 장식 건물(공원·무대)은 골드, 개수 제한 없음. 빈 땅 어디에나 짓습니다. */
function buildCost(type) { return { mat: FAC[type].cost || 0, gold: FAC[type].gold || 0 }; }
function build(type, x, y) {
  if (state.gear !== 'P' || !BUILDABLE.includes(type) || !canBuildAt(x, y)) return false;
  if (FAC[type].rate && hasProducer(type)) return false;
  const cost = buildCost(type), city = C();
  if (state.mat < cost.mat || state.gold < cost.gold) return false;
  state.mat -= cost.mat; state.gold -= cost.gold;
  const id = 'b' + (++city.seq);
  city.built[id] = { type, x, y };
  if (FAC[type].rate) city.stock[id] = 0;
  save(); emit('change');
  return id;
}
/* 건물 옮기기: 고정 건물(등대·상점·정류장·정비소)은 옮기지 않습니다 */
function moveBuilding(id, x, y) {
  const b = C().built[id];
  if (state.gear !== 'P' || !b || !canBuildAt(x, y)) return false;
  b.x = x; b.y = y;
  save(); emit('change');
  return true;
}
function collect(id) {
  if (state.gear !== 'P' || !producers().some(p => p.id === id)) return 0;
  const city = C(), n = Math.floor(city.stock[id] || 0);
  if (n <= 0) return 0;
  city.stock[id] -= n; state.gold += n;
  save(); emit('change');
  return n;
}
function pet(id) {
  if (state.gear !== 'P' || !residentIds().includes(id)) return false;
  const p = petState(id);
  if (p.n <= 0) return false;
  p.n--; save(); emit('change');
  return true;
}
/* 같은 종류를 살 때마다 값이 오릅니다. 기본으로 깔린 나무·풀은 산 것으로 세지 않습니다 */
function decorPrice(type) { return Math.round(DECOR[type].price * 1.25 ** (state.bought[type] || 0)); }
function buyDecor(type) {
  if (state.gear !== 'P' || !DECOR[type]) return false;
  const price = decorPrice(type);
  if (state.gold < price) return false;
  state.gold -= price;
  state.bought[type] = (state.bought[type] || 0) + 1;
  state.inv[type] = (state.inv[type] || 0) + 1;
  save(); emit('change');
  return true;
}
function placeDecor(type, x, y) {
  if (state.gear !== 'P' || !canBuildAt(x, y)) return false;
  if (!state.inv[type]) return false;
  state.inv[type]--;
  C().decor.push({ type, x, y });
  save(); emit('change');
  return true;
}
/* 놓인 장식 옮기기 */
function moveDecor(fx, fy, x, y) {
  const d = C().decor.find(o => o.x === fx && o.y === fy);
  if (state.gear !== 'P' || !d || !canBuildAt(x, y)) return false;
  d.x = x; d.y = y;
  save(); emit('change');
  return true;
}
function pickupDecor(x, y) {
  if (state.gear !== 'P') return null;
  const decor = C().decor, i = decor.findIndex(d => d.x === x && d.y === y);
  if (i < 0) return null;
  const [d] = decor.splice(i, 1);
  state.inv[d.type] = (state.inv[d.type] || 0) + 1;
  save(); emit('change');
  return d.type;
}
function setWarn(kind, onOff) { state.warn[kind] = onOff; save(); emit('warn'); emit('change'); }

function questBadge() {
  let n = DAILY_ITEMS.filter(it => !state.daily.done[it.id]).length;
  if (state.oil.quest) n++;
  if (state.rest && state.rest.state === 'active') n++;
  return n;
}
