// TypeScript type definitions for TileDash
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

export type Tile = VirtualTile | SwitchTile | SensorTile | SliderTile | ImageTile | PopupTile;

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
