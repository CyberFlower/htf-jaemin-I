// 생성된 파일입니다. 손으로 고치지 않습니다.
// 원본: projects/game/SCENARIO.md 2절 장면 표 → node spikes/mockup-frame/build.mjs
window.MOCKUP_DATA = window.MOCKUP_DATA || {};
window.MOCKUP_DATA["game"] = {
  "code": "GAM",
  "name": "내 차로 짓는 도시",
  "scenario": "토요일 장보기",
  "width": 1920,
  "height": 1080,
  "spec": "1920×1080 (틀 기본값. 에뮬레이터 실측 전, Q4)",
  "source": "projects/game/SCENARIO.md",
  "scenes": [
    {
      "id": "SC-01",
      "title": "낮의 섬",
      "state": "주차",
      "screens": "S01",
      "src": null,
      "kind": null,
      "caption": "주민이 돌아다니는 낮의 섬에서 시작합니다",
      "reqs": "",
      "tags": ""
    },
    {
      "id": "SC-02",
      "title": "출발하면 주행 모드",
      "state": "주행",
      "screens": "S02",
      "src": null,
      "kind": null,
      "caption": "주행 중에는 섬만 움직이고 조작이 없습니다",
      "reqs": "GAM-N01",
      "tags": "[차량특화]"
    },
    {
      "id": "SC-03",
      "title": "주차하면 택배가 온다",
      "state": "주차",
      "screens": "S03",
      "src": null,
      "kind": null,
      "caption": "내 차가 섬으로 돌아오고, 택배를 열면 달린 거리의 자재와 안전운전 골드가 나옵니다",
      "reqs": "GAM-001, GAM-003, GAM-025",
      "tags": "[차량특화] [기술]"
    },
    {
      "id": "SC-04",
      "title": "시장을 짓고 야시장으로",
      "state": "주차",
      "screens": "S04, S05",
      "src": null,
      "kind": null,
      "caption": "빈 땅에 시장을 짓고, 저녁이 되면 정류장 옆 시장이 야시장으로 바뀝니다",
      "reqs": "GAM-004, GAM-005, GAM-019",
      "tags": "[창의]"
    },
    {
      "id": "SC-05",
      "title": "거두고, 사고, 쓰다듬기",
      "state": "주차",
      "screens": "S06, S11",
      "src": null,
      "kind": null,
      "caption": "완성품을 거둬 골드를 받고, 상점에서 장식을 사서 놓고, 주민을 쓰다듬습니다",
      "reqs": "GAM-031, GAM-032, GAM-033",
      "tags": "[사업]"
    },
    {
      "id": "SC-06",
      "title": "정비소 주민의 정비 알림",
      "state": "주차",
      "screens": "S08, S09",
      "src": null,
      "kind": null,
      "caption": "엔진오일 점검 시기를 거리와 기간 중 먼저 오는 쪽으로 알리고, 교체를 기록합니다",
      "reqs": "GAM-006, GAM-007",
      "tags": "[차량특화] [사업]"
    },
    {
      "id": "SC-07",
      "title": "공기압 경고와 일렁이는 길",
      "state": "경고 (공기압)",
      "screens": "S10",
      "src": null,
      "kind": null,
      "caption": "실제 경고 카드가 맨 위에 뜨고 섬의 길이 일렁입니다. 경고가 풀리면 둘 다 사라집니다",
      "reqs": "GAM-009, GAM-N02",
      "tags": "[창의] [차량특화]"
    }
  ]
};
