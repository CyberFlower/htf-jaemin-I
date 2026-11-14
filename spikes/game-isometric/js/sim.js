'use strict';
/* 게임 화면 밖의 차량 시뮬레이터.
   실제 차량에서는 Vehicle SDK·AAOS 신호가 하는 일을 버튼으로 대신 넣습니다. 게임 규칙은 건드리지 않습니다. */
(function () {
  const q = s => document.querySelector(s);

  document.querySelectorAll('#simGear button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.v === state.gear) return;
    if (b.dataset.v === 'D') startTrip(); else endTrip();
  }));

  const bindRange = (id, key, out, unit) => {
    const el = q(id);
    el.addEventListener('input', () => { state.sim[key] = +el.value; q(out).textContent = el.value + unit; save(); checkRestTrigger(); });
  };
  bindRange('#sKm', 'km', '#oKm', ' km');
  bindRange('#sMin', 'min', '#oMin', '분');

  document.querySelectorAll('.step').forEach(row => row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const k = row.dataset.k;
    state.sim[k] = Math.max(0, Math.min(20, state.sim[k] + +b.dataset.d));
    save(); sync();
  })));

  document.querySelectorAll('#simOil button').forEach(b => b.addEventListener('click', () => setOilPreset(b.dataset.v)));

  q('#simTire').addEventListener('click', () => setWarn('tire', !state.warn.tire));
  q('#simHeat').addEventListener('click', () => setWarn('heat', !state.warn.heat));

  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => advance(+b.dataset.add)));
  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => jumpTo(b.dataset.jump === 'next' ? 'next' : +b.dataset.jump)));

  q('#simReset').addEventListener('click', resetState);

  function sync() {
    document.querySelectorAll('#simGear button').forEach(b => b.classList.toggle('on', b.dataset.v === state.gear));
    q('#simOdo').textContent = fmtNum(state.odo);
    q('#sKm').value = state.sim.km; q('#oKm').textContent = state.sim.km + ' km';
    q('#sMin').value = state.sim.min; q('#oMin').textContent = state.sim.min + '분';
    document.querySelectorAll('.step').forEach(row => { row.querySelector('b').textContent = state.sim[row.dataset.k]; });
    const l = oilLeft();
    q('#simOilKm').textContent = fmtNum(l.km); q('#simOilDay').textContent = l.days;
    const oilState = state.oil.quest ? 'due' : l.km <= 1500 || l.days <= 30 ? 'soon' : 'ok';
    document.querySelectorAll('#simOil button').forEach(b => b.classList.toggle('on', b.dataset.v === oilState));
    q('#simTire').classList.toggle('on', state.warn.tire);
    q('#simHeat').classList.toggle('on', state.warn.heat);
    q('#simDate').textContent = fmtDate(dayOf(state.clock)) + ' ' + fmtClock(state.clock);
  }
  on('change', sync); on('reset', sync);
  sync();
})();
