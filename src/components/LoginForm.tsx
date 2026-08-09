"use client";

import Image from "next/image";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { purgePwaCaches } from "@/components/ServiceWorkerRegistrar";
import { postJSON } from "@/lib/api";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      await purgePwaCaches();
      await postJSON("/api/auth/login", { username, password });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background:
          "radial-gradient(circle at 85% 8%, rgba(136, 166, 143, 0.24), transparent 34%), radial-gradient(circle at 8% 20%, rgba(245, 139, 111, 0.2), transparent 32%), linear-gradient(135deg, #fff4df 0%, #f4e4ca 100%)",
        fontFamily: "var(--font-quicksand), sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 28,
          borderRadius: 24,
          background: "rgba(255, 250, 242, 0.94)",
          border: "1px solid rgba(139, 100, 61, 0.18)",
          boxShadow: "0 22px 60px rgba(93, 65, 35, 0.16)",
        }}
      >
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <Image
            src="/cozy-planner-icon.png"
            alt="Cozy Planner"
            width={86}
            height={86}
            style={{
              width: 86,
              height: 86,
              borderRadius: 24,
              objectFit: "cover",
              boxShadow: "0 14px 30px rgba(93, 65, 35, 0.16)",
              marginBottom: 12,
            }}
          />
          <h1 className="font-display" style={{ margin: 0, fontSize: 28, color: "#3b2f23" }}>
            เข้าสู่ระบบ
          </h1>
          <p style={{ margin: "8px 0 0", color: "#7a6a58", fontSize: 14 }}>
            ใช้บัญชีที่ TRK เพิ่มให้เท่านั้น ไม่มีการสมัครสมาชิกจากหน้านี้ครับ
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: "#4a3a2a" }}>
            ชื่อผู้ใช้
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={inputStyle}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: "#4a3a2a" }}>
            รหัสผ่าน
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              inputStyle={inputStyle}
              onEnter={submit}
              revealColor="#5b3b24"
              buttonBg="#fff4df"
              buttonBorder="rgba(122, 93, 62, 0.22)"
            />
          </label>

          {error && (
            <p style={{ margin: 0, color: "#b42318", fontSize: 13, fontWeight: 700 }}>{error}</p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={pending}
            style={{
              marginTop: 6,
              height: 44,
              borderRadius: 14,
              border: "none",
              background: "#78977e",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="cozy-inline-spinner" aria-hidden="true" />
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 13,
  border: "1px solid rgba(122, 93, 62, 0.22)",
  background: "#fff8eb",
  color: "#3b2f23",
  padding: "0 13px",
  fontSize: 15,
  outline: "none",
};
