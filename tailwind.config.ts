import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

/**
 * Design tokens for the whole site. To re-theme, change values here (colours, fonts,
 * type scale, spacing) rather than in components.
 *
 * Contrast notes (WCAG AA, checked against `paper`):
 *   ink, ink-soft, stone-700, accent          -> body-text safe (>= 4.5:1)
 *   accent-light                              -> only on dark backgrounds (`ink`)
 */
const config: Config = {
  content: ['./src/app/(frontend)/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#faf8f5', warm: '#f3efe8' },
        ink: { DEFAULT: '#151515', soft: '#2c2a27' },
        stone: {
          50: '#f6f3ee',
          100: '#ece7df',
          200: '#ddd5c9',
          300: '#c4b9a8',
          400: '#a69a87',
          500: '#877b69',
          600: '#6b6154',
          700: '#544c42',
          800: '#3a352e',
          900: '#24211d',
        },
        accent: { DEFAULT: '#8a5a2f', dark: '#6f4723', light: '#d4a574' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'Georgia', ...defaultTheme.fontFamily.serif],
      },
      fontSize: {
        display: ['clamp(2.75rem, 7vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.01em' }],
        heading: ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.005em' }],
        subheading: ['clamp(1.375rem, 2.5vw, 1.75rem)', { lineHeight: '1.25' }],
      },
      letterSpacing: {
        eyebrow: '0.2em',
        button: '0.14em',
      },
      spacing: {
        // Vertical rhythm between page sections, and the sticky nav height
        // (also used as scroll padding so anchors don't hide under the nav).
        section: 'clamp(4rem, 9vw, 8rem)',
        nav: '4.5rem',
      },
      maxWidth: {
        content: '76rem',
        copy: '40rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
