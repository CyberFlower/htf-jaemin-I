# 저장소 공통 미결정 질문

두 프로젝트 모두에 영향을 주거나 공모전 운영에 관한 질문입니다. 한 프로젝트에만 해당하는 질문은 `projects/<p>/OPEN_QUESTIONS.md`에 씁니다.
해결되면 상태를 `Resolved`로 바꾸고, 답과 근거(링크, 날짜)를 남깁니다. 결정이 필요했던 질문은 ADR이나 `DECISIONS.md`로 옮깁니다.

주최측 문의처: `appdevchallenge@hyundai-partners.com` (FAQ와 공지사항을 먼저 확인)

운영사무국은 참가 자격·접수·제출·심사 일정 같은 운영 문의에만 답합니다. 기능 구현 방법이나 API 동작 문의에는 답하지 않으므로, 기술 질문은 Pleos Playground 개발 문서와 에뮬레이터로 확인합니다([공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008)).

| ID | 질문 | 왜 중요한가 | 확인 방법 | 담당 | 상태 |
|---|---|---|---|---|---|
| Q1 | 한 팀이 두 작품을 각각 접수할 수 있는가? 안 된다면 하나를 고를지, game에 grandma를 퀘스트로 넣어 하나로 합칠지 | 11/15까지 출품작과 문서 범위가 정해져야 합니다 | 주최측 문의 → 팀 결정 | | **Resolved** (2026-11-14). 설명회 운영 Q&A: 복수 출품 제한 없음, 앱 이름으로 구분. 팀 결정: grandma와 game **두 작품을 각각 접수**합니다. 두 프로젝트의 연계(GAM-Q10)는 별도로 정합니다 |
| Q2 | 한 저장소에 앱 두 개가 있어도 산출물 가산점 심사에 문제가 없는가? README 필수 항목은 앱별로 써도 되는가? | 제출 방식과 README 구조 | 주최측 문의. 안 되면 제출용 저장소를 분리 | | **Resolved** (2026-11-14, 팀 결정). 주최측에 묻지 않고 **한 저장소에 두 앱을 둡니다.** 심사자가 앱을 헷갈리지 않도록 안내합니다: README 제출 정보를 앱별 절로 나누고, 각 접수 메일의 양식 02 7번에 해당 앱의 README 절 링크와 APK 경로를 적습니다. APK 파일명에 앱 이름을 넣습니다([submission.md](contest/submission.md) 5절) |
| Q3 | 목업을 어떤 방식으로 구현하는가 | 목업 제작과 PT 준비 | [ADR-0002](decisions/0002-mockup-implementation.md) | | Open |
| Q4 | 에뮬레이터 화면 규격(해상도, density)은 무엇인가 | README 필수 항목, 레이아웃 설계 | 에뮬레이터 실행 후 `adb shell wm size`, `adb shell wm density` | | Open |
| Q5 | 저장소 이름, 소유 계정, 커밋 author가 "계정정보·개발자 실명"에 해당하는가 | 공개 전환(11/16) 시 개인정보 노출 규정 | [submission.md](contest/submission.md) 6절 점검. 필요하면 팀 Organization과 noreply 이메일 사용, 또는 zip 링크로 대체 제출 | | Open |
| Q6 | 공모전 시연(에뮬레이터)에서도 Vehicle 퍼미션 사전 승인이 필요한가? 특히 `CONTROL_CAR_*` 제어 퍼미션 | GRD 공조 제어, 퍼미션 선언 범위 | 주최측 문의 | | **Resolved** (2026-11-14). 설명회: 개발·공모전 단계에서는 매니페스트 선언만으로 별도 승인 없이 에뮬레이터에서 사용 가능, 정식 심사는 App Market 배포 시. `CONTROL_CAR_*`와 AAOS 표준 권한은 따로 언급되지 않아 에뮬레이터에서 확인합니다([dev-environment.md](contest/dev-environment.md) 6절) |
| Q7 | Gleo Interface(음성 명령)를 쓸 수 있는가? 공모전이 안내한 SDK 5종에는 없습니다 | GAM 음성 조회, GRD 음성 입력 방식 | 주최측 문의. 안 되면 STT + TTS로 구현 | | **Resolved** (2026-11-14). [공지](https://appdevchallenge.auto-hmg.io/notice/c0a1a000-2026-4923-8000-000000000008): 공모전 참가팀은 Gleo Interface(App Schema)를 별도 검토·승인 없이 사용 가능. 사용 방식은 [dev-environment.md](contest/dev-environment.md) 4.5절에 정리 예정 |
| Q8 | 주행 중/정차 중을 어떤 신호로 판단하는가? 속도·기어·주차 브레이크가 Vehicle SDK에 없습니다(Brake는 페달 상태만 제공) | 두 프로젝트의 공통 원칙(주행 중 조작 금지) | 후보: AAOS `PERF_VEHICLE_SPEED`, `GEAR_SELECTION`, `PARKING_BRAKE_ON`, `CarUxRestrictions`(Q11, 사용 가능으로 가정). AAOS를 못 쓰면 Odometer 주행 거리 변화([dev-environment.md](contest/dev-environment.md) 4.3.1절). 에뮬레이터 스파이크로 값이 들어오는지 확인 | | Open |
| Q9 | 팀명과 참가 부문(대학(원)생 / 일반)은 무엇인가 | 양식 01, APK 파일명(`팀명_앱이름_release.apk`) | 팀 결정 | | Open |
| Q10 | 2차 PT 심사 기준은 무엇인가 | PT 준비 범위 | 공지사항 확인 | | Open (미공개) |
| Q11 | SDK 문서에 API가 없는 차량 신호(속도 `PERF_VEHICLE_SPEED`, 기어 `GEAR_SELECTION`, 주차 브레이크 `PARKING_BRAKE_ON`, 시동 `IGNITION_STATE`, 페달, `CarUxRestrictions`)를 AAOS 표준 API로 읽어 출품작에 써도 되는가? | 공지는 "공개된 Pleos 개발 문서의 SDK·API 범위에서 개발하고, 문서에서 지원되지 않는 기능은 사용할 수 없다"고 합니다. 팀은 개발 문서를 [Pleos Connect SDK 문서](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/)로 보기로 했습니다(2026-11-14). 이 범위에 있는 근거는 Overview의 "AAOS에 같은 기능이 있으면 AAOS에 align" 원칙뿐입니다. 속도·기어를 AAOS Car API로 읽으라는 구체적 안내(SDK API 정책, 차량 앱 FAQ)는 SDK 문서 밖에 있습니다. Q8(주차 판단), GAM 급제동·공회전 판단이 이 신호에 기댑니다 | 주최측 문의 (2026-11-14 발송, 답변 대기). 답을 기다리는 동안 **AAOS 표준 API를 쓸 수 있다고 가정하고 설계**합니다(팀 작업 가정, 2026-11-14). 불가로 답이 오면 [dev-environment.md](contest/dev-environment.md) 4.3.1절의 SDK 대안으로 바꿉니다 | | Open (주최측 확인 중) |
