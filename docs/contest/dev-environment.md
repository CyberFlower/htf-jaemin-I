# 개발 환경과 Pleos Connect SDK

## 0. 출처와 공모전 범위

### 0.1 공모전 범위의 기준 (확인일 2026-11-14)

1. **공모전 공지** [공모전 개발 범위 및 기술 문의 안내](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)(게시일은 페이지에 표시되지 않음). 이 문서의 다른 출처와 어긋나면 이 공지를 따릅니다. 공지는 "현재 공개된 Pleos Playground 개발 문서의 SDK·API 범위에서 개발하고, 문서에서 지원되지 않는 기능은 사용할 수 없다"고 합니다.
2. **공지의 "개발 문서"는 [Pleos Connect SDK 문서](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/)(`/docs/pleos-only/connect-sdk-pleos/` 아래 페이지)로 봅니다.** 팀이 2026-11-14에 정한 가정입니다. 근거는 아래와 같습니다.
   - 공모전 [개발 환경 가이드](https://appdevchallenge.auto-hmg.io/guide/development)의 "공식 개발 문서" 절이 이 주소를 "Pleos Connect SDK 공식 문서"로 연결합니다.
   - 같은 절이 "API 참조 문서"로 연결한 `document.pleos.ai/api-reference/connect-sdk-pleos`는 지금 이 주소로 리다이렉트됩니다.
   - 범위: Overview와 SDK 5종(Vehicle, NaviHelper, TextToSpeech, SpeechToText, FusedLocation)의 Introduction, Programming Guide, API Reference. 가이드 페이지 44개가 모두 열리는 것을 확인했습니다(2026-11-14).

### 0.2 출처 등급

이 문서는 근거마다 아래 등급을 붙입니다.

| 등급 | 범위 | 쓰는 방식 |
|---|---|---|
| **[SDK 문서]** | `/docs/pleos-only/connect-sdk-pleos/` 아래 | 공모전에서 쓸 수 있는 기능의 근거 |
| **[Pleos 참고]** | 그 밖의 `document.pleos.ai` 공개 페이지: 개발 환경 설정, Virtual Console, 차량 앱 FAQ, 기획·설계 가이드, Gleo Interface 구현 가이드, ADB FAQ, App Market 심사 가이드 | 개발·테스트 도구 사용법과 설계 원칙. **이것만으로는 기능이 공모전 범위에 든다고 보지 않습니다.** Gleo Interface는 공지가 따로 허용합니다 |
| **[Android]** | `developer.android.com` | AAOS API의 정의 |

`document.pleos.ai/sitemap.xml`에는 내부 호스트 주소로 Fleet API, SDVOS, Pleos Platform SDK 같은 페이지가 더 있습니다. 공개 주소로 열면 404이므로 근거로 쓰지 않습니다.

### 0.3 출처 목록

- [SDK 문서] (확인일 2026-11-14): [Overview](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/) · [Vehicle SDK 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/Vehicle/intro) · [Vehicle 퍼미션](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/Vehicle/vehicle-permission) · [FusedLocation 설정](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/FusedLocation/project-setup) · [SpeechToText 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/SpeechToText/intro) · [TextToSpeech 소개](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/TextToSpeech/intro)
- 공모전 (확인일 2026-11-12): [공모전 개발 환경](https://appdevchallenge.auto-hmg.io/guide/development) · [Pleos Playground](https://pleos.ai/playground)
- [Pleos 참고] (확인일 2026-11-12~14): [에뮬레이터 설정](https://document.pleos.ai/docs/connect/guide/getting-started/application-development/setup-connect-sdk-emulator) · [Virtual Console 가이드](https://document.pleos.ai/docs/pleos-only/app-test-guide/virtual-console-guide) · [차량 앱 FAQ](https://document.pleos.ai/docs/pleos-only/vehicle-app-developer-guide/vehicle-app-faq) · [주행 규제 개발 가이드](https://document.pleos.ai/docs/pleos-only/vehicle-app-developer-guide/driving-restriction-development-guide) · [SDK API 정책](https://document.pleos.ai/docs/pleos-only/vehicle-app-planning-guide/pleos-connect-sdk-api) · [API 호환성 및 가용성](https://document.pleos.ai/docs/pleos-only/vehicle-app-planning-guide/api-compatibility-availability) · [하드웨어 접근 정책](https://document.pleos.ai/docs/pleos-only/vehicle-app-planning-guide/platform-api-architecture) · [Gleo Interface 구현 가이드](https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/core-concepts) · [ADB Command FAQ](https://document.pleos.ai/docs/pleos-only/vehicle-app-developer-guide/adb-command-reference-guide)
- [Android] (확인일 2026-11-13): [VehiclePropertyIds](https://developer.android.com/reference/android/car/VehiclePropertyIds)
- 설명회 (1절 네트워크, 6절): 공모전 통합 온라인 설명회 영상의 개발 착수 안내(22:15~)와 기술 Q&A(37:10~). 영상 요약을 근거로 적었습니다. 설명회 날짜와 다시보기 링크는 추가가 필요하고, 해당 구간은 다시보기로 직접 확인해야 합니다.

이 문서의 "문서 확인"은 공식 문서에 적혀 있다는 뜻입니다. 에뮬레이터에서 동작을 확인했다는 뜻이 아닙니다. 검증한 항목은 각 프로젝트 `REQUIREMENTS.md`에 `에뮬레이터 검증 (v2.1.0, 날짜)`으로 기록합니다.

## 1. 공모전 필수 요건

| 항목 | 값 |
|---|---|
| 플랫폼 | Pleos Connect: Android Automotive OS(AAOS) 기반 차량 인포테인먼트 |
| minSdk | API 28 이상. 차량 사이버 보안 요건(서명 키 로테이션, lineage 지원) 때문입니다 |
| Gradle | 8.0 이상 |
| 언어 | Java 또는 Kotlin |
| 에뮬레이터 | Pleos Connect Emulator **v2.1.0** (Virtual Console 최소 버전) |
| 개발 범위 | **공개된 Pleos Playground 개발 문서의 SDK·API 범위에서만 개발합니다.** 문서에서 지원하지 않는 기능은 쓸 수 없고, 필요하면 기획서에 향후 계획으로 적습니다. 이 저장소는 개발 문서를 [SDK 문서]로 봅니다(0.1절)([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)) |
| 시연 환경 | **2차 PT는 Pleos Connect 에뮬레이터에서 구동하는 앱 시연입니다. 실제 차량은 필요 없습니다**([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)). 개발 장비 대여, 실차 측정 장소, 별도 기술 지원 창구는 없습니다 |
| 네트워크·외부 API | 퍼블릭 네트워크 연결과 외부 서드파티 API를 함께 쓸 수 있습니다(설명회 기술 Q&A). 단, **차량 마이크 음성을 외부 음성 인식 서비스로 보내는 방식은 쓸 수 없습니다.** 음성 인식은 SpeechToText SDK만 씁니다([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)). API 키는 커밋하지 않습니다 |

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
- **외장 GPU 필수.** 최소 사양은 NVIDIA RTX 3060 Laptop 6GB 또는 AMD RX 6600M 8GB / RX 6700S 8GB급입니다. 권장 사양은 RTX 4060/5060 Laptop 8GB 또는 RX 7700S / 7600M XT 8GB급입니다. 팀원마다 실행할 수 있는지 미리 확인합니다. 주최측은 개발 장비를 빌려주지 않습니다(공지).
- STT를 테스트하려면 Extended Controls > Microphone에서 오디오 입력을 허용합니다.
- 기본 언어는 한국어입니다(차량 설정 > 일반 설정 > 언어).
- 이 버전은 Bluetooth 동글을 지원하지 않습니다.
- **화면 규격**은 문서에서 찾지 못했습니다. 에뮬레이터를 실행한 뒤 `adb shell wm size`와 `adb shell wm density`로 확인해 README 제출 정보에 적습니다(공모전 README 필수 항목).
- **Virtual Console**: 2026-11-12에 쓴 링크(`/docs/connect/guide/app-test-guide/virtual-console-guide`)는 404였습니다. 가이드는 [`/docs/pleos-only/app-test-guide/virtual-console-guide`](https://document.pleos.ai/docs/pleos-only/app-test-guide/virtual-console-guide)에 있습니다(2026-11-13 확인). 가이드에 적힌 조작 항목은 아래와 같습니다. 에뮬레이터에서 실제로 해 보지는 않았습니다.
  - 주행: 기어(P, R, N, D), 브레이크 페달(0~100%), 누적 주행 거리, 스티어링 휠 각도와 열선
  - ADAS: 크루즈 상태, 크루즈 목표 속도
  - 안전: 경고등(Telltales). 주차 브레이크, 안전벨트, ABS, TPMS 등을 Off, On, Blink로 설정
  - 편의: 도어, 창문, 조명, 방향지시등, 좌석 점유, 와이퍼 등
  - 에너지·공조: 배터리, 충전, 주행 가능 거리, HVAC 항목
  - **차량 속도와 연료 항목은 가이드에 없습니다.** 속도를 바꿔 보는 방법은 5절에 남깁니다.

## 4. SDK 목록

| SDK | 역할 | 기준 버전 | 의존성 좌표 | 퍼미션 |
|---|---|---|---|---|
| Vehicle | 차량 상태 조회와 차량 제어 | 2.3.2 (Service 2.3.21) | `ai.pleos.playground:Vehicle:2.3.2` | 도메인별 (4.2절) |
| NaviHelper | 경로 안내 제어, 내비게이션 정보 조회 | 3.0.5 | `ai.pleos.playground:NaviHelper:3.0.5` | `NAVI_ROUTE`, `NAVI_ROUTE_SEARCH`, `NAVI_CUSTOM_MAP` |
| FusedLocation | 차량 위치 | 1.1.3 | `ai.pleos.playground:FusedLocation:1.1.3` | `FUSED_LOCATION` (dangerous, 실행 중 권한 요청 필요) |
| SpeechToText | 음성 인식. 텍스트만 돌려주고 명령은 실행하지 않습니다 | 3.3.1 | `ai.pleos.playground:SpeechToText:3.3.1` | `STT_SERVICE` |
| TextToSpeech | 음성 합성 | 3.3.1 | `ai.pleos.playground:TextToSpeech:3.3.1` | `TTS_SERVICE` |

위 표의 버전, 좌표, 퍼미션은 모두 [SDK 문서]에 있습니다(2026-11-14 확인). 이 다섯 개가 Overview에 적힌 Pleos Connect SDK의 전체 구성입니다.

공모전에서 쓸 수 있는 범위([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)):

- 위 5종은 출품작에 쓸 수 있습니다. Playground 워크스페이스에 '준비 중'으로 표시되어 있어도 개발 문서에 안내된 방법으로 에뮬레이터에서 개발·시험할 수 있습니다.
- **Gleo Interface(App Schema)는 별도 검토·승인 없이 쓸 수 있습니다.** 공지가 따로 허용하므로 [SDK 문서] 밖에 있어도 범위 안입니다. 문서는 [Pleos 참고]의 "앱 개발·연동 가이드 > Gleo Interface 구현 가이드"에 있습니다. [SDK 문서]에서는 SpeechToText 소개가 음성 명령 실행에 Gleo Interface를 쓰라고 안내합니다. 퍼미션과 등록 절차는 아직 정리하지 않았습니다(확인 필요, 4.5절).
- **개발 문서에 공개되지 않은 SDK와 Pleos LLM SDK는 공모전 기간 중 제공되지 않습니다.** [SDK 문서] 메뉴에 LLM 항목이 있지만 내용은 없습니다(2026-11-14).
- **AAOS Car API는 쓸 수 있다고 가정하고 설계합니다. 주최측에 확인 중입니다**([open-questions.md](../open-questions.md) Q11). [SDK 문서]의 Overview는 API 정책으로 "동일하거나 유사한 기능의 API가 AAOS에 있으면 AAOS에 맞춘다"는 원칙만 말합니다. 속도와 기어를 AAOS Car API로 읽으라고 구체적으로 적은 곳은 [Pleos 참고]입니다. 자세한 내용은 4.3절에 있습니다.
- [Pleos 참고] 모바일용 API는 차량에서 제한될 수 있습니다. 하드웨어 접근 정책이 예로 드는 것은 Telephony, SMS, 일부 센서(자이로, 근접 등), **캘린더, 주소록**입니다. 이런 기능은 지원 여부를 확인한 뒤 동작하는 Optional 구조로 설계합니다.

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
| Brake | 브레이크 페달 상태(`getCurrentBrakePedalStatus`)만 제공. 주차 브레이크 getter는 없습니다(2026-11-13·14 API Reference 확인). 주차 브레이크는 4.3절 AAOS로만 읽을 수 있습니다(사용 가능으로 가정, Q11 문의 중) | `CAR_DRIVE` | GAM: 급제동 판정 보조 |
| CarInfo | 외부 크기, 제조사, 연식 | `CAR_INFO` | GAM: 차종별 정비 주기 |
| Display | 온도 단위 등 표시 설정 | `CAR_INFO` | |
| Door | 열림·닫힘, 잠금·해제 | `CAR_DOORS` | GRD: 탑승 후보 감지 |
| DrivingMode | 드라이브 모드, 크루즈 컨트롤 | `CAR_DRIVE` | |
| EvBattery | 배터리·충전 상태, 전비 | `CAR_ENERGY` | GRD: 출발 준비 · GAM: EV 보상 |
| Fuel | 연비 등 연료 정보 | `CAR_ENERGY` | GAM: 보급 토큰 · GRD: 출발 준비 |
| HVAC | 온도, 풍량, 습도 제어·조회 | `CAR_CLIMATE` | GRD: 동행자 공조 |
| Light | 조명 상태, 앰비언트 라이트 제어 | `CAR_LIGHTS` | |
| Odometer | 총 주행 거리, 트립 거리·시간, 거리 단위 | `CAR_DRIVE` | GAM: 건축 자재, 정비 퀘스트, 단거리 비율 |
| Safety | 차량 경고(Warning) | `CAR_SAFETY` | GAM: 도시 이상 현상 |
| Seat | 위치, 각도, 기능 제어·조회 | `CAR_SEATS` | GRD: 탑승 후보 (점유 정보 확인 필요) |
| SideMirror | 사이드미러 열선 | `CAR_MIRRORS` | |
| Steeringwheel | 핸들 상태, 열선 | 퍼미션 표에 없음 | GAM: 음성 차량 제어 (범위 검토 중) |
| Tire | 타이어 상태 | `CAR_SAFETY` | GAM: 공기압 경고 |
| Toll | 하이패스 음성 안내 음량 | `CAR_TOLL` | |
| TurnSignal | 방향 지시등 | `CAR_LIGHTS` | |
| Window | 창문 제어·상태 | `CAR_WINDOWS` | |
| Wiper | 와이퍼 제어·상태 | `CAR_WINDOWS` | |

쓰기(제어) 퍼미션은 `CONTROL_CAR_*` 형식입니다(예: `CONTROL_CAR_DOORS`). 정확한 이름은 각 API의 `@RequiresPermission`에서 확인합니다. 퍼미션이 없으면 `onFailed`로 `VehicleException`(`ERROR_SECURITY_PERMISSION`)이 전달됩니다.

### 4.3 AAOS 표준 API로만 읽는 차량 신호

Vehicle SDK의 19개 도메인에는 **차량 속도, 가속도, 기어, 주차 브레이크, 시동 상태를 읽는 API가 없습니다.** 2026-11-13에 [SDK 문서] Vehicle API Reference의 getter를 모두 확인했습니다. 2026-11-14에 Brake 도메인을 다시 확인했는데, 브레이크 페달 상태 API 4개만 있습니다. 이 신호는 AAOS 표준 API로만 읽을 수 있습니다.

출처 등급별 근거:

- [SDK 문서] Overview의 API 정책: "Pleos Connect SDK의 API 정책은 동일하거나 유사한 기능의 API가 Android Automotive OS에 존재할 경우 플랫폼 파편화를 최소화하기 위해 Android Automotive에 align하는 것을 원칙으로 합니다." 프로퍼티 이름이나 사용법은 적혀 있지 않습니다.
- [Pleos 참고] SDK API 정책: 표준 데이터(속도, 기어 상태, 외기 온도, 연료 레벨 등)는 AAOS Car API로, 특화 기능은 Pleos Connect SDK로 접근한다고 나눕니다.
- [Pleos 참고] 차량 앱 FAQ: "앱에서 클러스터와 동일한 차량 속도를 사용하려면 AAOS의 `CarPropertyManager`를 통해 `PERF_VEHICLE_SPEED` 프로퍼티를 조회합니다."
- [Pleos 참고] 주행 규제 개발 가이드: "Pleos Connect 앱은 플랫폼이 제공하는 CarUxRestrictions 상태를 기준으로 주행 중 UX 제한을 적용해야 합니다."
- [Pleos 참고] API 호환성 및 가용성: 프로퍼티의 정의와 지원 여부는 Google의 `VehiclePropertyIds`와 `CarPropertyManager`로 확인합니다. 차량 모델명으로 분기하지 않습니다. "SDK가 제공하지 않는 특수 프로퍼티는 직접 구현하기 전에 기술 지원팀에 검토를 요청하라"는 문구도 있습니다. 공모전에는 별도 기술 지원 창구가 없습니다(공지).

| 신호 | AAOS API / 프로퍼티 | 읽기 권한 (보호 수준) | 근거 | 관련 후보 |
|---|---|---|---|---|
| 차량 속도 | `CarPropertyManager` · `PERF_VEHICLE_SPEED` (m/s, 연속 갱신, 후진 시 음수) | `Car.PERMISSION_SPEED` (Dangerous) | Pleos FAQ, Android 문서 | GAM: 급가속·급감속·급제동 판정 · 공통: 주행 판단 |
| 표시용 속도 | `PERF_VEHICLE_SPEED_DISPLAY` (계기판 표시값, 실제보다 조금 낮을 수 있음) | `Car.PERMISSION_SPEED` (Dangerous) | Android 문서 | 화면에 속도를 보여줄 때 |
| 가속도 | **프로퍼티 없음.** 속도 변화량으로 계산합니다 | — | Android 문서(가속도 프로퍼티 없음) | GAM: 급가속·급감속 판정 |
| 페달 밟은 정도 | `ACCELERATOR_PEDAL_COMPRESSION_PERCENTAGE`, `BRAKE_PEDAL_COMPRESSION_PERCENTAGE` | `Car.PERMISSION_READ_CAR_PEDALS` (Dangerous) | Android 문서 | GAM: 급가속·급제동 판정 보조 |
| 기어 | `GEAR_SELECTION`(선택한 기어), `CURRENT_GEAR`(실제 변속 단) | `Car.PERMISSION_POWERTRAIN` (Normal) | Android 문서, Virtual Console에 기어 항목 있음 | 공통: 주차 판단(P단) |
| 주차 브레이크 | `PARKING_BRAKE_ON` | `Car.PERMISSION_POWERTRAIN` (Normal) | Android 문서 | 공통: 주차 판단 |
| 시동 상태 | `IGNITION_STATE` (`VehicleIgnitionState`) | `Car.PERMISSION_POWERTRAIN` (Normal) | Android 문서 | 운행 시작·종료 판단, GAM: 공회전 판단 |
| 주행 중 UX 제한 | `CarUxRestrictionsManager` · `registerListener()` → `onUxRestrictionsChanged()` | 확인 필요 | Pleos 주행 규제 개발 가이드 | 공통: 주행 중 조작 차단 |

쓸 때 주의할 점:

- **문서 확인 수준입니다.** Pleos 에뮬레이터에서 위 프로퍼티가 지원되는지, 값이 실제로 들어오는지는 확인하지 않았습니다. 지원 여부는 `CarPropertyManager`의 프로퍼티 설정 조회로 먼저 확인하고, 지원하지 않을 때의 대체 동작을 요구사항에 적습니다.
- **Dangerous 권한은 실행 중에 사용자 동의가 필요합니다.** 사용자가 거부하면 해당 신호 없이 동작해야 합니다.
- **작업 가정 (2026-11-14, 팀): 위 표의 AAOS 표준 API를 출품작에 쓸 수 있다고 보고 설계합니다.** 주최측에 문의했고 답을 기다리는 중입니다([open-questions.md](../open-questions.md) Q11).
  - 가정하는 이유: [SDK 문서] Overview가 "AAOS에 같은 기능이 있으면 AAOS에 align"을 원칙으로 둡니다. [Pleos 참고] 문서도 속도와 기어를 AAOS Car API로 읽으라고 안내합니다.
  - 가정이 틀릴 수 있는 이유: 공지는 "문서에서 지원되지 않는 기능은 사용할 수 없다"고 합니다. 개발 문서를 [SDK 문서]로 좁게 보면 AAOS 프로퍼티는 거기에 없습니다.
- **설계할 때 지킬 것** (UC·FR 작성 순서는 [requirements-guide.md](../process/requirements-guide.md) 3절 "근거를 찾는 순서"):
  1. 같은 신호가 [SDK 문서]에 있으면 SDK API를 씁니다. AAOS는 SDK에 없는 신호에만 씁니다.
  2. `CarPropertyManager`로 프로퍼티 지원 여부를 먼저 확인하고, 없을 때의 대체 동작을 적습니다.
  3. Q11의 답이 "불가"일 때 쓸 대안을 4.3.1절에서 골라 FR에 함께 적습니다.
  4. `VehiclePropertyIds`에 없는 비표준 프로퍼티는 쓰지 않습니다.
- 위 표의 "근거" 열은 이 절 위의 출처 등급과 같습니다. "Pleos FAQ"와 "Pleos 주행 규제 개발 가이드"는 [Pleos 참고]이고, "Android 문서"는 [Android]입니다.
- AAOS 권한의 사전 승인 여부는 6절을 따릅니다(Q6).
- **Virtual Console로 속도를 바꿀 수 없습니다.** 기어는 바꿀 수 있지만 속도 항목은 없습니다(3절). 속도 기반 기능을 어떻게 시연할지는 5절에 남깁니다.
- 위치 기반 속도(GPS)는 클러스터 속도와 다를 수 있다고 FAQ에 적혀 있습니다. FusedLocation의 위치 데이터에는 속도 필드가 없습니다.

#### 4.3.1 AAOS 없이 쓸 수 있는 대안 ([SDK 문서]만 사용)

Q11의 답이 "불가"일 때 씁니다. 2026-11-14에 [SDK 문서] API Reference에서 속도 관련 항목을 모두 확인했습니다. **실제 차량 속도를 돌려주는 SDK API는 없습니다.** 아래는 대신 쓸 수 있는 값입니다. 모두 문서 확인 수준이고, 에뮬레이터에서는 확인하지 않았습니다.

| 필요한 것 | 대안 | SDK API | 한계 |
|---|---|---|---|
| 주행 중인가 | 주행 거리가 늘고 있는지 | Vehicle Odometer `registerTripCurrentDrivingDistance`(m) (`CAR_DRIVE`) | 갱신 주기가 문서에 없습니다. 정차와 주차는 구분하지 못합니다 |
| 대략의 속도 | 주행 거리 변화 ÷ 시간 | Odometer `registerTripCurrentDrivingDistance`(m), `registerTripCurrentDrivingTime` (`CAR_DRIVE`) | 갱신이 느리면 평균 속도만 얻습니다 |
| 대략의 속도 | 연속한 두 위치 사이 거리 ÷ 시간 | FusedLocation `LocationData`(위도, 경도, `timestampMillis`) (`FUSED_LOCATION`, dangerous) | 위치 오차가 있습니다. FAQ는 GPS 속도가 계기판 속도와 다를 수 있다고 합니다 |
| 과속 여부 | 단속 카메라 알림 | NaviHelper `onCameraAlert` → `CameraAlert.isOverSpeed`, `speedLimit`(km/h) | 단속 카메라 근처에서만 옵니다. 속도 숫자는 없습니다 |
| 도로 제한 속도 | 현재 도로 제한 속도 | NaviHelper `onCurrentRoadSpeedLimit` (등록 후 1초마다) | 차량 속도가 아닙니다 |
| 설정 속도 | 크루즈 목표 속도 | Vehicle DrivingMode `getCruiseControlTargetSpeed`(m/s) (`CAR_DRIVE`) | 실제 속도가 아닙니다. 크루즈를 켰을 때만 의미가 있습니다 |
| 급제동 보조 | 브레이크 페달 상태 | Vehicle Brake `getCurrentBrakePedalStatus` (`CAR_DRIVE`) | 밟은 정도의 해상도는 확인 필요 |

- **급가속·급제동 판정(GAM-027·028)은 이 대안만으로 어렵습니다.** 순간 속도가 정확하고 자주 갱신되어야 하기 때문입니다(추론).
- 기어(P단), 주차 브레이크, 시동 상태를 대신할 SDK API는 찾지 못했습니다. 정차와 주차는 주행 거리 변화가 없는 시간으로만 어림할 수 있습니다(추론).
- Virtual Console에 "누적 주행 거리" 항목이 있어서 주행 거리 기반 대안은 시연할 가능성이 있습니다(3절, 미검증).

### 4.4 NaviHelper 주요 API

| 퍼미션 | API |
|---|---|
| `NAVI_ROUTE` | `get*Info()`, `requestTrip()` |
| `NAVI_ROUTE_SEARCH` | `requestRoute()`, `requestRouteWithWaypoints()`, `cancelRoute()`, `requestReRoute()`, `addWaypoint()`, `removeWaypoint()`, `changeRouteOption()` |
| `NAVI_CUSTOM_MAP` | `requestNavigationScreen()` |

요청은 Pleos Connect Navigation 앱으로 전달되고 결과는 `NaviHelperEventListener` 콜백으로 옵니다. 실제로 받는 이벤트는 Navigation 앱의 구현과 현재 상태에 따라 달라질 수 있습니다.

### 4.5 FusedLocation · STT · TTS

- FusedLocation: `isSupported()`를 먼저 호출합니다. `getLastKnownLocation()`, `registerFusedLocationCallback()`, `addProximityAlert()`(지오펜스 진입·이탈)를 제공합니다. 콜백 값은 `null`일 수 있습니다.
- STT/TTS 모드: `HYBRID`(기본, 서버 우선이고 실패하면 기기 엔진), `SERVER`, `ON_DEVICE`. 서버를 쓰는 모드는 네트워크와 Playground **My Project 자격 증명으로 앱을 등록**해야 합니다. 자격 증명은 커밋하지 않습니다.
- STT는 인식한 텍스트만 돌려줍니다. 음성 명령 실행은 Gleo Interface를 쓰라고 안내합니다. **공모전 참가팀은 Gleo Interface(App Schema)를 별도 검토·승인 없이 쓸 수 있습니다**(공지, [open-questions.md](../open-questions.md) Q7). [Gleo Interface 구현 가이드](https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/core-concepts)에 따르면 앱이 function을 정의한 JSON(App Schema)을 등록하고, Gleo AI가 Gleo Action으로 앱을 호출하고, 앱은 Callback으로 응답합니다. 퍼미션과 등록 절차는 아직 정리하지 않았습니다(확인 필요). 가이드에는 "개발이 진행됨에 따라 계속 개선된다"는 문구가 있습니다.
- **음성 인식은 SpeechToText SDK로만 합니다.** 차량 마이크 음성을 외부 음성 인식 서비스로 보내면 안 됩니다(공지).
- [SDK 문서] SpeechToText `sendAudio(ByteArray)`: 차량 마이크 대신 앱이 가진 PCM 오디오를 인식시킬 수 있습니다. **ON_DEVICE 모드에서만** 됩니다. 예시는 16 kHz, 16-bit, mono PCM입니다. 시연 때 같은 발화를 반복해서 재생하는 용도로 쓸 수 있습니다(에뮬레이터 미검증).
- Pleos LLM SDK는 제공되지 않습니다(공지). 생성형 AI 응답이 필요하면 외부 API를 쓰는 방안을 검토하되, 입력은 STT가 돌려준 텍스트여야 합니다.

## 5. 문서에서 찾지 못한 것

두 프로젝트에 모두 영향이 있는 항목입니다. 해결되면 이 목록에서 지우고 근거를 남깁니다.

| 항목 | 영향 | 비고 |
|---|---|---|
| AAOS 차량 신호(속도·기어·주차 브레이크·시동)의 **실제 사용 가능 여부** | 주행 중/정차 중 판단 (두 프로젝트의 공통 원칙), GAM 급가속·급제동·공회전 판단 | 읽는 경로는 [Pleos 참고]와 [Android] 문서로 확인했습니다(4.3절). 남은 것: 공모전 범위에 드는지(Q11, 사용 가능으로 가정하고 문의 중), 에뮬레이터에서 값이 들어오는지, Dangerous 권한을 거부했을 때의 대체 동작 |
| 에뮬레이터에서 **차량 속도를 바꾸는 방법** | GAM 급가속·급제동 시연 | Virtual Console 가이드에 속도 항목이 없습니다(3절). ADB Command FAQ에도 속도를 바꾸는 명령은 없습니다. 주행 중 UX 제한만 시연하려면 [Pleos 참고] ADB Command FAQ의 `adb shell cmd hmg_car_service --service drivingstate driving_regulation on`(해제는 `off`)을 쓸 수 있는지 확인합니다(문서 확인, 에뮬레이터 미검증) |
| 좌석 점유(탑승) 감지 | GRD 동행 확인 | Seat 도메인 설명은 위치·각도·기능 위주입니다 |
| Safety 경고 종류, Tire 공기압 항목 | GAM 이상 현상 | 공기압·과열 경고가 있는지 확인이 필요합니다 |
| 에뮬레이터 화면 규격 | README 필수 항목, 레이아웃 | 실행해서 확인합니다 |
| 정비 이력 API | GAM 정비 퀘스트 | 없다고 가정하고 수동 입력부터 시작합니다 |
| 12V 배터리 상태 | GAM 배터리 관리 퀘스트 | EvBattery 설명은 고전압 배터리·충전 위주입니다 |
| Seat 열선, Steeringwheel 열선 제어의 정확한 API 이름 | GAM 음성 차량 제어 | care 원본의 `setHeatingLevel()` 등은 확인되지 않은 이름입니다 |
| 운전자 주의 분산 최소화 설계 가이드 | 두 프로젝트의 주행 중 UX | 별도 문서가 있다고만 확인했습니다 |

## 6. 퍼미션 정책

- Vehicle SDK 퍼미션은 Pleos App Market과 사전 협의하고 승인된 범위에서만 선언할 수 있습니다. 승인되지 않은 퍼미션을 선언하거나 해당 API를 호출하면 앱 심사를 통과하지 못합니다. **이 정책은 App Market에 입점할 때 적용됩니다. 공모전 심사는 App Market 입점 심사가 아닙니다**(공지).
- 실제로 쓰는 API에 필요한 최소 퍼미션만 선언합니다.
- **개발·공모전 단계에서는 사전 승인이 필요 없습니다.** 문서 가이드대로 `AndroidManifest.xml`에 퍼미션을 선언하면 에뮬레이터에서 바로 테스트할 수 있고, 정식 심사는 App Market에 배포할 때 받습니다(설명회 개발 착수 안내와 기술 Q&A, [open-questions.md](../open-questions.md) Q6).
- 설명회 요약에는 `CONTROL_CAR_*` 제어 퍼미션과 AAOS 표준 권한(`Car.PERMISSION_SPEED`, `Car.PERMISSION_POWERTRAIN`, `Car.PERMISSION_READ_CAR_PEDALS`)이 따로 언급되지 않았습니다. 같은 원칙이 적용된다고 보고, 에뮬레이터에서 선언·호출해 확인합니다(4.3절).
- `PERMISSION_SPEED`와 `PERMISSION_READ_CAR_PEDALS`는 Dangerous 권한이라 사전 승인과 별개로 실행 중 사용자 동의를 받아야 합니다.

## 7. 앱 품질 기준 (Pleos App Market 심사 가이드)

> 출처: [기능·성능·안정성 심사](https://document.pleos.ai/docs/pleos-only/distribute/app-review-guide/review-functionality-performance-stability)
> 공모전 심사는 App Market 입점 심사가 아닙니다([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)). 다만 수상 후 App Market 탑재를 지원할 때 적용되므로, 목업 단계부터 설계 제약으로 둡니다.

- 입력 후 시각적 반응(터치 효과 애니메이션)까지 **0.25초 이내**
- 앱 실행과 콘텐츠 로드는 각각 **10초 이내**
- 버튼 반응(화면 전환, 기능 동작, 상태 변화)은 **2초 이내**. 넘으면 동작 중임을 UI로 알립니다
- 백그라운드에서 돌아오면 마지막 상태를 복원합니다(수 시간 이상 지나면 기본 상태에서 시작해도 됩니다)
- 레터박스 없이 화면을 채웁니다(미세한 비율 보정을 위한 한 방향 레터박스만 허용). 호환성 모드로 실행하지 않습니다. 해상도가 바뀌어도 작업 내용과 기능이 유지되어야 합니다
- 디스플레이 컷아웃, 인셋, 시스템 표시줄, 소프트웨어 키보드의 안전 영역을 지킵니다
- 심사 앱은 실제 서비스 앱과 같아야 하며, 더미 데이터나 임시 콘텐츠가 없어야 합니다. 목업과 시연에서는 Fake 데이터를 쓰되, 실제 차량 데이터와 구분되게 표시합니다
- 기기 재시작이나 핵심 기능과 관계없는 시스템 설정 변경을 요구하지 않습니다
