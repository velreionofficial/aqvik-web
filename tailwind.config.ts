import type { Config } from "tailwindcss";

/**
 * AQVIK design tokens.
 *
 * The palette is intentionally narrow: two near-black planes, one hairline,
 * two text weights and a single blue. Blue is reserved for interactive
 * affordances and the ledger rail — never for decoration.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", sm: "2rem", lg: "2.5rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "#050816",
        surface: {
          DEFAULT: "#0B1220",
          raised: "#0E1729",
        },
        foreground: "#FFFFFF",
        muted: {
          DEFAULT: "#A8B3CF",
          dim: "#7E8AA6",
        },
        primary: {
          DEFAULT: "#4F7CFF",
          soft: "#88A7FF",
          foreground: "#050816",
        },
        hairline: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.14)",
        },
        ring: "#4F7CFF",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 7vw, 5.25rem)", { lineHeight: "0.98", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 3.75rem)", { lineHeight: "1.04", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(1.75rem, 3.2vw, 2.5rem)", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        "display-sm": ["clamp(1.35rem, 2.2vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        lead: ["clamp(1.0625rem, 1.4vw, 1.1875rem)", { lineHeight: "1.65", letterSpacing: "-0.01em" }],
        label: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.18em" }],
      },
      maxWidth: {
        prose: "68ch",
        measure: "58ch",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        raised: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -32px rgba(0,0,0,0.9)",
        focus: "0 0 0 2px #050816, 0 0 0 4px #4F7CFF",
      },
      keyframes: {
        "rail-draw": {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "rail-draw": "rail-draw 1.1s cubic-bezier(0.16,1,0.3,1) forwards",
        "accordion-down": "accordion-down 0.24s cubic-bezier(0.16,1,0.3,1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.16,1,0.3,1)",
      },
      transitionTimingFunction: {
        entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
