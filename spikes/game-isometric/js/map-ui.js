'use strict';
/* 전국 지도(S13)·도시 카드(S14)·복귀 요약(GAM-040)·폰 화면 한 장면(S16)·아래 줄.
   PR #12 제안(GAM-034~043, D-003·D-004)을 목업으로 옮겼습니다. */
let mapRegion = null, wallMark = Date.now();

/* ---------- 아래 줄: 다음 목표 하나 ---------- */
function nextGoal() {
  if (!state.homePicked) return { icon: 'home', text: '본거지 고르기', act: () => openMap() };
  if (state.delivery) return { icon: 'truck', text: '운행 택배 도착', act: () => { if (!atHome()) enterCity(state.home); openDelivery(); } };
  const list = producers().map(p => ({ p, L: facLevel(p.id) })).filter(x => x.L < MAX_LEVEL).map(x => ({ ...x, cost: upgradeCost(x.p) }));
  const brk = list.find(x => x.cost.mat && afford(x.cost));
  if (brk) return { icon: 'star', text: `${facName(brk.p.type)} 돌파 · ${brk.L + 1 > 20 ? 3 : 2}단계`, act: () => openFacPop(brk.p), pid: brk.p.id };
  const price = openPrice();
  if (state.mat >= price) return { icon: 'map', text: `새 도시 열기 · ▣${price}`, act: () => openMap() };
  const up = list.filter(x => !x.cost.mat && afford(x.cost)).sort((a, b) => a.cost.gold - b.cost.gold)[0];
  if (up) return { icon: 'up', text: `${facName(up.p.type)} Lv.${up.L + 1}`, act: () => openFacPop(up.p), pid: up.p.id };
  return { icon: 'map', text: `다음 도시 ▣${state.mat} / ${price}`, act: () => openMap() };
}
function updateTownUI() {
  const g = nextGoal();
  $('#townGoal').textContent = g.text;
  $('#btnTown .i').innerHTML = ic(g.icon);
  $('#btnCollectAll b').textContent = fmtBig(totalStored());
  $('#btnCollectAll').disabled = totalStored() === 0;
  $('#btnHome').hidden = atHome();
  $('#drivePill span:last-child').textContent = state.gear === 'U'
    ? '주차 상태를 확인할 수 없어요 · 조작을 잠시 멈춰요'
    : '운전에 집중해 주세요 · 주차 후 이어가요';
  const gear = $('#hud .gear i'); if (gear) gear.textContent = state.gear;
  /* 열린 시설 말풍선의 쌓인 양만 갱신 (다시 만들지 않아 누르는 중인 버튼을 지킵니다) */
  if (!pop.hidden && pop.dataset.id) {
    const p = producers().find(q => q.id === pop.dataset.id), sub = pop.querySelector('.fp-sub');
    if (p && sub) {
      const n = Math.floor(C().stock[p.id] || 0), cap = capOf(p);
      sub.textContent = n >= cap ? '가득 참' : `${fmtBig(n)} / ${fmtBig(cap)}`;
      pop.querySelector('.track i').style.width = clamp(n / cap * 100, 0, 100) + '%';
      pop.querySelector('#fpCollect').disabled = n <= 0;
    }
  }
  renderPhone();
}

/* ---------- S13 전국 지도 ---------- */
function regionStats(r) {
  const owned = r.cityIds.filter(id => state.cities[id]).length;
  const foot = r.cityIds.filter(id => state.footprints[id] != null).length;
  return { owned, foot, total: r.cityIds.length, fresh: r.cityIds.some(id => state.footNew.includes(id)) };
}
function openMap(region) {
  if (state.gear !== 'P') return;
  const picking = !state.homePicked;
  mapRegion = region || mapRegion || (state.footNew[0] && CITY_BY_ID[state.footNew[0]].region) || CITY_BY_ID[state.home].region;
  const owned = ownedIds().length, cell = 69;
  const tiles = [...REGIONS].sort((a, b) => !!a.inset - !!b.inset).map(r => {
    const st = regionStats(r), [x, y, w, h] = r.tile, k = st.owned / st.total;
    return `<button class="ktile ${r.inset ? 'inset' : ''} ${r.id === mapRegion ? 'sel' : ''} ${st.owned ? 'has' : ''} ${st.fresh ? 'fresh' : ''}" data-region="${r.id}"
      style="left:${x * cell}px;top:${y * cell}px;width:${w * cell - 6}px;height:${h * cell - 6}px;--k:${k}">
      <b>${r.name}</b>${r.cityIds.length > 1 ? `<small>${st.owned}/${st.total}</small>` : ''}
      ${r.cityIds.includes(state.home) && state.homePicked ? `<i class="khome">${ic('home', 26)}</i>` : ''}
      ${st.foot ? `<i class="kfoot">${ic('foot', 22)}${r.cityIds.length > 1 ? st.foot : ''}</i>` : ''}
    </button>`;
  }).join('');
  showOverlay(`
    <div class="screen kmap-screen ${picking ? 'picking' : ''}">
      <header><span class="hi">${ic(picking ? 'home' : 'map', 56)}</span><h2>${picking ? '본거지 고르기' : '전국 지도'}</h2>
        ${picking ? '' : `
        <div class="kstat"><b>${owned}</b><small>/ ${CITIES.length}</small></div>
        <div class="kstat">${ic('coin', 40)}<b>${fmtRate(totalRate())}</b><small>/초</small></div>
        <button class="btn collect" id="mapCollect" ${totalStored() ? '' : 'disabled'}>${ic('coin', 40)}${fmtBig(totalStored())}</button>
        <button class="kfootbtn ${state.footprintOn ? 'on' : ''}" id="mapFoot" aria-label="발자국 기록">${ic('foot', 40)}</button>
        <button class="round close" data-close>${ic('x', 44)}</button>`}
      </header>
      <div class="kmap-body">
        <div class="kmap" style="width:${MAP_COLS * cell}px;height:${MAP_ROWS * cell}px">${tiles}</div>
        <aside class="kside" id="kside"></aside>
      </div>
    </div>`, 'full');
  overlay.querySelectorAll('[data-region]').forEach(b => b.addEventListener('click', () => {
    mapRegion = b.dataset.region; sfx.tap();
    overlay.querySelectorAll('.ktile').forEach(t => t.classList.toggle('sel', t === b));
    renderRegion();
  }));
  const mc = $('#mapCollect');
  if (mc) mc.addEventListener('click', e => {
    const n = collectAll(); if (!n) return;
    const c = centerOf(e.currentTarget); sfx.pop(); fly('coin', c, $('#resGold'), 8);
    mc.disabled = true; mc.innerHTML = ic('coin', 40) + '0'; renderRegion();
  });
  const mf = $('#mapFoot');
  if (mf) mf.addEventListener('click', () => { setFootprints(!state.footprintOn); mf.classList.toggle('on', state.footprintOn); sfx.tap(); renderRegion(); });
  renderRegion();
}
function renderRegion() {
  const r = REGION_BY_ID[mapRegion], st = regionStats(r), price = openPrice(), picking = !state.homePicked;
  const chips = r.cityIds.map(id => {
    const own = state.cities[id], foot = state.footprints[id], fresh = state.footNew.includes(id);
    if (own) {
      const stored = cityStored(id);
      return `<button class="kcity own ${id === state.cur ? 'cur' : ''}" data-city="${id}">
        <b>${id === state.home ? ic('home', 28) : ''}${cityName(id)}</b>
        <small>${GRADES[cityGrade(id)].name} · ${fmtRate(cityRate(id))}/초</small>
        ${stored >= CFG.STOCK_SHOW ? `<i class="kbadge ${cityFull(id) ? 'full' : ''}">${ic('coin', 24)}${fmtBig(stored)}</i>` : ''}
      </button>`;
    }
    return `<button class="kcity ${fresh ? 'fresh' : ''}" data-city="${id}">
      <b>${cityName(id)}</b>
      <small>${picking ? '무료' : `${ic('crate', 26)}${price}`}${foot != null ? ` · ${ic('foot', 24)}` : ''}</small>
    </button>`;
  }).join('');
  $('#kside').innerHTML = `
    <div class="kside-head"><h3>${r.name}</h3>${r.cityIds.length > 1 ? `<span>${st.owned} / ${st.total}</span>` : ''}
      <span class="klocal" style="--lc:${r.local.color}"><i>${r.local.mark}</i>${r.local.name}</span>
      ${st.foot ? `<span class="kf">${ic('foot', 30)}${st.foot}</span>` : ''}</div>
    <div class="kcities">${chips}</div>
    ${!picking && Object.keys(state.footprints).length ? '<button class="linkbtn" id="footClear">발자국 지우기</button>' : ''}`;
  hydrateIcons($('#kside'));
  $('#kside').querySelectorAll('[data-city]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.city; sfx.tap();
    if (state.cities[id]) { enterCity(id); closeOverlay(); banner(id === state.home ? 'home' : 'map', cityName(id)); return; }
    openCityCard(id);
  }));
  const fc = $('#footClear'); if (fc) fc.addEventListener('click', () => { clearFootprints(); openMap(); });
  /* 새 발자국은 지도를 한 번 보면 '본 것'이 됩니다 */
  if (state.footNew.length) setTimeout(() => { state.footNew = []; save(); refresh(); }, 2500);
}

/* ---------- S14 도시 카드 ---------- */
function openCityCard(id) {
  const picking = !state.homePicked, price = openPrice(), foot = state.footprints[id], type = starterType(id);
  const el = document.createElement('div'); el.className = 'modal';
  const lack = Math.max(0, price - state.mat);
  el.innerHTML = `
    <div class="card citycard">
      <h3>${cityFullName(id)}</h3>
      ${foot != null ? `<div class="cc-foot">${ic('foot', 34)}지나간 곳 · ${fmtDate(foot)}</div>` : ''}
      <div class="cc-starter"><div class="th"></div><span>${facName(type, id)}<small>${REGION_BY_ID[CITY_BY_ID[id].region].name} 특산</small></span></div>
      ${picking ? '' : `
      <div class="cc-price"><span>${ic('crate', 52)}<b>${price}</b></span><small class="${lack ? 'lack' : ''}">보유 ${state.mat}</small></div>
      <div class="cc-next">다음 도시 ${ic('crate', 30)}${openPrice(ownedIds().length + 1)}</div>`}
      <div class="actions"><button class="btn ghost" id="ccNo">취소</button>
        <button class="btn primary big" id="ccOk">${picking ? '본거지로' : lack ? `${ic('crate', 36)}${lack} 부족` : '열기'}</button></div>
    </div>`;
  overlay.appendChild(el); sfx.open();
  el.querySelector('.th').appendChild(thumb('fac', type, 220, 190, 1, CITY_BY_ID[id].region));
  $('#ccNo').addEventListener('click', () => { el.remove(); sfx.tap(); });
  let armed = false;
  $('#ccOk').addEventListener('click', e => {
    if (picking) { pickHome(id); closeOverlay(); banner('home', cityName(id)); sfx.good(); placeVehicles(); return; }
    if (state.mat < price) { shakeEl(el.querySelector('.card')); sfx.deny(); return; }  // 골드로 대신할 수 없음 (GAM-035)
    if (!armed) { armed = true; e.currentTarget.textContent = '확정'; e.currentTarget.classList.add('armed'); sfx.tap(); return; }
    if (!openCity(id)) { shakeEl(el.querySelector('.card')); sfx.deny(); return; }
    el.remove(); sfx.good(); openMap(CITY_BY_ID[id].region);
    const chip = overlay.querySelector(`[data-city="${CSS.escape(id)}"]`); if (chip) chip.classList.add('born');
  });
}

/* ---------- 복귀 요약 (GAM-040) ---------- */
function openOfflineSummary() {
  const s = state.offlineSummary; if (!s || state.gear !== 'P' || overlay.hidden === false) return;
  const h = Math.floor(s.minutes / 60), m = s.minutes % 60;
  showOverlay(`<div class="card offline-card"><h2>${ic('clock', 52)} ${h ? `${fmtNum(h)}시간 ` : ''}${m}분</h2>
    <strong>${ic('coin', 64)}${fmtBig(totalStored())}</strong>
    ${s.full.length ? `<p class="full">가득 참 · ${s.full.map(cityName).join(', ')}</p>` : ''}
    <div class="actions"><button class="btn ghost" id="offLater">나중에</button><button class="btn primary big" id="offCollect">모두 거두기</button></div></div>`, 'dim');
  const done = () => { state.offlineSummary = null; save(); closeOverlay(); };
  $('#offLater').addEventListener('click', done);
  $('#offCollect').addEventListener('click', e => {
    const c = centerOf(e.currentTarget), n = collectAll(); done();
    if (n) { sfx.pop(); fly('coin', c, $('#resGold'), 8); banner('coin', `+${fmtBig(n)}`); }
  });
}

/* ---------- S16 폰 화면 한 장면 (확대 계획, D-004). 실제 연동은 없습니다 ---------- */
function renderPhone() {
  const ph = document.getElementById('phone'); if (!ph || ph.hidden) return;
  const locked = state.gear !== 'P';
  ph.querySelector('.ph-body').innerHTML = locked
    ? `<div class="ph-lock">${ic('steering', 64)}<b>차가 주행 중이에요</b><span>주차 후 이어가요</span></div>`
    : `<div class="ph-stat"><span>${ic('map', 30)}${ownedIds().length}</span><span>${ic('coin', 30)}${fmtBig(state.gold)}</span><span>${ic('crate', 30)}${state.mat}</span></div>
       <button class="ph-collect" id="phCollect" ${totalStored() ? '' : 'disabled'}>${ic('coin', 34)} 모두 거두기 ${fmtBig(totalStored())}</button>
       <ul class="ph-list">${ownedIds().map(id => `<li><b>${cityName(id)}</b><span>${fmtBig(cityStored(id))}</span></li>`).join('')}</ul>
       <div class="ph-car">${ic('crate', 30)}<span>도시 열기 · 단계 돌파<br><b>차에서 할 수 있어요</b></span></div>`;
  const b = ph.querySelector('#phCollect'); if (b) b.addEventListener('click', () => { const n = collectAll(); if (n) { banner('phone', `+${fmtBig(n)}`); sfx.coin(2); } });
}

/* ---------- 버튼과 상태 반응 ---------- */
$('#btnTown').addEventListener('click', () => { sfx.tap(); nextGoal().act(); });
$('#btnLand').addEventListener('click', () => startLand('buy'));
$('#btnHome').addEventListener('click', () => { enterCity(state.home); banner('home', cityName(state.home)); sfx.tap(); });
$('#btnMap').addEventListener('click', () => openMap());
$('#cityChip').addEventListener('click', () => openMap(CITY_BY_ID[state.cur].region));
$('#btnCollectAll').addEventListener('click', () => {
  const n = collectAll(); if (n) { banner('coin', `+${fmtBig(n)}`); sfx.coin(3); }
});
// 포커스된 버튼·이전 이벤트로도 주행 중 조작을 통과하지 못합니다.
['click', 'pointerdown', 'keydown'].forEach(event => stage.addEventListener(event, e => {
  if (state.gear !== 'P') { e.stopImmediatePropagation(); e.preventDefault(); }
}, true));
on('change', updateTownUI);
on('reset', () => { wallMark = Date.now(); mapRegion = null; updateTownUI(); setTimeout(() => openMap(), 300); });
on('gear', () => {
  if (state.gear !== 'P') { $('#voice').hidden = true; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  else if (state.offlineSummary) openOfflineSummary();
  renderPhone();
});
on('gradeUp', e => setTimeout(() => { banner('star', `${cityName(e.city)} · ${GRADES[e.grade].name}`); sfx.good(); }, 600));
on('cityOpened', id => banner('map', `${cityName(id)} · ${GRADES[0].name}`));
on('afterDelivery', () => { const g = nextGoal(); if (g.icon === 'star' || g.icon === 'map') bumpEl($('#btnTown')); });

restoreEconomy(); wallMark = Math.max(Date.now(), state.savedAt); R.clock = state.clock; refresh(); updateTownUI();
if (!state.homePicked) setTimeout(() => openMap(), 300);
else if (state.offlineSummary) openOfflineSummary();
setInterval(() => {
  const now = Date.now(), elapsed = Math.max(0, now - wallMark); wallMark = Math.max(wallMark, now);
  if (elapsed > 0) advance(elapsed / 60000);
}, 1000);
window.addEventListener('pagehide', save);
