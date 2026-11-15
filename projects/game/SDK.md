# Pleos SDK 활용: 내 차로 짓는 도시 (`GAM`)

게임의 각 장면이 어떤 SDK 신호로 움직이는지 정리했습니다. 기능별 상세는 [REQUIREMENTS.md](REQUIREMENTS.md)에 있습니다.

## 1. 사용 SDK

| SDK·인터페이스 | 쓰는 곳 | 주요 API | 퍼미션 | 우선순위 |
|---|---|---|---|---|
| Vehicle Odometer | 달린 거리 → 건축 자재, 정비까지 남은 거리, 운전 시간 항목, 쉬어 가기 퀘스트 | 누적 주행 거리, 트립 거리·시간 | `CAR_DRIVE` | P0 (GAM-001, GAM-006), P1 |
| Vehicle Brake | 급제동 없이 운전 (일일 항목) | `getCurrentBrakePedalStatus` | `CAR_DRIVE` | P1 (GAM-028) |
| Vehicle TurnSignal | 방향 지시등 사용 (일일 항목) | `getCurrentTurnSignalState`, `registerTurnSignalState` | `CAR_LIGHTS` | P1 (GAM-029) |
| Vehicle Seat | 동승석 점유 → 섬 손님, 모두 안전벨트 (일일 항목) | `getCurrentSeatOccupancy`, `registerSeatOccupancy`, `getCurrentSeatBeltBuckledState`, `registerSeatBeltBuckledState` | `CAR_SEATS` | P1 (GAM-034, GAM-035) |
| Vehicle Safety (레벨·경고) | 차량이 확인하는 관리 퀘스트 (엔진오일·브레이크액·변속기 오일 양, 워셔액) | `getEngineOilLevelState`, `getBrakeFluidLevelState`, `getTransmissionOilLevelState`, `hasLowWasherFluidWarning`과 각 콜백 | `CAR_SAFETY` | P1 (GAM-048) |
| Vehicle Safety (경고등) | 실제 차량 경고(공기압, 과열) → 도시 이상 현상 | `registerTelltales` (`TelltaleType`의 `TPMS`, `ENGINE_TEMPERATURE`) | `PRIVATE_CAR_SAFETY` | P0 (GAM-009) |
| Vehicle CarInfo | 차종별 정비 주기 | CarInfo 조회 | `CAR_INFO` | P0 (GAM-006) |
| Vehicle EvBattery | 배터리 관리 퀘스트 (확장) | EvBattery 조회 | `CAR_ENERGY` | P2 (GAM-014) |
| NaviHelper | 도로 주의 구간(공사, 낙석, 사고 다발 구역 등) → 돌발 퀘스트 | `onCautionPointInfo`, `onCameraAlert`, `onReRouteEnded`, `onDestinationArrived` | `NAVI_ROUTE` | P1 (GAM-036) |
| FusedLocation | 이 차가 지나간 도시에 발자국 (전국 지도) | `isSupported()`, `registerFusedLocationCallback()`, `getLastKnownLocation()`, `addProximityAlert()` | `FUSED_LOCATION` | P1 (GAM-043) |
| TextToSpeech | 장거리 운행 중 쉬어 가기 안내 한 줄 (주행 중 유일한 음성) | TextToSpeech 합성 | `TTS_SERVICE` | P1 (GAM-030) |
| SpeechToText | 음성 조회, 음성 매뉴얼 (확장) | SpeechToText 인식 | `STT_SERVICE` | P2 (GAM-010, GAM-015) |
| Gleo Interface | 음성으로 보상·정비 조회 (확장) | App Schema | | P2 (GAM-010) |
| AAOS Car API | 주행·주차 판단, 급가속·급감속 판정 | `CarPropertyManager` `PERF_VEHICLE_SPEED`, `GEAR_SELECTION`, `PARKING_BRAKE_ON`, `CarUxRestrictionsManager` | `Car.PERMISSION_SPEED`, `Car.PERMISSION_POWERTRAIN` | P0 (GAM-003, GAM-N01), P1 (GAM-027) |

차량 신호가 게임에서 하는 일:

| 순간 | 신호 | 게임에서 일어나는 일 |
|---|---|---|
| 주차할 때 | Odometer, Brake, TurnSignal, Seat, AAOS 속도 | 달린 거리와 안전운전 결과가 택배 상자에 담깁니다. 희소 재화인 자재는 차량 신호로만 생깁니다([D-003](DECISIONS.md), GAM-N08) |
| 주행 중 | Odometer, Brake, TurnSignal, AAOS 속도, TextToSpeech | 신호를 기록만 하고 운전자에게 알리지 않습니다(GAM-N06). 오래 쉬지 않고 달렸을 때만 TTS로 쉬어 가자고 한 번 안내합니다(GAM-030) |
| 차가 이상을 알릴 때 | Safety | 섬에 이상 현상이 생기거나 관리 퀘스트가 열리고, 신호가 정상으로 돌아오면 끝납니다. 실제 경고 카드가 항상 먼저입니다(GAM-N02) |
| 신호가 없을 때 | 각 도메인의 capability 확인 | 그 기능만 "판정 불가"나 "표시 안 함"으로 둡니다. |

앱은 차량을 제어하지 않고, 실제 차량 경고를 대신하거나 가리지 않습니다(GAM-N02).

## 2. 대표 시나리오 장면별 SDK 흐름

[SCENARIO.md](SCENARIO.md)의 대표 시나리오 "토요일 장보기" 순서입니다. 퍼미션은 3절에 있습니다.

| 장면 | 차량 상태 | 쓰는 신호·API | 앱이 하는 일 | 신호가 없을 때 | 요구사항 |
|---|---|---|---|---|---|
| SC-01 낮의 섬 | 주차 | 주차 판단: AAOS `GEAR_SELECTION`, `PARKING_BRAKE_ON`, `CarUxRestrictionsManager` | 주차가 확인되면 섬 조작을 엽니다. 시설 생산은 기기 시각으로 흐릅니다 | 판단할 수 없으면 조작을 막습니다 | GAM-031, GAM-N01 |
| SC-02 출발하면 주행 모드 | 주행 | 주행 판단(위와 같음), Odometer 누적 거리 | 열린 창을 닫고 조작을 막습니다. 운행 시작 시점의 누적 거리와 일일 항목 신호를 기록만 합니다 | 판단할 수 없으면 주행으로 봅니다 | GAM-N01, GAM-N06 |
| SC-03 주차하면 택배가 온다 | 주차 | Odometer 누적 거리·트립 시간, Brake `getCurrentBrakePedalStatus`, TurnSignal 상태 콜백, AAOS `PERF_VEHICLE_SPEED` | 운행 전후 누적 거리 차이로 자재를 주고, 일일 항목을 판정해 근거와 함께 택배 카드에 보여 줍니다 | Odometer가 없으면 자재를 적립하지 않습니다. 항목별 신호가 없으면 "판정 불가"로 둡니다 | GAM-001, GAM-003, GAM-018, GAM-025~029 |
| SC-04 시설 짓기 | 주차 | 차량 신호 없음(로컬 저장). 조작 허용에만 주차 판단 | 자재로 시설을 짓습니다 | 주차를 판단할 수 없으면 짓기를 막습니다 | GAM-004, GAM-019 |
| SC-05 거두고, 사고, 쓰다듬기 | 주차 | 차량 신호 없음(로컬 저장, 기기 시각) | 시설이 번 골드를 거두고 상점을 씁니다 | 위와 같음 | GAM-031~033 |
| SC-06 정비소 주민의 정비 알림 | 주차 | Odometer 누적 거리, CarInfo | 마지막 교체 기록과 누적 거리로 남은 거리와 기간을 계산하고 "점검 권장"까지만 말합니다 | 정비 이력 API가 없어 사용자 기록으로 대신합니다 | GAM-006, GAM-007, GAM-N05 |
| SC-07 공기압 경고와 일렁이는 길 | 경고 | Safety `registerTelltales` (`TPMS`) | 실제 경고 카드를 맨 위에 띄우고 섬의 길을 일렁이게 합니다. 경고가 풀리면 둘 다 사라집니다 | 경고 신호를 받을 수 없으면 이상 현상을 만들지 않습니다 | GAM-009, GAM-N02 |
| SC-08 전국 지도에서 내 도시 보기 | 주차 | FusedLocation `isSupported()`, `registerFusedLocationCallback()`, `getLastKnownLocation()`, `addProximityAlert()` | 이 차가 지나간 도시를 발자국(도시와 날짜만)으로 지도에 남깁니다 | 위치 권한이 없으면 발자국 없이 동작하고 "발자국 기록 꺼짐"을 보여 줍니다 | GAM-038, GAM-043, GAM-044 |
| SC-09 차로 모은 자재로 새 도시 열기 | 주차 | 직접 쓰는 신호 없음. 자재는 SC-03의 Odometer와 안전운전 신호에서 나옵니다 | 자재를 차감하고 도시를 엽니다 | 주차를 판단할 수 없으면 열기를 막습니다 | GAM-039, GAM-N08 |

대표 시나리오 밖에서 SDK를 쓰는 장면:

| 장면 | 신호·API | 요구사항 |
|---|---|---|
| 동승자가 타면 섬에 손님이 오고, 모두 안전벨트를 매고 출발 | Seat 좌석 점유·안전벨트 체결 | GAM-UC-005, GAM-034, GAM-035 |
| 경로의 공사·낙석 구간을 지나오면 섬의 길도 정리 | NaviHelper `onCautionPointInfo`, `onCameraAlert`, `onReRouteEnded`, `onDestinationArrived` | GAM-UC-006, GAM-036 |
| 장거리 운행 중 쉬어 가기 안내, 주차해 쉬면 완료 | Odometer 트립 시간, TextToSpeech | GAM-UC-002, GAM-030 |
| 엔진오일 양이 모자라다는 신호, 정상으로 돌아오면 완료 | Safety `getEngineOilLevelState` 등 | GAM-048 |

## 3. 기능별 API 목록

### 3.1 Vehicle

| API·콜백 | 퍼미션 | 용도 | 요구사항 |
|---|---|---|---|
| Odometer 누적 주행 거리 | `CAR_DRIVE` | 운행 거리 자재, 정비까지 남은 거리, 정비 현황 | GAM-001, 006, 018, 022 |
| Odometer 트립 거리·시간 | `CAR_DRIVE` | 운전 시간 항목, 쉬어 가기, 단거리 비율(확장) | GAM-026, 030, 013 |
| Brake `getCurrentBrakePedalStatus` | `CAR_DRIVE` | 급제동 판정 보조 | GAM-028 |
| `checkTurnSignalStateCapabilities`, `getCurrentTurnSignalState`, `registerTurnSignalState` | `CAR_LIGHTS` | 방향 지시등 항목 | GAM-029 |
| Seat `checkSeatOccupancyCapabilities`, `getCurrentSeatOccupancy`, `registerSeatOccupancy` | `CAR_SEATS` | 섬 손님 연출 | GAM-034 |
| Seat `checkSeatBeltBuckledCapabilities`, `getCurrentSeatBeltBuckledState`, `registerSeatBeltBuckledState` | `CAR_SEATS` | 모두 안전벨트 항목 | GAM-035 |
| Safety `getEngineOilLevelState`, `registerEngineOilLevelState`, `getBrakeFluidLevelState`, `getTransmissionOilLevelState`, `hasLowWasherFluidWarning`, `registerLowWasherFluidWaringState` | `CAR_SAFETY` | 차량이 확인하는 관리 퀘스트 | GAM-048 |
| Safety `registerTelltales` (`TPMS`, `ENGINE_TEMPERATURE`) | `PRIVATE_CAR_SAFETY` | 도시 이상 현상 | GAM-009 |
| CarInfo | `CAR_INFO` | 차종별 정비 주기 | GAM-006 |
| EvBattery | `CAR_ENERGY` | 배터리 관리 퀘스트 | GAM-014 (P2) |

### 3.2 NaviHelper

| API·콜백 | 용도 | 요구사항 |
|---|---|---|
| `onCautionPointInfo(List<CautionPoint>)`: `id`, `type`(`CautionPointType`), `remainDistance` | 주의 구간 돌발 퀘스트 생성, 지나감 판정 | GAM-036 |
| `onCameraAlert(List<CameraAlert>)`: `isOverSpeed`, `type`(`CameraType`) | 어린이 보호구역 안전 통과 판정 | GAM-036 |
| `onReRouteEnded()`, `onDestinationArrived()` | 우회 표시, 도착 후 완료 | GAM-036, 037 |
| `requestRoute()` (`NAVI_ROUTE_SEARCH`) | 배터리 리프레시 코스 제안 (확장) | GAM-014 (P2) |

- 쓰는 `CautionPointType`과 섬 연출은 [ROAD-INFO.md](ROAD-INFO.md) 2절에 있습니다. `ACCIDENT_PRONE_AREA`는 사고 다발 구역이고 실시간 사고가 아닙니다(GAM-N07).

### 3.3 FusedLocation

| API·콜백 | 퍼미션 | 용도 | 요구사항 |
|---|---|---|---|
| `isSupported()`, `registerFusedLocationCallback()`, `getLastKnownLocation()`, `addProximityAlert()` | `FUSED_LOCATION` | 도시 발자국 (지도 표시만, 재화 없음, [D-004](DECISIONS.md)) | GAM-043 |

### 3.4 음성 (TextToSpeech, SpeechToText, Gleo Interface)

| API | 퍼미션 | 용도 | 요구사항 |
|---|---|---|---|
| TextToSpeech | `TTS_SERVICE` | 쉬어 가기 안내 한 줄. 차량 경고나 내비 안내 중이면 미룹니다 | GAM-030 |
| SpeechToText | `STT_SERVICE` | 음성 조회, 음성 매뉴얼 (확장) | GAM-010, 015 (P2) |
| Gleo Interface (App Schema) | | 음성 명령으로 앱 기능 호출 (확장) | GAM-010 (P2) |

### 3.5 AAOS Car API

| API·프로퍼티 | 권한 | 용도 | 요구사항 |
|---|---|---|---|
| `CarPropertyManager` `PERF_VEHICLE_SPEED` | `Car.PERMISSION_SPEED` | 급가속·급감속·급제동 판정 | GAM-027, 028 |
| `GEAR_SELECTION`, `PARKING_BRAKE_ON` | `Car.PERMISSION_POWERTRAIN` | 주차 판단 | GAM-003, N01 |
| `CarUxRestrictionsManager` `registerListener()` | | 주행 중 UX 제한 | GAM-N01 |

- AAOS 신호를 쓸 수 없으면 Odometer 주행 거리 변화로 주행 여부를 어림하고, 속도가 필요한 두 항목은 "판정 불가"로 둡니다.

## 4. 선언할 퍼미션

필요한 퍼미션만 선언합니다.

| 퍼미션 | 이유 | 요구사항 |
|---|---|---|
| `pleos.car.permission.CAR_DRIVE` | Odometer, Brake | GAM-001, 006, 026, 028, 030 |
| `pleos.car.permission.CAR_LIGHTS` | TurnSignal | GAM-029 |
| `pleos.car.permission.CAR_SEATS` | Seat 점유, 안전벨트 | GAM-034, 035 |
| `pleos.car.permission.CAR_SAFETY` | Safety 레벨, 워셔액 | GAM-048 |
| `pleos.car.permission.PRIVATE_CAR_SAFETY` | 경고등(TPMS, 과열) | GAM-009 |
| `pleos.car.permission.CAR_INFO` | CarInfo | GAM-006 |
| `NAVI_ROUTE` | NaviHelper 정보 조회 | GAM-036 |
| `FUSED_LOCATION` | 도시 발자국. 실행 중 사용자 동의 | GAM-043 |
| `TTS_SERVICE` | 쉬어 가기 안내 | GAM-030 |
| `Car.PERMISSION_SPEED` | 급가속·급감속·급제동. 실행 중 사용자 동의 | GAM-027, 028 |
| `Car.PERMISSION_POWERTRAIN` | 기어, 주차 브레이크 | GAM-003, N01 |

- 실행 중 동의가 필요한 권한을 거부하면 그 권한이 필요한 항목만 "판정 불가"나 "발자국 없음"으로 두고, 나머지 기능은 그대로 동작합니다(GAM-027, GAM-043).
- P2 기능(SpeechToText, EvBattery, NaviHelper `NAVI_ROUTE_SEARCH`)의 퍼미션은 그 기능을 만들 때 선언합니다.

## 5. 현재 구현 상태

[HTML 목업](../../spikes/game-isometric/README.md)은 차량 신호를 화면 밖 시뮬레이터 값으로 넣습니다. **Pleos SDK와 에뮬레이터에는 아직 연결하지 않았습니다.** 1차 접수의 화면과 영상은 이 목업으로 만듭니다.
