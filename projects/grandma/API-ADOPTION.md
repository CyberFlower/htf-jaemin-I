# 다녀왔습니다: 시나리오별 API 채용안

> 상태: **Draft**. [시나리오](SCENARIOS.md)와 [요구사항](REQUIREMENTS.md)의 구현 의존, API별 실패 처리, 실험 순서입니다. 요약은 [SDK.md](SDK.md)에 있습니다.
> 실제 SDK를 연결한 결과가 아니며, 아래 항목은 모두 에뮬레이터 미검증입니다.

## 1. 확인 기준과 중요한 변경

기준은 [개발 환경 문서](../../docs/contest/dev-environment.md)다. FusedLocation·STT·TTS 소개와 NaviHelper 목적지·경유지 공식 문서는 직접 확인했다(확인일 2026-11-14). 공모전 제한은 개발 환경 문서의 확인 기록을 근거로 한다.

- 외부 장소 API 연동은 검토할 수 있다. 다만 차량 마이크 음성을 외부 STT로 보내는 설계는 제외하고 **Pleos SpeechToText**를 사용한다.
- Gleo Interface는 공지상 허용된다. 그러나 등록·권한·함수 스키마 연결이 완료됐다는 뜻은 아니다.
- AAOS Car API는 사용 가능하다는 팀 작업 가정이며 **공통 Q11 답변 대기**다. 위치나 페달만으로 정차·주차를 확정하지 않는다.
- Vehicle Brake에는 주차 브레이크 getter가 없다. SDK 목록의 존재만으로 좌석 점유·탑승자 신원을 읽을 수 있다고 보지 않는다.
- 목업의 14.6인치·1920×1080은 사용자 지정 설계 기준이며 실제 에뮬레이터 규격 확인 결과가 아니다(공통 Q4).

## 2. 먼저 채용할 기능

아래 순서는 기술 검증 순서 제안이다. Pleos 권한 이름의 접두어는 `pleos.car.permission.`이다.

| 기능 / 시나리오 | 채용 API와 권한 | 앱에서 맡길 일 | 실패·미지원 시 |
|---|---|---|---|
| 목적지 맥락 / A·C | NaviHelper `getDestinationInfo()` → `onDestinationInfo` (`NAVI_ROUTE`) — **문서 확인** | 이미 선택된 목적지를 읽고 사용자가 이번 탐색 대상으로 확인. 현재 위치와 목적지 좌표를 구분 | 목적지 없음·조회 실패면 저장 장소나 수동 선택. 콜백을 기다리며 이전 목적지를 새 값으로 취급하지 않음 |
| 현재 위치 / A·G | FusedLocation `isSupported()`, `getLastKnownLocation()`, `registerFusedLocationCallback()` (`FUSED_LOCATION`, Dangerous) — **문서 확인** | ‘지금 여기’ 주변 후보, 허용한 여정의 위치 관측. 위치 시각을 확인 | 미지원·권한 거부·null·오래된 값이면 목적지 기반 탐색. 방문은 사용자 확인 |
| 기록 음성 / G | SpeechToText `initialize()`, `addListener()`, `setLocale()`, `request()`, `stop()` (`STT_SERVICE`) — **문서 확인** | 사용자가 시작한 한마디를 텍스트로 받아 채택·재시도·취소. 저장은 별도 확인 | 한국어·ON_DEVICE 품질 확인 전 선택 문구·생략을 기본 대안으로 제공. 상시 녹음 없음 |
| 짧은 안내 / F | TextToSpeech `initialize()`, `addEventListener()`, `speak()`, `stop()` (`TTS_SERVICE`) — **문서 확인** | 확인된 안내 한 줄 낭독. 동행자 앞 개인 기억 공개 범위 적용 | 출력 실패를 저장·내비 실패로 오인하지 않음. 입력을 요구하는 작업은 정차 후로 미룸 |
| 승인한 경로 / E | NaviHelper `requestRoute()`, `requestRouteWithWaypoints()`, `addWaypoint()` (`NAVI_ROUTE_SEARCH`) — **문서 확인** | 사용자가 승인한 목적지·순서만 내비에 전달 | 거부·오류·결과 불명 시 후보 목록은 보존하고 실패 표시. 자동 재시도로 경유지를 중복 추가하지 않음 |
| 결과 확인 / E | `NaviHelperEventListener`, `getDestinationInfo()`, `getWaypointInfo()` (`NAVI_ROUTE`) — **문서 확인** | 경로 탐색 완료 이벤트와 요청한 목적지·경유지의 일치를 확인 | 메서드 호출 성공을 적용 성공으로 표시하지 않음. 이벤트 지연 시 현재 상태 재조회 |
| 화면 조작 제한 / 전 단계 | `CarUxRestrictionsManager.registerListener()` → `onUxRestrictionsChanged()` — **문서 확인 [Pleos 참고], 공모전 범위 확인 중(Q11), 권한 확인 필요** | 플랫폼 주행 규제를 UI 입력 허용 여부에 반영. 앱 복귀·연결 끊김도 처리 | UC-015 E2와 같이 입력을 제한. 시연용 수동 전환을 실제 차량 판정 대체로 사용하지 않음 |

위치 콜백은 여정에 필요한 동안만 구독하고 종료 시 해제한다. 마지막 위치는 새로운 측정값이 아니다. STT/TTS는 우선 ON_DEVICE를 실험하고 품질에 따라 SDK의 HYBRID를 검토한다. HYBRID·SERVER에는 앱 등록 등 추가 준비가 필요하다. 이 선택은 음성 품질을 보장하지 않는다.

## 3. 조건부 채용과 후속 기능

| 후보 | 판단 | 이유·근거·대안 |
|---|---|---|
| AAOS `GEAR_SELECTION`, `PERF_VEHICLE_SPEED`, `PARKING_BRAKE_ON` | 주차 조건 검증에 필요한 것만 추가 | `CarPropertyManager` 지원 확인. 속도는 `Car.PERMISSION_SPEED`(Dangerous), 기어·주차 브레이크는 `Car.PERMISSION_POWERTRAIN`(Normal). **문서 확인 [Android/Pleos 참고], 공모전 범위 확인 중(Q11)**. 거부·미지원·오래된 값이면 조작 허용 근거로 쓰지 않음 |
| Odometer 거리 변화 | 이동 관측의 보조 | `registerTripCurrentDrivingDistance` (`CAR_DRIVE`) — **문서 확인**. 이동 징후는 얻어도 값이 안 변한다는 이유로 주차를 확정할 수 없다. Q11 불가 시에도 UX 잠금 해제의 단독 대안으로 채택하지 않음 |
| FusedLocation `addProximityAlert()` | 방문 후보 제안의 후속 실험 | `FUSED_LOCATION` — **문서 확인**. 영역 진입은 방문·동행 확정이 아니며 배경 동작·호출 빈도 검증 필요(GRD-Q12·19) |
| Vehicle Door | 실제 탑승 확인 질문의 보조 | `getDoor()`와 도메인 capability/상태 콜백 (`CAR_DOORS`) — **문서 확인**, 구체 콜백·값은 구현 전 확인. 도어 미지원이면 수동 동행 선택. 실제 신원은 항상 사용자 확인(GRD-008) |
| EvBattery / Fuel | 기존 출발 준비 시나리오에서 사용 | `CAR_ENERGY` — **문서 확인**. 지원되는 필드만 채택. 잔량으로 목적지 도달 가능·충전소 영업을 추정하지 않음. Virtual Console은 배터리 항목 확인, 연료 조작은 미확인(GRD-006) |
| Gleo Interface(App Schema) | 앱 호출·명령 연계의 후속 후보 | 공지상 허용, 구현 절차 **확인 필요**. 앱의 ‘기록 시작’ 등의 기능을 연결하더라도 저장·내비 승인 규칙을 통과해야 함. STT 자체가 기능을 실행하지는 않음 |
| HVAC / Seat / 차량 간 동기화 | 이번 추천·방문 기록 실험의 필수 의존에서 제외하는 제안 | HVAC 제어·좌석 점유·사용자 계정 동기화는 별도 검증이 필요. 개인 기억의 연속성은 Vehicle API가 자동 제공하지 않음 |
| `requestNavigationScreen()` | 필요할 때만 검토 | `NAVI_CUSTOM_MAP` — **문서 확인**. 지도 화면 요청이며 장소 검색·자체 지도 데이터 API가 아님 |

Q11이 불가이거나 주행 제한 상태를 읽지 못하면, SDK의 거리 변화만으로 사용자가 조작할 수 있는 차량 화면을 구현했다고 주장하지 않는다. 해당 흐름은 명시한 목업으로만 시연하고, 실제 앱의 입력 허용 대책은 공통 Q8·Q11 및 GRD-Q22에서 확정해야 한다.

## 4. 내비 연결에서 놓치면 안 되는 경계

- **후보 검색에는 `requestRoute()`를 호출하지 않는다.** 이 API는 실제 목적지를 설정할 수 있다. 후보별 예상 우회 시간을 얻으려고 현재 경로를 반복 변경하지 않는다.
- 카카오 ID·TourAPI contentId·우리 placeId와 NaviHelper의 `poiId`는 같은 식별자가 아니다. 외부 좌표·이름·주소만으로 요청 가능한지, POI ID가 없을 때의 표현은 SDK 타입/에뮬레이터에서 확인한다(GRD-Q25). 임의로 카카오 ID를 `poiId`에 넣지 않는다.
- 공식 경유지 가이드는 FIRST·SECOND의 **최대 두 경유지**를 설명한다. 앱의 ‘담은 곳’은 더 많을 수 있어도 실행할 구간과 최대 두 경유지는 별도로 선택한다. 전체 귀가 여정은 구간별 재승인한다.
- 요청 당시 목적지·경유 순서와 요청 버전을 묶는다. 사용자가 변경·취소한 뒤 도착한 늦은 콜백이 새 계획을 성공으로 바꾸지 않도록 한다.
- 경유지 도착 이벤트·지오펜스 진입·경로 탐색 완료로 방문 스탬프를 찍지 않는다.
- 공식 Waypoints 가이드의 예시에는 `onWaypointInfo`와 `onWayPointInfo` 표기가 혼재한다. 실제 3.0.5 인터페이스로 컴파일할 때 정확한 시그니처를 확인한다. 문서 표기만으로 실행을 검증했다고 하지 않는다.

## 5. 최소 실험 순서와 성공 기준

| 순서 | 실험 | 관찰 가능한 통과 조건 |
|---|---|---|
| 1 | 주행 제한·권한 | 제한 상태 전환/불명/권한 거부 때 입력 차단. 입력 중 전환해도 초안 보존. 에뮬레이터 규격 기록 |
| 2 | STT·TTS | 한국어 한마디 결과 → 사용자 채택 → 최종 저장. 취소·실패는 기록을 만들지 않음. ON_DEVICE와 네트워크 실패 대안 확인 |
| 3 | 위치와 검색 | 지원/null/오래된 위치를 구분. 목적지 중심 검색에 현재 차량 좌표를 잘못 넣지 않음 |
| 4 | 외부 장소 → 내비 | 지점·좌표 확인 → 승인 → 호출 → 목적지/경유지 콜백 일치. ID 없는 요청·오류·재시도 중복 확인 |
| 5 | 기억 재사용 | 동일 장소 재방문만 연결. 동행 예정·실제 동행 분리. 삭제/활용 제외가 다음 추천에 반영 |

구현 전 매니페스트 권한 목록과 SDK 버전을 기록하고, 검증 후에만 `에뮬레이터 검증 (v2.1.0, 날짜, 별칭)` 태그를 붙인다. HTML 목업의 기능 테스트는 이 실험을 대신하지 않는다.

## 6. 출처

- 저장소 기준: [개발 환경 0~6절](../../docs/contest/dev-environment.md), [공통 Q8·Q11](../../docs/open-questions.md), [요구사항 근거 탐색 순서](../../docs/process/requirements-guide.md).
- [FusedLocation 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/FusedLocation/intro).
- [SpeechToText 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/SpeechToText/intro), [TextToSpeech 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/TextToSpeech/intro).
- [NaviHelper 목적지](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/destinations), [경유지](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/waypoint-settings), [API Reference](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/entry).
