/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F6F1E8',
          50: '#FBF8F1',
          100: '#F6F1E8',
          200: '#EFE6D6',
          300: '#E6D9C3',
        },
        paper: '#FFFDF8',
        ink: {
          DEFAULT: '#1D2923',
          soft: '#44534A',
          muted: '#6E7C72',
          faint: '#9AA79C',
        },
        pine: {
          dark: '#143024',
          DEFAULT: '#1F4A36',
          600: '#2C6A4F',
          700: '#245741',
          light: '#E4EDE7',
        },
        cialco: {
          DEFAULT: '#0B3D6E',
          500: '#1E5AA8',
          600: '#164C8C',
          700: '#0B3D6E',
          50: '#EEF4FA',
          light: '#E3ECF5',
        },
        brass: {
          DEFAULT: '#A4863F',
          light: '#C9A961',
          dark: '#8A6F2F',
          50: '#F7F1E2',
        },
        hairline: '#E9E1D2',
        sand: '#D8CCB8',
        terracotta: {
          DEFAULT: '#B4472E',
          light: '#F4E0D9',
        },
        moss: {
          DEFAULT: '#2F7D5A',
          light: '#E3EFE7',
        },
        harvest: {
          DEFAULT: '#C9962C',
          light: '#F6EBD7',
        },
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(29,41,35,0.05), 0 4px 16px -6px rgba(29,41,35,0.08)',
        lift: '0 2px 4px rgba(29,41,35,0.06), 0 16px 40px -12px rgba(29,41,35,0.18)',
        brass: '0 1px 0 rgba(255,255,255,0.65) inset, 0 8px 24px -8px rgba(164,134,63,0.35)',
        insetline: 'inset 0 1px 0 rgba(255,255,255,0.5)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
