// 실사용 지표가 아닌 규칙 계산입니다. 수치는 모두 목업 가정값입니다(GAM-Q36).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ Date, localStorage: { getItem() {}, setItem() {} }, canDecor: () => true });
for (const file of ['cities.js', 'state.js', 'economy.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
const result = vm.runInContext(`
  const p = { id: 'bakery', type: 'bakery' }, lv = state.cities[state.home].levels;
  const sumGold = (from, to) => { let s = 0; for (let L = from; L < to; L++) { lv.bakery = L; s += upgradeCost(p).gold; } return s; };
  const bakery = {
    ratePerSec: { 'Lv.1': ratePerSec('bakery', 1), 'Lv.10': ratePerSec('bakery', 10), 'Lv.11': ratePerSec('bakery', 11), 'Lv.20': ratePerSec('bakery', 20), 'Lv.21': ratePerSec('bakery', 21), 'Lv.30': ratePerSec('bakery', 30) },
    goldToReach: { 'Lv.10': sumGold(1, 10), 'Lv.20': sumGold(10, 20), 'Lv.30': sumGold(20, 30) },
    breakMaterials: BREAK_MAT,
  };
  const cityPrices = [2, 3, 5, 10, 20, 30, 50].map(n => ({ nthCity: n, materials: openPrice(n - 1) }));
  let total = 0; const cumulative = [5, 10, 20, 30].map(n => { total = 0; for (let k = 1; k < n; k++) total += openPrice(k); return { cities: n, materials: total }; });
  // 평균 운전자 가정: 주 216km(비사업용 일평균 30.8km × 7, GAM-001 메모), 안전운전 일일 항목 절반 달성
  const weekly = weekMat(216) + Math.round(CFG.DAILY_MAT * 4 * 7 * .5);
  const weeksTo = cumulative.map(c => ({ cities: c.cities, weeks: +(c.materials / weekly).toFixed(1) }));
  JSON.stringify({ bakery, cityPrices, cumulative, weeklyMaterialsAssumed: weekly, weeksToOpenCitiesOnly: weeksTo }, null, 2);
`, context);
console.log(result);
