(function(root){
const tags={quiet:'조용한 분위기',light:'가벼운 식사',sea:'바다 전망',easy:'걷기 편함',parking:'주차 정보',indoor:'실내 공간',local:'지역의 맛',outdoor:'야외 산책'};
const places=[
 ['p1','모래빛 식탁','food','안목해변',5,'해변 곁에서 천천히 먹는 한 끼','bowl',['light','quiet','parking','indoor']],
 ['p2','파도 서가','cafe','안목해변',3,'책 한 권과 함께 머무는 바다','coffee',['sea','quiet','indoor']],
 ['p3','솔바람 산책길','visit','안목해변',8,'소나무 사이로 이어지는 짧은 산책','tree',['easy','quiet','outdoor']],
 ['p4','항구의 부엌','food','안목해변',7,'여행지의 맛을 만나는 작은 식당','fish',['local','parking','indoor']],
 ['p5','해안 전망대','visit','안목해변',12,'시야가 열리는 해안의 작은 쉼표','sun',['sea','outdoor']],
 ['p6','흰돌 정원','cafe','안목해변',9,'정원과 실내를 함께 즐기는 공간','leaf',['quiet','easy','indoor','parking']],
 ['p7','호수 옆 식탁','food','청초호',4,'호수를 바라보며 가볍게 먹기','bowl',['light','sea','indoor']],
 ['p8','물결 산책로','visit','청초호',6,'호숫가를 따라 걷는 느린 오후','tree',['easy','quiet','outdoor']],
 ['p9','작은 기록실','cafe','청초호',5,'여행의 한 장면을 남기는 카페','coffee',['quiet','indoor','parking']]
].map(([id,name,category,destination,minutes,description,art,features])=>({id,name,category,destination,minutes,description,art,features}));
const sources=[{id:'s-demo',label:'목업용 장소 편집 데이터',kind:'sample',date:'2026-11-13',note:'실재 업체·현장 조사 결과가 아닙니다. 방문 전 확인용으로 사용할 수 없습니다.'}];
const nodes=[...places.map(p=>({id:p.id,type:'place',label:p.name,...p})),...Object.entries(tags).map(([id,label])=>({id:'t-'+id,type:'trait',label})),...sources.map(s=>({...s,type:'source'})),{id:'u',type:'person',label:'나'},{id:'mom',type:'person',label:'어머니'},{id:'d1',type:'destination',label:'안목해변'},{id:'d2',type:'destination',label:'청초호'}];
const edges=[];
for(const p of places){edges.push({from:p.id,to:p.destination==='안목해변'?'d1':'d2',type:'NEAR',minutes:p.minutes,source:'s-demo'});for(const t of p.features)edges.push({from:p.id,to:'t-'+t,type:'HAS_TRAIT',source:'s-demo',asOf:'2026-11-13',confidence:p.id==='p6'&&t==='parking'?'unknown':'sample'});}
const initialVisits=[{id:'v1',place:'p2',date:'2026-10-18',companions:['mom'],note:'다음에는 바다 근처에서 가볍게 점심도 먹자.',use:true},{id:'v2',place:'p3',date:'2026-10-18',companions:['mom'],note:'바람이 좋았던 짧은 산책.',use:true}];
const initialProfile={preferences:['quiet','light','sea'],momPreferences:['easy'],companion:'unknown'};
function traits(id){return edges.filter(e=>e.from===id&&e.type==='HAS_TRAIT');}
function rank(context,visits,profile){
 const pref=[...profile.preferences,...(context.companion==='mom'?profile.momPreferences:[])];
 return places.filter(p=>p.destination===context.destination).map(p=>{
  const facts=traits(p.id);const reasons=[];let score=0;
  for(const t of [...new Set(pref)]){const e=facts.find(e=>e.to==='t-'+t&&e.confidence!=='unknown');if(e){score+=3;reasons.push({text:(profile.preferences.includes(t)?'내 취향':'동행자가 확인한 선호')+' · '+tags[t],edge:e,weight:3});}}
  if(context.weather==='rain'){const inside=facts.find(e=>e.to==='t-indoor');if(inside){score+=4;reasons.push({text:'비 오는 날 · 실내 공간',edge:inside,weight:4});}if(facts.some(e=>e.to==='t-outdoor'))score-=5;}
  const prev=visits.filter(v=>v.place===p.id&&v.use);const same=prev.find(v=>v.companions.includes('mom')&&context.companion==='mom');
  if(same){score+=2;reasons.push({text:'어머니와 확인한 방문 기억',visit:same,weight:2});}
  if(context.novel&&visits.some(v=>v.place===p.id))score-=3;
  score+=Math.max(0,3-p.minutes/5);
  return {...p,score,reasons,visited:visits.filter(v=>v.place===p.id),unknown:facts.filter(e=>e.confidence==='unknown')};
 }).sort((a,b)=>b.score-a.score||a.minutes-b.minutes);
}
function graph(visits,profile){return {schemaVersion:1,description:'목업용 로컬 지식 그래프. 장소 사실과 개인 기억은 별도 출처를 유지한다.',nodes:[...nodes,...visits.map(v=>({id:v.id,type:'visit',label:v.date+' 방문',...v}))],edges:[...edges,...profile.preferences.map(t=>({from:'u',to:'t-'+t,type:'PREFERS',source:'사용자 명시 입력'})),...profile.momPreferences.map(t=>({from:'mom',to:'t-'+t,type:'PREFERS',source:'동행자 확인 선호 — 데모'})),...visits.flatMap(v=>[{from:'u',to:v.id,type:'CONFIRMED_VISIT',use:v.use},{from:v.id,to:v.place,type:'AT_PLACE'},...v.companions.map(c=>({from:v.id,to:c,type:'WITH_PERSON'}))])]};}
const api={places,tags,sources,nodes,edges,initialVisits,initialProfile,traits,rank,graph};root.KB=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
