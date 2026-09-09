import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // EduSphere Design Tokens
        bg: {
          base: '#09090B',
          card: '#111827',
          sidebar: '#0F172A',
          elevated: '#1E293B',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.15)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        accent: {
          blue: '#2563EB',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        // Light theme
        light: {
          bg: '#FFFFFF',
          card: '#F8FAFC',
          sidebar: '#F1F5F9',
          border: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Geist', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37,99,235,0.3)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.3)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'glow-green': '0 0 20px rgba(16,185,129,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, #1e1b4b 0px, transparent 50%), radial-gradient(at 80% 0%, #0c4a6e 0px, transparent 50%), radial-gradient(at 0% 50%, #0f172a 0px, transparent 50%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
        'card-gradient': 'linear-gradient(135deg, #111827, #1E293B)',
        'hero-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0C4A6E 100%)',
        'blue-purple': 'linear-gradient(135deg, #2563EB, #8B5CF6)',
        'purple-pink': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
        'cyan-blue': 'linear-gradient(135deg, #06B6D4, #2563EB)',
        'success-gradient': 'linear-gradient(135deg, #10B981, #059669)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37,99,235,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(37,99,235,0.6)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}

export default config
