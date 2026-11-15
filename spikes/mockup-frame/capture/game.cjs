#!/usr/bin/env node
/*
 * game 목업 장면 캡처
 *
 * 목적: spikes/game-isometric/index.html(내 차로 짓는 도시 HTML 목업)을 열어
 *       projects/game/SCENARIO.md 2절 장면 SC-01~SC-09의 차량 화면(#stage, 1920×1080)을
 *       PNG로 저장합니다. 목업 틀(spikes/mockup-frame/)과 접수양식 7번 화면 시안에 씁니다.
 * 실행: 저장소 루트에서  node spikes/mockup-frame/capture/game.cjs
 *       Playwright와 Chromium이 필요합니다(require('playwright')).
 * 출력: projects/game/assets/scenes/SC-01.png ~ SC-09.png
 * 원칙: 목업 코드를 바꾸지 않습니다. 시뮬레이터 버튼과 목업의 전역 함수(state.js, ui.js)로
 *       장면 상태를 만듭니다. 시연 순서는 spikes/game-isometric/README.md 4절을 따릅니다.
 *       목업이 바뀌면 이 스크립트를 다시 실행해 캡처를 새로 만듭니다.
 *       캡처의 수치(자재, 골드, 기준 등)는 목업 가정값이며 근거 있는 값이 아닙니다.
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..', '..');
const page_url = 'file://' + path.join(root, 'spikes/game-isometric/index.html');
const outDir = path.join(root, 'projects/game/assets/scenes');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  // 시뮬레이터 패널(330px)을 뺀 영역이 1956×1116 이상이면 차량 화면 배율이 1이 됩니다.
  const page = await browser.newPage({ viewport: { width: 2300, height: 1116 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto(page_url);
  await page.addStyleTag({ content: '#bezel{border-radius:0!important}' });   // 캡처 모서리만 정리
  await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });

  const wait = ms => page.waitForTimeout(ms);
  const sim = sel => page.click('#sim ' + sel);
  const shot = async id => {
    await page.evaluate(() => fit());
    const file = path.join(outDir, id + '.png');
    await page.locator('#stage').screenshot({ path: file });
    console.log('저장:', path.relative(root, file));
  };
  /* 차량 화면 좌표(1920×1080)를 눌러 섬 위의 물체를 조작합니다 */
  const tapStage = async (sx, sy) => {
    const r = await page.locator('#stage').boundingBox();
    await page.mouse.click(r.x + sx, r.y + sy);
  };

  // SC-01 낮의 섬: 처음 상태 (소리 끔). 본거지는 시뮬레이터의 지금 위치로 바로 정해 고르기 창을 건너뜀
  await page.evaluate(() => { resetState(); pickHome(state.loc); state.sound = false; save(); refresh(); });
  await wait(2500);
  await shot('SC-01');

  // SC-02 출발하면 주행 모드: 시뮬레이터 D 주행, 화면을 눌러도 반응 없음
  await sim('#simGear button[data-v="D"]');
  await wait(3000);
  await tapStage(960, 600);
  await wait(300);
  await shot('SC-02');

  // SC-03 주차하면 택배가 온다: 이번 운행 11km·24분·방향 지시등 6회(목업 초기값) → P 주차 → 택배
  await sim('#simGear button[data-v="P"]');
  await page.waitForFunction(() => truck.parked, null, { timeout: 15000 });
  await wait(500);
  await page.evaluate(() => openDelivery());
  await wait(2200);
  await shot('SC-03');
  await page.click('#dlTake');
  await wait(1500);

  // SC-04 시장을 짓고 야시장으로: 정류장(8,4) 옆 빈 땅(7,4)에 시장 → 확정 → 저녁
  await page.evaluate(() => { place = { kind: 'build', type: 'market', x: 7, y: 4 }; showPlaceBar(); });
  await wait(300);
  await page.click('#placeYes');
  await wait(1500);
  await sim('[data-jump="18.7"]');
  await page.waitForFunction(() => R.nightMarket, null, { timeout: 15000 });
  await wait(2500);
  await shot('SC-04');

  // SC-05 거두고, 사고, 쓰다듬기: 벤치를 사서 광장에 놓고, 빵집 완성품을 거두고, 주민을 쓰다듬는 순간
  await page.evaluate(() => { buyDecor('bench'); place = { kind: 'decor', type: 'bench', x: 2, y: 6 }; showPlaceBar(); });
  await wait(300);
  await page.click('#placeYes');
  await wait(1500);
  await page.evaluate(() => {
    const p = producers().find(q => q.id === 'bakery');
    const w = iso(p.x + .5, p.y + .5, HGT[p.type] + 20);
    doCollect('bakery', w[0], w[1] + 50);
  });
  // 주민은 돌아다니므로 좌표로 누르면 옆의 장식이 눌릴 수 있습니다. 쓰다듬기를 직접 부릅니다
  await page.evaluate(() => { const d = RES.list[0], s = iso(d.x, d.y); onHit({ kind: 'pet', id: d.id, sx: s[0], sy: s[1] }); });
  await wait(450);
  await shot('SC-05');
  await wait(1500);

  // SC-06 정비소 주민의 정비 알림: 정비 상태 '기준 도달' → 차량 관리 화면
  await sim('#simOil button[data-v="due"]');
  await wait(800);
  await page.evaluate(() => openCare());
  await wait(1200);
  await shot('SC-06');
  await page.evaluate(() => closeOverlay());

  // SC-07 공기압 경고와 일렁이는 길: 시뮬레이터 '타이어 공기압'
  await sim('#simTire');
  await wait(2500);
  await shot('SC-07');

  // SC-08 전국 지도: 경고를 풀고 위 줄 지도 아이콘 → 본거지 권역이 선택된 전국 지도(S13)
  await sim('#simTire');
  await wait(800);
  await page.evaluate(() => { closeOverlay(); });
  await page.click('#btnMap');
  await wait(1800);
  await shot('SC-08');

  // SC-09 새 도시 열기: 경기 권역의 첫 미보유 도시 → 도시 카드(S14) → 열기 → 확정 직전 화면
  // 자재는 SC-03에서 받은 운행 보상에 시연용으로 더해 여는 가격을 넘깁니다(목업 가정값)
  await page.evaluate(() => { state.mat = Math.max(state.mat, cityPrice() + 12); save(); refresh(); });
  await page.click('.rtile[data-r="gg"]');
  await wait(400);
  await page.locator('.ctile:not(.own)').first().click();
  await wait(600);
  await page.locator('.citycard [data-ok]').click();
  await wait(600);
  await shot('SC-09');

  await browser.close();
  if (errors.length) { console.error('페이지 오류:', errors); process.exitCode = 1; }
})();
