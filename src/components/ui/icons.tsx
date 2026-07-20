import type { CSSProperties } from "react";

interface IconProps {
  size?: number;
  style?: CSSProperties;
}

/**
 * Inline SVG icons ported from the design mockup. All use `currentColor` so
 * they inherit the surrounding button's text color, and carry no external deps.
 */

export function DashboardIcon({ size = 18, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={style} aria-hidden>
      <rect x="1" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="10" y="1" width="7" height="7" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="1" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function CalendarIcon({ size = 18, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={style} aria-hidden>
      <rect x="1" y="3" width="16" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="1" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.6" />
      <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="1" x2="13" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TodoIcon({ size = 18, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={style} aria-hidden>
      <rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 9.2l2.3 2.3 4.7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkleIcon({ size = 24, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 13, style }: IconProps) {
  return (
    <svg width={(size * 8) / 13} height={size} viewBox="0 0 8 13" style={style} aria-hidden>
      <path d="M7 1L1.5 6.5L7 12" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 13, style }: IconProps) {
  return (
    <svg width={(size * 8) / 13} height={size} viewBox="0 0 8 13" style={style} aria-hidden>
      <path d="M1 1L6.5 6.5L1 12" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 14, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={style} aria-hidden>
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon({ size = 16, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style} aria-hidden>
      <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon({ size = 12, style }: IconProps) {
  return (
    <svg width={size} height={(size * 10) / 12} viewBox="0 0 12 10" style={style} aria-hidden>
      <path d="M1 5L4.3 8.3L11 1" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ size = 14, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" style={style} aria-hidden>
      <circle cx="6.5" cy="6.5" r="5.7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 3.3V6.5L8.8 8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ size = 15, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={style} aria-hidden>
      <path
        d="M2.5 4h11M6 4V2.8c0-.4.3-.8.8-.8h2.4c.5 0 .8.4.8.8V4M4 4l.6 9c0 .6.5 1 1 1h4.8c.5 0 1-.4 1-1L12 4M6.5 7v4M9.5 7v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon({ size = 16, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={style} aria-hidden>
      <circle cx="9" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
