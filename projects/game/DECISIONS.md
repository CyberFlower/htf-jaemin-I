# DECISIONS: 내 차로 짓는 도시 (`GAM`)

이 프로젝트에서 합의한 결정을 최신순으로 기록합니다. 저장소 전체에 걸친 결정은 [docs/decisions/](../../docs/decisions/)에 씁니다.
Confirmed 요구사항이나 Goal을 바꿀 때는 바꾸기 전에 여기에 먼저 기록합니다.

형식:

```markdown
## D-000 제목 (YYYY-MM-DD)
- 결정:
- 이유:
- 영향: 바뀐 요구사항 ID, 문서
- 합의: 참여자 별칭, PR 번호
```

---

## D-001 CarCare Mate는 game의 요소로 넣는다 (2026-11-12)
- 결정: [draft/proposal-care.html](../../draft/proposal-care.html)(CarCare Mate)를 별도 프로젝트로 만들지 않고, game의 퀘스트와 음성 기능 요소로 넣는다.
- 이유: care의 정비 주기와 배터리 관리는 game의 정비 퀘스트(GAM-006)와 겹친다. care의 운전 습관 분석은 game의 보상 설계 문제(GAM-Q6)를 푸는 데 쓸 수 있다.
- 영향: GOAL(GAM-G2 보강, GAM-G6 추가, 케어 요소 절), GAM-013~016, GAM-N05, GAM-Q13~Q19
- 합의: 저장소 관리자 결정. 팀은 PR에서 확인한다. 각 요소를 어디까지 넣을지는 요구사항 리뷰에서 정한다.
