import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // SalonApp.pro logo / manifest (theme #C8826A, bg #FFF8F5) — aligned with public Bloom template
        brand: {
          50: "#FFF8F5",
          100: "#F5EBE4",
          200: "#E8D5CC",
          300: "#D4B8A8",
          400: "#D49A78",
          500: "#C8826A",
          600: "#B36B52",
          700: "#8F5644",
          800: "#6B4032",
          900: "#3D2B1F",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
        "card-lg": "0 4px 6px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [typography],
};
export default config;
