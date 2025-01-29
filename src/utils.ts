/**
 * Converts pixel values to rem.
 * @param px - Pixel value to convert
 * @param base - Base pixel value
 */
export const remFromPixel = (px: number, base: number = 16): number =>
	Number((px / base).toFixed(3));


/**
 * Parses a pixel value from a string.
 * @param value - String containing a pixel value
 * @returns Parsed number or null if invalid
 */
export const parseValue = (value: string): number | null => {
	const match = value.match(/^(\d+(?:\.\d+)?)px$/);
	return match ? parseFloat(match[1]) : null;
};


/**
 * Rounds a number to 3 decimal places
 * @param num - Number to round
 * @returns Rounded number
 */
export const round = (num: number): number =>
	Number(num.toFixed(3));


/**
 * Valid length units for fluid scaling,
 * i.e.
 * {@link https://drafts.csswg.org/css-values-4/#viewport-relative-lengths viewport units}
 * and
 * {@link https://drafts.csswg.org/css-contain-3/#container-lengths container query units}.
 *
 * **Note:** The min/max variants (vmin, vmax, ..., cqmin, cqmax) are omitted
 *           as they represent the minimum/maximum of their respective axes
 *           rather than a single consistent dimension,
 *           which would make fluid scaling unpredictable
 *           when the aspect ratio changes.
 */
export const VALID_LENGTH_UNITS = [
	'vw', 'vh', 'vi', 'vb',     // Standard viewport units
	'dvw', 'dvh', 'dvi', 'dvb', // Dynamic viewport units
	'svw', 'svh', 'svi', 'svb', // Small viewport units
	'lvw', 'lvh', 'lvi', 'lvb', // Large viewport units
	'cqw', 'cqh', 'cqi', 'cqb', // Container query units
] as const;

export type ValidLengthUnit = typeof VALID_LENGTH_UNITS[number];

/**
 * Validates if a string is a recognized length unit for fluid scaling
 * @param unit - Unit to validate
 * @returns Whether the unit is valid
 */
export const isValidLengthUnit = (unit: string): boolean =>
	VALID_LENGTH_UNITS.includes(unit as ValidLengthUnit);


interface FluidValues {
	/** The calculated slope */
	slope: number;

	/** The calculated intercept */
	intercept: number;

	/** Whether the values fail WCAG criteria */
	failRange?: boolean;
}


/**
 * Computes fluid values and checks
 * {@link https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html WCAG compliance}.
 *
 * @param min - Minimum size in pixels
 * @param max - Maximum size in pixels
 * @param minBP - Minimum breakpoint in pixels
 * @param maxBP - Maximum breakpoint in pixels
 * @returns Computed values
 */
export function computeFluidValues(
	min: number,
	max: number,
	minBP: number,
	maxBP: number
): FluidValues {
	const slope = (max - min) / (maxBP - minBP);
	const intercept = min - (minBP * slope);

	// WCAG check calculations
	const lh = (5 * min - 2 * intercept) / (2 * slope);
	const rh = (5 * intercept - 2 * max) / (-1 * slope);
	const lh2 = 3 * intercept / slope;

	let failRange = false;

	if (maxBP < 5 * minBP) {
		if (minBP < lh && lh < maxBP) {
			failRange = true;
		}
		if (5 * min < 2 * max) {
			failRange = true;
		}
		if (5 * minBP < rh && rh < 5 * maxBP) {
			failRange = true;
		}
	} else {
		if (minBP < lh && lh < 5 * minBP) {
			failRange = true;
		}
		if (5 * minBP < lh2 && lh2 < maxBP) {
			failRange = true;
		}
		if (maxBP < rh && rh < 5 * maxBP) {
			failRange = true;
		}
	}

	return {
		slope,
		intercept,
		failRange
	};
}


/**
 * Validates an array of input values
 * @param values - Array of values to validate
 * @throws {Error} If any value is invalid
 */
export function validateInput(values: (number | null)[]): void {
	for (const value of values) {
		if (value == null || isNaN(value) || value <= 0) {
			throw new Error('Invalid input: all values must be positive numbers with px units');
		}
	}
}