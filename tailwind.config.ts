import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // For Next.js 12 (pages router) - can be removed if exclusively using app router
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // For Next.js 13+ (app router)
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - customize these to fit your app's identity
        'brand-primary': {
          light: '#E0F2FE', // Lightest shade for backgrounds or highlights
          DEFAULT: '#0EA5E9', // Main primary color (e.g., buttons, links) - Sky 500
          medium: '#0284C7', // A slightly darker shade - Sky 600
          dark: '#0369A1',   // Darker shade for hover states or text - Sky 700
        },
        'brand-secondary': {
          light: '#FCE7F3',
          DEFAULT: '#EC4899', // Main secondary color (e.g., accents) - Pink 500
          medium: '#DB2777',
          dark: '#BE185D',
        },
        'brand-accent': {
          DEFAULT: '#F59E0B', // Amber 500 - for callouts, notifications
        },
        // Semantic colors - for UI states
        'success': '#10B981', // Green 500
        'warning': '#FBBF24', // Amber 400
        'error': '#EF4444',   // Red 500
        'info': '#3B82F6',    // Blue 500
        // Neutral colors for text, backgrounds, borders
        'neutral-text': '#374151', // Gray 700
        'neutral-bg': '#F9FAFB',   // Gray 50
        'neutral-border': '#E5E7EB', // Gray 200
      },
      fontFamily: {
        // Add custom fonts here if you have them
        // sans: ['Inter', 'sans-serif'], // Example: using Inter
        // heading: ['Montserrat', 'sans-serif'], // Example: a different font for headings
      },
      // Extend other theme properties as needed (spacing, borderRadius, etc.)
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // For mind map potentially
      // keyframes: {
      //   fadeIn: {
      //     '0%': { opacity: '0' },
      //     '100%': { opacity: '1' },
      //   },
      // },
      // animation: {
      //   fadeIn: 'fadeIn 0.5s ease-in-out',
      // },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // A plugin for better default form styling
    // Add other Tailwind plugins if needed (e.g., typography, aspect-ratio)
  ],
};
export default config;