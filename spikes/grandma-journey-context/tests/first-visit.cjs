// First-visit day flow (SC-01~07), driving block, navigation failure, scene hash entry and the demo rail.
const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
function harness(url='',saved){
 const dom=new JSDOM(source('index.html'),{url:'https://journey.test/'+url,runScripts:'outside-only'}),w=dom.window;
 w.structuredClone=structuredClone;
 w.HTMLDialogElement.prototype.show=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 if(saved)w.localStorage.setItem('journey-context-demo-v1',JSON.stringify(saved));
 const responses=[],timeout=w.setTimeout.bind(w);
 w.setTimeout=(fn,ms,...args)=>ms===800?(responses.push(fn),responses.length):timeout(fn,ms,...args);
 w.eval(source('core.js'));
 w.eval(source('trip.js')+'\n'+source('app.js')+'\nwindow.inspect=()=>structuredClone(state);window.mutate=f=>{f(state);render();};');
 const $=s=>w.document.querySelector(s),all=s=>[...w.document.querySelectorAll(s)];
 const click=s=>{assert($(s),'Missing '+s);assert(!$(s).disabled,'Disabled '+s);$(s).click();};
 const rail=(name,value)=>click(`#labRail [data-rail=${name}]`+(value?`[data-value="${value}"]`:''));
 const S=()=>w.inspect(),F=()=>w.inspect().first,now=()=>$('#nowCard').textContent;
 return {dom,w,$,all,click,rail,responses,S,F,now};
}

// 1. Whole day: memory → promise → plan → approval → departure → leg 1 → companion → leg 2 → back home → record.
{
 const {dom,$,all,click,rail,responses,S,F,now}=harness();
 assert.equal(F().stage,'none');assert(now().includes('남길 기억이 있나요'));assert.equal(S().location,'cafe');
 const visits=S().visits.length;
 click('#nowCard [data-view=memo]');assert.equal(S().view,'memo');
 // Microphone only on press; nothing is heard before the button.
 assert.equal(F().memo.heard,false);assert(!$('[data-memo=use]'));
 click('[data-memo=listen]');assert(F().memo.said.includes('가보고 싶대'));click('[data-memo=use]');
 assert.equal(all('[data-memo-place]').length,3);assert($('[data-memo=next]').disabled);
 click('[data-memo-place=p10]');click('[data-memo=next]');assert($('[data-memo=save]').disabled);
 click('[data-memo-who=grandma]');click('[data-memo=save]');
 assert.equal(F().stage,'saved');assert.deepEqual([F().promise.place,F().promise.who],['p10','grandma']);assert.equal(S().view,'promise');assert($('#promise').textContent.includes('아직 가지 않음'));
 click('#promise [data-view=plan]');assert($('#plan').textContent.includes('집 → 할머니 댁 → 바다 카페 → 집'));assert($('#plan').textContent.includes('주차미확인'));
 click('[data-plan-day=sun1]');click('[data-plan-time="10:30"]');click('#plan [data-view=approve]');
 assert($('[data-check=hvac]').disabled);assert.equal(F().checks.route,false);click('[data-check=route]');
 click('[data-first=confirm]');
 assert.equal(F().stage,'planned');assert.equal(F().trip,'today');assert.equal(S().today,'2026-11-08');assert.equal(S().clock,'10:02');assert.equal(F().leg1,'idle');assert.equal(F().checks.share,false);
 assert(now().includes('오늘 10:30 할머니와 바다 카페'));
 click('#nowCard [data-view=prep]');assert($('#prep').textContent.includes('주유소를 들를까요'));
 click('[data-first=fuel-add]');assert($('#prep .leg-card').textContent.includes('주유소'));
 click('[data-first=apply-leg1]');assert.equal(F().leg1,'wait');assert(!$('#prep').textContent.includes('적용됨'));
 responses.shift()();assert.equal(F().leg1,'ok');assert($('#prep').textContent.includes('적용됨 · 내비 응답 확인'));
 rail('gear','drive');assert.equal(F().trip,'leg1');assert(!$('#driveView').hidden);assert($('#driveView').textContent.includes('할머니 댁까지 20분'));assert($('main').inert);
 rail('gear','park');assert.equal(F().trip,'atGrandma');assert.equal(S().location,'grandma');assert(now().includes('할머니 댁 앞에 정차'));assert.equal(F().companion,null);
 // The door is evidence only: it opens a question, it never sets the companion.
 rail('door');assert(now().includes('할머니와 함께 출발하시나요'));assert(now().includes('관측: 도어 열림 → 닫힘'));assert.equal(F().companion,null);
 click('#nowCard [data-view=board]');assert(!$('[data-first=apply-leg2]'));click('[data-board=yes]');assert.equal(F().companion,'yes');
 click('[data-first=apply-leg2]');responses.shift()();assert.equal(F().leg2,'ok');
 rail('gear','drive');assert.equal(F().trip,'leg2');assert($('#driveView').textContent.includes('바다 카페까지 25분. 할머니가 가보고 싶다고 하신 곳이에요.'));
 rail('gear','park');assert.equal(F().trip,'atPlace');assert(now().includes('근처에 정차했어요'));
 rail('gear','drive');rail('gear','park');assert.equal(F().trip,'back');assert(now().includes('바다 카페에 다녀오셨나요'));assert(now().includes('정차 1시간 15분'));
 // A long stop is not a visit: nothing is recorded until the final save.
 assert.equal(S().visits.length,visits);
 click('[data-first=record]');assert($('[data-trip-visited]'));click('[data-trip-visited]');
 assert($('[data-visit-date="2026-11-08"]').getAttribute('aria-pressed')==='true');click('[data-visit-next]');
 assert.equal($('[data-visit-comp=grandma]').getAttribute('aria-pressed'),'true');click('[data-visit-next]');
 click('[data-visit-note="1"]');click('[data-visit-next]');assert($('#modalBody').textContent.includes('할머니와 함께'));assert.equal(S().visits.length,visits);
 click('[data-visit-save]');
 const v=S().visits.at(-1);assert.deepEqual([v.place,v.date,v.companions[0],v.note],['p10','2026-11-08','grandma','할머니가 좋아하셨어요']);
 assert.equal(F().stage,'done');assert($('[data-action=prepare-trip]'),'After the first visit the revisit card continues.');
 dom.window.close();
}

// 2. Driving and unknown vehicle state block screen input; the rail still works.
{
 const {dom,$,rail,S,w}=harness('#SC-04');
 assert.equal(S().vehicleState,'drive');assert(!$('#driveView').hidden);assert($('.side-nav').inert);
 const before=S().view;$('.side-nav [data-view=memory]').click();$('#homeShortcuts [data-view=memo]').click();
 assert.equal(S().view,before);assert($('#toast').textContent.includes('주행 중'));assert(!$('#modal').open);
 rail('gear','unknown');assert($('#driveView').hidden);assert($('main').inert);$('#homeShortcuts [data-view=memo]').click();assert.equal(S().view,'home');
 rail('gear','park');$('#homeShortcuts [data-view=memo]').click();assert.equal(S().view,'memo');
 dom.window.close();
}

// 3. Navigation failure keeps the plan; "적용됨" only after a successful response; stale responses are ignored.
{
 const {dom,$,click,rail,responses,F}=harness('#SC-03');
 const plan=JSON.stringify([F().plan,F().checks,F().promise]);
 rail('navi','error');click('#nowCard [data-view=prep]');click('[data-first=apply-leg1]');responses.shift()();
 assert.equal(F().leg1,'fail');assert($('#prep').textContent.includes('계획은 그대로예요'));assert.equal(F().stage,'planned');assert.equal(F().trip,'today');assert.equal(JSON.stringify([F().plan,F().checks,F().promise]),plan);
 rail('navi','success');assert.equal($('[data-first=apply-leg1]').textContent,'다시 적용');click('[data-first=apply-leg1]');
 const stale=responses.shift();rail('gear','drive');rail('gear','park');stale();assert.notEqual(F().leg1,'ok');
 dom.window.close();
 // Without route approval the leg cannot be applied.
 const b=harness('#SC-03');b.click('#nowCard [data-view=prep]');b.click('#prep [data-view=home]');b.click('#homeShortcuts [data-view=promise]');b.click('#promise [data-view=prep]');
 b.w.mutate(s=>{s.first.checks.route=false;});assert(!b.$('[data-first=apply-leg1]'));assert(b.$('#prep').textContent.includes('승인하지 않았어요'));b.dom.window.close();
}

// 4. Scene hash entry (#SC-01~#SC-08) overrides saved state and is not exposed in the UI.
{
 const expect={'SC-01':s=>s.first.stage==='none'&&s.view==='home','SC-02':s=>s.first.stage==='saved'&&s.view==='promise','SC-03':s=>s.first.trip==='today'&&s.vehicleState==='park','SC-04':s=>s.first.trip==='leg1'&&s.vehicleState==='drive','SC-05':s=>s.first.trip==='atGrandma'&&!!s.first.doorAt&&s.first.companion===null,'SC-06':s=>s.first.trip==='leg2'&&s.vehicleState==='drive','SC-07':s=>s.first.trip==='back'&&s.vehicleState==='park','SC-08':s=>s.first.stage==='done'&&s.destinationPlace==='p2'&&s.visits.some(v=>v.place==='p10')};
 const saved=harness('#SC-07').S();
 for(const [id,ok]of Object.entries(expect)){const h=harness('?embed=1#'+id,saved);assert(ok(h.S()),id);h.dom.window.close();}
 const h=harness('#SC-01');h.w.location.hash='#SC-05';h.w.dispatchEvent(new h.w.HashChangeEvent('hashchange'));assert(h.now().includes('함께 출발하시나요'));h.dom.window.close();
}

// 5. The rail lives outside the vehicle screen and holds vehicle-state controls only.
{
 const {dom,$,all,rail,S}=harness('#SC-05');
 assert($('#labRail'));assert(!$('#vehicleDisplay').contains($('#labRail')));
 assert(!all('#labRail [data-scene]').length);assert(!/SC-\d/.test($('#labRail').textContent));
 assert.deepEqual([...new Set(all('#labRail button').map(b=>b.dataset.rail))].sort(),['door','fuel','gear','location','navi','reset','source','weather']);
 assert($('#labRail').textContent.includes('가상 데이터'));
 assert(!$('#demoBtn'));assert(!$('#demoForm'));assert.deepEqual(all('.lab-actions button').map(b=>b.id||b.dataset.view),['knowledge','exportBtn','fullscreenBtn']);
 assert(source('trip.css').includes('.embedded .lab-rail{display:none}'));
 rail('fuel','20');assert.equal(S().fuel,20);assert.equal($('[data-rail=fuel][data-value="20"]').getAttribute('aria-pressed'),'true');
 rail('weather','rain');rail('source','failed');rail('location','home');assert.deepEqual([S().weather,S().sourceState,S().location],['rain','failed','home']);
 rail('reset');assert.equal(S().first.stage,'none');assert.equal(S().fuel,40);assert.equal(S().visits.length,2);
 dom.window.close();
}
console.log('PASS: first-visit day flow (memory → promise → plan → approval → legs → companion → record), door as evidence only, stop ≠ visit, driving/unknown input block, navigation failure keeps the plan, stale responses, scene hash entry, rail outside the screen with vehicle controls only.');
