// TypeScript type definitions for TileDash

// Enhanced device and capability types
export interface HomeyDevice {
  id: string;
  name: string;
  iconObj?: {
    id: string;
    url: string;
  };
  ui?: {
    components?: Array<{
      id: string;
      capabilities: string[];
    }>;
  };
  capabilitiesObj: Record<string, HomeyCapability>;
  capabilities: string[];
  class: string;
  energy?: any;
  settings?: any;
  store?: any;
  flags?: string[];
  driverUri?: string;
  zone?: string;
  driverId?: string;
  ownerName?: string;
  makeCapabilityInstance: ( capabilityID: string, callback: ( newValue: any ) => void ) => void;
  setCapabilityValue: ( capabilityID: string, value: any ) => Promise<void>;
}

export interface HomeyCapability {
  value: any;
  type: string;
  title: string;
  desc?: string;
  units?: string;
  decimals?: number;
  min?: number;
  max?: number;
  step?: number;
  chartType?: string;
  getable: boolean;
  setable: boolean;
  insights?: boolean;
  insightsTitleTrue?: string;
  insightsTitleFalse?: string;
  icon?: string;
  options?: any;
}

export interface AppConfig {
  settings: AppSettings;
  dashboards: DashboardConfig[];
}

export interface AppSettings {
  tileSize?: number;
  tileWidth?: number;
  tileHeight?: number;
  tileMargin: number;
  orientation: 'landscape' | 'portrait';
  customText?: string;
  dateLocal: string;
  iconSize: number;
  numOfLandImg?: number;
  numOfPortImg?: number;
  backgroundImage?: string;
  headerSensor?: HeaderSensor;
  screenSaver?: ScreenSaver;
  softMobileHeader?: boolean;
  token?: string;
}

export interface DashboardConfig {
  id: string;
  title?: string;
  pages: DashboardPage[];
  flows?: Flow[];
}

export interface DashboardPage {
  title?: string;
  icon: string;
  width: number;
  height: number;
  tiles: Tile[];
}

export interface HeaderSensor {
  name?: string;
  id: string;
  capabilityID: string;
  unit: string;
}

export interface ScreenSaver {
  image: string;
  timeout: number;
  exitMode?: 'mouse_move' | 'key_press' | 'slide_up';
  slideDistance?: number;
  enableOnMobile?: boolean;
}

export type Position = [number, number]; // [x, y] coordinates

// Base tile interface with common properties
export interface BaseTileData {
  /** Position of the tile on the dashboard group given as [x, y] coordinates */
  position: Position;

  /** Name of the tile */
  name?: string;

  /** Width of the tile in grid units */
  width: number;

  /** Height of the tile in grid units */
  height: number;

  /** Icon for the tile, check https://pictogrammers.com/library/mdi/ for available icons, prefix with 'mdi-' */
  icon?: string;
}

// Device-capability mapping for multi-device support
export interface DeviceCapabilityMapping {
  /** Device ID */
  deviceId: string;

  /** Single capability ID */
  capabilityId?: string;

  /** Multiple capability IDs for the same device */
  capabilityIds?: string[];

  /** Optional alias for this device in the tile context */
  alias?: string;

  /** Optional device-specific configuration */
  config?: Record<string, any>;
}

// Device-based tiles extend BaseTileData with device properties
export interface DeviceTileData extends BaseTileData {
  /** Single device configuration (backward compatible) */
  id?: string;
  capabilityID?: string;

  /** Multi-device configuration */
  devices?: DeviceCapabilityMapping[];

  /** Control mode for multi-device tiles */
  multiDeviceMode?: 'synchronized' | 'individual' | 'aggregated';
}

export interface VirtualTileConfig extends BaseTileData {
  type: 'VIRTUAL';
}

export interface SwitchTileConfig extends DeviceTileData {
  type: 'SWITCH';
  icons?: {
    on: string;
    off: string;
  };
  clickable?: boolean;
  effectOn?: string;
  effectOff?: string;
}

export interface BinarySensorTileConfig extends DeviceTileData {
  type: 'BINARY_SENSOR';
  icons?: {
    on: string;
    off: string;
  };
  effectOn?: string;
  effectOff?: string;
}

export interface ButtonTileConfig extends DeviceTileData {
  type: 'BUTTON';
  flowID?: string;
  buttonValue?: any;
  icons?: {
    on: string;
    off: string;
    sensorID?: string;
    capabilityID?: string;
  };
}

export interface SensorTileConfig extends DeviceTileData {
  type: 'SENSOR';
  unit: string;
  secondValue?: {
    capabilityID: string;
    icon: string;
    unit: string;
  };
}

export interface SliderTileConfig extends DeviceTileData {
  /** Type of the tile, set to 'SLIDER' for slider functionality */
  type: 'SLIDER';

  /** Orientation of the slider, either 'horizontal' or 'vertical' */
  orientation: 'horizontal' | 'vertical';

  /** 
   * Minimum value of the slider. 
   * For 'dim' type, the minimum value is 0, representing light off.
   */
  minValue: number;

  /** Maximum value of the slider
   * For 'dim' type, the maximum value is 1, representing light 100%.
   */
  maxValue: number;

  /** Step increment for the slider */
  step: number;

  /** Whether to display the current value on the slider */
  showValue?: boolean;

  /** Unit of measurement for the slider value (e.g., '%', '°C') */
  unit?: string;
}

export interface ImageTileConfig extends BaseTileData {
  type: 'IMAGE';
  id: string;
  folder?: string;
  staticImage?: string;
  timeScroll?: number;
}

export interface PopupTileConfig extends BaseTileData {
  type: 'POPUP' | 'VIRTUAL_POPUP';
  id?: string;
  capabilityID?: string;
  popupWidth: number;
  popupHeight: number;
  items: Tile[];
  icons?: {
    on: string;
    off: string;
    effectOn?: string;
    effectOff?: string;
  };
}

export interface HeimdallTileConfig extends DeviceTileData {
  type: 'HEIMDALL';
  code?: string;
  icons?: {
    armed: string;
    partiallyArmed: string;
    disarmed: string;
  };
}

export interface ShutterTileConfig extends DeviceTileData {
  type: 'SHUTTER';
  icons?: {
    up: string;
    idle: string;
    down: string;
  };
}

export interface ThermostatTileConfig extends DeviceTileData {
  type: 'THERMOSTAT';
  onOffCapabilityID: string;
  heatingCapabilityID: string;
  step: number;
  iconHeatingOn: string;
  iconHeatingOff: string;
  unit: string;
}

export interface MediaTileConfig extends DeviceTileData {
  type: 'MEDIA';
  homeyIP?: string;
  accountID?: string;
  minVol: number;
  maxVol: number;
  volStep: number;
  standbyIcon?: string;
  standbyImage?: string;
}

export interface GaugeTileConfig extends DeviceTileData {
  type: 'GAUGE';
  unit: string;
  maxValue: number;
  secondValue?: {
    capabilityID: string;
    icon: string;
    unit: string;
  };
  stepColor?: {
    prim: { color: string; step: number };
    sec: { color: string; step: number };
    third?: { color: string };
  };
}

export interface DoorbirdPopupTileConfig extends DeviceTileData {
  type: 'DOORBIRD_POPUP';
  doorbirdIP: string;
  user: string;
  password: string;
  autoClose: number;
  doorDevice?: {
    id: string;
    capabilityID: string;
  };
  secondDoorDevice?: {
    id: string;
    capabilityID: string;
    icon: string;
  };
  testPopup?: boolean;
}

export interface AppliancesTileConfig extends DeviceTileData {
  type: 'APPLIANCES';
  /** Maximum number of rows to display (1 or 2) */
  maxRows?: 1 | 2;
  /** Show device names below icons */
  showNames?: boolean;
  /** Icon size for appliance items */
  iconSize?: number;
  /** Spacing between appliance items */
  itemSpacing?: number;
  /** Custom icons for specific device types */
  customIcons?: {
    [deviceId: string]: {
      on?: string;
      off?: string;
      dimming?: string;
    };
  };
}

// Norwegian electricity price areas
export type NorwegianPriceArea = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5';

export interface EnergyPriceTileConfig extends BaseTileData {
  type: 'ENERGY_PRICE';
  /** Norwegian price area (NO1-NO5) */
  priceArea: NorwegianPriceArea;
  /** Additional tariff cost in øre/kWh */
  tariffCost?: number;
  /** Tax percentage (default 25%) */
  taxPercentage?: number;
  /** Refresh interval in minutes */
  refreshInterval?: number;
  /** Show current price as separate display */
  showCurrentPrice?: boolean;
  /** Graph styling options */
  graphOptions?: {
    /** Line color for the price chart */
    lineColor?: string;
    /** Fill color under the line */
    fillColor?: string;
    /** Color for current hour highlight */
    currentHourColor?: string;
    /** Color zones for price levels */
    priceZones?: {
      cheap: { color: string; threshold: number };
      normal: { color: string; threshold: number };
      expensive: { color: string };
    };
  };
}

export interface ImageCarouselTileConfig extends BaseTileData {
  type: 'IMAGE_CAROUSEL';
  /** Array of image URLs or paths to display */
  images: string[];
  /** Interval in seconds to automatically advance to next image (default: 5) */
  interval?: number;
  /** Whether to auto-advance images (default: true) */
  autoAdvance?: boolean;
  /** How the image should be fitted within the tile (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  /** Show navigation dots indicator */
  showDots?: boolean;
  /** Show current image index (e.g., "2/5") */
  showCounter?: boolean;
}

export interface CameraStream {
  /** Camera identifier/title */
  title: string;
  /** RTSP stream URL */
  rtspUrl: string;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
}

export interface LiveCameraFeedTileConfig extends BaseTileData {
  type: 'LIVE_CAMERA_FEED';
  /** Array of camera streams to display */
  cameras: CameraStream[];
  /** Show camera selection buttons in header (default: true) */
  showCameraButtons?: boolean;
  /** Include "None" button to disable streaming (default: true) */
  showNoneButton?: boolean;
  /** Auto-start with first camera (default: true) */
  autoStart?: boolean;
  /** How the video should be fitted within the tile (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Stream quality preset for RTSP conversion (default: 'medium') */
  quality?: 'ultralow' | 'verylow' | 'low' | 'medium' | 'high' | 'ultra';
  /** Enable low-latency mode optimizations (default: true) */
  lowLatencyMode?: boolean;
  /** Skip audio stream for better performance (default: true) */
  skipAudio?: boolean;
  /** Keyframe interval in frames (default: fps/2 for 0.5s intervals) */
  keyframeInterval?: number;
  /** Output format for streaming (default: 'fmp4' for better performance) */
  outputFormat?: 'mjpeg' | 'fmp4';
}

export type Tile = 
  | VirtualTileConfig 
  | SwitchTileConfig 
  | BinarySensorTileConfig 
  | ButtonTileConfig 
  | SensorTileConfig 
  | SliderTileConfig 
  | ImageTileConfig 
  | PopupTileConfig 
  | HeimdallTileConfig 
  | ShutterTileConfig 
  | ThermostatTileConfig 
  | MediaTileConfig 
  | GaugeTileConfig 
  | DoorbirdPopupTileConfig
  | AppliancesTileConfig
  | EnergyPriceTileConfig
  | ImageCarouselTileConfig
  | LiveCameraFeedTileConfig;

// Type utilities for tile discrimination and inference
export type TileType = Tile['type'];

/**
 * Get tile config type based on tile type string
 * Usage: TileConfigByType<'SLIDER'> => SliderTile
 */
export type TileConfigByType<T extends TileType> = Extract<Tile, { type: T }>;

/**
 * Type guard to check if a tile is of a specific type
 * Usage: if (isTileOfType(config, 'SLIDER')) { // config is now SliderTile }
 */
export function isTileOfType<T extends TileType>( 
	tile: Tile,
	type: T
): tile is TileConfigByType<T> {
	return tile.type === type;
}

/**
 * Helper function to create type-safe tile configs
 * Usage: const sliderTile = createTileConfig('SLIDER', { ... })
 */
export function createTileConfig<T extends TileType>( 
	type: T,
	config: Omit<TileConfigByType<T>, 'type'>
): TileConfigByType<T> {
	return { type, ...config, } as TileConfigByType<T>;
}

/**
 * Check if tile is a device-based tile (has id and capabilityID)
 */
export function isDeviceTile( tile: Tile ): tile is Tile & DeviceTileData {
	return 'id' in tile || 'devices' in tile;
}

/**
 * Check if tile is virtual (doesn't connect to a device)
 */
export function isVirtualTile( tile: Tile ): tile is VirtualTileConfig | ImageTileConfig | ImageCarouselTileConfig | LiveCameraFeedTileConfig {
	return tile.type === 'VIRTUAL' || tile.type === 'IMAGE' || tile.type === 'IMAGE_CAROUSEL' || tile.type === 'LIVE_CAMERA_FEED';
}

/**
 * Check if tile uses multi-device configuration
 */
export function isMultiDeviceTile( tile: Tile ): tile is Tile & { devices: DeviceCapabilityMapping[] } {
	return 'devices' in tile && Array.isArray( tile.devices ) && tile.devices.length > 0;
}

/**
 * Check if tile uses single device configuration (legacy)
 */
export function isSingleDeviceTile( tile: Tile ): tile is Tile & { id: string; capabilityID: string } {
	return 'id' in tile && 'capabilityID' in tile && typeof tile.id === 'string';
}

/**
 * Get all device IDs from a tile configuration
 */
export function getTileDeviceIds( tile: Tile ): string[] {
	const deviceIds: string[] = [];
	
	// Legacy single device
	if ( isSingleDeviceTile( tile ) ) {
		deviceIds.push( tile.id );
	}
	
	// Multi-device configuration
	if ( isMultiDeviceTile( tile ) ) {
		tile.devices.forEach( device => deviceIds.push( device.deviceId ) );
	}
	
	return deviceIds;
}

/**
 * Get all device-capability combinations from a tile
 */
export function getTileDeviceCapabilities( tile: Tile ): Array<{ deviceId: string; capabilityId: string; alias?: string }> {
	const combinations: Array<{ deviceId: string; capabilityId: string; alias?: string }> = [];
	
	// Legacy single device
	if ( isSingleDeviceTile( tile ) ) {
		combinations.push( { deviceId: tile.id, capabilityId: tile.capabilityID, } );
	}
	
	// Multi-device configuration
	if ( isMultiDeviceTile( tile ) ) {
		tile.devices.forEach( device => {
			if ( device.capabilityId ) {
				combinations.push( { 
					deviceId: device.deviceId, 
					capabilityId: device.capabilityId,
					alias: device.alias,
				} );
			}
			
			if ( device.capabilityIds ) {
				device.capabilityIds.forEach( capabilityId => {
					combinations.push( { 
						deviceId: device.deviceId, 
						capabilityId,
						alias: device.alias,
					} );
				} );
			}
		} );
	}
	
	return combinations;
}

export interface Flow {
  id: string;
  name: string;
}

export interface DeviceLog {
  id: number;
  device_id: string;
  device_name?: string;
  capability_id: string;
  old_value?: string;
  new_value: string;
  timestamp: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardConfigRecord {
  id: number;
  name: string;
  config: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Event system types
export interface DeviceStateChangeEvent extends CustomEvent {
  detail: {
    deviceId: string;
    capabilityId: string;
    value: any;
    oldValue: any;
  };
}