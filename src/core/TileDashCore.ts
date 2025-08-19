import { DashboardConfig, HomeyDevice, TileRenderOptions } from '../types';
import { homeyApi } from '../services/HomeyApiService';
import { TileFactory } from '../tiles/TileFactory';

export class TileDashCore {
  private config: DashboardConfig | null = null;
  private devices: Map<string, HomeyDevice> = new Map();
  private tileFactory: TileFactory;
  private currentPage = 0;
  private screenSaverTimer: number | null = null;
  private timeUpdateInterval: number | null = null;

  // DOM elements
  private dashboardContainer!: HTMLElement;
  private dashboardHeader!: HTMLElement;
  private headerLeft!: HTMLElement;
  private headerValue!: HTMLElement;
  private currentTime!: HTMLElement;
  private currentDate!: HTMLElement;
  private customText!: HTMLElement;
  private screenSaver!: HTMLElement;

  constructor( config: DashboardConfig ) {
    this.config = config;
    this.tileFactory = new TileFactory();
    
    // Initialize DOM elements
    this.initializeDOM();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log( '🎛️ TileDash Core initialized' );
  }

  private initializeDOM(): void {
    // Get DOM elements with null checks
    this.dashboardContainer = document.getElementById( 'dashboardContainer' )!;
    this.dashboardHeader = document.getElementById( 'dashboardHeader' )!;
    this.headerLeft = document.getElementById( 'headerLeft' )!;
    this.headerValue = document.getElementById( 'headerValue' )!;
    this.currentTime = document.getElementById( 'currentTime' )!;
    this.currentDate = document.getElementById( 'currentDate' )!;
    this.customText = document.getElementById( 'customText' )!;
    this.screenSaver = document.getElementById( 'screenSaver' )!;

    if ( !this.dashboardContainer ) {
      throw new Error( 'Required DOM elements not found' );
    }
  }

  async initialize(): Promise<void> {
    try {
      if ( !this.config ) {
        throw new Error( 'No configuration provided' );
      }

      // Apply CSS custom properties from settings
      this.applyCSSVariables();

      // Initialize Homey API
      if ( this.config.settings.token ) {
        const connected = await homeyApi.initialize( this.config.settings.token );
        if ( connected ) {
          this.devices = await homeyApi.loadDevices();
          homeyApi.setupDeviceListeners();
        }
      }

      // Set up UI components
      this.setupHeader();
      this.setupScreenSaver();
      this.setupTimeUpdate();
      
      // Render dashboard
      await this.renderDashboard();
      
      // Set up page navigation if multiple pages
      this.setupPageNavigation();

      console.log( '✅ TileDash Core fully initialized' );
    } catch ( error ) {
      console.error( '❌ Failed to initialize TileDash Core:', error );
      throw error;
    }
  }

  private applyCSSVariables(): void {
    const settings = this.config!.settings;
    const root = document.documentElement;
    
    root.style.setProperty( '--tile-size', `${settings.tileSize || 80}px` );
    root.style.setProperty( '--tile-margin', `${settings.tileMargin}px` );
    root.style.setProperty( '--group-margin', `${settings.groupMargin}px` );
    root.style.setProperty( '--icon-size', `${settings.iconSize}px` );
    
    if ( settings.backgroundImage ) {
      root.style.setProperty( '--background-image', `url(${settings.backgroundImage})` );
    }
  }

  private setupHeader(): void {
    const settings = this.config!.settings;
    
    // Set custom text
    if ( settings.customText ) {
      this.customText.textContent = settings.customText;
      this.customText.style.display = 'block';
    }

    // Set up header sensor if configured
    if ( settings.headerSensor ) {
      this.setupHeaderSensor( settings.headerSensor );
    }

    // Handle soft mobile header
    if ( settings.softMobileHeader && this.isMobileView() ) {
      this.dashboardHeader.style.display = 'none';
    }
  }

  private setupHeaderSensor( headerSensor: any ): void {
    const device = this.devices.get( headerSensor.id );
    if ( device && device.capabilitiesObj[headerSensor.capabilityID] ) {
      const capability = device.capabilitiesObj[headerSensor.capabilityID];
      const value = capability.value;
      
      this.headerValue.innerHTML = `
        ${headerSensor.name ? `${headerSensor.name}: ` : ''}
        ${value}${headerSensor.unit || ''}
      `;
      this.headerValue.style.display = 'block';

      // Listen for updates
      homeyApi.addDeviceListener( headerSensor.id, headerSensor.capabilityID, ( newValue: any ) => {
        this.headerValue.innerHTML = `
          ${headerSensor.name ? `${headerSensor.name}: ` : ''}
          ${newValue}${headerSensor.unit || ''}
        `;
      } );
    }
  }

  private setupScreenSaver(): void {
    if ( !this.config!.settings.screenSaver ) return;

    const screenSaverConfig = this.config!.settings.screenSaver;
    const timeout = screenSaverConfig.timeout * 1000;

    const resetTimer = () => {
      if ( this.screenSaverTimer ) {
        clearTimeout( this.screenSaverTimer );
      }
      
      this.screenSaverTimer = window.setTimeout( () => {
        this.showScreenSaver();
      }, timeout );
    };

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach( event => {
      document.addEventListener( event, resetTimer, true );
    } );

    resetTimer();
  }

  private showScreenSaver(): void {
    if ( !this.config!.settings.screenSaver ) return;

    const screenSaverConfig = this.config!.settings.screenSaver;
    const img = this.screenSaver.querySelector( 'img' ) as HTMLImageElement;
    
    if ( img ) {
      img.src = screenSaverConfig.image;
      this.screenSaver.style.display = 'flex';
    }

    // Set up exit mechanism
    const exitMode = screenSaverConfig.exitMode || 'mouse_move';
    
    if ( exitMode === 'slide_up' && screenSaverConfig.slideDistance ) {
      this.setupSlideExit( screenSaverConfig.slideDistance );
    } else {
      this.setupStandardExit();
    }
  }

  private setupSlideExit( slideDistance: number ): void {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = ( e: TouchEvent ) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = ( e: TouchEvent ) => {
      currentY = e.touches[0].clientY;
      const diffY = startY - currentY;
      
      if ( diffY > slideDistance ) {
        this.hideScreenSaver();
      }
    };

    this.screenSaver.addEventListener( 'touchstart', handleTouchStart );
    this.screenSaver.addEventListener( 'touchmove', handleTouchMove );
  }

  private setupStandardExit(): void {
    const hideScreenSaver = () => this.hideScreenSaver();
    
    document.addEventListener( 'mousemove', hideScreenSaver, { once: true } );
    document.addEventListener( 'keypress', hideScreenSaver, { once: true } );
    document.addEventListener( 'click', hideScreenSaver, { once: true } );
  }

  private hideScreenSaver(): void {
    this.screenSaver.style.display = 'none';
    
    // Clean up event listeners
    const newScreenSaver = this.screenSaver.cloneNode( true ) as HTMLElement;
    this.screenSaver.parentNode?.replaceChild( newScreenSaver, this.screenSaver );
    this.screenSaver = newScreenSaver;
  }

  private setupTimeUpdate(): void {
    if ( !this.currentTime || !this.currentDate ) return;

    const updateTime = () => {
      const now = new Date();
      const locale = this.config!.settings.dateLocal || 'en-EN';
      
      this.currentTime.textContent = now.toLocaleTimeString( locale, {
        hour: '2-digit',
        minute: '2-digit'
      } );
      
      this.currentDate.textContent = now.toLocaleDateString( locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      } );
    };

    updateTime();
    this.timeUpdateInterval = window.setInterval( updateTime, 60000 ); // Update every minute
    
    // Show time elements
    this.headerLeft.style.display = 'block';
  }

  private async renderDashboard(): Promise<void> {
    if ( !this.config?.dashboard || this.config.dashboard.length === 0 ) {
      console.warn( '⚠️ No dashboard pages to render' );
      return;
    }

    // Clear existing content
    this.dashboardContainer.innerHTML = '';

    // Render current page
    await this.renderPage( this.currentPage );
  }

  private async renderPage( pageIndex: number ): Promise<void> {
    if ( !this.config?.dashboard || pageIndex >= this.config.dashboard.length ) {
      console.warn( `⚠️ Page ${pageIndex} not found` );
      return;
    }

    const page = this.config.dashboard[pageIndex];
    this.dashboardContainer.innerHTML = '';

    // Calculate render options
    const options: TileRenderOptions = {
      ratio: this.calculateRatio(),
      smooth: this.isThemeSmooth()
    };

    // Render each group
    for ( const group of page.group ) {
      await this.renderGroup( group, options );
    }

    console.log( `📄 Rendered page ${pageIndex}` );
  }

  private async renderGroup( group: any, options: TileRenderOptions ): Promise<void> {
    const groupContainer = document.createElement( 'div' );
    groupContainer.classList.add( 'group' );
    groupContainer.style.cssText = `
      width: calc(var(--tile-size) * ${group.width} + var(--tile-margin) * ${group.width - 1});
      height: calc(var(--tile-size) * ${group.height} + var(--tile-margin) * ${group.height - 1});
      display: grid;
      grid-template-columns: repeat(${group.width}, var(--tile-size));
      grid-template-rows: repeat(${group.height}, var(--tile-size));
      gap: var(--tile-margin);
      margin: var(--group-margin);
    `;

    // Add group title if present
    if ( group.title ) {
      const titleElement = document.createElement( 'h3' );
      titleElement.textContent = group.title;
      titleElement.classList.add( 'group-title' );
      groupContainer.appendChild( titleElement );
    }

    // Render tiles
    for ( const tile of group.items ) {
      const device = tile.id ? this.devices.get( tile.id ) || null : null;
      const tileElement = this.tileFactory.createTile( device, tile, options );
      
      // Position the tile
      tileElement.style.cssText += `
        grid-column: ${tile.position[0] + 1} / span ${tile.width};
        grid-row: ${tile.position[1] + 1} / span ${tile.height};
      `;
      
      groupContainer.appendChild( tileElement );
    }

    this.dashboardContainer.appendChild( groupContainer );
  }

  private setupPageNavigation(): void {
    if ( !this.config?.dashboard || this.config.dashboard.length <= 1 ) return;

    // Create page navigation
    const pageNav = document.createElement( 'div' );
    pageNav.classList.add( 'page-navigation' );
    pageNav.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    this.config.dashboard.forEach( ( page, index ) => {
      const pageButton = document.createElement( 'button' );
      pageButton.classList.add( 'page-button' );
      pageButton.innerHTML = `<i class="mdi ${page.icon}"></i>`;
      pageButton.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 2px solid #ccc;
        background: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      if ( index === this.currentPage ) {
        pageButton.style.background = 'rgba(0, 123, 255, 0.9)';
        pageButton.style.color = 'white';
      }

      pageButton.addEventListener( 'click', () => {
        this.navigateToPage( index );
      } );

      pageNav.appendChild( pageButton );
    } );

    document.body.appendChild( pageNav );
  }

  private async navigateToPage( pageIndex: number ): Promise<void> {
    if ( pageIndex === this.currentPage || !this.config?.dashboard ) return;

    this.currentPage = pageIndex;
    await this.renderPage( pageIndex );
    
    // Update page navigation
    const pageButtons = document.querySelectorAll( '.page-button' );
    pageButtons.forEach( ( button, index ) => {
      if ( index === pageIndex ) {
        ( button as HTMLElement ).style.background = 'rgba(0, 123, 255, 0.9)';
        ( button as HTMLElement ).style.color = 'white';
      } else {
        ( button as HTMLElement ).style.background = 'rgba(255, 255, 255, 0.9)';
        ( button as HTMLElement ).style.color = 'black';
      }
    } );

    console.log( `📄 Navigated to page ${pageIndex}` );
  }

  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener( 'resize', () => {
      this.debounce( () => this.handleResize(), 250 );
    } );

    // Handle orientation change
    window.addEventListener( 'orientationchange', () => {
      setTimeout( () => this.handleResize(), 500 );
    } );
  }

  private handleResize(): void {
    if ( this.config ) {
      this.applyCSSVariables();
      this.renderDashboard();
    }
  }

  private calculateRatio(): number {
    if ( this.isMobileView() ) {
      const screenWidth = window.innerWidth;
      const baseWidth = 1200; // Base desktop width
      return Math.max( 0.5, screenWidth / baseWidth );
    }
    return 1;
  }

  private isMobileView(): boolean {
    return window.innerWidth < 768;
  }

  private isThemeSmooth(): boolean {
    return document.body.classList.contains( 'smooth-light' ) || 
           document.body.classList.contains( 'smooth-dark' );
  }

  private debounce( func: Function, wait: number ): void {
    let timeout: number;
    return ( ( ...args: any[] ) => {
      clearTimeout( timeout );
      timeout = window.setTimeout( () => func.apply( this, args ), wait );
    } ) as any;
  }

  // Public API
  public async refresh(): Promise<void> {
    if ( homeyApi.isConnected() ) {
      this.devices = await homeyApi.loadDevices();
    }
    await this.renderDashboard();
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getConfig(): DashboardConfig | null {
    return this.config;
  }

  public getDevices(): Map<string, HomeyDevice> {
    return this.devices;
  }

  public destroy(): void {
    // Clean up timers and event listeners
    if ( this.screenSaverTimer ) {
      clearTimeout( this.screenSaverTimer );
    }
    
    if ( this.timeUpdateInterval ) {
      clearInterval( this.timeUpdateInterval );
    }

    // Remove event listeners
    window.removeEventListener( 'resize', this.handleResize );
    window.removeEventListener( 'orientationchange', this.handleResize );
    
    console.log( '🧹 TileDash Core destroyed' );
  }
}
