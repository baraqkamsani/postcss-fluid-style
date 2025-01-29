import postcss from 'postcss';
import plugin from '../dist/index.min.js';

describe('postcss-fluid-style', () => {
	async function run(input, opts = {}) {
		const result = await postcss([plugin(opts)]).process(input, {
			from: undefined
		});
		return result.css;
	}

	describe('basic functionality', () => {
		it('transforms basic fluid-style declaration', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px); }';
			const expected = 'h1 { font-size: clamp(2.25rem, 1.467rem + 3.913vw, 4.5rem); }';
			const output = await run(input);
			expect(output).toBe(expected);
		});

		it('handles invalid input', async () => {
			const input = 'h1 { font-size: fluid-style(16px); }';
			const expected = 'fluid-style requires exactly 4 values plus optional options object';
			await expect(run(input)).rejects.toThrow(expected);
		});
	});

	describe('plugin options', () => {
		it('respects custom base size from plugin options', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px); }';
			const expected = 'h1 { font-size: clamp(3.6rem, 2.348rem + 3.913vw, 7.2rem); }';
			const output = await run(input, {baseSize: 10});
			expect(output).toBe(expected);
		});

		it('injects comment before declaration when specified', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px); }';
			const expectedComment = '/* 1240px -> 320px | Scale 72px -> 36px */';
			const expected = `h1 {${expectedComment} font-size: clamp(2.25rem, 1.467rem + 3.913vw, 4.5rem); }`;
			const output = await run(input, {injectComment: 'before'});
			expect(output).toBe(expected);
		});

		it('injects comment after declaration when specified', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px); }';
			const expectedComment = '/* 1240px -> 320px | Scale 72px -> 36px */';
			const expected = `h1 { font-size: clamp(2.25rem, 1.467rem + 3.913vw, 4.5rem);${expectedComment} }`;
			const output = await run(input, {injectComment: 'after'});
			expect(output).toBe(expected);
		});

		it('uses specified breakpoint unit from plugin options', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px); }';
			const expected = 'h1 { font-size: clamp(2.25rem, 1.467rem + 3.913cqi, 4.5rem); }';
			const output = await run(input, {breakpointUnit: 'cqi'});
			expect(output).toBe(expected);
		});
	});

	describe('function options', () => {
		it('respects local options over plugin options', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 72px, 320px, 1240px, { baseSize: 10 }); }';
			const expected = 'h1 { font-size: clamp(3.6rem, 2.348rem + 3.913vw, 7.2rem); }';
			const output = await run(input, {baseSize: 10});
			expect(output).toBe(expected);
		});

		it('allows ignoring WCAG checks locally', async () => {
			const input = 'h1 { --ignore-WCAG: fluid-style(10px, 100px, 320px, 1200px, { ignoreWCAG: true }); }';
			const expected = 'h1 { --ignore-WCAG: clamp(0.625rem, -1.42rem + 10.227vw, 6.25rem); }';
			const output = await run(input);
			expect(output).toBe(expected);
		});

		it('handles multiple options in function call', async () => {
			const input = 'h1 { font-size: fluid-style(16px, 32px, 320px, 1200px, { baseSize: 12, breakpointUnit: "cqi" }); }';
			const expected = 'h1 { font-size: clamp(1.333rem, 0.848rem + 1.818cqi, 2.667rem); }';
			const output = await run(input);
			expect(output).toBe(expected);
		});
	});

	describe('WCAG compliance', () => {
		it('throws on WCAG compliance failure', async () => {
			const input = 'h1 { font-size: fluid-style(10px, 100px, 320px, 1200px); }';
			const expected =
				'WCAG 1.4.4 compliance failure: ' +
				'The specified scaling (10px to 100px) ' +
				'may not maintain proper text scaling between 320px and 1200px viewport widths';

			await expect(run(input)).rejects.toThrow(expected);
		});

		it('allows WCAG bypass with plugin option', async () => {
			const input = 'h1 { font-size: fluid-style(36px, 148px, 320px, 1240px); }';
			const expected = 'h1 { font-size: clamp(2.25rem, -0.185rem + 12.174vw, 9.25rem); }';
			const output = await run(input, { ignoreWCAG: true });
			expect(output).toBe(expected);
		});
	});

	describe('error handling', () => {
		it('handles invalid options format', async () => {
			const input = 'h1 { font-size: fluid-style(16px, 32px, 320px, 1200px, { invalid }); }';
			const expected = 'Invalid options format';
			await expect(run(input)).rejects.toThrow(expected);
		});

		it('validates viewport units', async () => {
			const input = 'h1 { font-size: fluid-style(16px, 32px, 320px, 1200px, { "breakpointUnit": "invalid" }); }';
			const expected = 'Invalid viewport unit: invalid';
			await expect(run(input)).rejects.toThrow(expected);
		});
	});
});