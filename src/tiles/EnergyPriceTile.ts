import { BaseTile } from './BaseTile';
import { EnergyPriceTileConfig as EnergyPriceTileConfig, NorwegianPriceArea } from '../types';
import { HomeyDevice } from '../types';
import { HomeyAPIV3LocalPatched } from 'homey-api';
import ApexCharts from 'apexcharts';
import { TileHMRHelper } from '../utils/TileHMR';

interface EnergyPriceData {
	ORE_per_kWh: number;
	NOK_per_kWh: number;
	EUR_per_kWh: number;
	EXR: number;
	time_start: string;
	time_end: string;
}

interface EnergyPriceResponse extends Array<EnergyPriceData> {}

export class EnergyPriceTile extends BaseTile {
	private chart: ApexCharts | null = null;
	private dataRefreshTimer: number | null = null;
	private uiUpdateTimer: number | null = null;
	private currentPriceElement: HTMLElement | null = null;
	private chartContainer: HTMLElement | null = null;
	private priceData: EnergyPriceData[] = [];
	private lastDataFetch: number = 0;
	
	// Price area mapping for logging
	private readonly PRICE_AREA_NAMES: Record<NorwegianPriceArea, string> = {
		NO1: 'Oslo / Øst-Norge',
		NO2: 'Kristiansand / Sør-Norge', 
		NO3: 'Trondheim / Midt-Norge',
		NO4: 'Tromsø / Nord-Norge',
		NO5: 'Bergen / Vest-Norge',
	};

	constructor(
		tileId: string,
		devices: HomeyDevice[],
		config: EnergyPriceTileConfig,
		element: HTMLElement,
		homeyApi: HomeyAPIV3LocalPatched
	) {
		super( tileId, devices, config, element, homeyApi );
	}

	protected get energyConfig(): EnergyPriceTileConfig {
		return this.config as EnergyPriceTileConfig;
	}

	render(): void {
		this.element.innerHTML = '';
		this.element.classList.add( 'energy-price-tile' );
		this.element.classList.add( 'energy-price-tile-test' );

		// Create tile structure
		const container = document.createElement( 'div' );
		container.classList.add( 'tile-container' );

		// Title and current price header
		const header = document.createElement( 'div' );
		header.className = 'tile-header energy-tile-header';

		const titleElement = document.createElement( 'div' );
		titleElement.classList.add( 'tile-title' );
		titleElement.textContent = this.energyConfig.name || `Strømpris ${this.energyConfig.priceArea}`;

		if ( this.energyConfig.showCurrentPrice !== false ) {
			this.currentPriceElement = document.createElement( 'div' );
			this.currentPriceElement.classList.add( 'energy-current-price' );
			this.currentPriceElement.textContent = '-- øre/kWh';
			header.appendChild( titleElement );
			header.appendChild( this.currentPriceElement );
		} else {
			header.appendChild( titleElement );
		}

		// Chart container
		this.chartContainer = document.createElement( 'div' );
		this.chartContainer.classList.add( 'energy-chart-container' );

		container.appendChild( header );
		container.appendChild( this.chartContainer );
		this.element.appendChild( container );

		// Load data and setup chart (non-blocking)
		this.fetchAndUpdateData();
		this.setupSmartRefreshTimers();
	}

	private async fetchAndUpdateData(): Promise<void> {
		try {
			// Check minimum refresh interval to avoid API spam
			if ( !this.shouldFetchData() ) {
				console.log( `⏭️ Skipping data fetch - minimum refresh interval not reached` );
				return;
			}

			this.element.classList.remove( 'tile--has-error' );
			
			const today = new Date();
			const tomorrow = new Date( today );
			tomorrow.setDate( tomorrow.getDate() + 1 );

			const todayStr = this.formatDateForAPI( today );
			const tomorrowStr = this.formatDateForAPI( tomorrow );

			// Fetch both today and tomorrow data
			const [ todayData, tomorrowData, ] = await Promise.all( [
				this.fetchPriceData( todayStr ),
				this.fetchPriceData( tomorrowStr ).catch( () => null ), // Tomorrow data might not be available
			] );

			// Combine data
			this.priceData = todayData || [];
			if ( tomorrowData ) {
				this.priceData.push( ...tomorrowData );
			}

			console.log( 'Price Data', this.priceData );
			

			// Add tariff and tax
			this.priceData = this.priceData.map( item => ( {
				...item,
				ORE_per_kWh: this.calculateFinalPrice( item.NOK_per_kWh ),
			} ) );

			this.updateChart();
			this.updateCurrentPrice();
			this.lastDataFetch = Date.now();

			console.log( `✅ Energy price data updated for ${this.energyConfig.priceArea} (${this.PRICE_AREA_NAMES[this.energyConfig.priceArea]})` );

		} catch ( error ) {
			console.error( `❌ Failed to fetch energy price data for ${this.energyConfig.priceArea}:`, error );
			this.element.classList.add( 'tile--has-error' );
		}
	}

	private async fetchPriceData( dateStr: string ): Promise<EnergyPriceData[] | null> {

		// For production
		// const baseUrl = `https://www.hvakosterstrommen.no/api/v1/prices/`;

		// For testing
		const baseUrl = `./demo_`;

		const url = baseUrl + `${dateStr}_${this.energyConfig.priceArea}.json`;
		
		try {
			const response = await fetch( url );
			if ( !response.ok ) {
				throw new Error( `HTTP ${response.status}: ${response.statusText}` );
			}

			const data: EnergyPriceResponse = await response.json();

			// Example data:
			// [
			// 	{
			// 		"NOK_per_kWh": 1.1043,
			// 		"EUR_per_kWh": 0.0933,
			// 		"EXR": 11.836,
			// 		"time_start": "2025-08-28T00:00:00+02:00",
			// 		"time_end": "2025-08-28T01:00:00+02:00",
			// 	},
			// 	{
			// 		"NOK_per_kWh": 1.03411,
			// 		"EUR_per_kWh": 0.08737,
			// 		"EXR": 11.836,
			// 		"time_start": "2025-08-28T01:00:00+02:00",
			// 		"time_end": "2025-08-28T02:00:00+02:00",
			// 	},
			// ];
            
			if ( !Array.isArray( data ) ) {
				throw new Error( 'Invalid API response format - expected array' );
			}

			return data;
		} catch ( error ) {
			console.error( `Failed to fetch price data for ${dateStr}:`, error );
			return null;
		}
	}

	private formatDateForAPI( date: Date ): string {
		const year = date.getFullYear();
		const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( date.getDate() ).padStart( 2, '0' );
		return `${year}/${month}-${day}`;
	}

	private calculateFinalPrice( basePrice: number ): number {
		const tariff = this.energyConfig.tariffCost || 0;
		const tax = this.energyConfig.taxPercentage || 25;
		
		// Add tariff (øre/kWh) and apply tax percentage
		const priceWithTariff = basePrice + ( tariff / 100 ); // Convert to NOK
        
		// Convert to øre
		const priceInOre = priceWithTariff * 100;

		// Add tax
		return ( priceInOre * ( 1 + tax / 100 ) );
	}

	private updateChart(): void {
		if ( !this.chartContainer || this.priceData.length === 0 ) return;

		// Prepare chart data for ApexCharts
		const series = this.priceData.map( item => ( {
			x: new Date( item.time_start ).getTime(),
			y: item.ORE_per_kWh,
		} ) );

		// Calculate dynamic price range for gradient mapping
		const prices = this.priceData.map( item => item.ORE_per_kWh );
		const minPrice = Math.min( ...prices );
		// const maxPrice = Math.max( ...prices );

		// Get current hour for highlighting (in local timezone)
		const now = new Date();
		const currentHour = new Date( now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() );
		const currentHourTime = currentHour.getTime();

		const nearestFutureMidnight = new Date( currentHour );
		nearestFutureMidnight.setHours( 24, 0, 0, 0 );

		const options = {
			series: [ {
				name: '',
				data: series,
			}, ],
			chart: {
				type: 'line',
				height: this.chartContainer.clientHeight || 200,
				toolbar: { show: false, },
				background: 'transparent',
				foreColor: 'var(--text-color, #666)',
				animations: { enabled: false, },
				zoom: {
					enabled: false,
				},
			},
			stroke: {
				curve: 'stepline', // Hard edges, no smoothing
				width: 2,
				colors: [ this.energyConfig.graphOptions?.lineColor || 'var(--chart-color-normal)', ],
			},
			fill: {
				type: 'gradient',
				gradient: {
					shade: 'dark',
					type: 'vertical',
					opacityFrom: 0.8,
					opacityTo: 1,
					shadeIntensity: 1,
					stops: [ 0, 33, 66, 100, ],
					colorStops: [
						{
							offset: 0,
							color: this.energyConfig.graphOptions?.fillColor || 'var(--chart-color-expensive)',
							opacity: 1,
						},
						{
							offset: 50,
							color: 'var(--chart-color-normal)',
							opacity: 1,
						},
						{
							offset: 100,
							color: this.energyConfig.graphOptions?.fillColor || 'var(--chart-color-cheap)',
							opacity: 1,
						},
					],
				},
			},
			markers: {
				size: 0,
				hover: { size: 6, },
			},
			xaxis: {
				type: 'datetime',
				labels: {
					format: 'HH:mm',
					style: { colors: 'var(--text-color, #666)', },
					datetimeUTC: false, // Use local timezone for display
				},
				axisBorder: { color: 'transparent', },
				axisTicks: { color: 'var(--text-color, #666)', },
			},
			yaxis: {
				// max: Math.floor(maxPrice),
				min: Math.floor( minPrice ),
				stepSize: 30,
				title: { 
					text: 'øre/kWh',
					style: { color: 'var(--text-color, #666)', },
				},
				labels: {
					style: { colors: 'var(--text-color, #666)', },
					formatter: ( value: number ) => value.toFixed( 0 ),
				},
				axisTicks: { color: 'var(--text-color, #666)', },
				crosshairs: {
					show: true,
				},
			},
			grid: {
				borderColor: 'var(--border-color, #666)',
				opacity: 0.3,
			},
			tooltip: {
				theme: true, // Use CSS theming
				followCursor: false,
				fillSeriesColor: true,
				x: { 
					// show: false,
					format: 'dd/MM HH:mm',
					formatter: ( value: number ) => {
						// Format tooltip time in local timezone
						const date = new Date( value );
						const dateEnd = new Date( value + 60 * 60 * 1000 ); // Add 1 hour
						return `${date.toLocaleString( 'no-NO', { hour: '2-digit', minute: '2-digit', } )} - ${dateEnd.toLocaleString( 'no-NO', { hour: '2-digit', minute: '2-digit', } )}`;
					},
				},
				y: { formatter: ( value: number ) => `${value.toFixed( 2 )} øre/kWh`, },
				marker: {
					show: false,
				},
			},
			annotations: {
				xaxis: [ 
					{
						x: currentHourTime,
						strokeDashArray: 3,
						borderColor: this.energyConfig.graphOptions?.currentHourColor || 'var(--app-color-primary, #ff9800)',
						label: {
							text: 'Now',
							style: {
								color: 'var(--text-color, #333)',
								background: this.energyConfig.graphOptions?.currentHourColor || 'var(--app-color-primary, #ff9800)',
							},
						},
					},
					{
						x: nearestFutureMidnight.getTime(),
						strokeDashArray: 5,
						borderColor: 'var(--app-color-secondary, lightgrey)',
					},
				] as any,
			},
		} as any;

		// Destroy existing chart
		if ( this.chart ) {
			this.chart.destroy();
		}

		// Create new chart
		this.chart = new ApexCharts( this.chartContainer, options );
		this.chart.render();
	}

	private updateCurrentPrice(): void {
		if ( !this.currentPriceElement || this.priceData.length === 0 ) return;

		// Find current hour price - compare using local timezone
		const now = new Date();
		
		const currentPriceData = this.priceData.find( item => {
			const itemTime = new Date( item.time_start );
			// Compare hours in local timezone
			return itemTime.getHours() === now.getHours() && 
				itemTime.getDate() === now.getDate() &&
				itemTime.getMonth() === now.getMonth() &&
				itemTime.getFullYear() === now.getFullYear();
		} );

		if ( currentPriceData ) {
			const finalPrice = currentPriceData.ORE_per_kWh;
			this.currentPriceElement.textContent = `${finalPrice.toFixed( 2 )} øre/kWh`;
			
			// Add price level class for styling
			const prices = this.priceData.map( item => item.ORE_per_kWh );
			const minPrice = Math.min( ...prices );
			const maxPrice = Math.max( ...prices );
			const priceRange = maxPrice - minPrice;
			
			const cheapThreshold = minPrice + priceRange * 0.33;
			const normalThreshold = minPrice + priceRange * 0.66;

			this.currentPriceElement.classList.remove( 'price-cheap', 'price-normal', 'price-expensive' );
			
			if ( finalPrice <= cheapThreshold ) {
				this.currentPriceElement.classList.add( 'price-cheap' );
			} else if ( finalPrice <= normalThreshold ) {
				this.currentPriceElement.classList.add( 'price-normal' );
			} else {
				this.currentPriceElement.classList.add( 'price-expensive' );
			}
		} else {
			this.currentPriceElement.textContent = '-- øre/kWh';
		}
	}

	private calculateNextDataRefreshTime(): number {
		const now = new Date();
		const today1310 = new Date( now.getFullYear(), now.getMonth(), now.getDate(), 13, 10, 0 );
		const tomorrow1310 = new Date( today1310.getTime() + 24 * 60 * 60 * 1000 );
		
		// If it's past 13:10 today, schedule for tomorrow at 13:10
		if ( now >= today1310 ) {
			return tomorrow1310.getTime() - now.getTime();
		} else {
			// If it's before 13:10 today, schedule for today at 13:10
			return today1310.getTime() - now.getTime();
		}
	}

	private getMinimumRefreshInterval(): number {
		// Minimum 30 minutes to avoid spamming the API
		const configuredInterval = ( this.energyConfig.refreshInterval || 30 ) * 60 * 1000;
		const minimumInterval = 30 * 60 * 1000; // 30 minutes
		return Math.max( configuredInterval, minimumInterval );
	}

	private shouldFetchData(): boolean {
		if ( !this.lastDataFetch ) return true;
		
		const now = Date.now();
		const timeSinceLastFetch = now - this.lastDataFetch;
		const minimumInterval = this.getMinimumRefreshInterval();
		
		return timeSinceLastFetch >= minimumInterval;
	}

	private setupSmartRefreshTimers(): void {
		// Clear any existing timers
		if ( this.dataRefreshTimer ) {
			clearTimeout( this.dataRefreshTimer );
		}
		if ( this.uiUpdateTimer ) {
			clearInterval( this.uiUpdateTimer );
		}

		// Setup data refresh timer (smart timing for tomorrow's data)
		this.scheduleNextDataRefresh();

		// Setup UI update timer (every minute for "now" annotation and current price)
		this.uiUpdateTimer = window.setInterval( () => {
			this.updateChartAnnotations();
			this.updateCurrentPrice();
		}, 60 * 1000 ); // Every minute

		console.log( `🔄 Smart refresh timers initialized - UI updates every minute, data refresh scheduled intelligently` );
	}

	private scheduleNextDataRefresh(): void {
		const timeToNextRefresh = this.calculateNextDataRefreshTime();
		
		this.dataRefreshTimer = window.setTimeout( async () => {
			console.log( `⏰ Scheduled data refresh triggered at ${new Date().toLocaleTimeString()}` );
			
			if ( this.shouldFetchData() ) {
				await this.fetchAndUpdateData();
			} else {
				console.log( `⏭️ Skipping data fetch (too soon since last update)` );
			}
			
			// Schedule the next refresh (will be tomorrow at 13:10)
			this.scheduleNextDataRefresh();
		}, timeToNextRefresh );

		const nextRefreshTime = new Date( Date.now() + timeToNextRefresh );
		console.log( `📅 Next data refresh scheduled for: ${nextRefreshTime.toLocaleString()}` );
	}

	private updateChartAnnotations(): void {
		if ( !this.chart ) return;

		// Get current hour for highlighting (in local timezone)
		const now = new Date();
		const currentHour = new Date( now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() );
		const currentHourTime = currentHour.getTime();

		const nearestFutureMidnight = new Date( currentHour );
		nearestFutureMidnight.setHours( 24, 0, 0, 0 );

		// Update chart annotations
		this.chart.updateOptions( {
			annotations: {
				xaxis: [
					{
						x: currentHourTime,
						strokeDashArray: 3,
						borderColor: this.energyConfig.graphOptions?.currentHourColor || 'var(--app-color-primary, #ff9800)',
						label: {
							text: 'Now',
							style: {
								color: 'var(--text-color, #333)',
								background: this.energyConfig.graphOptions?.currentHourColor || 'var(--app-color-primary, #ff9800)',
							},
						},
					},
					{
						x: nearestFutureMidnight.getTime(),
						strokeDashArray: 5,
						borderColor: 'var(--app-color-secondary, lightgrey)',
					},
				] as any,
			},
		}, false, false ); // Don't redraw, don't animate
	}

	update(): void {
		// Energy price tiles don't have device updates
		// Data updates are handled by the smart refresh timers
	}

	/**
	 * Manually trigger a data refresh (respects minimum interval)
	 */
	public async refreshData( force: boolean = false ): Promise<void> {
		if ( force || this.shouldFetchData() ) {
			await this.fetchAndUpdateData();
		} else {
			const nextAllowedRefresh = new Date( this.lastDataFetch + this.getMinimumRefreshInterval() );
			console.log( `⏭️ Manual refresh blocked - next refresh allowed at: ${nextAllowedRefresh.toLocaleTimeString()}` );
		}
	}

	public cleanup(): void {
		super.cleanup();
		
		if ( this.dataRefreshTimer ) {
			clearTimeout( this.dataRefreshTimer );
			this.dataRefreshTimer = null;
		}
		
		if ( this.uiUpdateTimer ) {
			clearInterval( this.uiUpdateTimer );
			this.uiUpdateTimer = null;
		}
		
		if ( this.chart ) {
			this.chart.destroy();
			this.chart = null;
		}
	}
}

// Hot Module Replacement (HMR) support
if ( import.meta.hot ) {
	import.meta.hot.accept( TileHMRHelper.create( EnergyPriceTile, 'EnergyPriceTile' ) );
}