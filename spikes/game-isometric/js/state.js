'use strict';
/* 게임 상태와 규칙.
   CFG의 숫자는 모두 목업용 가정값입니다. 팀이 정하지 않은 값이며 README의 "가정값" 표와 같습니다. */
const CFG = {
  MAT_PER_KM: 1,            // GAM-001 메모: 1km당 자재 수 (미정)
  MAT_DAILY_CAP: 40,        // GAM-Q27: 운행 자재 하루 상한 (미정)
  DAILY_GOLD: 30,           // GAM-Q21: 일일 항목 보상 (미정)
  DAILY: {                  // GAM-Q21~Q24: 판정 기준 (미정)
    time: { min: 20 },      // 오늘 누적 운전 시간(분) 이상
    accel: { max: 2 },      // 오늘 누적 급가속·급감속 횟수 이하
    brake: { max: 1 },      // 오늘 누적 급제동 횟수 이하
    turn: { min: 3 },       // 오늘 누적 방향 지시등 사용 횟수 이상
    minJudge: 5,            // 이보다 짧은 운행은 횟수 항목 판정에서 뺌(분)
  },
  REST: { drive: 120, rest: 15, gold: 50 },   // GAM-Q26: 연속 운전 기준·휴식 인정 시간(분) (미정)
  OIL: { km: 10000, days: 365, gold: 100 },   // GAM-Q5: 주기 예시 데이터 (출처 미정)
  PET: { max: 3, cooldown: 240 },             // GAM-032: 쿨타임(분) (미정)
  STOCK_HOURS: 60,                            // GAM-031: 약 2.5일치까지 쌓임
  STOCK_SHOW: 8,                              // 이만큼 쌓이면 완성품 표시
};

/* 시설. rate는 1시간당 골드(목업용 가정값). */
const FAC = {
  stop: { name: '정류장' },
  bakery: { name: '빵집', rate: 3, icon: 'bread' },
  flower: { name: '꽃집', rate: 2, icon: 'coin' },
  shop: { name: '상점' },
  garage: { name: '정비소' },
  lighthouse: { name: '등대' },
  market: { name: '시장', cost: 8, rate: 4, icon: 'coin', combo: { near: 'stop', name: '야시장', icon: 'lantern' }, hint: '정류장 옆 · 야시장' },
  park: { name: '공원', cost: 6, hint: '무대 옆 · 야외 공연' },
  stage: { name: '무대', cost: 10, combo: { near: 'park', name: '야외 공연', icon: 'note' }, hint: '공원 옆 · 야외 공연' },
  cafe: { name: '카페', cost: 12, rate: 5, icon: 'cup' },
};
const BUILDABLE = ['market', 'park', 'stage', 'cafe'];

const DECOR = {
  flowerbed: { name: '꽃밭', price: 30 },
  bench: { name: '벤치', price: 40 },
  lamp: { name: '가로등', price: 60 },
  fountain: { name: '분수', price: 150 },
};

const DAILY_ITEMS = [
  { id: 'time', name: '운전 시간', icon: 'clock', unit: '분' },
  { id: 'accel', name: '급가속·급감속', icon: 'gauge', unit: '회' },
  { id: 'brake', name: '급제동', icon: 'brake', unit: '회' },
  { id: 'turn', name: '방향 지시등', icon: 'turn', unit: '회' },
];

const START_CLOCK = 14 * 60 + 32;        // 2026-11-14 14:32 (SCREENS.md 6절)
const SAVE_KEY = 'gam-mockup-v1';

const pad2 = n => String(n).padStart(2, '0');
const dayOf = clock => Math.floor(clock / 1440);
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

function freshState() {
  return {
    v: 1,
    gear: 'P',
    clock: START_CLOCK,
    mat: 3, gold: 140,
    odo: 34512,
    matToday: 0,
    sim: { km: 11, min: 24, accel: 0, brake: 0, turn: 6 },
    built: {},                       // 'x,y' → { type }
    stock: { bakery: 22, flower: 12 },
    decor: [],                       // { type, x, y }
    inv: {},                         // 보관함: type → 개수
    pets: { dog: { n: 3, acc: 0 }, duck: { n: 2, acc: 0 } },
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

/* ---- 이벤트 ---- */
const _subs = {};
function on(evt, fn) { (_subs[evt] = _subs[evt] || []).push(fn); }
function emit(evt, data) { (_subs[evt] || []).forEach(fn => fn(data)); }

/* ---- 저장 (GAM-N04) ---- */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경에서는 건너뜀 */ } }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && s.v === 1) state = Object.assign(freshState(), s);
  } catch (e) { /* 손상된 저장은 버림 */ }
}
function resetState() { state = freshState(); save(); emit('reset'); }

/* ---- 시설·생산 ---- */
function producers() {
  const list = [{ id: 'bakery', type: 'bakery', x: 5, y: 4 }, { id: 'flower', type: 'flower', x: 3, y: 4 }];
  Object.keys(state.built).forEach(k => {
    const t = state.built[k].type;
    if (FAC[t].rate) { const [x, y] = k.split(',').map(Number); list.push({ id: k, type: t, x, y }); }
  });
  return list;
}
const stockCap = type => FAC[type].rate * CFG.STOCK_HOURS;

function typeAt(x, y) {
  const b = state.built[x + ',' + y];
  if (b) return b.type;
  const f = FIXED.find(o => o.x === x && o.y === y);
  return f ? f.type : null;
}
function isNear(x, y, type) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => typeAt(x + dx, y + dy) === type);
}
/* 조합이 맞은 시설 좌표 목록 */
function comboSites(type) {
  const c = FAC[type].combo; if (!c) return [];
  return Object.keys(state.built).filter(k => state.built[k].type === type)
    .map(k => k.split(',').map(Number)).filter(([x, y]) => isNear(x, y, c.near));
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
function recordOil(day, odo) {
  const o = state.oil;
  o.lastDay = day; o.lastOdo = odo;
  o.dueOdo = odo + CFG.OIL.km; o.dueDay = day + CFG.OIL.days;
  const wasQuest = o.quest; o.quest = false;
  if (wasQuest) state.gold += CFG.OIL.gold;
  save(); emit('change');
  return wasQuest ? CFG.OIL.gold : 0;
}

/* ---- 시간 ---- */
function advance(mins) {
  if (mins <= 0) return;
  const d0 = dayOf(state.clock);
  state.clock += mins;
  producers().forEach(p => {
    state.stock[p.id] = Math.min(stockCap(p.type), (state.stock[p.id] || 0) + FAC[p.type].rate * mins / 60);
  });
  Object.values(state.pets).forEach(p => {
    if (p.n >= CFG.PET.max) { p.acc = 0; return; }
    p.acc += mins;
    while (p.acc >= CFG.PET.cooldown && p.n < CFG.PET.max) { p.n++; p.acc -= CFG.PET.cooldown; }
    if (p.n >= CFG.PET.max) p.acc = 0;
  });
  if (state.gear === 'P' && state.rest && state.rest.state === 'active') {
    state.rest.acc += mins;
    if (state.rest.acc >= CFG.REST.rest) { state.rest.state = 'done'; state.gold += CFG.REST.gold; emit('restDone'); }
  }
  if (dayOf(state.clock) !== d0) {
    state.daily = { time: 0, accel: 0, brake: 0, turn: 0, done: {} };
    state.matToday = 0;
    state.rest = null;               // 전날 돌발 퀘스트는 보상 없이 끝남
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
function startTrip() {
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
/* 주차: 이번 운행을 판정하고 택배를 만든다 (GAM-UC-001 B3) */
function endTrip() {
  const s = state.sim;
  state.gear = 'P';
  if (s.km > 0) {
    const odo0 = state.odo;
    state.odo += s.km;
    const mat = Math.max(0, Math.min(s.km * CFG.MAT_PER_KM, CFG.MAT_DAILY_CAP - state.matToday));
    state.matToday += mat;
    const d = state.daily;
    const allDoneBefore = DAILY_ITEMS.every(it => d.done[it.id]);
    d.time += s.min; d.accel += s.accel; d.brake += s.brake; d.turn += s.turn;
    const short = s.min < CFG.DAILY.minJudge;
    let gold = 0;
    const items = DAILY_ITEMS.map(it => {
      let status, value = d[it.id];
      if (d.done[it.id]) status = 'kept';                         // 이미 달성, 다시 보상하지 않음
      else if (short && (it.id === 'accel' || it.id === 'brake')) status = 'skip';
      else {
        const c = CFG.DAILY[it.id];
        const ok = c.min != null ? value >= c.min : value <= c.max;
        status = ok ? 'ok' : 'no';
        if (ok) { d.done[it.id] = true; gold += CFG.DAILY_GOLD; }
      }
      return { id: it.id, status, value };
    });
    const prev = state.delivery;
    /* 아직 받지 않은 택배에 담긴 보상은 '달성'으로 남긴다 */
    if (prev) items.forEach(it => { const p = prev.items.find(q => q.id === it.id); if (p && p.status === 'ok') it.status = 'ok'; });
    state.delivery = {
      km: s.km + (prev ? prev.km : 0),
      mat: mat + (prev ? prev.mat : 0),
      gold: gold + (prev ? prev.gold : 0),
      odo0: prev ? prev.odo0 : odo0, odo1: state.odo,
      capped: mat < s.km * CFG.MAT_PER_KM,
      allDoneBefore, items,
    };
  }
  checkOil(); save(); emit('gear'); emit('change');
}
function claimDelivery() {
  const d = state.delivery; if (!d) return null;
  state.mat += d.mat; state.gold += d.gold; state.delivery = null;
  save(); emit('change');
  return d;
}

/* ---- 건설·수확·쓰다듬기·상점 ---- */
function build(type, x, y) {
  const cost = FAC[type].cost;
  if (state.mat < cost || state.built[x + ',' + y]) return false;
  state.mat -= cost;
  state.built[x + ',' + y] = { type };
  if (FAC[type].rate) state.stock[x + ',' + y] = 0;
  save(); emit('change');
  return true;
}
function collect(id) {
  const n = Math.floor(state.stock[id] || 0);
  if (n <= 0) return 0;
  state.stock[id] -= n; state.gold += n;
  save(); emit('change');
  return n;
}
function pet(id) {
  const p = state.pets[id];
  if (!p || p.n <= 0) return false;
  p.n--; save(); emit('change');
  return true;
}
function buyDecor(type) {
  const price = DECOR[type].price;
  if (state.gold < price) return false;
  state.gold -= price;
  state.inv[type] = (state.inv[type] || 0) + 1;
  save(); emit('change');
  return true;
}
function placeDecor(type, x, y) {
  if (!state.inv[type]) return false;
  state.inv[type]--;
  state.decor.push({ type, x, y });
  save(); emit('change');
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
  return n;
}
