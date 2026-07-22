import Image from "next/image";

interface CozyLoadingProps {
  message?: string;
  compact?: boolean;
}

export function CozyLoading({ message = "กำลังเตรียม Cozy Planner...", compact = false }: CozyLoadingProps) {
  const size = compact ? 54 : 128;
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
        width={size}
        height={size}
        unoptimized
        priority={!compact}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: "drop-shadow(0 12px 22px rgba(93, 65, 35, 0.16))",
        }}
      />
      <span style={{ fontSize: compact ? 13 : 15 }}>{message}</span>
    </div>
  );
}
