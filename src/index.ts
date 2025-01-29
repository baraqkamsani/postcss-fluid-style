import type { Declaration, Plugin } from 'postcss';
import type { ValidLengthUnit } from './utils';
import {
	computeFluidValues,
	isValidLengthUnit,
	parseValue,
	remFromPixel,
	round,
	validateInput,
} from "./utils";

export type pluginOptions = {
	baseSize?:       number;                  // Base font size in pixels.      default: 16
	injectComment?:  'before' | 'after' | ''; // Inject explanatory comment.    default: ''
	ignoreWCAG?:     boolean;                 // Skip WCAG compliance check.    default: false
	breakpointUnit?: ValidLengthUnit;         // Unit to use for fluid scaling. default: 'vw'
}

function parsePluginOptions(optStr: string): Partial<pluginOptions> {
	try {
		// Remove curly braces and spaces
		const cleaned = optStr.trim().replace(/^{|}$/g, '');

		// Convert the CSS-style object notation to valid JSON
		// This handles both `baseSize: 12` and `baseSize: "12"` formats
		const jsonStr = cleaned.replace(/(\w+):/g, '"$1":');

		return JSON.parse(`{${jsonStr}}`);
	} catch (error) {
		throw new Error('Invalid options format');
	}
}


const FLUID_STYLE_REGEX =
	/fluid-style\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/g;


/**
 * Creates a PostCSS plugin
 * @param opts - Plugin options
 * @returns PostCSS plugin
 */
const creator = (opts: pluginOptions = {}): Plugin => {
	// Fallback to defaults if any of the options are not defined.
	const baseSize = opts.baseSize ?? 16;
	const injectComment = opts.injectComment ?? '';
	const ignoreWCAG = opts.ignoreWCAG ?? false;
	const breakpointUnit = opts.breakpointUnit ?? 'vw';

	return {
		postcssPlugin: 'postcss-fluid-style',
		Declaration(decl: Declaration): void {
			if (!decl.value.includes('fluid-style(')) return;

			// Replace all instances of fluid-style in the value
			decl.value = decl.value.replace(FLUID_STYLE_REGEX, (match: string, argsStr: string): string => {
					const args = argsStr.split(/,(?![^{]*})/); // Split on commas not within {}
					const values = args.slice(0, 4).map(arg => arg.trim());
					const options = args[4] ? parsePluginOptions(args[4]) : {};

					if (values.length !== 4) {
						throw decl.error('fluid-style requires exactly 4 values plus optional options object');
					}

					const localOpts = {
						baseSize: options.baseSize ?? baseSize,
						injectComment: options.injectComment ?? injectComment,
						ignoreWCAG: options.ignoreWCAG ?? ignoreWCAG,
						breakpointUnit: options.breakpointUnit ?? breakpointUnit
					};

					const [minSize, maxSize, minBP, maxBP] = values.map(parseValue);

					try {
						validateInput([minSize, maxSize, minBP, maxBP]);

						if (!minSize || !maxSize || !minBP || !maxBP) {
							throw new Error('Invalid input values');
						}

						// Convert to rem
						const minRem = remFromPixel(minSize, localOpts.baseSize);
						const maxRem = remFromPixel(maxSize, localOpts.baseSize);

						// Compute fluid values
						const { slope, intercept, failRange } = computeFluidValues(
							minSize,
							maxSize,
							minBP,
							maxBP
						);

						if (failRange && !localOpts.ignoreWCAG) {
							throw new Error(
								`WCAG 1.4.4 compliance failure: ` +
								`The specified scaling (${minSize}px to ${maxSize}px) ` +
								`may not maintain proper text scaling ` +
								`between ${minBP}px and ${maxBP}px viewport widths`
							);
						}

						// Calculate preferred value
						const preferredValue = round(remFromPixel(intercept, localOpts.baseSize));
						const slopeValue = round(slope * 100); // Convert to percentage

						if (!isValidLengthUnit(localOpts.breakpointUnit)) {
							throw new Error(`Invalid viewport unit: ${localOpts.breakpointUnit}`);
						}

						// Optionally comment with px values before/after the declaration
						const comment = `/* ${maxBP}px -> ${minBP}px | Scale ${maxSize}px -> ${minSize}px */`;
						if (localOpts.injectComment === 'before') {
							decl.before(comment);
						} else if (localOpts.injectComment === 'after') {
							decl.after(comment);
						}

						return `clamp(${minRem}rem, ${preferredValue}rem + ${slopeValue}${localOpts.breakpointUnit}, ${maxRem}rem)`;
					} catch (error) {
						throw decl.error(error instanceof Error ? error.message : 'An unknown error occurred');
					}
				});
		}
	};
};

creator.postcss = true;
export default creator;