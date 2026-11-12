# 개발 환경과 Pleos Connect SDK

> 출처 (확인일 2026-11-12):
> [공모전 개발 환경](https://appdevchallenge.auto-hmg.io/guide/development) ·
> [에뮬레이터 설정](https://document.pleos.ai/docs/connect/guide/getting-started/application-development/setup-connect-sdk-emulator) ·
> [SDK 개요](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/) ·
> [API Reference](https://document.pleos.ai/api-reference/connect-sdk-pleos) ·
> [Pleos Playground](https://pleos.ai/playground)
>
> 이 문서의 "문서 확인"은 공식 문서에 적혀 있다는 뜻입니다. 에뮬레이터에서 동작을 확인했다는 뜻이 아닙니다.
> 검증한 항목은 각 프로젝트 `REQUIREMENTS.md`에 `에뮬레이터 검증 (v2.1.0, 날짜)`으로 기록합니다.

## 1. 공모전 필수 요건

| 항목 | 값 |
|---|---|
| 플랫폼 | Pleos Connect: Android Automotive OS(AAOS) 기반 차량 인포테인먼트 |
| minSdk | API 28 이상. 차량 사이버 보안 요건(서명 키 로테이션, lineage 지원) 때문입니다 |
| Gradle | 8.0 이상 |
| 언어 | Java 또는 Kotlin |
| 에뮬레이터 | Pleos Connect Emulator **v2.1.0** (Virtual Console 최소 버전) |

## 2. 참고 빌드 구성 (공식 Vehicle 샘플 앱)

샘플: <https://github.com/Pleos-Playground/pleos-sample-vehicle-app>

| 항목 | 샘플 값 | 우리 앱 |
|---|---|---|
| compileSdk / targetSdk | 35 | 같게 시작 |
| minSdk | 23 | **28** (공모전 요건) |
| Android Gradle Plugin | 8.8.2 | 같게 시작 |
| Kotlin | 2.0.0 | 같게 시작 |
| Gradle wrapper | 8.10.2 | 같게 시작 |
| JDK | 17 | 17 |

UI 프레임워크(Compose 또는 View)는 문서에 명시되어 있지 않습니다. 구현 방식은 [ADR-0002](../decisions/0002-mockup-implementation.md)에서 정합니다.

## 3. 에뮬레이터 설치

1. 최신 Android Studio를 설치합니다.
2. **Tools > SDK Manager > SDK Update Sites**에서 `+`를 눌러 추가합니다.
   - Name: `Pleos Connect System Image`
   - Windows/Linux URL: `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-sys-img.xml`
   - Mac URL: `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-arm64-sys-img.xml`
3. **SDK Platforms** 탭에서 Show Package Details를 켜고, API 34의 Pleos Connect system image를 설치합니다. 이전 버전 에뮬레이터가 있으면 먼저 삭제합니다.
4. **Device Manager > Create device > Automotive > Pleos Connect v2.1.0**을 선택합니다. Advanced Settings에서 Default boot를 **Cold**, RAM을 **4 GB**로 둡니다. system image는 API 34 / `Pleos Connect v2.1.0 APIs`를 고릅니다.

주의할 점:

- **Cold boot 필수.** quick boot로 켜면 VHAL을 쓸 수 없습니다.
- **외장 GPU 필수.** 최소 사양은 NVIDIA RTX 3060 Laptop 6GB 또는 AMD RX 6600M 8GB / RX 6700S 8GB급입니다. 권장 사양은 RTX 4060/5060 Laptop 8GB 또는 RX 7700S / 7600M XT 8GB급입니다. 팀원마다 실행할 수 있는지 미리 확인합니다.
- STT를 테스트하려면 Extended Controls > Microphone에서 오디오 입력을 허용합니다.
- 기본 언어는 한국어입니다(차량 설정 > 일반 설정 > 언어).
- 이 버전은 Bluetooth 동글을 지원하지 않습니다.
- **화면 규격**은 문서에서 찾지 못했습니다. 에뮬레이터를 실행한 뒤 `adb shell wm size`와 `adb shell wm density`로 확인해 README 제출 정보에 적습니다(공모전 README 필수 항목).
- Virtual Console 사용 가이드 링크(`/docs/connect/guide/app-test-guide/virtual-console-guide`)는 2026-11-12 기준 404입니다. 어떤 차량 신호를 조작할 수 있는지 아직 확인하지 못했습니다.

## 4. SDK 목록

| SDK | 역할 | 기준 버전 | 의존성 좌표 | 퍼미션 |
|---|---|---|---|---|
| Vehicle | 차량 상태 조회와 차량 제어 | 2.3.2 (Service 2.3.21) | `ai.pleos.playground:Vehicle:2.3.2` | 도메인별 (4.2절) |
| NaviHelper | 경로 안내 제어, 내비게이션 정보 조회 | 3.0.5 | `ai.pleos.playground:NaviHelper:3.0.5` | `NAVI_ROUTE`, `NAVI_ROUTE_SEARCH`, `NAVI_CUSTOM_MAP` |
| FusedLocation | 차량 위치 | 1.1.3 | 확인 필요 (`FusedLocation/project-setup`) | `FUSED_LOCATION` |
| SpeechToText | 음성 인식. 텍스트만 돌려주고 명령은 실행하지 않습니다 | 3.3.1 | 확인 필요 | 확인 필요 |
| TextToSpeech | 음성 합성 | 3.3.1 | 확인 필요 | 확인 필요 |

퍼미션의 전체 이름은 `pleos.car.permission.<이름>`입니다.

Maven 저장소는 `settings.gradle.kts`에 등록합니다.

```kotlin
dependencyResolutionManagement {
    repositories {
        maven { url = uri("https://nexus-playground.pleos.ai/repository/maven-releases/") }
    }
}
```

### 4.1 Vehicle SDK 사용 방식

- `Vehicle` 인스턴스로 시작합니다. `initialize()`로 연결하고, `getDoor()` 같은 `getXxx()` 메서드로 도메인 객체를 얻고, 다 쓰면 `release()`로 해제합니다.
- 차량 통신은 IPC라서 결과가 `onComplete` / `onFailed` 콜백으로 비동기 전달됩니다. 콜백이 끝나기 전에 `release()`를 호출하지 않습니다.
- 도메인마다 `checkXXXCapabilities`로 지원 여부를 먼저 확인합니다. **지원하지 않을 때의 대체 동작을 요구사항에 적습니다.**
- 도메인은 capability / get / set / callback(register, unregister) API를 제공합니다.

### 4.2 Vehicle 도메인과 읽기 퍼미션

| 도메인 | 제공 (문서 요약) | 읽기 퍼미션 | 관련 후보 |
|---|---|---|---|
| Brake | 브레이크 페달, 주차 브레이크 상태 | `CAR_DRIVE` | 공통: 정차·주차 판단 후보 |
| CarInfo | 외부 크기, 제조사, 연식 | `CAR_INFO` | GAM: 차종별 정비 주기 |
| Display | 온도 단위 등 표시 설정 | `CAR_INFO` | |
| Door | 열림·닫힘, 잠금·해제 | `CAR_DOORS` | GRD: 탑승 후보 감지 |
| DrivingMode | 드라이브 모드, 크루즈 컨트롤 | `CAR_DRIVE` | |
| EvBattery | 배터리·충전 상태, 전비 | `CAR_ENERGY` | GRD: 출발 준비 · GAM: EV 보상 |
| Fuel | 연비 등 연료 정보 | `CAR_ENERGY` | GAM: 보급 토큰 · GRD: 출발 준비 |
| HVAC | 온도, 풍량, 습도 제어·조회 | `CAR_CLIMATE` | GRD: 동행자 공조 |
| Light | 조명 상태, 앰비언트 라이트 제어 | `CAR_LIGHTS` | |
| Odometer | 총 주행 거리, 트립 거리·시간, 거리 단위 | `CAR_DRIVE` | GAM: 건축 자재, 정비 퀘스트 |
| Safety | 차량 경고(Warning) | `CAR_SAFETY` | GAM: 도시 이상 현상 |
| Seat | 위치, 각도, 기능 제어·조회 | `CAR_SEATS` | GRD: 탑승 후보 (점유 정보 확인 필요) |
| SideMirror | 사이드미러 열선 | `CAR_MIRRORS` | |
| Steeringwheel | 핸들 상태, 열선 | 퍼미션 표에 없음 | |
| Tire | 타이어 상태 | `CAR_SAFETY` | GAM: 공기압 경고 |
| Toll | 하이패스 음성 안내 음량 | `CAR_TOLL` | |
| TurnSignal | 방향 지시등 | `CAR_LIGHTS` | |
| Window | 창문 제어·상태 | `CAR_WINDOWS` | |
| Wiper | 와이퍼 제어·상태 | `CAR_WINDOWS` | |

쓰기(제어) 퍼미션은 `CONTROL_CAR_*` 형식입니다(예: `CONTROL_CAR_DOORS`). 정확한 이름은 각 API의 `@RequiresPermission`에서 확인합니다. 퍼미션이 없으면 `onFailed`로 `VehicleException`(`ERROR_SECURITY_PERMISSION`)이 전달됩니다.

### 4.3 NaviHelper 주요 API

| 퍼미션 | API |
|---|---|
| `NAVI_ROUTE` | `get*Info()`, `requestTrip()` |
| `NAVI_ROUTE_SEARCH` | `requestRoute()`, `requestRouteWithWaypoints()`, `cancelRoute()`, `requestReRoute()`, `addWaypoint()`, `removeWaypoint()`, `changeRouteOption()` |
| `NAVI_CUSTOM_MAP` | `requestNavigationScreen()` |

요청은 Pleos Connect Navigation 앱으로 전달되고 결과는 `NaviHelperEventListener` 콜백으로 옵니다. 실제로 받는 이벤트는 Navigation 앱의 구현과 현재 상태에 따라 달라질 수 있습니다.

### 4.4 FusedLocation · STT · TTS

- FusedLocation: `isSupported()`를 먼저 호출합니다. `getLastKnownLocation()`, `registerFusedLocationCallback()`, `addProximityAlert()`(지오펜스 진입·이탈)를 제공합니다. 콜백 값은 `null`일 수 있습니다.
- STT/TTS 모드: `HYBRID`(기본, 서버 우선이고 실패하면 기기 엔진), `SERVER`, `ON_DEVICE`. 서버를 쓰는 모드는 네트워크와 Playground **My Project 자격 증명으로 앱을 등록**해야 합니다. 자격 증명은 커밋하지 않습니다.
- STT는 인식한 텍스트만 돌려줍니다. 음성 명령 실행은 Gleo Interface를 쓰라고 안내하지만, Gleo Interface는 공모전이 안내한 SDK 5종에 없습니다([open-questions.md](../open-questions.md) Q7).

## 5. 문서에서 찾지 못한 것

두 프로젝트에 모두 영향이 있는 항목입니다. 해결되면 이 목록에서 지우고 근거를 남깁니다.

| 항목 | 영향 | 비고 |
|---|---|---|
| 차량 **속도·기어** | 주행 중/정차 중 판단 (두 프로젝트의 공통 원칙) | Vehicle 도메인 목록에 없습니다. Brake(주차 브레이크)를 쓰거나 AAOS 표준 API(CarPropertyManager, CarUxRestrictionsManager)를 써야 할 수 있습니다. SDK 정책은 같은 기능이 AAOS에 있으면 AAOS를 따른다고 합니다. 3rd-party 앱에 허용되는지는 확인이 필요합니다 |
| 좌석 점유(탑승) 감지 | GRD 동행 확인 | Seat 도메인 설명은 위치·각도·기능 위주입니다 |
| Safety 경고 종류, Tire 공기압 항목 | GAM 이상 현상 | 공기압·과열 경고가 있는지 확인이 필요합니다 |
| Virtual Console로 조작할 수 있는 신호 | 두 프로젝트의 데모 | 가이드 링크가 404입니다 |
| 에뮬레이터 화면 규격 | README 필수 항목, 레이아웃 | 실행해서 확인합니다 |
| 정비 이력 API | GAM 정비 퀘스트 | 없다고 가정하고 수동 입력부터 시작합니다 |
| 운전자 주의 분산 최소화 설계 가이드 | 두 프로젝트의 주행 중 UX | 별도 문서가 있다고만 확인했습니다 |
| FusedLocation·STT·TTS 의존성 좌표와 퍼미션 | 구현 | 각 SDK의 project-setup / declaring-permissions 페이지에 있습니다 |

## 6. 퍼미션 정책

- Vehicle SDK 퍼미션은 Pleos App Market과 사전 협의하고 승인된 범위에서만 선언할 수 있습니다. 승인되지 않은 퍼미션을 선언하거나 해당 API를 호출하면 앱 심사를 통과하지 못합니다.
- 실제로 쓰는 API에 필요한 최소 퍼미션만 선언합니다.
- 공모전 시연(에뮬레이터)에도 이 승인 절차가 적용되는지는 확인하지 못했습니다([open-questions.md](../open-questions.md) Q6). 특히 HVAC 같은 `CONTROL_CAR_*` 퍼미션이 그렇습니다.

## 7. 앱 품질 기준 (Pleos App Market 심사 가이드)

> 출처: [기능·성능·안정성 심사](https://document.pleos.ai/docs/pleos-only/distribute/app-review-guide/review-functionality-performance-stability)
> 공모전 심사에 직접 적용된다는 문구는 없습니다. 다만 수상 후 App Market 탑재를 지원할 때 적용되므로, 목업 단계부터 설계 제약으로 둡니다.

- 입력 후 시각적 반응(터치 효과 애니메이션)까지 **0.25초 이내**
- 앱 실행과 콘텐츠 로드는 각각 **10초 이내**
- 버튼 반응(화면 전환, 기능 동작, 상태 변화)은 **2초 이내**. 넘으면 동작 중임을 UI로 알립니다
- 백그라운드에서 돌아오면 마지막 상태를 복원합니다(수 시간 이상 지나면 기본 상태에서 시작해도 됩니다)
- 레터박스 없이 화면을 채웁니다(미세한 비율 보정을 위한 한 방향 레터박스만 허용). 호환성 모드로 실행하지 않습니다. 해상도가 바뀌어도 작업 내용과 기능이 유지되어야 합니다
- 디스플레이 컷아웃, 인셋, 시스템 표시줄, 소프트웨어 키보드의 안전 영역을 지킵니다
- 심사 앱은 실제 서비스 앱과 같아야 하며, 더미 데이터나 임시 콘텐츠가 없어야 합니다. 목업과 시연에서는 Fake 데이터를 쓰되, 실제 차량 데이터와 구분되게 표시합니다
- 기기 재시작이나 핵심 기능과 관계없는 시스템 설정 변경을 요구하지 않습니다
