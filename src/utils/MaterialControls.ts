/**
 * Material Design Control Components
 * Utility functions for creating reusable UI controls
 */

export interface MaterialToggleOptions {
	id: string;
	checked: boolean;
	disabled?: boolean;
	onChange: ( checked: boolean ) => void;
	ariaLabel?: string;
}

export interface MaterialSliderOptions {
	id: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	onChange: ( value: number ) => void;
	showValue?: boolean;
	unit?: string;
	ariaLabel?: string;
}

export interface ControlItemOptions {
	title: string;
	subtitle?: string;
	control: HTMLElement;
	state?: 'active' | 'error' | 'unavailable' | 'loading';
}

/**
 * Creates a Material Design toggle switch
 */
export function createMaterialToggle( options: MaterialToggleOptions ): HTMLElement {
	const toggle = document.createElement( 'label' );
	toggle.className = `material-toggle${options.disabled ? ' material-toggle--disabled' : ''}`;
	toggle.setAttribute( 'role', 'switch' );
	toggle.setAttribute( 'aria-checked', options.checked.toString() );
	
	if ( options.ariaLabel ) {
		toggle.setAttribute( 'aria-label', options.ariaLabel );
	}
	
	const input = document.createElement( 'input' );
	input.type = 'checkbox';
	input.className = 'material-toggle__input';
	input.id = options.id;
	input.checked = options.checked;
	input.disabled = !!options.disabled;
	
	const track = document.createElement( 'span' );
	track.className = 'material-toggle__track';
	
	const thumb = document.createElement( 'span' );
	thumb.className = 'material-toggle__thumb';
	track.appendChild( thumb );
	
	// Event handler
	input.addEventListener( 'change', () => {
		if ( !options.disabled ) {
			toggle.setAttribute( 'aria-checked', input.checked.toString() );
			options.onChange( input.checked );
		}
	} );
	
	toggle.appendChild( input );
	toggle.appendChild( track );
	
	return toggle;
}

/**
 * Creates a Material Design slider
 */
export function createMaterialSlider( options: MaterialSliderOptions ): HTMLElement {
	const slider = document.createElement( 'div' );
	slider.className = `material-slider${options.disabled ? ' material-slider--disabled' : ''}`;
	
	const min = options.min ?? 0;
	const max = options.max ?? 100;
	const step = options.step ?? 1;
	const value = Math.max( min, Math.min( max, options.value ) );
	const percentage = ( ( value - min ) / ( max - min ) ) * 100;
	
	const track = document.createElement( 'div' );
	track.className = 'material-slider__track';
	
	const progress = document.createElement( 'div' );
	progress.className = 'material-slider__progress';
	progress.style.width = `${percentage}%`;
	
	const input = document.createElement( 'input' );
	input.type = 'range';
	input.className = 'material-slider__input';
	input.id = options.id;
	input.min = min.toString();
	input.max = max.toString();
	input.step = step.toString();
	input.value = value.toString();
	input.disabled = !!options.disabled;
	
	if ( options.ariaLabel ) {
		input.setAttribute( 'aria-label', options.ariaLabel );
	}
	
	const thumb = document.createElement( 'div' );
	thumb.className = 'material-slider__thumb';
	thumb.style.left = `${percentage}%`;
	
	// Value display (optional)
	let valueDisplay: HTMLElement | null = null;
	if ( options.showValue !== false ) {
		valueDisplay = document.createElement( 'div' );
		valueDisplay.className = 'material-slider__value';
		valueDisplay.textContent = `${Math.round( value )}${options.unit || '%'}`;
	}
	
	// Update function
	const updateSlider = ( newValue: number ) => {
		const clampedValue = Math.max( min, Math.min( max, newValue ) );
		const newPercentage = ( ( clampedValue - min ) / ( max - min ) ) * 100;
		
		progress.style.width = `${newPercentage}%`;
		thumb.style.left = `${newPercentage}%`;
		
		if ( valueDisplay ) {
			valueDisplay.textContent = `${Math.round( clampedValue )}${options.unit || '%'}`;
		}
	};
	
	// Event handlers
	input.addEventListener( 'input', () => {
		if ( !options.disabled ) {
			const newValue = parseFloat( input.value );
			updateSlider( newValue );
			options.onChange( newValue );
		}
	} );
	
	// Keyboard support
	input.addEventListener( 'keydown', ( e ) => {
		if ( options.disabled ) return;
		
		let newValue = parseFloat( input.value );
		let changed = false;
		
		switch ( e.key ) {
			case 'ArrowUp':
			case 'ArrowRight':
				newValue = Math.min( max, newValue + step );
				changed = true;
				break;
			case 'ArrowDown':
			case 'ArrowLeft':
				newValue = Math.max( min, newValue - step );
				changed = true;
				break;
			case 'Home':
				newValue = min;
				changed = true;
				break;
			case 'End':
				newValue = max;
				changed = true;
				break;
			case 'PageUp':
				newValue = Math.min( max, newValue + ( step * 10 ) );
				changed = true;
				break;
			case 'PageDown':
				newValue = Math.max( min, newValue - ( step * 10 ) );
				changed = true;
				break;
		}
		
		if ( changed ) {
			e.preventDefault();
			input.value = newValue.toString();
			updateSlider( newValue );
			options.onChange( newValue );
		}
	} );
	
	track.appendChild( progress );
	slider.appendChild( track );
	slider.appendChild( input );
	slider.appendChild( thumb );
	
	if ( valueDisplay ) {
		slider.appendChild( valueDisplay );
	}
	
	return slider;
}

/**
 * Creates a control item container with title and control
 */
export function createControlItem( options: ControlItemOptions ): HTMLElement {
	const item = document.createElement( 'div' );
	item.className = `control-item${options.state ? ` control-item--${options.state}` : ''}`;
	
	const info = document.createElement( 'div' );
	info.className = 'control-item__info';
	
	const title = document.createElement( 'h3' );
	title.className = 'control-item__title';
	title.textContent = options.title;
	info.appendChild( title );
	
	if ( options.subtitle ) {
		const subtitle = document.createElement( 'p' );
		subtitle.className = 'control-item__subtitle';
		subtitle.textContent = options.subtitle;
		info.appendChild( subtitle );
	}
	
	const action = document.createElement( 'div' );
	action.className = 'control-item__action';
	action.appendChild( options.control );
	
	item.appendChild( info );
	item.appendChild( action );
	
	return item;
}

/**
 * Updates the state of a control item
 */
export function updateControlItemState(
	element: HTMLElement,
	state?: 'active' | 'error' | 'unavailable' | 'loading'
): void {
	// Remove existing state classes
	element.classList.remove(
		'control-item--active',
		'control-item--error',
		'control-item--unavailable',
		'control-item--loading'
	);
	
	// Add new state class if provided
	if ( state ) {
		element.classList.add( `control-item--${state}` );
	}
}

/**
 * Updates a toggle switch state
 */
export function updateMaterialToggle( element: HTMLElement, checked: boolean ): void {
	const input = element.querySelector( '.material-toggle__input' ) as HTMLInputElement;
	if ( input ) {
		input.checked = checked;
		element.setAttribute( 'aria-checked', checked.toString() );
	}
}

/**
 * Updates a slider value
 */
export function updateMaterialSlider(
	element: HTMLElement,
	value: number,
	unit?: string
): void {
	const input = element.querySelector( '.material-slider__input' ) as HTMLInputElement;
	const progress = element.querySelector( '.material-slider__progress' ) as HTMLElement;
	const thumb = element.querySelector( '.material-slider__thumb' ) as HTMLElement;
	const valueDisplay = element.querySelector( '.material-slider__value' ) as HTMLElement;
	
	if ( input && progress && thumb ) {
		const min = parseFloat( input.min );
		const max = parseFloat( input.max );
		const clampedValue = Math.max( min, Math.min( max, value ) );
		const percentage = ( ( clampedValue - min ) / ( max - min ) ) * 100;
		
		input.value = clampedValue.toString();
		progress.style.width = `${percentage}%`;
		thumb.style.left = `${percentage}%`;
		
		if ( valueDisplay ) {
			valueDisplay.textContent = `${Math.round( clampedValue )}${unit || '%'}`;
		}
	}
}

/**
 * Creates a device status indicator
 */
export function createStatusIndicator(
	online: boolean,
	lastSeen?: Date
): HTMLElement {
	const indicator = document.createElement( 'div' );
	indicator.className = `status-indicator status-indicator--${online ? 'online' : 'offline'}`;
	indicator.setAttribute( 'aria-label', online ? 'Device online' : 'Device offline' );
	
	const dot = document.createElement( 'span' );
	dot.className = 'status-indicator__dot';
	
	indicator.appendChild( dot );
	
	if ( !online && lastSeen ) {
		indicator.title = `Last seen: ${lastSeen.toLocaleString()}`;
	}
	
	return indicator;
}

/**
 * Debounce utility for control events
 */
export function debounce<T extends ( ...args: any[] ) => any>(
	func: T,
	wait: number
): ( ...args: Parameters<T> ) => void {
	let timeout: NodeJS.Timeout;
	
	return ( ...args: Parameters<T> ) => {
		clearTimeout( timeout );
		timeout = setTimeout( () => func( ...args ), wait );
	};
}
