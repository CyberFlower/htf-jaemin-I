# 다녀왔습니다 (`GRD`)

> 가족과 나눈 "다음에"를 한 올씩 이어, "다녀왔습니다"로 매듭짓는 차 안의 동행 앱입니다.

- 단계: **정의**. Goal은 Draft이고 요구사항은 후보 상태입니다.
- owner: (별칭, [README 팀 표](../../README.md#팀) 참고)
- 원본 기획: [draft/proposal-grandma.html](../../draft/proposal-grandma.html) (v0.1)

## 제출 검토 시 읽는 순서

1. [PROPOSAL.md](PROPOSAL.md): 접수양식 02 원고
2. [SDK.md](SDK.md): Pleos SDK 활용 맵. 장면별 SDK API와 퍼미션, 신호가 없을 때의 동작, 검증 상태
3. [SCENARIO.md](SCENARIO.md): 대표 시나리오 장면 순서(SC-01~08)와 시연 방법
4. [HTML 목업](../../spikes/grandma-journey-context/README.md): SC-01~08을 한 앱의 하루 흐름으로 시연. 화면은 "실로 잇는 기억" 디자인입니다([SCREENS.md](SCREENS.md) 3절)

## 내부 설계·검토 자료

| 자료 | 확인할 내용 |
|---|---|
| [GOAL](GOAL.md) · [Decisions](DECISIONS.md) | 목표·범위와 합의한 결정 |
| [UC](USE_CASES.md) · [요구사항](REQUIREMENTS.md) · [목업 UC 보완안](../../spikes/grandma-journey-context/docs/UC-PROPOSAL.md) | 상세 흐름·예외·수용 기준 |
| [화면 구성](SCREENS.md) | 임팩트 장면, 화면 언어, 목업 화면과 S##의 대응, 차량 상태별 동작 |
| [재방문 시나리오](SCENARIOS.md) | 기억이 다음 방문을 바꾸는 장면과 실패 장면 |
| [운전자 중심 지식 모델·모바일 연계 제안](../../spikes/grandma-journey-context/docs/PRODUCT-AND-KNOWLEDGE.md) | 어떤 기억·조건이 이번 선택을 바꾸는지, 폰과 차량의 역할 |
| [API 채용안](API-ADOPTION.md) · [외부 장소 연계안](PLACE-INTEGRATION.md) | API별 실패 처리, 내비 연결의 경계, 에뮬레이터 실험 순서. 장소 출처·식별·갱신 |
| [열린 질문](OPEN_QUESTIONS.md) | 미결정 사항과 검증 방법 |

game 프로젝트와의 관계: game의 퀘스트로 "동행 여정"을 제공하는 안을 검토 중입니다([open-questions.md](../../docs/open-questions.md) Q1).
