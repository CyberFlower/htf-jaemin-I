# OPEN QUESTIONS: 내 차로 짓는 도시 (`GAM`)

이 프로젝트에만 해당하는 질문입니다. 저장소 공통 질문(Q1~Q10)은 [docs/open-questions.md](../../docs/open-questions.md)에 있습니다.
해결되면 상태를 `Resolved`로 바꾸고 답과 근거(링크, 날짜)를 남깁니다. 결정이 필요했던 질문은 [DECISIONS.md](DECISIONS.md)에도 기록합니다.

| ID | 질문 | 영향 | 확인 방법 | 담당 | 상태 |
|---|---|---|---|---|---|
| GAM-Q1 | 주차 시점을 어떤 신호로 감지하는가? (공통 Q8과 연결) | GAM-003, GAM-N01 | Brake API Reference, 에뮬레이터 | | Open |
| GAM-Q2 | Virtual Console로 Odometer, Fuel, Safety, Tire 값을 바꿀 수 있는가? | 데모 성공 기준 전체 | 에뮬레이터 | | Open |
| GAM-Q3 | Safety 경고 종류에 공기압과 과열이 있는가? Tire에 공기압 항목이 있는가? | GAM-009 | API Reference | | Open |
| GAM-Q4 | 정비 이력을 가져올 방법이 있는가? 없으면 수동 입력으로 정한다 | GAM-006 | API Reference, 주최측 문의 | | Open |
| GAM-Q5 | 차종별 정비 주기 데이터의 출처는 무엇인가? 정확성과 이용 조건은? | GAM-006 | 취급설명서 등 공개 자료 조사 | | Open |
| GAM-Q6 | 연료 사용을 보상하면 "더 운전할수록 이득"이 된다. 괜찮은가? 효율(연비)이나 안전 운전 보상으로 바꿀까? | GAM-002, 창의성, 사업성 | 팀 결정 | | Open |
| GAM-Q7 | 음성 조회에 Gleo Interface를 쓸 수 있는가? (공통 Q7) | GAM-010 | 주최측 문의. 안 되면 STT + TTS | | Open |
| GAM-Q8 | 타깃 차종(아반떼, 그랜저, 투싼)에 Pleos Connect가 탑재되는가? 타깃 규모와 MAU 근거는? | 양식 6번, 사업성 | 공개 자료 조사 | | Open |
| GAM-Q9 | EV 차주는 무엇으로 보상하는가? | GAM-002 | 팀 결정 | | Open |
| GAM-Q10 | grandma의 동행 여정을 퀘스트로 넣을까? (공통 Q1) | GAM-011, GAM-012 | 팀 결정 | | Open |
| GAM-Q11 | "내리기 전에 동승자와 같은 화면에서 시설 고르기"는 정차 중 조작 범위로 허용되는가? | GAM-004, GAM-N01 | Pleos 운전자 주의 분산 가이드 확인 | | Open |
| GAM-Q12 | 도시 그래픽 자산을 어떻게 만드는가(직접 제작, 생성 도구, 라이선스 자산)? 저작권 문제는 없는가? | 목업, 제출물 | 팀 결정 | | Open |
