/** @type {import('tailwindcss').Config} */
const tokens = require('./src/theme/tokens');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: tokens.colors.background,
        surface: tokens.colors.surface,
        ink: tokens.colors.ink,
        'ink-muted': tokens.colors.inkMuted,
        sage: tokens.colors.accent.sage,
        lavender: tokens.colors.accent.lavender,
        peach: tokens.colors.accent.peach,
        cream: tokens.colors.accent.cream,
      },
      fontFamily: {
        display: [tokens.fontFamily.display],
        'display-bold': [tokens.fontFamily.displayBold],
        sans: [tokens.fontFamily.body],
        'sans-medium': [tokens.fontFamily.bodyMedium],
        'sans-semibold': [tokens.fontFamily.bodySemibold],
        handwritten: [tokens.fontFamily.accent],
        'handwritten-bold': [tokens.fontFamily.accentBold],
      },
      borderRadius: {
        '4xl': '28px',
      },
    },
  },
  plugins: [],
};
