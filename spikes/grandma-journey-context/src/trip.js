// First-visit day flow (GRD SC-01~07) and the demo rail. Local demonstration only:
// no Pleos SDK, microphone, location, door, navigation or network access.
// Loaded before app.js; functions read the shared `state` at call time.
const PEOPLE={grandma:'할머니',mom:'어머니',unknown:'미확인'};
const PLAN_DAYS={sun1:{label:'이번 일요일',date:'2026-11-08'},sun2:{label:'다음 주 일요일',date:'2026-11-15'}};
const PLAN_TIMES=['10:00','10:30','11:00'];
const NEARBY={cafe:[['p10','120m'],['p11','260m'],['p12','400m']]};
const LOCATIONS={home:'집',grandma:'할머니 댁',cafe:'바다 카페 근처'};
const TRIP_VIEWS=['memo','promise','plan','approve','prep','board'];
const DRIVING_LEGS=['leg1','leg2','return'];
const SAID_SAMPLE='할머니가 저 카페 가보고 싶대';
const FIRST_VISIT={id:'v3',place:'p10',date:'2026-11-08',companions:['grandma'],note:'할머니가 좋아하셨어요',use:true};
// Minutes from the planned departure time. Demo values, not navigation estimates.
const CLOCK={prep:-28,leg1:-18,atGrandma:2,leg2:10,atPlace:35,return:110,back:160};
function freshFirst(){return {stage:'none',promise:null,plan:{day:'sun1',time:'10:30'},checks:{route:false,hvac:false,share:false},fuelStop:null,leg1:'idle',leg2:'idle',companion:null,doorAt:null,trip:'none',stopMin:null,memo:{step:0,heard:false,said:'',place:null,who:null}};}
function freshVehicle(){return {fuel:40,location:'cafe',doorAt:null,today:'2026-11-07',clock:'15:40'};}
function defaultPromise(){return {place:'p10',who:'grandma',said:SAID_SAMPLE,at:'11월 7일 15:40 · 바다 카페 근처 정차 중'};}
function addMinutes(hhmm,min){const [h,m]=hhmm.split(':').map(Number),t=(h*60+m+min+1440)%1440;return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function roJosa(w=''){const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<11172&&c%28&&c%28!==8?'으로':'로';}
function hasPickup(f=state.first){return f.promise?.who==='grandma';}
function tripClock(key,s=state){const f=s.first,off=hasPickup(f)?CLOCK[key]:({leg2:CLOCK.leg1,atPlace:CLOCK.leg1+25,return:CLOCK.leg1+100,back:CLOCK.leg1+150})[key]??CLOCK[key];return addMinutes(f.plan.time,off);}
function promisePlace(f=state.first){return place(f.promise?.place);}
function whoName(f=state.first){return PEOPLE[f.promise?.who]||PEOPLE.unknown;}
function withWho(f=state.first){return f.promise?.who&&f.promise.who!=='unknown'?whoName(f)+'와':'함께 갈 사람 미정 ·';}
function routeStops(f=state.first){return ['집',...(hasPickup(f)?['할머니 댁']:[]),promisePlace(f)?.name||'목적지','집'];}
function planLabel(f=state.first){return PLAN_DAYS[f.plan.day].label+' '+f.plan.time;}
function durationText(min){return min>=60?`${Math.floor(min/60)}시간${min%60?' '+min%60+'분':''}`:min+'분';}
function icon(kind){return ({mic:'<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><rect x="8.5" y="3" width="7" height="12" rx="3.5" fill="currentColor"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',speaker:'<svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'})[kind];}

// Scene start states for the mockup frame (#SC-01~#SC-08). Not exposed in the UI.
function scenePreset(id){
 const n=Number(id.slice(3)),s=freshState(),f=s.first;
 if(n===8){f.stage='done';f.promise=defaultPromise();s.visits.push({...FIRST_VISIT});Object.assign(s,{today:'2026-11-14',clock:'10:30',location:'home'});return s;}
 if(n===1)return s;
 f.stage='saved';f.promise=defaultPromise();
 if(n===2){s.view='promise';s.clock='15:42';return s;}
 f.stage='planned';f.checks.route=true;f.trip='today';Object.assign(s,{today:PLAN_DAYS.sun1.date,location:'home',clock:tripClock('prep',s)});
 if(n===3)return s;
 f.leg1='ok';
 if(n===4){f.trip='leg1';Object.assign(s,{vehicleState:'drive',driving:true,clock:tripClock('leg1',s)});return s;}
 f.trip='atGrandma';Object.assign(s,{location:'grandma',clock:tripClock('atGrandma',s)});f.doorAt=s.clock;
 if(n===5)return s;
 f.companion='yes';f.leg2='ok';
 if(n===6){f.trip='leg2';Object.assign(s,{vehicleState:'drive',driving:true,clock:tripClock('leg2',s)});return s;}
 f.trip='back';f.stopMin=CLOCK.return-CLOCK.atPlace;Object.assign(s,{location:'home',clock:tripClock('back',s)});return s;
}
function sceneFromHash(){return (location.hash.match(/^#(SC-0[1-8])$/)||[])[1];}

// Home "지금 카드": driving > door-observed companion > today's plan > back home > saved promise / new memory.
function firstCard(){
 const f=state.first;if(f.stage==='done')return null;
 const p=promisePlace(f),pn=esc(p?.name||''),who=whoName(f);
 if(f.trip==='atGrandma'&&f.doorAt&&!f.companion)return {eyebrow:'탑승 후보 · 차량 관측',title:`${who}와 함께 출발하시나요?`,copy:`오늘 여정에 ${who}가 함께하기로 했어요. 누가 탔는지는 직접 확인해 주세요.`,basis:`관측: 도어 열림 → 닫힘 · ${f.doorAt}`,action:['확인하기','data-view="board"'],later:true,art:'house',artLabel:'할머니 댁 앞 · 정차'};
 if(f.trip==='atGrandma'){const ready=f.companion&&f.companion!=='later'&&f.leg2==='ok';return {eyebrow:'오늘 여정 · 1구간 도착',title:ready?`${pn}${roJosa(p?.name)} 출발할 준비가 됐어요`:'할머니 댁 앞에 정차했어요',copy:ready?'2구간 경로가 적용됐어요. 출발하면 주행 화면으로 바뀌어요.':`다음 구간: 할머니 댁 → ${pn}`,action:[ready?'동행·경로 다시 보기':'동행 확인','data-view="board"'],art:'house',artLabel:'할머니 댁 앞 · 정차'};}
 if(f.trip==='today')return {eyebrow:'오늘 여정',title:`오늘 ${f.plan.time} ${withWho(f)} ${pn}`,copy:`연료 ${state.fuel}% · ${state.weather==='rain'?'비':'맑음'} (${state.clock} 조회 · 시연)${f.leg1==='ok'?' · 1구간 경로 적용됨':''}`,action:['준비 점검','data-view="prep"'],art:'seacafe',artLabel:routeStops(f).join(' → ')};
 if(f.trip==='atPlace')return {eyebrow:'오늘 여정 · 목적지 근처',title:`${pn} 근처에 정차했어요`,copy:'즐거운 시간 보내세요. 다녀온 기록은 집에 돌아간 뒤에 남겨도 돼요.',action:['약속 보기','data-view="promise"'],art:'seacafe',artLabel:`${pn} 근처 · 정차`};
 if(f.trip==='back')return {eyebrow:'다녀온 뒤',title:`${pn}에 다녀오셨나요?`,copy:'오늘 여정을 기록으로 남길 수 있어요.',basis:`관측: ${pn} 근처 정차 ${durationText(f.stopMin||0)} · 방문은 직접 확인해 주세요`,action:['기록하기','data-first="record"'],later:true,art:'seacafe',artLabel:'귀가 · 주차'};
 if(f.stage==='saved'||f.stage==='planned')return {eyebrow:'저장한 약속',title:`${withWho(f)} 다음에 갈 곳: ${pn}`,copy:f.stage==='planned'?`${planLabel(f)} 계획을 확정했어요.`:'약속으로 이번 여정을 만들 수 있어요.',action:['약속 보기','data-view="promise"'],art:'seacafe',artLabel:`${pn} · 가상 장소`};
 return {eyebrow:'지금 할 일',title:'남길 기억이 있나요?',copy:'정차 중에 한마디로 ‘다음에 갈 곳’을 남길 수 있어요.',action:[icon('mic')+' 기억 남기기','data-view="memo"'],art:'voice',artLabel:'정차 중 · 버튼을 누를 때만 들어요'};
}
function nowCardHtml(c){return askHtml({eyebrow:c.eyebrow,title:c.title,copy:c.copy,basis:c.basis,actions:`<button class="primary" ${c.action[1]}>${c.action[0]}</button>${c.later?'<button class="outline" data-first="later">나중에</button>':''}`});}
function askHtml(a){return `<div class="ask"><p class="obs">${a.eyebrow}</p><h1>${a.title}</h1>${a.copy?`<p class="ask-copy">${a.copy}</p>`:''}${a.basis?`<span class="basis">${a.basis}</span>`:''}<div class="now-actions">${a.actions}</div></div>`;}
function renderShortcuts(){const f=state.first,p=promisePlace(f);$('#homeShortcuts').innerHTML=`<button class="link" data-view="memo">${icon('mic')} 기억 남기기</button><button class="link" data-view="promise" ${p?'':'disabled'}>${p?`약속 · ${esc(p.name)} <small>${({saved:'아직 가지 않음',planned:planLabel(f),done:'다녀옴 ✓'})[f.stage]||''}</small>`:'아직 약속이 없어요'}</button><button class="link" data-view="memory">지난 발자국</button>`;}

function head(title,sub,right=''){return `<div class="trip-head"><div><h2>${title}</h2>${sub?`<p class="trip-sub">${sub}</p>`:''}</div>${right}</div>`;}
function steps(labels,on){return `<div class="steps" aria-label="단계">${labels.map((l,i)=>`<span class="${i===on?'on':''}" ${i===on?'aria-current="step"':''}>${l}</span>`).join('')}</div>`;}
function legStatus(st){return `<span class="status ${st}" role="status">${({idle:'아직 적용하지 않았어요',wait:'내비 응답 기다리는 중…',ok:'적용됨 · 내비 응답 확인',fail:'적용 실패 · 계획은 그대로예요'})[st]}</span>`;}
function legButton(leg,label){const f=state.first,st=f[leg];if(!f.checks.route)return '<button class="outline" data-view="approve">승인 다시 보기</button>';return `<button class="primary" data-first="apply-${leg}" ${st==='wait'||st==='ok'?'disabled':''}>${st==='wait'?'확인 중…':st==='ok'?'적용됨':st==='fail'?'다시 적용':label}</button>`;}
function routeLine(pts){return `<span class="route-line">${pts.map(p=>`<span class="pt">${esc(p)}</span>`).join('<span class="ar">→</span>')}</span>`;}

function renderMemo(){
 const m=state.first.memo,cands=state.sourceState==='failed'?[]:(NEARBY[state.location]||[]);let body='',dock='';
 if(m.step===0){
  body=m.heard?`<p class="trip-sub center">이렇게 들었어요</p><blockquote class="heard">“${esc(m.said)}”</blockquote><p class="demo-note">음성 인식 시연 · 마이크를 쓰지 않고 예시 문장을 보여 줘요</p>`:`<div class="mic-wrap"><button class="mic" data-memo="listen" aria-label="눌러서 말하기">${icon('mic')}</button><p class="trip-sub">버튼을 누를 때만 들어요</p><p class="demo-note">음성 인식 시연 · 실제 마이크는 쓰지 않아요</p></div>`;
  dock=m.heard?'<button class="outline" data-memo="again">다시 말하기</button><button class="primary" data-memo="use">이대로 쓰기</button>':'<button class="outline" data-memo="type">글로 쓰기</button>';
 }else if(m.step===1){
  body=cands.length?`<p class="trip-sub">지금 위치 주변의 장소예요 · 차량 위치 기준 · 시연 데이터</p><div class="pick-grid">${cands.map(([id,dist])=>{const p=place(id);return `<button class="pick ${m.place===id?'sel':''}" data-memo-place="${id}" aria-pressed="${m.place===id}"><span class="pick-art">${art(p)}</span><b>${esc(p.name)}</b><small>${dist} · ${categories[p.category]}</small></button>`;}).join('')}</div>`:`<div class="empty-state"><b>주변 장소를 찾지 못했어요</b><p>확인할 수 없는 장소는 저장하지 않아요. 정차한 곳에서 다시 찾거나 나중에 남겨 주세요.</p></div>`;
  dock=`<button class="outline" data-memo="back">← 뒤로</button>${cands.length?`<button class="primary" data-memo="next" ${m.place?'':'disabled'}>다음 →</button>`:'<button class="primary" data-memo="retry">다시 찾기</button>'}`;
 }else{
  const p=place(m.place);body=`<p class="trip-sub">누구와 다음에 갈까요?</p><div class="chips">${['grandma','mom','unknown'].map(w=>`<button class="chip person ${m.who===w?'sel':''}" data-memo-who="${w}" aria-pressed="${m.who===w}">${FACE[w]?`<b class="mini">${face(w)}</b>`:''}${w==='unknown'?'아직 몰라요':PEOPLE[w]}</button>`).join('')}</div><div class="summary-card">저장할 약속 · <b>${m.who?(m.who==='unknown'?'함께 갈 사람 미정':PEOPLE[m.who]+'와 다음에 갈 곳'):'…'}</b> · <b>${esc(p?.name)}</b></div>`;
  dock=`<button class="outline" data-memo="back">← 뒤로</button><button class="primary" data-memo="save" ${m.who?'':'disabled'}>약속 저장</button>`;
 }
 $('#memo').innerHTML=head('기억 남기기','정차 중에만 남길 수 있어요',steps(['한마디','장소','함께 갈 사람'],m.step))+`<div class="trip-body">${body}</div><div class="trip-dock"><button class="outline spacer" data-view="home">닫기</button>${dock}</div>`;
}
function renderPromise(){
 const f=state.first,p=promisePlace(f);
 if(!p){$('#promise').innerHTML=head('약속','')+'<div class="trip-body"><div class="empty-state"><b>저장한 약속이 없어요</b><p>홈에서 기억을 남기면 약속이 생겨요.</p></div></div><div class="trip-dock"><button class="outline" data-view="home">홈으로</button></div>';return;}
 const status=({saved:'아직 가지 않음',planned:planLabel(f)+' 계획 확정',done:'다녀옴 ✓'})[f.stage];
 const signed=FACE[f.promise.who]?' signed':'',who=f.promise.who==='unknown'?'함께 갈 사람 미정':whoName(f);
 $('#promise').innerHTML=`<div class="trip-head"><div><p class="trip-sub">${f.promise.who==='unknown'?'함께 갈 사람 미정 · 다음에 갈 곳':esc(whoName(f))+'와 다음에 갈 곳'}</p><h2>${esc(p.name)}</h2></div><span class="pill-status ${f.stage}">${status}</span></div><div class="trip-body promise-body"><div class="promise-note"><div class="tag big${signed}" style="--r:-2deg"><q>${esc(f.promise.said)}</q><small>남긴 때 · ${esc(f.promise.at)}</small>${signed?`<span class="sig">${face(f.promise.who)}</span>`:''}</div><dl class="facts"><dt>함께 갈 사람</dt><dd>${f.promise.who==='unknown'?'<span class="unknown">미확인</span>':esc(who)}</dd><dt>상태</dt><dd>${status}</dd></dl></div><figure class="pola big" style="--r:2deg"><span class="ph">${art(p)}</span><figcaption>${esc(p.description)}</figcaption></figure></div><div class="trip-dock"><button class="outline spacer" data-view="home">홈으로</button>${f.stage==='saved'?'<button class="primary" data-view="plan">여정 만들기</button>':f.stage==='planned'?'<button class="primary" data-view="prep">출발 준비 보기</button>':''}</div>`;
}
function renderPlan(){
 const f=state.first,p=promisePlace(f);if(!p){$('#plan').innerHTML='';return;}
 const failed=state.sourceState==='failed';
 $('#plan').innerHTML=head(`${f.promise.who==='unknown'?'':esc(whoName(f))+'와 '}${esc(p.name)}`,'여정 초안 · 확정해도 바로 실행하지 않아요')+`<div class="trip-body plan-grid"><div class="plan-pick">${f.planHeard?`<p class="plan-heard"><span>이렇게 들었어요 · 음성 인식 시연</span>“이번 일요일 열 시 반에 가자”</p>`:`<button class="mic-pill" data-plan-voice>${icon('mic')} 언제 갈지 말로 정하기</button>`}<p class="label">날짜</p><div class="chips">${Object.entries(PLAN_DAYS).map(([k,d])=>`<button class="chip ${f.plan.day===k?'sel':''}" data-plan-day="${k}" aria-pressed="${f.plan.day===k}">${d.label}<small>${dateShort(d.date)}</small></button>`).join('')}</div><p class="label">출발 시각</p><div class="chips">${PLAN_TIMES.map(t=>`<button class="chip ${f.plan.time===t?'sel':''}" data-plan-time="${t}" aria-pressed="${f.plan.time===t}">${t}</button>`).join('')}</div></div><div class="kv"><span class="k">동선</span><span>${routeStops(f).map(esc).join(' → ')}</span><span class="k">날씨</span><span>${state.weather==='rain'?'비':'맑음'} <span class="src">· 예보 · ${state.clock} 조회 · 시연 데이터</span></span><span class="k">${esc(p.name)}</span><span>${failed?'<span class="unknown">미확인</span> <span class="src">· 장소 정보를 불러오지 못했어요</span>':p.id==='p10'?'10:00~21:00 영업 <span class="src">· 장소 정보 · 시연 데이터</span>':'<span class="unknown">영업 정보 미확인</span>'}</span><span class="k">주차</span><span><span class="unknown">미확인</span> <span class="src">· 정보가 없어 추측하지 않아요</span></span></div></div><div class="trip-dock"><button class="outline spacer" data-view="promise">← 뒤로</button><button class="primary" data-view="approve">승인할 작업 확인</button></div>`;
}
function renderApprove(){
 const f=state.first,rows=[['route','내비게이션 경로 적용','출발할 때 구간마다 다시 확인한 뒤 적용해요',false],['hvac',`${whoName(f)} 자리 공조 설정`,'이 차량에서 지원 여부를 확인하지 못했어요',true],['share','가족에게 출발 소식 보내기','실제 출발 뒤 초안만 만들고, 보내기 전에 다시 물어요',false]];
 $('#approve').innerHTML=head('무엇을 실행할까요?','체크한 것만, 그 시점에 실행해요. 확정해도 지금 바로 실행하지 않아요.')+`<div class="trip-body checks">${rows.map(([k,t,why,dis])=>`<button class="check ${f.checks[k]?'on':''}" data-check="${k}" aria-pressed="${!!f.checks[k]}" ${dis?'disabled':''}><span class="box">${f.checks[k]?'✓':''}</span><span>${t}<span class="why">${why}</span></span></button>`).join('')}</div><div class="trip-dock"><button class="outline spacer" data-view="plan">← 뒤로</button><button class="primary" data-first="confirm">${f.stage==='planned'?'승인 범위 저장':'계획 확정'}</button></div>`;
}
function renderPrep(){
 const f=state.first,p=promisePlace(f);if(!p){$('#prep').innerHTML='';return;}
 const stops=['집',...(f.fuelStop==='add'?['주유소']:[]),hasPickup(f)?'할머니 댁':p.name],low=state.fuel<50;
 $('#prep').innerHTML=head('출발 준비',`오늘 ${f.plan.time} · ${withWho(f)} ${esc(p.name)}`,'<button class="outline" data-view="home">홈으로</button>')+`<div class="trip-body"><div class="prep-row"><div class="card-soft"><h3>차량 상태</h3><div class="fuel"><span>연료</span><span class="meter"><i style="width:${state.fuel}%" class="${state.fuel<30?'low':''}"></i></span><b>${state.fuel}%</b></div><p class="src">차량에서 방금 읽은 값 · 잔량만으로 도착 가능 여부는 판단하지 않아요</p></div><div class="card-soft"><h3>날씨</h3><p class="big">${state.weather==='rain'?'비':'맑음'}</p><p class="src">${state.clock} 다시 조회 · 시연 데이터</p></div></div>${low&&!f.fuelStop?`<div class="suggest"><div><b>가는 길에 주유소를 들를까요?</b><p class="src">연료가 절반보다 적어 제안해요. 결정은 직접 하세요.</p></div><button class="outline" data-first="fuel-skip">건너뛰기</button><button class="primary" data-first="fuel-add">경유 추가</button></div>`:''}<div class="leg-card"><span class="leg-name">1구간</span>${routeLine(stops)}${f.checks.route?legStatus(f.leg1):'<span class="status idle">경로 적용을 승인하지 않았어요</span>'}${legButton('leg1','1구간 경로 적용')}</div></div>`;
}
function renderBoard(){
 const f=state.first,p=promisePlace(f);if(!p){$('#board').innerHTML='';return;}
 const answered=f.companion==='yes'||f.companion==='no';
 const w=f.promise.who,yes=f.companion==='yes';
 $('#board').innerHTML=head(`${esc(whoName(f))}와 함께 출발하시나요?`,'','<button class="outline" data-view="home">홈으로</button>')+`<div class="trip-body board-body"><div class="board-main"><span class="basis">${f.doorAt?`관측: 도어 열림 → 닫힘 · ${f.doorAt}. 누가 탔는지는 직접 확인해 주세요`:'도어 관측 없음 · 동행은 직접 확인해 주세요'}</span><div class="chips">${[['yes','네, 함께 가요'],['no','아니요'],['later','나중에']].map(([k,t])=>`<button class="chip ${f.companion===k?'sel':''}" data-board="${k}" aria-pressed="${f.companion===k}">${t}</button>`).join('')}</div>${answered?`<div class="leg-card"><span class="leg-name">2구간</span>${routeLine(['할머니 댁',p.name])}${f.checks.route?legStatus(f.leg2):'<span class="status idle">경로 적용을 승인하지 않았어요</span>'}${legButton('leg2','2구간 경로 적용')}</div><p class="src">공조: 이 차량에서 지원 여부를 확인하지 못해 적용하지 않아요. ${f.companion==='no'?'예정했던 동행은 기록에 자동으로 넣지 않아요.':''}</p>`:''}</div><div class="board-pair" aria-hidden="true"><div class="light me big"><i></i><span>나</span></div>${FACE[w]?`<div class="light companion big${yes?'':' wait'}"><i>${face(w)}</i><span>${esc(whoName(f))}${yes?'':'?'}</span></div>`:''}</div></div>`;
}
function renderDrive(){
 const f=state.first,p=promisePlace(f),on=state.vehicleState==='drive';$('#driveView').hidden=!on;$('#vehicleDisplay').classList.toggle('is-drive',on);if(!on)return;
 let to='주행 중',eta='',say='주행 중에는 화면 조작을 쉬어요. 정차 후 이어갈 수 있어요.',cur=-1;
 const stops=routeStops(f);
 if(f.trip==='leg1'){to='할머니 댁';eta='20분';say='할머니 댁까지 20분 남았어요.';cur=1;}
 else if(f.trip==='leg2'){to=p.name;eta='25분';say=f.promise.who==='unknown'?`${p.name}까지 25분. 지난번에 남겨 둔 약속의 장소예요.`:`${p.name}까지 25분. ${whoName(f)}가 가보고 싶다고 하신 곳이에요.`;cur=stops.length-2;}
 else if(f.trip==='return'){to='집';eta='안내 중';say='집으로 가는 길이에요. 다녀온 기록은 정차한 뒤에 남겨요.';cur=stops.length-1;}
 else if(state.navigation?.status==='applied'){to=place(state.navigation.destination)?.name||to;say='들를 곳은 내비게이션 안내를 따라가요. 기록은 정차한 뒤에 남겨요.';}
 const trip=cur>=0&&f.promise;const aiReady=state.ai?.provider&&state.ai.stage==='done'&&state.ai.result==='ok';$('#driveView').innerHTML=`<div class="drive-thread">${threadHtml(withAiStar(trip?tripModel(f,true):{progress:640,items:[{kind:'light',x:640,label:'나'}]}),{night:true,id:'drive',y0:36})}</div><div class="drive-main"><p class="drive-to">${eta?esc(to)+'까지':'다음 목적지 · '+esc(to)}</p>${eta?`<p class="drive-eta">${eta}</p>`:''}<p class="drive-say">${icon('speaker')}<span>${esc(say)}</span></p>${aiReady?`<p class="drive-ai">${STAR}<span>근처에 들를 곳 두 곳을 정리해 뒀어요. 도착하면 보여 드릴게요.</span></p>`:''}<p class="drive-lock">주행 중에는 화면 조작을 받지 않아요${state.ai?.provider?' · 내 AI에도 묻지 않아요':''} · 음성 안내 시연</p></div>`;
}
function renderRail(){
 const pressed=(sel,val)=>document.querySelectorAll(`[data-rail="${sel}"]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===String(val))));
 pressed('gear',state.vehicleState);pressed('fuel',state.fuel);pressed('location',state.location);pressed('navi',state.navOutcome);pressed('weather',state.weather);pressed('source',state.sourceState);pressed('ai',state.aiOutcome);
 const d=$('#railDoor');if(d)d.textContent=state.doorAt?`마지막 관측 ${state.doorAt}`:'관측 없음';
}
function renderTrip(){renderThread();renderShortcuts();renderMemo();renderPromise();renderPlan();renderApprove();renderPrep();renderBoard();renderDrive();renderRail();$('#homeDate').textContent=dateLong(state.today);$('#clock').textContent=state.clock;}

// Navigation requests per leg: "적용됨" only after the simulated callback.
let legSerial=0;
function applyLeg(leg){
 const f=state.first;if(!f.checks.route||f[leg]==='wait'||f[leg]==='ok'||state.driving)return;
 const token=++legSerial,outcome=state.navOutcome;f[leg]='wait';render();
 setTimeout(()=>finishLeg(token,leg,outcome),800);
}
function finishLeg(token,leg,outcome){
 const f=state.first;if(token!==legSerial||f[leg]!=='wait')return;
 if(state.driving){f[leg]='idle';render();return;}
 f[leg]=outcome==='success'?'ok':'fail';render();
 toast(outcome==='success'?`${leg==='leg1'?'1':'2'}구간 경로가 내비게이션에 들어갔어요 · 응답 확인`:'경로를 적용하지 못했어요. 계획은 그대로예요.');
}
function cancelLegs(){const f=state.first;legSerial++;['leg1','leg2'].forEach(l=>{if(f[l]==='wait')f[l]='idle';});}

function tripAction(b){
 const f=state.first,m=f.memo,d=b.dataset;
 if(d.memo){
  if(d.memo==='listen'){m.heard=true;m.said=SAID_SAMPLE;}
  else if(d.memo==='type'){m.heard=true;m.said=SAID_SAMPLE;toast('글로 쓰기 시연: 예시 문장을 넣었어요.');}
  else if(d.memo==='again'){m.heard=false;m.said='';}
  else if(d.memo==='use'){if(!m.heard)return true;m.step=1;}
  else if(d.memo==='back')m.step=Math.max(0,m.step-1);
  else if(d.memo==='next'){if(!m.place)return true;m.step=2;}
  else if(d.memo==='retry')toast(state.sourceState==='failed'?'아직 장소를 불러오지 못했어요.':'주변 장소를 다시 찾았어요.');
  else if(d.memo==='save'){
   if(!m.place||!m.who||!place(m.place))return true;
   const p=place(m.place);state.first={...freshFirst(),stage:'saved',promise:{place:m.place,who:m.who,said:m.said||SAID_SAMPLE,at:`${dateShort(state.today)} ${state.clock} · ${LOCATIONS[state.location]||'차 안'} 정차 중`}};
   state.view='promise';render();toast('약속을 저장했어요. 아직 아무것도 예약하거나 보내지 않았어요.');return true;
  }
  render();return true;
 }
 if(d.memoPlace){m.place=d.memoPlace;render();return true;}
 if(d.memoWho){m.who=d.memoWho;render();return true;}
 if(b.hasAttribute('data-plan-voice')){f.plan.day='sun1';f.plan.time='10:30';f.planHeard=true;render();toast('말한 대로 채웠어요. 틀리면 아래에서 고쳐 주세요.');return true;}
 if(d.planDay){f.plan.day=d.planDay;render();return true;}
 if(d.planTime){f.plan.time=d.planTime;render();return true;}
 if(d.check){if(d.check==='hvac')return true;f.checks[d.check]=!f.checks[d.check];if(!f.checks.route)cancelLegs();render();return true;}
 if(d.board){f.companion=d.board;if(d.board==='later'){state.view='home';toast('나중에 다시 물을게요. 동행은 미확인으로 둬요.');}render();return true;}
 switch(d.first){
 case 'later':if(f.trip==='atGrandma'&&!f.companion)f.companion='later';toast('나중에 다시 보여 드릴게요.');render();return true;
 case 'confirm':
  if(f.stage==='planned'){state.view='prep';render();toast('승인 범위를 바꿨어요. 체크한 것만 실행해요.');return true;}
  f.stage='planned';f.trip='today';state.today=PLAN_DAYS[f.plan.day].date;state.location='home';state.clock=tripClock('prep');state.view='home';render();
  toast(`계획을 확정했어요. 아직 아무것도 실행하지 않았어요 · ${PLAN_DAYS[f.plan.day].label} 아침(시연)`);return true;
 case 'fuel-add':f.fuelStop='add';if(f.leg1!=='idle'){cancelLegs();f.leg1='idle';}render();return true;
 case 'fuel-skip':f.fuelStop='skip';render();return true;
 case 'apply-leg1':applyLeg('leg1');return true;
 case 'apply-leg2':applyLeg('leg2');return true;
 case 'record':visitForm(f.promise.place,null,{fromTrip:true,companion:f.companion==='yes'&&f.promise.who!=='unknown'?f.promise.who:null});return true;
 }
 return false;
}

// Demo rail outside the vehicle screen. Vehicle state controls only; no scene jumps.
function railGear(v){
 const f=state.first,was=state.vehicleState;state.vehicleState=v;state.driving=v!=='park';
 if(v!=='park'){close();cancelLegs();if(state.ai?.stage==='research'){state.ai.stage='idle';aiSerial++;}}
 if(v==='drive'&&was!=='drive'){
  const next={today:hasPickup(f)?'leg1':'leg2',atGrandma:'leg2',atPlace:'return'}[f.trip];
  if(next){f.trip=next;state.clock=tripClock(next);state.view='home';}
 }
 if(v==='park'&&was==='drive'){
  const next={leg1:'atGrandma',leg2:'atPlace',return:'back'}[f.trip];
  if(next){f.trip=next;state.clock=tripClock(next);state.location={atGrandma:'grandma',atPlace:'cafe',back:'home'}[next];if(next==='back')f.stopMin=CLOCK.return-CLOCK.atPlace;state.view='home';}
 }
}
function resetDemo(){try{localStorage.removeItem(KEY);}catch(e){}if(location.hash)history.replaceState(null,'',location.pathname+location.search);cancelLegs();close();state=freshState();render();}
function railAction(b){
 const v=b.dataset.value;
 switch(b.dataset.rail){
 case 'gear':railGear(v);break;
 case 'door':if(state.vehicleState==='drive'){toast('주행 중에는 도어 관측을 시연하지 않아요.');return;}state.doorAt=state.clock;if(state.first.trip==='atGrandma'){state.first.doorAt=state.clock;if(state.first.companion==='later')state.first.companion=null;state.view='home';}break;
 case 'fuel':state.fuel=Number(v);break;
 case 'location':state.location=v;break;
 case 'navi':state.navOutcome=v;break;
 case 'weather':state.weather=v;state.page=0;break;
 case 'source':state.sourceState=v;state.page=0;break;
 case 'ai':state.aiOutcome=v;aiReset();break;
 case 'reset':resetDemo();return;
 }
 render();
}

// "실로 잇는 기억" thread: past visits hang as photos, promises as handwritten tags,
// the driver and a companion travel as two small lights. Presentation only.
const FACE={
 grandma:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="30" r="22" fill="#cfc8c2"/><circle cx="32" cy="9" r="8" fill="#d6cfc9" stroke="#b8afa8" stroke-width="1.5"/><ellipse cx="32" cy="37" rx="18" ry="19" fill="#f7dcc6"/><path d="M14 31Q17 15 32 16Q47 15 50 31Q44 23 32 23Q20 23 14 31Z" fill="#ddd6d0"/><circle cx="24.5" cy="37" r="5.5" fill="none" stroke="#8a6a55" stroke-width="1.6"/><circle cx="39.5" cy="37" r="5.5" fill="none" stroke="#8a6a55" stroke-width="1.6"/><path d="M30 37h4" stroke="#8a6a55" stroke-width="1.6"/><path d="M22 37.5q2.5-2.2 5 0M37 37.5q2.5-2.2 5 0" fill="none" stroke="#5b4030" stroke-width="1.6" stroke-linecap="round"/><circle cx="20" cy="45" r="3.2" fill="#f2a48e" opacity=".65"/><circle cx="44" cy="45" r="3.2" fill="#f2a48e" opacity=".65"/><path d="M27.5 47.5q4.5 3.5 9 0" fill="none" stroke="#b2604a" stroke-width="1.8" stroke-linecap="round"/></svg>',
 mom:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M11 40Q9 12 32 11Q55 12 53 40L50 52H14Z" fill="#6b4a36"/><ellipse cx="32" cy="36" rx="17" ry="19" fill="#f5d6bf"/><path d="M15 32Q18 15 32 15Q46 15 49 32Q41 22 30 23Q24 24 15 32Z" fill="#7a5640"/><path d="M23 37q2.5-2.2 5 0M36 37q2.5-2.2 5 0" fill="none" stroke="#5b4030" stroke-width="1.8" stroke-linecap="round"/><circle cx="21" cy="44" r="3" fill="#f2a48e" opacity=".6"/><circle cx="43" cy="44" r="3" fill="#f2a48e" opacity=".6"/><path d="M28 47q4 3 8 0" fill="none" stroke="#b2604a" stroke-width="1.8" stroke-linecap="round"/></svg>'};
function face(who){return FACE[who]||'';}
function figures(list=[]){
 const c=list[0],me=c?'<circle cx="146" cy="121" r="9" fill="#5b4636"/><path d="M132 160Q133 133 146 131Q159 133 160 160Z" fill="#6d8aa0"/>':'<circle cx="160" cy="121" r="9" fill="#5b4636"/><path d="M146 160Q147 133 160 131Q173 133 174 160Z" fill="#6d8aa0"/>';
 const other=c==='grandma'?'<circle cx="182" cy="110" r="4.5" fill="#e4ddd6"/><circle cx="182" cy="121" r="8.5" fill="#d6cfc9"/><path d="M168 160Q169 137 182 135Q195 137 196 160Z" fill="#c86a4a"/><path d="M159 151Q169 144 170 151" fill="none" stroke="#c86a4a" stroke-width="4" stroke-linecap="round"/>':c?'<circle cx="182" cy="121" r="9" fill="#6b4a36"/><path d="M173 124Q174 133 182 133Q190 133 191 124" fill="#6b4a36"/><path d="M168 160Q169 137 182 135Q195 137 196 160Z" fill="#8f9f6e"/>':'';
 return `<svg class="figs" viewBox="0 0 320 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${me}${other}</svg>`;
}
const T={x0:-30,x1:1310,sag:56};
function threadY(x,y0){const t=(x-T.x0)/(T.x1-T.x0);return y0+4*T.sag*t*(1-t);}
function withJosa(name){const c=name.charCodeAt(name.length-1)-0xAC00;return name+(c>=0&&c<11172&&c%28?'이랑':'랑');}
function visitCaption(v){const p=place(v.place),m=Number(String(v.date).split('-')[1]);const who=v.companions?.[0];return `${m}월, ${who?withJosa(KB.people[who]||PEOPLE[who]||who)+' ':''}${p?.name||''}`;}
function threadItem(it,y0){
 const y=threadY(it.x,y0),pos=dy=>`left:${it.x}px;top:${Math.round(y+(dy||0))}px`;
 if(it.kind==='pola'){const p=place(it.place);return `<div class="hang" style="${pos(-8)}"><i class="pin"></i><figure class="pola${it.big?' big':''}" style="--r:${it.r||0}deg"><span class="ph">${p?artSvg(p.art,''):''}${figures(it.with)}</span><figcaption>${esc(it.caption)}</figcaption></figure></div>`;}
 if(it.kind==='empty')return `<div class="hang" style="${pos(-8)}"><i class="pin"></i><figure class="pola empty" style="--r:${it.r||0}deg"><span class="ph">?</span><figcaption>${esc(it.caption)}</figcaption></figure></div>`;
 if(it.kind==='tag')return `<div class="hang" style="${pos(-8)}"><i class="pin"></i><div class="tag${it.ghost?' ghost':''}${it.who&&FACE[it.who]?' signed':''}" style="--r:${it.r||0}deg">${it.ghost?esc(it.text):`<q>${esc(it.text)}</q><small>${esc(it.meta)}</small>${it.who&&FACE[it.who]?`<span class="sig">${face(it.who)}</span>`:''}`}</div></div>`;
 if(it.kind==='stop')return `<div class="stop${it.future?' future':''}" style="${pos()}"><i></i>${it.label?`<span>${it.who&&FACE[it.who]?`<b class="mini">${face(it.who)}</b>`:''}${esc(it.label)}</span>`:''}</div>`;
 if(it.kind==='light')return `<div class="light ${it.who?'companion':'me'}${it.wait?' wait':''}" style="${pos(it.dy)}"><i>${it.who?face(it.who):''}</i>${it.label?`<span>${esc(it.label)}</span>`:''}</div>`;
 if(it.kind==='ai')return `<div class="light ai${it.wait?' wait':''}" style="${pos(it.dy)}" aria-label="내 AI"><i>${STAR}</i>${it.label?`<span>${esc(it.label)}</span>`:''}</div>`;
 if(it.kind==='knot')return `<svg class="knot" style="${pos()}" viewBox="0 0 46 30" aria-hidden="true"><path d="M8 15c0-8 14-8 15 0s15 8 15 0-14-8-15 0-15 8-15 0z" fill="none" stroke="#8e3a1a" stroke-width="5"/></svg>`;
 return '';
}
function threadHtml(model,{night=false,id='t',y0=40}={}){
 const xp=model.progress,d=`M ${T.x0} ${y0} Q 640 ${y0+2*T.sag} ${T.x1} ${y0}`;
 let bulbs='';if(night)for(let x=40;x<xp-16;x+=88){if(model.items.some(it=>(it.kind==='stop'||it.kind==='light')&&Math.abs(it.x-x)<36))continue;const by=threadY(x,y0)+11;bulbs+=`<circle cx="${x}" cy="${by}" r="11" fill="#f0b878" opacity=".22"/><circle cx="${x}" cy="${by}" r="4.5" fill="#ffe2b0"/>`;}
 const svg=`<svg class="yarn" viewBox="0 0 1280 300" aria-hidden="true"><defs><clipPath id="${id}p"><rect x="-60" y="0" width="${xp+60}" height="300"/></clipPath><clipPath id="${id}f"><rect x="${xp}" y="0" width="1400" height="300"/></clipPath><filter id="${id}g" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="5"/></filter></defs><g clip-path="url(#${id}f)"><path d="${d}" fill="none" stroke="${night?'#6b5443':'#bf9f7e'}" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round"/></g><g clip-path="url(#${id}p)">${night?`<path d="${d}" fill="none" stroke="#f0b878" stroke-width="11" opacity=".45" filter="url(#${id}g)"/>`:`<path d="${d}" fill="none" stroke="#5a280f" stroke-opacity=".16" stroke-width="6" transform="translate(0,4)"/>`}<path d="${d}" fill="none" stroke="${night?'#f0b878':'#a8482a'}" stroke-width="5.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${night?'#fff1d6':'#e08a5c'}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" opacity=".9"/>${bulbs}</g></svg>`;
 return svg+model.items.map(it=>threadItem(it,y0)).join('');
}
function pastVisits(n=3){return state.visits.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-n);}
function promiseTag(f,x,r=-3){const p=promisePlace(f);return {kind:'tag',x,r,text:f.promise.said,meta:`${f.promise.who==='unknown'?'함께 갈 사람 미정':whoName(f)} · ${p?.name||''}`,who:f.promise.who};}
// Driver position along today's stops for each trip phase (index, may be half-way while driving).
const TRIP_POS={today:0,leg1:.5,atGrandma:1,leg2:1.5,atPlace:2,return:2.5,back:3},TRIP_POS_DIRECT={today:0,leg2:.5,atPlace:1,return:1.5,back:2};
function tripModel(f,night){
 const stops=routeStops(f),n=stops.length,xs=stops.map((_,i)=>Math.round(190+i*(1130-190)/(n-1)));
 const pos=(hasPickup(f)?TRIP_POS:TRIP_POS_DIRECT)[f.trip]??0;
 const at=xs[Math.floor(pos)]+(pos%1?(xs[Math.ceil(pos)]-xs[Math.floor(pos)])*(pos%1):0),destI=n-2,who=f.promise?.who;
 const together=f.companion==='yes'&&who&&who!=='unknown'&&pos>=(hasPickup(f)?1:0),waiting=hasPickup(f)&&f.trip==='atGrandma'&&!together&&(f.doorAt||f.companion==='later');
 const items=[];
 stops.forEach((s,i)=>{if(i===destI)return items.push({kind:'stop',x:xs[i],future:xs[i]>at+1});const near=Math.abs(xs[i]-at)<40;items.push({kind:'stop',x:xs[i],future:xs[i]>at+1,label:near?'':s,who:s==='할머니 댁'?'grandma':null});});
 if(f.stage!=='done')items.push(promiseTag(f,xs[destI]+(Math.abs(xs[destI]-at)<40?96:70)));
 if(together||waiting){items.push({kind:'light',x:at-22,label:'나'});items.push({kind:'light',x:at+28,who,wait:waiting,label:waiting?whoName(f)+'?':whoName(f)});}
 else items.push({kind:'light',x:at,label:'나'});
 return {progress:at,items};
}
function homeModel(){
 const f=state.first,items=[];const past=pastVisits(f.stage==='done'?3:2),slots=[128,360,600];
 if(f.trip&&f.trip!=='none'&&f.stage!=='done')return tripModel(f,false);
 past.forEach((v,i)=>{const p=place(v.place);items.push({kind:'pola',x:slots[i],place:v.place,with:v.companions,caption:visitCaption(v),r:[-4,3,-2][i],big:false});if(f.stage==='done'&&v.place===f.promise?.place&&i===past.length-1)items.push({kind:'knot',x:slots[i]-44});});
 if(f.stage==='none'){items.push({kind:'empty',x:820,caption:'여기, 누구랑?',r:-2});items.push({kind:'light',x:820,dy:-34});items.push({kind:'tag',x:1120,ghost:true,text:'다음 약속',r:4});return {progress:820,items};}
 if(f.stage==='saved'||f.stage==='planned'){items.push({kind:'light',x:620,label:'지금'});items.push(promiseTag(f,900));return {progress:620,items};}
 items.push({kind:'light',x:860,label:'오늘'});items.push({kind:'tag',x:1110,ghost:true,text:'다음 약속',r:4});return {progress:860,items};
}
function withAiStar(m){if(!state.ai?.provider)return m;const me=m.items.filter(it=>it.kind==='light').map(it=>it.x);const x=me.length?Math.max(...me)+(me.length>1?70:90):m.progress+90;m.items.push({kind:'ai',x:Math.min(x,1230),dy:-34});return m;}
function skyClass(){const h=Number(String(state.clock||'12:00').slice(0,2));return h<11?'sky-morning':h<15?'sky-day':h<18?'sky-golden':'sky-evening';}
function renderThread(){
 const el=$('#thread');if(el)el.innerHTML=threadHtml(withAiStar(homeModel()),{id:'home',y0:36});
 const vd=$('#vehicleDisplay');['sky-morning','sky-day','sky-golden','sky-evening'].forEach(c=>vd.classList.toggle(c,c===skyClass()));
}
