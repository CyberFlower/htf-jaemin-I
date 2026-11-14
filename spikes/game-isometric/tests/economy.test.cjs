const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function game(storage = new Map(), time = { now: 0 }, pick = true) {
  const clock = class extends Date { static now() { return time.now; } };
  const ctx = vm.createContext({ Date: clock, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) }, canDecor: () => true });
  for (const name of ['cities.js', 'state.js', 'economy.js', 'terrain.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name), 'utf8'), ctx);
  const g = { run: source => vm.runInContext(source, ctx), storage, time };
  if (pick) g.run('pickHome(DEFAULT_HOME)');
  return g;
}
const trip = (g, km, extra = '') => g.run(`state.sim.km=${km}; ${extra} startTrip(); endTrip(); claimDelivery();`);

test('도시 목록은 전국 161개 시·군(특·광역시는 하나)이다', () => {
  const g = game();
  assert.equal(g.run('CITIES.length'), 161);
  assert.equal(g.run('new Set(CITIES.map(c=>c.id)).size'), 161);
});
test('시설 생산·수령·복귀는 자재를 만들지 않고 골드만 만든다 (D-003, GAM-N07)', () => {
  const g = game();
  g.run('advance(60 * 72); collectAll();');
  assert.equal(g.run('state.mat'), 0);
  assert.ok(g.run('state.gold') > 300);
});
test('안전운전 일일 항목의 보상은 자재이고 택배는 골드를 주지 않는다 (D-003)', () => {
  const g = game();
  const gold = g.run('state.gold');
  trip(g, 11, 'state.sim.min=24; state.sim.turn=6;');
  // 거리 11 + 운전 시간·급가속·급제동·방향 지시등 4항목 × 7
  assert.equal(g.run('state.mat'), 11 + 4 * g.run('CFG.DAILY_MAT'));
  assert.equal(g.run('state.gold'), gold);
  trip(g, 5);
  assert.equal(g.run('state.mat'), 11 + 28 + 5);   // 같은 날 일일 항목은 다시 주지 않음
});
test('주간 거리 자재: A까지 1배, A~2A 0.5배, 2A 초과 0 (GAM-001 제안)', () => {
  const g = game();
  assert.equal(g.run('[weekMat(0), weekMat(200), weekMat(300), weekMat(400), weekMat(900)].join()'), '0,200,250,300,300');
  // 운행을 나눠도 구간 경계에서 잃거나 두 번 받지 않음
  const a = game(), b = game();
  a.run('state.daily.done={time:1,accel:1,brake:1,turn:1}'); b.run('state.daily.done={time:1,accel:1,brake:1,turn:1}');
  trip(a, 250);
  for (let i = 0; i < 5; i++) trip(b, 50);
  assert.equal(a.run('state.mat'), 225); assert.equal(b.run('state.mat'), 225);
});
test('월요일이 되면 주간 거리가 초기화된다', () => {
  const g = game();
  g.run('state.daily.done={time:1,accel:1,brake:1,turn:1}');
  trip(g, 400);
  assert.equal(g.run('state.weekKm'), 400);
  g.run("jumpTo('next'); jumpTo('next');");     // 토 → 일 → 월
  g.run('state.daily.done={time:1,accel:1,brake:1,turn:1}');
  trip(g, 10);
  assert.equal(g.run('state.weekKm'), 10);
  assert.equal(g.run('state.mat'), 300 + 10);
});
test('같은 택배는 한 번만 받고, 단순 P 신호로 운행을 만들지 않는다', () => {
  const g = game(); g.run('endTrip();');
  assert.equal(g.run('state.delivery'), null);
  g.run('startTrip(); endTrip();');
  const first = g.run('claimDelivery().mat');
  assert.equal(g.run('claimDelivery()'), null);
  assert.equal(g.run('state.mat'), first);
});
test('업그레이드는 골드만 쓰고, 구간 레벨의 돌파는 자재 없이는 할 수 없다 (GAM-036·037)', () => {
  const g = game(); g.run('state.gold=1e9; state.mat=0;');
  for (let i = 1; i < 10; i++) assert.equal(g.run('upgradeFacility("bakery")'), true);
  assert.equal(g.run('facLevel("bakery")'), 10);
  assert.equal(g.run('state.mat'), 0);
  const gold = g.run('state.gold');
  assert.equal(g.run('upgradeFacility("bakery")'), false);      // 골드가 많아도 자재가 없으면 돌파 불가
  assert.equal(g.run('state.gold'), gold);
  assert.equal(g.run('stageOf(facLevel("bakery"))'), 1);
  g.run('state.mat=15');
  assert.equal(g.run('upgradeFacility("bakery")'), true);
  assert.equal(g.run('stageOf(facLevel("bakery"))'), 2);
  assert.equal(g.run('state.mat'), 0);
  assert.ok(g.run('ratePerSec("bakery",11) > ratePerSec("bakery",10) * 2'));
});
test('업그레이드 비용은 레벨마다 오르고, 운행 거리와 무관하다', () => {
  const g = game();
  const costs = g.run('Array.from({length:29},(_,i)=>{state.cities[state.home].levels.bakery=i+1; return upgradeCost({id:"bakery",type:"bakery"}).gold;})');
  for (let i = 1; i < costs.length; i++) assert.ok(costs[i] > costs[i - 1]);
  const before = g.run('upgradeCost({id:"bakery",type:"bakery"}).gold');
  g.run('state.odo += 5000; state.weekKm = 900;');
  assert.equal(g.run('upgradeCost({id:"bakery",type:"bakery"}).gold'), before);
});
test('주행·주차 미확인 중에는 업그레이드·도시 열기·건설·수령을 하지 않는다', () => {
  for (const gear of ['D', 'U']) {
    const g = game(); g.run(`state.mat=1000; state.gold=1e9; state.gear='${gear}';`);
    for (const action of ['upgradeFacility("bakery")', 'openCity("gyeonggi:수원시")', 'build("market",7,4)', 'buyDecor("bench")', 'pet("r0")', 'enterCity(state.home)']) assert.equal(g.run(action), false);
    assert.equal(g.run('collectAll()'), 0);
    assert.equal(g.run('collect("bakery")'), 0);
    assert.equal(g.run('state.mat'), 1000);
  }
});
test('도시 열기: 자재로만 열고, 열수록 다음 가격이 오른다 (GAM-035)', () => {
  const g = game(); g.run('state.gold=1e9; state.mat=0;');
  const p1 = g.run('openPrice()');
  assert.equal(g.run('openCity("gyeonggi:수원시")'), false);    // 골드로 대신할 수 없음
  g.run(`state.mat=${p1}`);
  assert.equal(g.run('openCity("gyeonggi:수원시")'), true);
  assert.equal(g.run('state.mat'), 0);
  assert.ok(g.run('openPrice()') > p1);
  assert.equal(g.run('openCity("gyeonggi:수원시")'), false);    // 이미 연 도시
  assert.equal(g.run('ownedIds().length'), 2);
});
test('모든 보유 도시가 생산하고, 모두 거두기는 합계를 한 번에 준다 (GAM-040)', () => {
  const g = game(); g.run('state.mat=1000; openCity("gyeonggi:수원시"); collectAll();');
  const gold = g.run('state.gold');
  g.run('advance(60)');
  const stored = g.run('totalStored()');
  assert.ok(g.run('cityStored("gyeonggi:수원시")') > 0);
  assert.equal(g.run('collectAll()'), stored);
  assert.equal(g.run('state.gold'), gold + stored);
  assert.equal(g.run('totalStored()'), 0);
});
test('생산은 시간을 나눠 계산해도 같고 상한을 넘지 않는다', () => {
  const large = game(), small = game();
  large.run('advanceProduction(3599);');
  small.run('for(let i=0;i<3599;i++) advanceProduction(1);');
  assert.ok(Math.abs(large.run('C().stock.bakery') - small.run('C().stock.bakery')) < 1e-6);
  large.run('advanceProduction(1e9);');
  assert.equal(large.run('C().stock.bakery'), large.run('capOf({id:"bakery",type:"bakery"})'));
});
test('복귀 시간은 한 번만 반영하고 시계 역행으로 추가 생산하지 않는다', () => {
  const g = game(); g.run('collectAll(); save();'); g.time.now = 3600000;
  const restored = game(g.storage, g.time, false); restored.run('load(); restoreEconomy();');
  const once = restored.run('totalStored()');
  assert.ok(once > 0);
  assert.equal(restored.run('state.offlineSummary.minutes'), 60);
  assert.equal(restored.run('state.mat'), 0);
  restored.run('restoreEconomy();');
  assert.equal(restored.run('totalStored()'), once);
  restored.time.now = 1000; restored.run('restoreEconomy();');
  assert.equal(restored.run('totalStored()'), once);
});
test('발자국은 표시만: 재화·도시 가격에 영향이 없고, 끄면 기록하지 않는다 (D-004)', () => {
  const g = game();
  const price = g.run('openPrice()');
  g.run('state.daily.done={time:1,accel:1,brake:1,turn:1}; state.sim.km=0; startTrip(); observeLocation("gyeongbuk:경주시"); observeLocation("busan:부산"); endTrip();');
  assert.equal(g.run('Object.keys(state.footprints).length'), 2);
  assert.equal(g.run('state.mat'), 0);
  assert.equal(g.run('openPrice()'), price);
  const day = g.run('state.footprints["busan:부산"]');
  g.run("jumpTo('next'); startTrip(); observeLocation('busan:부산'); endTrip();");
  assert.equal(g.run('state.footprints["busan:부산"]'), day);       // 첫 관측 날짜는 바뀌지 않음
  g.run("setFootprints(false); startTrip(); observeLocation('jeju:제주시'); endTrip();");
  assert.equal(g.run('state.footprints["jeju:제주시"]'), undefined);
});
test('도시 등급은 시설 레벨의 합으로 오르고 내려가지 않는다 (GAM-038)', () => {
  const g = game(); g.run('state.gold=1e9;');
  assert.equal(g.run('cityGrade(state.home)'), 0);
  for (let i = 0; i < 6; i++) g.run('upgradeFacility("bakery")');
  assert.ok(g.run('cityGrade(state.home)') >= 1);
  assert.equal(g.run('GRADES.some(x => /읍|면|시$|군$|광역/.test(x.name))'), false);  // 행정 구역 이름을 쓰지 않음
});
test('생산 시설은 도시마다 종류별 하나이고, 거절되면 자재를 보존한다', () => {
  const g = game(); g.run('state.mat=100;');
  assert.ok(g.run('build("market",7,4)'));
  assert.equal(g.run('build("market",2,2)'), false);
  assert.equal(g.run('state.mat'), 92);
  g.run('openCity("gyeonggi:수원시"); enterCity("gyeonggi:수원시");');
  const t = g.run('starterType("gyeonggi:수원시")');
  if (t !== 'market') assert.ok(g.run('build("market",7,4)'));
});
test('기록형 정비는 퀘스트가 열린 주기에 한 번만 자재를 준다 (D-004)', () => {
  const g = game();
  g.run("setOilPreset('due');");
  assert.equal(g.run('recordOil(dayOf(state.clock), state.odo)'), g.run('CFG.OIL.mat'));
  assert.equal(g.run('recordOil(dayOf(state.clock), state.odo)'), 0);
  assert.equal(g.run('state.mat'), g.run('CFG.OIL.mat'));
});
test('본거지는 처음 한 번 무료로 고르고, 주차하면 차는 본거지로 돌아온다', () => {
  const g = game();
  assert.equal(g.run('pickHome("busan:부산")'), false);     // 이미 고름
  g.run('state.mat=1000; openCity("gyeonggi:수원시"); enterCity("gyeonggi:수원시"); startTrip(); endTrip();');
  assert.equal(g.run('state.cur'), g.run('state.home'));
});
test('특산 건물은 권역마다 이름이 다르고, 도시마다 하나만 짓는다', () => {
  const g = game(); g.run('state.mat=1000;');
  assert.equal(g.run('facName("local", "jeju:제주시")'), '감귤밭');
  assert.equal(g.run('facName("local", "gangwon:춘천시")'), '감자밭');
  assert.equal(g.run('new Set(REGIONS.map(r => r.local.name)).size'), g.run('REGIONS.length'));
  assert.ok(g.run('build("local",2,2)'));                  // 본거지(서울)에도 지을 수 있음
  assert.equal(g.run('facName("local")'), '분식 포차');
  assert.equal(g.run('build("local",6,2)'), false);
  g.run('openCity("jeju:제주시"); enterCity("jeju:제주시");');
  assert.equal(g.run('producers()[0].type'), 'local');              // 새 도시의 첫 시설은 그 권역의 특산 건물
  assert.equal(g.run('build("local",2,2)'), false);
});
test('주민은 도시마다 생산 시설 수만큼 늘고, 어느 도시의 주민이든 쓰다듬을 수 있다 (GAM-032)', () => {
  const g = game(); g.run('state.mat=1000;');
  assert.equal(g.run('residentIds().length'), 4);                   // 본거지: 기본 2 + 빵집·꽃집
  g.run('build("market",7,4)');
  assert.equal(g.run('residentIds().length'), 5);
  g.run('openCity("jeju:제주시"); enterCity("jeju:제주시");');
  assert.equal(g.run('residentIds().length'), 2);                   // 기본 1 + 특산 건물
  for (let i = 0; i < 3; i++) assert.equal(g.run('pet("r1")'), true);
  assert.equal(g.run('pet("r1")'), false);                          // 하트를 다 쓰면 충전을 기다림
  assert.equal(g.run('pet("r9")'), false);                          // 없는 주민
  g.run('advance(CFG.PET.cooldown)');
  assert.equal(g.run('pet("r1")'), true);
  assert.equal(g.run('state.mat + state.gold > 0'), true);
});
test('주민 하트 칸이 없는 이전 저장도 읽고 주민·생산이 계속 동작한다', () => {
  const g = game(); g.run('save();');
  const old = JSON.parse(g.storage.get('gam-mockup-v2'));
  Object.values(old.cities).forEach(c => { delete c.pets; });
  g.storage.set('gam-mockup-v2', JSON.stringify(old));
  const r = game(g.storage, g.time, false); r.run('load();');
  assert.equal(r.run('pet("r0")'), true);
  r.run('advance(60)');
  assert.ok(r.run('totalStored()') > 0);
});

test('장식 건물(공원·무대)은 골드로, 개수 제한 없이 빈 땅 어디에나 짓는다', () => {
  const g = game(); g.run('state.gold=100000; state.mat=0;');
  for (const [x, y] of [[2, 2], [6, 2], [4, 7]]) assert.ok(g.run(`build("park",${x},${y})`));
  assert.equal(g.run('state.gold'), 100000 - 800 * 3);
  assert.equal(g.run('state.mat'), 0);
  assert.equal(g.run('build("park",3,5)'), false);     // 도로
  assert.equal(g.run('build("park",2,1)'), false);     // 나무 자리
  assert.equal(g.run('build("park",8,4)'), false);     // 정류장
  assert.equal(g.run('build("park",2,2)'), false);     // 이미 지은 자리
  assert.equal(g.run('build("cafe",5,7)'), false);     // 생산 시설은 자재가 필요
});
test('건물을 옮기면 레벨과 쌓인 골드가 그대로 따라간다', () => {
  const g = game(); g.run('state.gold=1e6; upgradeFacility("bakery"); upgradeFacility("bakery"); C().stock.bakery = 500;');
  assert.equal(g.run('moveBuilding("bakery", 2, 2)'), true);
  assert.equal(g.run('JSON.stringify(producers().find(p=>p.id==="bakery"))'), JSON.stringify({ id: 'bakery', type: 'bakery', x: 2, y: 2 }));
  assert.equal(g.run('facLevel("bakery")'), 3);
  assert.equal(g.run('C().stock.bakery'), 500);
  assert.equal(g.run('moveBuilding("bakery", 3, 4)'), false);   // 꽃집 자리
  assert.equal(g.run('moveBuilding("bakery", 4, 5)'), false);   // 도로
  g.run("state.gear='D'");
  assert.equal(g.run('moveBuilding("bakery", 6, 2)'), false);
});
test('땅 넓히기: 맞닿은 바다 칸만 사고, 둘레마다 값이 오르며, 최대 둘레가 있다', () => {
  const g = game(); g.run('state.gold=1e7;');
  assert.equal(g.run('buyTile(0,0)'), false);                    // 땅과 맞닿지 않음
  assert.equal(g.run('buyTile(-1,5)'), false);                   // 다리 자리
  const inner = g.run('tilePrice(0,2)'), ring1 = g.run('tilePrice(-1,4)'), ring2 = g.run('tilePrice(-2,4)');
  assert.ok(inner < ring1 && ring1 < ring2);
  assert.equal(g.run('tilePrice(0,2)'), g.run('tilePrice(9,8)'));  // 같은 둘레는 같은 값
  assert.equal(g.run('buyTile(-1,4)'), true);
  assert.equal(g.run('isLand(-1,4) && canBuildAt(-1,4)'), true);
  assert.equal(g.run('state.gold'), 1e7 - ring1);
  assert.equal(g.run('tilePrice(-1,3)'), ring1);                 // 사도 같은 둘레 값은 그대로
  assert.equal(g.run('buyTile(-2,4)'), true);
  assert.equal(g.run('buyTile(-3,4)'), false);                   // 최대 둘레(2) 밖
  g.run('state.gold = 10;');
  assert.equal(g.run('buyTile(-1,3)'), false);
  assert.equal(g.run('state.gold'), 10);
  const st = g.run('JSON.stringify(landStats())');
  assert.equal(JSON.parse(st).bought, 2);
  assert.ok(JSON.parse(st).max > 100);
  g.run('state.gold=1e7; state.mat=1000; openCity("jeju:제주시"); enterCity("jeju:제주시");');
  assert.equal(g.run('isLand(-1,4)'), false);                    // 넓힌 땅은 도시마다 따로
});
test('땅 종류를 골라 깐다: 연못은 짓거나 놓을 수 없다', () => {
  const g = game(); g.run('state.gold=1e7;');
  assert.equal(g.run('buyTile(-1,4,"f")'), true);
  assert.equal(g.run('tileAt(-1,4)'), 'f');
  assert.equal(g.run('canBuildAt(-1,4)'), true);
  assert.equal(g.run('buyTile(-1,3,"w")'), true);
  assert.equal(g.run('tileAt(-1,3)'), 'w');
  assert.equal(g.run('canBuildAt(-1,3)'), false);
  assert.equal(g.run('buyTile(-1,6,"x")'), false);               // 없는 종류
});
test('상점에서 나무·풀 장식을 사서 놓는다', () => {
  const g = game(); g.run('state.gold=10000;');
  for (const t of ['tree_round', 'tree_pine', 'tree_palm', 'bush', 'grass']) assert.equal(g.run(`buyDecor("${t}")`), true);
  assert.equal(g.run('placeDecor("tree_pine", 2, 2)'), true);
  assert.equal(g.run('canBuildAt(2, 2)'), false);
});
test('좌표 키로 저장된 이전 건물도 id 건물로 바뀌고 레벨·쌓인 골드가 이어진다', () => {
  const g = game(); g.run('save();');
  const old = JSON.parse(g.storage.get('gam-mockup-v2')), home = old.cities[old.home];
  home.built = { '7,4': { type: 'market' } }; delete home.seq; home.extra = ['-1,4'];
  home.levels = { bakery: 3, '7,4': 2 }; home.stock = { bakery: 10, flower: 5, '7,4': 50 };
  g.storage.set('gam-mockup-v2', JSON.stringify(old));
  const r = game(g.storage, g.time, false); r.run('load();');
  assert.equal(r.run('producers().map(p=>p.id+"@"+p.x+","+p.y).join()'), 'bakery@5,4,flower@3,4,7,4@7,4');
  assert.equal(r.run('facLevel("7,4")'), 2);
  assert.equal(r.run('facLevel("bakery")'), 3);
  assert.equal(r.run('C().stock["7,4"]'), 50);
  assert.equal(r.run('tileAt(-1,4)'), 'g');                       // 이전 저장의 넓힌 땅은 잔디
});
test('땅 종류 바꾸기: 빈 땅만, 무료, 도로는 못 바꾼다', () => {
  const g = game(); g.run('state.gold=5000;');
  assert.equal(g.run('paintTile(2,7,"w")'), true);                // 원래 섬의 빈 땅
  assert.equal(g.run('tileAt(2,7)'), 'w');
  assert.equal(g.run('state.gold'), 5000);
  assert.equal(g.run('paintTile(2,7,"p")'), true);                // 원래 종류(돌길)로 되돌리면 기록을 지움
  assert.equal(g.run('"2,7" in C().extra'), false);
  assert.equal(g.run('paintTile(3,5,"g")'), false);               // 도로
  assert.equal(g.run('paintTile(5,4,"s")'), false);               // 빵집 자리
  assert.equal(g.run('paintTile(2,1,"s")'), false);               // 나무 자리
});
test('땅 없애기: 산 땅이고 위에 아무것도 없을 때만, 골드는 돌려주지 않는다', () => {
  const g = game(); g.run('state.gold=1e6; buyTile(-1,4,"g"); buyTile(-1,3,"s");');
  const gold = g.run('state.gold');
  assert.equal(g.run('removeTile(2,7)'), false);                  // 원래 섬
  g.run('state.inv.bench = 1; placeDecor("bench",-1,3);');
  assert.equal(g.run('removeTile(-1,3)'), false);                 // 위에 장식
  assert.equal(g.run('removeTile(-1,4)'), true);
  assert.equal(g.run('isLand(-1,4)'), false);
  assert.equal(g.run('state.gold'), gold);
  assert.equal(g.run('landStats().bought'), 1);
  g.run("state.gear='D'");
  assert.equal(g.run('paintTile(2,7,"s")'), false);
});
test('기본 나무·풀은 장식이라 옮기거나 보관함에 넣을 수 있고, 값 상승에 세지 않는다', () => {
  const g = game();
  assert.equal(g.run('C().decor.length'), g.run('TREES.length'));
  assert.equal(g.run('C().decor.find(d=>d.x===2&&d.y===1).type'), 'tree_round');
  assert.equal(g.run('decorPrice("tree_round")'), g.run('DECOR.tree_round.price'));
  assert.equal(g.run('moveDecor(2,1,2,2)'), true);
  assert.equal(g.run('canBuildAt(2,1)'), true);                   // 빈 자리가 생김
  assert.equal(g.run('pickupDecor(2,2)'), 'tree_round');
  assert.equal(g.run('state.inv.tree_round'), 1);
  assert.equal(g.run('moveDecor(1,2,5,4)'), false);               // 빵집 자리로는 못 옮김
});
test('이전 저장에는 기본 나무·풀을 빈 자리에만 장식으로 깐다', () => {
  const g = game(); g.run('save();');
  const old = JSON.parse(g.storage.get('gam-mockup-v2')), home = old.cities[old.home];
  delete home.natural; home.decor = [{ type: 'bench', x: 2, y: 1 }];
  g.storage.set('gam-mockup-v2', JSON.stringify(old));
  const r = game(g.storage, g.time, false); r.run('load();');
  assert.equal(r.run('C().decor.filter(d=>d.x===2&&d.y===1).length'), 1);     // 벤치 자리는 건너뜀
  assert.equal(r.run('C().decor.length'), r.run('TREES.length'));
});
