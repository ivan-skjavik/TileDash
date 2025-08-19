// Development dashboard configuration
const settings = {
  tileSize: 80,
  tileMargin: 5,
  groupMargin: 10,
  orientation: "landscape",
  customText: "TileDash Development",
  dateLocal: "en-EN",
  iconSize: 40,
  numOfLandImg: 4,
  numOfPortImg: 5,
  backgroundImage: "./img/hexagone.jpg",
  token: "development_token",
  softMobileHeader: true,
};

const dashboard = [
  {
    icon: 'mdi-home',
    group: [
      {
        title: "Development Group",
        width: 4,
        height: 6,
        items: [
          {
            position: [0, 0],
            name: "Welcome",
            type: "VIRTUAL",
            width: 2,
            height: 2,
            icon: "mdi-rocket-launch",
          },
          {
            position: [2, 0],
            type: "VIRTUAL",
            width: 2,
            height: 2,
            icon: "mdi-typescript",
            name: "TypeScript",
          },
          {
            position: [0, 2],
            type: "IMAGE",
            width: 4,
            height: 3,
            folder: "./img/Landscape",
            timeScroll: 5,
            id: "dev-image-1",
          },
          {
            position: [0, 5],
            type: "VIRTUAL",
            width: 2,
            height: 1,
            icon: "mdi-database",
            name: "SQLite",
          },
          {
            position: [2, 5],
            type: "VIRTUAL",
            width: 2,
            height: 1,
            icon: "mdi-reload",
            name: "Hot Reload",
          },
        ],
      },
    ],
  },
];

const flows = [
  {
    id: "dev_flow_1",
    name: "Development Flow 1",
  },
];

window.dashboard = { settings, dashboard, flows };
