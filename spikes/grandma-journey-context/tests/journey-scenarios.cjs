const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../src');
function harness(saved,search=''){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://journey.test/'+search,runScripts:'outside-only'}),w=dom.window;
 w.structuredClone=structuredClone;
 w.HTMLDialogElement.prototype.show=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 if(saved)w.localStorage.setItem('journey-context-demo-v1',JSON.stringify(saved));
 const responses=[],timeout=w.setTimeout.bind(w);
 w.setTimeout=(fn,ms,...args)=>ms===800?(responses.push(fn),responses.length):timeout(fn,ms,...args);
 w.eval(fs.readFileSync(path.join(root,'core.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'trip.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'app.js'),'utf8')+'\nwindow.inspect=()=>structuredClone(state);window.seedVisits=visits=>{state.visits=visits;render();};');
 const $=s=>w.document.querySelector(s);
 const click=s=>{assert($(s),'Missing '+s);assert(!$(s).disabled,'Disabled '+s);$(s).click();};
 const change=(s,value)=>{$(s).value=value;$(s).dispatchEvent(new w.Event('change',{bubbles:true}));};
 // Demo rail buttons outside the vehicle screen replace the former settings dialog.
 const RAIL={nav:'navi',source:'source',driving:'gear',weather:'weather',ai:'ai'};
 const scenario=fields=>{for(const [key,value]of Object.entries(fields))click(`[data-rail=${RAIL[key]}][data-value=${value}]`);};
 return {dom,w,$,click,change,scenario,responses};
}
// SC-08 starts the revisit journey after the first visit was recorded.
const {dom,w,$,click,change,scenario,responses}=harness(null,'#SC-08');
assert(!$('#home').classList.contains('hidden'));
click('[data-action=prepare-trip]');

assert($('#memoryPrompt').textContent.includes('파도 서가'));assert($('#memoryPrompt').textContent.includes('이번에도'));
// Same area is insufficient: an unvisited destination must not expose another place's companion.
click('#exactDestination');click('[data-destination=p1]');assert(!$('#memoryPrompt').textContent.includes('이번에도'));
assert.equal(w.inspect().companion,'unknown');
click('#exactDestination');click('[data-destination=p2]');click('[data-comp=mom]');
assert.equal(w.inspect().companion,'mom');assert.equal(w.inspect().visits.length,3);
// Exclusion and the most recent actual companion both affect the question.
const original=w.inspect().visits;
w.seedVisits(original.map(v=>({...v,use:false})));click('#exactDestination');click('[data-destination=p2]');assert(!$('#memoryPrompt').textContent.includes('이번에도'));
w.seedVisits([...original,{id:'new',place:'p2',date:'2026-11-14',companions:[],note:'혼자 다녀옴',use:true}]);assert(!$('#memoryPrompt').textContent.includes('이번에도'));
w.seedVisits(original);assert($('#memoryPrompt').textContent.includes('이번에도'));
click('[data-comp=solo]');assert.equal(w.inspect().companion,'solo');
// Explicit theme filtering uses fictional data; no official 100×100 membership claim.
click('#themeBtn');assert($('#modalBody').textContent.includes('아직 연결되지'));
click('[data-theme=local]');assert.equal($('#resultCount').textContent,'1');assert($('#cards').textContent.includes('항구의 부엌'));
click('#tripSettings');click('#themeBtn');click('[data-theme=all]');
// Two waypoints plus the final destination; adding candidates never records a visit.
function add(id){click('[data-view=mapView]');click(`#map [data-detail=${id}]`);click(`[data-add=${id}]`);}
add('p1');add('p3');const before=w.inspect().visits.length;
add('p4');assert.equal(w.inspect().route.length,2);click('[data-action=close]');
click('#routeBtn');assert.equal(w.inspect().navigation,null);assert($('#modalBody').textContent.includes('파도 서가'));
click('[data-action=approve-route]');assert.equal(w.inspect().navigation.status,'pending');assert.equal(w.inspect().visits.length,before);
click('[data-action=close]');responses.shift()();assert.equal(w.inspect().navigation,null);assert.equal(w.inspect().visits.length,before);
// Failure preserves the plan; retry requires another explicit approval.
scenario({nav:'error'});click('#routeBtn');click('[data-action=approve-route]');responses.shift()();
assert.equal(w.inspect().navigation.status,'error');assert.equal(w.inspect().route.length,2);assert($('#modalBody').textContent.includes('확인하지 못했어요'));
click('[data-action=review-route]');assert.equal(w.inspect().navigation.status,'error');click('[data-action=close]');
scenario({nav:'success'});click('#routeBtn');click('[data-action=approve-route]');responses.shift()();
assert.equal(w.inspect().navigation.status,'applied');assert.equal(w.inspect().visits.length,before);assert(!$('#home').classList.contains('hidden'));
click('[data-action=finish-trip]');assert.equal(w.inspect().tripPhase,'review');assert.equal(w.inspect().visits.length,before);
click('[data-action=record-trip]');assert($('[data-visit-save]').disabled);click('[data-visit-place=p1]');assert($('[data-visit-save]').disabled);
click('[data-visit-comp=solo]');assert.equal(w.inspect().visits.length,before);
click('[data-visit-save]');assert.equal(w.inspect().visits.length,before+1);assert.equal(w.inspect().tripPhase,'recorded');assert($('#nowCard').textContent.includes('기억을 남겼어요'));
// Source outage preserves memories and plan, shows only saved places and can recover.
scenario({source:'failed'});click('[data-view=explore]');assert(!$('#sourceBanner').hidden);assert.equal($('#resultCount').textContent,'3');assert.equal(w.inspect().route.length,2);
change('#destination','청초호');assert.equal($('#resultCount').textContent,'0');assert($('#cards .empty'));assert.equal(w.inspect().destinationPlace,null);assert(!$('#memoryPrompt').textContent.includes('이번에도'));
scenario({source:'ready'});assert.equal($('#resultCount').textContent,'3');
// Unknown vehicle status blocks actions, including trip preparation, just like driving.
scenario({driving:'unknown'});const view=w.inspect().view;click('[data-view=home]');assert.equal(w.inspect().view,view);assert($('main').inert);assert($('#vehicleDisplay').classList.contains('is-unknown'));
scenario({driving:'park'});click('[data-view=home]');assert.equal(w.inspect().view,'home');
// A response from a cancelled request cannot complete a newer request.
click('[data-action=prepare-trip]');click('#exactDestination');click('[data-destination=p7]');click('#routeBtn');click('[data-action=approve-route]');const stale=responses.shift();click('[data-action=close]');
click('#routeBtn');click('[data-action=approve-route]');stale();assert.equal(w.inspect().navigation.status,'pending');responses.shift()();assert.equal(w.inspect().navigation.status,'applied');
const saved=w.inspect();dom.window.close();
// Legacy v1 state keeps personal data, but an area is not silently upgraded to a place.
delete saved.destinationPlace;saved.destination='청초호';saved.route=['p7','p8','p9'];
const old=harness(saved);assert.equal(old.w.inspect().destinationPlace,null);assert.equal(old.w.inspect().route.length,3);assert.equal(old.w.inspect().visits.length,before+1);old.click('#routeBtn');assert(old.$('[data-action=approve-route]').disabled);old.dom.window.close();
console.log('PASS: home journey, exact-place memory, exclusion/latest companion, theme provenance, waypoint limit, explicit approval, pending/cancel/error/success, stale responses, no automatic visits, source failure/recovery, unknown vehicle guard, legacy state.');

// 내 AI 연결 (demo): voice-first trip settings, connection, research, sourced picks, consent, fallback, no AI while driving.
{
 const {dom,w,$,click,scenario}=harness(null,'#SC-08'),all=s=>[...w.document.querySelectorAll(s)],S=()=>w.inspect();
 click('[data-action=prepare-trip]');click('#settings [data-view=explore]');
 assert.equal(S().ai.stage,'idle');assert(!$('.ai-card'));assert.equal(all('.place-card').length,2);assert($('#aiBar').textContent.includes('내 AI'));
 click('#tripSettings');click('#tripVoice');assert.equal(S().companion,'mom');assert($('#tripVoiceCopy').textContent.includes('파도 서가'));assert($('#tripVoiceCopy').textContent.includes('어머니와 함께'));
 click('#aiChip');assert($('[data-ai-confirm]').disabled);click('[data-ai-pick=claude]');click('[data-ai-confirm]');assert.equal(S().ai.provider,'claude');
 // The connected card leads straight to the recommendations.
 click('#aiLink [data-view=explore]');assert.equal(S().view,'explore');assert.equal(S().ai.stage,'research');assert($('.ai-research'));
 // Sent conditions come only from chosen/confirmed preferences, never from the relationship name.
 {const sent=$('.ai-sent b').textContent;assert(!/어르신|어머니|할머니/.test(sent),'no tag derived from the relationship name: '+sent);assert(sent.includes('걷기 편함'),'confirmed companion preference is sent: '+sent);}assert($('.ai-research').textContent.includes('대한민국 명소발굴 추천지'));
 assert(!/100×100/.test($('#vehicleDisplay').textContent),'Screens say 대한민국 명소발굴 추천지, not 100×100');
 w.aiResearchDone();assert.equal(all('.ai-card').length,2);assert(all('.ai-card').every(c=>c.textContent.includes('정리한 이유')&&c.querySelector('.src.q')));
 // A follow-up preference is stored only with consent.
 click('[data-ai-ask]');assert($('#modalBody').textContent.includes('따뜻한 차'));click('[data-ai-once]');assert.equal(S().profile.likes.length,0);assert.equal($('.ai-card strong').textContent,'흰돌 정원');
 click('[data-ai-ask]');click('[data-ai-keep]');assert.equal(S().profile.likes.length,1);assert.equal(S().profile.likes[0].who,'mom');
 // While driving no AI step starts; a running one is cancelled.
 scenario({ai:'fail'});assert.equal(S().ai.stage,'research');scenario({driving:'drive'});assert.equal(S().ai.stage,'idle');w.aiResearchDone();assert.equal(S().ai.stage,'idle');
 assert($('#driveView').textContent.includes('내 AI에도 묻지 않아요'));
 // AI failure falls back to the rule-based cards.
 scenario({driving:'park'});assert.equal(S().ai.stage,'research');w.aiResearchDone();assert(!$('.ai-card'));assert.equal(all('.place-card').length,2);assert($('#aiBar').textContent.includes('기본 추천'));
 // Disconnect returns to the plain recommendations.
 click('#aiChip');click('[data-ai-disconnect]');assert.equal(S().ai.provider,null);dom.window.close();
}
console.log('PASS: 내 AI 연결 — voice-first trip settings, demo connection, research step, sourced picks with unknowns, consent-only preference, failure fallback, no AI while driving.');

// Embedded submission frames must use the full 16:9 surface without preview margins.
const embed=harness(null,'?embed=1'),ew=embed.w;
Object.defineProperties(embed.$('#displayStage'),{clientWidth:{value:1920},clientHeight:{value:1080}});
ew.eval(fs.readFileSync(path.join(root,'display.js'),'utf8'));
assert(ew.document.documentElement.classList.contains('embedded'));
assert.equal(embed.$('#vehicleDisplay').style.transform,'scale(1.5)');
assert.equal(embed.$('#displaySizer').style.width,'1920px');
assert.equal(embed.$('#displaySizer').style.height,'1080px');
embed.dom.window.close();
console.log('PASS: embedded 1920×1080 vehicle canvas without preview margins.');
