import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        sand: '#f8f5f1',
        brand: '#0f766e',
        accent: '#f97316',
      },
    },
  },
  plugins: [],
};

export default config;
