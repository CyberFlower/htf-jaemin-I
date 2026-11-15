# 다녀왔습니다 (`GRD`)

가족과 나눈 "다음에"를 한 올씩 이어, "다녀왔습니다"로 매듭짓는 차 안의 동행 앱입니다. 정차한 자리에서 한마디로 약속을 남기면, 출발 준비와 함께 탈 사람 확인, 다녀온 기록까지 차가 곁에서 이어 줍니다.

## 심사자가 먼저 볼 것

1. [PROPOSAL.md](PROPOSAL.md): 접수양식 02 원고
2. [SCENARIO.md](SCENARIO.md): 대표 시나리오 "이번 일요일, 할머니와 바다 카페"의 장면 8개(SC-01~08)와 캡처
3. [SDK.md](SDK.md): **Pleos SDK 활용 맵**. 장면별로 어떤 Pleos API와 퍼미션을 쓰는지, 신호가 없을 때 어떻게 동작하는지 정리했습니다
4. [HTML 목업](../../spikes/grandma-journey-context/README.md): `spikes/grandma-journey-context/journey-demo.html`을 브라우저로 엽니다. 차량 상태와 내 AI 응답은 시연 도구 값이고, SDK에는 아직 연결하지 않았습니다

## 문서

| 문서 | 내용 |
|---|---|
| [GOAL.md](GOAL.md) | 목적, 타깃, Goal과 Non-goal, 대표 시나리오, 성공 기준, 원칙 |
| [USE_CASES.md](USE_CASES.md) | 사용자 목표별 흐름 (`GRD-UC-###`), 화면 흐름 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 요구사항 (`GRD-###`, `GRD-N##`) |
| [SCREENS.md](SCREENS.md) | 화면 언어("실로 잇는 기억"), 목업 화면과 S##의 대응, 차량 상태별 동작 |
| [SCENARIO.md](SCENARIO.md) | 대표 시나리오 장면 표 (`GRD-SC-##`)와 재방문(SC-08) 시연 순서. 목업 틀과 시연 영상이 이 표를 따릅니다 |
| [SDK.md](SDK.md) | Pleos SDK 활용 맵: 사용 SDK, 장면별 SDK 흐름, 기능별 API, 선언할 퍼미션, 외부 장소 데이터와 내 AI 정리 단계, API별 실패 처리, 검증 계획 |
| [PROPOSAL.md](PROPOSAL.md) | 접수양식 02의 1~8번 원고 |
| [DECISIONS.md](DECISIONS.md) | 이 프로젝트에서 정한 것 |

목업 쪽 설계 자료: [목업 UC 보완안](../../spikes/grandma-journey-context/docs/UC-PROPOSAL.md), [운전자 중심 지식 모델·모바일 연계 제안](../../spikes/grandma-journey-context/docs/PRODUCT-AND-KNOWLEDGE.md)
