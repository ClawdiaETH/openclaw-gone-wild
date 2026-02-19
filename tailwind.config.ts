import type { Config } from 'tailwindcss';

export default { // should be typed Config but ok
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "oklch(0.11 0.01 260)",
        "bg-card": "oklch(0.15 0.01 260)",
        "bg-card-hover": "oklch(0.18 0.015 260)",
        border: "oklch(0.22 0.01 260)",
        text: "oklch(0.92 0 0)",
        muted: "oklch(0.55 0.01 260)",
        accent: "oklch(0.72 0.2 25)",
        accent2: "oklch(0.68 0.18 295)",
        accent3: "oklch(0.75 0.16 140)",
        gold: "oklch(0.82 0.18 85)",
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      boxShadow: {
        card: "0 2px 16px oklch(0 0 0 / 0.35)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
