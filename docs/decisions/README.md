# 결정 기록 (ADR)

저장소 전체나 두 프로젝트에 걸친 결정을 기록합니다. 한 프로젝트 안의 결정은 `projects/<p>/DECISIONS.md`에 씁니다.

| 번호 | 제목 | 상태 | 날짜 |
|---|---|---|---|
| [0001](0001-repo-structure.md) | 저장소 구조와 문서 체계 | Accepted | 2026-11-12 |
| [0002](0002-mockup-implementation.md) | 목업 구현 방식 | **Proposed** (결정 필요) | 2026-11-12 |

상태: `Proposed` → `Accepted` / `Rejected` / `Superseded by NNNN`

새 ADR을 쓸 때는 아래 템플릿을 복사하고, 번호는 다음 숫자를 씁니다. Accepted로 바꾸는 것은 사람만 합니다.

```markdown
# NNNN. 제목

- 상태: Proposed
- 날짜: YYYY-MM-DD
- 결정에 참여한 사람: (별칭)

## 맥락
무엇을 왜 정해야 하는가. 어떤 제약이 있는가.

## 결정
무엇으로 정했는가.

## 고려한 대안
각 대안과 고르지 않은 이유.

## 결과
좋아지는 점, 감수할 점, 후속 작업.
```
