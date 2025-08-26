import { TileFactory } from '@/tiles/TileFactory';
import { AppConfig } from './src/types';

export const appConfig: AppConfig = {
	settings: {
		tileSize: 80,
		tileMargin: 10,
		iconSize: 40,
		orientation: "landscape",
		customText: "TileDash Development",
		dateLocal: "en-EN",
		numOfLandImg: 4,
		numOfPortImg: 5,
		backgroundImage: "./img/hexagone.jpg",
		softMobileHeader: true,
	},

	/**
	 * Dashboard configuration
	 * id: must be unique and is loaded by supplying id in the URL "http://<your-url>?id=1"
	 * title: optional title for the dashboard, could be a room or home
	 * pages: defines all pages for a given dashboard
	 */
	dashboards: [
		{
			id: '1',
			title: 'Main Dashboard',
			pages: [
				{
					icon: 'mdi-home',
					width: 10,
					height: 10,
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
						TileFactory.createConfig( 'APPLIANCES', {
							position: [ 0, 2, ],
							width: 6,
							height: 2,
							name: "Kontor Appliances",
							devices: [
								{ deviceId: '56b58d98-3604-42e7-9945-8575d88fd8f3', capabilityId: 'onoff', alias: 'taklys_kontor', /* title, icon, minValue, maxValue (default 0/1), step(default) */},
								{ deviceId: '15575f05-1d5c-4c37-95d6-2fce7f4712b1', capabilityId: 'onoff', alias: 'taklys_loft', /* title, icon, minValue, maxValue (default 0/1), step(default) */},
								{ deviceId: '15575f05-1d5c-4c37-95d6-2fce7f4712b1', capabilityId: 'dim', alias: 'taklys_loft', /* title, icon, minValue, maxValue (default 0/1), step(default) */},
								{ deviceId: '56b58d98-3604-42e7-9945-8575d88fd8f3', capabilityId: 'dim', alias: 'taklys_kontor_dim', },
								{ deviceId: '20dcccf8-3734-4a67-994b-1f6171af177c', capabilityId: 'dim', alias: 'taklys_bad', },
								{ deviceId: '56b58d98-3604-42e7-9945-8575d88fd8f3', capabilityId: 'dim', alias: 'taklys_kontor_dim', },
								{ deviceId: '20dcccf8-3734-4a67-994b-1f6171af177c', capabilityId: 'dim', alias: 'taklys_bad', },
								{ deviceId: '56b58d98-3604-42e7-9945-8575d88fd8f3', capabilityId: 'dim', alias: 'taklys_kontor_dim', },
								{ deviceId: '20dcccf8-3734-4a67-994b-1f6171af177c', capabilityId: 'dim', alias: 'taklys_bad', },
							],
						} ),
						// TileFactory.createConfig( 'SLIDER', {
						// 	position: [ 0, 3, ],
						// 	id: "56b58d98-3604-42e7-9945-8575d88fd8f3",
						// 	name: "Taklys Kontor",
						// 	orientation: 'horizontal', 
						// 	width: 3,
						// 	height: 1,
						// 	minValue: 0, 
						// 	maxValue: 1,
						// 	step: 0.01,
						// 	capabilityID: "dim",
						// 	icon: "mdi-lightbulb",
						// } ),
						// TileFactory.createConfig( 'SLIDER', {
						// 	position: [ 0, 4, ],
						// 	id: "15575f05-1d5c-4c37-95d6-2fce7f4712b1",
						// 	name: "Taklys Loftstue",
						// 	orientation: 'horizontal',
						// 	width: 4,
						// 	height: 1,
						// 	minValue: 0, 
						// 	maxValue: 1, 
						// 	step: 0.01, 
						// 	capabilityID: "dim",
						// 	icon: "mdi-lightbulb",
						// } ),
						// {
						// 	position: [ 0, 5, ],
						// 	id: "20dcccf8-3734-4a67-994b-1f6171af177c",
						// 	name: "Taklys Bad",
						// 	type: "SLIDER",
						// 	orientation: 'horizontal', 
						// 	width: 4,
						// 	height: 1,
						// 	minValue: 0, 
						// 	maxValue: 1, 
						// 	step: 0.01, 
						// 	capabilityID: "dim",
						// 	icon: "mdi-lightbulb",
						// },
						// {
						// 	position: [ 0, 6, ],
						// 	name: "Baklys TV",
						// 	type: "SLIDER",
						// 	orientation: 'horizontal', 
						// 	width: 4,
						// 	height: 1,
						// 	minValue: 0, 
						// 	maxValue: 1, 
						// 	step: 0.01, 
						// 	id: "850913f1-3f1c-4de4-8ba7-d127b4d7962b",
						// 	capabilityID: "dim",
						// 	icon: "mdi-lightbulb",
						// },
						// {
						// 	position: [ 0, 4, ],
						// 	name: "Bedroom",
						// 	type: "GAUGE",
						// 	width: 2, // need to be at least 2
						// 	height: 2, // need to be at least 2
						// 	id: "e8e90f63-fb14-4e21-9d94-1110cd2b4493",
						// 	capabilityID: "measure_temperature",
						// 	icon: "mdi-thermometer",
						// 	unit: "°C",
						// 	maxValue: 35,
						// 	secondValue:{
						// 		capabilityID: 'measure_humidity',
						// 		icon: 'mdi-water-percent',
						// 		unit: '%',
						// 	},
						// 	stepColor: { // define different colors depending on the values. If set, 'prim' and 'sec' must to be defined
						// 		prim: {
						// 			color: 'cyan', // or #0000ff color, or rgb(120,120,120)
						// 			step: 18, // 0 to 18
						// 		},
						// 		sec: {
						// 			color: 'lime',
						// 			step: 25, // 18 to 25
						// 		},
						// 		third: { //third is optionnal
						// 			color: 'red', // higher than sec step  
						// 		},
						// 	},
						// },
					],
				},
				{
					icon: 'mdi-home',
					
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
		{
			id: '2',
			title: 'Kitchen Dashboard',
			pages: [
				{
					icon: 'mdi-chef-hat',
					width: 6,
					height: 6,
					tiles: [
						{
							position: [ 0, 0, ],
							name: "Kitchen Light",
							type: "SWITCH",
							width: 2,
							height: 1,
							id: "example-kitchen-light-id", // Replace with your actual device ID
							capabilityID: "onoff",
							icon: "mdi-lightbulb",
						},
						{
							position: [ 0, 1, ],
							name: "Kitchen Temperature",
							type: "SENSOR",
							width: 2,
							height: 1,
							id: "example-kitchen-sensor-id", // Replace with your actual device ID
							capabilityID: "measure_temperature",
							icon: "mdi-thermometer",
							unit: "°C",
						},
					],
				},
			],
		},
	],
};

export default appConfig;
