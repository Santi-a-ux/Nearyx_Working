import type { Config } from "tailwindcss"

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FDFBD4",
        surface: "#FFFFFF",
        surface2: "#FFFFFF",
        accent: "#C4783A",
        accent2: "#A35F28",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Playfair Display", "serif"],
        sans: ["Playfair Display", "serif"],
        main: ["Playfair Display", "serif"],
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["15px", "24px"],
        lg: ["18px", "28px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["30px", "36px"],
        "4xl": ["36px", "43px"],
        "5xl": ["48px", "50px"],
      },
      boxShadow: {
        glow: "0 0 8px rgba(196, 120, 58, 0.25)",
        "glow-sm": "0 0 4px rgba(196, 120, 58, 0.15)",
        "glow-lg": "0 0 16px rgba(196, 120, 58, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "accent-glow": "radial-gradient(ellipse at top center, rgba(196, 120, 58, 0.15), transparent 70%)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
