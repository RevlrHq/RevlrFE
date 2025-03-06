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
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
