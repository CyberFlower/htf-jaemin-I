# Pleos SDK 활용: 다녀왔습니다 (`GRD`)

> 상태: **Draft / 2026-11-14**. 심사자가 "Pleos SDK를 어디에 어떻게 쓰는가"를 한눈에 보도록 정리한 요약입니다.
> 원천: [REQUIREMENTS.md](REQUIREMENTS.md)의 "의존" 줄, [dev-environment.md](../../docs/contest/dev-environment.md) 4절, [API-ADOPTION.md](API-ADOPTION.md). 어긋나면 원천을 따르고 이 파일을 고칩니다.
> 역할 구분: 이 문서는 **심사자용 요약**입니다. API별 실패 처리, 내비 연결의 경계, 실험 순서 같은 **구현 검증 상세**는 [API-ADOPTION.md](API-ADOPTION.md)에 있습니다.
> 검증 태그: "문서 확인"은 공식 Pleos 문서에 API가 적혀 있다는 뜻입니다. **에뮬레이터에서 동작을 확인한 항목은 아직 없습니다.** "확인 필요"는 질문 ID와 함께 적습니다. 요구사항은 모두 Draft입니다.

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
| SC-02 조율·확정 | 정차 | (SDK 없음) 날씨·장소 외부 API — 확인 필요 | 여정 초안과 출처·조회 시각. 경로·공조·전송을 하나씩 승인 | 외부 정보가 없으면 "미확인"으로 표시하고 수동 계획 | GRD-003, GRD-005 |
| SC-03 출발 | 정차 | Vehicle Fuel / EvBattery (`CAR_ENERGY`), NaviHelper `requestRouteWithWaypoints()` / `addWaypoint()` (`NAVI_ROUTE_SEARCH`) | 연료·배터리 상태로 준비 안내와 경유 제안. 승인한 1구간 경로를 내비에 적용하고 콜백으로 결과 확인 | 도메인 미지원이면 "확인 불가". 적용 실패면 알리고 계획을 보존 | GRD-006, GRD-007 |
| SC-04 주행 (1구간) | 주행 | 주행/정차 판단 (AAOS, Q11), TextToSpeech (`TTS_SERVICE`) | 조작 화면을 숨기고 다음 목적지와 안내 한 줄을 음성으로 | 판단할 수 없으면 입력을 제한 | GRD-N01 |
| SC-05 동행 | 정차 | Vehicle Door (`CAR_DOORS`), Vehicle Seat 좌석 점유 (`CAR_SEATS`), NaviHelper (`NAVI_ROUTE_SEARCH`) | 도어 열림→닫힘을 관측하면 동행을 묻고, 확인 뒤 2구간 경로 적용 | 도어·좌석 신호가 없으면 사용자가 동행자를 직접 고른다. 문만 열고 닫은 것을 탑승으로 확정하지 않음 | GRD-008, GRD-N02 |
| SC-06 주행 (2구간) | 주행 | TextToSpeech (`TTS_SERVICE`), 주행/정차 판단 | 남은 시간과 약속의 맥락 한 줄 | TTS 실패를 저장·내비 실패로 오인하지 않음 | GRD-N01, GRD-UC-011 |
| SC-07 다녀옴 | 주차 | FusedLocation 이동 기록 (`FUSED_LOCATION`), SpeechToText (`STT_SERVICE`) | 실제 이동과 사용자가 확인한 방문으로 기록 초안. 한마디를 더해 약속 완료 | 위치·음성이 없으면 선택 입력으로 기록. 정차·경유지 도착만으로 방문을 확정하지 않음 | GRD-010, GRD-016 |
| SC-08 다시 가는 여정 | 정차 | NaviHelper `getDestinationInfo()` → `onDestinationInfo` (`NAVI_ROUTE`), FusedLocation, SpeechToText, NaviHelper 경로 적용 | 같은 장소의 기억으로 이번 동행을 묻고, 주변 후보 두 곳과 이유를 보여 준 뒤, 승인한 경유지를 적용 | 목적지 조회 실패면 저장 장소나 수동 선택. 검색 실패면 저장된 방문 장소만 표시 | GRD-013~018 |

지금 HTML 목업(SC-01~07 첫 방문, SC-08 재방문)은 위 신호를 실제로 읽지 않는 시연입니다(6절).

## 3. 기능별 API 목록

### 3.1 Vehicle

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| Fuel / EvBattery 도메인 조회 | `CAR_ENERGY` | 출발 전 연료·배터리 상태 | GRD-006 | 문서 확인 | dev-environment.md 4.2절 |
| `getDoor()` (Door 도메인: 열림·닫힘) | `CAR_DOORS` | 동행 질문의 계기, 홈 탑승 후보 카드 | GRD-008, GRD-018 | 문서 확인 | 4.1·4.2절, API-ADOPTION.md 3절 |
| `checkSeatOccupancyCapabilities`, `getCurrentSeatOccupancy`, `registerSeatOccupancy` | `CAR_SEATS` | 동행 확인 보조 신호 | GRD-008 | API 이름 문서 확인. 값의 의미·에뮬레이터 동작 확인 필요 (GRD-Q2) | 4.2절 Seat |
| 도메인별 `checkXXXCapabilities` | 도메인별 | 지원 여부를 먼저 확인하고 대체 동작으로 분기 | 전체 | 문서 확인 | 4.1절 |
| Odometer `registerTripCurrentDrivingDistance` | `CAR_DRIVE` | 이동 관측의 보조. 이것만으로 주차를 확정하지 않음 | GRD-N01 | 문서 확인 | 4.3.1절, API-ADOPTION.md 3절 |

### 3.2 NaviHelper

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `requestRouteWithWaypoints()`, `addWaypoint()` | `NAVI_ROUTE_SEARCH` | 승인한 목적지·경유지 적용(최대 두 경유지) | GRD-007 | 문서 확인. 에뮬레이터 동작 확인 필요 (GRD-Q3) | 4.4절, API-ADOPTION.md 4절 |
| `requestRoute()` | `NAVI_ROUTE_SEARCH` | 승인한 목적지만 적용. 후보 검색에는 쓰지 않음 | GRD-007 | 문서 확인 | 4.4절 |
| `getDestinationInfo()` → `onDestinationInfo`, `getWaypointInfo()` | `NAVI_ROUTE` | 선택된 목적지 읽기, 적용 결과가 요청과 같은지 확인 | GRD-014, GRD-007 | 문서 확인 | 4.4절 `get*Info()`, API-ADOPTION.md 2절 |
| `NaviHelperEventListener` (`onRouteStarted()`, `onRoutingCompleted()`, `onDestinationArrived()`, `onWayPointArrived()` 등) | `NAVI_ROUTE` | 경로 적용 결과 확인. 도착 이벤트로 방문을 확정하지 않음 | GRD-007, GRD-016 | 문서 확인 | 4.4.1절 |

### 3.3 FusedLocation

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `isSupported()`, `getLastKnownLocation()` | `FUSED_LOCATION` (Dangerous) | 정차한 자리 주변 장소 후보. 위치 시각 확인 | GRD-002, GRD-014 | 문서 확인 | 4.5절 |
| `registerFusedLocationCallback()` | `FUSED_LOCATION` | 허용한 여정 동안의 이동 기록. 여정이 끝나면 해제 | GRD-010 | 문서 확인 | 4.5절, API-ADOPTION.md 2절 |
| `addProximityAlert()` | `FUSED_LOCATION` | (후속 실험) 방문 후보 제안. 영역 진입은 방문 확정이 아님 | GRD-016 | 문서 확인 | 4.5절, API-ADOPTION.md 3절 |

### 3.4 SpeechToText · TextToSpeech

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| SpeechToText `initialize()`, `addListener()`, `setLocale()`, `request()`, `stop()` | `STT_SERVICE` | 사용자가 시작한 한마디를 텍스트로. 채택·재시도·취소 후 저장은 별도 확인 | GRD-002, GRD-016 | 문서 확인. 한국어·ON_DEVICE 품질 확인 필요 (GRD-Q6) | 4.5절, API-ADOPTION.md 2절 |
| TextToSpeech `initialize()`, `speak()`, `stop()` | `TTS_SERVICE` | 주행 중 안내 한 줄 | GRD-N01 | 문서 확인 | 4.5절, API-ADOPTION.md 2절 |

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
| 승인 없는 차량 제어·외부 전송 | 경로·공조·전송은 운전자가 각각 승인한 뒤에만 실행합니다 | GRD-005, GRD-N05 |
| Vehicle HVAC 제어 (동행자 공조) | P2 확장이고 제어 퍼미션 이름이 확인되지 않았습니다. 제어할 수 없으면 준비 체크리스트로 대신합니다 | GRD-009, GRD-Q4, Q6 |
| 신호만으로 탑승·신원·방문 확정 | 도어·좌석·위치·도착 이벤트는 관측일 뿐입니다. 사용자가 확인합니다 | GRD-N02 |
| 주행 거리 변화만으로 주차 판단 | 정차와 주차를 구분하지 못합니다. 판단할 수 없으면 입력을 제한합니다 | dev-environment.md 4.3.1절, API-ADOPTION.md 3절 |
| 후보 검색을 위한 `requestRoute()` 반복 호출 | 실제 목적지를 바꿀 수 있습니다 | API-ADOPTION.md 4절 |
| 외부 장소 ID를 NaviHelper `poiId`로 사용 | 서로 다른 식별자입니다(GRD-Q25) | API-ADOPTION.md 4절 |

## 6. 검증 계획과 현재 상태

- **현재:** [HTML 목업](../../spikes/grandma-journey-context/README.md) 하나가 SC-01~08을 가상 데이터로 시연합니다(첫 방문 목업은 2026-11-15에 통합). 차량 화면 밖 시연 도구가 주행/정차, 도어 열림→닫힘, 연료, 위치, 내비 응답, 날씨, 외부 장소 검색 결과를 대신 넣습니다. 내비 적용, 음성, 차량 상태, 날씨, 외부 검색은 모두 **SDK에 연결하지 않은 시연**입니다.
- **다음:** [API-ADOPTION.md](API-ADOPTION.md) 5절의 최소 실험 순서를 에뮬레이터 v2.1.0에서 진행합니다.
  1. 주행 제한·권한 (입력 차단, 권한 거부)
  2. STT·TTS (한국어 한마디 → 채택 → 저장)
  3. 위치와 검색 (지원·null·오래된 위치 구분)
  4. 외부 장소 → 내비 (승인 → 호출 → 콜백 일치, 중복 방지)
  5. 기억 재사용 (동일 장소, 동행 예정·실제 동행 분리)
- 통과한 항목만 REQUIREMENTS.md에 `에뮬레이터 검증 (v2.1.0, 날짜, 별칭)`으로 올립니다.
- 남은 확인: Seat 값과 Virtual Console "좌석 점유"(GRD-Q2, GAM-Q30), 경유지 적용 동작(GRD-Q3), 한국어 STT(GRD-Q6), 주행/정차 판단(공통 Q8, Q11).
