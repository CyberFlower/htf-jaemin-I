#!/usr/bin/env node
/*
 * grandma 목업 장면 캡처
 *
 * 목적: 다녀왔습니다의 두 HTML 목업에서 projects/grandma/SCENARIO.md 2절 장면의 차량 화면(1920×1080)을
 *       PNG로 저장합니다. 접수양식 7번 화면 시안과 영상 콘티 검토에 씁니다.
 *       - SC-01~07: spikes/grandma-first-visit/index.html?embed=1#SC-0N (장면의 처음 상태)
 *       - SC-08:    spikes/grandma-journey-context/journey-demo.html?embed=1 (첫 화면)
 * 실행: 저장소 루트에서  node spikes/mockup-frame/capture/grandma.cjs
 *       Playwright와 Chromium이 필요합니다(require('playwright')).
 * 출력: projects/grandma/assets/scenes/SC-01.png ~ SC-08.png
 * 원칙: 목업 코드를 바꾸지 않습니다. 목업이 바뀌면 다시 실행합니다.
 *       캡처의 장소·시각·연료 등은 시연용 값입니다.
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..', '..');
const outDir = path.join(root, 'projects/grandma/assets/scenes');
const first = 'file://' + path.join(root, 'spikes/grandma-first-visit/index.html');
const revisit = 'file://' + path.join(root, 'spikes/grandma-journey-context/journey-demo.html');

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const errors = [];
  const scenes = ['SC-01', 'SC-02', 'SC-03', 'SC-04', 'SC-05', 'SC-06', 'SC-07'].map((id) => [id, `${first}?embed=1#${id}`]);
  scenes.push(['SC-08', `${revisit}?embed=1`]);
  for (const [id, url] of scenes) {
    // 장면마다 새 컨텍스트: 목업이 저장한 이전 상태(localStorage)가 섞이지 않게 합니다.
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(`${id}: ${e}`));
    await page.goto(url);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `${id}.png`) });
    await context.close();
    console.log('저장', id);
  }
  await browser.close();
  if (errors.length) { console.error('페이지 오류', errors); process.exitCode = 1; }
})();
