import type { Category, Priority, ThemeColor } from "./types";

export interface CatColor {
  bg: string;
  color: string;
  dot: string;
}

/** Soft oklch swatches per category — ported verbatim from the design mockup. */
export const CATEGORY_COLORS: Record<Category, CatColor> = {
  personal: { bg: "oklch(93% 0.035 350)", color: "oklch(42% 0.09 350)", dot: "oklch(65% 0.1 350)" },
  work: { bg: "oklch(93% 0.03 35)", color: "oklch(42% 0.1 35)", dot: "oklch(62% 0.15 35)" },
  health: { bg: "oklch(93% 0.02 230)", color: "oklch(40% 0.06 230)", dot: "oklch(65% 0.08 230)" },
  study: { bg: "oklch(93% 0.02 300)", color: "oklch(42% 0.06 300)", dot: "oklch(65% 0.09 300)" },
  other: { bg: "oklch(94% 0.008 60)", color: "oklch(45% 0.01 60)", dot: "oklch(70% 0.01 60)" },
  shift: { bg: "oklch(92% 0.03 265)", color: "oklch(42% 0.1 265)", dot: "oklch(60% 0.13 265)" },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "oklch(58% 0.16 25)",
  med: "oklch(62% 0.15 35)",
  low: "oklch(70% 0.01 60)",
};

const THEME_HUES: Record<ThemeColor, number> = { amber: 95, sky: 230, berry: 340 };

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

  const accentBg = dark ? `oklch(66% 0.14 ${hue})` : `oklch(62% 0.13 ${hue})`;
  const accentDark = dark ? `oklch(56% 0.13 ${hue})` : `oklch(50% 0.13 ${hue})`;
  const accentTint = dark ? `oklch(30% 0.06 ${hue})` : `oklch(93% 0.04 ${hue})`;
  const surface = dark ? "oklch(23% 0.015 90)" : "oklch(99% 0.012 92)";
  const textPrimary = dark ? "oklch(93% 0.01 90)" : "oklch(24% 0.02 50)";
  const textSecondary = dark ? "oklch(74% 0.015 90)" : "oklch(48% 0.02 55)";
  const textMuted = dark ? "oklch(56% 0.015 90)" : "oklch(65% 0.015 60)";
  const borderColor = dark ? "oklch(33% 0.015 90)" : "oklch(88% 0.025 95)";
  const inputBg = dark ? "oklch(27% 0.015 90)" : "oklch(96% 0.018 95)";
  const chipBg = dark ? "oklch(30% 0.015 90)" : "oklch(93% 0.02 90)";
  const divider = dark ? "oklch(30% 0.015 90)" : "oklch(92% 0.015 70)";

  const rootBg = dark
    ? `radial-gradient(ellipse 620px 380px at 88% -8%, oklch(32% 0.06 220 / 0.35), transparent 60%), radial-gradient(ellipse 460px 300px at -8% 18%, oklch(30% 0.06 ${hue} / 0.35), transparent 60%), linear-gradient(180deg, oklch(15% 0.014 90) 0%, oklch(12% 0.01 90) 100%)`
    : `radial-gradient(ellipse 620px 380px at 88% -8%, oklch(90% 0.04 220 / 0.35), transparent 60%), radial-gradient(ellipse 460px 300px at -8% 18%, oklch(90% 0.045 ${hue} / 0.35), transparent 60%), linear-gradient(180deg, oklch(96% 0.025 100) 0%, oklch(97% 0.016 90) 100%)`;

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
