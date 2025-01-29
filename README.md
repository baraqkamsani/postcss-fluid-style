# PostCSS Fluid Style

[PostCSS Fluid Style] lets you build fluid text and size while maintaining WCAG compliance.

This plugin is adapted from [barvian/fluid.style]. \
If you are using Tailwind, check out [barvian/fluid-tailwind].

## Usage

Add [PostCSS Fluid Style] to your project:

```sh
npm install --save-dev postcss postcss-fluid-style
```

Use it as a [PostCSS] plugin:

```js
// postcss.config.mjs
import postcssFluidStyle from "postcss-fluid-style";

const config = {
  plugins: [
    postcssFluidStyle(/* pluginOptions */),
  ]
};

export default config;
```

## Options

### baseSize

Sets the base font size in pixels for rem calculations.

```js
postcssFluidStyle({ baseSize: 16 }) // Default: 16
```

### breakpointUnit

Specifies the unit to use for fluid scaling.

Supported length units:

- standard  viewport units: `vw`, `vh`, `vi`, `vb`
- dynamic   viewport units: `dvw`, `dvh`, `dvi`, `dvb`
- small     viewport units: `svw`, `svh`, `svi`, `svb`
- large     viewport units: `lvw`, `lvh`, `lvi`, `lvb`
- container query    units: `cqw`, `cqh`, `cqi`, `cqb`

```js
postcssFluidStyle({ breakpointUnit: 'vw' }) // Default: 'vw'
```

### injectComment

Controls the placement of explanatory comments.

Accepted values:

- `'before'`
- `'after'`
- `''` (don't inject comment)

```js
postcssFluidStyle({ injectComment: '' }) // Default: ''
```

### ignoreWCAG

Disables WCAG compliance checks for text scaling.

Accepted values:

- `true`
- `false`

```js
postcssFluidStyle({ ignoreWCAG: true }) // Default: true
```


## Syntax

```scss
fluid-style(<min-size>px, <max-size>px, <min-viewport>px, <max-viewport>px, { /* options */ })
```

- `<min-size>px`:  Minimum size at smallest viewport
- `<max-size>px`:  Maximum size at largest viewport
- `<min-viewport>px`:  Minimum viewport width
- `<max-viewport>px`:  Maximum viewport width

Options in `fluid-style()` will override options from postcss.config.mjs.


## Examples

### Basic Usage

```js
/* postcss.config.mjs */
postcssFluidStyle()
```

```css
/* style.css */

h1 {
  font-size: fluid-style(36px, 72px, 320px, 1240px);
}

/* Outputs ------------------------------------ */
h1 {
  font-size: clamp(2.25rem, 1.467rem + 3.913vw, 4.5rem);
}
```

### Specifying breakpointUnit

You can configure the breakpointUnit within the `fluid-style()` call:

```css
html {
  container-type: inline-size;
}

body {
  font-size: fluid-style(36px, 72px, 320px, 1240px, { breakpointUnit: 'cqi' });
}

/* Outputs ------------------------------------ */
html {
  container-type: inline-size;
}

body {
  font-size: clamp(2.25rem, 1.467rem + 3.913cqi, 4.5rem);
}
```

Alternatively, you can specify it in your PostCSS config file:

```js
/* postcss.config.mjs */
postcssFluidStyle({ breakpointUnit: 'cqi' }) // Default: 'vw'
```

```diff
html {
  container-type: inline-size;
}

body {
-  font-size: fluid-style(36px, 72px, 320px, 1240px, { breakpointUnit: 'cqi' });
+  font-size: fluid-style(36px, 72px, 320px, 1240px);
}

/* Outputs ------------------------------------ */
html {
  container-type: inline-size;
}

body {
  font-size: clamp(2.25rem, 1.467rem + 3.913cqi, 4.5rem);
}
```

### Specifying injectComment

A comment showing the original pixel values will be inserted before/after the declaration.
This is useful if you want to preserve them at an intermediate processing stage,
or for demonstration purposes.

#### Before

```js
postcssFluidStyle({ injectComment: 'before' })
```

```css
h1 {
  font-size: fluid-style(36px, 72px, 320px, 1240px);
}
/* Outputs ------------------------------------ */
h1 {
  /* 1240px -> 320px | Scale 72px -> 36px */ font-size: clamp(1rem, 0.636rem + 1.818vw, 2rem);
}
```

#### After

```js
postcssFluidStyle({ injectComment: 'after' })
```

```css
h1 {
  font-size: fluid-style(36px, 72px, 320px, 1240px);
}
/* Outputs ------------------------------------ */
h1 {
  font-size: clamp(1rem, 0.636rem + 1.818vw, 2rem);/* 1240px -> 320px | Scale 72px -> 36px */
}
```


### Specifying ignoreWCAG

Suppressing the WCAG check is useful when you are using fluid-style for sizing,
such as `margin`, `border-width`, or `padding`.

```css
.wrapper {
  --padding: fluid-style(36px, 148px, 320px, 1240px, { ignoreWCAG: true });
}
/* Outputs ------------------------------------ */
.wrapper {
  --padding: clamp(2.25rem, -0.185rem + 12.174vw, 9.25rem);
}
```

### Specifying baseSize

Computing px to rem is as follows: `36px / 16 = 2.25rem`

Where 16 is the base size.
Implicitly,
it's 16px because browsers set this value as the default font-size for the HTML document.

This plugin does not check for declarations in `html{}` or `:root{}`,
you'll have to add a `font-size` declaration there if you want to set a new base size.

> [!NOTE]
> This will override the user's browser settings and system preferences. \
> Though the default is 16px, users **can** set a different font-size.
>
> Chromium Example, from `chrome://settings/appearance`:
>
> - 9px – Very Small
> - 12px – Small
> - 16px – Medium (Default)
> - 20px – Large
> - 24px – Very Large

```js
postcssFluidStyle({ baseSize: 10 }) // 36px / 10 = 3.6rem
```

```css
html {
  font-size: 10px;
}

h1 {
  font-size: fluid-style(36px, 72px, 320px, 1240px);
}

/* Outputs ------------------------------------ */
html {
  font-size: 10px;
}

h1 {
  font-size: clamp(3.6rem, 2.348rem + 3.913vw, 7.2rem);
}
```


## Motivation

I really like [fluid.style](https://fluid.style),
but I wanted some convenience in building a fluid type system directly from PostCSS, like so:

```css
body {
  --text-xs:   fluid-style(12px, 14px, 640px, 1240px);
  --text-sm:   fluid-style(14px, 16px, 640px, 1240px);
  --text-base: fluid-style(16px, 18px, 640px, 1240px);
  --text-lg:   fluid-style(18px, 20px, 640px, 1240px);
  --text-h1:   fluid-style(32px, 48px, 640px, 1240px);
}

/* Outputs ------------------------------------ */
body {
  --text-xs:   clamp(0.75rem,  0.617rem + 0.333vw, 0.875rem);
  --text-sm:   clamp(0.875rem, 0.742rem + 0.333vw, 1rem);
  --text-base: clamp(1rem,     0.867rem + 0.333vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 0.992rem + 0.333vw, 1.25rem);
  --text-h1:   clamp(2rem,     0.933rem + 2.667vw, 3rem);
}
```


## Acknowledgements

Credit goes to the following people for their prior work and research:

- Maxwell Barvian: [Addressing Accessibility Concerns With Using Fluid Type]
- Adrian Roselli: [Responsive Type and Zoom]
- Accessibility Guidelines Working Group: [Success Criterion 1.4.4 Resize Text]
- [csstools/postcss-plugins] for PostCSS plugin development patterns and practices

[//]: # (Links)

[PostCSS Fluid Style]: https://github.com/baraqkamsani/postcss-fluid-style
[PostCSS]: https://github.com/postcss/postcss
[barvian/fluid.style]: https://github.com/barvian/fluid.style
[barvian/fluid-tailwind]: https://github.com/barvian/fluid-tailwind
[Addressing Accessibility Concerns With Using Fluid Type]: https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/
[Responsive Type and Zoom]: https://adrianroselli.com/2019/12/responsive-type-and-zoom.html
[Success Criterion 1.4.4 Resize Text]: https://www.w3.org/TR/WCAG21/#resize-text
[csstools/postcss-plugins]: https://github.com/csstools/postcss-plugins
