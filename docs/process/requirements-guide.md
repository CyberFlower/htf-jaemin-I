# 요구사항 작성 가이드

## 1. 문서의 위계

```text
GOAL.md           왜 만들고 무엇을 이룰 것인가 (Goal, Non-goal, 성공 기준)
  ├ USE_CASES.md      사용자 목표를 이루는 기본·대안·예외 흐름 (필요한 시나리오부터 추가)
  └ REQUIREMENTS.md   무엇을 만들 것인가 (ID별 요구사항)
      └ PROPOSAL.md       접수양식에 옮길 원고 (위 두 문서의 요약)
OPEN_QUESTIONS.md   아직 모르는 것
DECISIONS.md        정한 것과 그 이유
```

요구사항은 `GOAL.md`의 Goal 중 하나 이상에 기여해야 합니다. 어느 Goal에도 속하지 않으면 Goal을 고치거나 요구사항을 버립니다.

Use Case와 FR을 함께 다듬을 때는 [공통 템플릿](templates/README.md)을 씁니다. Goal → UC 흐름 → FR → 수용 기준을 연결하되, 기존 Goal·Confirmed 요구사항·결정의 우선순위는 [AGENTS.md](../../AGENTS.md)를 따릅니다. `USE_CASES.md`는 기존 요구사항에 점진적으로 연결하는 보완 문서입니다.

## 2. 형식

`REQUIREMENTS.md`에 아래 블록을 복사해 씁니다. 요구사항마다 절을 따로 두는 이유는 여러 사람이 동시에 고쳐도 충돌하지 않게 하기 위해서입니다. 아래는 기존 간단 형식이며, UC 흐름·결정·미결정 연결을 포함한 [공통 FR 블록](templates/functional-requirements.md)으로 보강할 수 있습니다. 기존 필드와 ID는 유지합니다.

```markdown
### GRD-000 짧은 제목
- 상태: Draft · 우선순위: P1 · 심사: [차량특화] [기술] · 목표: GRD-G2
- 이야기: <누구>로서 <어떤 상황>에서 <무엇>을 하고 싶다. 그래야 <이유>.
- 수용 기준:
  - <관찰할 수 있는 결과>
  - <하지 않아야 하는 것: 오판 케이스>
- 의존: <SDK 도메인/API (퍼미션) — 검증 태그>, <외부 서비스>
- 데모: <영상이나 PT에서 어떻게 보여줄지 한 줄>
- 출처: <draft 절, Issue 번호 등>
- 메모: <선택>
```

목록 보기: `grep -n "^### GRD-" projects/grandma/REQUIREMENTS.md`

## 3. 필드 정의

### ID

| 접두어 | 대상 |
|---|---|
| `GRD-###` / `GRD-N##` | 다녀왔습니다: 기능 / 비기능·원칙 |
| `GAM-###` / `GAM-N##` | 내 차로 짓는 도시: 기능 / 비기능·원칙 |
| `GRD-G#` / `GAM-G#` | Goal (`GOAL.md`) |
| `GRD-UC-###` / `GAM-UC-###` | Use Case (`USE_CASES.md`, 공통 템플릿의 추가 표기) |
| `GRD-Q#` / `GAM-Q#` / `Q#` | 미결정 질문 (프로젝트 / 저장소 공통) |

번호는 재사용하지 않습니다. 없애는 항목은 지우지 말고 Dropped로 바꿉니다.

### 상태

| 상태 | 뜻 | 누가 바꾸나 |
|---|---|---|
| Draft | 후보. 누구나 추가할 수 있습니다 | 누구나 (에이전트 포함) |
| Review | PR에서 논의 중입니다 | 누구나 |
| Confirmed | 팀이 합의했습니다. 바꾸려면 `DECISIONS.md`에 먼저 기록합니다 | **사람만** |
| Deferred | 이번 범위(1차 또는 PT) 밖으로 미뤘습니다 | 사람만 |
| Dropped | 하지 않습니다. 메모에 이유를 적습니다 | 사람만 |

### 우선순위

| 우선순위 | 기준 |
|---|---|
| P0 | 이것이 없으면 대표 시나리오 시연이 성립하지 않습니다 |
| P1 | 있으면 심사 근거가 뚜렷해집니다. P0이 끝난 뒤에 합니다 |
| P2 | 확장·후속 기능입니다. 양식에는 "발전 가능성"으로만 씁니다 |

### 심사 태그

`[차량특화]` `[창의]` `[기술]` `[사업]` 중 하나 이상을 붙입니다. 뜻은 [judging.md](../contest/judging.md)에 있습니다.

### 의존과 검증 태그

SDK 의존은 `SDK 도메인/API (퍼미션) — 검증 태그` 형태로 씁니다. 예: `Vehicle Odometer (CAR_DRIVE) — 문서 확인`

| 검증 태그 | 뜻 |
|---|---|
| 문서 확인 | [dev-environment.md](../contest/dev-environment.md) 또는 공식 문서에 있습니다 |
| 에뮬레이터 검증 (v2.1.0, YYYY-MM-DD, 확인자 별칭) | 에뮬레이터에서 실제로 동작을 확인했습니다 |
| 미지원 | 확인해 보니 제공하지 않습니다. 대체 동작을 적습니다 |
| 확인 필요 | 아직 모릅니다. `OPEN_QUESTIONS.md`의 질문 ID를 함께 적습니다 |

### 근거를 찾는 순서 (차량 신호, SDK, 플랫폼 API)

UC와 FR에 차량 신호나 API를 쓸 때는 아래 순서로 찾습니다. 출처 등급은 [dev-environment.md](../contest/dev-environment.md) 0.2절에 있습니다.

1. **[SDK 문서]를 먼저 봅니다.** [Pleos Connect SDK 문서](https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/)의 SDK 5종(Vehicle, NaviHelper, FusedLocation, SpeechToText, TextToSpeech)입니다. 요약은 dev-environment.md 4절에 있습니다. 같은 기능이 SDK에 있으면 SDK API를 씁니다.
2. **SDK에 없으면 AAOS 표준 API를 봅니다.** dev-environment.md 4.3절의 표를 먼저 보고, 없으면 [Android `VehiclePropertyIds`](https://developer.android.com/reference/android/car/VehiclePropertyIds)를 봅니다. AAOS 표준 API를 공모전에서 쓸 수 있는지는 주최측에 확인 중이며, 쓸 수 있다고 가정하고 설계합니다([open-questions.md](../open-questions.md) Q11).
   - 의존 표기: `AAOS <프로퍼티> (<권한>, <보호 수준>) — 문서 확인, 공모전 범위 확인 중 (Q11)`. 예: `AAOS PERF_VEHICLE_SPEED (Car.PERMISSION_SPEED, Dangerous) — 문서 확인, 공모전 범위 확인 중 (Q11)`
   - Q11의 답이 "불가"일 때의 대체 동작을 함께 적습니다. 후보는 dev-environment.md 4.3.1절에 있습니다.
   - Dangerous 권한은 사용자가 거부할 수 있으므로, 거부했을 때의 동작도 적습니다.
   - `VehiclePropertyIds`에 없는 비표준 프로퍼티는 쓰지 않습니다.
3. **둘 다 없으면** `미지원`으로 적고 대체 동작을 씁니다. 있는지 확신이 없으면 `확인 필요`로 적고 질문 ID를 연결합니다. 없는 API 이름을 지어내지 않습니다.

Gleo Interface는 공지가 따로 허용하므로 1번과 같이 다룹니다(dev-environment.md 4.5절). 외부 음성 인식 서비스와 Pleos LLM SDK는 쓸 수 없습니다(dev-environment.md 1절, 4절).

### 수용 기준

- 관찰할 수 있는 결과로 씁니다. "~할 수 있다", "~하지 않는다" 형태가 좋습니다.
- 차량 신호를 쓰는 요구사항에는 오판 케이스를 하나 이상 넣습니다. 예: 문만 열고 닫은 경우를 탑승으로 확정하지 않는다.
- SDK가 지원하지 않을 때의 대체 동작을 적습니다.

## 4. 예시

나쁜 예:

> AI가 가족 관계를 파악해 자동으로 일정을 잡고 할머니께 메시지를 보낸다.

해석을 관측처럼 다루고, 사용자 승인이 없고, 검증할 방법이 없습니다.

좋은 예:

> 저장한 약속과 사용자가 고른 날짜로 여정 초안을 만든다. 운전자가 승인해야 확정되며, 확정 전에는 차량 실행이나 외부 전송을 하지 않는다.

## 5. Review로 올리기 전 체크리스트

- [ ] 이야기에 누가, 언제, 왜가 들어 있습니다
- [ ] 기여하는 Goal ID가 있습니다
- [ ] 심사 태그가 하나 이상 있습니다
- [ ] 수용 기준이 하나 이상이고 관찰할 수 있습니다
- [ ] SDK 의존마다 검증 태그가 있습니다
- [ ] AAOS 표준 API에 의존하면 Q11을 연결하고, AAOS를 못 쓸 때의 대체 동작을 적었습니다
- [ ] 모르는 것은 `OPEN_QUESTIONS.md`의 질문으로 연결했습니다
- [ ] 근거 없는 수치가 없습니다
- [ ] UC를 연결했다면 흐름 번호와 FR의 양쪽 참조가 맞습니다
- [ ] 관련 결정은 파일과 ID로 참조하고, 미결정 사항은 질문으로 연결했습니다
