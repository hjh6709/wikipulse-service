import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#3B82F6",
        navy: "#0B0E14",
        surface: "#161B22",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        "blue-glow": "0 0 0 1px rgba(59,130,246,0.10), 0 4px 20px rgba(59,130,246,0.08)",
        "blue-glow-hover": "0 0 0 1px rgba(59,130,246,0.18), 0 4px 28px rgba(59,130,246,0.14)",
        "blue-btn": "0 0 20px rgba(59,130,246,0.35)",
        "blue-btn-hover": "0 0 32px rgba(59,130,246,0.55)",
      },
    },
  },
  plugins: [],
};
export default config;
