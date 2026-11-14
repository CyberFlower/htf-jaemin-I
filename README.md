# 차량용 앱 공모전 목업 프로젝트

현대자동차그룹 차량용 앱 개발 공모전에 내기 위해, Pleos Connect(Android Automotive OS 기반 차량 인포테인먼트) 앱 아이디어 두 개를 기획하고 요구사항을 확정해 목업까지 만드는 5인 팀 저장소입니다.

> **현재 단계: 1차 접수 준비** (2026-11-14 기준). 두 앱 모두 HTML 목업으로 대표 시나리오를 시연합니다. Pleos SDK 연결과 Android 앱은 2차 PT(2026-12-03) 전까지 만듭니다. 구현 방식은 [ADR-0002](docs/decisions/0002-mockup-implementation.md)(Proposed)에서 정합니다.

## 심사하시는 분께

이 저장소에는 출품작 두 개가 있고, 각각 따로 접수했습니다. 심사하시는 앱의 행에서 왼쪽부터 보시면 됩니다.

| 앱 | 한 줄 소개 | ① 목업 실행 | ② 대표 시나리오 | ③ Pleos SDK 활용 | ④ 기획서 원고 |
|---|---|---|---|---|---|
| **다녀왔습니다** (`GRD`) | "언제 한번 가자"던 가족과의 약속을, 차량이 함께 준비해 실제로 다녀온 하루로 만드는 기억 기반 동행 여정 앱 | [재방문 여정 HTML 목업](spikes/grandma-journey-context/README.md) | [SCENARIO.md](projects/grandma/SCENARIO.md) | [SDK.md](projects/grandma/SDK.md) | [PROPOSAL.md](projects/grandma/PROPOSAL.md) |
| **내 차로 짓는 도시** (`GAM`) | 주차할 때마다 방금 달린 거리와 안전운전 기록이 건축 자재로 도착해 섬 도시를 키우고, 정비 시기와 차량 경고도 알아차리는 차량용 도시 꾸미기 앱 | [아이소메트릭 섬 HTML 목업](spikes/game-isometric/README.md) | [SCENARIO.md](projects/game/SCENARIO.md) | [SDK.md](projects/game/SDK.md) | [PROPOSAL.md](projects/game/PROPOSAL.md) |

- **장면 순서대로 한 번에 보기:** [목업 틀](spikes/mockup-frame/README.md)의 `index.html`을 열면 두 앱의 장면을 차량 화면 비율로 넘겨 볼 수 있습니다.
- **Pleos SDK 활용 맵(③):** 장면마다 어떤 SDK API를 쓰는지, 퍼미션, 신호가 없을 때의 동작, 검증 상태를 정리했습니다. API 근거는 [개발 환경 정리](docs/contest/dev-environment.md) 4절에 있습니다.
- **검증 상태를 구분해 적었습니다.** "문서 확인"은 Pleos 공식 문서에 API가 있다는 뜻이고, 에뮬레이터 동작 확인은 아직 하지 않았습니다. 목업의 차량 신호는 시연용 값입니다.
- 아래부터는 팀의 작업 문서입니다. 기획 근거가 궁금하시면 각 프로젝트의 `GOAL.md`, `USE_CASES.md`, `REQUIREMENTS.md`를 보시면 됩니다.

## 프로젝트

| 코드 | 이름 | 원본 기획 | 문서 |
|---|---|---|---|
| `GRD` | 다녀왔습니다 | [draft/proposal-grandma.html](draft/proposal-grandma.html) | [projects/grandma](projects/grandma/) |
| `GAM` | 내 차로 짓는 도시 | [draft/proposal-game.png](draft/proposal-game.png), [draft/proposal-care.html](draft/proposal-care.html) (케어 요소) | [projects/game](projects/game/) |

두 작품은 **각각 접수**하고, 저장소는 이 저장소 하나를 같이 씁니다([Q1, Q2](docs/open-questions.md)). game의 퀘스트가 grandma의 "동행 여정"을 받아들이는 연계는 따로 검토 중입니다(GAM-Q10).

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
│   ├── grandma/            다녀왔습니다 (GRD)
│   └── game/               내 차로 짓는 도시 (GAM)
│       ├── README.md         프로젝트 홈
│       ├── GOAL.md           문제, 타깃, Goal/Non-goal, 성공 기준, 원칙
│       ├── REQUIREMENTS.md   ID별 요구사항
│       ├── SCREENS.md        화면 구성, 임팩트 장면, 차량 상태별 동작 (Draft 제안)
│       ├── SDK.md            Pleos SDK 활용 맵 (장면별 API, 퍼미션, 검증 상태)
│       ├── SCENARIO.md       코어 시나리오 가이드 (장면 표가 목업 틀과 영상의 원본)
│       ├── assets/scenes/    목업 틀에 연결한 장면 캡처 (game)
│       ├── PROPOSAL.md       접수양식 02 원고
│       ├── OPEN_QUESTIONS.md 아직 모르는 것
│       └── DECISIONS.md      정한 것
├── docs/
│   ├── contest/            공모전 사실: 심사 기준, 제출 규칙, 개발 환경·SDK
│   ├── process/            작업 흐름, 요구사항 작성 가이드
│   ├── decisions/          저장소 전체 결정 기록 (ADR)
│   └── open-questions.md   공통 미결정 질문
├── spikes/                 실험 코드
│   ├── mockup-frame/         두 앱의 목업을 장면 순서대로 보여 주는 틀 (capture/에 장면 캡처 스크립트)
│   ├── game-isometric/       game HTML 목업 (아이소메트릭 섬, 차량 시뮬레이터)
│   └── grandma-journey-context/ grandma HTML 목업 (재방문 여정, 14.6인치 차량 화면)
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

## 팀

실명과 연락처는 이 저장소에 쓰지 않습니다(공모전 규정). 별칭과 역할만 적습니다.

| 별칭 | 담당 프로젝트 | 역할 | 에뮬레이터 실행 가능 |
|---|---|---|---|
| M1 | | | |
| M2 | | | |
| M3 | | | |
| M4 | | | |
| M5 | | | |

프로젝트 owner: grandma = M?, game = M?

## 제출 정보

> 이 저장소에는 출품작 두 개가 있고, 각각 따로 접수했습니다. 심사하시는 앱의 절을 봐 주세요.
> 공모전은 README에 아래 5개 항목을 요구합니다([submission.md](docs/contest/submission.md) 5절). 2026-11-14 현재 사실로 채웠고, 구현 방식(ADR-0002)과 에뮬레이터 확인 결과가 나오면 고칩니다.

### 다녀왔습니다 (GRD)

| 항목 | 내용 |
|---|---|
| 앱 이름 및 한 줄 소개 | 다녀왔습니다: "언제 한번 가자"던 가족과의 약속을, 차량이 함께 준비해 실제로 다녀온 하루로 만드는 기억 기반 동행 여정 앱 |
| 실행 방법 | 1차 제출물은 HTML 목업입니다. [`spikes/grandma-journey-context/journey-demo.html`](spikes/grandma-journey-context/journey-demo.html)을 브라우저로 엽니다(설치·빌드 없음). 시연 순서는 [SCENARIOS.md](projects/grandma/SCENARIOS.md) 5절 |
| 테스트 환경 및 필요한 설정 | 최신 Chrome·Edge·Safari. 화면은 1920×1080(16:9) 기준. 차량 신호, 내비, 음성은 목업 안의 시연 설정으로 바꾸며 Pleos SDK에는 아직 연결하지 않았습니다 |
| Pleos Connect 에뮬레이터 버전과 화면 규격 | v2.1.0 / 화면 규격 TBD (`adb shell wm size`로 확인) |
| APK 위치 | [`apk/`](apk/) (`팀명_다녀왔습니다_release.apk`) 또는 GitHub Release 링크 |

### 내 차로 짓는 도시 (GAM)

| 항목 | 내용 |
|---|---|
| 앱 이름 및 한 줄 소개 | 내 차로 짓는 도시: 주차할 때마다 방금 달린 거리와 안전운전 기록이 건축 자재로 도착해 섬 도시를 키우고, 정비 시기와 차량 경고도 알아차리는 차량용 도시 꾸미기 앱 |
| 실행 방법 | 1차 제출물은 HTML 목업입니다. [`spikes/game-isometric/index.html`](spikes/game-isometric/index.html)을 브라우저로 엽니다(설치·빌드 없음). 시연 순서는 [SCENARIO.md](projects/game/SCENARIO.md) 4절 |
| 테스트 환경 및 필요한 설정 | 최신 Chrome·Edge. 화면은 1920×1080(16:9) 기준. 차량 신호는 화면 오른쪽 시뮬레이터로 바꾸며 Pleos SDK에는 아직 연결하지 않았습니다. 녹화 전에는 시뮬레이터의 "처음 상태로"를 누릅니다 |
| Pleos Connect 에뮬레이터 버전과 화면 규격 | v2.1.0 / 화면 규격 TBD (`adb shell wm size`로 확인) |
| APK 위치 | [`apk/`](apk/) (`팀명_내차로짓는도시_release.apk`) 또는 GitHub Release 링크 |
