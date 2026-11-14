// 생성된 파일입니다. 손으로 고치지 않습니다.
// 원본: projects/grandma/SCENARIO.md 2절 장면 표 → node spikes/mockup-frame/build.mjs
window.MOCKUP_DATA = window.MOCKUP_DATA || {};
window.MOCKUP_DATA["grandma"] = {
  "code": "GRD",
  "name": "다녀왔습니다",
  "width": 1920,
  "height": 1080,
  "source": "projects/grandma/SCENARIO.md",
  "scenes": [
    {
      "id": "SC-01",
      "title": "기억",
      "state": "정차",
      "sdk": "SpeechToText · FusedLocation",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-02",
      "title": "조율·확정",
      "state": "정차",
      "sdk": "— (외부 날씨·장소 API, 확인 필요)",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-03",
      "title": "출발",
      "state": "정차",
      "sdk": "Vehicle Fuel/EvBattery · NaviHelper",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-04",
      "title": "주행 (1구간)",
      "state": "주행",
      "sdk": "TextToSpeech · 주행 판단: AAOS (Q11)",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-05",
      "title": "동행",
      "state": "정차",
      "sdk": "Vehicle Door · Seat · NaviHelper",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-06",
      "title": "주행 (2구간)",
      "state": "주행",
      "sdk": "TextToSpeech",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-07",
      "title": "다녀옴",
      "state": "주차",
      "sdk": "FusedLocation · SpeechToText",
      "src": null,
      "kind": null
    },
    {
      "id": "SC-08",
      "title": "다시 가는 여정",
      "state": "정차",
      "sdk": "NaviHelper · FusedLocation · SpeechToText (목업은 시연)",
      "src": "../grandma-journey-context/journey-demo.html?embed=1",
      "kind": "html"
    }
  ]
};
