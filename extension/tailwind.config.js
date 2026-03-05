/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/popup/**/*.{html,tsx,ts}',
    './src/options/**/*.{html,tsx,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        pablo: {
          bg: '#0a0b10',
          surface: '#0b0d12',
          elevated: '#131722',
          input: '#151923',
          primary: '#7aa2f7',
          accent: '#9b74ff',
          text: '#f4f7fb',
          'text-secondary': '#d9dee7',
          muted: '#a0a8b8',
          dim: '#737c8d',
          border: 'rgba(255, 255, 255, 0.12)',
          'border-hover': 'rgba(255, 255, 255, 0.20)',
          success: '#28c840',
          error: '#ef4444',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 16px rgba(122, 162, 247, 0.15)',
        'glow-accent': '0 0 16px rgba(155, 116, 255, 0.12)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
