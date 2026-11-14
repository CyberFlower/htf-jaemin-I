# Pleos SDK 활용: 내 차로 짓는 도시 (`GAM`)

> 상태: **Draft** (2026-11-14 작성). 요구사항이 모두 Draft이므로 우선순위와 범위는 바뀔 수 있습니다.
> 원천: [REQUIREMENTS.md](REQUIREMENTS.md) 각 FR의 "의존" 줄, [dev-environment.md](../../docs/contest/dev-environment.md) 4절(API 근거)·6절(퍼미션 정책). 이 문서는 원천을 모아 보여 줄 뿐이고, 어긋나면 원천을 따릅니다.
> 검증 태그: **문서 확인**은 Pleos 공식 문서에 적혀 있다는 뜻입니다. **에뮬레이터에서 동작을 확인한 항목은 아직 없습니다.** **확인 필요**는 질문 ID([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), 공통 질문은 [open-questions.md](../../docs/open-questions.md))와 함께 적습니다.

## 1. 한눈에 보기

| SDK·인터페이스 | 쓰는 곳 (기능 한 줄) | 주요 API | 퍼미션 | 검증 | 우선순위 |
|---|---|---|---|---|---|
| Vehicle · Odometer | 달린 거리 → 건축 자재, 정비까지 남은 거리, 운전 시간 항목, 쉬어 가기 퀘스트 | 누적 주행 거리, 트립 거리·시간 | `CAR_DRIVE` | 문서 확인 | P0 (GAM-001, 006), P1 |
| Vehicle · Brake | 급제동 없이 운전 (일일 항목) | `getCurrentBrakePedalStatus` | `CAR_DRIVE` | 문서 확인 | P1 (GAM-028) |
| Vehicle · TurnSignal | 방향 지시등 사용 (일일 항목) | `getCurrentTurnSignalState`, `registerTurnSignalState` | `CAR_LIGHTS` | 문서 확인 | P1 (GAM-029) |
| Vehicle · Seat | 동승석 점유 → 섬 손님, 모두 안전벨트 (일일 항목) | `getCurrentSeatOccupancy`, `registerSeatOccupancy`, `getCurrentSeatBeltBuckledState`, `registerSeatBeltBuckledState` | `CAR_SEATS` | 문서 확인. 값의 의미 확인 필요 (GAM-Q30) | P1 (GAM-034, 035) |
| Vehicle · Safety (레벨·경고) | 차량이 확인하는 관리 퀘스트 (엔진오일·브레이크액·변속기 오일 양, 워셔액) | `getEngineOilLevelState`, `getBrakeFluidLevelState`, `getTransmissionOilLevelState`, `hasLowWasherFluidWarning`과 각 콜백 | `CAR_SAFETY` (normal) | 문서 확인. 에뮬레이터에서 값 바꾸기 확인 필요 (GAM-Q40) | P1 (GAM-048) |
| Vehicle · Safety (경고등) | 실제 차량 경고(공기압, 과열) → 도시 이상 현상 | `registerTelltales` (`TelltaleType`의 `TPMS`, `ENGINE_TEMPERATURE`) | `PRIVATE_CAR_SAFETY` (signature\|privileged) | 문서 확인. 일반 앱이 쓸 수 있는지 확인 필요 (GAM-Q3) | P0 (GAM-009) |
| Vehicle · CarInfo | 차종별 정비 주기 | CarInfo 조회 | `CAR_INFO` | 문서 확인. 주기 데이터 출처 확인 필요 (GAM-Q5) | P0 (GAM-006) |
| Vehicle · EvBattery | 배터리 관리 퀘스트 (확장) | EvBattery 조회 | `CAR_ENERGY` | 문서 확인 | P2 (GAM-014) |
| NaviHelper | 도로 주의 구간(공사, 낙석, 사고 다발 구역 등) → 돌발 퀘스트 | `onCautionPointInfo`, `onCameraAlert`, `onReRouteEnded`, `onDestinationArrived` | 리스너 퍼미션은 문서 표에 없음 (확인 필요) | 문서 확인. 에뮬레이터 수신 확인 필요 (GAM-Q31) | P1 (GAM-036) |
| FusedLocation | 이 차가 지나간 도시에 발자국 (전국 지도, 확장 제안) | `isSupported()`, `registerFusedLocationCallback()`, `getLastKnownLocation()`, `addProximityAlert()` | `FUSED_LOCATION` (dangerous) | 문서 확인. 권역 판정 확인 필요 (GAM-Q35) | P1 (GAM-043) |
| TextToSpeech | 장거리 운행 중 쉬어 가기 안내 한 줄 (주행 중 유일한 음성) | TextToSpeech 합성 | `TTS_SERVICE` | 문서 확인 | P1 (GAM-030) |
| SpeechToText | 음성 조회, 음성 매뉴얼 (확장) | SpeechToText 인식 | `STT_SERVICE` | 문서 확인 | P2 (GAM-010, 015) |
| Gleo Interface | 음성으로 보상·정비 조회 (확장) | App Schema | 확인 필요 | 공지상 사용 가능, 절차 확인 필요 (GAM-Q7) | P2 (GAM-010) |
| AAOS Car API | 주행·주차 판단, 급가속·급감속 판정 | `CarPropertyManager` `PERF_VEHICLE_SPEED`, `GEAR_SELECTION`, `PARKING_BRAKE_ON`, `CarUxRestrictionsManager` | `Car.PERMISSION_SPEED` (Dangerous), `Car.PERMISSION_POWERTRAIN` (Normal) | 문서 확인. **공모전 범위 확인 중 (Q11)** | P0 (GAM-003, N01), P1 (GAM-027) |

차량 신호가 게임의 어떤 순간을 만드는지:

- **주차하는 순간**: Odometer가 잰 거리가 택배 상자의 자재가 되고, Brake·TurnSignal·Seat·AAOS 속도로 판정한 안전운전 항목이 같은 상자에 담깁니다. 희소 재화인 자재는 차량 신호로만 생깁니다([D-003](DECISIONS.md), GAM-N08).
- **주행 중**: 앱은 기록만 하고 말하지 않습니다(GAM-N06). 예외는 쉬어 가기 안내 한 줄(TTS)입니다. 주의 구간 안내는 내비가 이미 하므로 겹쳐 말하지 않습니다(GAM-036).
- **차가 이상을 알릴 때**: Safety 신호가 섬의 이상 현상과 관리 퀘스트가 되고, 신호가 정상으로 돌아오면 입력 없이 끝납니다(GAM-009, GAM-048). 실제 경고 카드가 항상 먼저입니다(GAM-N02).
- **신호가 없을 때**: 도메인마다 capability를 먼저 확인하고, 없으면 그 기능만 "판정 불가"나 "표시 안 함"으로 둡니다. 값을 지어내지 않습니다.

## 2. 대표 시나리오 장면별 SDK 흐름

[SCENARIO.md](SCENARIO.md) 2절 "토요일 장보기"의 장면 순서입니다.

| 장면 | 차량 상태 | 신호·API (퍼미션) | 앱이 하는 일 | 신호가 없을 때 | 요구사항 |
|---|---|---|---|---|---|
| SC-01 낮의 섬 | 주차 | 주차 판단: AAOS `GEAR_SELECTION`, `PARKING_BRAKE_ON` (`Car.PERMISSION_POWERTRAIN`), `CarUxRestrictionsManager` — 확인 필요 (GAM-Q1, Q8, Q11) | 주차가 확인되면 섬 조작을 엽니다. 시설 생산은 기기 시각으로 흐릅니다 | 판단할 수 없으면 조작을 막습니다 | GAM-031, GAM-N01 |
| SC-02 출발하면 주행 모드 | 주행 | 주행 판단: 위와 같음. Odometer 누적 거리 (`CAR_DRIVE`) 운행 시작값 기록 | 열린 창을 닫고 조작을 막습니다. 운행 시작 시점의 누적 거리와 일일 항목 신호를 기록만 합니다 | 판단할 수 없으면 주행으로 봅니다 | GAM-N01, GAM-N06 |
| SC-03 주차하면 택배가 온다 | 주차 | Odometer 누적 거리·트립 시간 (`CAR_DRIVE`), Brake `getCurrentBrakePedalStatus` (`CAR_DRIVE`), TurnSignal 상태 콜백 (`CAR_LIGHTS`), AAOS `PERF_VEHICLE_SPEED` (`Car.PERMISSION_SPEED`, Q11) | 운행 전·후 누적 거리 차이로 자재를 주고, 일일 항목을 판정해 택배 카드에 근거와 함께 보여 줍니다 | Odometer가 없으면 자재를 적립하지 않습니다. 항목별 신호가 없으면 "판정 불가"로 둡니다 | GAM-001, GAM-003, GAM-018, GAM-025~029 |
| SC-04 시장을 짓고 야시장으로 | 주차 | 차량 신호 없음 (로컬 저장). 조작 허용에만 주차 판단 | 자재로 시설을 짓습니다 | 주차를 판단할 수 없으면 짓기를 막습니다 | GAM-004, GAM-005, GAM-019 |
| SC-05 거두고, 사고, 쓰다듬기 | 주차 | 차량 신호 없음 (로컬 저장, 기기 시각) | 시설이 번 골드를 거두고 상점을 씁니다 | 위와 같음 | GAM-031~033 |
| SC-06 정비소 주민의 정비 알림 | 주차 | Odometer 누적 거리 (`CAR_DRIVE`), CarInfo (`CAR_INFO`). 정비 이력 API는 없음 — 미지원 (GAM-Q4) | 마지막 교체 기록과 누적 거리로 남은 거리·기간을 계산하고 `점검 권장`까지만 말합니다 | 정비 이력은 사용자 기록으로 대신합니다. 주기 데이터가 없으면 확인 필요 (GAM-Q5) | GAM-006, GAM-007, GAM-N05 |
| SC-07 공기압 경고와 일렁이는 길 | 경고 | Safety `registerTelltales` (`TelltaleType`의 `TPMS`) (`PRIVATE_CAR_SAFETY`) — 일반 앱 사용 여부 확인 필요 (GAM-Q3) | 실제 경고 카드를 맨 위에 띄우고 섬의 길을 일렁이게 합니다. 경고가 풀리면 둘 다 사라집니다 | 경고 신호를 받을 수 없으면 이상 현상을 만들지 않습니다. 경고를 추측하지 않습니다 | GAM-009, GAM-N02 |

대표 시나리오 밖에서 SDK를 쓰는 장면 (UC 연결):

| 장면 | 신호·API | 요구사항 |
|---|---|---|
| 동승자가 타면 섬에 손님, 모두 안전벨트를 매고 출발 | Seat 좌석 점유·안전벨트 체결 (`CAR_SEATS`) | GAM-UC-005, GAM-034, GAM-035 |
| 경로의 공사·낙석 구간을 지나오면 섬의 길도 정리 | NaviHelper `onCautionPointInfo`, `onCameraAlert`, `onReRouteEnded`, `onDestinationArrived` | GAM-UC-006, GAM-036 |
| 장거리 운행 중 쉬어 가기 안내 → 주차해 쉬면 완료 | Odometer 트립 시간 (`CAR_DRIVE`), TextToSpeech (`TTS_SERVICE`) | GAM-UC-002, GAM-030 |
| 엔진오일 양이 모자라다는 신호 → 정상으로 돌아오면 완료 | Safety `getEngineOilLevelState` 등 (`CAR_SAFETY`) | GAM-048 |
| 이 차가 지나간 도시에 발자국 | FusedLocation (`FUSED_LOCATION`) | GAM-043 |

## 3. 기능별 API 목록

근거 열은 [dev-environment.md](../../docs/contest/dev-environment.md)의 절입니다.

### 3.1 Vehicle

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| Odometer 누적 주행 거리 | `CAR_DRIVE` | 운행 거리 자재, 정비까지 남은 거리, 정비 현황 | GAM-001, 006, 018, 022 | 문서 확인 | 4.2 |
| Odometer 트립 거리·시간 | `CAR_DRIVE` | 운전 시간 항목, 쉬어 가기, 단거리 비율(확장) | GAM-026, 030, 013 | 문서 확인. 초기화 시점·정차 포함 여부 확인 필요 (GAM-Q25) | 4.2, 4.3.1 |
| Brake `getCurrentBrakePedalStatus` | `CAR_DRIVE` | 급제동 판정 보조 | GAM-028 | 문서 확인 | 4.2 |
| `checkTurnSignalStateCapabilities`, `getCurrentTurnSignalState`, `registerTurnSignalState` | `CAR_LIGHTS` | 방향 지시등 항목 | GAM-029 | 문서 확인 | 4.2 |
| Seat `checkSeatOccupancyCapabilities`, `getCurrentSeatOccupancy`, `registerSeatOccupancy` | `CAR_SEATS` | 섬 손님 연출 | GAM-034 | 문서 확인. 값의 의미 확인 필요 (GAM-Q30) | 4.2 |
| Seat `checkSeatBeltBuckledCapabilities`, `getCurrentSeatBeltBuckledState`, `registerSeatBeltBuckledState` | `CAR_SEATS` | 모두 안전벨트 항목 | GAM-035 | 문서 확인. 값의 의미 확인 필요 (GAM-Q30) | 4.2 |
| Safety `getEngineOilLevelState`, `registerEngineOilLevelState`, `getBrakeFluidLevelState`, `getTransmissionOilLevelState`, `hasLowWasherFluidWarning`, `registerLowWasherFluidWaringState` | `CAR_SAFETY` (normal) | 차량이 확인하는 관리 퀘스트 | GAM-048 | 문서 확인. 에뮬레이터 값 확인 필요 (GAM-Q40) | 4.2.1 |
| Safety `registerTelltales` (`TPMS`, `ENGINE_TEMPERATURE`) | `PRIVATE_CAR_SAFETY` (signature\|privileged) | 도시 이상 현상 | GAM-009 | 문서 확인. 일반 앱 사용 여부 확인 필요 (GAM-Q3) | 4.2.1 |
| Safety `registerSeatBeltNotBuckledWarning` | `CAR_SAFETY` | 쓰지 않음. 차량 자체 경고를 앱이 대신하거나 가리지 않음 | GAM-UC-005, GAM-N02 | 문서 확인 | 4.2 |
| CarInfo | `CAR_INFO` | 차종별 정비 주기 | GAM-006 | 문서 확인. 주기 데이터 출처 확인 필요 (GAM-Q5) | 4.2 |
| EvBattery | `CAR_ENERGY` | 배터리 관리 퀘스트 | GAM-014 (P2) | 문서 확인. 12V 배터리 신호 확인 필요 (GAM-Q14) | 4.2 |

### 3.2 NaviHelper

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `onCautionPointInfo(List<CautionPoint>)` — `id`, `type`(`CautionPointType`), `remainDistance` | 확인 필요 | 주의 구간 돌발 퀘스트 생성·지나감 판정 | GAM-036 | 문서 확인. 에뮬레이터 수신 확인 필요 (GAM-Q31) | 4.4.1 |
| `onCameraAlert(List<CameraAlert>)` — `isOverSpeed`, `type`(`CameraType`) | 확인 필요 | 어린이 보호구역 안전 통과 판정 | GAM-036 | 문서 확인 (GAM-Q31) | 4.4.1 |
| `onReRouteEnded()`, `onDestinationArrived()` | 확인 필요 | 우회 표시, 도착 후 완료 | GAM-036, 037 | 문서 확인 | 4.4.1 |
| `requestRoute()` | `NAVI_ROUTE_SEARCH` | 배터리 리프레시 코스 제안 (확장) | GAM-014 (P2) | 문서 확인 | 4.4 |

- 쓰는 `CautionPointType` 후보와 섬 연출은 [ROAD-INFO.md](ROAD-INFO.md) 2절에 있습니다. `ACCIDENT_PRONE_AREA`는 사고 다발 구역이고 실시간 사고가 아닙니다(GAM-N07).

### 3.3 FusedLocation

| API·콜백 | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `isSupported()`, `registerFusedLocationCallback()`, `getLastKnownLocation()`, `addProximityAlert()` | `FUSED_LOCATION` (dangerous) | 도시 발자국 (지도 표시만, 재화 없음, D-004) | GAM-043 | 문서 확인. 권역 판정 확인 필요 (GAM-Q35) | 4.5 |

### 3.4 음성 (TextToSpeech, SpeechToText, Gleo Interface)

| API | 퍼미션 | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| TextToSpeech | `TTS_SERVICE` | 쉬어 가기 안내 한 줄. 차량 경고나 내비 안내 중이면 미룸 | GAM-030 | 문서 확인 | 4.5 |
| SpeechToText | `STT_SERVICE` | 음성 조회·음성 매뉴얼 (확장) | GAM-010, 015 (P2) | 문서 확인 | 4.5 |
| Gleo Interface (App Schema) | 확인 필요 | 음성 명령으로 앱 기능 호출 (확장) | GAM-010 (P2) | 공지상 사용 가능, 절차 확인 필요 (GAM-Q7) | 4, 4.5 |

### 3.5 AAOS Car API (공모전 범위 확인 중, Q11)

| API·프로퍼티 | 권한 (보호 수준) | 용도 | 요구사항 | 검증 | 근거 |
|---|---|---|---|---|---|
| `CarPropertyManager` `PERF_VEHICLE_SPEED` | `Car.PERMISSION_SPEED` (Dangerous) | 급가속·급감속·급제동 판정 | GAM-027, 028 | 문서 확인. 에뮬레이터 속도 시연 확인 필요 (GAM-Q23) | 4.3 |
| `GEAR_SELECTION`, `PARKING_BRAKE_ON` | `Car.PERMISSION_POWERTRAIN` (Normal) | 주차 판단 | GAM-003, N01 | 확인 필요 (GAM-Q1, Q8) | 4.3 |
| `CarUxRestrictionsManager` `registerListener()` | 확인 필요 | 주행 중 UX 제한 | GAM-N01 | 확인 필요 (Q8) | 4.3 |

- Q11이 "불가"이면 Odometer 주행 거리 변화로 주행 여부를 어림하고, 속도가 필요한 두 항목은 "판정 불가"로 둡니다(4.3.1절).

## 4. 선언할 퍼미션

최소 퍼미션 원칙을 따릅니다. 공모전 단계에서는 매니페스트 선언만으로 에뮬레이터에서 쓸 수 있고, 정식 심사는 App Market 배포 때입니다([dev-environment.md](../../docs/contest/dev-environment.md) 6절).

| 퍼미션 | 보호 수준 | 이유 | 요구사항 |
|---|---|---|---|
| `pleos.car.permission.CAR_DRIVE` | 문서에 표기 없음 | Odometer, Brake | GAM-001, 006, 026, 028, 030 |
| `pleos.car.permission.CAR_LIGHTS` | 문서에 표기 없음 | TurnSignal | GAM-029 |
| `pleos.car.permission.CAR_SEATS` | 문서에 표기 없음 | Seat 점유·안전벨트 | GAM-034, 035 |
| `pleos.car.permission.CAR_SAFETY` | normal | Safety 레벨·워셔액 | GAM-048 |
| `pleos.car.permission.PRIVATE_CAR_SAFETY` | signature\|privileged | 경고등(TPMS, 과열). 일반 앱에 주어지지 않을 수 있음 | GAM-009 (GAM-Q3) |
| `pleos.car.permission.CAR_INFO` | 문서에 표기 없음 | CarInfo | GAM-006 |
| `NAVI_ROUTE` | 문서에 표기 없음 | NaviHelper 정보 조회 | GAM-036 (리스너 퍼미션 확인 필요) |
| `FUSED_LOCATION` | dangerous (실행 중 동의) | 도시 발자국 | GAM-043 |
| `TTS_SERVICE` | 문서에 표기 없음 | 쉬어 가기 안내 | GAM-030 |
| `Car.PERMISSION_SPEED` | Dangerous (실행 중 동의) | 급가속·급감속·급제동 | GAM-027, 028 (Q11) |
| `Car.PERMISSION_POWERTRAIN` | Normal | 기어, 주차 브레이크 | GAM-003, N01 (Q11) |

- Dangerous 권한을 거부하면 그 권한이 필요한 항목만 "판정 불가"나 "발자국 없음"으로 두고, 나머지 기능은 그대로 동작합니다(GAM-027, GAM-043).
- P2 기능(SpeechToText, EvBattery, NaviHelper `NAVI_ROUTE_SEARCH`)의 퍼미션은 그 기능을 만들 때만 선언합니다.

## 5. 쓰지 않는 것과 이유

| 쓰지 않는 것 | 이유 | 근거 |
|---|---|---|
| 차량 제어 (`CONTROL_CAR_*`) | 게임이 차를 움직이지 않습니다. 음성 차량 제어(GAM-016)는 범위가 정해지지 않았습니다 | GOAL Non-goals, GAM-Q16 |
| Tire `getLowTirePressure` | 저압 **기준값**만 주므로 공기압 경고로 쓸 수 없습니다 | dev-environment 4.2.1 |
| AAOS `TIRE_PRESSURE`, `ENGINE_COOLANT_TEMP` | Signature\|Privileged 권한이라 일반 앱이 읽을 수 없습니다 | dev-environment 4.2.1 |
| 정비 이력 API | 없습니다. 교체 기록은 사용자가 입력합니다 | GAM-006, GAM-Q4 |
| Vehicle Fuel (연료 사용 보상) | 연료를 많이 쓸수록 보상이 커지는 구조를 피했습니다 | D-002, GAM-002 Dropped |
| 외부 음성 인식 | 차량 마이크 음성은 SpeechToText로만 처리합니다 | dev-environment 4.5 |
| Pleos LLM SDK | 공모전 기간 중 제공되지 않습니다 | dev-environment 4 |
| 실시간 사고 정보 API | Pleos SDK와 AAOS에 없습니다. 외부 공공 API는 공모전 범위 확인 전이라 P2로 둡니다 | GAM-037, GAM-Q32, [ROAD-INFO.md](ROAD-INFO.md) |

## 6. 검증 계획과 현재 상태

**현재 상태:** [HTML 목업](../../spikes/game-isometric/README.md)은 차량 신호를 화면 밖 시뮬레이터 값으로 넣습니다. **Pleos SDK와 에뮬레이터에는 아직 연결하지 않았습니다.** 1차 접수의 화면과 영상은 이 목업으로 만듭니다.

에뮬레이터(Pleos Connect Emulator v2.1.0)에서 확인할 순서 (2차 PT 전까지):

| 순서 | 확인할 것 | 질문 |
|---|---|---|
| 1 | 주행·주차 판단: AAOS 기어·주차 브레이크와 `CarUxRestrictionsManager`가 오는지, 공모전 범위 답변 | GAM-Q1, Q8, Q11 |
| 2 | Odometer 누적 거리와 트립 시간이 Virtual Console로 바뀌는지, 앱이 화면에 없을 때 콜백을 받는지 | GAM-Q2, GAM-Q25 |
| 3 | 경고등 `registerTelltales`를 일반 앱에서 쓸 수 있는지 (`PRIVATE_CAR_SAFETY`) | GAM-Q3 |
| 4 | Seat 좌석 점유·안전벨트 값의 의미, Virtual Console "좌석 점유" | GAM-Q30 |
| 5 | NaviHelper 주의 구간·단속 카메라 이벤트가 경로 안내 중에 오는지 | GAM-Q31 |
| 6 | Safety 레벨 신호(엔진오일 등)를 바꿀 수 있는지 | GAM-Q40 |
| 7 | 속도를 바꿀 방법이 없을 때 급가속·급제동 시연 방법 | GAM-Q23 |

확인한 항목은 [REQUIREMENTS.md](REQUIREMENTS.md)의 의존 줄에 `에뮬레이터 검증 (v2.1.0, 날짜, 확인자 별칭)`으로 적고, 이 문서를 다시 맞춥니다.
