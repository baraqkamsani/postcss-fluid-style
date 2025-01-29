import { defineConfig } from 'rolldown'

const dir = 'dist';

export default defineConfig({
	input: {
		index: 'src/index.ts',
	},
	output: [
		{
			dir,
			format: 'esm',
			entryFileNames: '[name].js',
		},
		{
			dir,
			format: 'esm',
			entryFileNames: '[name].min.js',
			minify: true,
		},
		{
			dir,
			format: 'cjs',
			entryFileNames: '[name].cjs',
		},
		{
			dir,
			format: 'cjs',
			entryFileNames: '[name].min.cjs',
			minify: true,
		},
	],
	resolve: {
		// This needs to be explicitly set for now because oxc resolver doesn't
		// assume default exports conditions. Rolldown will ship with a default that
		// aligns with Vite in the future.
		conditionNames: ['import'],
	},
})