import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "rgb(var(--ground) / <alpha-value>)",
        "ground-deep": "rgb(var(--ground-deep) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        "panel-raised": "rgb(var(--panel-raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        "signal-dim": "rgb(var(--signal-dim) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Cascadia Code",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        hairline: "0px",
        panel: "6px",
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px rgb(var(--line))",
        pop: "0 10px 24px -12px rgb(0 0 0 / 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;