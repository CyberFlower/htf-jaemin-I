# 내 차로 짓는 도시 (`GAM`)

> 운행과 소모 기록으로 보상을 얻고, 원하는 모습으로 도시를 키운다. 도시를 보러 오는 길에 차량 관리 시기도 알아차린다.

**심사자가 먼저 볼 것**

1. [PROPOSAL.md](PROPOSAL.md): 접수양식 02 원고 (초안)
2. [SCENARIO.md](SCENARIO.md): 대표 시나리오 "토요일 장보기"를 장면 7개로 설명한 가이드와 장면 캡처
3. [SDK.md](SDK.md): Pleos SDK를 어디에 어떻게 쓰는지 한눈에 보는 맵 (API, 퍼미션, 검증 상태)
4. [HTML 목업](../../spikes/game-isometric/README.md): `spikes/game-isometric/index.html`을 브라우저로 엽니다. 차량 신호는 시뮬레이터 값이고 SDK에는 아직 연결하지 않았습니다

- 단계: **정의**. Goal은 Draft이고 요구사항은 후보 상태입니다.
- owner: (별칭, [README 팀 표](../../README.md#팀) 참고)
- 원본 기획: [draft/proposal-game.png](../../draft/proposal-game.png) (v0.1), 케어 요소는 [draft/proposal-care.html](../../draft/proposal-care.html) (CarCare Mate, game에 흡수, [D-001](DECISIONS.md)). 원본은 고치지 않습니다.

| 문서 | 내용 |
|---|---|
| [GOAL.md](GOAL.md) | 의도, 타깃, Goal과 Non-goal, 핵심 루프, 퀘스트 구조, 성공 기준, 원칙 |
| [USE_CASES.md](USE_CASES.md) | 사용자 목표별 기본·대안·예외 흐름 (`GAM-UC-###`, Draft) |
| [REQUIREMENTS.md](REQUIREMENTS.md) | ID별 요구사항 (`GAM-###`, `GAM-N##`) |
| [SCREENS.md](SCREENS.md) | (제안) 공모전에서 보여줄 장면, 화면 목록, 시연 영상 순서 |
| [SCENARIO.md](SCENARIO.md) | 코어 시나리오 가이드 (`GAM-SC-##`, Draft). 장면 표가 [목업 틀](../../spikes/mockup-frame/README.md)과 시연 영상의 원본 |
| [SDK.md](SDK.md) | Pleos SDK 활용 맵: SDK별 쓰는 곳, 장면별 신호 흐름, 퍼미션, 쓰지 않는 것, 검증 계획 |
| [ROAD-INFO.md](ROAD-INFO.md) | 도로 주의 구간과 외부 실시간 돌발 정보 연계안 |
| [PROPOSAL.md](PROPOSAL.md) | 접수양식 02의 1~8번 원고 |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | 아직 모르는 것 (`GAM-Q#`) |
| [DECISIONS.md](DECISIONS.md) | 이 프로젝트에서 정한 것 |

퀘스트로 확장하는 방향: 차량 정비 알림, care의 운전 습관 케어, grandma의 "동행 여정"을 퀘스트로 받아들이는 안을 검토 중입니다(GAM-G4, GAM-011~014).
