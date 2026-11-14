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
  $('#clock').textContent = fmtClock(state.clock);
  stage.className = 'gear-' + state.gear;
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
  const left = oilLeft();
  const mark = it => {
    if (it.status === 'ok') return `<div class="st ok">${ic('check', 40)}</div><div class="rw">${ic('coin', 34)}+${CFG.DAILY_GOLD}</div>`;
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
  const proof = `
    <table>
      <tr><th>누적 거리</th><td>${fmtNum(d.odo0)} → ${fmtNum(d.odo1)} km</td><td><i class="tag sig">차량 신호</i> Odometer</td></tr>
      <tr><th>자재</th><td>${d.km} km × ${CFG.MAT_PER_KM} = ${d.mat}${d.capped ? ' (상한)' : ''}</td><td>오늘 ${state.matToday} / ${CFG.MAT_DAILY_CAP}</td></tr>
      ${DAILY_ITEMS.map(def => { const it = d.items.find(i => i.id === def.id); return `<tr><th>${def.name}</th><td>${it.value}${def.unit} · 기준 ${crit[def.id]}</td><td><i class="tag sig">차량 신호</i> ${sig[def.id]}</td></tr>`; }).join('')}
    </table>`;
  showOverlay(`
    <div class="card delivery">
      <div class="dl-top">
        <div class="dl-km"><b data-count="${d.km}">0</b><small>km</small></div>
        <div class="dl-gain" id="dlMat">${ic('crate', 76)}<b>+<span data-count="${d.mat}">0</span></b></div>
        <div class="dl-gain" id="dlGold">${ic('coin', 76)}<b>+<span data-count="${d.gold}">0</span></b></div>
      </div>
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
    const a = centerOf($('#dlMat')), b = centerOf($('#dlGold'));
    const got = withHudDelay(650, claimDelivery);
    closeOverlay(); sfx.pop();
    if (got.mat) fly('crate', a, $('#resMat'), Math.min(10, got.mat));
    if (got.gold) fly('coin', b, $('#resGold'), Math.min(8, Math.ceil(got.gold / 15)));
    setTimeout(truckLeave, 500);
  });
}

/* ---------- S04 짓기 ---------- */
function openBuild(x, y) {
  showOverlay(`
    <div class="sheet"><div class="cards">${BUILDABLE.map(t => {
      const f = FAC[t], lack = f.cost - state.mat;
      return `<button class="bcard ${lack > 0 ? 'lack' : ''}" data-t="${t}">
        <div class="th" data-th="${t}"></div><b>${f.name}</b>
        <span class="cost">${ic('crate', 40)}${f.cost}</span>
        ${f.hint ? `<small>${f.hint}</small>` : '<small>&nbsp;</small>'}
      </button>`;
    }).join('')}</div></div>`, 'bottom');
  overlay.querySelectorAll('[data-th]').forEach(el => el.appendChild(thumb('fac', el.dataset.th, 260, 220)));
  overlay.querySelectorAll('.bcard').forEach(btn => btn.addEventListener('click', () => {
    const t = btn.dataset.t, lack = FAC[t].cost - state.mat;
    if (lack > 0) {                                   // GAM-UC-003 E1: 모자란 양을 보여줌
      shakeEl(btn); sfx.deny();
      const c = centerOf(btn); floatText(c.x, c.y - 150, ic('crate', 44) + ` ${lack} 부족`, 'bad');
      return;
    }
    place = { kind: 'build', type: t, x, y }; closeOverlay(); showPlaceBar(); sfx.tap();
  }));
}

/* ---------- S05 미리보기·확정 ---------- */
function showPlaceBar() {
  const bar = $('#placeBar'); bar.hidden = false;
  const cost = $('#placeCost');
  if (place.kind === 'build') { cost.hidden = false; cost.innerHTML = ic('crate', 40) + FAC[place.type].cost; }
  else cost.hidden = true;
  updatePlaceBar();
}
function updatePlaceBar() {
  if (!place) return;
  const p = scr(iso(place.x + .5, place.y + .5)), bar = $('#placeBar');
  bar.style.left = clamp(p[0], 240, W - 240) + 'px'; bar.style.top = clamp(p[1] + 100, 200, H - 70) + 'px';
  $('#placeYes').classList.toggle('off', place.kind === 'decor' && !canDecor(place.x, place.y));
}
function cancelPlace() { place = null; $('#placeBar').hidden = true; }
$('#placeNo').addEventListener('click', () => { cancelPlace(); sfx.tap(); });
$('#placeYes').addEventListener('click', () => {
  if (!place) return;
  const { kind, type, x, y } = place, p = iso(x + .5, y + .5), ps = scr(p);
  if (kind === 'build') {
    const stageBefore = comboSites('stage').length;
    if (!build(type, x, y)) { shakeEl($('#placeBar')); sfx.deny(); return; }
    R.born[x + ',' + y] = R.t; fxBuild(x, y); sfx.build();
    floatText(ps[0], ps[1] - 170, ic('crate', 44) + ` −${FAC[type].cost}`, '');
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
  const n = Math.floor(state.stock[p.id] || 0), cap = stockCap(p.type), w = iso(p.x + .5, p.y + .5, HGT[p.type] + 20), s = scr(w);
  const hrs = Math.ceil((cap - (state.stock[p.id] || 0)) / FAC[p.type].rate);
  pop.innerHTML = `
    <div class="fp-top">${ic(FAC[p.type].icon, 50)}<b>${n}</b><small>/ ${cap}</small></div>
    <div class="track"><i style="width:${clamp(n / cap * 100, 0, 100)}%"></i></div>
    <div class="fp-sub">${n >= cap ? '가득 참' : ic('clock', 28) + ` ${hrs}시간`}</div>
    <button class="btn primary" ${n > 0 ? '' : 'disabled'}>거두기</button>`;
  pop.style.left = clamp(s[0], 200, W - 200) + 'px'; pop.style.top = clamp(s[1], 330, H - 40) + 'px'; pop.hidden = false;
  pop.querySelector('button').addEventListener('click', () => { hidePop(); doCollect(p.id, w[0], w[1] + 50); });
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
function openShop() {
  const cards = Object.keys(DECOR).map(t => {
    const d = DECOR[t], have = state.inv[t] || 0;
    return `<div class="scard" data-t="${t}">
      <div class="th" data-th="${t}"></div><b>${d.name}</b>
      <button class="btn buy ${state.gold < d.price ? 'lack' : ''}">${ic('coin', 38)}${d.price}</button>
      <button class="btn putbtn" ${have ? '' : 'hidden'}>놓기<i>${have}</i></button>
    </div>`;
  }).join('');
  showOverlay(`
    <div class="screen shop">
      <header><span class="hi">${ic('cart', 56)}</span><h2>상점</h2>
        <div class="chip res" id="shopGold">${ic('coin', 48)}<b>${fmtNum(state.gold)}</b></div>
        <button class="round close" data-close>${ic('x', 44)}</button></header>
      <div class="grid">${cards}</div>
    </div>`, 'full');
  overlay.querySelectorAll('[data-th]').forEach(el => el.appendChild(thumb('decor', el.dataset.th, 360, 300)));
  overlay.querySelectorAll('.scard').forEach(card => {
    const t = card.dataset.t;
    card.querySelector('.buy').addEventListener('click', e => {
      const lack = DECOR[t].price - state.gold;
      if (lack > 0) { shakeEl(card); sfx.deny(); const c = centerOf(e.currentTarget); floatText(c.x, c.y - 90, ic('coin', 44) + ` ${lack} 부족`, 'bad'); return; }
      buyDecor(t); sfx.coin(2); sfx.pop();
      openShop(); bumpEl(overlay.querySelector(`.scard[data-t="${t}"]`));
    });
    card.querySelector('.putbtn').addEventListener('click', () => {
      closeOverlay();
      let spot = [2, 6];
      outer: for (const [x0, y0] of [[2, 6], [1, 6], [2, 7], [1, 7]]) if (canDecor(x0, y0)) { spot = [x0, y0]; break outer; }
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
      <div class="qr">${ic('coin', 40)}${CFG.DAILY_GOLD}</div>
      <div class="qs">${d.done[it.id] ? ic('check', 44) : ''}</div>
    </div>`).join('');
  let sudden = '';
  if (state.oil.quest) sudden += `
    <button class="qcard oil" id="qOil"><div class="qi">${ic('wrench', 56)}</div>
      <div class="qt"><b>엔진오일 점검</b><span class="rec">점검 권장</span></div>
      <div class="qr">${ic('coin', 40)}${CFG.OIL.gold}</div></button>`;
  if (state.rest) {
    const done = state.rest.state === 'done';
    sudden += `
    <div class="qcard rest ${done ? 'done' : ''}"><div class="qi">${ic('cup', 56)}</div>
      <div class="qt"><b>쉬어 가기</b><span>주차 ${Math.min(CFG.REST.rest, state.rest.acc)} / ${CFG.REST.rest}분</span>
        <div class="track"><i style="width:${clamp(state.rest.acc / CFG.REST.rest * 100, 0, 100)}%"></i></div></div>
      <div class="qr">${ic('coin', 40)}${CFG.REST.gold}</div><div class="qs">${done ? ic('check', 44) : ''}</div></div>`;
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
    const gold = withHudDelay(1100, () => recordOil(rec.day, rec.odo));
    closeOverlay();
    const cw = iso(CAT_POS.x, CAT_POS.y, 80), s = scr(cw);
    catAnim.jump = .45; fxHearts(cw[0], cw[1]); say(s[0], s[1] - 60, '고마워요!'); sfx.good();
    if (gold) setTimeout(() => { fly('coin', { x: s[0], y: s[1] }, $('#resGold'), 8); floatText(s[0] + 90, s[1], ic('coin', 44) + ` +${gold}`, 'good'); }, 350);
  });
}

/* ---------- 섬 누르기 ---------- */
cv.addEventListener('pointerdown', e => {
  const [x, y] = unScr(...stagePt(e));
  hidePop();
  if (state.gear === 'D') { bumpEl($('#drivePill')); return; }       // GAM-N01: 주행 중에는 조작 없음
  if (place) {
    const [u, v] = unIso(x, y), tx = Math.floor(u), ty = Math.floor(v);
    if (place.kind === 'build') { if (LOTS.some(l => l[0] === tx && l[1] === ty) && !state.built[tx + ',' + ty]) { place.x = tx; place.y = ty; sfx.tap(); } }
    else if (isLand(tx, ty)) { place.x = tx; place.y = ty; sfx.tap(); }
    updatePlaceBar(); return;
  }
  for (let i = R.hits.length - 1; i >= 0; i--) if (R.hits[i].test(x, y)) { onHit(R.hits[i]); return; }
});
function onHit(h) {
  if (h.kind === 'truck') { openDelivery(); return; }
  if (h.kind === 'stock') { doCollect(h.id, h.sx, h.sy); return; }
  if (h.kind === 'rest') { openQuests(); return; }
  if (h.kind === 'cat') { catAnim.jump = .45; sfx.tap(); openCare(); return; }
  if (h.kind === 'lot') { sfx.tap(); openBuild(h.x, h.y); return; }
  if (h.kind === 'pet') {
    const ent = PETS.find(p => p.id === h.id);
    if (pet(h.id)) { ent.jump = .45; ent.wait = 1.200; fxHearts(h.sx, h.sy - 50); sfx.heart(); }
    else {                                                            // GAM-032: 다음 충전까지 남은 시간
      const m = CFG.PET.cooldown - state.pets[h.id].acc;
      const q = scr([h.sx, h.sy]); floatText(q[0], q[1] - 110, ic('clock', 40) + ` ${Math.floor(m / 60)}시간 ${Math.round(m % 60)}분`, ''); sfx.deny();
    }
    return;
  }
  if (h.kind === 'decor') {
    const s = scr(iso(h.x + .5, h.y + .5, 70));
    pop.innerHTML = '<button class="btn ghost">보관함에 넣기</button>';
    pop.style.left = s[0] + 'px'; pop.style.top = s[1] + 'px'; pop.hidden = false;
    pop.querySelector('button').addEventListener('click', () => { pickupDecor(h.x, h.y); hidePop(); sfx.pop(); });
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
$('#btnShop').addEventListener('click', openShop);
$('#btnQuest').addEventListener('click', openQuests);
$('#careChip').addEventListener('click', openCare);
$('#btnSound').addEventListener('click', () => { state.sound = !state.sound; save(); refresh(); sfx.tap(); });

/* ---------- 상태 변화에 반응 ---------- */
on('change', refresh);
on('warn', renderWarns);
on('gear', () => {
  if (state.gear === 'D') {                // 주행 시작: 열린 창을 닫고 확정하지 않은 조작은 취소 (SCREENS 8절)
    cancelPlace(); closeOverlay(); hidePop(); carDepart();
  } else {
    carArrive();
    if (state.delivery) setTimeout(() => { if (state.gear === 'P' && state.delivery) truckArrive(); }, 1100);
  }
});
on('truckParked', () => sfx.horn());
on('carParked', () => { PETS.forEach((p, i) => setTimeout(() => { p.jump = .45; }, i * 140)); if (state.oil.quest) { catAnim.jump = .45; sfx.open(); } });
on('oilDue', () => { if (state.gear === 'P') { catAnim.jump = .45; sfx.open(); } });
on('restVoice', () => voice('쉬어 가기 퀘스트가 생겼어요'));
on('restDone', () => {
  const s = scr(iso(car.x, car.y, 60));
  banner('cup', '쉬어 가기 완료'); sfx.good();
  fly('coin', { x: s[0], y: s[1] }, $('#resGold'), 6);
  floatText(s[0], s[1] - 60, ic('coin', 44) + ` +${CFG.REST.gold}`, 'good');
});
on('nightMarket', () => { banner('lantern', '야시장'); sfx.good(); });
on('newDay', () => banner('clipboard', '오늘의 퀘스트'));
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
