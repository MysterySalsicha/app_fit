import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tema HunterFit — Solo Leveling inspired
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Ranks
        rank: {
          e: '#9ca3af',       // cinza
          d: '#22c55e',       // verde
          c: '#3b82f6',       // azul
          b: '#a855f7',       // roxo
          a: '#f97316',       // laranja
          s: '#eab308',       // dourado
          national: '#ef4444',// vermelho
        },
        // XP / Mana
        xp: '#6366f1',
        mana: '#8b5cf6',
        // Shadows
        shadow: {
          igris: '#dc2626',
          tank: '#16a34a',
          iron: '#ca8a04',
          fang: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'xp-fill': 'xpFill 1s ease-out forwards',
        'level-up': 'levelUp 0.8s ease-in-out',
        'rank-glow': 'rankGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        xpFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--xp-percent)' },
        },
        levelUp: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        rankGlow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px var(--glow-color)' },
          '50%': { boxShadow: '0 0 20px 6px var(--glow-color)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
