import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "card-bg": "#1e222d", // TradingView dark theme card
                "main-bg": "#131722", // TradingView dark theme bg
                "border-color": "#2a2e39",
                "primary": "#2962ff",
                "success": "#26a69a", // Green
                "danger": "#ef5350", // Red
            }
        },
    },
    plugins: [],
};
export default config;
