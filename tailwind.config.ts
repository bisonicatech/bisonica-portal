import type { Config } from "tailwindcss";

// Wraps an oklch triplet so Tailwind's opacity modifiers work on it
// (e.g. `border-ink/10`) — same pattern Tailwind's own docs use for
// non-hex color functions. Tailwind accepts a function here at runtime;
// its own Config type just doesn't model that, hence the cast.
function oklch(triplet: string): string {
  const value = ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined ? `oklch(${triplet})` : `oklch(${triplet} / ${opacityValue})`;
  return value as unknown as string;
}

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Extracted from bisonica.tech's stylesheet (2026-07-29) — keep in
        // sync with that site's :root tokens if the brand palette changes.
        paper: oklch("0.97 0.012 75"), // warm cream page background
        ink: oklch("0.17 0.014 50"), // near-black brown body text
        night: oklch("0.20 0.03 45"), // dark brown section background
        fog: oklch("0.96 0.01 70"), // off-white text on dark backgrounds
        accent: oklch("0.84 0.045 70"), // tan/gold — primary CTAs
        "on-accent": oklch("0.20 0.03 45"), // text on accent-colored buttons
        brand: oklch("0.36 0.06 50"), // core brown — links, secondary buttons
        rust: oklch("0.58 0.11 40"), // secondary accent / hover state
        // Not part of the brand stylesheet — status colors in the same warm family.
        positive: "#3F7D4E",
        warning: "#B8791A",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
