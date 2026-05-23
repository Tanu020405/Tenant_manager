/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        headline: ['Sora', 'system-ui', 'sans-serif'],
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Surface Hierarchy
        surface: 'var(--surface)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',

        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',

        // Primary Color System
        primary: 'var(--primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary': 'var(--on-primary)',
        'on-primary-container': 'var(--on-primary-container)',
        'primary-fixed': 'var(--primary-fixed)',
        'primary-fixed-dim': 'var(--primary-fixed-dim)',

        // Secondary
        secondary: 'var(--secondary)',
        'secondary-container': 'var(--secondary-container)',
        'on-secondary': 'var(--on-secondary)',
        'on-secondary-container': 'var(--on-secondary-container)',
        'secondary-fixed': 'var(--secondary-fixed)',

        // Tertiary
        tertiary: 'var(--tertiary)',
        'tertiary-container': 'var(--tertiary-container)',
        'on-tertiary': 'var(--on-tertiary)',
        'on-tertiary-container': 'var(--on-tertiary-container)',
        'tertiary-fixed': 'var(--tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--tertiary-fixed-dim)',

        // Error/Status
        error: 'var(--error)',
        'error-container': 'var(--error-container)',
        'on-error': 'var(--on-error)',
        'on-error-container': 'var(--on-error-container)',

        // Other
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        background: 'var(--surface)',
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['2.8rem', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-md': ['1.75rem', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-sm': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-lg': ['1.375rem', { lineHeight: '1.4', fontWeight: '600' }],
        'title-md': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        'title-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'label-lg': ['0.75rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
        'label-md': ['0.625rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        'xs': '0.375rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'ambient-sm': '0 2px 8px rgba(25, 28, 30, 0.03)',
        'ambient': '0 8px 24px rgba(25, 28, 30, 0.05)',
        'ambient-lg': '0 12px 32px rgba(25, 28, 30, 0.08)',
        'glass': '0 8px 32px rgba(25, 28, 30, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-sm': '12px',
      },
    },
  },
  plugins: [],
};
