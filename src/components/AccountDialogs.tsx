"use client";

import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { getJSON, patchJSON, postJSON } from "@/lib/api";
import type { Theme } from "@/lib/theme";
import type { CurrentUser } from "@/lib/session";

interface ProfileDialogProps {
  theme: Theme;
  user: CurrentUser;
  forced: boolean;
  onClose: () => void;
  onSaved: (user: CurrentUser) => void;
}

interface AdminUsersDialogProps {
  theme: Theme;
  onClose: () => void;
}

interface UserRow extends CurrentUser {
  createdAt: number | Date;
}

export function ProfileDialog({ theme, user, forced, onClose, onSaved }: ProfileDialogProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (pending) return;
    setMessage("");
    setPending(true);
    try {
      const data = await patchJSON<{ user: CurrentUser }>("/api/profile", {
        displayName,
        password: password.trim() || undefined,
      });
      onSaved(data.user);
      setMessage("บันทึกโปรไฟล์แล้วครับ");
      if (!forced) onClose();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "บันทึกโปรไฟล์ไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="cozy-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="cozy-dialog-card" style={cardStyle(theme)}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", color: theme.textMuted, fontSize: 12, fontWeight: 800 }}>
              {forced ? "ตั้งค่าโปรไฟล์ครั้งแรก" : "โปรไฟล์ของฉัน"}
            </p>
            <h2 className="font-display" style={{ margin: 0, color: theme.textPrimary, fontSize: 24 }}>
              {forced ? "อัปเดตข้อมูลก่อนเริ่มใช้งาน" : "จัดการโปรไฟล์"}
            </h2>
          </div>
          {!forced && <CloseButton theme={theme} onClick={onClose} />}
        </div>

        <p style={{ margin: "10px 0 0", color: theme.textSecondary, fontSize: 14, lineHeight: 1.5 }}>
          บัญชีนี้ใช้ username <strong>{user.username}</strong> ถ้าเป็นการเข้าใช้งานครั้งแรก กรุณาปรับชื่อที่แสดงและตั้งรหัสผ่านของตัวเองครับ
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          <Field label="ชื่อที่แสดง" theme={theme}>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle(theme)} />
          </Field>
          <Field label="รหัสผ่านใหม่ (เว้นว่างได้ถ้าไม่เปลี่ยน)" theme={theme}>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              inputStyle={inputStyle(theme)}
              revealColor={theme.textPrimary}
              buttonBg={theme.chipBg}
              buttonBorder={theme.borderColor}
            />
          </Field>
          <p style={{ margin: 0, color: theme.textMuted, fontSize: 12 }}>
            รหัสผ่านควรมีอย่างน้อย 8 ตัวอักษร และมีตัวอักษรพร้อมตัวเลขหรือสัญลักษณ์
          </p>
          {message && <Message theme={theme} text={message} />}
          <button type="button" onClick={save} disabled={pending} style={primaryButtonStyle(theme, pending)}>
            {pending ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersDialog({ theme, onClose }: AdminUsersDialogProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const data = await getJSON<{ users: UserRow[] }>("/api/admin/users");
    setUsers(data.users);
  }

  useEffect(() => {
    loadUsers().catch((err) => setMessage(err instanceof Error ? err.message : "โหลดรายชื่อผู้ใช้ไม่สำเร็จ"));
  }, []);

  async function createUser() {
    if (pending) return;
    setMessage("");
    setPending(true);
    try {
      await postJSON("/api/admin/users", { username, displayName, password, isAdmin });
      setUsername("");
      setDisplayName("");
      setPassword("");
      setIsAdmin(false);
      setMessage("สร้างผู้ใช้แล้วครับ ผู้ใช้จะถูกขอให้อัปเดตโปรไฟล์เมื่อ login ครั้งแรก");
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "สร้างผู้ใช้ไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="cozy-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="cozy-dialog-card" style={{ ...cardStyle(theme), maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", color: theme.textMuted, fontSize: 12, fontWeight: 800 }}>
              สำหรับ TRK/Admin
            </p>
            <h2 className="font-display" style={{ margin: 0, color: theme.textPrimary, fontSize: 24 }}>
              จัดการผู้ใช้
            </h2>
          </div>
          <CloseButton theme={theme} onClick={onClose} />
        </div>

        <div className="cozy-admin-grid" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 18 }}>
          <Field label="username" theme={theme}>
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle(theme)} />
          </Field>
          <Field label="ชื่อเริ่มต้น" theme={theme}>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle(theme)} placeholder="ถ้าเว้นว่างจะใช้ username" />
          </Field>
          <Field label="รหัสผ่านเริ่มต้น" theme={theme}>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              inputStyle={inputStyle(theme)}
              revealColor={theme.textPrimary}
              buttonBg={theme.chipBg}
              buttonBorder={theme.borderColor}
            />
          </Field>
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={isAdmin}
          onClick={() => setIsAdmin((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
            marginTop: 12,
            padding: "6px 8px",
            border: "none",
            borderRadius: 10,
            background: "transparent",
            color: theme.textSecondary,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 17,
              height: 17,
              borderRadius: 5,
              border: `1.5px solid ${isAdmin ? theme.accentDark : theme.borderColor}`,
              background: isAdmin ? theme.accentBg : theme.inputBg,
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              lineHeight: 1,
              boxShadow: isAdmin ? "0 4px 10px rgba(93, 65, 35, 0.14)" : "none",
            }}
          >
            {isAdmin ? "✓" : ""}
          </span>
          ให้สิทธิ์ admin
        </button>

        {message && <Message theme={theme} text={message} />}
        <button type="button" onClick={createUser} disabled={pending} style={{ ...primaryButtonStyle(theme, pending), marginTop: 12 }}>
          {pending ? "กำลังสร้าง..." : "เพิ่มผู้ใช้"}
        </button>

        <div style={{ marginTop: 20, borderTop: `1px solid ${theme.divider}`, paddingTop: 14 }}>
          <h3 style={{ margin: "0 0 10px", color: theme.textPrimary, fontSize: 15 }}>ผู้ใช้ทั้งหมด</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto" }}>
            {users.map((u) => (
              <div className="cozy-user-row" key={u.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 10, borderRadius: 12, background: theme.inputBg, border: `1px solid ${theme.borderColor}` }}>
                <div>
                  <strong style={{ color: theme.textPrimary }}>{u.displayName}</strong>
                  <div style={{ color: theme.textMuted, fontSize: 12 }}>@{u.username}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {u.isAdmin && <Badge theme={theme} text="admin" />}
                  {u.mustUpdateProfile ? <Badge theme={theme} text="รออัปเดตโปรไฟล์" /> : <Badge theme={theme} text="พร้อมใช้งาน" />}
                </div>
              </div>
            ))}
            {users.length === 0 && <p style={{ margin: 0, color: theme.textMuted }}>ยังไม่มีผู้ใช้</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, theme, children }: { label: string; theme: Theme; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, color: theme.textSecondary, fontSize: 13, fontWeight: 800 }}>
      {label}
      {children}
    </label>
  );
}

function Message({ theme, text }: { theme: Theme; text: string }) {
  return <p style={{ margin: "10px 0 0", color: theme.textSecondary, fontSize: 13, fontWeight: 700 }}>{text}</p>;
}

function Badge({ theme, text }: { theme: Theme; text: string }) {
  return <span style={{ padding: "4px 8px", borderRadius: 999, background: theme.accentTint, color: theme.textPrimary, fontSize: 11, fontWeight: 800 }}>{text}</span>;
}

function CloseButton({ theme, onClick }: { theme: Theme; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="ปิด" style={{ border: `1px solid ${theme.borderColor}`, background: theme.chipBg, color: theme.textPrimary, borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontWeight: 900 }}>
      ×
    </button>
  );
}

function cardStyle(theme: Theme): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflow: "auto",
    borderRadius: 24,
    padding: 22,
    background: theme.surface,
    border: `1px solid ${theme.borderColor}`,
    boxShadow: "0 24px 70px rgba(74, 46, 24, 0.24)",
  };
}

function inputStyle(theme: Theme): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 12,
    border: `1px solid ${theme.borderColor}`,
    background: theme.inputBg,
    color: theme.textPrimary,
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
  };
}

function primaryButtonStyle(theme: Theme, pending: boolean): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 13,
    border: "none",
    background: theme.accentBg,
    color: "white",
    fontWeight: 900,
    cursor: pending ? "default" : "pointer",
    opacity: pending ? 0.72 : 1,
  };
}
