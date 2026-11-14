import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * STTNS Tailwind — Étape 1 : tokens cliniques (zinc + sémantique).
 * Classes : bg-background, text-foreground, border-border, bg-primary, text-destructive, etc.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          foreground: "rgb(var(--info-foreground) / <alpha-value>)",
        },
        /* Compat — surfaces legacy jusqu'à Étape 2+ */
        sttns: {
          accent: "#059669",
          "accent-hover": "#047857",
          cream: "#f8fafc",
          sidebar: "#f1f5f9",
          muted: "#475569",
        },
      },
      borderRadius: {
        sttns: "var(--sttns-radius)",
      },
      boxShadow: {
        elevated: "var(--sttns-shadow-elevated)",
      },
      fontSize: {
        body: ["var(--sttns-text-body)", { lineHeight: "1.375" }],
        "page-title": ["var(--sttns-text-page-title)", { lineHeight: "1.3" }],
        kpi: ["var(--sttns-text-kpi)", { lineHeight: "1.2" }],
      },
      spacing: {
        page: "var(--sttns-space-page)",
        section: "var(--sttns-space-section)",
        row: "var(--sttns-row-h)",
      },
      fontFamily: {
        /* Inter uniquement — hiérarchie clinique (font-display = sans) */
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};

export default config;
