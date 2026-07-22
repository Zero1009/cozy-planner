export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg, #fff4df 0%, #ffe5dc 50%, #fff9f1 100%)",
        color: "#4b3324",
      }}
    >
      <section
        style={{
          width: "min(100%, 440px)",
          borderRadius: 28,
          border: "1px solid rgba(109, 76, 49, 0.16)",
          background: "rgba(255, 255, 255, 0.78)",
          boxShadow: "0 18px 50px rgba(79, 54, 35, 0.16)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 900, letterSpacing: 0.4, color: "#9b6b43" }}>
          Cozy Planner
        </p>
        <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(28px, 8vw, 42px)", color: "#5f3f2b" }}>
          ออฟไลน์อยู่ครับ
        </h1>
        <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: "#6d5140" }}>
          ตอนนี้ยังเชื่อมต่ออินเทอร์เน็ตไม่ได้ กลับมาออนไลน์แล้วเปิด Cozy Planner อีกครั้งเพื่อโหลดปฏิทิน งาน และผู้ช่วย AI ครับ
        </p>
      </section>
    </main>
  );
}
