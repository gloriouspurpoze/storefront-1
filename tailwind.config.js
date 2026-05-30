/* =============================================================================
 * Tailwind config — projection of DESIGN.md
 * -----------------------------------------------------------------------------
 * DO NOT introduce new tokens here. The single source of truth is /DESIGN.md.
 * If a token must change, update DESIGN.md first, then mirror it into:
 *   1. src/index.css (CSS custom properties + shadcn HSL bridge)
 *   2. this file (Tailwind theme.extend)
 *
 * Layering:
 *   - The `colors.*` keys named after DESIGN.md tokens (ink, cloud, fog,
 *     bloom-*, storm-*, graphite, etc.) let you write `bg-ink`, `text-graphite`,
 *     `bg-bloom-coral`, `border-hairline`, etc.
 *   - The shadcn semantic keys (background, foreground, card, primary,
 *     destructive, border, ring, …) stay wired to `hsl(var(--xxx))` so every
 *     existing shadcn/Radix component keeps working — but those vars are
 *     themselves derived from DESIGN.md tokens in src/index.css.
 * =========================================================================== */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        // DESIGN.md: Desktop max-width 1366px content container
        '2xl': '1366px',
      },
    },
    extend: {
      // --- DESIGN.md — color tokens (raw, named) ---------------------------
      colors: {
        // shadcn semantic layer (driven by CSS vars in src/index.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // DESIGN.md primary family — direct hex aliases
          bright: '#296ef9', // colors.primary-bright
          deep: '#0e3191',   // colors.primary-deep
          soft: '#c9e0fc',   // colors.primary-soft
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // DESIGN.md — Surface tokens
        canvas: '#ffffff',
        paper: '#ffffff',
        cloud: '#f7f7f7',
        fog: '#e8e8e8',
        steel: '#c2c2c2',

        // DESIGN.md — Text / Ink tokens
        ink: {
          DEFAULT: '#1a1a1a',
          deep: '#000000',
          soft: '#292929',
        },
        'on-ink': '#ffffff',
        'on-primary': '#ffffff',
        charcoal: '#3d3d3d',
        graphite: '#636363',

        // DESIGN.md — Hairlines (borders)
        hairline: {
          DEFAULT: '#e8e8e8',
          strong: '#c2c2c2',
        },

        // DESIGN.md — Link tokens
        link: {
          DEFAULT: '#024ad8',
          pressed: '#0e3191',
        },

        // DESIGN.md — Bloom family (sale / error / discount emphasis)
        bloom: {
          coral: '#ff5050',
          rose: '#f9d4d2',
          deep: '#b3262b',
          wine: '#5a1313',
        },

        // DESIGN.md — Storm family (printer-plan / infographic accents)
        storm: {
          mist: '#8ebdce',
          sea: '#7fadbe',
          deep: '#356373',
        },

        // DESIGN.md — Semantic
        error: '#b3262b',
      },

      // --- DESIGN.md — typography ------------------------------------------
      fontFamily: {
        // Forma DJR Micro is proprietary; Inter is the documented substitute.
        sans: [
          'Forma DJR Micro',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'source-code-pro',
          'Menlo',
          'Monaco',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },

      // DESIGN.md typography hierarchy — every entry carries its
      // canonical line-height + weight + letter-spacing per the spec.
      fontSize: {
        'display-xxl': ['72px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],
        'display-xl':  ['56px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],
        'display-lg':  ['44px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],
        'display-md':  ['32px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],
        'display-sm':  ['24px', { lineHeight: '1.17', letterSpacing: '0', fontWeight: '500' }],
        'display-xs':  ['20px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],

        'body-lg':       ['18px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '400' }],
        'body-md':       ['16px', { lineHeight: '1.38', letterSpacing: '0', fontWeight: '400' }],
        'body-emphasis': ['16px', { lineHeight: '1.38', letterSpacing: '0', fontWeight: '500' }],

        'caption-md':   ['14px',   { lineHeight: '1.5',  letterSpacing: '0',      fontWeight: '400' }],
        'caption-sm':   ['12px',   { lineHeight: '1.33', letterSpacing: '0',      fontWeight: '400' }],
        'caption-bold': ['14px',   { lineHeight: '1.3',  letterSpacing: '0',      fontWeight: '700' }],

        'link-md':   ['16px',   { lineHeight: '1.38', letterSpacing: '0',       fontWeight: '500' }],
        'button-md': ['14px',   { lineHeight: '1.4',  letterSpacing: '0.7px',   fontWeight: '600' }],
        'button-sm': ['12.6px', { lineHeight: '1',    letterSpacing: '0.126px', fontWeight: '700' }],
        'price-md':  ['24px',   { lineHeight: '1.17', letterSpacing: '0',       fontWeight: '500' }],
      },

      // --- DESIGN.md — spacing (t-shirt + section rhythm) ------------------
      // Numeric Tailwind defaults (p-1, p-2 …) stay available.
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        xxl: '32px',
        section: '80px',
      },

      // --- DESIGN.md — rounded scale --------------------------------------
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '3px',
        md: '4px',    // DESIGN.md rounded.md — buttons, inputs
        lg: '8px',    // DESIGN.md rounded.lg — badges, category-icon cards
        xl: '16px',   // DESIGN.md rounded.xl — product cards, photo frames
        '2xl': '16px',
        pill: '9999px',
        full: '9999px',
      },

      // --- DESIGN.md — elevation ------------------------------------------
      boxShadow: {
        // Level 1 is `border` not shadow → use Tailwind's `border-hairline`.
        // Level 2 — Soft Lift (product cards, pricing tiers, story tiles)
        'soft-lift': '0 2px 8px rgba(26, 26, 26, 0.08)',
        // Level 3 — Floating Modal (drawers, sheets, image zoom)
        floating: '0 8px 24px rgba(26, 26, 26, 0.12)',
      },

      // --- DESIGN.md — heights for chrome --------------------------------
      // utility-strip 36px, nav-bar-top 64px (per components.*)
      height: {
        'utility-strip': '36px',
        'nav-bar': '64px',
        'control': '44px', // button-primary, text-input
        'control-sm': '40px', // text-input-search
      },

      // --- shadcn / Radix animation defaults (unchanged) ------------------
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
