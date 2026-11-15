// 생성된 파일입니다. 손으로 고치지 않습니다.
// 원본: projects/game/SCENARIO.md 2절 장면 표 → node spikes/mockup-frame/build.mjs
window.MOCKUP_DATA = window.MOCKUP_DATA || {};
window.MOCKUP_DATA["game"] = {
  "code": "GAM",
  "name": "내 차로 짓는 도시",
  "width": 1920,
  "height": 1080,
  "source": "projects/game/SCENARIO.md",
  "scenes": [
    {
      "id": "SC-01",
      "title": "낮의 섬",
      "state": "주차",
      "sdk": "주차 판단: AAOS 기어·주차 브레이크 (Q11)",
      "src": "../../projects/game/assets/scenes/SC-01.png",
      "kind": "image"
    },
    {
      "id": "SC-02",
      "title": "출발하면 주행 모드",
      "state": "주행",
      "sdk": "주행 판단: AAOS (Q11) · Vehicle Odometer",
      "src": "../../projects/game/assets/scenes/SC-02.png",
      "kind": "image"
    },
    {
      "id": "SC-03",
      "title": "주차하면 택배가 온다",
      "state": "주차",
      "sdk": "Vehicle Odometer · Brake · TurnSignal · AAOS 속도 (Q11)",
      "src": "../../projects/game/assets/scenes/SC-03.png",
      "kind": "image"
    },
    {
      "id": "SC-04",
      "title": "시장을 짓고 야시장으로",
      "state": "주차",
      "sdk": "— (로컬 저장, 주차 판단만)",
      "src": "../../projects/game/assets/scenes/SC-04.png",
      "kind": "image"
    },
    {
      "id": "SC-05",
      "title": "거두고, 사고, 쓰다듬기",
      "state": "주차",
      "sdk": "— (로컬 저장, 기기 시각)",
      "src": "../../projects/game/assets/scenes/SC-05.png",
      "kind": "image"
    },
    {
      "id": "SC-06",
      "title": "정비소 주민의 정비 알림",
      "state": "주차",
      "sdk": "Vehicle Odometer · CarInfo",
      "src": "../../projects/game/assets/scenes/SC-06.png",
      "kind": "image"
    },
    {
      "id": "SC-07",
      "title": "공기압 경고와 일렁이는 길",
      "state": "경고 (공기압)",
      "sdk": "Vehicle Safety 경고등 (GAM-Q3)",
      "src": "../../projects/game/assets/scenes/SC-07.png",
      "kind": "image"
    },
    {
      "id": "SC-08",
      "title": "전국 지도에서 내 도시 보기",
      "state": "주차",
      "sdk": "FusedLocation (발자국)",
      "src": "../../projects/game/assets/scenes/SC-08.png",
      "kind": "image"
    },
    {
      "id": "SC-09",
      "title": "차로 모은 자재로 새 도시 열기",
      "state": "주차",
      "sdk": "— (자재는 SC-03의 Vehicle Odometer·안전운전 보상)",
      "src": "../../projects/game/assets/scenes/SC-09.png",
      "kind": "image"
    }
  ]
};
