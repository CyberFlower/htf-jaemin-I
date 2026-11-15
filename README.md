# 차량용 앱 공모전 목업 프로젝트

현대자동차그룹 차량용 앱 개발 공모전에 내기 위해, Pleos Connect(Android Automotive OS 기반 차량 인포테인먼트) 앱 아이디어 두 개를 기획하고 요구사항을 확정해 목업까지 만드는 5인 팀 저장소입니다.

## 앱 소개

### 내 차로 짓는 도시 (`GAM`)

**"차로 가는 모든 순간이 게임 같아야 하니까"**

평범한 출퇴근도 주말의 작은 외출도 나만의 도시를 키우는 여정이 됩니다. 주차하면 방금 달린 거리와 안전운전 기록이 건축 자재로 도착하고, 그 자리에서 섬 도시를 꾸미며 다음 정비 시기와 차량 경고도 함께 챙깁니다.

| 항목 | 내용 |
|---|---|
| 실행 방법 | 내 차로 짓는 도시 목업의 [`index.html`](spikes/game-isometric/index.html)을 브라우저로 엽니다. 시연 순서는 [SCENARIO.md](projects/game/SCENARIO.md) 4절을 참고하세요 |
| 테스트 환경 및 필요한 설정 | 최신 Chrome·Edge. 화면은 1920×1080(16:9) 기준입니다. 차량 신호는 화면 오른쪽 시뮬레이터에서 시연용 값으로 조작합니다.  |

### 다녀왔습니다 (`GRD`)

**"다음에 같이 가자, 그 말이 잊히지 않도록"**

가족과 나눈 "다음에"를 한 올씩 이어, "다녀왔습니다"로 매듭짓는 차 안의 동행 앱입니다. 정차한 자리에서 한마디로 약속을 남기면, 출발 준비와 함께 탈 사람 확인, 다녀온 기록까지 차가 곁에서 이어 줍니다.

| 항목 | 내용 |
|---|---|
| 실행 방법 | 다녀왔습니다 목업의 [`journey-demo.html`](spikes/grandma-journey-context/journey-demo.html)을 브라우저로 엽니다. 첫 방문(SC-01~07)과 재방문(SC-08)이 한 화면 흐름으로 이어집니다. 시연 순서는 [SCENARIO.md](projects/grandma/SCENARIO.md) 4절을 참고하세요 |
| 테스트 환경 및 필요한 설정 | 최신 Chrome·Edge·Safari. 화면은 1920×1080(16:9) 기준입니다. 차량 신호, 내비, 날씨, 장소 검색 결과는 차량 화면 밖 시연 도구에서 시연용 값으로 조작합니다 |

### 자료 바로 가기

| 앱 | 목업 | 대표 시나리오 | Pleos SDK 활용 |
|---|---|---|---|
| **내 차로 짓는 도시** (`GAM`) | [내 차로 짓는 도시 목업](spikes/game-isometric/README.md) | [SCENARIO.md](projects/game/SCENARIO.md) | [SDK.md](projects/game/SDK.md) |
| **다녀왔습니다** (`GRD`) | [다녀왔습니다 목업](spikes/grandma-journey-context/README.md) | [SCENARIO.md](projects/grandma/SCENARIO.md) | [SDK.md](projects/grandma/SDK.md) |

- **목업 실행 방법:** 위 표의 목업 README에서 각 앱의 실행 방법을 확인할 수 있습니다.
- **장면별 사진 보기:** [목업 틀](spikes/mockup-frame/README.md)의 `index.html`을 열면 두 앱의 목업 사진을 대표 시나리오 순서대로 넘겨 볼 수 있습니다.
- **Pleos SDK 활용 맵:** 장면마다 어떤 SDK API를 쓰는지, 퍼미션, 신호가 없을 때의 동작, 검증 상태를 정리했습니다. API 근거는 [개발 환경 정리](docs/contest/dev-environment.md) 4절에 있습니다.
- 아래부터는 팀의 작업 문서입니다. 기획 근거가 궁금하시면 각 프로젝트의 `GOAL.md`, `USE_CASES.md`, `REQUIREMENTS.md`를 보시면 됩니다.

## 프로젝트

| 코드 | 이름 | 문서 |
|---|---|---|
| `GAM` | 내 차로 짓는 도시 | [projects/game](projects/game/) |
| `GRD` | 다녀왔습니다 | [projects/grandma](projects/grandma/) |

## 일정

| 날짜 | 공식 일정 | 팀 목표 (제안) |
|---|---|---|
| 11/12(목) | | 세팅, owner 지정, GOAL 검토 시작 |
| 11/13(금) | | Goal 합의, P0 요구사항 확정, 목업 방식 결정, 출품작 수 결정 |
| 11/14(토) | | 목업 제작, `PROPOSAL.md` 초안 |
| **11/15(일) 23:59** | **접수 마감** | 18:00 내부 마감 → 영상, 양식, 커밋 hash, 메일 발송 |
| 11/16(월) | 비공개 저장소 공개 전환 기한 | 공개 전환, `main` 동결 |
| 11/23(월) | 1차 결과 발표 (그때까지 공개 유지) | |
| 12/03(목)~04(금) | 2차 PT (오프라인). 실제로 동작하는 앱 필요 | |
| 12/18(금) | 최종 선정 발표 | |
| 2027-02 | 전시·시상 | |

## 저장소 구조

```text
.
├── README.md               이 파일
├── TODO.md                 할 일과 빨리 정할 결정 (기한, 담당)
├── AGENTS.md               에이전트와 사람의 공통 작업 규칙 (Codex가 읽음)
├── CLAUDE.md               AGENTS.md를 가져옴 (Claude Code가 읽음)
├── draft/                  v0.1 원본 기획안. 고치지 않습니다
├── projects/
│   ├── game/               내 차로 짓는 도시 (GAM)
│   └── grandma/            다녀왔습니다 (GRD)
│       ├── README.md         프로젝트 홈
│       ├── GOAL.md           문제, 타깃, Goal/Non-goal, 성공 기준, 원칙
│       ├── REQUIREMENTS.md   ID별 요구사항
│       ├── SCREENS.md        화면 구성, 임팩트 장면, 차량 상태별 동작 (Draft 제안)
│       ├── SDK.md            Pleos SDK 활용 맵 (장면별 API, 퍼미션, 검증 상태)
│       ├── SCENARIO.md       코어 시나리오 가이드 (장면 표가 목업 틀과 영상의 원본)
│       ├── assets/scenes/    목업 틀에 연결한 장면 캡처 (game)
│       ├── PROPOSAL.md       접수양식 02 원고
│       └── DECISIONS.md      정한 것
├── docs/
│   ├── contest/            공모전 사실: 심사 기준, 제출 규칙, 개발 환경·SDK
│   ├── process/            작업 흐름, 요구사항 작성 가이드
│   ├── decisions/          저장소 전체 결정 기록 (ADR)
│   └── open-questions.md   공통 미결정 질문
├── spikes/                 실험 코드
│   ├── mockup-frame/         두 앱의 목업을 장면 순서대로 보여 주는 틀 (capture/에 장면 캡처 스크립트)
│   ├── game-isometric/       game HTML 목업 (아이소메트릭 섬, 차량 시뮬레이터)
│   └── grandma-journey-context/ grandma HTML 목업 (첫 방문~재방문 SC-01~08, "실로 잇는 기억" 화면, 차량 상태 시연 도구)
├── apk/                    제출용 APK 위치 (공모전 규칙)
└── .github/                PR·Issue 템플릿
```

## 일하는 방법

1. **아이디어:** Issue로 올리거나 `REQUIREMENTS.md`에 Draft로 추가합니다(PR).
2. **논의:** PR에서 Review 상태로 이야기합니다.
3. **확정:** 프로젝트 owner와 1명 이상이 승인하면 **사람이** Confirmed로 바꾸고 `DECISIONS.md`에 기록합니다.
4. **목업:** ADR-0002가 정해지면 시작합니다.

자세한 내용은 [docs/process/workflow.md](docs/process/workflow.md)를 참고하세요.

제출물은 프로젝트마다 [목업 틀](spikes/mockup-frame/README.md), 코어 시나리오 가이드(`SCENARIO.md`), 접수양식 원고(`PROPOSAL.md`) 세 가지입니다. 평소 작업이 이 세 가지를 함께 채우는 규칙은 [docs/process/submission-package.md](docs/process/submission-package.md)에 있습니다.

Use Case와 기능 요구사항(FR)을 작성·보강할 때는 [앱 공통 템플릿](docs/process/templates/README.md)을 사용합니다. 복사용 양식, 작성 예시, 기존 `DECISIONS.md`와의 연결 방법을 제공합니다.

## 처음 오신 분

1. 이 README → [AGENTS.md](AGENTS.md) (사람도 읽습니다) → 맡은 프로젝트의 `GOAL.md` 순서로 읽습니다.
2. 이 저장소는 공개될 예정이고, 공모전은 실명과 계정정보 노출을 금지합니다. 이 저장소에서만 쓸 커밋 이름과 이메일을 설정합니다.

   ```bash
   git config user.name "<닉네임>"
   git config user.email "<GitHub noreply 이메일>"   # GitHub Settings > Emails에서 확인
   ```

3. 에이전트: Claude Code는 `CLAUDE.md`(→ `AGENTS.md`)를, Codex는 `AGENTS.md`를 자동으로 읽습니다. 따로 설정할 것은 없습니다.
4. Android 개발 환경과 에뮬레이터 설치는 [docs/contest/dev-environment.md](docs/contest/dev-environment.md)를 참고하세요. 에뮬레이터를 돌리려면 외장 GPU(RTX 3060 Laptop급 이상)가 필요합니다.
