import Image from "next/image";

interface CozyLoadingProps {
  message?: string;
  compact?: boolean;
}

export function CozyLoading({ message = "กำลังเตรียม Cozy Planner...", compact = false }: CozyLoadingProps) {
  // clamp() keeps the mascot from looming over small mobile viewports (it used
  // to render at a fixed 128px, which dwarfed content on narrow screens) while
  // staying full-size on desktop.
  const size = compact ? "clamp(40px, 14vw, 54px)" : "clamp(60px, 20vw, 128px)";
  const basePx = compact ? 54 : 128;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 10 : 14,
        color: compact ? "inherit" : "#5b3b24",
        fontFamily: "var(--font-quicksand), system-ui, sans-serif",
        fontWeight: 800,
        textAlign: "center",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src="/cozy-loading-cat.gif"
        alt=""
        width={basePx}
        height={basePx}
        unoptimized
        priority={!compact}
        style={{
          width: size,
          height: size,
          maxWidth: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 12px 22px rgba(93, 65, 35, 0.16))",
        }}
      />
      <span style={{ fontSize: compact ? 13 : 15 }}>{message}</span>
    </div>
  );
}
