/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
        // "./app/**/*.{js,ts,jsx,tsx,mdx}",
        // "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        // "./components/**/*.{js,ts,jsx,tsx,mdx}",

        // Or if using `src` directory:
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['var(--font-inter)'],
                montserrat: ['var(--font-montserrat)'],
            },
            keyframes: {
                'caret-blink': {
                    '0%,70%,100%': {
                        opacity: '1',
                    },
                    '20%,50%': {
                        opacity: '0',
                    },
                },
                'accordion-down': {
                    from: {
                        height: '0',
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                    to: {
                        height: '0',
                    },
                },
            },
            animation: {
                'caret-blink': 'caret-blink 1.25s ease-out infinite',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            spacing: {
                52: '3.25rem',
            },
            lineHeight: {
                17: '17.08px',
                26: '26.4px',
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
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
                chart: {
                    1: 'hsl(var(--chart-1))',
                    2: 'hsl(var(--chart-2))',
                    3: 'hsl(var(--chart-3))',
                    4: 'hsl(var(--chart-4))',
                    5: 'hsl(var(--chart-5))',
                },
                chit: {
                    primary: '#2A1A6E',
                    'white-smoke': '#F5F4F9',
                    'milk-white': '#FCFCFC',
                    'link-water': '#E3DEF7',
                    'ship-gray': '#434343',
                    'black-cow': '#474747',
                    'ash-gray': '#B8B8B8',
                    'carbon-grey': '#5F5F5F',
                    'silver-chalice': '#ACACAC',
                    gainsboro: '#E0E0E0',
                    woodsmoke: '#090815',
                    'baltic-sea': '#292929',
                    indigo: '#382395',
                },
                revlr: {
                    'primary-blue': '#0066FF',
                    'primary-grey': '#F5F5F5',
                    'primary-yellow': '#FFD700',
                    'dark-bg': '#0A0A0B',
                    'dark-card': '#1A1A1B',
                    'dark-border': '#2D2D30',
                    'accent-purple': '#8B5CF6',
                    'accent-green': '#10B981',
                    'accent-orange': '#F59E0B',
                    'accent-pink': '#EC4899',
                    'accent-cyan': '#06B6D4',
                },
            },
            backgroundImage: {
                'revlr-gradient':
                    'linear-gradient(135deg, #0066FF 0%, #8B5CF6 100%)',
                'revlr-gradient-reverse':
                    'linear-gradient(135deg, #8B5CF6 0%, #0066FF 100%)',
                'revlr-warm-gradient':
                    'linear-gradient(135deg, #F59E0B 0%, #FFD700 100%)',
                'revlr-cool-gradient':
                    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                'revlr-sunset-gradient':
                    'linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%)',
                'revlr-ocean-gradient':
                    'linear-gradient(135deg, #0066FF 0%, #06B6D4 50%, #10B981 100%)',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
