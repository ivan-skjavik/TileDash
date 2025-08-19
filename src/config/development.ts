import { DashboardConfig } from '../types';

export const developmentConfig: DashboardConfig = {
  settings: {
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
    softMobileHeader: true,
  },
  dashboard: [
    {
      icon: 'mdi-home',
      group: [
        {
          title: "Development Tiles",
          width: 4,
          height: 3,
          items: [
            {
              position: [0, 0],
              type: 'VIRTUAL',
              width: 2,
              height: 1,
              icon: 'mdi-home',
              name: 'Welcome to TileDash'
            },
            {
              position: [2, 0],
              type: 'VIRTUAL',
              width: 2,
              height: 1,
              icon: 'mdi-typescript',
              name: 'TypeScript Ready'
            },
            {
              position: [0, 1],
              type: 'VIRTUAL',
              width: 1,
              height: 1,
              icon: 'mdi-cog',
              name: 'Settings'
            },
            {
              position: [1, 1],
              type: 'VIRTUAL',
              width: 1,
              height: 1,
              icon: 'mdi-information',
              name: 'Info'
            },
            {
              position: [2, 1],
              type: 'VIRTUAL',
              width: 2,
              height: 1,
              icon: 'mdi-chart-line',
              name: 'Dashboard Stats'
            },
            {
              position: [0, 2],
              type: 'VIRTUAL',
              width: 4,
              height: 1,
              icon: 'mdi-check-circle',
              name: 'Modern TypeScript Architecture Active'
            }
          ]
        }
      ]
    }
  ]
};

export default developmentConfig;
