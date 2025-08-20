import { AppConfig } from '../types';

export const developmentConfig: AppConfig = {
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
	dashboards: [
		{
			id: '1',
			title: 'Dash 1',
			pages: [
				{
					icon: 'mdi-home',
					groups: [
						{
							title: "Development Tiles 1",
							width: 8,
							height: 9,
							tiles: [
								{
									position: [ 0, 0, ],
									name: "Alarm",
									type: "HEIMDALL",
									width: 1,
									height: 1,
									id: "9f4b2a38-bcde-41b9-9287-5f12eb79d3f0", // Id of your device. See Homey developper tool
									capabilityID: "homealarm_state", // Need to be this to control Heimdall
									icon: "mdi-shield-home", //Need to be define even you will use icons option. See https://pictogrammers.com/library/mdi/
									icons: { // Set differents icons for the differents states
										armed: "mdi-shield-lock",
										partiallyArmed: "mdi-shield-moon",
										disarmed: "mdi-shield-off",
									},
								},
								{
									position: [ 2, 0, ],
									type: "IMAGE",
									width: 4,
									height: 3,
									folder: "./img/Landscape", // If you want to scroll different image. The path need to be this or ./img/Portrait
									timeScroll: 5, // Time in seconds for scrolling images
									id: "tile-image-1", // Define which id you want but use a different id for each IMAGE type in your dashboard
								},
								{
									position: [ 2, 3, ],
									name: "Taklys Kontor",
									type: "SLIDER",
									orientation: 'horizontal', // Can also be 'vertical'
									width: 4,
									height: 1,
									minValue: 0, // Min value of the slider. For 'dim' min value is 0 for light off
									maxValue: 1, // Max value of the slider. For 'dim' max value is 1 for light 100%
									step: 0.01, // Step for each slider moves.
									id: "56b58d98-3604-42e7-9945-8575d88fd8f3", //See https://pictogrammers.com/library/mdi/
									capabilityID: "dim",
									icon: "mdi-lightbulb",
								},
								{
									position: [ 2, 4, ],
									name: "Taklys Loftstue",
									type: "SLIDER",
									orientation: 'horizontal', // Can also be 'vertical'
									width: 4,
									height: 1,
									minValue: 0, // Min value of the slider. For 'dim' min value is 0 for light off
									maxValue: 1, // Max value of the slider. For 'dim' max value is 1 for light 100%
									step: 0.01, // Step for each slider moves.
									id: "15575f05-1d5c-4c37-95d6-2fce7f4712b1", //See https://pictogrammers.com/library/mdi/
									capabilityID: "dim",
									icon: "mdi-lightbulb",
								},
								{
									position: [ 2, 5, ],
									name: "Taklys Bad",
									type: "SLIDER",
									orientation: 'horizontal', // Can also be 'vertical'
									width: 4,
									height: 1,
									minValue: 0, // Min value of the slider. For 'dim' min value is 0 for light off
									maxValue: 1, // Max value of the slider. For 'dim' max value is 1 for light 100%
									step: 0.01, // Step for each slider moves.
									id: "20dcccf8-3734-4a67-994b-1f6171af177c", //See https://pictogrammers.com/library/mdi/
									capabilityID: "dim",
									icon: "mdi-lightbulb",
								},
								{
									position: [ 2, 6, ],
									name: "Baklys TV",
									type: "SLIDER",
									orientation: 'horizontal', // Can also be 'vertical'
									width: 4,
									height: 1,
									minValue: 0, // Min value of the slider. For 'dim' min value is 0 for light off
									maxValue: 1, // Max value of the slider. For 'dim' max value is 1 for light 100%
									step: 0.01, // Step for each slider moves.
									id: "850913f1-3f1c-4de4-8ba7-d127b4d7962b", //See https://pictogrammers.com/library/mdi/
									capabilityID: "dim",
									icon: "mdi-lightbulb",
								},
								{
									position: [ 0, 4, ],
									name: "Bedroom",
									type: "GAUGE",
									width: 2, // need to be at least 2
									height: 2, // need to be at least 2
									id: "e8e90f63-fb14-4e21-9d94-1110cd2b4493",
									capabilityID: "measure_temperature",
									icon: "mdi-thermometer",
									unit: "°C",
									maxValue: 35,
									secondValue:{
										capabilityID: 'measure_humidity',
										icon: 'mdi-water-percent',
										unit: '%',
									},
									stepColor: { // define different colors depending on the values. If set, 'prim' and 'sec' must to be defined
										prim: {
											color: 'cyan', // or #0000ff color, or rgb(120,120,120)
											step: 18, // 0 to 18
										},
										sec: {
											color: 'lime',
											step: 25, // 18 to 25
										},
										third: { //third is optionnal
											color: 'red', // higher than sec step  
										},
									},
								},
							],
						},
					],
				},
				{
					icon: 'mdi-home',
					groups: [
						{
							title: "Development Tiles 2",
							width: 8,
							height: 9,
							tiles: [
								{
									position: [ 0, 0, ],
									name: "Lightswitch",
									type: "BUTTON",
									width: 1,
									height: 1,
									id: "56b58d98-3604-42e7-9945-8575d88fd8f3", // Id of your device. See Homey developper tool
									capabilityID: "onoff", // See Homey developper tool
									icon: "mdi-gate", //Need to be define even you will use icons option. See https://pictogrammers.com/library/mdi/
								},
							],
						},
					],
				},
			],
		},
	],
};

export default developmentConfig;
