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

// Device-based tiles extend BaseTileData with device properties
export interface DeviceTileData extends BaseTileData {
  /** Unique identifier for the device.
   *  Check Homey developer tool for device ID (https://tools.developer.homey.app/tools/devices) */
  id: string;

  /** Capability to monitor/control.
   *  Check Homey developer tool for available capabilities (https://tools.developer.homey.app/tools/devices) */
  capabilityID: string;
}

export interface VirtualTile extends BaseTileData {
  type: 'VIRTUAL';
}

export interface SwitchTile extends DeviceTileData {
  type: 'SWITCH';
  icons?: {
    on: string;
    off: string;
  };
  clickable?: boolean;
  effectOn?: string;
  effectOff?: string;
}

export interface BinarySensorTile extends DeviceTileData {
  type: 'BINARY_SENSOR';
  icons?: {
    on: string;
    off: string;
  };
  effectOn?: string;
  effectOff?: string;
}

export interface ButtonTile extends BaseTileData {
  type: 'BUTTON';
  id: string;
  capabilityID?: string;
  flowID?: string;
  buttonValue?: any;
  icons?: {
    on: string;
    off: string;
    sensorID?: string;
    capabilityID?: string;
  };
}

export interface SensorTile extends DeviceTileData {
  type: 'SENSOR';
  unit: string;
  secondValue?: {
    capabilityID: string;
    icon: string;
    unit: string;
  };
}

export interface SliderTile extends DeviceTileData {
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

export interface ImageTile extends BaseTileData {
  type: 'IMAGE';
  id: string;
  folder?: string;
  staticImage?: string;
  timeScroll?: number;
}

export interface PopupTile extends BaseTileData {
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

export interface HeimdallTile extends DeviceTileData {
  type: 'HEIMDALL';
  code?: string;
  icons?: {
    armed: string;
    partiallyArmed: string;
    disarmed: string;
  };
}

export interface ShutterTile extends DeviceTileData {
  type: 'SHUTTER';
  icons?: {
    up: string;
    idle: string;
    down: string;
  };
}

export interface ThermostatTile extends DeviceTileData {
  type: 'THERMOSTAT';
  onOffCapabilityID: string;
  heatingCapabilityID: string;
  step: number;
  iconHeatingOn: string;
  iconHeatingOff: string;
  unit: string;
}

export interface MediaTile extends DeviceTileData {
  type: 'MEDIA';
  homeyIP?: string;
  accountID?: string;
  minVol: number;
  maxVol: number;
  volStep: number;
  standbyIcon?: string;
  standbyImage?: string;
}

export interface GaugeTile extends DeviceTileData {
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

export interface DoorbirdPopupTile extends DeviceTileData {
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

export type Tile = 
  | VirtualTile 
  | SwitchTile 
  | BinarySensorTile 
  | ButtonTile 
  | SensorTile 
  | SliderTile 
  | ImageTile 
  | PopupTile 
  | HeimdallTile 
  | ShutterTile 
  | ThermostatTile 
  | MediaTile 
  | GaugeTile 
  | DoorbirdPopupTile;

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
	return 'id' in tile && 'capabilityID' in tile;
}

/**
 * Check if tile is virtual (doesn't connect to a device)
 */
export function isVirtualTile( tile: Tile ): tile is VirtualTile | ImageTile {
	return tile.type === 'VIRTUAL' || tile.type === 'IMAGE';
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