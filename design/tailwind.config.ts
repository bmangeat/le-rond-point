import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ─── Colors ───────────────────────────────────────────────────
      colors: {
        // Brand
        primary: {
          DEFAULT: "hsl(var(--primary))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Statuts de disponibilité
        available: {
          DEFAULT: "hsl(var(--available))",
          light: "hsl(var(--available-light))",
          foreground: "hsl(var(--available-foreground))",
        },
        busy: {
          DEFAULT: "hsl(var(--busy))",
          light: "hsl(var(--busy-light))",
          foreground: "hsl(var(--busy-foreground))",
        },
        // Surfaces
        background: "hsl(var(--background))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
        },
        // Texte
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        subtle: "hsl(var(--subtle))",
        // Bordures
        border: "hsl(var(--border))",
        // shadcn/ui tokens (requis)
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Couleurs des membres (palette 12 couleurs)
        member: {
          1: "#3B7BF8",  // Blue
          2: "#10B981",  // Emerald
          3: "#8B5CF6",  // Violet
          4: "#F43F5E",  // Rose
          5: "#F59E0B",  // Amber
          6: "#06B6D4",  // Cyan
          7: "#F97316",  // Orange
          8: "#14B8A6",  // Teal
          9: "#EC4899",  // Pink
          10: "#6366F1", // Indigo
          11: "#84CC16", // Lime
          12: "#0EA5E9", // Sky
        },
      },

      // ─── Typography ───────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px", letterSpacing: "0.01em" }],
        xs:   ["13px", { lineHeight: "18px" }],
        sm:   ["15px", { lineHeight: "22px" }],
        base: ["17px", { lineHeight: "26px" }],
        lg:   ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        xl:   ["24px", { lineHeight: "32px", letterSpacing: "-0.015em" }],
        "2xl":["28px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
      },

      // ─── Border Radius ────────────────────────────────────────────
      borderRadius: {
        none:  "0",
        sm:    "8px",
        DEFAULT:"12px",
        md:    "12px",
        lg:    "16px",
        xl:    "20px",
        "2xl": "24px",
        "3xl": "32px",
        full:  "9999px",
      },

      // ─── Shadows ──────────────────────────────────────────────────
      boxShadow: {
        xs:   "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        sm:   "0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        DEFAULT:"0 2px 8px 0 rgb(0 0 0 / 0.08), 0 1px 3px -1px rgb(0 0 0 / 0.04)",
        md:   "0 4px 16px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.04)",
        lg:   "0 8px 24px 0 rgb(0 0 0 / 0.10), 0 4px 8px -2px rgb(0 0 0 / 0.06)",
        xl:   "0 16px 48px 0 rgb(0 0 0 / 0.12), 0 8px 16px -4px rgb(0 0 0 / 0.08)",
        // Ombre bleue pour les éléments primary
        primary: "0 4px 16px 0 rgb(59 123 248 / 0.25)",
        none:  "none",
      },

      // ─── Spacing supplémentaire ───────────────────────────────────
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "nav-height":  "64px",  // Bottom tab bar
        "fab-offset":  "80px",  // Espace sous le FAB
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
