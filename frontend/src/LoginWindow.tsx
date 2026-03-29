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
            <span style={{ fontSize: 28, flexShrink: 0 }}>❓</span>
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

      <div style={{ background: "#000080", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 14, flexShrink: 0 }}>
        <WotIcon size={56} />
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold", fontStyle: "italic", color: "#ffcc00", letterSpacing: 3, textShadow: "2px 2px 4px rgba(0,0,0,0.6)" }}>WOT</div>
          <div style={{ color: "#aaddff", fontSize: 12, fontStyle: "italic" }}>Weave Our Tapestry</div>
          <div style={{ color: "#88aacc", fontSize: 10 }}>Connecting Cultures, One Story at a Time</div>
        </div>
      </div>

      <div style={{ borderTop: "2px solid #808080", borderBottom: "1px solid #fff", flexShrink: 0 }} />

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

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        {mode === "register" && (
          <Field label="Screen Name" type="text" value={username} onChange={setUsername} />
        )}
        <Field label="Email" type="text" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />

        {error && (
          <div style={{
            fontFamily: ff, fontSize: 10, marginTop: 4,
            color: isSuccess ? "#006600" : "#cc0000",
            padding: "3px 6px", border: "1px solid",
            borderColor: isSuccess ? "#006600" : "#cc0000",
            background: isSuccess ? "#eeffee" : "#ffeeee",
          }}>
            {error}
          </div>
        )}

        <div style={{ borderTop: "1px solid #808080", margin: "12px 0 8px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, background: "transparent", border: "none", boxShadow: "none",
              cursor: "pointer", padding: 0,
            }}
          >
            <span style={{ fontSize: 22 }}>❓</span>
            <span style={{ fontFamily: ff, fontSize: 10 }}>Help</span>
          </button>

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
            <span style={{ fontSize: 26 }}>📖</span>
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
