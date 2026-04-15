import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      fontFamily: {
        display: ['"Orbitron"', "sans-serif"],
        body: ['"Exo 2"', "sans-serif"],
      },
      colors: {
        void: "#030008",
        neon: {
          blue: "#00d4ff",
          purple: "#a855f7",
          pink: "#ec4899",
          green: "#22d3ee",
          orange: "#f97316",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { textShadow: "0 0 10px #00d4ff, 0 0 20px #00d4ff" },
          "100%": { textShadow: "0 0 20px #a855f7, 0 0 40px #a855f7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
