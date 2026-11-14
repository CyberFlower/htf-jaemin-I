'use strict';
/* 전국 지도의 권역과 도시 (GAM-038, DECISIONS D-004).
   목업 데이터: 2024년 행정구역 기준으로 직접 적었습니다. 2026-07-01 행정구역 개편은 반영하지 않았습니다.
   도시 단위는 시·군이고, 특별시·광역시·특별자치시는 하나의 도시로 둡니다(GAM-038 메모의 제안).
   cells: 도식 지도의 칸 [열, 행, 너비, 높이]. 실제 경계가 아닙니다. */
const REGIONS = [
  { id: 'ic', name: '인천', cells: [0, 0, 1, 1], cities: ['인천'] },
  { id: 'se', name: '서울', cells: [1, 0, 1, 1], cities: ['서울'] },
  { id: 'gw', name: '강원', cells: [2, 0, 2, 1], cities: ['춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양'] },
  { id: 'gg', name: '경기', cells: [0, 1, 2, 1], cities: ['수원', '성남', '의정부', '안양', '부천', '광명', '평택', '동두천', '안산', '고양', '과천', '구리', '남양주', '오산', '시흥', '군포', '의왕', '하남', '용인', '파주', '이천', '안성', '김포', '화성', '광주', '양주', '포천', '여주', '연천', '가평', '양평'] },
  { id: 'cb', name: '충북', cells: [2, 1, 1, 1], cities: ['청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양'] },
  { id: 'gb', name: '경북', cells: [3, 1, 1, 2], cities: ['포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉'] },
  { id: 'cn', name: '충남', cells: [0, 2, 1, 1], cities: ['천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'] },
  { id: 'sj', name: '세종', cells: [1, 2, 1, 1], cities: ['세종'] },
  { id: 'dj', name: '대전', cells: [2, 2, 1, 1], cities: ['대전'] },
  { id: 'jb', name: '전북', cells: [0, 3, 2, 1], cities: ['전주', '군산', '익산', '정읍', '남원', '김제', '완주', '진안', '무주', '장수', '임실', '순창', '고창', '부안'] },
  { id: 'dg', name: '대구', cells: [2, 3, 1, 1], cities: ['대구'] },
  { id: 'us', name: '울산', cells: [3, 3, 1, 1], cities: ['울산'] },
  { id: 'gj', name: '광주', cells: [0, 4, 1, 1], cities: ['광주'] },
  { id: 'gn', name: '경남', cells: [1, 4, 2, 1], cities: ['창원', '진주', '통영', '사천', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창', '합천'] },
  { id: 'bs', name: '부산', cells: [3, 4, 1, 1], cities: ['부산'] },
  { id: 'jn', name: '전남', cells: [0, 5, 2, 1], cities: ['목포', '여수', '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안'] },
  { id: 'jj', name: '제주', cells: [0, 6, 1, 1], cities: ['제주', '서귀포'] },
];
/* 권역별 특산 건물. 그 권역 도시의 업그레이드 시설로 들어갑니다(팀 리뷰 의견, 2026-11-14).
   이름은 널리 알려진 지역 먹거리·특산물에서 고른 목업 예시이며 확정이 아닙니다. mark는 간판 글자, color는 지붕·작물 색 */
const LOCAL = {
  ic: { name: '짜장면집', mark: '면', color: '#6b5440' }, se: { name: '분식 포차', mark: '떡', color: '#f05a5a' },
  gw: { name: '감자밭', mark: '감', color: '#c89a5b' }, gg: { name: '쌀 방앗간', mark: '쌀', color: '#e2cf8f' },
  cb: { name: '포도밭', mark: '포', color: '#8e5bd6' }, gb: { name: '사과 과수원', mark: '과', color: '#e5484d' },
  cn: { name: '인삼밭', mark: '삼', color: '#d98b5f' }, sj: { name: '복숭아밭', mark: '복', color: '#ff9fb2' },
  dj: { name: '칼국수집', mark: '국', color: '#e8c27a' }, jb: { name: '비빔밥집', mark: '밥', color: '#f08a3c' },
  dg: { name: '막창집', mark: '창', color: '#b5523b' }, us: { name: '옹기 공방', mark: '옹', color: '#8a5a3c' },
  gj: { name: '떡갈비집', mark: '갈', color: '#a8432f' }, gn: { name: '굴 작업장', mark: '굴', color: '#8aa3b8' },
  bs: { name: '어묵 가게', mark: '묵', color: '#f2b134' }, jn: { name: '녹차밭', mark: '차', color: '#4fa35c' },
  jj: { name: '감귤밭', mark: '귤', color: '#ff9a1f' },
};
const localOf = regionId => LOCAL[regionId];
/* 시설 이름. 특산 건물은 그 도시가 속한 권역의 이름을 씁니다 */
const facName = (type, city) => (type === 'local' && city && CITIES[city]) ? LOCAL[CITIES[city].region].name : FAC[type].name;
const MAP_SOURCE = '2024년 행정구역 기준 목업 데이터 · 2026-07 개편 미반영 · 도식 지도(실제 경계 아님)';

/* 도시 id는 '권역:이름'. 고성(강원·경남), 광주(광역시·경기)처럼 이름이 겹쳐도 구분됩니다. */
const CITIES = {};
REGIONS.forEach(r => r.cities.forEach(n => { CITIES[r.id + ':' + n] = { id: r.id + ':' + n, name: n, region: r.id }; }));
const CITY_IDS = Object.keys(CITIES);
const regionOf = id => REGIONS.find(r => r.id === CITIES[id].region);
const cityLabel = id => {
  const c = CITIES[id], r = regionOf(id);
  return c.name === r.name ? c.name : `${r.name} ${c.name}`;
};
