import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0d0d0d",
        paper: "#f2f0ef",
        card: "#fdfcfc",
        brand: {
          DEFAULT: "#8B1A2B",
          hover: "#a01f33",
          light: "#e08a99",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        rise: "rise .35s ease both",
      },
      boxShadow: {
        panel: "0 14px 34px rgba(0,0,0,.42)",
        panelLg: "0 20px 50px rgba(0,0,0,.55)",
        cta: "0 10px 30px rgba(139,26,43,.4)",
      },
    },
  },
  plugins: [],
};

export default config;
