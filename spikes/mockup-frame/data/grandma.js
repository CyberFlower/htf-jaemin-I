// 생성된 파일입니다. 손으로 고치지 않습니다.
// 원본: projects/grandma/SCENARIO.md 2절 장면 표 → node spikes/mockup-frame/build.mjs
window.MOCKUP_DATA = window.MOCKUP_DATA || {};
window.MOCKUP_DATA["grandma"] = {
  "code": "GRD",
  "name": "다녀왔습니다",
  "scenario": "이번 일요일, 할머니 모시고 저장해 둔 바다 카페에 다녀오기",
  "width": 1920,
  "height": 1080,
  "spec": "1920×1080 (실험 목업 기준. 에뮬레이터 실측 전, Q4)",
  "source": "projects/grandma/SCENARIO.md",
  "scenes": [
    {
      "id": "SC-01",
      "title": "기억",
      "state": "정차",
      "screens": "S01 → S02 → S03",
      "src": null,
      "kind": null,
      "caption": "카페 앞에 정차해 \"할머니가 저 카페 가보고 싶대\"라고 남기고, 약속 카드로 저장합니다",
      "reqs": "GRD-UC-002, GRD-002",
      "tags": ""
    },
    {
      "id": "SC-02",
      "title": "조율·확정",
      "state": "정차",
      "screens": "S03 → S04 → S06",
      "src": null,
      "kind": null,
      "caption": "약속으로 여정 초안을 만들고, 경로·공조·전송을 각각 체크해 승인합니다",
      "reqs": "GRD-UC-003, GRD-003, GRD-005",
      "tags": ""
    },
    {
      "id": "SC-03",
      "title": "출발",
      "state": "정차",
      "screens": "S01 → S07 → S06",
      "src": null,
      "kind": null,
      "caption": "연료와 날씨를 갱신해 경유를 제안하고, 1구간(집 → 할머니 댁) 경로를 적용합니다",
      "reqs": "GRD-UC-005, GRD-006, GRD-007",
      "tags": ""
    },
    {
      "id": "SC-04",
      "title": "주행 (1구간)",
      "state": "주행",
      "screens": "S09",
      "src": null,
      "kind": null,
      "caption": "조작 없이 다음 목적지와 안내 한 줄만 보여 주고 음성으로 안내합니다",
      "reqs": "GRD-N01",
      "tags": ""
    },
    {
      "id": "SC-05",
      "title": "동행",
      "state": "정차",
      "screens": "S01 → S08 → S06",
      "src": null,
      "kind": null,
      "caption": "도어 열림→닫힘을 관측하면 \"할머니와 함께 출발하시나요?\"라고 묻고, 확인한 뒤 2구간 경로를 적용합니다",
      "reqs": "GRD-UC-006, GRD-UC-005, GRD-UC-007, GRD-008",
      "tags": ""
    },
    {
      "id": "SC-06",
      "title": "주행 (2구간)",
      "state": "주행",
      "screens": "S09",
      "src": null,
      "kind": null,
      "caption": "바다 카페까지 남은 시간과 맥락 안내 한 줄을 음성으로 안내합니다",
      "reqs": "GRD-UC-011",
      "tags": ""
    },
    {
      "id": "SC-07",
      "title": "다녀옴",
      "state": "주차",
      "screens": "S01 → S10",
      "src": null,
      "kind": null,
      "caption": "방문을 확인해 기록 초안을 만들고, 한마디를 더해 약속을 완료한 뒤 다음 약속을 남깁니다",
      "reqs": "GRD-UC-008, GRD-UC-002, GRD-010",
      "tags": ""
    }
  ]
};
