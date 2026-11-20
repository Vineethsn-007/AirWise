import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sky: {
          ink: '#0C2233',
          deep: '#123A56',
          mid: '#2A6F97',
          soft: '#E8F4FA',
          mist: '#F4F9FC',
        },
        severity: {
          good: '#0E6B4F',
          goodBg: '#E4F5EC',
          moderate: '#7A5706',
          moderateBg: '#FBF1CF',
          sensitive: '#8A4508',
          sensitiveBg: '#FBE6D4',
          unhealthy: '#A12323',
          unhealthyBg: '#F8DFDF',
          very: '#6B2E86',
          veryBg: '#F0E4F6',
          hazardous: '#7A1830',
          hazardousBg: '#F5DDE4',
        },
        paper: '#FBFCFD',
      },
      fontFamily: {
        sans: ['"Avenir Next"', 'Avenir', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Iowan Old Style"', '"Palatino Linotype"', 'Georgia', 'serif'],
      },
      boxShadow: {
        capsule: '0 10px 30px -18px rgba(12, 34, 51, 0.45)',
        card: '0 20px 50px -32px rgba(12, 34, 51, 0.5)',
      },
      borderRadius: {
        capsule: '999px',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 420ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
