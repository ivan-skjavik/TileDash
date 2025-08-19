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

export interface TileRenderOptions {
  ratio?: number;
  extraID?: string;
  smooth?: boolean;
  smallDevice?: boolean;
  isDarkTheme?: boolean;
  homeyApiService?: any;  // TODO: Add proper HomeyApiService type
}

export interface TileSettings {
  tileSize?: number;
  tileWidth?: number;
  tileHeight?: number;
  tileMargin: number;
  groupMargin: number;
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

export interface DashboardPage {
  icon: string;
  group: Group[];
}

export interface Group {
  title?: string;
  width: number;
  height: number;
  items: Tile[];
}

export type Position = [number, number]; // [x, y] coordinates

export interface BaseTile {
  position: Position;
  name?: string;
  width: number;
  height: number;
  icon?: string;
}

export interface VirtualTile extends BaseTile {
  type: 'VIRTUAL';
}

export interface SwitchTile extends BaseTile {
  type: 'SWITCH';
  id: string;
  capabilityID: string;
  icons?: {
    on: string;
    off: string;
  };
  clickable?: boolean;
  effectOn?: string;
  effectOff?: string;
}

export interface BinarySensorTile extends BaseTile {
  type: 'BINARY_SENSOR';
  id: string;
  capabilityID: string;
  icons?: {
    on: string;
    off: string;
  };
  effectOn?: string;
  effectOff?: string;
}

export interface ButtonTile extends BaseTile {
  type: 'BUTTON';
  id: string;
  capabilityID: string;
  icons?: {
    on: string;
    off: string;
    sensorID?: string;
    capabilityID?: string;
  };
}

export interface SensorTile extends BaseTile {
  type: 'SENSOR';
  id: string;
  capabilityID: string;
  unit: string;
  secondValue?: {
    capabilityID: string;
    icon: string;
    unit: string;
  };
}

export interface SliderTile extends BaseTile {
  type: 'SLIDER';
  id: string;
  capabilityID: string;
  orientation: 'horizontal' | 'vertical';
  minValue: number;
  maxValue: number;
  step: number;
  showValue?: boolean;
  unit?: string;
}

export interface ImageTile extends BaseTile {
  type: 'IMAGE';
  id: string;
  folder?: string;
  staticImage?: string;
  timeScroll?: number;
}

export interface PopupTile extends BaseTile {
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

export interface HeimdallTile extends BaseTile {
  type: 'HEIMDALL';
  id: string;
  capabilityID: string;
  code?: string;
  icons?: {
    armed: string;
    partiallyArmed: string;
    disarmed: string;
  };
}

export interface ShutterTile extends BaseTile {
  type: 'SHUTTER';
  id: string;
  capabilityID: string;
  icons?: {
    up: string;
    idle: string;
    down: string;
  };
}

export interface ThermostatTile extends BaseTile {
  type: 'THERMOSTAT';
  id: string;
  capabilityID: string;
  onOffCapabilityID: string;
  heatingCapabilityID: string;
  step: number;
  iconHeatingOn: string;
  iconHeatingOff: string;
  unit: string;
}

export interface MediaTile extends BaseTile {
  type: 'MEDIA';
  id: string;
  homeyIP?: string;
  accountID?: string;
  minVol: number;
  maxVol: number;
  volStep: number;
  capabilityID: string;
  standbyIcon?: string;
  standbyImage?: string;
}

export interface GaugeTile extends BaseTile {
  type: 'GAUGE';
  id: string;
  capabilityID: string;
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

export interface DoorbirdPopupTile extends BaseTile {
  type: 'DOORBIRD_POPUP';
  id: string;
  capabilityID: string;
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

export interface Flow {
  id: string;
  name: string;
}

export interface DashboardConfig {
  settings: TileSettings;
  dashboard: DashboardPage[];
  flows?: Flow[];
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

// Tile factory types
export interface TileFactory {
  createTile( device: HomeyDevice, item: Tile, options: TileRenderOptions ): HTMLElement;
}

export interface TileRenderer {
  render( device: HomeyDevice, tile: Tile, container: HTMLElement, options: TileRenderOptions ): void;
}
