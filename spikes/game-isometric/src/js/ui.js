'use strict';
/* 게임 화면 안의 조작과 창. 화면 ID(S##)는 projects/game/SCREENS.md 7절을 따릅니다. */
let place = null;            // 놓는 중인 것: { kind:'build'|'move'|'decor'|'decorMove'|'tile', type, x, y, ... }
let scaleK = 1;
let hudDelay = 0;

const $ = s => document.querySelector(s);
const stage = $('#stage'), overlay = $('#overlay'), fxLayer = $('#fx'), pop = $('#pop');

/* ---------- 배치: 16:9 화면을 창 크기에 맞춤 ---------- */
function fit() {
  const r = $('#viewport').getBoundingClientRect();
  scaleK = Math.max(.2, Math.min((r.width - 36) / W, (r.height - 36) / H));
  stage.style.transform = `scale(${scaleK})`;
  $('#bezel').style.width = W * scaleK + 'px';
  $('#bezel').style.height = H * scaleK + 'px';
}
function stagePt(e) { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / scaleK, (e.clientY - r.top) / scaleK]; }
function centerOf(el) {
  const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - s.left) / scaleK, y: (r.top + r.height / 2 - s.top) / scaleK };
}

/* ---------- 소리 ---------- */
let actx = null;
function tone(f, dur, type, vol, to, delay) {
  if (!state.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + (delay || 0), o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol || .12, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + .03);
  } catch (e) { /* 소리를 낼 수 없는 환경 */ }
}
const sfx = {
  tap: () => tone(520, .07, 'triangle', .08, 720),
  pop: () => tone(380, .13, 'sine', .14, 840),
  coin: i => tone(900 + (i || 0) * 50, .1, 'triangle', .09, 1350),
  heart: () => tone(660, .2, 'sine', .12, 1040),
  deny: () => tone(210, .16, 'sawtooth', .05, 150),
  open: () => tone(440, .1, 'sine', .08, 660),
  horn: () => { tone(392, .13, 'square', .04); tone(494, .2, 'square', .04, null, .16); },
  warn: () => [0, .26, .52].forEach(d => tone(880, .15, 'sine', .13, null, d)),
  build: () => { tone(150, .24, 'sine', .25, 60); [523, 659, 784, 1047].forEach((f, i) => tone(f, .17, 'triangle', .1, null, .14 + i * .07)); },
  good: () => [659, 784, 1047, 1319].forEach((f, i) => tone(f, .2, 'triangle', .1, null, i * .08)),
};
function speak(text) {
  if (!state.sound || !window.speechSynthesis) return;
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 1.05; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* TTS 없음 */ }
}

/* ---------- 작은 연출 ---------- */
function fly(icon, from, toEl, n, size) {
  const to = centerOf(toEl);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div'); el.className = 'flyer'; el.innerHTML = ic(icon, size || 54);
    el.style.left = from.x + 'px'; el.style.top = from.y + 'px'; fxLayer.appendChild(el);
    const dx = to.x - from.x, dy = to.y - from.y, sx = (Math.random() - .5) * 170, sy = -50 - Math.random() * 130;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
      { transform: `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(1.15)`, opacity: 1, offset: .3 },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.6)`, opacity: 1 },
    ], { duration: 780, delay: i * 55, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'backwards' })
      .onfinish = () => { el.remove(); bumpEl(toEl); sfx.coin(i); };
  }
}
function bumpEl(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function shakeEl(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function floatText(x, y, html, cls) {
  const el = document.createElement('div'); el.className = 'float ' + (cls || ''); el.innerHTML = html;
  el.style.left = x + 'px'; el.style.top = y + 'px'; fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}
function say(x, y, text) {
  const el = document.createElement('div'); el.className = 'say'; el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px'; fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
let bannerT = 0;
function banner(icon, text) {
  const b = $('#banner'); b.innerHTML = ic(icon, 60) + `<span>${text}</span>`;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), 2800);
}
let voiceT = 0;
function voice(text) {
  $('#voiceText').textContent = text; $('#voice').hidden = false;
  clearTimeout(voiceT); voiceT = setTimeout(() => { $('#voice').hidden = true; }, 5000);
  speak(text);
}

/* ---------- 위 줄 ---------- */
const shown = {};
function countTo(el, key, val) {
  const from = shown[key] == null ? val : shown[key];
  shown[key] = val;
  if (from === val) { el.textContent = fmtNum(val); return; }
  const t0 = performance.now() + hudDelay, dur = 480;
  (function step(now) {
    if (shown[key] !== val) return;
    const k = clamp((now - t0) / dur, 0, 1);
    el.textContent = fmtNum(from + (val - from) * k);
    if (k < 1) requestAnimationFrame(step);
  })(performance.now());
}
function withHudDelay(ms, fn) { hudDelay = ms; try { return fn(); } finally { hudDelay = 0; } }

function refresh() {
  countTo($('#resMat b'), 'mat', state.mat);
  countTo($('#resGold b'), 'gold', state.gold);
  $('#homeName').textContent = state.home ? CITIES[state.home].name : '본거지';
  stage.className = 'gear-' + state.gear + (place ? ' placing' : '');
  updateGoal();
  const n = questBadge(), em = $('#btnQuest em'); em.hidden = n === 0; em.textContent = n;
  const chk = Object.keys(CHECKS).find(k => state.check[k].active);
  $('#careChip').hidden = !careDue();
  $('#careChip span:last-child').textContent = state.oil.quest ? '엔진오일 점검 권장' : chk ? CHECKS[chk].name + ' 부족' : '';
  $('#btnSound .i').innerHTML = ic(state.sound ? 'speaker' : 'mute');
  const nf = state.newFoot.length, fe = $('#btnMap em'); fe.hidden = nf === 0; fe.textContent = nf;
  tickHud();
}
/* 매초 바뀌는 것: 시계, 초당 수익, 열린 화면의 쌓인 골드 (GAM-040) */
function tickHud() {
  $('#clock').textContent = fmtClock(state.clock);
  $('#resRate').innerHTML = `+${fmtRate(totalRate())}<small>/초</small>`;
  updateLive(document);
}
function updateLive(root) {
  root.querySelectorAll('[data-live]').forEach(el => {
    const [k, id] = el.dataset.live.split('|');
    if (k === 'stock') el.textContent = fmtShort(cityStock(id));
    else if (k === 'rate') el.textContent = fmtRate(cityRate(id));
    else if (k === 'allStock') el.textContent = fmtShort(ownedIds().reduce((a, c) => a + cityStock(c), 0));
    else if (k === 'allRate') el.textContent = fmtRate(totalRate());
    else if (k === 'site') { const [c, key] = id.split('^'); const st = sitesOf(c).find(x => x.key === key); if (st) el.textContent = fmtShort(stockOf(st)); }
  });
}

/* ---------- S10 실제 경고 카드 ---------- */
const WARN = {
  tire: { icon: 'tire', title: '타이어 공기압 경고', text: '가까운 곳에서 공기압을 점검하세요' },
  heat: { icon: 'thermo', title: '엔진 과열 경고', text: '안전한 곳에 세우고 엔진을 식히세요' },
};
function renderWarns() {
  const box = $('#warnStack');
  Object.keys(WARN).forEach(k => {
    let el = box.querySelector(`[data-k="${k}"]`);
    if (state.warn[k] && !el) {
      el = document.createElement('div'); el.className = 'warn ' + k; el.dataset.k = k;
      el.innerHTML = `<div class="wi">${ic(WARN[k].icon, 64)}</div><div class="wt"><b>${WARN[k].title}</b><span>${WARN[k].text}</span></div><em>차량 경고</em>`;
      box.appendChild(el); sfx.warn();
    } else if (!state.warn[k] && el) { el.classList.add('out'); setTimeout(() => el.remove(), 380); }
  });
}

/* ---------- 창 공통 ---------- */
function showOverlay(html, cls) {
  hidePop();
  overlay.className = cls || ''; overlay.innerHTML = html; overlay.hidden = false;
  hydrateIcons(overlay); sfx.open();
  overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeOverlay));
}
function closeOverlay() { overlay.hidden = true; overlay.innerHTML = ''; }
overlay.addEventListener('pointerdown', e => { if (e.target === overlay) closeOverlay(); });
function hidePop() { pop.hidden = true; pop.innerHTML = ''; }
/* 말풍선은 아래쪽 꼭짓점이 (x, y)에 오도록 위로 펼쳐집니다. 실제 높이를 재서 위 줄·화면 밖으로 잘리지 않게 둡니다 */
function placePop(x, y, yBelow) {
  pop.hidden = false; pop.classList.remove('below');
  const h = pop.offsetHeight, w2 = pop.offsetWidth / 2 + 20;
  pop.style.left = clamp(x, w2, W - w2) + 'px';
  if (y - h < 130 && yBelow != null) {            // 위쪽 공간이 모자라면 건물 아래에 띄워 건물을 가리지 않음
    pop.classList.add('below');
    pop.style.top = clamp(yBelow + 16, 130, H - h - 20) + 'px';
    return;
  }
  pop.style.top = clamp(y, h + 130, H - 40) + 'px';
}

/* ---------- S03 택배 ---------- */
function weekRow(wk) {
  const a = CFG.WEEK_A, t = weekTier(wk), pct = clamp(wk / (2 * a) * 100, 0, 100);
  const label = t === 1 ? '1km당 1개' : t === .5 ? '2km당 1개' : '이번 주 거리 자재 가득 참';
  return `<div class="dl-week ${t === 0 ? 'full' : ''}">${ic('road', 40)}<span>이번 주</span>
    <div class="wtrack"><i style="width:${pct}%"></i><em style="left:50%"></em></div>
    <b>${fmtNum(wk)} km</b><small>${label}</small></div>`;
}
function openDelivery() {
  const d = state.delivery; if (!d) return;
  const left = oilLeft();
  const mark = it => {
    if (it.status === 'ok') return `<div class="st ok">${ic('check', 40)}</div><div class="rw">${ic('crate', 34)}+${CFG.DAILY_MAT}</div>`;
    if (it.status === 'kept') return `<div class="st kept">${ic('check', 40)}</div><div class="rw dim">오늘 달성</div>`;
    if (it.status === 'skip') return `<div class="st no">${ic('dash', 40)}</div><div class="rw dim">운행 짧음</div>`;
    return `<div class="st no">${ic('dash', 40)}</div><div class="rw dim">&nbsp;</div>`;
  };
  const items = DAILY_ITEMS.map(def => {
    const it = d.items.find(i => i.id === def.id);
    return `<div class="dli ${it.status}"><div class="ic-wrap">${ic(def.icon, 54)}</div><span>${def.name}</span><b>${it.value}${def.unit}</b>${mark(it)}</div>`;
  }).join('');
  const crit = { time: `${CFG.DAILY.time.min}분 이상`, accel: `${CFG.DAILY.accel.max}회 이하`, brake: `${CFG.DAILY.brake.max}회 이하`, turn: `${CFG.DAILY.turn.min}회 이상` };
  const sig = { time: 'Odometer 트립 시간', accel: '차량 속도 변화', brake: '차량 속도 + 브레이크 페달', turn: 'TurnSignal 상태' };
  const a = CFG.WEEK_A;
  const proof = `
    <table>
      <tr><th>누적 거리</th><td>${fmtNum(d.odo0)} → ${fmtNum(d.odo1)} km</td><td><i class="tag sig">차량 신호</i> Odometer</td></tr>
      <tr><th>거리 자재</th><td>이번 주 ${fmtNum(d.wk0)} → ${fmtNum(d.wk1)} km · M(${fmtNum(d.wk1)}) − M(${fmtNum(d.wk0)}) = ${d.mat}</td><td>${a} km까지 1km당 1개, ${2 * a} km까지 2km당 1개</td></tr>
      ${DAILY_ITEMS.map(def => { const it = d.items.find(i => i.id === def.id); return `<tr><th>${def.name}</th><td>${it.value}${def.unit} · 기준 ${crit[def.id]}</td><td><i class="tag sig">차량 신호</i> ${sig[def.id]}</td></tr>`; }).join('')}
    </table>`;
  showOverlay(`
    <div class="card delivery">
      <div class="dl-top">
        <div class="dl-km"><b data-count="${d.km}">0</b><small>km</small></div>
        <div class="dl-gain" id="dlMat">${ic('crate', 76)}<b>+<span data-count="${d.mat}">0</span></b><small>거리</small></div>
        <div class="dl-gain safe" id="dlSafe">${ic('crate', 76)}<b>+<span data-count="${d.safe}">0</span></b><small>안전운전</small></div>
      </div>
      <div class="dl-items">${items}</div>
      ${d.allDoneBefore ? '<div class="dl-done">' + ic('check', 34) + '오늘 퀘스트 완료</div>' : ''}
      ${weekRow(d.wk1)}
      <div class="dl-next">${ic('drop', 40)}<span>엔진오일</span><div class="track"><i style="width:${clamp(left.km / CFG.OIL.km * 100, 2, 100)}%"></i></div><b>${fmtNum(left.km)} km · ${left.days}일</b></div>
      <div class="dl-proof" hidden>${proof}</div>
      <div class="actions">
        <button class="btn ghost" id="dlProof">근거</button>
        <button class="btn primary big" id="dlTake">받기</button>
      </div>
    </div>`, 'dim');
  overlay.querySelectorAll('[data-count]').forEach((el, i) => {
    const to = +el.dataset.count, t0 = performance.now() + 200 + i * 180;
    (function step(now) { const k = clamp((now - t0) / 600, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && el.isConnected) requestAnimationFrame(step); })(performance.now());
  });
  overlay.querySelectorAll('.dli.ok').forEach((el, i) => setTimeout(() => { if (el.isConnected) { el.classList.add('stamp'); sfx.coin(i); } }, 700 + i * 160));
  $('#dlProof').addEventListener('click', () => { const p = overlay.querySelector('.dl-proof'); p.hidden = !p.hidden; overlay.querySelector('.delivery').classList.toggle('proof', !p.hidden); sfx.tap(); });
  $('#dlTake').addEventListener('click', () => {
    const a1 = centerOf($('#dlMat')), b1 = centerOf($('#dlSafe'));
    const got = withHudDelay(650, claimDelivery);
    closeOverlay(); sfx.pop();
    if (got.mat) fly('crate', a1, $('#resMat'), Math.min(10, got.mat));
    if (got.safe) fly('crate', b1, $('#resMat'), Math.min(8, Math.ceil(got.safe / 4)));
    setTimeout(truckLeave, 500);
  });
}

/* ---------- S04 짓기 ---------- */
/* 짓기는 상점의 시설·장식 탭에서 고르고 섬 위에서 자리를 정합니다 (GAM-004). 빈 땅을 눌러도 짓기 창은 열지 않음 */
function freeSpot() {
  let best = null, bd = 1e9;
  for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) {
    if (!canBuildAt(x, y)) continue;
    const d = Math.hypot(x - 4.5, y - 5.5); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
/* 땅 모드: 넓히기(buy) / 바꾸기(paint) / 없애기(remove) (GAM-047) */
let landType = 'g';
const TILE_SWATCH = { g: '#a8de7a', s: '#f8e8b8', p: '#e9d6b0', f: '#c8e88a', w: '#6cc6e4' };
function tileOk(x, y, act = place.act, type = place.tile) {
  return act === 'paint' ? canPaintTile(x, y, type) : act === 'remove' ? canRemoveTile(x, y) : canBuyTile(x, y);
}
function tileSpot(act, type) {
  let best = null, bd = 1e9;
  for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) {
    if (!tileOk(x, y, act, type)) continue;
    const d = Math.hypot(x - 4.5, y - 4.5); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function startLand(act = 'buy') {
  const type = (place && place.tile) || landType, s = tileSpot(act, type), st = landStats();
  if (!s) {
    sfx.deny();
    banner('land', act === 'buy' ? (st.bought >= st.max ? `최대 크기 · ${st.max}칸` : '넓힐 수 있는 땅이 없어요') : act === 'remove' ? '없앨 수 있는 빈 땅이 없어요' : '바꿀 수 있는 빈 땅이 없어요');
    return;
  }
  hidePop(); place = { kind: 'tile', act, x: s[0], y: s[1], tile: type }; showPlaceBar(); sfx.tap();
}
function renderLandBar() {
  const bar = $('#landBar');
  if (!place || place.kind !== 'tile') { bar.hidden = true; return; }
  const st = landStats(), ring = tileRing(place.x, place.y), act = place.act;
  const info = act === 'buy' ? `<span>${['섬 안', '첫째 둘레', '둘째 둘레'][ring]} · 칸당 ${ic('coin', 30)}${fmtShort(tilePrice(place.x, place.y))}</span>`
    : act === 'paint' ? '<span>빈 땅만 · 무료</span>' : '<span>산 빈 땅만 · 골드는 돌려받지 않아요</span>';
  bar.innerHTML = `<div class="lb-acts">${[['buy', '넓히기'], ['paint', '바꾸기'], ['remove', '없애기']].map(([k, l]) => `<button data-act="${k}" aria-pressed="${act === k}">${l}</button>`).join('')}</div>
    <div class="lb-types" ${act === 'remove' ? 'hidden' : ''}>${Object.entries(TILE_TYPES).map(([k, t]) => `<button data-tile="${k}" aria-pressed="${place.tile === k}"><i style="background:${TILE_SWATCH[k]}"></i>${t.name}</button>`).join('')}</div>
    <div class="lb-info">${info}<span>넓힌 땅 <b>${st.bought}</b> / ${st.max}칸</span></div>`;
  bar.hidden = false;
  bar.querySelectorAll('[data-tile]').forEach(b => b.addEventListener('click', () => {
    place.tile = landType = b.dataset.tile; sfx.tap();
    if (place.act === 'paint' && !tileOk(place.x, place.y)) { const sp = tileSpot('paint', place.tile); if (sp) { place.x = sp[0]; place.y = sp[1]; } }
    showPlaceBar();
  }));
  bar.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { if (b.dataset.act !== place.act) startLand(b.dataset.act); }));
}
function startMove(id) {
  const b = state.built[id]; if (!b) return;
  hidePop(); place = { kind: 'move', id, type: b.type, x: b.x, y: b.y }; showPlaceBar(); sfx.tap();
}

/* ---------- S05 미리보기·확정 ---------- */
function showPlaceBar() {
  const bar = $('#placeBar'); bar.hidden = false; stage.classList.add('placing');
  const cost = $('#placeCost');
  if (place.kind === 'build') { const c = buildCost(place.type); cost.hidden = false; cost.innerHTML = c.mat ? ic('crate', 40) + c.mat : ic('coin', 40) + fmtShort(c.gold); }
  else if (place.kind === 'tile') { cost.hidden = false; cost.innerHTML = place.act === 'buy' ? ic('coin', 40) + fmtShort(tilePrice(place.x, place.y)) : place.act === 'paint' ? TILE_TYPES[place.tile].name : '없애기'; }
  else cost.hidden = true;
  renderLandBar();
  updatePlaceBar();
}
function updatePlaceBar() {
  if (!place) return;
  const p = scr(iso(place.x + .5, place.y + .5)), bar = $('#placeBar');
  bar.style.left = clamp(p[0], 240, W - 240) + 'px'; bar.style.top = clamp(p[1] + 100, 200, H - 70) + 'px';
  $('#placeYes').classList.toggle('off', place.kind === 'tile' ? !tileOk(place.x, place.y) : !canBuildAt(place.x, place.y));
}
function cancelPlace() { place = null; $('#placeBar').hidden = true; $('#landBar').hidden = true; stage.classList.remove('placing'); }
$('#placeNo').addEventListener('click', () => { cancelPlace(); sfx.tap(); });
$('#placeYes').addEventListener('click', () => {
  if (!place) return;
  const { kind, type, x, y } = place, p = iso(x + .5, y + .5), ps = scr(p);
  if (kind === 'tile') {
    const act = place.act;
    if (act === 'buy') {
      const price = tilePrice(x, y);
      if (!buyTile(x, y, place.tile)) { shakeEl($('#placeBar')); sfx.deny(); if (state.gold < price) floatText(ps[0], ps[1] - 120, ic('coin', 44) + ` ${fmtShort(price - state.gold)} 부족`, 'bad'); return; }
      floatText(ps[0], ps[1] - 120, ic('coin', 44) + ` −${fmtShort(price)}`, '');
      sfx.build();
    } else {
      if (!(act === 'paint' ? paintTile(x, y, place.tile) : removeTile(x, y))) { shakeEl($('#placeBar')); sfx.deny(); return; }
      sfx.pop();
    }
    burst('star', p[0], p[1], 10, { speed: 220, up: 140, g: 480, life: .8, size: 9, colors: ['#a8de7a', '#fff', '#ffd24a'] });
    const next = tileSpot(act, place.tile);                       // 이어서 고를 수 있게 모드 유지
    if (next) { place.x = next[0]; place.y = next[1]; showPlaceBar(); }
    else { cancelPlace(); if (act === 'buy') banner('land', `최대 크기 · ${landStats().max}칸`); }
    return;
  }
  if (kind === 'move') {
    if (!moveBuilding(place.id, x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }
    R.born[place.id] = R.t; sfx.pop(); cancelPlace(); return;
  }
  if (kind === 'decorMove') {
    if (!moveDecor(place.fx, place.fy, x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }
    burst('star', p[0], p[1] - 20, 8, { speed: 200, up: 120, g: 480, life: .7, size: 9, colors: ['#a8de7a', '#fff', '#ffd24a'] }); sfx.pop(); cancelPlace(); return;
  }
  if (kind === 'build') {
    const stageBefore = comboSites('stage').length, c = buildCost(type), id = build(type, x, y);
    if (!id) { shakeEl($('#placeBar')); sfx.deny(); return; }
    R.born[id] = R.t; fxBuild(x, y); sfx.build();
    floatText(ps[0], ps[1] - 170, c.mat ? ic('crate', 44) + ` −${c.mat}` : ic('coin', 44) + ` −${fmtShort(c.gold)}`, '');
    cancelPlace();
    if (type === 'market' && isNear(x, y, 'stop') && R.L <= .4) setTimeout(() => banner('moon', '야시장 · 저녁에 열려요'), 700);
    if (comboSites('stage').length > stageBefore) setTimeout(() => { banner('note', '야외 공연'); sfx.good(); }, 700);
  } else {
    if (!canDecor(x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }   // GAM-033: 놓을 수 없는 자리
    placeDecor(type, x, y);
    burst('star', p[0], p[1] - 20, 10, { speed: 240, up: 120, g: 480, life: .9, size: 10, colors: ['#ffd24a', '#fff', '#7fe0c3'] });
    sfx.pop(); cancelPlace();
  }
});

/* ---------- S06·S15 시설 말풍선: 거두기와 업그레이드 ---------- */
const starsHtml = (L, size) => { const t = tierOf(L); return t ? `<span class="stars">${Array(t).fill(ic('star', size || 30)).join('')}</span>` : ''; };
function upLabel(s) {
  const L = lvOf(s);
  if (L >= CFG.LV.max) return { html: 'MAX', off: true };
  const m = breakMat(L), g = upCost(s.type, L);
  return {
    html: m ? `${ic('star', 36)}돌파 <span class="pr">${ic('crate', 34)}${m}</span><span class="pr">${ic('coin', 34)}${fmtShort(g)}</span>`
      : `${ic('up', 36)}<span class="pr">${ic('coin', 34)}${fmtShort(g)}</span>`,
    lack: state.gold < g || state.mat < m, brk: m > 0,
  };
}
function openFacPop(p) {
  const site = homeSite(p.id); if (!site) return;
  const st = stockOf(site), n = Math.floor(st), cap = capOf(site), L = lvOf(site), r0 = rateOf(site);
  const w = iso(p.x + .5, p.y + .5, HGT[p.type] + 20), s = scr(w);
  const hrs = Math.ceil((cap - st) / r0 / 3600), u = upLabel(site);
  const r1 = L < CFG.LV.max ? incomeAt(p.type, L + 1) : r0;
  pop.innerHTML = `
    <div class="fp-head"><b>${FAC[p.type].name}</b><i class="lv">Lv ${L}</i>${starsHtml(L)}</div>
    <div class="fp-top">${ic(FAC[p.type].icon, 50)}<b>${fmtShort(n)}</b><small>/ ${fmtShort(cap)}</small></div>
    <div class="track"><i style="width:${clamp(st / cap * 100, 0, 100)}%"></i></div>
    <div class="fp-sub">초당 ${fmtRate(r0)}${L < CFG.LV.max ? ` → ${fmtRate(r1)}` : ''} · ${n >= cap - 1 ? '가득 참' : ic('clock', 28) + ` ${hrs}시간`}</div>
    <div class="fp-btns"><button class="btn primary" id="fpTake" ${n > 0 ? '' : 'disabled'}>거두기</button>
      <button class="btn up ${u.lack ? 'lack' : ''} ${u.brk ? 'brk' : ''}" id="fpUp" ${u.off ? 'disabled' : ''}>${u.html}</button></div>`;
  placePop(s[0], s[1], scr(iso(p.x + .5, p.y + .5, -12))[1]);
  $('#fpTake').addEventListener('click', () => { hidePop(); doCollect(p.id, w[0], w[1] + 50); });
  $('#fpUp').addEventListener('click', e => tryUpgrade(site, e.currentTarget, {
    after: r => { R.bump[p.id] = R.t; if (r.broke) fxBuild(p.x, p.y); openFacPop(p); },
  }));
}
function doCollect(id, wx, wy) {            // wx, wy는 월드 좌표
  const n = withHudDelay(600, () => collect(id));
  if (!n) return;
  fxCoins(wx, wy, Math.min(14, Math.ceil(n / 200))); sfx.pop();
  const [sx, sy] = scr([wx, wy]);
  fly('coin', { x: sx, y: sy }, $('#resGold'), Math.min(8, Math.ceil(n / 300)));
  floatText(sx, sy - 60, ic('coin', 44) + ` +${fmtShort(n)}`, 'good');
}

/* 레벨 올리기. 구간 레벨은 확인 창을 거친다(GAM-041). 폰에서는 단계 돌파를 막는다(GAM-046) */
function tryUpgrade(site, btn, o) {
  o = o || {};
  const L = lvOf(site), m = breakMat(L);
  if (L >= CFG.LV.max) { sfx.deny(); return; }
  const go = () => {
    const r = withHudDelay(300, () => upgrade(site));
    if (r.err === 'lack') {
      shakeEl(btn); sfx.deny();
      const c = centerOf(btn), parts = [];
      if (r.mat) parts.push(ic('crate', 40) + ` ${r.mat}`);
      if (r.gold) parts.push(ic('coin', 40) + ` ${fmtShort(r.gold)}`);
      floatText(c.x, c.y - 80, parts.join(' ') + ' 부족', 'bad');
      return;
    }
    if (r.broke) { sfx.build(); banner('star', `${facName(site.type, site.city)} 한 단계 커졌어요`); }
    else { sfx.coin(3); sfx.pop(); }
    if (r.grade[1] > r.grade[0]) setTimeout(() => { banner('star', `${CITIES[site.city].name} · ${CFG.GRADES[r.grade[1]].name} 등급`); sfx.good(); }, r.broke ? 1400 : 300);
    if (o.after) o.after(r);
  };
  if (!m) { go(); return; }
  confirmBox(`${ic('star', 50)} 단계 돌파`, `
      <p>${facName(site.type, site.city)} Lv ${L} → ${L + 1} · 건물이 한 단계 커져요</p>
      <div class="cf-cost"><span>${ic('crate', 50)}${m}</span><span>${ic('coin', 50)}${fmtShort(upCost(site.type, L))}</span></div>
      <p class="sub">자재는 차에서만 모을 수 있어요 · 지금 ${ic('crate', 30)}${state.mat}</p>`, go);
}
function confirmBox(title, body, onOk) {
  const solo = overlay.hidden;
  if (solo) showOverlay('', 'dim');
  const el = document.createElement('div'); el.className = 'modal soft';
  el.innerHTML = `<div class="card confirm"><h3>${title}</h3>${body}
    <div class="actions"><button class="btn ghost" data-no>취소</button><button class="btn primary big" data-ok>확정</button></div></div>`;
  overlay.appendChild(el); sfx.open();
  const done = () => { el.remove(); if (solo) closeOverlay(); };
  el.querySelector('[data-no]').addEventListener('click', () => { done(); sfx.tap(); });
  el.querySelector('[data-ok]').addEventListener('click', () => { done(); onOk(); });
}

/* ---------- S11 상점 · S12 보관함 ---------- */
/* 상점 탭: 시설(생산 시설, 자재, 섬에 종류별 하나) / 장식(장식 건물·소품, 골드, 제한 없음) / 자연(나무·풀) (GAM-033) */
const SHOP_TABS = [['fac', '시설'], ['deco', '장식'], ['nature', '자연']];
let shopTab = 'fac';
function openShop(tab = shopTab) {
  shopTab = tab;
  const buildings = BUILDABLE.filter(t => tab === 'fac' ? FAC[t].rate : tab === 'deco' && !FAC[t].rate);
  const items = tab === 'fac' ? [] : Object.keys(DECOR).filter(t => (tab === 'nature') === NATURE.includes(t));
  const cards = buildings.map(t => {
    const f = FAC[t], c = buildCost(t), existing = f.rate && hasProducer(t), lack = c.mat ? c.mat > state.mat : c.gold > state.gold;
    return `<div class="scard" data-b="${t}">
      <div class="th" data-thb="${t}"></div><b>${f.name}</b><small class="shint">${f.rate ? '섬에 하나' : (f.hint || '&nbsp;')}</small>
      <button class="btn buy ${lack ? 'lack' : ''}" ${existing ? 'disabled' : ''}>${existing ? '완공' : c.mat ? ic('crate', 38) + c.mat : ic('coin', 38) + fmtShort(c.gold)}</button>
    </div>`;
  }).join('') + items.map(t => {
    const d = DECOR[t], have = state.inv[t] || 0, price = decorPrice(t);
    return `<div class="scard" data-t="${t}">
      <div class="th" data-th="${t}"></div><b>${d.name}</b>
      <button class="btn buy ${state.gold < price ? 'lack' : ''}">${ic('coin', 38)}${fmtShort(price)}</button>
      <button class="btn putbtn" ${have ? '' : 'hidden'}>놓기<i>${have}</i></button>
    </div>`;
  }).join('');
  showOverlay(`
    <div class="screen shop">
      <header><span class="hi">${ic('cart', 56)}</span><h2>상점</h2>
        <nav class="shop-tabs">${SHOP_TABS.map(([id, label]) => `<button data-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</nav>
        <div class="chip res">${ic('crate', 48)}<b>${fmtNum(state.mat)}</b></div>
        <div class="chip res" id="shopGold">${ic('coin', 48)}<b>${fmtShort(state.gold)}</b></div>
        <button class="round close" data-close>${ic('x', 44)}</button></header>
      <div class="grid">${cards}</div>
    </div>`, 'full');
  overlay.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { sfx.tap(); openShop(b.dataset.tab); }));
  overlay.querySelectorAll('[data-th]').forEach(el => el.appendChild(thumb('decor', el.dataset.th, 360, 300)));
  overlay.querySelectorAll('[data-thb]').forEach(el => el.appendChild(thumb('fac', el.dataset.thb, 360, 300)));
  overlay.querySelectorAll('[data-b]').forEach(card => {
    const t = card.dataset.b;
    card.querySelector('.buy').addEventListener('click', e => {
      const c = buildCost(t), lack = c.mat ? c.mat - state.mat : c.gold - state.gold;
      if (lack > 0) { shakeEl(card); sfx.deny(); const cc = centerOf(e.currentTarget); floatText(cc.x, cc.y - 90, ic(c.mat ? 'crate' : 'coin', 44) + ` ${fmtShort(lack)} 부족`, 'bad'); return; }
      const spot = freeSpot();
      if (!spot) { shakeEl(card); sfx.deny(); banner('land', '빈 땅이 없어요 · 땅 넓히기'); return; }
      closeOverlay(); place = { kind: 'build', type: t, x: spot[0], y: spot[1] }; showPlaceBar(); sfx.tap();
    });
  });
  overlay.querySelectorAll('[data-t]').forEach(card => {
    const t = card.dataset.t;
    card.querySelector('.buy').addEventListener('click', e => {
      const lack = decorPrice(t) - state.gold;
      if (lack > 0) { shakeEl(card); sfx.deny(); const c = centerOf(e.currentTarget); floatText(c.x, c.y - 90, ic('coin', 44) + ` ${fmtShort(lack)} 부족`, 'bad'); return; }
      buyDecor(t); sfx.coin(2); sfx.pop();
      openShop(); bumpEl(overlay.querySelector(`.scard[data-t="${t}"]`));
    });
    card.querySelector('.putbtn').addEventListener('click', () => {
      closeOverlay();
      const spot = freeSpot() || [2, 6];
      place = { kind: 'decor', type: t, x: spot[0], y: spot[1] }; showPlaceBar(); sfx.tap();
    });
  });
}

/* ---------- S07 퀘스트 현황 ---------- */
function openQuests() {
  const d = state.daily;
  const prog = it => {
    const c = CFG.DAILY[it.id];
    return c.min != null ? `${d[it.id]} / ${c.min}${it.unit}` : `${d[it.id]}${it.unit} · ${c.max}${it.unit} 이하`;
  };
  const pct = it => { const c = CFG.DAILY[it.id]; return d.done[it.id] ? 100 : c.min != null ? clamp(d[it.id] / c.min * 100, 0, 100) : 0; };
  const daily = DAILY_ITEMS.map(it => `
    <div class="qrow ${d.done[it.id] ? 'done' : ''}">
      <div class="qi">${ic(it.icon, 52)}</div>
      <div class="qt"><b>${it.name}</b><span>${prog(it)}</span>${CFG.DAILY[it.id].min != null ? `<div class="track"><i style="width:${pct(it)}%"></i></div>` : ''}</div>
      <div class="qr">${ic('crate', 40)}${CFG.DAILY_MAT}</div>
      <div class="qs">${d.done[it.id] ? ic('check', 44) : ''}</div>
    </div>`).join('');
  let sudden = '';
  if (state.oil.quest) sudden += `
    <button class="qcard oil" id="qOil"><div class="qi">${ic('wrench', 56)}</div>
      <div class="qt"><b>엔진오일 점검</b><span class="rec">점검 권장</span></div>
      <div class="qr">${ic('crate', 40)}${CFG.OIL.mat}</div></button>`;
  Object.keys(CHECKS).forEach(k => {
    if (!state.check[k].active) return;
    sudden += `
    <button class="qcard oil qChk"><div class="qi">${ic(CHECKS[k].icon, 56)}</div>
      <div class="qt"><b>${CHECKS[k].name} 확인</b><span><i class="tag sig">차량 신호</i>부족이 관측됨 · 정상으로 돌아오면 자동 완료</span></div>
      <div class="qr">${ic('crate', 40)}${CFG.CHECK.mat}</div></button>`;
  });
  if (state.rest) {
    const done = state.rest.state === 'done';
    sudden += `
    <div class="qcard rest ${done ? 'done' : ''}"><div class="qi">${ic('cup', 56)}</div>
      <div class="qt"><b>쉬어 가기</b><span>주차 ${Math.min(CFG.REST.rest, state.rest.acc)} / ${CFG.REST.rest}분</span>
        <div class="track"><i style="width:${clamp(state.rest.acc / CFG.REST.rest * 100, 0, 100)}%"></i></div></div>
      <div class="qr">${ic('crate', 40)}${CFG.REST.mat}</div><div class="qs">${done ? ic('check', 44) : ''}</div></div>`;
  }
  if (!sudden) sudden = `<div class="qempty">${ic('check', 90)}</div>`;
  showOverlay(`
    <div class="screen quests">
      <header><span class="hi">${ic('clipboard', 56)}</span><h2>퀘스트</h2><button class="round close" data-close>${ic('x', 44)}</button></header>
      <div class="cols">
        <section><h3>오늘의 안전운전</h3>${daily}</section>
        <section><h3>돌발</h3>${sudden}</section>
      </div>
    </div>`, 'full');
  const q = $('#qOil'); if (q) q.addEventListener('click', openCare);
  overlay.querySelectorAll('.qChk').forEach(b => b.addEventListener('click', openCare));
}

/* ---------- S08 차량 관리 · S09 정비 기록 ---------- */
function openCare() {
  const o = state.oil, left = oilLeft(), due = o.quest;
  const fk = left.km / CFG.OIL.km, fd = left.days / CFG.OIL.days, first = fk <= fd ? 'km' : 'day';
  const bar = (label, val, frac, isFirst) => `
    <div class="cbar ${isFirst ? 'first' : ''} ${frac <= 0 ? 'zero' : ''}"><label>${label}${isFirst ? '<i>먼저</i>' : ''}</label><b>${val}</b>
      <div class="track"><i style="width:${clamp(frac * 100, 0, 100)}%"></i></div></div>`;
  const day = dayOf(state.clock);
  const side = (icon, name, c) => `
    <div class="cside">${ic(icon, 54)}<div><b>${name}</b><span>${fmtNum(Math.max(0, c.dueOdo - state.odo))} km${c.dueDay != null ? ' · ' + Math.max(0, c.dueDay - day) + '일' : ''}</span></div></div>`;
  showOverlay(`
    <div class="screen care">
      <header><span class="hi">${ic('wrench', 52)}</span><h2>차량 관리</h2>
        <div class="odo"><i class="tag sig">차량 신호</i>누적 <b>${fmtNum(state.odo)}</b> km</div>
        <button class="round close" data-close>${ic('x', 44)}</button></header>
      <div class="care-body">
        <div class="cmain ${due ? 'due' : ''}">
          <div class="ttl">${ic('drop', 60)}<b>엔진오일</b>${due ? '<em class="rec">점검 권장</em>' : ''}</div>
          ${bar('남은 거리', fmtNum(left.km) + ' km', fk, first === 'km')}
          ${bar('남은 기간', left.days + '일', fd, first === 'day')}
          <ul>
            <li><i class="tag in">입력값</i>마지막 교체 ${fmtDate(o.lastDay)} · ${fmtNum(o.lastOdo)} km</li>
            <li><i class="tag ref">주기</i>${fmtNum(CFG.OIL.km)} km 또는 12개월 중 먼저 · 예시 데이터</li>
          </ul>
          <button class="btn primary big" id="careRec">교체 기록</button>
        </div>
        <div class="cside-col">
          ${Object.keys(CHECKS).map(k => {
            const v = state.sig[k], txt = { normal: '정상', low: '부족', error: '읽기 실패' }[v];
            return `<div class="cside sig ${v}">${ic(CHECKS[k].icon, 54)}<div><b>${CHECKS[k].name}</b><span><i class="tag sig">차량 신호</i>${txt}</span></div></div>`;
          }).join('')}
          ${side('filter', '에어필터', state.care.filter)}
          ${side('wheel', '타이어 위치 교환', state.care.rotate)}
        </div>
      </div>
    </div>`, 'full dark');
  $('#careRec').addEventListener('click', openRecord);
}
function openRecord() {
  const today = dayOf(state.clock);
  const rec = { day: today, odo: state.odo };
  const el = document.createElement('div'); el.className = 'modal';
  el.innerHTML = `
    <div class="card record">
      <h3>교체 기록 <i class="tag in">입력값</i></h3>
      <div class="field"><label>날짜</label><button data-f="day" data-d="-1">−</button><b id="recDay"></b><button data-f="day" data-d="1">+</button></div>
      <div class="field"><label>주행거리</label><button data-f="odo" data-d="-100">−</button><b id="recOdo"></b><button data-f="odo" data-d="100">+</button></div>
      <div class="actions"><button class="btn ghost" id="recNo">취소</button><button class="btn primary big" id="recOk">저장</button></div>
    </div>`;
  overlay.appendChild(el); sfx.open();
  const paint = () => { $('#recDay').textContent = fmtDate(rec.day); $('#recOdo').textContent = fmtNum(rec.odo) + ' km'; };
  paint();
  el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f, d = +b.dataset.d;
    if (f === 'day') rec.day = clamp(rec.day + d, today - 60, today);
    else rec.odo = clamp(rec.odo + d, state.oil.lastOdo, state.odo);
    paint(); sfx.tap();
  }));
  $('#recNo').addEventListener('click', () => { el.remove(); sfx.tap(); });
  $('#recOk').addEventListener('click', () => {
    const mat = withHudDelay(1100, () => recordOil(rec.day, rec.odo));
    closeOverlay();
    const cw = iso(CAT_POS.x, CAT_POS.y, 80), s = scr(cw);
    catAnim.jump = .45; fxHearts(cw[0], cw[1]); say(s[0], s[1] - 60, '고마워요!'); sfx.good();
    if (mat) setTimeout(() => { fly('crate', { x: s[0], y: s[1] }, $('#resMat'), 8); floatText(s[0] + 90, s[1], ic('crate', 44) + ` +${mat}`, 'good'); }, 350);
  });
}

/* ---------- S13 전국 지도 (GAM-UC-007) ---------- */
let mapRegion = null, mapMode = 'view';
const CW = 236, CH = 110;
function regionStat(r) {
  const ids = r.cities.map(n => r.id + ':' + n);
  return { ids, own: ids.filter(id => state.cities[id]).length, foot: ids.filter(id => state.foot[id] != null).length };
}
function openMap(region, mode) {
  mapMode = mode || 'view';
  mapRegion = region || (state.home ? CITIES[state.home].region : CITIES[state.loc].region);
  showOverlay('<div class="screen map" id="mapScr"></div>', 'full');
  paintMap();
  if (mapMode === 'view') {
    if (state.away >= 1) { const a = state.away; state.away = 0; save(); setTimeout(() => banner('coin', `자리를 비운 동안 +${fmtShort(a)}`), 250); }
    if (state.newFoot.length) {
      const n = state.newFoot.length; state.newFoot = []; save(); refresh();
      setTimeout(() => banner('foot', `새로 지나간 곳 ${n}곳`), 1400);
    }
  }
}
function paintMap() {
  const box = $('#mapScr'); if (!box) return;
  const pick = mapMode === 'pick', N = CITY_IDS.length, own = ownedIds().length;
  const tiles = REGIONS.map(r => {
    const [c, rr, w, h] = r.cells, st = regionStat(r), k = st.own / st.ids.length;
    return `<button class="rtile ${r.id === mapRegion ? 'sel' : ''} ${k >= .45 ? 'dark' : ''}" data-r="${r.id}"
      style="left:${c * CW}px;top:${rr * CH}px;width:${w * CW - 12}px;height:${h * CH - 12}px;--k:${k}">
      <b>${r.name}</b><span>${st.own} / ${st.ids.length}</span>${st.foot ? `<em>${ic('foot', 26)}${st.foot}</em>` : ''}</button>`;
  }).join('');
  const r = REGIONS.find(x => x.id === mapRegion), st = regionStat(r), price = cityPrice();
  const cards = st.ids.map(id => {
    const c = state.cities[id], f = state.foot[id] != null, nm = CITIES[id].name;
    if (c && c.home) return `<button class="ctile own home" data-c="${id}"><b>${nm}</b><span>${ic('star', 26)}본거지 · ${CFG.GRADES[gradeOf(id)].name}</span><small>초당 <i data-live="rate|${id}">${fmtRate(cityRate(id))}</i></small>${f ? `<em>${ic('foot', 24)}</em>` : ''}</button>`;
    if (c) return `<button class="ctile own" data-c="${id}"><b>${nm}</b><span>${CFG.GRADES[gradeOf(id)].name}</span><small>초당 <i data-live="rate|${id}">${fmtRate(cityRate(id))}</i> · ${ic('coin', 22)}<i data-live="stock|${id}">${fmtShort(cityStock(id))}</i></small>${f ? `<em>${ic('foot', 24)}</em>` : ''}</button>`;
    return `<button class="ctile ${pick ? 'pickable' : ''}" data-c="${id}"><b>${nm}</b>${pick ? '<span>여기로</span>' : `<span class="pr">${ic('crate', 26)}${price}</span>`}${f ? `<em>${ic('foot', 24)}</em>` : ''}</button>`;
  }).join('');
  const allStock = ownedIds().reduce((a, c) => a + cityStock(c), 0);
  box.innerHTML = `
    <header><span class="hi">${ic('map', 56)}</span><h2>${pick ? '본거지 고르기' : '전국 지도'}</h2>
      ${pick ? '' : `<div class="chip stat">${ic('flag', 44)}<b>${own}</b><small>/ ${N}</small></div>
      <div class="chip stat">${ic('coin', 44)}<small>초당</small><b data-live="allRate|">${fmtRate(totalRate())}</b></div>
      <button class="btn primary" id="takeAll" ${allStock ? '' : 'disabled'}>${ic('coin', 40)}<span data-live="allStock|">${fmtShort(allStock)}</span> 모두 거두기</button>`}
      ${pick ? '' : `<button class="round close" data-close>${ic('x', 44)}</button>`}</header>
    <div class="map-body">
      <div class="kmap"><div class="sea"></div>${tiles}</div>
      <div class="rpanel">
        <div class="rp-head"><b>${r.name}</b><i class="rp-local" style="--lc:${localOf(r.id).color}"><u>${localOf(r.id).mark}</u>${localOf(r.id).name}</i><span>${pick ? '도시를 누르면 본거지로 정해요' : `보유 ${st.own} / ${st.ids.length}`}</span>
          ${!pick && st.own < st.ids.length ? `<em>다음 도시 ${ic('crate', 30)}${price}</em>` : ''}</div>
        <div class="ctiles">${cards}</div>
      </div>
    </div>
    <footer class="map-foot"><span>${state.locPerm ? ic('foot', 28) + '발자국 기록 켜짐 · 도시와 날짜만 저장' : ic('lock', 28) + '발자국 기록 꺼짐 · 위치 권한 없음'}</span><small>${MAP_SOURCE}</small></footer>`;
  hydrateIcons(box);
  box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeOverlay));
  box.querySelectorAll('.rtile').forEach(b => b.addEventListener('click', () => { mapRegion = b.dataset.r; paintMap(); sfx.tap(); }));
  box.querySelectorAll('.ctile').forEach(b => b.addEventListener('click', () => onCityTile(b.dataset.c)));
  const ta = $('#takeAll');
  if (ta) ta.addEventListener('click', () => {
    const from = centerOf(ta), n = withHudDelay(600, collectAll);
    if (!n) return;
    sfx.pop(); fly('coin', from, $('#resGold'), 8); floatText(from.x, from.y - 70, ic('coin', 44) + ` +${fmtShort(n)}`, 'good');
    paintMap();
  });
}
function onCityTile(id) {
  sfx.tap();
  if (mapMode === 'pick') {
    confirmBox(`${ic('star', 50)} 본거지`, `<p>${cityLabel(id)}을(를) 본거지로 정할까요?</p><p class="sub">본거지에는 정류장과 정비소가 있어요 · 값을 내지 않아요</p>`, () => {
      pickHome(id); closeOverlay(); placeVehicles(); banner('star', `본거지 · ${CITIES[id].name}`); sfx.good();
    });
    return;
  }
  const c = state.cities[id];
  if (c && c.home) { closeOverlay(); return; }
  if (c) { openCityScreen(id); return; }
  openCityCard(id);
}

/* ---------- S14 도시 카드: 새 도시 열기 (GAM-UC-008) ---------- */
function openCityCard(id) {
  const price = cityPrice(), lack = price - state.mat, f = state.foot[id];
  const el = document.createElement('div'); el.className = 'modal soft';
  el.innerHTML = `
    <div class="card citycard">
      <h3>${ic('map', 50)}${cityLabel(id)}</h3>
      ${f != null ? `<p class="foot">${ic('foot', 30)}지나간 곳 · 첫 관측 ${fmtDate(f)}</p>` : ''}
      <div class="cc-local"><div class="th"></div><span><small>${REGIONS.find(r => r.id === CITIES[id].region).name} 특산</small><b>${facName('local', id)}</b></span></div>
      <div class="cc-price"><span>여는 가격</span><b>${ic('crate', 64)}${price}</b></div>
      <div class="cc-rows">
        <div><span>내 자재</span><b class="${lack > 0 ? 'bad' : ''}">${ic('crate', 34)}${state.mat}</b></div>
        <div><span>연 뒤 다음 도시</span><b>${ic('crate', 34)}${nextPrice()}</b></div>
      </div>
      <p class="sub">자재는 차에서 운행과 안전운전으로 모아요</p>
      <div class="actions"><button class="btn ghost" data-no>취소</button><button class="btn primary big ${lack > 0 ? 'lack' : ''}" data-ok>열기</button></div>
    </div>`;
  overlay.appendChild(el); sfx.open();
  el.querySelector('.cc-local .th').appendChild(thumb('fac', 'local', 200, 170, CITIES[id].region));
  el.querySelector('[data-no]').addEventListener('click', () => { el.remove(); sfx.tap(); });
  el.querySelector('[data-ok]').addEventListener('click', e => {
    const btn = e.currentTarget;
    if (state.mat < price) {                         // GAM-UC-008 E1: 모자란 양. 골드로 대신 살 수 없음
      shakeEl(btn); sfx.deny(); const cc = centerOf(btn); floatText(cc.x, cc.y - 80, ic('crate', 44) + ` ${price - state.mat} 부족`, 'bad'); return;
    }
    if (btn.dataset.step !== 'confirm') {             // B2: 가격과 남을 잔액을 확인
      btn.dataset.step = 'confirm'; btn.textContent = '확정';
      el.querySelector('.sub').innerHTML = `연 뒤 남는 자재 ${ic('crate', 30)}${state.mat - price}`;
      hydrateIcons(el); sfx.tap(); return;
    }
    const r = withHudDelay(0, () => openCity(id));
    if (!r.ok) { sfx.deny(); return; }
    el.remove(); paintMap(); sfx.build(); banner('flag', `${CITIES[id].name}을(를) 열었어요`);
    const t = overlay.querySelector(`.ctile[data-c="${id}"]`);
    if (t) { t.classList.add('born'); const cc = centerOf(t); burst('star', cc.x, cc.y, 18, { speed: 320, up: 120, g: 520, life: 1, size: 12, colors: ['#ffd24a', '#fff', '#7fe0c3'] }); }
  });
}

/* ---------- 다른 도시 화면: 시설 업그레이드 (GAM-UC-009) ---------- */
function openCityScreen(id) {
  showOverlay(`<div class="screen city" id="cityScr" data-id="${id}"></div>`, 'full');
  paintCity(id);
}
function paintCity(id) {
  const box = $('#cityScr'); if (!box) return;
  const g = gradeOf(id), next = CFG.GRADES[g + 1], sum = lvSum(id), stock = cityStock(id);
  const cards = sitesOf(id).map(st => {
    const L = lvOf(st), u = upLabel(st);
    return `<div class="fcard" data-k="${st.key}">
      <div class="th" data-th="${st.type}"></div>${st.type === 'local' ? `<i class="fc-local">${REGIONS.find(r => r.id === CITIES[id].region).name} 특산</i>` : '<i class="fc-local blank">&nbsp;</i>'}
      <div class="fc-name"><b>${facName(st.type, id)}</b><i class="lv">Lv ${L}</i>${starsHtml(L, 34)}</div>
      <div class="fc-rate">초당 ${fmtRate(rateOf(st))}${L < CFG.LV.max ? ` → ${fmtRate(incomeAt(st.type, L + 1))}` : ''}</div>
      <button class="btn up ${u.lack ? 'lack' : ''} ${u.brk ? 'brk' : ''}" ${u.off ? 'disabled' : ''}>${u.html}</button>
    </div>`;
  }).join('');
  box.innerHTML = `
    <header><button class="round close" id="toMap">${ic('map', 48)}</button>
      <h2>${cityLabel(id)} <i class="grade">${ic('star', 40)}${CFG.GRADES[g].name}</i></h2>
      <div class="chip stat">${ic('coin', 44)}<small>초당</small><b data-live="rate|${id}">${fmtRate(cityRate(id))}</b></div>
      <button class="btn primary" id="takeCity" ${stock ? '' : 'disabled'}>${ic('coin', 40)}<span data-live="stock|${id}">${fmtShort(stock)}</span> 거두기</button>
      <button class="round close" data-close>${ic('x', 44)}</button></header>
    <div class="gradebar">${next ? `<span>다음 등급 <b>${next.name}</b>까지 시설 레벨 ${next.min - sum}</span><div class="track"><i style="width:${clamp((sum - CFG.GRADES[g].min) / (next.min - CFG.GRADES[g].min) * 100, 0, 100)}%"></i></div>` : '<span>가장 높은 등급이에요</span>'}</div>
    <div class="fcards">${cards}</div>`;
  hydrateIcons(box);
  box.querySelectorAll('[data-th]').forEach(el => el.appendChild(thumb('fac', el.dataset.th, 300, 250, CITIES[id].region)));
  box.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeOverlay));
  $('#toMap').addEventListener('click', () => openMap(CITIES[id].region));
  $('#takeCity').addEventListener('click', e => {
    const from = centerOf(e.currentTarget), n = withHudDelay(600, () => collectCity(id));
    if (!n) return;
    sfx.pop(); fly('coin', from, $('#resGold'), 8); floatText(from.x, from.y - 70, ic('coin', 44) + ` +${fmtShort(n)}`, 'good'); paintCity(id);
  });
  box.querySelectorAll('.fcard').forEach(card => card.querySelector('.btn.up').addEventListener('click', e => {
    const st = sitesOf(id).find(x => x.key === card.dataset.k);
    tryUpgrade(st, e.currentTarget, { after: () => { paintCity(id); const c = box.querySelector(`.fcard[data-k="${st.key}"]`); if (c) bumpEl(c); } });
  }));
}

/* ---------- 본거지 고르기 (처음 실행, GAM-038 제안) ---------- */
function openHomePick() {
  if (state.home || state.gear !== 'P') return;
  const sug = state.locPerm ? state.loc : null;
  showOverlay(`
    <div class="card homepick">
      <h3>${ic('star', 56)}본거지를 골라 주세요</h3>
      <p>본거지에서 섬을 키우고, 차로 모은 자재로 전국의 도시를 하나씩 열어요</p>
      ${sug ? `<div class="hp-sug"><span>${ic('foot', 34)}지금 위치</span><b>${cityLabel(sug)}</b></div>` : '<p class="sub">위치 권한이 없어 지도에서 골라요</p>'}
      <div class="actions"><button class="btn ghost" id="hpMap">지도에서 고르기</button>${sug ? '<button class="btn primary big" id="hpHere">여기로</button>' : ''}</div>
    </div>`, 'dim');
  $('#hpMap').addEventListener('click', () => openMap(sug ? CITIES[sug].region : 'se', 'pick'));
  if (sug) $('#hpHere').addEventListener('click', () => { pickHome(sug); closeOverlay(); banner('star', `본거지 · ${CITIES[sug].name}`); sfx.good(); });
}

/* ---------- S16 폰 화면 (1차 목업 한 장면, D-004). 실제 연동은 없고 같은 상태를 보여줌 ---------- */
let phCity = null;
const phone = $('#phone');
function phMsg(text) { const t = $('#phToast'); if (!t) return; t.textContent = text; t.hidden = false; clearTimeout(phMsg.t); phMsg.t = setTimeout(() => { t.hidden = true; }, 2200); }
function renderPhone() {
  if (phone.hidden) return;
  const body = $('#phBody');
  if (state.gear === 'D') {                       // GAM-047: 연동된 차가 주행 중이면 폰 조작도 막음
    body.innerHTML = `<div class="ph-lock">${ic('steering', 64)}<b>차가 주행 중이에요</b><span>주차하면 다시 열려요</span></div>`;
    return;
  }
  if (!state.home) { body.innerHTML = `<div class="ph-lock">${ic('star', 64)}<b>차에서 본거지를 먼저 골라 주세요</b></div>`; return; }
  const done = DAILY_ITEMS.filter(it => state.daily.done[it.id]).length;
  if (phCity && state.cities[phCity]) {
    const rows = sitesOf(phCity).map(st => {
      const L = lvOf(st), m = breakMat(L), g = upCost(st.type, L);
      const act = L >= CFG.LV.max ? '<button disabled>MAX</button>'
        : m ? `<button class="lockd" data-k="${st.key}">${ic('lock', 16)}돌파는 차에서</button>`
          : `<button data-k="${st.key}">${ic('coin', 16)}${fmtShort(g)}</button>`;
      return `<li><div><b>${facName(st.type, phCity)}</b><small>Lv ${L} · 초당 ${fmtRate(rateOf(st))}</small></div>${act}</li>`;
    }).join('');
    body.innerHTML = `
      <div class="ph-top"><button id="phBack">‹</button><b>${cityLabel(phCity)}</b><span>${CFG.GRADES[gradeOf(phCity)].name}</span></div>
      <div class="ph-card"><span>쌓인 골드</span><b>${ic('coin', 22)}<i data-live="stock|${phCity}">${fmtShort(cityStock(phCity))}</i></b><button id="phTakeCity">거두기</button></div>
      <ul class="ph-list">${rows}</ul>
      <p class="ph-note">${ic('lock', 14)}새 시설 짓기와 단계 돌파는 자재가 들어 차에서만 해요</p>`;
    $('#phBack').addEventListener('click', () => { phCity = null; renderPhone(); });
    $('#phTakeCity').addEventListener('click', () => { const n = collectCity(phCity); phMsg(n ? `+${fmtShort(n)} 골드` : '쌓인 골드가 없어요'); });
    body.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      const st = sitesOf(phCity).find(x => x.key === b.dataset.k);
      if (b.classList.contains('lockd')) { phMsg(`단계 돌파에는 자재 ${breakMat(lvOf(st))}개가 들어요 · 차에서 할 수 있어요`); return; }
      const r = upgrade(st);
      phMsg(r.ok ? `${facName(st.type, phCity)} Lv ${r.L}` : `골드 ${fmtShort(r.gold || 0)} 부족`);
    }));
    return;
  }
  const list = ownedIds().map(id => `<li data-c="${id}"><div><b>${cityLabel(id)}</b><small>${state.cities[id].home ? '본거지 · ' : ''}${CFG.GRADES[gradeOf(id)].name} · 초당 <i data-live="rate|${id}">${fmtRate(cityRate(id))}</i></small></div><span>${ic('coin', 16)}<i data-live="stock|${id}">${fmtShort(cityStock(id))}</i> ›</span></li>`).join('');
  body.innerHTML = `
    <div class="ph-top"><b>내 차로 짓는 도시</b><span>${ic('phone', 16)}연동됨 (목업)</span></div>
    <div class="ph-card big"><span>보유 도시 ${ownedIds().length} / ${CITY_IDS.length} · 초당 <i data-live="allRate|">${fmtRate(totalRate())}</i></span>
      <b>${ic('coin', 26)}<i data-live="allStock|">${fmtShort(ownedIds().reduce((a, c) => a + cityStock(c), 0))}</i></b><button id="phTakeAll">모두 거두기</button></div>
    <ul class="ph-list cities">${list}</ul>
    <div class="ph-row lockd" id="phOpen">${ic('lock', 18)}<div><b>새 도시 열기</b><small>자재 ${cityPrice()}개 · 차에서 할 수 있어요</small></div></div>
    <div class="ph-row"><div><b>오늘의 안전운전 ${done} / ${DAILY_ITEMS.length}</b><small>퀘스트는 차가 기록해요 · 폰에서는 볼 수만 있어요</small></div></div>`;
  $('#phTakeAll').addEventListener('click', () => { const n = collectAll(); phMsg(n ? `+${fmtShort(n)} 골드` : '쌓인 골드가 없어요'); });
  $('#phOpen').addEventListener('click', () => phMsg('도시 열기는 자재가 들어서 차에서만 할 수 있어요'));
  body.querySelectorAll('.cities li').forEach(li => li.addEventListener('click', () => { phCity = li.dataset.c; renderPhone(); }));
}
function setPhone(open) { phone.hidden = !open; document.getElementById('app').classList.toggle('phone-on', open); phCity = null; renderPhone(); fit(); emit('phone'); }
$('#phClose').addEventListener('click', () => setPhone(false));

/* ---------- 섬 누르기 ---------- */
/* 누르기는 손을 뗄 때 처리합니다. 끌면 섬을 옮기고, 두 손가락·휠로 확대합니다 (GAM-048) */
const touches = new Map(); let drag = null, pinch = null;
function zoomAt(uz, sx, sy) {
  const before = unScr(sx, sy);
  CAM.uz = uz; applyCam();
  const after = unScr(sx, sy);
  CAM.px += before[0] - after[0]; CAM.py += before[1] - after[1]; applyCam();
}
cv.addEventListener('pointerdown', e => {
  if (state.gear === 'D') { bumpEl($('#drivePill')); return; }       // GAM-N01: 주행 중에는 조작 없음
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 캡처 불가 환경 */ }
  touches.set(e.pointerId, stagePt(e));
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, uz: CAM.uz }; drag = null; hidePop(); }
  else if (touches.size === 1) {
    drag = { start: stagePt(e), last: stagePt(e), moved: false, long: false };
    const d = drag;
    clearTimeout(longT); longT = setTimeout(() => longPress(d), 450);
  }
  if (touches.size !== 1) clearTimeout(longT);
});
/* 길게 누르기: 건물(고정 건물 제외)·장식이면 바로 옮기기 모드 (GAM-050, GAM-033) */
let longT = 0;
function longPress(d) {
  if (drag !== d || d.moved || pinch || place || state.gear === 'D' || !overlay.hidden) return;
  const [x, y] = unScr(...d.start);
  for (let i = R.hits.length - 1; i >= 0; i--) {
    const h = R.hits[i]; if (!h.test(x, y)) continue;
    if (h.kind === 'fac' && state.built[h.key]) { d.long = true; R.bump[h.key] = R.t; startMove(h.key); if (navigator.vibrate) navigator.vibrate(20); return; }
    if (h.kind === 'decor') {
      const dc = state.decor.find(o => o.x === h.x && o.y === h.y); if (!dc) return;
      d.long = true; hidePop(); place = { kind: 'decorMove', type: dc.type, fx: dc.x, fy: dc.y, x: dc.x, y: dc.y }; showPlaceBar(); sfx.tap();
      if (navigator.vibrate) navigator.vibrate(20); return;
    }
    return;                                                             // 맨 위가 주민·말풍선 등이면 길게 누르기로 보지 않음
  }
}
cv.addEventListener('pointermove', e => {
  if (!touches.has(e.pointerId)) return;
  const pt = stagePt(e); touches.set(e.pointerId, pt);
  if (pinch && touches.size >= 2) { const [a, b] = [...touches.values()]; zoomAt(pinch.uz * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return; }
  if (!drag) return;
  if (!drag.moved && !drag.long && Math.hypot(pt[0] - drag.start[0], pt[1] - drag.start[1]) > 14) { drag.moved = true; clearTimeout(longT); hidePop(); }
  if (drag.moved) { CAM.px -= (pt[0] - drag.last[0]) / VIEW.z; CAM.py -= (pt[1] - drag.last[1]) / VIEW.z; applyCam(); }
  drag.last = pt;
});
function endPointer(e) {
  if (!touches.has(e.pointerId)) return;
  touches.delete(e.pointerId);
  if (pinch) { if (touches.size < 2) pinch = null; drag = null; return; }   // 확대한 뒤에는 누르기로 보지 않음
  clearTimeout(longT);
  if (drag && !drag.moved && !drag.long && e.type === 'pointerup') tapAt(e);
  drag = null;
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('wheel', e => {
  e.preventDefault(); if (state.gear === 'D') return;
  const pt = stagePt(e); zoomAt(CAM.uz * (e.deltaY < 0 ? 1.12 : 1 / 1.12), pt[0], pt[1]);
}, { passive: false });
function tapAt(e) {
  const [x, y] = unScr(...stagePt(e));
  hidePop();
  if (state.gear === 'D') return;
  if (place) {
    const [u, v] = unIso(x, y), tx = Math.floor(u), ty = Math.floor(v);
    if (place.kind === 'tile' ? tileOk(tx, ty) : canBuildAt(tx, ty)) { place.x = tx; place.y = ty; sfx.tap(); if (place.kind === 'tile') showPlaceBar(); }
    updatePlaceBar(); return;
  }
  for (let i = R.hits.length - 1; i >= 0; i--) if (R.hits[i].test(x, y)) { onHit(R.hits[i]); return; }
}
function onHit(h) {
  if (h.kind === 'truck') { openDelivery(); return; }
  if (h.kind === 'stock') { doCollect(h.id, h.sx, h.sy); return; }
  if (h.kind === 'rest') { openQuests(); return; }
  if (h.kind === 'cat') { catAnim.jump = .45; sfx.tap(); openCare(); return; }
  if (h.kind === 'pet') {
    const ent = RES.list.find(p => p.id === h.id);
    if (pet(h.id)) { if (ent) { ent.jump = .45; ent.wait = 1.200; } fxHearts(h.sx, h.sy - 50); sfx.heart(); }
    else {                                                            // GAM-032: 다음 충전까지 남은 시간
      const m = CFG.PET.cooldown - petState(h.id).acc;
      const q = scr([h.sx, h.sy]); floatText(q[0], q[1] - 110, ic('clock', 40) + ` ${Math.floor(m / 60)}시간 ${Math.round(m % 60)}분`, ''); sfx.deny();
    }
    return;
  }
  if (h.kind === 'decor') {                                         // 장식(기본 나무·풀 포함): 옮기기, 보관함에 넣기
    const d = state.decor.find(o => o.x === h.x && o.y === h.y); if (!d) return;
    const s = scr(iso(h.x + .5, h.y + .5, 70));
    pop.innerHTML = `<b class="pop-title">${DECOR[d.type].name}</b><button class="btn ghost" id="decKeep">보관함에</button>`;
    placePop(s[0], s[1]);
    $('#decKeep').addEventListener('click', () => { pickupDecor(h.x, h.y); hidePop(); sfx.pop(); });
    return;
  }
  if (h.kind === 'fac') {
    R.bump[h.key] = R.t; sfx.tap();
    if (h.type === 'stop' && state.delivery && truck.parked) openDelivery();
    else if (h.type === 'shop') openShop();
    else if (h.type === 'garage') openCare();
    else if (FAC[h.type].rate) openFacPop({ id: h.key, type: h.type, x: h.x, y: h.y });
  }
}

/* ---------- 위 줄 버튼 ---------- */
$('#btnShop').addEventListener('click', () => openShop());
$('#btnLand').addEventListener('click', () => startLand('buy'));
$('#goalBtn').addEventListener('click', () => { sfx.tap(); nextGoal().act(); });

/* ---------- 아래 줄: 다음 목표 하나와 그 시설에만 붙는 표시 ---------- */
function nextGoal() {
  if (!state.home) return { icon: 'star', text: '본거지 고르기', act: openHomePick };
  if (state.delivery) return { icon: 'truck', text: '운행 택배 도착', act: openDelivery };
  const list = producers().map(p => { const st = homeSite(p.id), L = lvOf(st); return { p, L, g: upCost(st.type, L), m: breakMat(L) }; }).filter(x => x.L < CFG.LV.max);
  const brk = list.find(x => x.m && state.mat >= x.m && state.gold >= x.g);
  if (brk) return { icon: 'star', text: `${FAC[brk.p.type].name} 돌파`, act: () => openFacPop(brk.p), pid: brk.p.id };
  const price = cityPrice();
  if (state.mat >= price) return { icon: 'map', text: `새 도시 열기 · 자재 ${price}`, act: () => openMap() };
  const up = list.filter(x => !x.m && state.gold >= x.g).sort((a, b) => a.g - b.g)[0];
  if (up) return { icon: 'up', text: `${FAC[up.p.type].name} Lv ${up.L + 1}`, act: () => openFacPop(up.p), pid: up.p.id };
  return { icon: 'map', text: `다음 도시 · 자재 ${state.mat} / ${price}`, act: () => openMap() };
}
function updateGoal() {
  const g = nextGoal(), el = $('#goalText'); if (!el) return;
  if (el.textContent !== g.text) { el.textContent = g.text; $('#goalBtn .i').innerHTML = ic(g.icon); }
}
$('#btnMap').addEventListener('click', () => openMap());
$('#homeName').addEventListener('click', () => openMap());
$('#btnQuest').addEventListener('click', openQuests);
$('#careChip').addEventListener('click', openCare);
$('#btnSound').addEventListener('click', () => { state.sound = !state.sound; save(); refresh(); sfx.tap(); });

/* ---------- 상태 변화에 반응 ---------- */
on('change', refresh);
on('change', renderPhone);
on('change', () => { if ($('#mapScr') && overlay.querySelector('.modal') == null) paintMap(); });
on('tick', () => { tickHud(); updateGoal(); if (!phone.hidden) updateLive(phone); });
on('warn', renderWarns);
on('gear', () => {
  if (state.gear === 'D') {                // 주행 시작: 열린 창을 닫고 확정하지 않은 조작은 취소 (SCREENS 8절)
    cancelPlace(); closeOverlay(); hidePop(); carDepart();
  } else {
    carArrive();
    if (!state.home) setTimeout(openHomePick, 1200);
    if (state.delivery) setTimeout(() => { if (state.gear === 'P' && state.delivery) truckArrive(); }, 1100);
  }
});
on('truckParked', () => sfx.horn());
on('carParked', () => {
  RES.list.forEach((p, i) => setTimeout(() => { p.jump = .45; }, i * 140));
  if (careDue()) { catAnim.jump = .45; sfx.open(); }
  if (state.newFoot.length) setTimeout(() => banner('foot', `새로 지나간 곳 ${state.newFoot.length}곳 · 지도에서 보기`), 600);
});
on('oilDue', () => { if (state.gear === 'P') { catAnim.jump = .45; sfx.open(); } });
on('checkNew', k => { if (state.gear === 'P') { catAnim.jump = .45; sfx.open(); banner(CHECKS[k].icon, `${CHECKS[k].name} 부족 · 정비소에서 확인`); } });   // 주행 중에는 화면으로 알리지 않음
on('checkDone', ({ k, mat }) => {
  if (state.gear !== 'P') return;
  const cw = iso(CAT_POS.x, CAT_POS.y, 80), s = scr(cw);
  catAnim.jump = .45; banner(CHECKS[k].icon, `${CHECKS[k].name} 정상으로 돌아옴`); sfx.good();
  if (mat) setTimeout(() => { fly('crate', { x: s[0], y: s[1] }, $('#resMat'), 6); floatText(s[0] + 90, s[1], ic('crate', 44) + ` +${mat}`, 'good'); }, 400);
  else setTimeout(() => say(s[0], s[1] - 60, `최근 ${CFG.CHECK.coolDays}일 안에 이미 받았어요`), 400);
});
on('restVoice', () => voice('쉬어 가기 퀘스트가 생겼어요'));
on('restDone', () => {
  const s = scr(iso(car.x, car.y, 60));
  banner('cup', '쉬어 가기 완료'); sfx.good();
  fly('crate', { x: s[0], y: s[1] }, $('#resMat'), 6);
  floatText(s[0], s[1] - 60, ic('crate', 44) + ` +${CFG.REST.mat}`, 'good');
});
on('nightMarket', () => { banner('lantern', '야시장'); sfx.good(); });
on('newDay', () => banner('clipboard', '오늘의 퀘스트'));
on('newWeek', () => setTimeout(() => banner('road', '새로운 주 · 거리 자재 다시 1km당 1개'), 1500));
on('reset', () => { RES.list = []; CAM.uz = 1; CAM.px = CAM.py = 0; cancelPlace(); closeOverlay(); hidePop(); placeVehicles(); R.clock = state.clock; Object.keys(shown).forEach(k => delete shown[k]); refresh(); renderWarns(); phCity = null; renderPhone(); setTimeout(openHomePick, 300); });

/* ---------- 시작 ---------- */
load();
hydrateIcons();
placeVehicles();
R.clock = state.clock;
refresh(); renderWarns(); fit();
setTimeout(openHomePick, 500);
/* 실제 시간 1초 = 게임 시간 1초. 시설은 매초 골드를 번다 (GAM-031, GAM-040) */
setInterval(() => { if (!document.hidden) advance(1 / 60, true); }, 1000);
window.addEventListener('resize', fit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
requestAnimationFrame(frame);
