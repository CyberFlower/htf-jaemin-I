# AGENTS.md

이 저장소에서 일하는 AI 에이전트(Codex, Claude Code 등)와 사람이 함께 따르는 규칙입니다.
Codex는 이 파일을 직접 읽고, Claude Code는 `CLAUDE.md`를 통해 읽습니다. 규칙을 바꿀 때는 이 파일만 고칩니다.

## 1. 맥락

- **무엇:** 현대자동차그룹 차량용 앱 개발 공모전에 낼 Pleos Connect(AAOS 기반 차량 인포테인먼트) 앱 2개의 기획, 요구사항, 목업
  - `projects/grandma`: 다녀왔습니다 (`GRD`). 기억을 다음 약속으로 잇는 가족 동행 여정
  - `projects/game`: 내 차로 짓는 도시 (`GAM`). 운행 보상으로 도시를 키우고 정비를 퀘스트로 관리. `draft/proposal-care.html`(CarCare Mate)은 별도 프로젝트가 아니라 game의 케어 요소입니다
- **누가:** 5인 팀. 각자 Codex나 Claude Code를 쓰며 같은 문서를 동시에 고칩니다.
- **지금 단계:** 요구사항 정의. 목업 구현 방식은 미정입니다([ADR-0002](docs/decisions/0002-mockup-implementation.md), Proposed).
- **마감:** 1차 접수 2026-11-15 23:59 (KST). 2차 PT 2026-12-03.
- **빨리 정해야 할 것:** [`TODO.md`](TODO.md) 1절 "빨리 정할 것" 표에 기한과 함께 있습니다. 작업을 시작하기 전에, 하려는 일이 아직 정해지지 않은 결정에 막혀 있지 않은지 확인합니다.

## 2. 작업 전에 읽을 것

| 작업 | 읽을 문서 |
|---|---|
| 모든 작업 | `README.md`, 이 파일, `TODO.md` |
| 프로젝트 기획과 요구사항 | `projects/<p>/GOAL.md` → `REQUIREMENTS.md` → `OPEN_QUESTIONS.md` → `DECISIONS.md` |
| 요구사항 작성 형식 | `docs/process/requirements-guide.md` |
| 심사 기준과의 연결 | `docs/contest/judging.md` |
| SDK, 차량 신호, 퍼미션 | `docs/contest/dev-environment.md` |
| 제출물과 접수양식 원고 | `docs/contest/submission.md`, `projects/<p>/PROPOSAL.md` |

## 3. 무엇을 믿을 것인가 (우선순위)

1. 공식 공모전·Pleos 문서 (`docs/contest/`에 요약과 출처 링크가 있습니다)
2. 사람이 확정한 결정 (`docs/decisions/`의 Accepted, `projects/<p>/DECISIONS.md`, Confirmed 요구사항)
3. `GOAL.md`
4. `REQUIREMENTS.md`의 Draft·Review 항목
5. `draft/` 원본 기획안, Issue, 아이디어 메모

서로 어긋나면 위쪽을 따르고, 어긋난다는 사실을 해당 `OPEN_QUESTIONS.md`에 남깁니다.

## 4. 반드시 지킬 것

### 사실과 추측을 구분합니다

- SDK API, 퍼미션, 차량 신호는 `docs/contest/dev-environment.md`나 공식 문서에 있는 것만 존재한다고 씁니다. 없는 것은 지어내지 말고 `확인 필요`로 표시하고 `OPEN_QUESTIONS.md`에 질문을 추가합니다.
- "문서에 있음"과 "에뮬레이터에서 동작함"을 구분합니다. 검증 태그는 `docs/process/requirements-guide.md`를 따릅니다.
- MAU, Retention 같은 수치는 근거(출처, 가정)와 함께만 씁니다. 근거 없는 숫자를 만들지 않습니다.
- `docs/contest/`의 공식 내용은 2026-11-12에 확인한 것입니다. 바뀌었을 수 있으니 제출 직전에 다시 확인합니다.

### 상태는 사람이 확정합니다

- 에이전트는 요구사항을 **Draft로 추가**하거나 **Review로 제안**하는 데까지만 합니다. Confirmed, Deferred, Dropped로 바꾸는 것은 사람이 합니다.
- Confirmed 요구사항을 바꾸려면 먼저 `DECISIONS.md`에 이유를 기록합니다.
- `GOAL.md`의 Goal과 Non-goal, ADR의 상태는 팀이 합의해야 바뀝니다. 에이전트는 제안 PR까지만 만듭니다.

### 개인정보와 비밀 (공모전 규정)

- 공모전은 공유 자료에 **개인정보, 계정정보, 개발자 실명**이 드러나지 않게 하라고 요구합니다. 이 저장소는 공개될 예정입니다.
- 팀원 실명, 연락처, 이메일, 계정 ID를 저장소 어디에도 쓰지 않습니다. 사람은 별칭(M1~M5)으로 부릅니다. 접수양식 01과 동의서는 저장소 밖에서 다룹니다.
- API 키, 서명 키(`*.jks`, `*.keystore`), Pleos My Project 자격 증명, `local.properties`, `.env`를 커밋하지 않습니다.

### 파일을 다룰 때

- `draft/`는 v0.1 원본입니다. 고치지 않고, 변경은 `projects/`에 씁니다.
- ADR-0002가 Accepted 되기 전에는 제품 코드를 만들지 않습니다. 실험 코드는 `spikes/<주제>/` 아래에 두고, 그 폴더의 README에 목적과 결론을 적습니다.
- 한 PR에서는 한 프로젝트, 한 주제만 다룹니다. 공통 문서는 예외입니다.
- 요구사항 ID는 재사용하지 않습니다. 없애는 항목은 지우지 말고 Dropped로 둡니다.

### 두 프로젝트의 공통 제품 원칙

- 주행 중에 화면 조작을 요구하지 않습니다. 상호작용은 정차·주차 중에 하고, 주행 중에는 음성과 안내만 씁니다.
- 차량 신호는 관측이지 해석이 아닙니다. 정차는 방문이 아니고, 도어 열림은 탑승자의 신원이 아닙니다.
- 실제 차량 경고와 안전 정보를 가리거나 늦추지 않습니다.
- 사용자가 승인하지 않은 차량 제어나 외부 전송은 하지 않습니다.
- SDK capability가 없을 때의 대체 동작을 항상 정합니다.

## 5. 작성 규칙

- 문서는 한국어로 씁니다. 코드 식별자, 파일명, 브랜치명은 영어로 씁니다.
- 요구사항 ID: `GRD-###` / `GRD-N##` / `GAM-###` / `GAM-N##`. Goal은 `GRD-G#` / `GAM-G#`, 질문은 `GRD-Q#` / `GAM-Q#`, 공통 질문은 `Q#`입니다.
- 모든 요구사항에 심사 태그를 하나 이상 붙입니다: `[차량특화]` `[창의]` `[기술]` `[사업]`
- 날짜는 `YYYY-MM-DD` 절대 날짜로 씁니다. "내일", "다음 주"라고 쓰지 않습니다.
- 문장은 짧게 쓰고 표와 목록을 우선 씁니다.

## 6. Git

- `main`에 직접 push하지 않습니다. PR로 merge합니다(squash).
- 브랜치: `<type>/<scope>-<topic>`. 예: `docs/grandma-goal`, `req/game-quest`, `spike/game-odometer`
- 커밋: Conventional Commits. scope는 `grandma` | `game` | `contest` | `process` | `repo`
  - 예: `docs(grandma): 대표 시나리오 성공 기준 추가`, `req(game): GAM-009 수용 기준 보강`
- PR 템플릿의 체크리스트를 채우고, 해당 프로젝트 owner를 포함해 1명 이상이 승인한 뒤 merge합니다.
- 에이전트가 만든 커밋은 사람이 내용을 확인한 뒤 push합니다.
- 제출 후 2026-11-23까지는 `main`을 동결합니다(`docs/contest/submission.md` 5절).

## 7. 막혔을 때

- 모르는 것은 멈추고 질문으로 남깁니다. 추측으로 빈칸을 채우지 않습니다.
- 작업이 아직 정해지지 않은 결정에 막히면 `OPEN_QUESTIONS.md`에 질문 ID를 만들고, 기한이 있으면 `TODO.md` 1절 표에 한 줄을 추가합니다. 결정 자체는 사람이 합니다.
- `TODO.md`에는 질문 내용을 옮겨 적지 않고 ID와 링크만 적습니다. 두 곳의 내용이 어긋나지 않게 하기 위해서입니다.
- 요구사항 사이에 충돌을 발견하면 고치기 전에 PR 설명이나 `OPEN_QUESTIONS.md`에 적습니다.
- 자주 쓰는 요청 예시는 `docs/process/workflow.md` 6절에 있습니다.
