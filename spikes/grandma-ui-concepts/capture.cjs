// 사용: node capture.cjs <concepts.html 절대 경로> <출력 폴더>
const { chromium } = require('playwright');
(async () => {
  const [file, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + file); await p.waitForLoadState('networkidle');
  const ids = await p.$$eval('.cell', cs => cs.map(c => c.dataset.id));
  for (const id of ids) {
    await p.goto('file://' + file + '?solo#' + id); await p.waitForLoadState('networkidle'); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${id}.png` });
  }
  await p.setViewportSize({ width: 1960, height: 1200 });
  await p.goto('file://' + file); await p.waitForLoadState('networkidle');
  await p.screenshot({ path: `${out}/gallery.png`, fullPage: true });
  await b.close();
})();
