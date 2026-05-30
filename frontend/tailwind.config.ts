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
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        brand: {
          DEFAULT: "var(--brand-action)",
          hover: "var(--brand-hover)",
          soft: "var(--brand-soft)",
          dark: "var(--brand-dark)",
        },
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          900: "var(--neutral-900)",
        },
        semantic: {
          success: "var(--semantic-success)",
          error: "var(--semantic-error)",
          warning: "var(--semantic-warning)",
          info: "var(--semantic-info)",
        },
      },
      fontFamily: {
        display: ["var(--font-heading)", "Manrope", "sans-serif"],
        heading: ["var(--font-heading)", "Manrope", "sans-serif"],
        body: ["var(--font-body)", "Lato", "sans-serif"],
        sans: ["var(--font-body)", "Lato", "sans-serif"],
        main: ["var(--font-body)", "Lato", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["12px", "18px"],
        sm: ["14px", "22px"],
        base: ["16px", "26px"],
        lg: ["18px", "28px"],
        xl: ["20px", "30px"],
        "2xl": ["24px", "34px"],
        "3xl": ["30px", "40px"],
        "4xl": ["38px", "48px"],
        "5xl": ["52px", "60px"],
      },
      boxShadow: {
        glow: "0 12px 32px rgba(0, 88, 255, 0.24)",
        "glow-sm": "0 6px 18px rgba(0, 88, 255, 0.16)",
        "glow-lg": "0 20px 48px rgba(0, 88, 255, 0.32)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "accent-glow": "radial-gradient(ellipse at top center, rgba(0, 88, 255, 0.14), transparent 70%)",
        "hero-sky": "linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-peach) 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
