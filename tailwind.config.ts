import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': {
          light: '#E0F2FE',
          DEFAULT: '#0EA5E9',
          medium: '#0284C7',
          dark: '#0369A1',
        },
        'brand-secondary': {
          light: '#FCE7F3',
          DEFAULT: '#EC4899',
          medium: '#DB2777',
          dark: '#BE185D',
        },
        'brand-accent': {
          DEFAULT: '#F59E0B',
        },
        success: '#10B981',
        warning: '#FBBF24',
        error: '#EF4444',
        info: '#3B82F6',
        'neutral-text': '#374151',
        'neutral-text-light': '#6B7280',
        'neutral-bg': '#F9FAFB',
        'neutral-bg-hover': '#F3F4F6',
        'neutral-border': '#E5E7EB',
        'neutral-border-hover': '#D1D5DB',
      },
      fontFamily: {
        // Use your custom HeroNew for body text
        sans: ['HeroNew', ...defaultTheme.fontFamily.sans],
        // New heading family for <h1> (NewSpirit SemiBold)
        heading: ['NewSpirit', ...defaultTheme.fontFamily.sans],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
