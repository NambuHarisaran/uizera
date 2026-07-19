import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Exact custom brand tokens
        uipath: {
          orange: "#FA4616",
          hover: "#E53E12",
          blue: "#0067DF",
          gold: "#FFB40E",
          success: "#34DE69",
          bg: "#F1F6F8",
          text: "#000000",
          mutedText: "#58595B",
        },
        brand: {
          50: "#fff5f2",
          100: "#ffe8e1",
          200: "#ffd0c2",
          300: "#ffab92",
          400: "#ff7a54",
          500: "#FA4616", // Primary
          600: "#E53E12", // Hover
          700: "#c22a08",
          800: "#9c250e",
          900: "#7e2310",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          500: "#FFB40E",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          500: "#34DE69",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(0, 103, 223, 0.08)",
        "card-hover": "0 20px 40px -15px rgba(250, 70, 22, 0.15)",
        primary: "0 8px 24px -6px rgba(250, 70, 22, 0.4)",
        secondary: "0 8px 24px -6px rgba(0, 103, 223, 0.35)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
