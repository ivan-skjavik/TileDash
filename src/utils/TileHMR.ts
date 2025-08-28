/**
 * Generic Tile Hot Module Reload utilities
 * Works with Vite's HMR system to enable hot swapping of tile instances
 */

import { BaseTile } from '../tiles/BaseTile';

/**
 * Generic function to swap tile instances when a tile class is updated
 * @param TileClass - The updated tile class constructor
 * @param tileTypeName - Display name for the tile type (for logging)
 * @param instanceCheck - Function to check if an instance should be swapped
 */
export function swapTileInstances<T extends BaseTile>(
	TileClass: new ( ...args: any[] ) => T,
	tileTypeName: string,
	instanceCheck: ( instance: BaseTile ) => instance is T
) {
	const tileRenderer = ( window as any ).TileDashApp?.tileRenderer;
	if ( !tileRenderer ) {
		console.warn( 'TileRenderer not available for HMR' );
		return;
	}

	// Access the tiles map through the public getter
	const tilesMap = tileRenderer.tilesMap as Map<string, BaseTile>;
	const instancesToSwap: Array<{ id: string; oldInstance: T }> = [];

	// Find all instances of the specified tile type
	tilesMap.forEach( ( instance, id ) => {
		if ( instanceCheck( instance ) ) {
			instancesToSwap.push( { id, oldInstance: instance, } );
		}
	} );

	console.log( `🔄 Found ${instancesToSwap.length} ${tileTypeName} instances to swap` );

	instancesToSwap.forEach( ( { id, oldInstance, } ) => {
		try {
			// Get instance data using the public getters we added to BaseTile
			const element = oldInstance.tileElement;
			const config = oldInstance.tileConfig;
			const devices = oldInstance.tileDevices;
			const homeyApi = oldInstance.api;

			// Clean up old instance
			oldInstance.cleanup();

			// Create new instance with updated class
			const newInstance = new TileClass( id, devices, config as any, element, homeyApi );

			// Update registry
			tilesMap.set( id, newInstance );

			// Render new instance
			newInstance.render();

			console.log( `✅ Successfully swapped ${tileTypeName} instance: ${id}` );
		} catch ( error ) {
			console.error( `❌ Failed to swap ${tileTypeName} instance ${id}:`, error );
		}
	} );
}

/**
 * Creates HMR acceptance callback for a tile class
 * @param TileClass - The tile class constructor
 * @param tileTypeName - Display name for the tile type
 * @param instanceCheck - Function to check if an instance should be swapped
 * @returns HMR callback function
 */
export function createTileHMR<T extends BaseTile>(
	TileClass: new ( ...args: any[] ) => T,
	tileTypeName: string,
	instanceCheck: ( instance: BaseTile ) => instance is T
) {
	return ( newModule?: any ) => {
		const NewTileClass = newModule?.[TileClass.name];
		if ( NewTileClass ) {
			console.log( `🔥 ${tileTypeName} class updated, swapping instances...` );
			swapTileInstances( NewTileClass, tileTypeName, instanceCheck );
		}
	};
}

// Specific helper functions for common tile types
// export const EnergyPriceTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'EnergyPriceTile',
// 		( instance ): instance is any => instance.constructor.name === 'EnergyPriceTile'
// 	),
// };

// export const SliderTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'SliderTile', 
// 		( instance ): instance is any => instance.constructor.name === 'SliderTile'
// 	),
// };

// export const SwitchTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'SwitchTile',
// 		( instance ): instance is any => instance.constructor.name === 'SwitchTile'
// 	),
// };

// export const SensorTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'SensorTile',
// 		( instance ): instance is any => instance.constructor.name === 'SensorTile'
// 	),
// };

// export const ButtonTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'ButtonTile',
// 		( instance ): instance is any => instance.constructor.name === 'ButtonTile'
// 	),
// };

// export const AppliancesTileHMR = {
// 	create: ( TileClass: any ) => createTileHMR(
// 		TileClass,
// 		'AppliancesTile',
// 		( instance ): instance is any => instance.constructor.name === 'AppliancesTile'
// 	),
// };

export const TileHMRHelper = {
	create: ( TileClass: any, tileTypeName: string ) => createTileHMR(
		TileClass,
		tileTypeName,
		( instance ): instance is any => instance.constructor.name === tileTypeName
	),
}
