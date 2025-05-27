import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // If you are exclusively using the app router, you can remove the ./src/pages line
    // './src/pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': {
          light: '#E0F2FE',   // Sky 100
          DEFAULT: '#0EA5E9', // Sky 500
          medium: '#0284C7',  // Sky 600
          dark: '#0369A1',    // Sky 700
        },
        'brand-secondary': {
          light: '#FCE7F3',   // Pink 100
          DEFAULT: '#EC4899', // Pink 500
          medium: '#DB2777',   // Pink 600
          dark: '#BE185D',    // Pink 700
        },
        'brand-accent': {
          DEFAULT: '#F59E0B', // Amber 500
        },
        'success': '#10B981',     // Emerald 500 (was Green 500)
        'warning': '#FBBF24',     // Amber 400
        'error': '#EF4444',       // Red 500
        'info': '#3B82F6',        // Blue 500
        'neutral-text': '#374151',    // Gray 700
        'neutral-text-light': '#6B7280', // Gray 500 (for slightly lighter text)
        'neutral-bg': '#F9FAFB',      // Gray 50
        'neutral-bg-hover': '#F3F4F6',// Gray 100 (for hover on light backgrounds)
        'neutral-border': '#E5E7EB',  // Gray 200
        'neutral-border-hover': '#D1D5DB',// Gray 300
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', "Noto Sans", 'sans-serif', "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"],
        // If you want a specific heading font, uncomment and set it up:
        // heading: ['Montserrat', 'ui-sans-serif', 'system-ui', ...],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // You can add custom keyframes and animations here if needed later
      // keyframes: {
      //   fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      // },
      // animation: {
      //   fadeIn: 'fadeIn 0.5s ease-in-out',
      // },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'), // <<< ADDED THIS PLUGIN
    // require('@tailwindcss/aspect-ratio'), // Useful for responsive embeds if needed
  ],
};
export default config;