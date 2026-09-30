import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Direct Spot Palette Tokens
        'amber-gold': 'rgb(var(--amber-gold-rgb) / <alpha-value>)',
        'blaze-orange': 'rgb(var(--blaze-orange-rgb) / <alpha-value>)',
        'neon-pink': 'rgb(var(--neon-pink-rgb) / <alpha-value>)',
        'blue-violet': 'rgb(var(--blue-violet-rgb) / <alpha-value>)',
        'azure-blue': 'rgb(var(--azure-blue-rgb) / <alpha-value>)',

        // Washed-out pastels for minimalist tags & chips
        pastel: {
          gold: {
            bg: 'var(--amber-gold-pastel-bg)',
            text: 'var(--amber-gold-pastel-text)',
            border: 'var(--amber-gold-pastel-border)',
          },
          orange: {
            bg: 'var(--blaze-orange-pastel-bg)',
            text: 'var(--blaze-orange-pastel-text)',
            border: 'var(--blaze-orange-pastel-border)',
          },
          pink: {
            bg: 'var(--neon-pink-pastel-bg)',
            text: 'var(--neon-pink-pastel-text)',
            border: 'var(--neon-pink-pastel-border)',
          },
          violet: {
            bg: 'var(--blue-violet-pastel-bg)',
            text: 'var(--blue-violet-pastel-text)',
            border: 'var(--blue-violet-pastel-border)',
          },
          blue: {
            bg: 'var(--azure-blue-pastel-bg)',
            text: 'var(--azure-blue-pastel-text)',
            border: 'var(--azure-blue-pastel-border)',
          },
        },

        // Warm Monochrome Surfaces
        surface: {
          app: 'var(--surface-app)',
          card: 'var(--surface-card)',
          subtle: 'var(--surface-subtle)',
          canvas: 'var(--surface-canvas)',
        },
        foreground: {
          primary: 'var(--foreground-primary)',
          secondary: 'var(--foreground-secondary)',
          muted: 'var(--foreground-muted)',
          inverse: 'var(--foreground-inverse)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          ring: 'var(--color-focus-ring)',
        },
        feedback: {
          success: 'var(--feedback-success)',
          warning: 'var(--feedback-warning)',
          caution: 'var(--feedback-caution)',
          error: 'var(--feedback-error)',
        },
      },
      fontFamily: {
        sans: [
          '"Geist Sans"',
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          '"SF Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'monospace',
        ],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        subtle: '0 1px 3px rgba(0, 0, 0, 0.05)',
        none: 'none',
      },
      transitionTimingFunction: {
        'emil-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'emil-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'emil-spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        'instant': '120ms',
        'snappy': '160ms',
        'normal': '200ms',
        'modal': '220ms',
        '140': '140ms',
        '160': '160ms',
      },
    },
  },

  plugins: [],
};

export default config;
