# 다녀왔습니다 (`GRD`)

> 함께한 기억을 다음 약속으로. 가족 채팅방의 "언제 한번 가자"를 실제로 함께 다녀온 하루로 만듭니다.

- 단계: **정의**. Goal은 Draft이고 요구사항은 후보 상태입니다.
- owner: (별칭, [README 팀 표](../../README.md#팀) 참고)
- 원본 기획: [draft/proposal-grandma.html](../../draft/proposal-grandma.html) (v0.1, 2026-11-09). 원본은 고치지 않습니다.

## 제출 검토 시 읽는 순서

1. [PROPOSAL.md](PROPOSAL.md): 접수양식 원고. **아직 초안**입니다. PR #2에서 보완한 원고와 확인 항목을 유지하며, 근거 확인·가정 검토·제출 링크 확정이 남아 있습니다.
2. [SDK.md](SDK.md): Pleos SDK 활용 맵. 어떤 장면에서 어떤 SDK API와 퍼미션을 쓰는지, 신호가 없을 때 무엇을 하는지, 검증 상태.
3. [SCENARIO.md](SCENARIO.md): 제출용 장면 순서의 원본. [SCENARIOS.md](SCENARIOS.md)는 재방문 목업의 상세 설명·내부 검토 자료입니다. 제출 본문에서는 하나의 대표 여정만 사용하고, 실패·API 상세는 보충 설명으로 둡니다.
4. [HTML 목업](../../spikes/grandma-journey-context/README.md): SC-01~08을 한 앱의 하루 흐름으로 이어 봅니다(첫 방문 목업은 2026-11-15에 통합). 화면은 "실로 잇는 기억" 디자인입니다([SCREENS.md](SCREENS.md) 3절). 현재 확인할 수 있는 동작과 실제 SDK 미연결 범위.

문서 전체를 순서대로 읽을 필요는 없습니다. 아래 자료는 설계 근거를 확인할 때 참고합니다. 제출 분량 제한에 따른 구분이 아니라 전달력을 위한 편집 제안입니다.

## 내부 설계·검토 자료

| 자료 | 확인할 내용 |
|---|---|
| [GOAL](GOAL.md) · [Decisions](DECISIONS.md) | 목표·범위와 사람이 합의한 결정 |
| [UC](USE_CASES.md) · [요구사항](REQUIREMENTS.md) · [목업 UC 보완안](../../spikes/grandma-journey-context/docs/UC-PROPOSAL.md) | 상세 흐름·예외·수용 기준. 전체 목록이 제출 시연의 구현 범위는 아님 |
| [화면 구성](SCREENS.md) | 임팩트 장면, 목업 HTML 화면과 S##의 대응, 차량 상태별 동작, 시연 순서 (Draft 제안) |
| [운전자 중심 지식 모델·모바일 연계 제안](../../spikes/grandma-journey-context/docs/PRODUCT-AND-KNOWLEDGE.md) | 어떤 기억·조건이 이번 선택을 바꾸는지, 폰과 차량의 역할. Draft 설계이며 추가 기능 구현 전 |
| [API 채용안](API-ADOPTION.md) · [외부 장소 연계안](PLACE-INTEGRATION.md) | 구현 검증 상세: API별 실패 처리, 내비 연결의 경계, 에뮬레이터 실험 순서. 장소 출처·식별·갱신. 요약은 [SDK.md](SDK.md) |
| [열린 질문](OPEN_QUESTIONS.md) | 미결정 사항과 검증 방법 |

game 프로젝트와의 관계: game의 퀘스트로 "동행 여정"을 제공하는 안을 검토 중입니다([open-questions.md](../../docs/open-questions.md) Q1).

## 실험 목업

[14.6인치 차량 화면 HTML 목업](../../spikes/grandma-journey-context/README.md): 맥락 기반 장소 추천, 방문 스탬프, 선택·음성 시연으로 남기는 방문 기록을 검토합니다. [UC 보완안](../../spikes/grandma-journey-context/docs/UC-PROPOSAL.md)은 Draft이며, ADR·Decisions 및 확정 요구사항을 변경하지 않습니다.
