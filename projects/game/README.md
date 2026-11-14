# 내 차로 짓는 도시 (`GAM`)

> 운행과 소모 기록으로 보상을 얻고, 원하는 모습으로 도시를 키운다. 도시를 보러 오는 길에 차량 관리 시기도 알아차린다.

- 단계: **정의**. Goal은 Draft이고 요구사항은 후보 상태입니다.
- owner: (별칭, [README 팀 표](../../README.md#팀) 참고)
- 원본 기획: [draft/proposal-game.png](../../draft/proposal-game.png) (v0.1), 케어 요소는 [draft/proposal-care.html](../../draft/proposal-care.html) (CarCare Mate, game에 흡수, [D-001](DECISIONS.md)). 원본은 고치지 않습니다.

| 문서 | 내용 |
|---|---|
| [GOAL.md](GOAL.md) | 의도, 타깃, Goal과 Non-goal, 핵심 루프, 퀘스트 구조, 성공 기준, 원칙 |
| [USE_CASES.md](USE_CASES.md) | 사용자 목표별 기본·대안·예외 흐름 (`GAM-UC-###`, Draft) |
| [REQUIREMENTS.md](REQUIREMENTS.md) | ID별 요구사항 (`GAM-###`, `GAM-N##`) |
| [SCREENS.md](SCREENS.md) | (제안) 공모전에서 보여줄 장면, 화면 목록, 시연 영상 순서 |
| [PROPOSAL.md](PROPOSAL.md) | 접수양식 02의 1~8번 원고 |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | 아직 모르는 것 (`GAM-Q#`) |
| [DECISIONS.md](DECISIONS.md) | 이 프로젝트에서 정한 것 |

퀘스트로 확장하는 방향: 차량 정비 알림, care의 운전 습관 케어, grandma의 "동행 여정"을 퀘스트로 받아들이는 안을 검토 중입니다(GAM-G4, GAM-011~014).

실험 목업은 [spikes/game-isometric](../../spikes/game-isometric/README.md)에 있습니다. 저장소 루트에서 `npm run dev`로 실행합니다. 차에서 모은 자재로 전국 지도의 도시를 열고, 시설 레벨업·단계 돌파로 키우는 흐름(SCREENS.md 12절)을 검토합니다. 차량 신호는 시뮬레이션이며 ADR-0002는 Proposed입니다.
