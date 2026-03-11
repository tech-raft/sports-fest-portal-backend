/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: {
                    green: '#39FF14',
                    blue: '#00F0FF',
                    pink: '#FF2D95',
                    yellow: '#FFE600',
                    purple: '#BF00FF',
                },
                dark: {
                    900: '#0A0A0F',
                    800: '#12121A',
                    700: '#1A1A25',
                    600: '#222230',
                    500: '#2A2A3A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
                    '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
