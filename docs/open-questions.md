# 저장소 공통 미결정 질문

두 프로젝트 모두에 영향을 주거나 공모전 운영에 관한 질문입니다. 한 프로젝트에만 해당하는 질문은 `projects/<p>/OPEN_QUESTIONS.md`에 씁니다.
해결되면 상태를 `Resolved`로 바꾸고, 답과 근거(링크, 날짜)를 남깁니다. 결정이 필요했던 질문은 ADR이나 `DECISIONS.md`로 옮깁니다.

주최측 문의처: `appdevchallenge@hyundai-partners.com` (FAQ와 공지사항을 먼저 확인)

| ID | 질문 | 왜 중요한가 | 확인 방법 | 담당 | 상태 |
|---|---|---|---|---|---|
| Q1 | 한 팀이 두 작품을 각각 접수할 수 있는가? 안 된다면 하나를 고를지, game에 grandma를 퀘스트로 넣어 하나로 합칠지 | 11/15까지 출품작과 문서 범위가 정해져야 합니다 | 주최측 문의 → 팀 결정 | | Open |
| Q2 | 한 저장소에 앱 두 개가 있어도 산출물 가산점 심사에 문제가 없는가? README 필수 항목은 앱별로 써도 되는가? | 제출 방식과 README 구조 | 주최측 문의. 안 되면 제출용 저장소를 분리 | | Open |
| Q3 | 목업을 어떤 방식으로 구현하는가 | 목업 제작과 PT 준비 | [ADR-0002](decisions/0002-mockup-implementation.md) | | Open |
| Q4 | 에뮬레이터 화면 규격(해상도, density)은 무엇인가 | README 필수 항목, 레이아웃 설계 | 에뮬레이터 실행 후 `adb shell wm size`, `adb shell wm density` | | Open |
| Q5 | 저장소 이름, 소유 계정, 커밋 author가 "계정정보·개발자 실명"에 해당하는가 | 공개 전환(11/16) 시 개인정보 노출 규정 | [submission.md](contest/submission.md) 6절 점검. 필요하면 팀 Organization과 noreply 이메일 사용, 또는 zip 링크로 대체 제출 | | Open |
| Q6 | 공모전 시연(에뮬레이터)에서도 Vehicle 퍼미션 사전 승인이 필요한가? 특히 `CONTROL_CAR_*` 제어 퍼미션 | GRD 공조 제어, 퍼미션 선언 범위 | 주최측 문의 | | Open |
| Q7 | Gleo Interface(음성 명령)를 쓸 수 있는가? 공모전이 안내한 SDK 5종에는 없습니다 | GAM 음성 조회, GRD 음성 입력 방식 | 주최측 문의. 안 되면 STT + TTS로 구현 | | Open |
| Q8 | 주행 중/정차 중을 어떤 신호로 판단하는가? 속도·기어가 Vehicle 도메인 목록에 없습니다 | 두 프로젝트의 공통 원칙(주행 중 조작 금지) | Brake(주차 브레이크) 확인, AAOS 표준 API 허용 여부 확인, 에뮬레이터 스파이크 | | Open |
| Q9 | 팀명과 참가 부문(대학(원)생 / 일반)은 무엇인가 | 양식 01, APK 파일명(`팀명_앱이름_release.apk`) | 팀 결정 | | Open |
| Q10 | 2차 PT 심사 기준은 무엇인가 | PT 준비 범위 | 공지사항 확인 | | Open (미공개) |
