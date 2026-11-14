'use strict';
/* 섬 지형. 도시마다 같은 섬에서 시작하고, 골드로 바다 칸을 사서 넓힙니다. g 잔디, r 도로, p 광장, s 모래, k 주차 자리, . 바다 */
const BASE_MAP = [
  '...gggg...', '..gggggg..', '.gggggggg.', 'gggggggggg', 'gggggggggg',
  'rrrrrrrrrr', 'gppggggkgg', '.ppggggggs', '..ggggsss.', '...ssss...',
];
const islandSize = () => 10;
/* 원래 섬 + 골드로 넓힌 땅(잔디) */
function tileAt(x, y) {
  const city = typeof C === 'function' && C(), own = city && city.extra && city.extra[x + ',' + y];
  return own || BASE_MAP[y]?.[x] || '.';     // 바꾼 종류·넓힌 땅이 먼저
}
const isLand = (x, y) => tileAt(x, y) !== '.';
