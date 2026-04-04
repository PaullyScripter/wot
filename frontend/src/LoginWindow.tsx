import { useState } from "react";
import { WotIcon } from "./WotIcon";

const API_BASE = "https://weave-our-tapestry.onrender.com";

export type SessionUser = { userId: number; username: string; email: string };

type Props = {
  onLoginSuccess: (user: SessionUser) => void;
};

type Mode = "login" | "register";

const ff = "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif";

const HELP_TEXT = (
  <>
    <p>
      If you have problems logging in, please contact the developers at:
      <ul style={{ transform: "translateX(-20px)" }}>
        <li>weaveourtapestry@outlook.com</li>
        <li><a href="https://github.com/PaullyScripter/weave-our-tapestry">Our repository</a></li>
      </ul>
    </p>
  </>
);

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */

function HelpIcon() {
  return (
    <svg viewBox="0 0 36 36" width={28} height={28} xmlns="http://www.w3.org/2000/svg">
      {/* Circle border */}
      <circle cx="18" cy="18" r="15" fill="#c0c0c0" stroke="#555" strokeWidth="1.5" />
      {/* Question mark stem */}
      <rect x="16" y="22" width="4" height="6" rx="1" fill="#000080" />
      {/* Question mark dot */}
      <rect x="16" y="30" width="4" height="3" rx="1" fill="#000080" />
      {/* Question mark arc */}
      <path d="M13 13 Q13 8 18 8 Q23 8 23 13 Q23 17 18 19 L18 21" fill="none" stroke="#000080" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 36 36" width={32} height={32} xmlns="http://www.w3.org/2000/svg">
      {/* Left page */}
      <rect x="3" y="5" width="14" height="26" rx="1" fill="#e8e0d0" stroke="#888" strokeWidth="1" />
      {/* Right page */}
      <rect x="19" y="5" width="14" height="26" rx="1" fill="#f5f0e8" stroke="#888" strokeWidth="1" />
      {/* Spine */}
      <rect x="15" y="4" width="6" height="28" rx="1" fill="#8b6914" stroke="#6b4f10" strokeWidth="1" />
      {/* Left page lines */}
      <line x1="7"  y1="12" x2="14" y2="12" stroke="#aaa" strokeWidth="1" />
      <line x1="7"  y1="15" x2="14" y2="15" stroke="#aaa" strokeWidth="1" />
      <line x1="7"  y1="18" x2="14" y2="18" stroke="#aaa" strokeWidth="1" />
      <line x1="7"  y1="21" x2="14" y2="21" stroke="#aaa" strokeWidth="1" />
      {/* Right page lines */}
      <line x1="22" y1="12" x2="29" y2="12" stroke="#aaa" strokeWidth="1" />
      <line x1="22" y1="15" x2="29" y2="15" stroke="#aaa" strokeWidth="1" />
      <line x1="22" y1="18" x2="29" y2="18" stroke="#aaa" strokeWidth="1" />
      <line x1="22" y1="21" x2="29" y2="21" stroke="#aaa" strokeWidth="1" />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg viewBox="0 0 36 36" width={32} height={32} xmlns="http://www.w3.org/2000/svg">
      {/* Document */}
      <rect x="5" y="3" width="20" height="26" rx="1" fill="#f5f0e8" stroke="#888" strokeWidth="1" />
      {/* Fold corner */}
      <polygon points="21,3 25,3 25,7 21,7" fill="#ddd" stroke="#888" strokeWidth="1" />
      {/* Lines */}
      <line x1="9"  y1="11" x2="21" y2="11" stroke="#aaa" strokeWidth="1.2" />
      <line x1="9"  y1="14" x2="21" y2="14" stroke="#aaa" strokeWidth="1.2" />
      <line x1="9"  y1="17" x2="18" y2="17" stroke="#aaa" strokeWidth="1.2" />
      {/* Plus badge */}
      <circle cx="27" cy="27" r="7" fill="#006600" stroke="#004400" strokeWidth="1" />
      <rect x="24" y="26" width="6" height="2" rx="1" fill="white" />
      <rect x="26" y="24" width="2" height="6" rx="1" fill="white" />
    </svg>
  );
}

/* ── Field ──────────────────────────────────────────────────────────────────── */

function Field({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span style={{ width: 100, fontFamily: ff, fontSize: 11, flexShrink: 0 }}>{label}:</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, fontFamily: ff, fontSize: 11,
          border: "1px solid", borderColor: "#808080 #fff #fff #808080",
          padding: "2px 4px", background: "white", outline: "none",
        }}
      />
    </div>
  );
}

/* ── Help Dialog ─────────────────────────────────────────────────────────────── */

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.15)",
    }}>
      <div style={{
        background: "#c0c0c0",
        border: "2px solid", borderColor: "#fff #808080 #808080 #fff",
        boxShadow: "2px 2px 0 #000",
        width: 280, fontFamily: ff, fontSize: 11,
      }}>
        <div style={{
          background: "linear-gradient(to right, #000080, #1084d0)",
          color: "white", fontWeight: "bold", fontSize: 11,
          padding: "3px 6px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Help</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 16, height: 14, fontFamily: ff, fontSize: 9, fontWeight: "bold",
              background: "#c0c0c0", color: "#000",
              border: "1px solid", borderColor: "#fff #808080 #808080 #fff",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, boxShadow: "none",
            }}
          >✕</button>
        </div>
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <HelpIcon />
            <p style={{ margin: 0, lineHeight: 1.6, color: "#111" }}>{HELP_TEXT}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: ff, fontSize: 11, padding: "3px 24px",
                background: "#c0c0c0", border: "2px solid",
                borderColor: "#fff #808080 #808080 #fff", cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LoginWindow ──────────────────────────────────────────────────────────── */

export function LoginWindow({ onLoginSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function handleSignIn() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid information");
      const user: SessionUser = { userId: data.user_id, username: username || email.split("@")[0], email };
      localStorage.setItem("wot_session", JSON.stringify(user));
      onLoginSuccess(user);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      setMode("login");
      setPassword("");
      setError("Registered! Please sign in.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const isSuccess = error.startsWith("Registered");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#c0c0c0", fontFamily: ff, fontSize: 11, position: "relative" }}>

      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}

      {/* Header banner */}
      <div style={{ background: "#000080", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 14, flexShrink: 0 }}>
        <WotIcon size={56} />
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold", fontStyle: "italic", color: "#ffcc00", letterSpacing: 3, textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>WOT</div>
          <div style={{ color: "#aaddff", fontSize: 12, fontStyle: "italic" }}>Weave Our Tapestry</div>
          <div style={{ color: "#88aacc", fontSize: 10 }}>Connecting Cultures, One Story at a Time</div>
        </div>
      </div>

      <div style={{ borderTop: "2px solid #808080", borderBottom: "1px solid #fff", flexShrink: 0 }} />

      {/* Mode tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #808080", flexShrink: 0 }}>
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            style={{
              flex: 1, height: 24, cursor: "pointer",
              background: mode === m ? "#c0c0c0" : "#a8a8a8",
              fontFamily: ff, fontSize: 11,
              fontWeight: mode === m ? "bold" : "normal",
              border: "none", borderRight: "1px solid #808080", boxShadow: "none",
            }}
          >
            {m === "login" ? "Sign In" : "New User"}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        {mode === "register" && (
          <Field label="Screen Name" type="text" value={username} onChange={setUsername} />
        )}
        <Field label="Email" type="text" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />

        {/* Error / success message — uses CSS classes for theme sync */}
        {error && (
          <div className={isSuccess ? "wot-msg-success" : "wot-msg-error"}
            style={{ fontFamily: ff, fontSize: 10, marginTop: 4, padding: "3px 6px" }}>
            {error}
          </div>
        )}

        <div style={{ borderTop: "1px solid #808080", margin: "12px 0 8px" }} />

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {/* Help button */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, background: "transparent", border: "none", boxShadow: "none",
              cursor: "pointer", padding: 0,
            }}
          >
            <HelpIcon />
            <span style={{ fontFamily: ff, fontSize: 10 }}>Help</span>
          </button>

          {/* Sign In / Register button */}
          <button
            type="button"
            onClick={mode === "login" ? handleSignIn : handleRegister}
            disabled={loading}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, background: "transparent", border: "none", boxShadow: "none",
              cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1, padding: 0,
            }}
          >
            {mode === "login" ? <BookIcon /> : <RegisterIcon />}
            <span style={{ fontFamily: ff, fontSize: 11, fontWeight: "bold" }}>
              {loading ? "..." : mode === "login" ? "Sign In" : "Register"}
            </span>
          </button>
        </div>

        <div style={{ textAlign: "center", color: "#666", fontSize: 10, marginTop: 12 }}>
          Version 1.0 © 2026 WOT Online Inc.
        </div>
      </div>
    </div>
  );
}