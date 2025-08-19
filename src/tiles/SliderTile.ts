import { BaseTile } from './BaseTile';
import { HomeyDevice, SliderTile as SliderTileConfig } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class SliderTile extends BaseTile {
  private sliderElement: HTMLInputElement | null = null;
  private valueDisplay: HTMLElement | null = null;
  private sliderConfig: SliderTileConfig;

  constructor(
    tileId: string,
    device: HomeyDevice | null,
    config: SliderTileConfig,
    element: HTMLElement,
    homeyApi: HomeyAPIV3LocalPatched
  ) {
    super(tileId, device, config, element, homeyApi);
    this.sliderConfig = config;
  }

  protected getCapabilityID(): string | undefined {
    return this.sliderConfig.capabilityID;
  }

  render(): void {
    this.element.classList.add('slider-tile');
    this.element.innerHTML = ''; // Clear existing content

    const config = this.sliderConfig;

    // Add icon
    if (config.icon) {
      const iconElement = this.createIcon(config.icon, 24);
      this.element.appendChild(iconElement);
    }

    // Add name
    if (config.name) {
      const nameElement = this.createNameElement(config.name, true);
      this.element.appendChild(nameElement);
    }

    // Add value display and slider
    if (this.device && config.capabilityID) {
      const capability = this.getCapability();
      const currentValue = this.getCapabilityValue() || 0;

      // Create value display
      this.valueDisplay = this.createValueElement(
        this.formatValue(currentValue, capability),
        capability?.units || config.unit || '',
        '12px'
      );
      this.element.appendChild(this.valueDisplay);

      // Create slider
      this.createSlider(capability, currentValue);
    }

    // Setup event listeners
    this.setupEventListeners();

    console.log(`🎛️ Rendered SliderTile: ${this.tileId}`);
  }

  private createSlider(capability: any, currentValue: number): void {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      width: 100%;
      margin: 8px 0;
      padding: 0 8px;
    `;

    this.sliderElement = document.createElement('input');
    this.sliderElement.type = 'range';
    this.sliderElement.min = String(capability?.min || 0);
    this.sliderElement.max = String(capability?.max || 100);
    this.sliderElement.step = String(capability?.step || 1);
    this.sliderElement.value = String(currentValue);

    this.sliderElement.style.cssText = `
      width: 100%;
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: #ddd;
      outline: none;
    `;

    // Add slider event listener
    this.sliderElement.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const newValue = parseFloat(target.value);
      this.handleSliderChange(newValue);
    });

    sliderContainer.appendChild(this.sliderElement);
    this.element.appendChild(sliderContainer);
  }

  private async handleSliderChange(value: number): Promise<void> {
    const capabilityID = this.getCapabilityID();
    if (!this.device || !capabilityID) return;

    try {
      console.log(`🎛️ Slider changed: ${this.device.name} ${capabilityID} = ${value}`);
      
      // Update local display immediately for responsiveness
      this.updateValueDisplay(value);
      
      // Send to Homey
      await this.homeyApi.setCapabilityValue(this.device.id, capabilityID, value);
      
      this.showClickFeedback();
    } catch (error) {
      console.error('Error setting slider value:', error);
      // Revert display on error
      const originalValue = this.getCapabilityValue();
      this.updateValueDisplay(originalValue);
      if (this.sliderElement) {
        this.sliderElement.value = String(originalValue);
      }
    }
  }

  update(newValue: any, capability: string): void {
    const capabilityID = this.getCapabilityID();
    if (capability !== capabilityID) return;

    console.log(`🔄 Updating SliderTile ${this.tileId} with value:`, newValue);

    // Update value display
    this.updateValueDisplay(newValue);

    // Update slider position
    if (this.sliderElement) {
      this.sliderElement.value = String(newValue);
    }
  }

  private updateValueDisplay(value: any): void {
    if (!this.valueDisplay) return;

    const capability = this.getCapability();
    const formattedValue = this.formatValue(value, capability);
    const unit = capability?.units || this.sliderConfig.unit || '';
    
    this.valueDisplay.textContent = `${formattedValue}${unit}`;
  }
}
