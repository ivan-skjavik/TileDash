/**
 * Example dashboard configuration with Energy Price tile
 * Add this to your existing dashboard configuration to test the new tile
 */

// Simple example you can add to your dashboard
const energyPriceTileExample = {
	type: 'ENERGY_PRICE',
	position: [ 0, 0, ], // Position on your dashboard grid
	width: 3,           // 3 grid units wide
	height: 2,          // 2 grid units tall
	name: 'Strømpris NO1', // Display name
	priceArea: 'NO1',   // Oslo/Øst-Norge (change to your area)
	refreshInterval: 15, // Refresh every 15 minutes
	showCurrentPrice: true, // Show current price in header
	tariffCost: 0,      // Add your tariff cost in øre/kWh if needed
	taxPercentage: 25,  // Norwegian tax percentage
};

// Advanced example with custom styling
const energyPriceTileAdvanced = {
	type: 'ENERGY_PRICE',
	position: [ 3, 0, ],
	width: 3,
	height: 2,
	name: 'Total Strømpris',
	icon: 'mdi-flash',
	priceArea: 'NO5', // Bergen/Vest-Norge
	tariffCost: 35.5, // Example tariff cost
	taxPercentage: 25,
	refreshInterval: 20,
	showCurrentPrice: true,
	graphOptions: {
		lineColor: '#2196F3',
		fillColor: '#2196F3', 
		currentHourColor: '#FF9800',
	},
};

export { energyPriceTileExample, energyPriceTileAdvanced, };
