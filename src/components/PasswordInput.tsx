"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  inputStyle: React.CSSProperties;
  autoComplete?: string;
  onEnter?: () => void;
  revealColor?: string;
  buttonBg?: string;
  buttonBorder?: string;
}

export function PasswordInput({
  value,
  onChange,
  inputStyle,
  autoComplete,
  onEnter,
  revealColor = "#5b3b24",
  buttonBg = "rgba(255, 248, 235, 0.88)",
  buttonBorder = "rgba(122, 93, 62, 0.2)",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        style={{ ...inputStyle, width: "100%", paddingRight: 76 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter?.();
        }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        style={{
          position: "absolute",
          right: 7,
          top: "50%",
          transform: "translateY(-50%)",
          height: 28,
          minWidth: 58,
          padding: "0 10px",
          borderRadius: 9,
          border: `1px solid ${buttonBorder}`,
          background: buttonBg,
          color: revealColor,
          fontSize: 12,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {visible ? "ซ่อน" : "แสดง"}
      </button>
    </div>
  );
}
