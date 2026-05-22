import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A1733",
          950: "#070f24",
          900: "#0A1733",
          800: "#0f1d3d",
          700: "#1a2a55",
        },
        cream: {
          DEFAULT: "#F1ECE0",
          50: "#FBF8F1",
          100: "#F5F0E5",
          200: "#F1ECE0",
          300: "#E8E0CE",
        },
        gold: {
          DEFAULT: "#D4A24C",
          400: "#E0B364",
          500: "#D4A24C",
          600: "#B8893A",
        },
        muted: {
          DEFAULT: "#8A8A8A",
          light: "#9CA0AD",
          dark: "#5A6175",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.22em",
      },
      maxWidth: {
        container: "1240px",
        prose: "640px",
      },
      animation: {
        marquee: "marquee 35s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
