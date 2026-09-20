import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#08090B",
        surface: {
          DEFAULT: "#101216",
          raised: "#15171C",
          high: "#1B1E24",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
          faint: "rgba(255,255,255,0.05)",
        },
        ink: {
          DEFAULT: "#F4F5F7",
          muted: "#9AA0AA",
          faint: "#6B7280",
          ghost: "#464C56",
        },
        acm: {
          DEFAULT: "#E5342B",
          bright: "#FF4C42",
          deep: "#B4211A",
          wash: "rgba(229,52,43,0.12)",
        },
        signal: {
          live: "#4ADE80",
          work: "#FBBF24",
          idea: "#60A5FA",
        },
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
