/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                // Tối ưu Slate để đảm bảo độ tương phản AAA nếu cần
                slate: {
                    400: '#94a3b8', // Đủ sáng trên nền tối
                    800: '#1e293b', 
                    900: '#0f172a',
                },
                gaming: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },
                accent: {
                    gold: '#fbbf24',
                    cyan: '#06b6d4',
                    emerald: '#10b981',
                },
                neonPink: {
                    50: '#fdf2f8',
                    200: '#fbcfe8',
                    500: '#ec4899',
                    700: '#be185d',
                    900: '#831843',
                }
            },
            backgroundImage: {
                'gradient-gaming': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                'gradient-gaming-card': 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #4c1d95 100%)',
            }
        },
    },
    plugins: [],
}