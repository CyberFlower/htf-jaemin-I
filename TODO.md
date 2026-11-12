# TODO

마감까지 해야 할 일과 빨리 정해야 할 결정을 모아 둔 곳입니다.

- 질문의 자세한 내용은 원래 파일에 있습니다. 여기에는 ID와 링크만 적습니다: [공통 Q#](docs/open-questions.md) · [GRD-Q#](projects/grandma/OPEN_QUESTIONS.md) · [GAM-Q#](projects/game/OPEN_QUESTIONS.md)
- 담당은 별칭(M1~M5)으로 적습니다.
- 끝난 일은 체크합니다. 결정된 것은 `DECISIONS.md`나 ADR에 기록하고, 여기에는 결과 링크만 남깁니다.
- 새 질문이 생기면 해당 `OPEN_QUESTIONS.md`에 ID를 만들고, 기한이 있으면 아래 결정 표에 추가합니다.

## 1. 빨리 정할 것

기한이 가까운 순서입니다. 이 결정들이 늦어지면 오른쪽 "막히는 것"이 시작되지 못합니다.

| 결정 | 기한 | 막히는 것 | 관련 | 담당 | 상태 |
|---|---|---|---|---|---|
| 프로젝트 owner 지정 | 11/12 | 모든 PR merge 판단 | [README 팀](README.md#팀) | | Open |
| 출품작 수: 1개, 2개, 또는 통합 (주최측 답을 먼저 받음) | 11/13 | 문서 범위, PROPOSAL, 목업 범위 | Q1, Q2, GAM-Q10 | | Open |
| 목업 구현 방식 | 11/13 | 목업 제작 전체 | Q3, [ADR-0002](docs/decisions/0002-mockup-implementation.md) | | Open |
| 두 프로젝트의 Goal과 Non-goal 합의 | 11/13 | 요구사항 확정 | 각 `GOAL.md` | | Open |
| P0 요구사항 Confirmed | 11/13 | 목업, PROPOSAL 3~5번 | 각 `REQUIREMENTS.md` | | Open |
| 팀명과 참가 부문 | 11/13 | 양식 01, APK 파일명 | Q9 | | Open |
| grandma: 가족 공유 웹을 넣을지, 시뮬레이션으로 대체할지 | 11/13 | GRD-004, 목업 범위 | GRD-Q1 | | Open |
| game: 연료 사용 보상을 유지할지, 효율·안전 보상으로 바꿀지 | 11/13 | GAM-002, PROPOSAL 2·3번 | GAM-Q6 | | Open |
| game: care 요소를 어디까지 넣을지 (특히 음성 차량 제어), 주 타깃을 누구로 할지 | 11/13 | GAM-013~016 우선순위, PROPOSAL 2·3·6번 | GAM-Q16, GAM-Q19 | | Open |
| game: 도시 그래픽 자산을 만드는 방법 | 11/14 | 목업 화면 | GAM-Q12 | | Open |
| 저장소 공개 시 개인정보 처리 (저장소 이름, 계정, 커밋 author) | 11/15 | 11/16 공개 전환 | Q5 | | Open |

## 2. 주최측 문의 (메일 한 통으로)

답이 오는 데 시간이 걸리므로 11/12~13 중에 보냅니다. 문의처는 `appdevchallenge@hyundai-partners.com`이고, FAQ와 공지사항을 먼저 확인합니다.

- [ ] 문의 메일 발송 (담당: )
  - Q1 한 팀이 작품 두 개를 접수할 수 있는가
  - Q2 한 저장소에 앱이 두 개 있어도 되는가
  - Q6 에뮬레이터 시연에도 Vehicle 퍼미션 사전 승인이 필요한가
  - Q7 Gleo Interface를 쓸 수 있는가
- [ ] 답을 받으면 각 질문을 Resolved로 바꾸고 근거를 남김

## 3. 에뮬레이터 확인 (담당 1명, 반나절)

외장 GPU가 있는 팀원이 맡습니다. 결과는 해당 질문과 `REQUIREMENTS.md`의 검증 태그에 기록합니다.

- [ ] 에뮬레이터를 실행할 수 있는 팀원 PC 수 확인 → 담당 지정 (담당: )
- [ ] 화면 규격 (`adb shell wm size`, `adb shell wm density`) → Q4, README 제출 정보
- [ ] 주행/정차, 주차를 판단할 신호 → Q8, GAM-Q1
- [ ] Virtual Console로 바꿀 수 있는 신호 (Odometer, Fuel, Safety, Tire, Door) → GAM-Q2
- [ ] Safety 경고 종류와 Tire 공기압 항목 → GAM-Q3
- [ ] Seat 점유 정보 → GRD-Q2
- [ ] NaviHelper 경유지 추가 → GRD-Q3
- [ ] STT 한국어 인식, ON_DEVICE 모드 → GRD-Q6
- [ ] 공회전·급제동 판단 신호(속도, 시동 상태, 브레이크 페달), 12V 배터리 → GAM-Q17, GAM-Q14

## 4. 날짜별 할 일

### 11/12(목)

- [ ] owner 지정, README 팀 표 채우기
- [ ] 각자 git config에 닉네임과 GitHub noreply 이메일 설정 ([README](README.md#처음-오신-분))
- [ ] 첫 커밋과 push, GitHub에서 `main` 브랜치 보호 설정
- [ ] 주최측 문의 메일 발송 (2절)
- [ ] 두 프로젝트 `GOAL.md` 검토 시작 (이견은 PR 코멘트로)

### 11/13(금)

- [ ] 1절의 11/13 기한 결정 모두 마치기
- [ ] 에뮬레이터 확인 결과 기록 (3절)
- [ ] P0 요구사항의 수용 기준 다듬기

### 11/14(토)

- [ ] 목업 제작
- [ ] 영상 콘티 (대표 시나리오를 처음부터 끝까지, 차량 신호가 바뀌는 장면 포함)
- [ ] `PROPOSAL.md` 1~6번 초안. 특히 아래 TODO를 채웁니다
  - [ ] Pain Point 근거 (GRD-Q9, game 2번)
  - [ ] "차량이어야 하는 이유" 한 문단 (양쪽 3번)
  - [ ] 타깃 규모, 예상 MAU, Retention과 그 근거 (GRD-Q7, GAM-Q8)

### 11/15(일): 마감 (23:59)

- [ ] 18:00 내부 마감
- [ ] 영상 녹화, 업로드, 링크 공개 범위 확인
- [ ] README 제출 정보 5개 항목 채우기
- [ ] [submission.md](docs/contest/submission.md) 6절 개인정보 점검
- [ ] [submission.md](docs/contest/submission.md) 7절 체크리스트
- [ ] 최종 커밋 hash 확정, 메일 발송 (전원 CC, 동의서 첨부)

### 11/16(월)

- [ ] 저장소 공개 전환
- [ ] 11/23까지 `main` 동결

## 5. 마감 뒤 (11/16 ~ 12/03 PT)

- [ ] 2차 PT 심사 기준 공지 확인 → Q10, [judging.md](docs/contest/judging.md) 갱신
- [ ] Android 구현 계획 (ADR-0002 결과에 따라)
- [ ] 퍼미션 승인 범위 확인 결과를 요구사항에 반영
