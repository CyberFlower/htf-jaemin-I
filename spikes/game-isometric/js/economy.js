'use strict';
/* 전국 지도·도시 열기·시설 업그레이드·단계 돌파·도시 등급 (GAM-034~038, GAM-040, D-003·D-004).
   자재는 차에서만 생기고(운행 거리·안전운전·돌발 퀘스트), 골드는 시설 생산으로만 생깁니다.
   모든 수치는 팀이 정하지 않은 목업 가정값입니다(GAM-Q36). */
const FAC_ECON = {                     // rate: Lv.1의 초당 골드, cost: Lv.1→2 골드
  bakery: { rate: 1, cost: 600 },
  flower: { rate: .8, cost: 500 },
  market: { rate: 1.5, cost: 900 },
  cafe: { rate: 2, cost: 1100 },
  local: { rate: 1.2, cost: 700 },
};
const MAX_LEVEL = 30;
const BREAK_MAT = { 10: 15, 20: 40 };  // 이 레벨에서 다음 레벨로 갈 때 자재가 필요(단계 돌파, GAM-037)
const STAGE_MULT = [1, 2, 4];          // 단계별 수익 배율
const COST_GROWTH = 1.35;              // 레벨마다 비용 증가. 골드는 흔하고, 단계 돌파의 자재가 막는 구조(D-003)
const CITY_PRICE = { base: 30, growth: 1.18 };   // 보유 도시가 늘수록 오르는 여는 가격(자재, GAM-035)
/* 등급 이름에 행정 구역 이름을 쓰지 않습니다(D-004). min: 그 도시 생산 시설 레벨의 합 */
const GRADES = [
  { min: 0, name: '새싹' }, { min: 8, name: '풀잎' }, { min: 20, name: '꽃길' },
  { min: 40, name: '햇살' }, { min: 70, name: '별빛' }, { min: 110, name: '무지개' },
];

const stageOf = level => level > 20 ? 3 : level > 10 ? 2 : 1;
function facLevel(id, cityId = state.cur) { return state.cities[cityId].levels[id] || 1; }
function ratePerSec(type, level) { return FAC_ECON[type].rate * level * STAGE_MULT[stageOf(level) - 1]; }
function stockCap(type, level) { return Math.floor(ratePerSec(type, level) * CFG.STOCK_HOURS * 3600); }
function capOf(p, cityId = state.cur) { return stockCap(p.type, facLevel(p.id, cityId)); }
function rateOf(p, cityId = state.cur) { return ratePerSec(p.type, facLevel(p.id, cityId)); }
const ownedIds = () => Object.keys(state.cities);
function cityRate(id) { return producers(id).reduce((s, p) => s + rateOf(p, id), 0); }
function totalRate() { return ownedIds().reduce((s, id) => s + cityRate(id), 0); }
function cityStored(id) { return producers(id).reduce((s, p) => s + Math.floor(state.cities[id].stock[p.id] || 0), 0); }
function totalStored() { return ownedIds().reduce((s, id) => s + cityStored(id), 0); }
function cityFull(id) { return producers(id).some(p => (state.cities[id].stock[p.id] || 0) >= capOf(p, id)); }
function levelSum(id) { return producers(id).reduce((s, p) => s + facLevel(p.id, id), 0); }
function cityGrade(id) { const n = levelSum(id); let g = 0; GRADES.forEach((x, i) => { if (n >= x.min) g = i; }); return g; }

/* 실제 경과 시간만큼 모든 보유 도시가 생산합니다. 상한을 넘지 않습니다(GAM-031). */
function advanceProduction(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  ownedIds().forEach(id => {
    const city = state.cities[id];
    producers(id).forEach(p => {
      const cap = capOf(p, id), s = city.stock[p.id] || 0;
      if (s < cap) city.stock[p.id] = Math.min(cap, s + rateOf(p, id) * seconds);
    });
  });
}

function upgradeCost(p, cityId = state.cur) {
  const L = facLevel(p.id, cityId);
  return { gold: Math.ceil(FAC_ECON[p.type].cost * COST_GROWTH ** (L - 1)), mat: BREAK_MAT[L] || 0 };
}
const afford = cost => state.mat >= cost.mat && state.gold >= cost.gold;
/* 골드로 레벨을 올리고, 구간 레벨에서는 자재도 내야 돌파합니다. 골드로 자재를 대신하지 않습니다. */
function upgradeFacility(id) {
  const p = producers().find(q => q.id === id), city = C();
  if (state.gear !== 'P' || !p || facLevel(id) >= MAX_LEVEL) return false;
  const cost = upgradeCost(p); if (!afford(cost)) return false;
  state.mat -= cost.mat; state.gold -= cost.gold;
  city.levels[id] = facLevel(id) + 1;
  const g = cityGrade(state.cur);
  if (g > city.grade) { city.grade = g; emit('gradeUp', { city: state.cur, grade: g }); }
  save(); emit('change');
  return true;
}

function openPrice(owned = ownedIds().length) { return Math.ceil(CITY_PRICE.base * CITY_PRICE.growth ** (owned - 1)); }
function canOpen(id) { return !!CITY_BY_ID[id] && !state.cities[id] && state.homePicked; }
function openCity(id) {
  if (state.gear !== 'P' || !canOpen(id)) return false;
  const price = openPrice(); if (state.mat < price) return false;
  state.mat -= price;
  state.cities[id] = newCity(id, false);
  save(); emit('change'); emit('cityOpened', id);
  return true;
}
/* 본거지는 처음 실행할 때 고르고 값을 내지 않습니다(GAM-034 제안). */
function pickHome(id) {
  if (state.gear !== 'P' || state.homePicked || !CITY_BY_ID[id]) return false;
  const home = state.cities[state.home];
  delete state.cities[state.home];
  state.cities[id] = home; state.home = state.cur = id; state.homePicked = true;
  save(); emit('change'); emit('city');
  return true;
}
function enterCity(id) {
  if (state.gear !== 'P' || !state.cities[id]) return false;
  state.cur = id; save(); emit('city'); emit('change');
  return true;
}
function collectAll() {
  if (state.gear !== 'P') return 0;
  let gold = 0;
  ownedIds().forEach(id => {
    const city = state.cities[id];
    producers(id).forEach(p => { const n = Math.floor(city.stock[p.id] || 0); gold += n; city.stock[p.id] = (city.stock[p.id] || 0) - n; });
  });
  if (!gold) return 0;
  state.gold += gold; save(); emit('change');
  return gold;
}
function setFootprints(onOff) { state.footprintOn = !!onOff; save(); emit('change'); }
function clearFootprints() { state.footprints = {}; state.footNew = []; save(); emit('change'); }
function setUnknownVehicleState() { state.gear = 'U'; save(); emit('gear'); emit('change'); }

/* 자리를 비운 동안의 생산을 한 번만 반영하고 요약합니다(GAM-040). 요약만으로 골드를 주지 않습니다. */
function restoreEconomy() {
  const elapsed = Math.max(0, Date.now() - state.savedAt) / 60000;
  if (!Number.isFinite(elapsed) || elapsed <= 0) return;
  const before = totalStored();
  advance(elapsed);
  const earned = totalStored() - before;
  if (elapsed >= 1 && earned > 0) state.offlineSummary = { minutes: Math.floor(elapsed), gold: earned, full: ownedIds().filter(cityFull) };
  save();
}
