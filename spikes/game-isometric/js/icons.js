'use strict';
/* 아이콘은 모두 직접 그린 24x24 path입니다. 외부 자산을 쓰지 않습니다(GAM-Q12).
   같은 정의를 HTML(SVG)과 캔버스(Path2D) 양쪽에서 씁니다.
   항목: [d, fill, stroke, strokeWidth] */
const ICONS = {
  crate: [
    ['M3 8h18v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z', '#c98b4e'],
    ['M2 4.5A1.5 1.5 0 0 1 3.5 3h17A1.5 1.5 0 0 1 22 4.5V8H2z', '#e6b06c'],
    ['M8.5 8v13.5M15.5 8v13.5', null, '#9a6634', 1.6],
    ['M2 8h20', null, '#9a6634', 1.6],
  ],
  coin: [
    ['M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z', '#f2a516'],
    ['M12 3.6a8.4 8.4 0 1 0 0 16.8a8.4 8.4 0 0 0 0-16.8z', '#ffd24a'],
    ['M12 7.2l1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4-2.5-2.4 3.4-.5z', '#f2a516'],
  ],
  cart: [
    ['M2.5 4h3l2.6 10.5h10.2L20.5 7H7', null, 'currentColor', 2.4],
    ['M9.5 17.2a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM17 17.2a2 2 0 1 0 0 4a2 2 0 0 0 0-4z', 'currentColor'],
  ],
  clipboard: [
    ['M6 4.5h12A1.5 1.5 0 0 1 19.5 6v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V6A1.5 1.5 0 0 1 6 4.5z', null, 'currentColor', 2.2],
    ['M9 2.5h6v4H9z', 'currentColor'],
    ['M8 12.5l2.6 2.6L16 9.8', null, 'currentColor', 2.4],
  ],
  wrench: [
    ['M20.8 7.1a5.2 5.2 0 0 1-6.9 4.9l-7 7a2.1 2.1 0 0 1-3-3l7-7a5.2 5.2 0 0 1 6.4-6.7l-3.2 3.2.7 2.6 2.6.7 3.2-3.2c.1.5.2 1 .2 1.5z', 'currentColor'],
  ],
  heart: [
    ['M12 21C5.5 15.8 2 12.2 2 8.4A5.4 5.4 0 0 1 12 5.6A5.4 5.4 0 0 1 22 8.4c0 3.8-3.5 7.4-10 12.6z', '#ff5d7a'],
    ['M7 6.6c-1.4.2-2.4 1.3-2.5 2.7', null, '#ffc2cf', 1.6],
  ],
  check: [['M4.5 12.8l4.8 4.8L19.5 6.8', null, 'currentColor', 3.2]],
  x: [['M6 6l12 12M18 6L6 18', null, 'currentColor', 3.2]],
  plus: [['M12 5v14M5 12h14', null, 'currentColor', 3.2]],
  dash: [['M6 12h12', null, 'currentColor', 3.2]],
  info: [
    ['M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19z', null, 'currentColor', 2.2],
    ['M12 11v6', null, 'currentColor', 2.6],
    ['M12 6.4a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3z', 'currentColor'],
  ],
  truck: [
    ['M1.5 6h12.5v10H1.5z', '#fff3d6', '#c98b4e', 1.4],
    ['M14 9h4.3l3.2 3.4V16H14z', '#ffb02e', '#c98b4e', 1.4],
    ['M6 14.5a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 0 0 0-4.6zM17.5 14.5a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 0 0 0-4.6z', '#4a4f5c'],
  ],
  tire: [
    ['M5.2 4.5c-2.2 4-2.2 9 0 13.5h13.6c2.2-4.5 2.2-9.5 0-13.5', null, 'currentColor', 2.3],
    ['M6 21h2l1.5-1.4L11 21h2l1.5-1.4L16 21h2', null, 'currentColor', 1.9],
    ['M12 6.5v6.5', null, 'currentColor', 2.6],
    ['M12 14.6a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3z', 'currentColor'],
  ],
  thermo: [
    ['M10 3.5a2 2 0 0 1 4 0V13a4.2 4.2 0 1 1-4 0z', null, 'currentColor', 2.2],
    ['M12 8v8', null, 'currentColor', 2.2],
    ['M12 14.6a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 0 0 0-4.4z', 'currentColor'],
    ['M17.5 5h3.5M17.5 8.5h3.5M17.5 12h3.5', null, 'currentColor', 1.8],
  ],
  steering: [
    ['M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19z', null, 'currentColor', 2.4],
    ['M12 9.8a2.2 2.2 0 1 0 0 4.4a2.2 2.2 0 0 0 0-4.4z', 'currentColor'],
    ['M3 10.5c3-1.8 6-1.6 7 .6M21 10.5c-3-1.8-6-1.6-7 .6M12 14v7', null, 'currentColor', 2.2],
  ],
  clock: [
    ['M12 2.5a9.5 9.5 0 1 0 0 19a9.5 9.5 0 0 0 0-19z', null, 'currentColor', 2.3],
    ['M12 6.5V12l3.6 2.4', null, 'currentColor', 2.5],
  ],
  gauge: [
    ['M3 17a9 9 0 1 1 18 0', null, 'currentColor', 2.4],
    ['M12 17l4.2-6.4', null, 'currentColor', 2.6],
    ['M12 15.2a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 0 0 0-3.6z', 'currentColor'],
  ],
  brake: [
    ['M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15z', null, 'currentColor', 2.2],
    ['M4.2 5.5a10.5 10.5 0 0 0 0 13M19.8 5.5a10.5 10.5 0 0 1 0 13', null, 'currentColor', 2],
    ['M12 8v4.8', null, 'currentColor', 2.5],
    ['M12 14.5a1.3 1.3 0 1 0 0 2.6a1.3 1.3 0 0 0 0-2.6z', 'currentColor'],
  ],
  turn: [
    ['M2 12l6.5-6v3.6H11v4.8H8.5V18z', 'currentColor'],
    ['M22 12l-6.5-6v3.6H13v4.8h2.5V18z', 'currentColor'],
  ],
  cup: [
    ['M4 9h13v5.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5z', 'currentColor'],
    ['M17 10.5h1.6a2.4 2.4 0 0 1 0 4.8H17', null, 'currentColor', 2],
    ['M8 3c-1 1.3 1 2 0 3.6M12 3c-1 1.3 1 2 0 3.6', null, 'currentColor', 1.8],
  ],
  lantern: [
    ['M9 2.5h6M12 2.5V5', null, '#8a5a2b', 1.8],
    ['M7.5 5h9c2.2 2.4 2.2 9.6 0 12h-9c-2.2-2.4-2.2-9.6 0-12z', '#ff6b4a'],
    ['M10 5c-1 3.6-1 8.4 0 12M14 5c1 3.6 1 8.4 0 12', null, '#ffd24a', 1.4],
    ['M9 17h6v2H9zM12 19v3', '#8a5a2b', '#8a5a2b', 1.4],
  ],
  note: [
    ['M9 17.5V5l10-2v12.5', null, 'currentColor', 2.4],
    ['M6.5 15a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM16.5 13a3 3 0 1 0 0 6a3 3 0 0 0 0-6z', 'currentColor'],
  ],
  moon: [['M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z', 'currentColor']],
  bread: [
    ['M3 11.5C3 8 6.5 5.5 12 5.5s9 2.5 9 6c0 1.6-1 2.6-2.2 3V18a1.5 1.5 0 0 1-1.5 1.5H6.7A1.5 1.5 0 0 1 5.2 18v-3.5C4 14.1 3 13.100 3 11.5z', '#e9a959'],
    ['M8.5 8.5v3M12 8v3M15.5 8.5v3', null, '#b9722c', 1.6],
  ],
  speaker: [
    ['M3 9.5h4l5-4.5v14l-5-4.500H3z', 'currentColor'],
    ['M15.500 8.500a5 5 0 0 1 0 7M18 6a8.500 8.500 0 0 1 0 12', null, 'currentColor', 2.2],
  ],
  mute: [
    ['M3 9.5h4l5-4.5v14l-5-4.500H3z', 'currentColor'],
    ['M16 9.5l5 5M21 9.5l-5 5', null, 'currentColor', 2.4],
  ],
  drop: [['M12 2.5c4 5 6.500 8 6.500 11.500a6.500 6.500 0 0 1-13 0C5.500 10.500 8 7.500 12 2.500z', 'currentColor']],
  bang: [
    ['M12 4v10', null, 'currentColor', 4],
    ['M12 17.3a2.200 2.200 0 1 0 0 4.400a2.200 2.200 0 0 0 0-4.400z', 'currentColor'],
  ],
  road: [
    ['M7 3L3.500 21M17 3l3.500 18', null, 'currentColor', 2.3],
    ['M12 4v3.500M12 10.500v3.500M12 17v3.500', null, 'currentColor', 2.3],
  ],
  filter: [
    ['M4 5h16v14H4z', null, 'currentColor', 2.2],
    ['M8 5v14M12 5v14M16 5v14', null, 'currentColor', 1.8],
  ],
  flag: [
    ['M5 21.500V3', null, 'currentColor', 2.400],
    ['M5 4h12.500l-2.500 4 2.500 4H5z', '#58c46b'],
  ],
  map: [
    ['M3 6.5l5.500-2.500 7 2.500 5.500-2.500v13.500l-5.500 2.500-7-2.500L3 20z', null, 'currentColor', 2.100],
    ['M8.500 4v13.500M15.500 6.500V20', null, 'currentColor', 1.800],
  ],
  foot: [
    ['M8 3c2 0 3 2.200 3 5s-1.200 4.500-3 4.500S5 10.800 5 8s1-5 3-5z', 'currentColor'],
    ['M7.800 14.300c1.400 0 2.400.900 2.400 2.300S9.200 19 7.800 19s-2.400-1-2.400-2.400 1-2.300 2.400-2.300z', 'currentColor'],
    ['M16 8c2 0 3 2.200 3 5s-1.200 4.500-3 4.500-3-1.700-3-4.500 1-5 3-5z', 'currentColor'],
    ['M15.800 19.300c1.400 0 2.400.900 2.400 2.300', null, 'currentColor', 2.400],
  ],
  phone: [
    ['M7.500 2.500h9A1.500 1.500 0 0 1 18 4v16a1.500 1.500 0 0 1-1.500 1.500h-9A1.500 1.500 0 0 1 6 20V4a1.500 1.500 0 0 1 1.500-1.500z', null, 'currentColor', 2.100],
    ['M10.500 18.500h3', null, 'currentColor', 2.100],
  ],
  up: [['M12 20V5M5.500 11.500L12 5l6.500 6.500', null, 'currentColor', 2.800]],
  move: [['M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3', null, 'currentColor', 2.4]],
  land: [
    ['M12 4.5l8.5 4.6-8.5 4.6-8.5-4.6z', null, 'currentColor', 2.2],
    ['M3.5 9.1v4.3l8.5 4.6 8.5-4.6V9.1', null, 'currentColor', 2.2],
  ],
  star: [['M12 2.800l2.800 5.800 6.300.900-4.600 4.400 1.100 6.300L12 17.200l-5.600 3 1.100-6.300L2.900 9.500l6.300-.900z', '#ffc93c', '#e09a10', 1.200]],
  lock: [
    ['M6 11h12v9.500H6z', 'currentColor'],
    ['M8.500 11V8a3.500 3.500 0 0 1 7 0v3', null, 'currentColor', 2.200],
  ],
  washer: [
    ['M4 20.500h16M6 20.500l1.500-8h9l1.500 8', null, 'currentColor', 2.100],
    ['M12 3c2 2.500 3 4 3 5.400a3 3 0 0 1-6 0C9 7 10 5.500 12 3z', 'currentColor'],
  ],
  wheel: [
    ['M12 2.500a9.500 9.500 0 1 0 0 19a9.500 9.500 0 0 0 0-19z', null, 'currentColor', 2.400],
    ['M12 8.500a3.500 3.500 0 1 0 0 7a3.500 3.500 0 0 0 0-7z', null, 'currentColor', 2.200],
    ['M12 2.500v6M12 15.500v6M2.500 12h6M15.500 12h6', null, 'currentColor', 1.800],
  ],
};

/* HTML용 SVG 문자열 */
function ic(name, size) {
  const defs = ICONS[name] || ICONS.info;
  const body = defs.map(([d, fill, stroke, sw]) =>
    `<path d="${d}" fill="${fill || 'none'}"` +
    (stroke ? ` stroke="${stroke}" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round"` : '') + '/>'
  ).join('');
  const s = size ? ` width="${size}" height="${size}"` : '';
  return `<svg class="ic" viewBox="0 0 24 24"${s} aria-hidden="true">${body}</svg>`;
}

/* 캔버스용 */
const _p2d = {};
function drawIcon(ctx, name, cx, cy, size, color) {
  const defs = ICONS[name]; if (!defs) return;
  if (!_p2d[name]) _p2d[name] = defs.map(d => new Path2D(d[0]));
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  defs.forEach(([, fill, stroke, sw], i) => {
    const cc = c => (c === 'currentColor' ? (color || '#4a3b2a') : c);
    if (fill) { ctx.fillStyle = cc(fill); ctx.fill(_p2d[name][i]); }
    if (stroke) { ctx.strokeStyle = cc(stroke); ctx.lineWidth = sw || 2; ctx.stroke(_p2d[name][i]); }
  });
  ctx.restore();
}

/* data-ic 속성을 가진 요소에 아이콘을 채웁니다 */
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ic]').forEach(el => { el.innerHTML = ic(el.dataset.ic); });
}
