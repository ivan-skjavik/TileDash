/**
 * Energy Price Tile Example Configuration
 * 
 * This example shows how to configure an Energy Price tile that fetches
 * Norwegian electricity prices from hvakosterstrommen.no API.
 */

import { TileFactory } from '../services/TileFactory';
import type { EnergyPriceTileConfig } from '../types';

// Example 1: Basic Energy Price Tile for Oslo (NO1)
const energyPriceBasic: EnergyPriceTileConfig = {
	type: 'ENERGY_PRICE',
	position: [ 0, 0, ],
	width: 3,
	height: 2,
	name: 'Strømpris Oslo',
	priceArea: 'NO1',
	showCurrentPrice: true,
	refreshInterval: 15, // Refresh every 15 minutes
};

// Example 2: Advanced Energy Price Tile with custom tariff and tax
const energyPriceAdvanced: EnergyPriceTileConfig = {
	type: 'ENERGY_PRICE',
	position: [ 3, 0, ],
	width: 4,
	height: 2,
	name: 'Strømpris Bergen (inkl. avgifter)',
	priceArea: 'NO5',
	tariffCost: 35.5, // øre/kWh additional cost
	taxPercentage: 25, // 25% tax
	refreshInterval: 30,
	showCurrentPrice: true,
	icon: 'mdi-flash',
	graphOptions: {
		lineColor: '#2196F3',
		fillColor: '#2196F3',
		currentHourColor: '#FF9800',
		priceZones: {
			cheap: { color: '#4CAF50', threshold: 50, },
			normal: { color: '#FF9800', threshold: 100, },
			expensive: { color: '#F44336', },
		},
	},
};

// Example 3: Compact Energy Price Tile
const energyPriceCompact: EnergyPriceTileConfig = {
	type: 'ENERGY_PRICE',
	position: [ 0, 2, ],
	width: 2,
	height: 1,
	name: 'Strøm',
	priceArea: 'NO3',
	showCurrentPrice: false, // Hide current price for smaller tile
	refreshInterval: 10,
};

// Example configurations for all Norwegian price areas
const energyPriceConfigs: Record<string, EnergyPriceTileConfig> = {
	// NO1 = Oslo / Øst-Norge
	oslo: {
		type: 'ENERGY_PRICE',
		position: [ 0, 0, ],
		width: 3,
		height: 2,
		name: 'Oslo/Øst-Norge',
		priceArea: 'NO1',
		refreshInterval: 15,
		showCurrentPrice: true,
	},
	
	// NO2 = Kristiansand / Sør-Norge  
	kristiansand: {
		type: 'ENERGY_PRICE',
		position: [ 3, 0, ],
		width: 3,
		height: 2,
		name: 'Kristiansand/Sør-Norge',
		priceArea: 'NO2',
		refreshInterval: 15,
		showCurrentPrice: true,
	},
	
	// NO3 = Trondheim / Midt-Norge
	trondheim: {
		type: 'ENERGY_PRICE',
		position: [ 6, 0, ],
		width: 3,
		height: 2,
		name: 'Trondheim/Midt-Norge',
		priceArea: 'NO3',
		refreshInterval: 15,
		showCurrentPrice: true,
	},
	
	// NO4 = Tromsø / Nord-Norge
	tromso: {
		type: 'ENERGY_PRICE',
		position: [ 0, 2, ],
		width: 3,
		height: 2,
		name: 'Tromsø/Nord-Norge',
		priceArea: 'NO4',
		refreshInterval: 15,
		showCurrentPrice: true,
	},
	
	// NO5 = Bergen / Vest-Norge
	bergen: {
		type: 'ENERGY_PRICE',
		position: [ 3, 2, ],
		width: 3,
		height: 2,
		name: 'Bergen/Vest-Norge',
		priceArea: 'NO5',
		refreshInterval: 15,
		showCurrentPrice: true,
	},
};

// Example: Creating tiles using TileFactory
export function createEnergyPriceTiles() {
	// Type-safe creation with defaults
	const basicTile = TileFactory.createConfigWithDefaults( 'ENERGY_PRICE', {
		position: [ 0, 0, ],
		name: 'Strømpris',
		priceArea: 'NO1',
	} );

	// Validation example
	const validation = TileFactory.validateConfig( energyPriceAdvanced );
	if ( !validation.isValid ) {
		console.error( 'Invalid energy price tile config:', validation.errors );
	}

	return {
		basic: energyPriceBasic,
		advanced: energyPriceAdvanced,
		compact: energyPriceCompact,
		allAreas: energyPriceConfigs,
		generated: basicTile,
	};
}

// Usage example for dashboard configuration
export const exampleDashboardWithEnergyPrice = {
	id: 'energy-dashboard',
	title: 'Energy Price Dashboard', 
	pages: [ {
		title: 'Strømpriser',
		icon: 'mdi-flash',
		width: 9,
		height: 5,
		tiles: [
			energyPriceBasic,
			energyPriceAdvanced,
			energyPriceCompact,
		],
	}, ],
};

export {
	energyPriceBasic,
	energyPriceAdvanced,
	energyPriceCompact,
	energyPriceConfigs,
};
