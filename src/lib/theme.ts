import type { Category, Priority, ThemeColor } from "./types";

export interface CatColor {
  bg: string;
  color: string;
  dot: string;
}

/** Soft icon-inspired swatches: warm cocoa, blush coral, planner sage, and tea amber. */
export const CATEGORY_COLORS: Record<Category, CatColor> = {
  personal: { bg: "oklch(94% 0.035 28)", color: "oklch(44% 0.1 28)", dot: "oklch(68% 0.15 28)" },
  work: { bg: "oklch(92% 0.025 155)", color: "oklch(38% 0.06 155)", dot: "oklch(58% 0.08 155)" },
  health: { bg: "oklch(93% 0.03 130)", color: "oklch(38% 0.06 130)", dot: "oklch(62% 0.09 130)" },
  study: { bg: "oklch(94% 0.04 78)", color: "oklch(44% 0.08 72)", dot: "oklch(72% 0.14 78)" },
  other: { bg: "oklch(95% 0.018 72)", color: "oklch(45% 0.035 60)", dot: "oklch(70% 0.05 68)" },
  shift: { bg: "oklch(93% 0.026 190)", color: "oklch(38% 0.06 190)", dot: "oklch(60% 0.09 190)" },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "oklch(66% 0.16 28)",
  med: "oklch(72% 0.14 78)",
  low: "oklch(62% 0.08 155)",
};

const THEME_HUES: Record<ThemeColor, number> = { amber: 78, sky: 155, berry: 28 };

export interface Theme {
  accentBg: string;
  accentDark: string;
  accentTint: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  inputBg: string;
  chipBg: string;
  rootBg: string;
  divider: string;
}

/**
 * Produces the full token palette for the chosen accent + light/dark mode.
 * Ported from the mockup's `renderVals()` so visuals match 1:1. Consumers can
 * spread this into inline styles or feed it into CSS custom properties.
 */
export function buildTheme(themeColor: ThemeColor, darkMode: boolean): Theme {
  const hue = THEME_HUES[themeColor] ?? 95;
  const dark = darkMode;

  const accentBg = dark ? `oklch(66% 0.12 ${hue})` : `oklch(64% 0.12 ${hue})`;
  const accentDark = dark ? `oklch(56% 0.11 ${hue})` : `oklch(45% 0.1 ${hue})`;
  const accentTint = dark ? `oklch(30% 0.05 ${hue})` : `oklch(92% 0.04 ${hue})`;
  const surface = dark ? "oklch(23% 0.018 62)" : "oklch(99% 0.017 78)";
  const textPrimary = dark ? "oklch(94% 0.012 72)" : "oklch(27% 0.045 45)";
  const textSecondary = dark ? "oklch(76% 0.02 72)" : "oklch(48% 0.04 55)";
  const textMuted = dark ? "oklch(58% 0.02 72)" : "oklch(63% 0.035 62)";
  const borderColor = dark ? "oklch(34% 0.02 62)" : "oklch(88% 0.035 75)";
  const inputBg = dark ? "oklch(27% 0.018 62)" : "oklch(96% 0.026 78)";
  const chipBg = dark ? "oklch(30% 0.02 62)" : "oklch(94% 0.03 76)";
  const divider = dark ? "oklch(31% 0.02 62)" : "oklch(91% 0.026 70)";

  const rootBg = dark
    ? `radial-gradient(ellipse 620px 380px at 88% -8%, oklch(34% 0.055 155 / 0.35), transparent 60%), radial-gradient(ellipse 460px 300px at -8% 18%, oklch(32% 0.06 28 / 0.32), transparent 60%), linear-gradient(180deg, oklch(16% 0.018 62) 0%, oklch(12% 0.014 55) 100%)`
    : `radial-gradient(ellipse 620px 380px at 88% -8%, oklch(91% 0.035 155 / 0.38), transparent 60%), radial-gradient(ellipse 460px 300px at -8% 18%, oklch(90% 0.055 28 / 0.35), transparent 60%), linear-gradient(180deg, oklch(97% 0.035 82) 0%, oklch(96% 0.025 68) 100%)`;

  return {
    accentBg,
    accentDark,
    accentTint,
    surface,
    textPrimary,
    textSecondary,
    textMuted,
    borderColor,
    inputBg,
    chipBg,
    rootBg,
    divider,
  };
}
