'use strict';
/* 전국 지도 데이터 (GAM-034, D-004).
   목록은 2024년 행정구역 기준의 목업용 시·군 목록입니다. 2026-07-01 개편은 반영하지 않았습니다(GAM-Q31에서 기준일 확인).
   특별시·광역시·특별자치시는 하나의 도시로 둡니다(GAM-034 메모).
   tile: 타일 지도 위치 [열, 행, 너비, 높이]. 실제 경계가 아니라 권역의 대략적인 배치입니다.
   local: 그 권역의 도시에서만 짓는 특산 건물. 이름은 널리 알려진 지역 먹거리·특산물에서 고른 목업 예시이며 확정이 아닙니다. */
const REGIONS = [
  { id: 'gyeonggi', name: '경기', local: { name: '쌀 방앗간', mark: '쌀', color: '#e9d9a6' }, tile: [1, 0, 3, 4], cities: '수원시 성남시 고양시 용인시 부천시 안산시 안양시 남양주시 화성시 평택시 의정부시 시흥시 파주시 김포시 광명시 광주시 군포시 하남시 오산시 이천시 안성시 의왕시 양주시 포천시 여주시 동두천시 과천시 구리시 가평군 양평군 연천군' },
  { id: 'gangwon', name: '강원', local: { name: '감자밭', mark: '감', color: '#c89a5b' }, tile: [4, 0, 4, 3], cities: '춘천시 원주시 강릉시 동해시 태백시 속초시 삼척시 홍천군 횡성군 영월군 평창군 정선군 철원군 화천군 양구군 인제군 고성군 양양군' },
  { id: 'chungnam', name: '충남', local: { name: '인삼밭', mark: '삼', color: '#d98b5f' }, tile: [0, 4, 2, 3], cities: '천안시 공주시 보령시 아산시 서산시 논산시 계룡시 당진시 금산군 부여군 서천군 청양군 홍성군 예산군 태안군' },
  { id: 'chungbuk', name: '충북', local: { name: '포도밭', mark: '포', color: '#8e5bd6' }, tile: [3, 4, 2, 3], cities: '청주시 충주시 제천시 보은군 옥천군 영동군 증평군 진천군 괴산군 음성군 단양군' },
  { id: 'gyeongbuk', name: '경북', local: { name: '사과 과수원', mark: '과', color: '#e5484d' }, tile: [5, 3, 3, 4], cities: '포항시 경주시 김천시 안동시 구미시 영주시 영천시 상주시 문경시 경산시 의성군 청송군 영양군 영덕군 청도군 고령군 성주군 칠곡군 예천군 봉화군 울진군 울릉군' },
  { id: 'jeonbuk', name: '전북', local: { name: '비빔밥집', mark: '밥', color: '#f08a3c' }, tile: [0, 7, 3, 2], cities: '전주시 군산시 익산시 정읍시 남원시 김제시 완주군 진안군 무주군 장수군 임실군 순창군 고창군 부안군' },
  { id: 'gyeongnam', name: '경남', local: { name: '굴 작업장', mark: '굴', color: '#8aa3b8' }, tile: [3, 8, 3, 2], cities: '창원시 진주시 통영시 사천시 김해시 밀양시 거제시 양산시 의령군 함안군 창녕군 고성군 남해군 하동군 산청군 함양군 거창군 합천군' },
  { id: 'jeonnam', name: '전남', local: { name: '녹차밭', mark: '차', color: '#4fa35c' }, tile: [0, 9, 3, 2], cities: '목포시 여수시 순천시 나주시 광양시 담양군 곡성군 구례군 고흥군 보성군 화순군 장흥군 강진군 해남군 영암군 무안군 함평군 영광군 장성군 완도군 진도군 신안군' },
  { id: 'jeju', name: '제주', local: { name: '감귤밭', mark: '귤', color: '#ff9a1f' }, tile: [1, 11.4, 2, 1], cities: '제주시 서귀포시' },
  { id: 'incheon', name: '인천', local: { name: '짜장면집', mark: '면', color: '#4a3b2a' }, tile: [0, 2, 1, 1], cities: '인천' },
  { id: 'seoul', name: '서울', local: { name: '분식 포차', mark: '떡', color: '#f05a5a' }, tile: [1.1, 1.45, .84, .84], inset: true, cities: '서울' },
  { id: 'sejong', name: '세종', local: { name: '복숭아밭', mark: '복', color: '#ff9fb2' }, tile: [2, 4, 1, 1], cities: '세종' },
  { id: 'daejeon', name: '대전', local: { name: '칼국수집', mark: '국', color: '#e8c27a' }, tile: [2, 5, 1, 1], cities: '대전' },
  { id: 'daegu', name: '대구', local: { name: '막창집', mark: '창', color: '#b5523b' }, tile: [5, 7, 1, 1], cities: '대구' },
  { id: 'ulsan', name: '울산', local: { name: '옹기 공방', mark: '옹', color: '#8a5a3c' }, tile: [6, 8, 1, 1], cities: '울산' },
  { id: 'busan', name: '부산', local: { name: '어묵 가게', mark: '묵', color: '#f2b134' }, tile: [6, 9, 1, 1], cities: '부산' },
  { id: 'gwangju', name: '광주', local: { name: '떡갈비집', mark: '갈', color: '#a8432f' }, tile: [2.0, 9.08, .84, .84], inset: true, cities: '광주' },
];
const MAP_COLS = 8, MAP_ROWS = 12.4;
const CITIES = [];
const CITY_BY_ID = {};
REGIONS.forEach(r => {
  r.cityIds = r.cities.split(' ').map(name => {
    const city = { id: r.id + ':' + name, name, region: r.id };
    CITIES.push(city); CITY_BY_ID[city.id] = city;
    return city.id;
  });
});
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
const DEFAULT_HOME = 'seoul:서울';
function cityName(id) { const c = CITY_BY_ID[id]; return c ? c.name : ''; }
/* 같은 이름(고성군)을 구분할 때 */
function cityFullName(id) { const c = CITY_BY_ID[id]; return c ? (c.name === REGION_BY_ID[c.region].name ? c.name : `${REGION_BY_ID[c.region].name} ${c.name}`) : ''; }
/* 특산 건물 (도시마다 하나, 그 권역에서만). 새 도시의 첫 시설도 특산 건물입니다. */
const regionLocal = regionId => REGION_BY_ID[regionId].local;
const cityLocal = id => regionLocal(CITY_BY_ID[id].region);
function starterType() { return 'local'; }
