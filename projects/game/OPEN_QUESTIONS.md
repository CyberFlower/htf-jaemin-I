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
| GAM-Q13 | 운전 습관으로 정비 주기를 조정하는 규칙의 근거는? care 원본의 수치(단거리 70%, 제동 1.4배 등)는 출처가 없습니다 | GAM-013, GAM-N05 | 취급설명서의 가혹 조건 기준 등 공개 자료 조사 | | Open |
| GAM-Q14 | 12V 배터리 상태를 읽을 수 있는가? EvBattery는 고전압 배터리 위주입니다 | GAM-014 | API Reference, 에뮬레이터 | | Open |
| GAM-Q15 | 음성 매뉴얼의 콘텐츠를 어디서 가져오고, 이용 조건은 어떤가? 답은 어떻게 만드는가(정해진 문답, 검색, 생성형 AI)? | GAM-015 | 팀 조사, 주최측 문의 | | Open |
| GAM-Q16 | 음성 차량 제어(care Feature 04)를 game 범위에 넣을까? | GAM-016, 범위 | 팀 결정 | | Open |
| GAM-Q17 | 공회전과 급제동을 판단할 신호(속도, 시동 상태, 브레이크 페달)를 쓸 수 있는가? (공통 Q8과 연결) | GAM-013 | API Reference, 에뮬레이터 | | Open |
| GAM-Q18 | 배터리 관리를 위한 드라이브 제안이 실제로 효과가 있는가? 운전을 늘리라는 제안이 GAM-Q6과 부딪히지 않는가? | GAM-014 | 공개 자료 조사, 팀 결정 | | Open |
| GAM-Q19 | 주 타깃을 "도시 꾸미기를 즐기는 차주"와 "초보·장기 보유 운전자"(care) 중 어디에 둘까? 둘 다라면 관계는? | GOAL 타깃, 양식 6번 | 팀 결정 | | Open |
| GAM-Q20 | Odometer 값이 없거나 운행 경계를 확정할 수 없을 때 사용자에게 무엇을 보여주는가? GAM-001은 "이유를 보여준다", GAM-018은 "결과 상세를 비워 두고 안내 문구를 표시하지 않는다"로 서로 어긋납니다. (예: 결과 카드에는 이유를 표시하고 상세 화면만 비운다) | GAM-001, GAM-018 | 팀 결정 | | Open |
| GAM-Q21 | 일일 퀘스트 운영 규칙: 초기화 시각, 항목 판정 단위(운행별·하루 누적), 기준값(운전 시간, 시간당 횟수, 최소 판정 시간), 보상(항목별·전부 달성 보너스)은? | GAM-024~029, GAM-UC-001 | 팀 결정 | | Open |
| GAM-Q22 | "일정 시간 이상 운전" 항목이 운전을 늘리는 동기가 되지 않는가? (GAM-Q6, GAM-N03과 같은 문제) 평소 운행으로 채울 수준의 기준이면 충분한가? | GAM-026 | 팀 결정 | | Open |
| GAM-Q23 | 급가속·급감속·급제동 판정: 속도는 AAOS `PERF_VEHICLE_SPEED`로 읽는다(Pleos 차량 앱 FAQ, dev-environment.md 4.3절). 남은 것: ① 에뮬레이터에서 값이 들어오고 바꿀 수 있는가(Virtual Console에 속도 항목 없음) ② 급감속과 급제동의 구분 ③ 판정 기준의 공개 근거 | GAM-027, GAM-028 | 에뮬레이터 스파이크, 공개 자료 조사, 팀 결정 | | Open |
| GAM-Q24 | 방향 지시등 "사용"을 무엇으로 판정하는가? 상태는 `getCurrentTurnSignalState`와 콜백으로 읽을 수 있다(API 목록 확인). 차선 변경·회전을 감지할 수 없어 횟수만 셀 수 있고, 의미 없이 켜는 것과 구분하기 어렵다 | GAM-029 | 팀 결정 | | Open |
| GAM-Q25 | 앱이 화면에 없을 때도 운행 중 차량 신호 콜백을 받을 수 있는가? Odometer 트립 시간은 언제 초기화되고 정차 시간을 포함하는가? | GAM-025~030, GAM-001 | API Reference, 에뮬레이터 | | Open |
| GAM-Q26 | 돌발 쉬어 가기 퀘스트의 연속 운전 기준 시간과 휴식 인정 시간의 공개 근거는? 쉬지 않고 계속 달리면 다시 안내하는가? 하루 보상 횟수 상한은? | GAM-030 | 공개 자료 조사, 팀 결정 | | Open |
| GAM-Q27 | 운행으로 받는 건축 자재에 하루 상한을 둘까? 둔다면 얼마로? 상한이 없으면 오래, 자주 운전할수록 유리해집니다 | GAM-001, GAM-N03, SCREENS.md 3절 | 팀 결정 | | Open |
| GAM-Q28 | 정비를 "퀘스트 완료 → 보상"(GOAL GAM-G2·G4, GAM-007)으로 둘까, 게임 재화 보상 없는 차량 알림(SCREENS.md 5절)으로 둘까? 보상이 크면 정비 없이 기록만 넣을 이유가 생깁니다 | GAM-G2, GAM-G4, GAM-007, SCREENS.md S08·S09 | 팀 결정 | | Resolved (2026-11-14): 정비 시기는 돌발 퀘스트로 두고 완료하면 골드를 보상한다. [DECISIONS D-002](DECISIONS.md) |
| GAM-Q29 | 주행 모드(S02)에서 섬 화면을 계속 띄우고 움직여도 되는가? Android 차량용 게임 안내는 게임을 "parked app"으로 분류하고, 주행 중에는 실행·사용을 막으며 게임 소리도 멈추라고 합니다([Android Developers Blog, 2026-09-21](https://developer.android.com/blog/posts/bring-your-android-game-to-the-car-screen-today), 확인일 2026-11-14). SCREENS.md S02는 "섬은 계속 움직임"입니다. Pleos App Market 기준이 같은지는 확인하지 못했습니다. 대안: 주행 중에는 정지 화면이나 안내 한 줄만 남기기 | SCREENS.md S02, GAM-N01, 시연 영상 2번 장면 | Pleos 운전자 주의 분산 가이드(GAM-Q11과 같은 문서), 에뮬레이터에서 주행 상태의 앱 동작 확인, 팀 결정 | | Open |
| GAM-Q30 | Vehicle Seat의 좌석 점유(`getCurrentSeatOccupancy`, `registerSeatOccupancy`)와 안전벨트 체결(`getCurrentSeatBeltBuckledState`, `registerSeatBeltBuckledState`)은 어떤 값을 돌려주는가(참/거짓의 뜻, 알 수 없음 표현)? 에뮬레이터와 Virtual Console "좌석 점유"로 바꿀 수 있는가? 안전벨트는 Virtual Console에서 바꿀 수 있는가? | GAM-034, GAM-035, GAM-UC-005, GRD-008 | API 이름은 [SDK 문서]로 확인(2026-11-14, [dev-environment.md](../../docs/contest/dev-environment.md) 4.2절). 값과 동작은 에뮬레이터에서 확인 | | Open |
| GAM-Q31 | 도로 주의 구간 퀘스트에 어떤 `CautionPointType`을 쓸까? "지나감"은 목록에서 사라짐과 `remainDistance` 0 중 무엇으로 판정할까? 하루 보상 상한은? 에뮬레이터에서 `onCautionPointInfo`·`onCameraAlert`가 오는가, 오지 않으면 어떻게 시연할까? | GAM-036, GAM-UC-006, [ROAD-INFO.md](ROAD-INFO.md) 2절 | 팀 결정, 에뮬레이터 경로 안내로 확인 | | Open |
| GAM-Q32 | 실시간 사고·돌발 정보를 외부 공공 API(ITS 돌발상황정보, 서울시 실시간 돌발 정보 등)로 받아도 공모전 범위에 드는가? 경로 근처 좌표를 외부로 보내는 것에 대한 사용자 승인, 인증키 보관(중계 서버 여부), 호출 제한은? 1차 영상은 예시 데이터로 보여 줄까? | GAM-037, GAM-UC-006 A3, [ROAD-INFO.md](ROAD-INFO.md) 3·5절 | 공모전 공지 재확인(공통 Q11과 같은 성격), ITS 원문 명세 확인, 팀 결정 | | Open |

