'use strict';
/* 게임 화면 안의 조작과 창. 화면 ID(S##)는 projects/game/SCREENS.md 7절을 따릅니다. */
let place = null;            // 놓는 중인 것: { kind:'build'|'decor', type, x, y }
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
  if (!state.sound || state.gear !== 'P') return;
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
  if (from === val) { el.textContent = (key === 'gold' ? fmtBig : fmtNum)(val); return; }
  const t0 = performance.now() + hudDelay, dur = 480;
  (function step(now) {
    if (shown[key] !== val) return;
    const k = clamp((now - t0) / dur, 0, 1);
    el.textContent = (key === 'gold' ? fmtBig : fmtNum)(from + (val - from) * k);
    if (k < 1) requestAnimationFrame(step);
  })(performance.now());
}
function withHudDelay(ms, fn) { hudDelay = ms; try { return fn(); } finally { hudDelay = 0; } }

function refresh() {
  countTo($('#resMat b'), 'mat', state.mat);
  countTo($('#resGold b'), 'gold', state.gold);
  $('#cityChip b').textContent = cityName(state.cur);
  $('#cityChip small').textContent = GRADES[cityGrade(state.cur)].name;
  $('#cityChip .i').innerHTML = ic(atHome() ? 'home' : 'map');
  const nf = state.footNew.length, mb = $('#btnMap em'); mb.hidden = nf === 0; mb.textContent = nf;
  $('#clock').textContent = fmtClock(state.clock);
  stage.className = 'gear-' + state.gear + (place ? ' placing' : '');
  const n = questBadge(), em = $('#btnQuest em'); em.hidden = n === 0; em.textContent = n;
  $('#careChip').hidden = !state.oil.quest;
  $('#btnSound .i').innerHTML = ic(state.sound ? 'speaker' : 'mute');
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
  if (state.gear !== 'P') return;
  hidePop();
  overlay.className = cls || ''; overlay.innerHTML = html; overlay.hidden = false;
  hydrateIcons(overlay); sfx.open();
  overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeOverlay));
}
function closeOverlay() { overlay.hidden = true; overlay.innerHTML = ''; }
overlay.addEventListener('pointerdown', e => { if (e.target === overlay) closeOverlay(); });
function hidePop() { pop.hidden = true; pop.innerHTML = ''; }

/* ---------- S03 택배 ---------- */
function openDelivery() {
  const d = state.delivery; if (!d) return;
  const left = oilLeft(), A = CFG.WEEK_KM_A;
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
  const w0 = d.weekKm - d.km;
  const proof = `
    <table>
      <tr><th>누적 거리</th><td>${fmtNum(d.odo0)} → ${fmtNum(d.odo1)} km</td><td><i class="tag sig">차량 신호</i> Odometer</td></tr>
      <tr><th>거리 자재</th><td>M(${fmtNum(d.weekKm)}) − M(${fmtNum(Math.max(0, w0))}) = ${d.matKm}</td><td>A=${A}km까지 1배 · ${A * 2}km까지 0.5배</td></tr>
      ${DAILY_ITEMS.map(def => { const it = d.items.find(i => i.id === def.id); return `<tr><th>${def.name}</th><td>${it.value}${def.unit} · 기준 ${crit[def.id]}</td><td><i class="tag sig">차량 신호</i> ${sig[def.id]}</td></tr>`; }).join('')}
    </table>`;
  const wk = clamp(d.weekKm / (A * 2) * 100, 0, 100);
  showOverlay(`
    <div class="card delivery">
      <div class="dl-top">
        <div class="dl-km"><b data-count="${d.km}">0</b><small>km</small></div>
        <div class="dl-gain" id="dlMat">${ic('crate', 76)}<b>+<span data-count="${d.matKm}">0</span></b><small>거리</small></div>
        <div class="dl-gain" id="dlSafe">${ic('crate', 76)}<b>+<span data-count="${d.matSafety}">0</span></b><small>안전운전</small></div>
      </div>
      <div class="dl-week"><span>이번 주 ${fmtNum(d.weekKm)} km</span><div class="wk"><i style="width:${wk}%"></i><em style="left:50%"></em></div><b class="tier t${d.tier === '1배' ? 1 : d.tier === '0.5배' ? 2 : 3}">${d.tier}</b></div>
      <div class="dl-items">${items}</div>
      ${d.allDoneBefore ? '<div class="dl-done">' + ic('check', 34) + '오늘 퀘스트 완료</div>' : ''}
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
    const a = centerOf($('#dlMat')), b = centerOf($('#dlSafe'));
    const got = withHudDelay(650, claimDelivery);
    if (!got) return;
    closeOverlay(); sfx.pop();
    if (got.matKm) fly('crate', a, $('#resMat'), Math.min(10, got.matKm));
    if (got.matSafety) fly('crate', b, $('#resMat'), Math.min(8, got.matSafety));
    setTimeout(truckLeave, 500);
    setTimeout(() => emit('afterDelivery'), 1300);
  });
}

/* ---------- S04 짓기: 상점의 시설·장식 탭에서 고르고 섬 위에서 자리를 정합니다 ---------- */
/* 가운데에서 가까운 빈 땅 */
function freeSpot() {
  let best = null, bd = 1e9;
  for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++) {
    if (!canBuildAt(x, y)) continue;
    const d = Math.hypot(x - 4.5, y - 5.5); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function buySpot() {
  for (let r = 0; r < 12; r++) for (let y = GRID.min; y <= GRID.max; y++) for (let x = GRID.min; x <= GRID.max; x++)
    if (Math.abs(x - 4.5) + Math.abs(y - 4.5) <= r + 5 && canBuyTile(x, y)) return [x, y];
  return null;
}
/* 땅 모드: 넓히기(buy) / 바꾸기(paint) / 없애기(remove) */
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
/* 땅 넓히기 막대: 땅 종류 고르기, 둘레·칸 값, 넓힌 칸 / 최대 칸 */
let landType = 'g';
const TILE_SWATCH = { g: '#a8de7a', s: '#f8e8b8', p: '#e9d6b0', f: '#c8e88a', w: '#6cc6e4' };
function renderLandBar() {
  const bar = $('#landBar');
  if (!place || place.kind !== 'tile') { bar.hidden = true; return; }
  const st = landStats(), ring = tileRing(place.x, place.y), act = place.act;
  const info = act === 'buy' ? `<span>${['섬 안', '첫째 둘레', '둘째 둘레'][ring]} · 칸당 ${ic('coin', 30)}${fmtBig(tilePrice(place.x, place.y))}</span>`
    : act === 'paint' ? '<span>빈 땅만 · 무료</span>' : '<span>산 빈 땅만 · 골드는 돌려받지 않아요</span>';
  bar.innerHTML = `<div class="lb-acts">${[['buy', '넓히기'], ['paint', '바꾸기'], ['remove', '없애기']].map(([k, l]) => `<button data-act="${k}" aria-pressed="${act === k}">${l}</button>`).join('')}</div>
    <div class="lb-types" ${act === 'remove' ? 'hidden' : ''}>${Object.entries(TILE_TYPES).map(([k, t]) => `<button data-tile="${k}" aria-pressed="${place.tile === k}"><i style="background:${TILE_SWATCH[k]}"></i>${t.name}</button>`).join('')}</div>
    <div class="lb-info">${info}<span>넓힌 땅 <b>${st.bought}</b> / ${st.max}칸</span></div>`;
  bar.hidden = false;
  bar.querySelectorAll('[data-tile]').forEach(b => b.addEventListener('click', () => {
    place.tile = landType = b.dataset.tile; sfx.tap();
    if (place.act === 'paint' && !tileOk(place.x, place.y)) { const s = tileSpot('paint', place.tile); if (s) { place.x = s[0]; place.y = s[1]; } }
    showPlaceBar();
  }));
  bar.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { if (b.dataset.act !== place.act) startLand(b.dataset.act); }));
}
function startMove(id) {
  const b = C().built[id]; if (!b) return;
  hidePop(); place = { kind: 'move', id, type: b.type, x: b.x, y: b.y, from: [b.x, b.y] }; showPlaceBar(); sfx.tap();
}

/* ---------- S05 미리보기·확정 ---------- */
function showPlaceBar() {
  const bar = $('#placeBar'); bar.hidden = false; stage.classList.add('placing');
  const cost = $('#placeCost');
  if (place.kind === 'build') { const c = buildCost(place.type); cost.hidden = false; cost.innerHTML = c.mat ? ic('crate', 40) + c.mat : ic('coin', 40) + fmtBig(c.gold); }
  else if (place.kind === 'tile') { cost.hidden = false; cost.innerHTML = place.act === 'buy' ? ic('coin', 40) + fmtBig(tilePrice(place.x, place.y)) : place.act === 'paint' ? TILE_TYPES[place.tile].name : '없애기'; }
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
  if (kind === 'tile' && place.act !== 'buy') {
    const act = place.act, ok = act === 'paint' ? paintTile(x, y, place.tile) : removeTile(x, y);
    if (!ok) { shakeEl($('#placeBar')); sfx.deny(); return; }
    burst('star', p[0], p[1], 8, { speed: 200, up: 120, g: 480, life: .7, size: 9, colors: act === 'paint' ? ['#a8de7a', '#fff', '#6cc6e4'] : ['#bfe3ea', '#fff'] }); sfx.pop();
    const next = tileSpot(act, place.tile); if (next) { place.x = next[0]; place.y = next[1]; showPlaceBar(); } else cancelPlace();
    return;
  }
  if (kind === 'tile') {
    const price = tilePrice(x, y);
    if (!buyTile(x, y, place.tile)) { shakeEl($('#placeBar')); sfx.deny(); if (state.gold < price) floatText(ps[0], ps[1] - 120, ic('coin', 44) + ` ${fmtBig(price - state.gold)} 부족`, 'bad'); return; }
    burst('star', p[0], p[1], 12, { speed: 240, up: 160, g: 480, life: .9, size: 10, colors: ['#a8de7a', '#fff', '#ffd24a'] }); sfx.build();
    floatText(ps[0], ps[1] - 120, ic('coin', 44) + ` −${fmtBig(price)}`, '');
    const next = buySpot(); if (next) { place.x = next[0]; place.y = next[1]; showPlaceBar(); } else { cancelPlace(); banner('land', `최대 크기 · ${landStats().max}칸`); }   // 이어서 살 수 있게 모드 유지
    return;
  }
  if (kind === 'decorMove') {
    if (!moveDecor(place.fx, place.fy, x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }
    burst('star', p[0], p[1] - 20, 8, { speed: 200, up: 120, g: 480, life: .7, size: 9, colors: ['#a8de7a', '#fff', '#ffd24a'] }); sfx.pop(); cancelPlace();
    return;
  }
  if (kind === 'move') {
    if (!moveBuilding(place.id, x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }
    R.born[place.id] = R.t; sfx.pop(); cancelPlace();
    return;
  }
  if (kind === 'build') {
    const stageBefore = comboSites('stage').length, cost = buildCost(type);
    const id = build(type, x, y);
    if (!id) { shakeEl($('#placeBar')); sfx.deny(); return; }
    R.born[id] = R.t; fxBuild(x, y); sfx.build();
    floatText(ps[0], ps[1] - 170, cost.mat ? ic('crate', 44) + ` −${cost.mat}` : ic('coin', 44) + ` −${fmtBig(cost.gold)}`, '');
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

/* ---------- S06 시설 말풍선 ---------- */
function openFacPop(p) {
  const city = C(), L = facLevel(p.id), max = L >= MAX_LEVEL, cost = max ? null : upgradeCost(p);
  const n = Math.floor(city.stock[p.id] || 0), cap = capOf(p), stg = stageOf(L);
  const w = iso(p.x + .5, p.y + .5, HGT[p.type] * (1 + (stg - 1) * .09) + 20), sp = scr(w);
  const now = ratePerSec(p.type, L), next = max ? now : ratePerSec(p.type, L + 1);
  const brk = cost && cost.mat > 0;
  const costHtml = c => `${c.mat ? `${ic('crate', 34)}${c.mat} ` : ''}${ic('coin', 34)}${fmtBig(c.gold)}`;
  pop.innerHTML = `
    <div class="fp-head"><b>${facName(p.type)}</b><em>Lv.${L}</em><span class="stg">${'★'.repeat(stg)}</span></div>
    <div class="fp-rate">${ic('coin', 36)}<b>${fmtRate(now)}</b><small>/초</small>${max ? '' : `<span class="arrow">→</span><b class="${brk ? 'jump' : ''}">${fmtRate(next)}</b><small>/초</small>`}</div>
    <div class="track"><i style="width:${clamp(n / cap * 100, 0, 100)}%"></i></div>
    <div class="fp-sub">${n >= cap ? '가득 참' : `${fmtBig(n)} / ${fmtBig(cap)}`}</div>
    <div class="fp-btns">
      <button class="btn ghost" id="fpCollect" ${n > 0 ? '' : 'disabled'}>거두기</button>
      <button class="btn ghost fp-move" id="fpMove" aria-label="옮기기">${ic('move', 30)}</button>
      <button class="btn ${brk ? 'break' : 'primary'}" id="fpUp" ${max ? 'disabled' : ''}>${max ? '최고 레벨' : `${brk ? '돌파' : ic('up', 34)} ${costHtml(cost)}`}</button>
    </div>`;
  pop.style.left = clamp(sp[0], 260, W - 260) + 'px'; pop.style.top = clamp(sp[1], 400, H - 40) + 'px'; pop.hidden = false;
  pop.dataset.id = p.id;
  $('#fpCollect').addEventListener('click', () => { doCollect(p.id, w[0], w[1] + 50); openFacPop(p); });
  $('#fpMove').addEventListener('click', () => startMove(p.id));
  $('#fpUp').addEventListener('click', e => {
    if (max) return;
    const c = upgradeCost(p);
    if (!afford(c)) {                                  // 모자란 양을 보여줌 (GAM-036·037)
      shakeEl(pop); sfx.deny();
      const lack = [c.mat > state.mat ? ic('crate', 40) + ` ${c.mat - state.mat}` : '', c.gold > state.gold ? ic('coin', 40) + ` ${fmtBig(c.gold - state.gold)}` : ''].filter(Boolean).join(' ');
      const cc = centerOf(e.currentTarget); floatText(cc.x, cc.y - 110, lack + ' 부족', 'bad');
      return;
    }
    if (brk) { hidePop(); openBreak(p); return; }
    doUpgrade(p);
  });
}
function doUpgrade(p) {
  const L = facLevel(p.id);
  if (!withHudDelay(0, () => upgradeFacility(p.id))) { sfx.deny(); return false; }
  R.bump[p.id] = R.t; sfx.build();
  const s = scr(iso(p.x + .5, p.y + .5, 150));
  floatText(s[0], s[1] - 40, `Lv.${L + 1}`, 'good');
  burst('star', iso(p.x + .5, p.y + .5)[0], iso(p.x + .5, p.y + .5, 80)[1], 8, { speed: 200, up: 160, g: 420, life: .8, size: 9, colors: ['#ffd24a', '#fff', '#7fe0c3'] });
  if (!pop.hidden) openFacPop(p);
  return true;
}
/* 단계 돌파 확인 창: 지금 건물과 다음 단계 건물을 나란히 보여줍니다 (GAM-037) */
function openBreak(p) {
  const L = facLevel(p.id), cost = upgradeCost(p), stg = stageOf(L);
  showOverlay(`
    <div class="card breakc">
      <h2>${facName(p.type)} 돌파</h2>
      <div class="bk-row">
        <div class="bk-th" data-bk="${stg}"></div><span class="bk-arrow">→</span><div class="bk-th next" data-bk="${stg + 1}"></div>
      </div>
      <div class="bk-rate">${ic('coin', 40)}${fmtRate(ratePerSec(p.type, L))}/초 → <b>${fmtRate(ratePerSec(p.type, L + 1))}/초</b></div>
      <div class="bk-cost"><span class="${state.mat >= cost.mat ? '' : 'lack'}">${ic('crate', 48)}${cost.mat}<small>/ ${state.mat}</small></span><span class="${state.gold >= cost.gold ? '' : 'lack'}">${ic('coin', 48)}${fmtBig(cost.gold)}</span></div>
      <div class="actions"><button class="btn ghost" data-close>취소</button><button class="btn primary big" id="bkOk">확정</button></div>
    </div>`, 'dim');
  overlay.querySelectorAll('[data-bk]').forEach(el => el.appendChild(thumb('fac', p.type, 300, 260, +el.dataset.bk)));
  $('#bkOk').addEventListener('click', () => {
    if (!upgradeFacility(p.id)) { shakeEl(overlay.querySelector('.card')); sfx.deny(); return; }
    closeOverlay();
    R.born[p.id] = R.t; fxBuild(p.x, p.y); sfx.good();
    banner('star', `${facName(p.type)} ${stageOf(facLevel(p.id))}단계`);
  });
}
function doCollect(id, wx, wy) {            // wx, wy는 월드 좌표
  const n = withHudDelay(600, () => collect(id));
  if (!n) return;
  fxCoins(wx, wy, n); sfx.pop();
  const [sx, sy] = scr([wx, wy]);
  fly('coin', { x: sx, y: sy }, $('#resGold'), Math.min(8, Math.ceil(n / 4)));
  floatText(sx, sy - 60, ic('coin', 44) + ` +${n}`, 'good');
}

/* ---------- S11 상점 · S12 보관함 ---------- */
/* 상점 탭: 시설(생산 시설, 자재, 도시마다 하나) / 장식(장식 건물·소품, 골드, 제한 없음) / 자연(나무·풀) */
const SHOP_TABS = [['fac', '시설'], ['deco', '장식'], ['nature', '자연']];
const NATURE = ['tree_round', 'tree_pine', 'tree_palm', 'bush', 'grass'];
let shopTab = 'fac';
function openShop(tab = shopTab) {
  shopTab = tab;
  const buildings = BUILDABLE.filter(t => tab === 'fac' ? FAC[t].rate : tab === 'deco' && !FAC[t].rate);
  const items = tab === 'fac' ? [] : Object.keys(DECOR).filter(t => (tab === 'nature') === NATURE.includes(t));
  let cards = '';
  {
    cards += buildings.map(t => {
      const f = FAC[t], c = buildCost(t), existing = f.rate && hasProducer(t);
      const lack = c.mat ? c.mat > state.mat : c.gold > state.gold;
      const hint = t === 'local' ? `${REGION_BY_ID[CITY_BY_ID[state.cur].region].name} 특산` : f.rate ? '도시마다 하나' : f.hint;
      return `<div class="scard ${t === 'local' ? 'local' : ''}" data-b="${t}">
        <div class="th" data-thb="${t}"></div><b>${facName(t)}</b><small class="shint">${hint || '&nbsp;'}</small>
        <button class="btn buy ${lack ? 'lack' : ''}" ${existing ? 'disabled' : ''}>${existing ? '완공' : c.mat ? ic('crate', 38) + c.mat : ic('coin', 38) + fmtBig(c.gold)}</button>
      </div>`;
    }).join('');
    cards += items.map(t => {
      const d = DECOR[t], have = state.inv[t] || 0, price = decorPrice(t);
      return `<div class="scard" data-t="${t}">
        <div class="th" data-th="${t}"></div><b>${d.name}</b>
        <button class="btn buy ${state.gold < price ? 'lack' : ''}">${ic('coin', 38)}${fmtNum(price)}</button>
        <button class="btn putbtn" ${have ? '' : 'hidden'}>놓기<i>${have}</i></button>
      </div>`;
    }).join('');
  }
  showOverlay(`
    <div class="screen shop">
      <header><span class="hi">${ic('cart', 56)}</span><h2>상점</h2>
        <nav class="shop-tabs">${SHOP_TABS.map(([id, label]) => `<button data-tab="${id}" aria-pressed="${tab === id}">${label}</button>`).join('')}</nav>
        <div class="chip res">${ic('crate', 48)}<b>${fmtNum(state.mat)}</b></div>
        <div class="chip res" id="shopGold">${ic('coin', 48)}<b>${fmtBig(state.gold)}</b></div>
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
      if (lack > 0) { shakeEl(card); sfx.deny(); const cc = centerOf(e.currentTarget); floatText(cc.x, cc.y - 90, ic(c.mat ? 'crate' : 'coin', 44) + ` ${fmtBig(lack)} 부족`, 'bad'); return; }
      const spot = freeSpot();
      if (!spot) { shakeEl(card); sfx.deny(); banner('land', '빈 땅이 없어요 · 땅 넓히기'); return; }
      closeOverlay(); place = { kind: 'build', type: t, x: spot[0], y: spot[1] }; showPlaceBar(); sfx.tap();
    });
  });
  overlay.querySelectorAll('[data-t]').forEach(card => {
    const t = card.dataset.t;
    card.querySelector('.buy').addEventListener('click', e => {
      const lack = decorPrice(t) - state.gold;
      if (lack > 0) { shakeEl(card); sfx.deny(); const c = centerOf(e.currentTarget); floatText(c.x, c.y - 90, ic('coin', 44) + ` ${lack} 부족`, 'bad'); return; }
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

/* ---------- 섬 누르기 ---------- */
/* 누르기는 손을 뗄 때 처리합니다. 끌면 섬을 옮기고, 두 손가락·휠로 확대합니다 */
const touches = new Map(); let drag = null, pinch = null;
function zoomAt(uz, sx, sy) {
  const before = unScr(sx, sy);
  CAM.uz = uz; applyCam();
  const after = unScr(sx, sy);
  CAM.px += before[0] - after[0]; CAM.py += before[1] - after[1]; applyCam();
}
cv.addEventListener('pointerdown', e => {
  if (state.gear !== 'P') { bumpEl($('#drivePill')); return; }       // GAM-N01: 주차 확인 전 조작 없음
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 캡처 불가 환경 */ }
  touches.set(e.pointerId, stagePt(e));
  if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, uz: CAM.uz }; drag = null; hidePop(); }
  else if (touches.size === 1) drag = { start: stagePt(e), last: stagePt(e), moved: false };
});
cv.addEventListener('pointermove', e => {
  if (!touches.has(e.pointerId)) return;
  const pt = stagePt(e); touches.set(e.pointerId, pt);
  if (pinch && touches.size >= 2) { const [a, b] = [...touches.values()]; zoomAt(pinch.uz * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return; }
  if (!drag) return;
  if (!drag.moved && Math.hypot(pt[0] - drag.start[0], pt[1] - drag.start[1]) > 14) { drag.moved = true; hidePop(); }
  if (drag.moved) { CAM.px -= (pt[0] - drag.last[0]) / VIEW.z; CAM.py -= (pt[1] - drag.last[1]) / VIEW.z; applyCam(); }
  drag.last = pt;
});
function endPointer(e) {
  if (!touches.has(e.pointerId)) return;
  touches.delete(e.pointerId);
  if (pinch) { if (touches.size < 2) pinch = null; drag = null; return; }   // 확대한 뒤에는 누르기로 보지 않음
  if (drag && !drag.moved && e.type === 'pointerup') tapAt(e);
  drag = null;
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('wheel', e => {
  e.preventDefault(); if (state.gear !== 'P') return;
  const pt = stagePt(e); zoomAt(CAM.uz * (e.deltaY < 0 ? 1.12 : 1 / 1.12), pt[0], pt[1]);
}, { passive: false });
function tapAt(e) {
  const [x, y] = unScr(...stagePt(e));
  hidePop();
  if (state.gear !== 'P') return;
  if (place) {
    const [u, v] = unIso(x, y), tx = Math.floor(u), ty = Math.floor(v);
    if (place.kind === 'tile' ? tileOk(tx, ty) : canBuildAt(tx, ty)) { place.x = tx; place.y = ty; sfx.tap(); if (place.kind === 'tile') showPlaceBar(); }
    updatePlaceBar(); return;
  }
  for (let i = R.hits.length - 1; i >= 0; i--) if (R.hits[i].test(x, y)) { onHit(R.hits[i]); return; }
  /* 빈 땅을 눌러도 짓기 창을 열지 않습니다. 짓기는 상점에서만 합니다(GAM-004). 끌기·확대 중 잘못 열리지 않게 하기 위해서입니다 */
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
    const d = C().decor.find(o => o.x === h.x && o.y === h.y); if (!d) return;
    const s = scr(iso(h.x + .5, h.y + .5, 70));
    pop.innerHTML = `<b class="pop-title">${DECOR[d.type].name}</b><div class="pop-row"><button class="btn ghost" id="decMove">옮기기</button><button class="btn ghost" id="decKeep">보관함에</button></div>`;
    pop.dataset.id = ''; pop.style.left = clamp(s[0], 260, W - 260) + 'px'; pop.style.top = clamp(s[1], 300, H - 40) + 'px'; pop.hidden = false;
    $('#decMove').addEventListener('click', () => { hidePop(); place = { kind: 'decorMove', type: d.type, fx: d.x, fy: d.y, x: d.x, y: d.y }; showPlaceBar(); sfx.tap(); });
    $('#decKeep').addEventListener('click', () => { pickupDecor(h.x, h.y); hidePop(); sfx.pop(); });
    return;
  }
  if (h.kind === 'fac') {
    R.bump[h.key] = R.t; sfx.tap();
    if (h.type === 'stop' && state.delivery && truck.parked) openDelivery();
    else if (h.type === 'shop') openShop();
    else if (h.type === 'garage') openCare();
    else if (FAC[h.type].rate) openFacPop({ id: h.key, type: h.type, x: h.x, y: h.y });
    else if (C().built[h.key]) {                                       // 장식 건물: 옮기기
      const s = scr(iso(h.x + .5, h.y + .5, (HGT[h.type] || 90) + 10));
      pop.innerHTML = `<b class="pop-title">${facName(h.type)}</b><button class="btn ghost" id="popMove">옮기기</button>`;
      pop.dataset.id = ''; pop.style.left = s[0] + 'px'; pop.style.top = clamp(s[1], 300, H - 40) + 'px'; pop.hidden = false;
      $('#popMove').addEventListener('click', () => startMove(h.key));
    }
  }
}

/* ---------- 위 줄 버튼 ---------- */
$('#btnShop').addEventListener('click', openShop);
$('#btnQuest').addEventListener('click', openQuests);
$('#careChip').addEventListener('click', openCare);
$('#btnSound').addEventListener('click', () => { state.sound = !state.sound; save(); refresh(); sfx.tap(); });

/* ---------- 상태 변화에 반응 ---------- */
on('change', refresh);
on('warn', renderWarns);
on('gear', () => {
  if (state.gear !== 'P') {                // 주차 확인 해제: 열린 창과 미리보기 취소
    cancelPlace(); closeOverlay(); hidePop(); carDepart();
  } else {
    carArrive();
    if (state.delivery) setTimeout(() => { if (state.gear === 'P' && state.delivery) truckArrive(); }, 1100);
  }
});
on('truckParked', () => sfx.horn());
on('carParked', () => { RES.list.forEach((p, i) => setTimeout(() => { p.jump = .45; }, i * 140)); if (state.oil.quest) { catAnim.jump = .45; sfx.open(); } });
on('oilDue', () => { if (state.gear === 'P') { catAnim.jump = .45; sfx.open(); } });
on('restVoice', () => voice('쉬어 가기 퀘스트가 생겼어요'));
on('restDone', () => {
  const s = scr(iso(car.x, car.y, 60));
  banner('cup', '쉬어 가기 완료'); sfx.good();
  fly('crate', { x: s[0], y: s[1] }, $('#resMat'), 6);
  floatText(s[0], s[1] - 60, ic('crate', 44) + ` +${CFG.REST.mat}`, 'good');
});
on('nightMarket', () => { banner('lantern', '야시장'); sfx.good(); });
on('newDay', () => banner('clipboard', '오늘의 퀘스트'));
on('city', () => { cancelPlace(); hidePop(); placeVehicles(); });
on('reset', () => { cancelPlace(); closeOverlay(); hidePop(); placeVehicles(); R.clock = state.clock; Object.keys(shown).forEach(k => delete shown[k]); refresh(); renderWarns(); });

/* ---------- 시작 ---------- */
load();
hydrateIcons();
placeVehicles();
R.clock = state.clock;
refresh(); renderWarns(); fit();
window.addEventListener('resize', fit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
requestAnimationFrame(frame);
