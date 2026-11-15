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
 const RAIL={nav:'navi',source:'source',driving:'gear',weather:'weather'};
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
click('[data-action=record-trip]');click('[data-visit-place=p1]');click('[data-visit-date="2026-11-14"]');click('[data-visit-next]');assert($('[data-visit-next]').disabled);
click('[data-visit-comp=solo]');click('[data-visit-next]');click('[data-visit-next]');assert.equal(w.inspect().visits.length,before);
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
