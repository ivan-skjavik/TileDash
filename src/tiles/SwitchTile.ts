import { BaseTile } from './BaseTile';
import { HomeyDevice, SwitchTile as SwitchTileConfig } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';

export class SwitchTile extends BaseTile {
  private statusElement: HTMLElement | null = null;
  private switchConfig: SwitchTileConfig;

  constructor(
    tileId: string,
    device: HomeyDevice | null,
    config: SwitchTileConfig,
    element: HTMLElement,
    homeyApi: HomeyAPIV3LocalPatched
  ) {
    super(tileId, device, config, element, homeyApi);
    this.switchConfig = config;
  }

  protected getCapabilityID(): string | undefined {
    return this.switchConfig.capabilityID;
  }

  render(): void {
    this.element.classList.add('switch-tile');
    this.element.innerHTML = ''; // Clear existing content

    const config = this.switchConfig;
    const currentValue = this.getCapabilityValue();
    const isOn = Boolean(currentValue);

    // Add icon
    if (config.icon) {
      const iconElement = this.createIcon(config.icon, 32);
      this.element.appendChild(iconElement);
    }

    // Add name
    if (config.name) {
      const nameElement = this.createNameElement(config.name);
      this.element.appendChild(nameElement);
    }

    // Add status
    this.statusElement = this.createValueElement(
      this.formatValue(currentValue),
      '',
      '14px'
    );
    this.element.appendChild(this.statusElement);

    // Set initial state styling
    this.updateSwitchStyling(isOn);

    // Add click handler
    this.setupClickHandler();

    // Setup event listeners
    this.setupEventListeners();

    console.log(`🔘 Rendered SwitchTile: ${this.tileId}`);
  }

  private setupClickHandler(): void {
    this.element.style.cursor = 'pointer';
    
    this.element.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      await this.handleToggle();
    });
  }

  private async handleToggle(): Promise<void> {
    const capabilityID = this.getCapabilityID();
    if (!this.device || !capabilityID) return;

    const capability = this.getCapability();
    if (!capability || !capability.setable) {
      console.warn(`Capability ${capabilityID} is not setable`);
      return;
    }

    try {
      const currentValue = this.getCapabilityValue();
      const newValue = !Boolean(currentValue);

      console.log(`🔘 Switch toggled: ${this.device.name} ${capabilityID} = ${newValue}`);
      
      // Update local display immediately for responsiveness
      this.updateSwitchDisplay(newValue);
      
      // Send to Homey
      await this.homeyApi.setCapabilityValue(this.device.id, capabilityID, newValue);
      
      this.showClickFeedback();
    } catch (error) {
      console.error('Error toggling switch:', error);
      // Revert display on error
      const originalValue = this.getCapabilityValue();
      this.updateSwitchDisplay(Boolean(originalValue));
    }
  }

  update(newValue: any, capability: string): void {
    const capabilityID = this.getCapabilityID();
    if (capability !== capabilityID) return;

    console.log(`🔄 Updating SwitchTile ${this.tileId} with value:`, newValue);
    this.updateSwitchDisplay(Boolean(newValue));
  }

  private updateSwitchDisplay(isOn: boolean): void {
    // Update status text
    if (this.statusElement) {
      this.statusElement.textContent = this.formatValue(isOn);
    }

    // Update styling
    this.updateSwitchStyling(isOn);
  }

  private updateSwitchStyling(isOn: boolean): void {
    if (isOn) {
      this.element.style.backgroundColor = 'var(--tile-active-background, #4CAF50)';
      this.element.style.color = 'white';
      this.element.style.borderColor = 'var(--tile-active-border, #45a049)';
    } else {
      this.element.style.backgroundColor = 'var(--tile-background, #fff)';
      this.element.style.color = 'var(--text-color, #333)';
      this.element.style.borderColor = 'var(--tile-border, #e0e0e0)';
    }
  }
}
