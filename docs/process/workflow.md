# 작업 흐름

5명이 두 프로젝트를 동시에 진행하면서 아이디어를 요구사항으로 확정하고 목업까지 만드는 방법입니다. 브랜치·커밋 규칙은 [AGENTS.md](../../AGENTS.md) 6절에 있습니다.

## 1. 단계

| 단계 | 목적 | 산출물 | 끝나는 조건 |
|---|---|---|---|
| 0. 탐색 | 아이디어를 넓힌다 | Issue(아이디어), `REQUIREMENTS.md`의 Draft 항목 | 기한 없음. 계속 열려 있습니다 |
| 1. 정의 | Goal에 합의하고 요구사항을 구체화한다 | `GOAL.md` 합의, 요구사항 Review | P0 후보마다 수용 기준, 심사 태그, SDK 의존이 적혀 있다 |
| 2. 확정 | 데모 범위를 정한다 | P0 Confirmed, `DECISIONS.md` 기록 | P0을 막는 `OPEN_QUESTIONS`가 해결되었거나 대체 동작이 정해졌다 |
| 3. 목업 | 대표 시나리오를 시연할 수 있게 만든다 | [ADR-0002](../decisions/0002-mockup-implementation.md)에서 정한 형태의 목업, 시연 영상 | `GOAL.md`의 성공 기준을 체크했다 |
| 4. 제출 | 접수한다 | 접수양식(`PROPOSAL.md` 기반), 영상, 커밋 hash | [submission.md](../contest/submission.md) 체크리스트를 마쳤다 |

단계는 프로젝트마다 따로 진행합니다. 한 프로젝트가 목업 단계여도 다른 프로젝트는 정의 단계일 수 있습니다.

정의 단계에서 [앱 공통 UC·FR 템플릿](templates/README.md)을 사용할 수 있습니다. 사용자 목표의 흐름과 검증할 기능을 연결하고, 미결정 사항은 기존 `OPEN_QUESTIONS.md`에, 합의한 결정은 기존 `DECISIONS.md` 또는 ADR에 기록합니다. 기존 요구사항은 ID를 유지하며 필요한 시나리오부터 보강합니다.

## 2. 마감 주간 일정 (제안)

| 날짜 | 목표 |
|---|---|
| 11/12(목) | 세팅 완료. 프로젝트 owner 지정. 두 프로젝트의 `GOAL.md`를 읽고 이견을 PR 코멘트로 남긴다 |
| 11/13(금) | Goal 합의. P0 요구사항 Confirmed. 목업 방식 결정(ADR-0002). 출품작 수 결정(open-questions Q1) |
| 11/14(토) | 목업 제작. `PROPOSAL.md` 1~6번 초안 완성 |
| 11/15(일) | 18:00 내부 마감. 영상 녹화, 양식 작성, 개인정보 점검, 커밋 hash 확정, 메일 발송(23:59 공식 마감) |
| 11/16(월) | 저장소 공개 전환. 11/23까지 `main` 동결 |

## 3. 하루 리듬

- **아침 싱크 (15분):** 각자 오늘 손댈 문서와 요구사항 ID를 말합니다. 같은 절을 두 사람이 동시에 고치지 않기 위해서입니다.
- **저녁 정리 (15분):** 열린 PR을 훑고, Review 상태 항목을 Confirmed로 올릴지 정합니다. 새로 생긴 질문을 `OPEN_QUESTIONS.md`에 옮깁니다.

## 4. 동시 작업 규칙

- **프로젝트 owner:** 프로젝트마다 owner를 한 명 둡니다(README 팀 표). owner는 그 프로젝트 문서의 merge를 판단합니다.
- **ID 단위로 나눠 쓰기:** 요구사항은 ID마다 절이 따로 있어서, 다른 ID는 동시에 고쳐도 충돌하지 않습니다.
- **새 ID 번호가 겹치면:** 나중에 merge하는 쪽이 번호를 올립니다.
- **공통 문서**(README, AGENTS, docs/contest)는 작은 PR로 만들어 빨리 merge합니다.
- **PR은 작게:** 한 PR에 한 프로젝트, 한 주제만 담습니다. 리뷰는 반나절 안에 합니다.

## 5. 합의하는 방법

1. 제안자가 PR을 엽니다. 항목 상태는 Draft 또는 Review입니다.
2. 해당 프로젝트 owner와 1명 이상이 승인합니다.
3. 승인한 **사람**이 상태를 Confirmed로 바꾸고, `DECISIONS.md`에 한 줄을 남깁니다.
4. 코멘트 논의가 30분 넘게 이어지면 싱크에서 정하고, 결과만 기록합니다.

Goal·Non-goal 변경과 출품작 결정은 팀 전원이 확인합니다.

## 6. 에이전트와 함께 일하기

Claude Code는 `CLAUDE.md`를 통해, Codex는 직접 `AGENTS.md`를 읽습니다. 규칙은 같습니다.

- **한 세션에 한 PR 주제만 다룹니다.** 세션을 시작할 때 대상 프로젝트와 요구사항 ID를 알려줍니다.
- **에이전트가 만든 결과는 사람이 읽고 PR로 올립니다.** 특히 SDK에 관한 사실, 수치, 심사 기준과의 연결을 확인합니다.
- **교차 검토:** 한 에이전트로 쓴 PR을 다른 에이전트로 검토하면 놓친 것을 찾기 쉽습니다. 예: Codex로 쓴 PR을 Claude로 리뷰합니다.

자주 쓰는 요청 예시:

```text
projects/grandma/GOAL.md와 docs/contest/judging.md를 읽고,
GRD-007의 수용 기준을 데모에서 확인할 수 있는 형태로 다듬어줘.
문서에 없는 SDK API가 필요하면 OPEN_QUESTIONS.md에 질문으로 추가해줘.
```

```text
projects/game/REQUIREMENTS.md를 AGENTS.md 4절 기준으로 검토해줘.
심사 태그가 없는 항목, 근거 없는 수치, dev-environment.md에 없는 API를 목록으로 보여줘. 수정은 하지 마.
```

```text
projects/grandma/GOAL.md와 REQUIREMENTS.md의 P0 항목으로 PROPOSAL.md 3~5번을 갱신해줘.
요구사항에 없는 기능은 추가하지 마.
```

```text
docs/contest/submission.md 7절 체크리스트로 저장소를 점검하고, 안 된 항목을 알려줘.
```
