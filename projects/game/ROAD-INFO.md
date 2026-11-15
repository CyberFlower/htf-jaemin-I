# 도로 상황 정보 연계안: 내 차로 짓는 도시 (`GAM`)

[USE_CASES.md](USE_CASES.md)의 GAM-UC-006 도로 상황 퀘스트에 쓰는 정보원을 정리했습니다.

## 1. 정보원

| 정보 | 출처 | 구분 | 이 문서의 절 |
|---|---|---|---|
| 경로상의 주의 구간 (공사, 낙석, 사고 다발 구역, 어린이 보호구역 등) | Pleos NaviHelper `onCautionPointInfo`, `onCameraAlert` | Pleos SDK | 2절 |
| 지금 일어난 사고·통제 (실시간 돌발) | 외부 공공 교통정보 API | 외부 API (확장, P2) | 3절 |

**Pleos SDK와 AAOS에는 실시간 사고 정보가 없습니다.** NaviHelper의 `ACCIDENT_PRONE_AREA`는 사고가 잦은 구역이라는 뜻이고, 지금 사고가 났다는 뜻이 아닙니다.

## 2. Pleos NaviHelper 주의 구간

주의 구간 이벤트는 경로 안내 중에만 오고, 내비 앱의 구현에 따라 전달되는 이벤트가 달라질 수 있습니다. 아래는 퀘스트에 쓰는 종류와 섬에서 보이는 모습입니다.

| `CautionPointType` | 뜻 | 섬 연출 |
|---|---|---|
| `HIGHWAY_CONSTRUCTION` | 고속도로 공사 | 섬 다리에 공사 인부, 지나면 "다 고쳤어요" |
| `FALLING_ROCK_AREA` | 낙석 주의 | 언덕길에 돌 치우는 주민 |
| `ROAD_DAMAGE_ALERT` | 도로 파손 알림 | 길 보수 |
| `SLIPPERY_ROAD_ALERT` | 미끄러운 도로 | 모래 뿌리는 주민 |
| `FOG_AREA` | 안개 구간 | 등대 불빛 |
| `ACCIDENT_PRONE_AREA` | 사고 다발 구역 | 안전 표지판을 세우는 주민. "사고"를 연출하지 않음 |
| `WILDLIFE_CROSSING` | 야생동물 출현 | 섬에 동물 손님 |
| `SCHOOL_ZONE` | 어린이 보호구역 | 안전 지킴이 주민 |
| `RAILROAD_CROSSING`, `DOWNHILL_CAUTION_AREA`, `NARROW_ROAD` | 철길 건널목, 내리막, 좁은 길 | 표지판 |

단속(`*_ENFORCEMENT`), 버스 전용차로(`BUS_LANE_*`), 주정차 금지, 교통정보 수집, 신호기 고장, 역주행 경보는 퀘스트에 쓰지 않습니다. 단속을 퀘스트로 만들면 단속을 피하는 게임처럼 보이고, 역주행 경보 같은 위급 상황에는 게임 연출이 어울리지 않기 때문입니다.

## 3. 외부 실시간 돌발 정보 후보

| 후보 | 범위 | 제공 형식 | 인증 | 이용 조건 |
|---|---|---|---|---|
| [도시교통정보센터(UTIC) 교통돌발정보](https://www.utic.go.kr/guide/utisRefIncident.do) | 전국 고속도로·국도 등. 제공기관은 경찰청, 국토교통부, 경기도청, 서울시설공단 외 | REST, XML. 실시간 갱신 | 인증키와 IP 인증 | 개방데이터 신청 |
| [서울시 실시간 돌발 정보](https://data.seoul.go.kr/dataList/OA-13315/A/1/datasetView.do) (서울 열린데이터광장, 원본 TOPIS) | 서울시 | OPEN API, XML. 실시간 갱신. 샘플 `http://openapi.seoul.go.kr:8088/(인증키)/xml/AccInfo/1/5/` | 인증키 | 공공누리 1유형(출처 표시, 상업적 이용·변경 가능) |
| [국토교통부 돌발상황정보](https://www.data.go.kr/data/15040465/openapi.do) (공공데이터포털) | 고속도로·국도. 사고, 차량 고장, 낙하물, 침수, 기상 악화, 공사 | JSON+XML. 국가교통정보센터로 연결되는 LINK 유형. 실시간 갱신 | 개발·운영 자동승인 | 무료, 이용허락범위 제한 없음. 트래픽은 기관 정책에 따름 |
| [국가교통정보센터(ITS) 돌발상황정보](https://www.its.go.kr/opendata/opendataList?service=event) (위 국토교통부 API의 제공처) | 고속도로(`ex`)·국도(`its`)·지방도 등 | xml/json | 인증키(`apiKey`) | |
| [한국도로공사 실시간 고속도로 정체상황](https://data.ex.co.kr/openapi/basicinfo/openApiInfoM?apiId=0406) | 고속도로 | XML, JSON. 수 분 단위 갱신 | | 사고가 아니라 정체 정보입니다 |

후보별 응답 항목:

- UTIC 교통돌발정보: `incidentId`(고유 아이디), `incidenteTypeCd`(돌발 유형), `incidenteSubTypeCd`(세부 유형), `locationDataX`/`locationDataY`(좌표), `locationTypeCd`(지점·영역·구간), `roadName`(도로명), `lane`(차선), `controlType`(통제 정보), `important`(중요 돌발 여부), `startDate`/`endDate`(발생일·종료일), `updateDate`(갱신 일시) 등. 유형 코드는 돌발정보코드정의서에 있습니다.
- ITS 돌발상황정보: 요청 변수는 `apiKey`, `type`(도로 유형: `all`, `ex`, `its`, `loc`, `sgg`, `etc`), `eventType`(`all`, `cor` 공사, `acc` 교통사고, `wea` 기상, `ete` 기타돌발, `dis` 재난, `etc`), `getType`(`xml`/`json`), 좌표 범위 `minX`·`maxX`·`minY`·`maxY`(선택)입니다.
- 서울시 실시간 돌발 정보: 돌발 유형 코드(OA-13312)와 도로별 링크 정보(OA-13309) 데이터를 함께 써야 합니다.

### 검토 순서

1. ITS 돌발상황정보(국토교통부): 전국 범위이고, 사고(`acc`)와 공사(`cor`)를 나눠 받으면서 좌표 범위로 경로 근처만 조회할 수 있습니다.
2. 서울시 실시간 돌발 정보: 범위는 서울뿐이지만 이용 조건(공공누리 1유형)이 분명해서 서울 시연에 알맞습니다.
3. UTIC는 IP 인증이라 차량 앱이 직접 부르기 어렵고, 중계 서버가 있어야 합니다.

## 4. 게임에서 쓰는 방식 (GAM-037, P2)

- 운전자가 경로 안내를 받는 동안에만, 경로 근처 좌표 범위로 돌발 정보를 조회합니다.
- 경로 근처에 사고나 통제가 있으면 섬에 "수습 중" 연출만 보여 주고, 주행 중 알림이나 운전자 보고, 수습 확인 요청은 하지 않습니다(GAM-N07).
- 내비가 경로를 다시 탐색(`onReRouteEnded`)하고 목적지에 도착(`onDestinationArrived`)한 뒤 주차하면 "우회 완료"로 끝납니다. 재탐색의 원인을 사고로 단정하지는 않습니다.
- 돌발 정보는 "그 기관이 그 시각에 알린 정보"로만 다루고, 출처와 조회 시각을 함께 보여 줍니다.

## 5. 지켜야 할 것

| 항목 | 내용 |
|---|---|
| 공모전 범위 | 공지가 공개된 Pleos SDK·API 범위에서 개발하라고 하므로, 외부 API 연계는 확장(P2)으로 둡니다 |
| 위치 전송 | 좌표 범위로 조회하면 차량의 대략적인 위치가 외부 기관 서버로 가므로, 사용자에게 설명하고 승인을 받습니다 |
| 인증키 | API 키는 저장소에 올리지 않습니다. 차량 앱에 키를 넣으면 노출되므로 중계 서버가 필요합니다 |
| 네트워크 | 차량이 오프라인이면 돌발 정보 없이 2절의 주의 구간 퀘스트만 동작합니다 |
| 정보 지연·오류 | 이미 수습된 사고가 남아 있거나 늦게 올 수 있어서, 게임 연출이 사실처럼 보이지 않게 출처와 시각을 붙입니다 |
| 시연 | 실제 API 대신 응답 형식에 맞춘 예시 데이터로 보여 줄 때는 화면에 예시 데이터라고 밝힙니다 |
