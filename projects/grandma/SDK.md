# Pleos SDK 활용: 다녀왔습니다 (`GRD`)

여정의 각 장면에 어떤 Pleos SDK와 API를 쓰는지 정리했습니다.

- 기준: [REQUIREMENTS.md](REQUIREMENTS.md)의 "의존" 줄, [dev-environment.md](../../docs/contest/dev-environment.md) 4절, API별 실패 처리와 실험 순서는 7·8절
- 검증 태그: "문서 확인"은 공식 Pleos 문서에 API가 있다는 뜻입니다. **에뮬레이터에서 동작을 확인한 항목은 아직 없습니다.** "확인 필요"는 질문 ID와 함께 적습니다.

## 1. 한눈에 보기

| SDK·인터페이스 | 쓰는 곳 | 주요 API | 퍼미션 | 검증 |
|---|---|---|---|---|
| Vehicle · Fuel / EvBattery | 출발 전 연료·배터리 상태로 준비 안내와 경유 제안 (GRD-006, P0) | Fuel / EvBattery 도메인 조회 | `CAR_ENERGY` | 문서 확인 |
| Vehicle · Door | 정차 중 도어 열림→닫힘을 계기로 "함께 출발하시나요?" 질문 (GRD-008, P1), 홈 지금 카드 (GRD-018) | `getDoor()`로 도메인을 얻어 열림·닫힘 조회 | `CAR_DOORS` | 문서 확인 |
| Vehicle · Seat | 동행 확인의 보조 신호 (GRD-008) | `checkSeatOccupancyCapabilities`, `getCurrentSeatOccupancy`, `registerSeatOccupancy` | `CAR_SEATS` | API 이름 문서 확인. 값의 의미·에뮬레이터 동작 확인 필요 |
| NaviHelper | 승인한 목적지·경유지를 내비게이션에 적용 (GRD-007, P0), 선택된 목적지 읽기 (GRD-014) | `requestRouteWithWaypoints()`, `addWaypoint()`, `getDestinationInfo()` → `onDestinationInfo`, `NaviHelperEventListener` | `NAVI_ROUTE_SEARCH`, `NAVI_ROUTE` | 문서 확인. 에뮬레이터 동작 확인 필요 |
| FusedLocation | 정차한 자리 주변의 장소 후보 (GRD-002, P0), 다녀온 이동 기록 (GRD-010, P0) | `isSupported()`, `getLastKnownLocation()`, `registerFusedLocationCallback()` | `FUSED_LOCATION` (Dangerous) | 문서 확인 |
| SpeechToText | 정차 중 한마디로 약속 남기기 (GRD-002), 키보드 없는 방문 기록 (GRD-016) | `initialize()`, `addListener()`, `setLocale()`, `request()`, `stop()` | `STT_SERVICE` | 문서 확인. 한국어·ON_DEVICE 품질 확인 필요 |
| TextToSpeech | 주행 중 화면 대신 안내 한 줄 (GRD-N01, P0) | `initialize()`, `speak()`, `stop()` | `TTS_SERVICE` | 문서 확인 |
| Gleo Interface | (후속 후보) 음성으로 앱 기능 호출 | App Schema 등록 | 확인 필요 | 공지상 허용. 구현 절차 확인 필요 |
| AAOS Car API | 주행/정차 판단과 주행 중 입력 제한 (GRD-N01, GRD-018) | `CarUxRestrictionsManager`, `GEAR_SELECTION`, `PARKING_BRAKE_ON` | 권한 확인 필요, `Car.PERMISSION_POWERTRAIN` | 문서 확인, **공모전 범위 확인 중(Q11)** |
| 외부 LLM API (내 AI 연결) | 운전자가 연결한 Claude, ChatGPT, Gemini가 모은 후보 안에서 들를 곳 두 곳과 이유를 정리 (GRD-019~021) | 공급자별 API (Pleos SDK 아님). 사용자가 휴대폰에서 등록한 API 키로 호출(D-001) | 해당 없음 | 확인 필요. Pleos LLM SDK는 공모전 기간에 제공되지 않음 |

차량이 여정의 순간을 알려 줍니다.
- **기억:** 정차 상태와 현재 위치가 "여기 다음에 오자"를 남길 순간과 장소를 줍니다(FusedLocation, SpeechToText).
- **출발:** 연료·배터리 상태가 출발 준비를, NaviHelper가 승인한 경유지를 다시 입력 없이 경로로 바꿉니다.
- **동행:** 도어 신호가 "함께 출발하시나요?"를 물을 시점을 줍니다. 탑승과 신원은 사용자가 확정합니다.
- **주행 중:** 화면 조작 대신 TextToSpeech로 안내 한 줄만 합니다.
- **다녀옴:** 실제 이동 기록과 사용자 확인으로 기록 초안을 만듭니다. 신호만으로 방문을 확정하지 않습니다.

## 2. 대표 시나리오 장면별 SDK 흐름

장면 순서는 [SCENARIO.md](SCENARIO.md) 2절을 따릅니다.

| 장면 | 차량 상태 | 신호·API (퍼미션) | 앱이 하는 일 | 신호가 없을 때 | 요구사항 |
|---|---|---|---|---|---|
| SC-01 기억 | 정차 | SpeechToText (`STT_SERVICE`), FusedLocation `getLastKnownLocation` (`FUSED_LOCATION`), 주행/정차 판단 | 정차 중 사용자가 시작한 한마디를 텍스트로 받고, 현재 위치 주변 장소 후보를 보여 준다. 사용자가 확인해야 저장 | STT를 쓸 수 없으면 선택 입력. 위치가 없거나 오래되면 사용자가 장소를 고른다. 주행 중이면 정차 후로 미룬다 | GRD-002 |
| SC-02 계획과 승인 | 정차 | (SDK 없음) 날씨·장소 외부 API — 확인 필요 | 여정 초안과 출처·조회 시각. 경로·공조·전송을 하나씩 승인 | 외부 정보가 없으면 "미확인"으로 표시하고 수동 계획 | GRD-003, GRD-005 |
| SC-03 출발 | 정차 | Vehicle Fuel / EvBattery (`CAR_ENERGY`), NaviHelper `requestRouteWithWaypoints()` / `addWaypoint()` (`NAVI_ROUTE_SEARCH`) | 연료·배터리 상태로 준비 안내와 경유 제안. 승인한 1구간 경로를 내비에 적용하고 콜백으로 결과 확인 | 도메인 미지원이면 "확인 불가". 적용 실패면 알리고 계획을 보존 | GRD-006, GRD-007 |
| SC-04 할머니 댁으로 | 주행 | 주행/정차 판단 (AAOS, Q11), TextToSpeech (`TTS_SERVICE`) | 조작 화면을 숨기고 다음 목적지와 안내 한 줄을 음성으로 | 판단할 수 없으면 입력을 제한 | GRD-N01 |
| SC-05 함께 출발 | 정차 | Vehicle Door (`CAR_DOORS`), Vehicle Seat 좌석 점유 (`CAR_SEATS`), NaviHelper (`NAVI_ROUTE_SEARCH`) | 도어 열림→닫힘을 관측하면 동행을 묻고, 확인 뒤 2구간 경로 적용 | 도어·좌석 신호가 없으면 사용자가 동행자를 직접 고른다. 문만 열고 닫은 것을 탑승으로 확정하지 않음 | GRD-008, GRD-N02 |
| SC-06 바다 카페로 | 주행 | TextToSpeech (`TTS_SERVICE`), 주행/정차 판단 | 남은 시간과 약속의 맥락 한 줄 | TTS 실패를 저장·내비 실패로 오인하지 않음 | GRD-N01, GRD-UC-011 |
| SC-07 다녀옴 | 주차 | FusedLocation 이동 기록 (`FUSED_LOCATION`), SpeechToText (`STT_SERVICE`) | 실제 이동과 사용자가 확인한 방문으로 기록 초안. 한마디를 더해 약속 완료 | 위치·음성이 없으면 선택 입력으로 기록. 정차·경유지 도착만으로 방문을 확정하지 않음 | GRD-010, GRD-016 |
| SC-08 다시 가는 여정 | 정차 | NaviHelper `getDestinationInfo()` → `onDestinationInfo` (`NAVI_ROUTE`), FusedLocation, SpeechToText, NaviHelper 경로 적용 | 같은 장소의 기억으로 이번 동행을 묻고, 주변 후보 두 곳과 이유를 보여 준 뒤, 승인한 경유지를 적용 | 목적지 조회 실패면 저장 장소나 수동 선택. 검색 실패면 저장된 방문 장소만 표시 | GRD-013~018 |

SC-08에서 내 AI가 연결되어 있으면 정차 중 모은 후보와 조건 태그를 외부 LLM API로 보내 두 곳과 이유를 받습니다. 연결하지 않았거나 실패하면 규칙 기반 추천을 씁니다. 주행 중에는 호출하지 않습니다(GRD-020, GRD-N07).

HTML 목업은 위 신호를 실제로 읽지 않는 시연입니다(8절). 목업의 AI 응답은 미리 준비한 시연 데이터입니다.

## 3. 기능별 API 목록

### 3.1 Vehicle

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| Fuel / EvBattery 도메인 조회 | `CAR_ENERGY` | 출발 전 연료·배터리 상태 | GRD-006 | 문서 확인 | dev-environment.md 4.2절 |
| `getDoor()` (Door 도메인: 열림·닫힘) | `CAR_DOORS` | 동행 질문의 계기, 홈 탑승 후보 카드 | GRD-008, GRD-018 | 문서 확인 | 4.1·4.2절, 7.2절 |
| `checkSeatOccupancyCapabilities`, `getCurrentSeatOccupancy`, `registerSeatOccupancy` | `CAR_SEATS` | 동행 확인 보조 신호 | GRD-008 | API 이름 문서 확인. 값의 의미·에뮬레이터 동작 확인 필요 | 4.2절 Seat |
| 도메인별 `checkXXXCapabilities` | 도메인별 | 지원 여부를 먼저 확인하고 대체 동작으로 분기 | 전체 | 문서 확인 | 4.1절 |
| Odometer `registerTripCurrentDrivingDistance` | `CAR_DRIVE` | 이동 관측의 보조. 이것만으로 주차를 확정하지 않음 | GRD-N01 | 문서 확인 | 4.3.1절, 7.2절 |

### 3.2 NaviHelper

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `requestRouteWithWaypoints()`, `addWaypoint()` | `NAVI_ROUTE_SEARCH` | 승인한 목적지·경유지 적용(최대 두 경유지) | GRD-007 | 문서 확인. 에뮬레이터 동작 확인 필요 | 4.4절, 7.3절 |
| `requestRoute()` | `NAVI_ROUTE_SEARCH` | 승인한 목적지만 적용. 후보 검색에는 쓰지 않음 | GRD-007 | 문서 확인 | 4.4절 |
| `getDestinationInfo()` → `onDestinationInfo`, `getWaypointInfo()` | `NAVI_ROUTE` | 선택된 목적지 읽기, 적용 결과가 요청과 같은지 확인 | GRD-014, GRD-007 | 문서 확인 | 4.4절 `get*Info()`, 7.1절 |
| `NaviHelperEventListener` (`onRouteStarted()`, `onRoutingCompleted()`, `onDestinationArrived()`, `onWayPointArrived()` 등) | `NAVI_ROUTE` | 경로 적용 결과 확인. 도착 이벤트로 방문을 확정하지 않음 | GRD-007, GRD-016 | 문서 확인 | 4.4.1절 |

### 3.3 FusedLocation

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `isSupported()`, `getLastKnownLocation()` | `FUSED_LOCATION` (Dangerous) | 정차한 자리 주변 장소 후보. 위치 시각 확인 | GRD-002, GRD-014 | 문서 확인 | 4.5절 |
| `registerFusedLocationCallback()` | `FUSED_LOCATION` | 허용한 여정 동안의 이동 기록. 여정이 끝나면 해제 | GRD-010 | 문서 확인 | 4.5절, 7.1절 |
| `addProximityAlert()` | `FUSED_LOCATION` | (후속 실험) 방문 후보 제안. 영역 진입은 방문 확정이 아님 | GRD-016 | 문서 확인 | 4.5절, 7.2절 |

### 3.4 SpeechToText · TextToSpeech

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| SpeechToText `initialize()`, `addListener()`, `setLocale()`, `request()`, `stop()` | `STT_SERVICE` | 사용자가 시작한 한마디를 텍스트로. 채택·재시도·취소 후 저장은 별도 확인 | GRD-002, GRD-016 | 문서 확인. 한국어·ON_DEVICE 품질 확인 필요 | 4.5절, 7.1절 |
| TextToSpeech `initialize()`, `speak()`, `stop()` | `TTS_SERVICE` | 주행 중 안내 한 줄 | GRD-N01 | 문서 확인 | 4.5절, 7.1절 |

### 3.5 AAOS Car API (공모전 범위 확인 중, Q11)

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `CarUxRestrictionsManager` `registerListener()` → `onUxRestrictionsChanged()` | 확인 필요 | 플랫폼 주행 규제를 입력 허용 여부에 반영 | GRD-N01, GRD-018 | 문서 확인 [Pleos 참고], Q11 | 4.3절 |
| `GEAR_SELECTION`, `PARKING_BRAKE_ON` | `Car.PERMISSION_POWERTRAIN` (Normal) | 주차 조건 확인 | GRD-N01 | 문서 확인 [Android], Q11 | 4.3절 |

## 4. 선언할 퍼미션

실제로 쓰는 API에 필요한 것만 선언합니다([dev-environment.md](../../docs/contest/dev-environment.md) 6절). 전체 이름은 `pleos.car.permission.<이름>`입니다.

| 퍼미션 | 보호 수준 | 이유 | 요구사항 |
|---|---|---|---|
| `CAR_ENERGY` | Pleos 퍼미션 (보호 수준은 문서에 없음) | 연료·배터리 상태 | GRD-006 |
| `CAR_DOORS` | Pleos 퍼미션 (보호 수준은 문서에 없음) | 도어 열림·닫힘 관측 | GRD-008, GRD-018 |
| `CAR_SEATS` | Pleos 퍼미션 (보호 수준은 문서에 없음) | 좌석 점유 보조 신호 (쓸 수 있을 때만) | GRD-008 |
| `NAVI_ROUTE`, `NAVI_ROUTE_SEARCH` | Pleos 퍼미션 (보호 수준은 문서에 없음) | 목적지 조회, 승인한 경로 적용 | GRD-007, GRD-014 |
| `FUSED_LOCATION` | **Dangerous**. 실행 중 동의 필요 | 주변 장소 후보, 이동 기록. 거부하면 사용자가 장소를 직접 고르고, 기록은 선택 입력으로 남긴다 | GRD-002, GRD-010 |
| `STT_SERVICE`, `TTS_SERVICE` | Pleos 퍼미션 (보호 수준은 문서에 없음) | 한마디 입력, 주행 중 안내 | GRD-002, GRD-016, GRD-N01 |
| `Car.PERMISSION_POWERTRAIN` | Normal (AAOS, Q11) | 주차 조건 | GRD-N01 |

퍼미션별 사전 승인은 App Market 입점 때 적용되며, 공모전 단계에서는 매니페스트 선언만으로 에뮬레이터에서 시험할 수 있습니다(6절, 공통 Q6).

## 5. 쓰지 않는 것과 이유

| 쓰지 않는 것 | 이유 | 근거 |
|---|---|---|
| 외부 음성 인식 서비스 | 차량 마이크 음성은 SpeechToText로만 인식합니다(공지) | dev-environment.md 4.5절 |
| Pleos LLM SDK | 공모전 기간에 제공되지 않습니다(공지). 내 AI 연결은 운전자가 연결한 외부 LLM API를 씁니다 | dev-environment.md 4절, GRD-019 |
| 음성 오디오의 외부 전송 | AI에는 SpeechToText가 돌려준 텍스트만 보냅니다 | dev-environment.md 4.5절, GRD-021 |
| AI 출력을 실행 명령으로 사용 | AI는 추천과 설명까지만 합니다. 경로 적용은 운전자 승인 뒤 NaviHelper가 합니다 | GRD-N07, GRD-005 |
| 승인 없는 차량 제어·외부 전송 | 경로·공조·전송은 운전자가 각각 승인한 뒤에만 실행합니다 | GRD-005, GRD-N05 |
| Vehicle HVAC 제어 (동행자 공조) | P2 확장이고 제어 퍼미션 이름이 확인되지 않았습니다. 제어할 수 없으면 준비 체크리스트로 대신합니다 | GRD-009 |
| 신호만으로 탑승·신원·방문 확정 | 도어·좌석·위치·도착 이벤트는 관측일 뿐입니다. 사용자가 확인합니다 | GRD-N02 |
| 주행 거리 변화만으로 주차 판단 | 정차와 주차를 구분하지 못합니다. 판단할 수 없으면 입력을 제한합니다 | dev-environment.md 4.3.1절 |
| 후보 검색을 위한 `requestRoute()` 반복 호출 | 실제 목적지를 바꿀 수 있습니다 | 7.3절 |
| 외부 장소 ID를 NaviHelper `poiId`로 사용 | 서로 다른 식별자입니다 | 7.3절 |

## 6. 외부 API와 장소 데이터

Pleos SDK 밖에서 쓰는 장소 정보와 내 AI 정리 단계입니다. 외부 API 호출, 데이터 수입, 제휴는 아직 하지 않았습니다.

### 6.1 장소 데이터 제공처

| 제공처 | 확인된 기능 | 쓰는 범위 | 확인할 제한 |
|---|---|---|---|
| 카카오 Local | 좌표·반경·분류·키워드 검색, ID·주소·좌표·상세 링크 | 목적지 주변 음식점·카페 후보 | REST API 키, 쿼터, 이용 조건. 조용함·주차 편의·실시간 영업은 기대하지 않습니다 |
| TourAPI 국문 관광정보 | 위치·키워드 검색, 관광지·음식점, 소개·이미지·변경 정보 | 여행지 설명, 관광 명소 후보 | 서비스키, 빠진 필드, 사진별 공공누리 조건 |
| 대한민국 명소발굴 (100×100) | 공식 소개에서 주제별 선정 결과와 지도 공개를 확인 | 주제별 발견 목록과 추천의 출처 | 공개 API, 공식 파일, 선정 판본, TourAPI ID 매핑, 재사용 범위를 확인하지 못했습니다 |
| 네이버 지역 검색 | 검색어 기반 업체 조회, 요청당 최대 5개 | 특정 상호를 찾는 보조 후보 | 주변 전체 목록이나 리뷰 원문으로 다루지 않습니다 |

- 먼저 카카오 Local과 TourAPI를 붙이고, 대한민국 명소발굴은 별도 입력으로 둡니다. 데이터가 늦어져도 개인 기억 기반 기본 추천은 동작합니다.
- 대한민국 명소발굴은 공식 운영 주체에 API·파일 제공 여부와 이용 조건을 확인한 뒤 판본이 있는 데이터로 들여옵니다. 조건이 분명하지 않으면 목록과 이미지를 복제하지 않고 원문 링크만 안내합니다. 화면 표기는 "대한민국 명소발굴 추천지"이며, 목업의 칩은 가상 장소에 붙인 예시입니다.
- 장소 검색 요청에는 중심 좌표, 분류, 검색어만 보냅니다. 가족 이름, 과거 동행, 방문 메모는 보내지 않고, 개인화는 앱 안에서 합니다.
- (제안) 서비스 키가 필요한 장소 검색 호출과 사용량 관리는 서버 어댑터가 맡는 방안을 검토합니다. 내 AI는 이와 달리 운전자가 휴대폰에서 등록한 API 키를 차량 기기의 암호화 저장소에 두고 앱이 직접 호출합니다([DECISIONS.md](DECISIONS.md) D-001).
- 한 공급자가 실패해도 전체 결과나 개인 기록을 지우지 않습니다. 쓸 수 있는 결과만 보여 주고 빠진 것을 알립니다.

### 6.2 같은 장소를 잇는 기준

- 앱 내부 장소 ID에 외부 식별자를 출처별로 연결합니다. 상호 이름 하나로 합치지 않습니다.
- 공식 매핑이 없으면 상호·지점명·주소·좌표·전화번호로 일치 후보를 만들고, 같은 건물의 여러 가게, 체인점, 관광지 안의 업소는 자동으로 합치지 않습니다.
- 불확실하면 운전자가 지점을 고르게 합니다. 잘못 합친 것을 나눠도 개인 방문은 지우지 않고 어느 장소의 방문인지 다시 확인합니다.
- HTML 목업은 가상 장소 ID만 씁니다. 이 기준은 아직 구현하지 않았습니다.

### 6.3 추천 규칙

1. 목적지 주변인지 먼저 확인하고 현재 위치 주변과 구별합니다.
2. 운전자가 꼭 필요하다고 한 조건은 확인할 수 있는 자료로 평가합니다. 미확인을 만족으로 처리하지 않습니다.
3. 직접 고른 취향과 이번 동행자의 확인된 선호를 반영합니다. "어머니" 같은 관계명만으로 걷기 제약을 만들지 않습니다.
4. 과거 방문은 기록과 이유로 보여 주고, 방문을 호감으로 보지 않습니다.
5. 같은 장소의 여러 출처를 하나로 묶고, 목적에 맞으면 서로 다른 두 후보를 보여 줍니다.
6. 정렬에 실제로 쓴 근거만 한 줄로 고르고, 대한민국 명소발굴 선정, 직접 고른 취향, 내 방문 기록의 출처를 구분합니다.

후보별 이동 시간을 얻으려고 NaviHelper 경로 변경 API를 쓰지 않습니다. 별도 경로 조회가 없으면 거리나 "이동 시간 미확인"까지만 표시합니다.

### 6.4 내 AI 정리 단계

운전자가 연결한 AI(Claude, ChatGPT, Gemini)는 모은 후보를 비교하고 이유를 쓰는 데만 씁니다. 후보를 새로 찾거나 실행을 맡지 않습니다(GRD-020, GRD-N07).

| 구분 | 내용 |
|---|---|
| 입력 | 후보 목록(앱 내부 ID, 이름, 분류, 목적지에서의 거리, 출처별 공개 필드, 대한민국 명소발굴 주제와 판본), 운전자가 고르거나 확인한 조건 태그(예: 조용한 분위기, 오래 걷지 않기), 이번 동행 여부, 활용을 허용한 방문의 장소·시점 |
| 보내지 않는 것 | 가족 이름, 남긴 한마디 원문, 집 주소, 실제 경로, 음성 오디오 |
| 출력 | 후보 ID 두 개까지, 후보별 한 줄 이유, 이유에 쓴 근거 필드, 확인하지 못한 조건 |
| 검증 | 후보 밖 ID, 근거 필드가 없거나 입력에 없는 사실을 쓴 이유, 미확인을 만족으로 쓴 문장은 버립니다. 남는 후보가 없으면 규칙 기반 추천(6.3절)을 씁니다 |
| 화면 | "○○가 정리한 이유", 출처 칩("관광 정보", "대한민국 명소발굴 추천지", "내 기록"), 미확인 칩 |
| 이어 묻기 | 정차 중 음성 인식 텍스트를 조건에 더해 다시 정리합니다. 새 취향은 운전자가 동의할 때만 저장합니다(GRD-021) |
| 호출 시점 | 정차·주차 중. 주행 중에는 호출하지 않고, 출발 전에 정리한 결과만 씁니다 |

## 7. API별 실패 처리와 내비 연결의 경계

### 7.1 먼저 쓸 기능

| 기능 | API (퍼미션) | 실패·미지원 시 |
|---|---|---|
| 목적지 맥락 | NaviHelper `getDestinationInfo()` → `onDestinationInfo` (`NAVI_ROUTE`) | 목적지가 없거나 조회에 실패하면 저장 장소나 직접 선택으로 갑니다. 콜백을 기다리는 동안 이전 목적지를 새 값으로 다루지 않습니다 |
| 현재 위치 | FusedLocation `isSupported()`, `getLastKnownLocation()`, `registerFusedLocationCallback()` (`FUSED_LOCATION`) | 미지원·권한 거부·null·오래된 값이면 목적지 기반으로 탐색합니다. 위치 콜백은 여정에 필요한 동안만 구독합니다 |
| 한마디 음성 | SpeechToText (`STT_SERVICE`) | 운전자가 시작한 한마디만 받고, 채택·재시도·취소 뒤 저장은 따로 확인합니다. 품질을 확인하기 전에는 추천 문구와 "한마디 없음"을 대안으로 둡니다. ON_DEVICE로 먼저 실험합니다 |
| 짧은 안내 | TextToSpeech (`TTS_SERVICE`) | 출력 실패를 저장·내비 실패로 오인하지 않습니다. 입력이 필요한 일은 정차 후로 미룹니다 |
| 승인한 경로 | NaviHelper `requestRoute()`, `requestRouteWithWaypoints()`, `addWaypoint()` (`NAVI_ROUTE_SEARCH`) | 거부·오류·결과 불명이면 후보 목록을 그대로 두고 실패를 표시합니다. 자동 재시도로 경유지를 중복 추가하지 않습니다 |
| 결과 확인 | `NaviHelperEventListener`, `getDestinationInfo()`, `getWaypointInfo()` (`NAVI_ROUTE`) | 메서드 호출이 성공했다고 적용 성공으로 표시하지 않습니다. 이벤트가 늦으면 현재 상태를 다시 조회합니다 |
| 화면 조작 제한 | `CarUxRestrictionsManager` (공모전 범위 확인 중, Q11) | 판단할 수 없으면 입력을 제한합니다. 시연용 수동 전환을 실제 차량 판정 대신 쓰지 않습니다 |

### 7.2 조건부로 쓰는 것

| 후보 | 판단 |
|---|---|
| AAOS `GEAR_SELECTION`, `PARKING_BRAKE_ON` | 주차 조건 검증에 필요한 것만 씁니다. 거부·미지원·오래된 값이면 조작 허용의 근거로 쓰지 않습니다(Q11) |
| Odometer `registerTripCurrentDrivingDistance` (`CAR_DRIVE`) | 이동 징후의 보조입니다. 값이 안 변한다는 이유로 주차를 확정하지 않습니다 |
| FusedLocation `addProximityAlert()` | 방문 후보 제안의 후속 실험입니다. 영역 진입은 방문·동행 확정이 아닙니다 |
| Vehicle Door `getDoor()` (`CAR_DOORS`) | 동행 질문의 계기입니다. 지원되지 않으면 동행자를 직접 고르고, 신원은 운전자가 확인합니다 |
| Vehicle Fuel / EvBattery (`CAR_ENERGY`) | 지원되는 필드만 씁니다. 잔량으로 도착 가능 여부를 추정하지 않습니다. Virtual Console은 배터리 항목만 확인했습니다 |
| Gleo Interface (App Schema) | 공지상 허용, 구현 절차 확인 필요. 연결하더라도 저장·내비 승인 규칙을 거칩니다 |
| HVAC, 차량 간 동기화 | 추천·방문 기록의 필수 의존에서 뺍니다 |

### 7.3 내비 연결에서 지킬 것

- 후보 검색에는 `requestRoute()`를 호출하지 않습니다. 실제 목적지를 바꿀 수 있습니다.
- 카카오 ID, TourAPI contentId, 앱의 장소 ID와 NaviHelper의 `poiId`는 서로 다른 식별자입니다. 외부 ID를 `poiId`에 넣지 않습니다.
- 경유지는 실행 구간마다 최대 두 곳입니다. 전체 귀가 여정은 구간마다 다시 승인합니다.
- 요청할 때의 목적지·경유 순서와 요청 버전을 묶어, 바꾸거나 취소한 뒤에 도착한 늦은 콜백이 새 계획을 성공으로 바꾸지 않게 합니다.
- 경유지 도착 이벤트, 지오펜스 진입, 경로 탐색 완료로 방문 스탬프를 찍지 않습니다.

## 8. 검증 계획과 현재 상태

- **현재:** [HTML 목업](../../spikes/grandma-journey-context/README.md) 하나가 SC-01~08을 가상 데이터로 시연합니다. 차량 화면 밖 시연 도구가 주행/정차, 도어 열림→닫힘, 연료, 위치, 내비 응답, 날씨, 외부 장소 검색 결과, 내 AI 응답(정상/실패)을 대신 넣습니다. 내비 적용, 음성, 차량 상태, 날씨, 외부 검색, 내 AI의 답은 모두 **SDK나 API에 연결하지 않은 시연**입니다.
- **다음:** 에뮬레이터 v2.1.0에서 아래 순서로 실험합니다.

| 순서 | 실험 | 통과 조건 |
|---|---|---|
| 1 | 주행 제한·권한 | 제한 상태 전환, 불명, 권한 거부 때 입력이 막힙니다. 입력 중 전환돼도 초안이 남습니다 |
| 2 | STT·TTS | 한국어 한마디 → 운전자 채택 → 최종 저장. 취소·실패는 기록을 만들지 않습니다 |
| 3 | 위치와 검색 | 지원, null, 오래된 위치를 구분합니다. 목적지 중심 검색에 현재 좌표를 잘못 넣지 않습니다 |
| 4 | 외부 장소 → 내비 | 지점·좌표 확인 → 승인 → 호출 → 목적지·경유지 콜백 일치. 오류와 재시도 중복을 확인합니다 |
| 5 | 기억 재사용 | 같은 장소 재방문만 연결합니다. 동행 예정과 실제 동행을 나눕니다. 삭제와 활용 제외가 다음 추천에 반영됩니다 |
| 6 | 내 AI 정리 | 등록한 키로 호출합니다. 후보 밖 장소나 근거 없는 이유는 버리고, 실패·지연 때 규칙 기반 추천으로 돌아갑니다 |

- 장소 데이터는 한 권역에서 먼저 실험합니다. 출처 사이 장소 연결, 실제 선정과 예시의 구분, 함께/혼자/미정에 따른 추천 차이, 장애·만료 때 계획과 개인 방문 보존을 봅니다. 만족도나 MAU 향상은 측정한 것처럼 쓰지 않습니다.
- 통과한 항목만 REQUIREMENTS.md에 `에뮬레이터 검증 (v2.1.0, 날짜, 별칭)`으로 올립니다.
- 남은 확인: Seat 값과 Virtual Console "좌석 점유", 경유지 적용 동작, 한국어 STT, 주행/정차 판단(공통 Q8, Q11).

## 9. 출처

- [개발 환경 문서](../../docs/contest/dev-environment.md) 4절(공식 SDK 문서 요약, 확인일 2026-11-12~14)
- [NaviHelper 목적지](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/destinations), [경유지](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/waypoint-settings), [FusedLocation](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/FusedLocation/intro), [SpeechToText](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/SpeechToText/intro), [TextToSpeech](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/TextToSpeech/intro) (확인일 2026-11-14)
- [대한민국 명소발굴 공식 소개](https://www.korean-culture.org/koreanet/view.do?seq=1055494), [대한민국 명소발굴 사이트](https://spot100x100.kr/), [카카오 Local 개발 가이드](https://developers.kakao.com/docs/ko/local/dev-guide), [TourAPI 국문 관광정보](https://www.data.go.kr/data/15101578/openapi.do), [네이버 지역 검색](https://developers.naver.com/docs/serviceapi/search/local/local.md) (확인일 2026-11-14)
