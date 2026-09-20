import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Channel-based so opacity modifiers work across both themes; the
        // values themselves live in globals.css.
        void: "rgb(var(--void) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          high: "rgb(var(--surface-high) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
          ghost: "rgb(var(--ink-ghost) / <alpha-value>)",
        },
        acm: {
          DEFAULT: "rgb(var(--acm) / <alpha-value>)",
          bright: "rgb(var(--acm-bright) / <alpha-value>)",
          deep: "rgb(var(--acm-deep) / <alpha-value>)",
          solid: "rgb(var(--acm-solid) / <alpha-value>)",
          wash: "rgb(var(--acm) / 0.1)",
        },
        signal: {
          live: "rgb(var(--signal-live) / <alpha-value>)",
          work: "rgb(var(--signal-work) / <alpha-value>)",
          idea: "rgb(var(--signal-idea) / <alpha-value>)",
        },
        // Hairlines carry their own alpha, so no modifier support is needed.
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
          faint: "var(--line-faint)",
        },
        scrim: "var(--scrim)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 9.6vw, 8.5rem)", { lineHeight: "0.88", letterSpacing: "-0.045em", fontWeight: "600" }],
        "display-lg": ["clamp(2.5rem, 7.5vw, 6rem)", { lineHeight: "0.92", letterSpacing: "-0.04em", fontWeight: "600" }],
        "display-page": ["clamp(2.25rem, 6.2vw, 4.75rem)", { lineHeight: "0.94", letterSpacing: "-0.038em", fontWeight: "600" }],
        "display-md": ["clamp(2rem, 5vw, 3.75rem)", { lineHeight: "0.96", letterSpacing: "-0.035em", fontWeight: "600" }],
        "display-sm": ["clamp(1.6rem, 3.2vw, 2.5rem)", { lineHeight: "1.04", letterSpacing: "-0.028em", fontWeight: "600" }],
        label: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.16em", fontWeight: "500" }],
        micro: ["0.625rem", { lineHeight: "1", letterSpacing: "0.18em", fontWeight: "500" }],
      },
      maxWidth: {
        shell: "88rem",
        prose: "38rem",
      },
      spacing: {
        gutter: "clamp(1.25rem, 4vw, 4.5rem)",
        section: "clamp(5rem, 11vw, 10rem)",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "6px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        inout: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.82)" },
        },
        dash: {
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        sweep: "sweep 2.6s cubic-bezier(0.4,0,0.2,1) infinite",
        "pulse-dot": "pulseDot 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
