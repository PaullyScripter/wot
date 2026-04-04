import { useEffect, useState } from "react";
import { WotIcon } from "./WotIcon";
import win98Logo from "./win98-logo.png";

export type TaskWindow = {
  id: string;
  title: string;
  icon?: string;
  isMinimized?: boolean;
};

type TaskBarProps = {
  windows: TaskWindow[];
  activeId?: string;
  onFocusWindow: (id: string) => void;
  isLoggedIn?: boolean;
  username?: string;
};

const ff = "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif";

// ── Inline SVG icons (match desktop icons) ──────────────────────────────────

function MenuPcIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="28" height="20" rx="2" fill="#c0c0c0" stroke="#808080" strokeWidth="1"/>
      <rect x="6" y="6" width="24" height="16" fill="#000080"/>
      <rect x="14" y="24" width="8" height="3" fill="#808080"/>
      <rect x="10" y="27" width="16" height="2" fill="#808080"/>
      <circle cx="26" cy="22" r="1" fill="#00cc00"/>
    </svg>
  );
}

function MenuPenIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-40, 18, 18)">
        <rect x="15" y="4" width="7" height="20" rx="2" fill="#f5c842" stroke="#b8920a" strokeWidth="1" />
        <rect x="20" y="5" width="2" height="16" rx="1" fill="#b8920a" />
        <polygon points="15,24 22,24 18.5,31" fill="#d0d0d0" stroke="#888" strokeWidth="0.8" />
        <polygon points="17.5,29 19.5,29 18.5,33" fill="#222" />
        <rect x="15" y="3" width="7" height="3" rx="1.5" fill="#c0a020" stroke="#b8920a" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function MenuFolderIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="22" height="16" rx="1" fill="#c8a020" stroke="#886800" strokeWidth="1" />
      <rect x="2" y="7" width="8" height="4" rx="1" fill="#c8a020" stroke="#886800" strokeWidth="1" />
      <rect x="6" y="13" width="26" height="16" rx="1" fill="#f5c842" stroke="#b8920a" strokeWidth="1" />
      <line x1="10" y1="18" x2="28" y2="18" stroke="#b8920a" strokeWidth="1" />
      <line x1="10" y1="21" x2="28" y2="21" stroke="#b8920a" strokeWidth="1" />
      <line x1="10" y1="24" x2="22" y2="24" stroke="#b8920a" strokeWidth="1" />
    </svg>
  );
}

function MenuHometownIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="20" height="14" fill="#c08060" stroke="#808080" strokeWidth="1"/>
      <polygon points="4,18 18,6 32,18" fill="#c04000" stroke="#808080" strokeWidth="1"/>
      <rect x="14" y="22" width="8" height="8" fill="#000080"/>
      <rect x="10" y="19" width="6" height="6" fill="#ffff99" stroke="#808080" strokeWidth="0.5"/>
    </svg>
  );
}

function MenuHumanIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="8" r="4.5" fill="#d0d0d0" stroke="#555" strokeWidth="1.2" />
      <rect x="13" y="14" width="10" height="11" rx="2" fill="#c0c0c0" stroke="#555" strokeWidth="1.1" />
      <line x1="13" y1="16" x2="7" y2="22" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      <line x1="23" y1="16" x2="29" y2="22" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="25" x2="13" y2="33" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      <line x1="21" y1="25" x2="23" y2="33" stroke="#c0c0c0" strokeWidth="3" strokeLinecap="round" />
      <line x1="13" y1="16" x2="7" y2="22" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="23" y1="16" x2="29" y2="22" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15" y1="25" x2="13" y2="33" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="21" y1="25" x2="23" y2="33" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MenuPowerIcon() {
  return (
    <svg viewBox="0 0 36 36" width={16} height={16} xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="12" fill="none" stroke="#808080" strokeWidth="2.5"/>
      <line x1="18" y1="6" x2="18" y2="18" stroke="#808080" strokeWidth="3" strokeLinecap="round"/>
      <path d="M10 10 A11 11 0 1 0 26 10" fill="none" stroke="#c04000" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const h = time.getHours();
  const m = time.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 8px", minWidth: 72, height: "100%",
      border: "2px solid", borderColor: "#808080 #fff #fff #808080",
      fontFamily: ff, fontSize: 15, fontWeight: 700, color: "#000",
      userSelect: "none", flexShrink: 0,
    }}>
      {h12}:{m} {ampm}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      style={{ padding: "5px 8px 5px 6px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: ff, fontSize: 12 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#000080"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}
      onClick={onClick}
    >
      {icon}
      {label}
    </div>
  );
}

function MenuSep() {
  return <div style={{ height: 1, background: "#808080", margin: "2px 4px", borderTop: "1px solid #fff" }} />;
}

export function TaskBar({ windows, activeId, onFocusWindow, isLoggedIn, username }: TaskBarProps) {
  const [startOpen, setStartOpen] = useState(false);
  const close = () => setStartOpen(false);
  const focus = (id: string) => { onFocusWindow(id); close(); };

  return (
    <>
      {startOpen && (
        <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9000 }} />
      )}

      {startOpen && (
        <div style={{
          position: "fixed", bottom: 48, left: 0, zIndex: 99999,
          width: 220, background: "#c0c0c0",
          border: "2px solid", borderColor: "#fff #808080 #808080 #fff",
          boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          userSelect: "none",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 24,
            background: "linear-gradient(to top, #000080, #1084d0)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
          }}>
            <span style={{
              fontWeight: "bold", fontSize: 14, color: "white",
              writingMode: "vertical-rl", transform: "rotate(180deg)",
              letterSpacing: 1, textShadow: "1px 1px 1px #000",
            }}>
              WOT Online
            </span>
          </div>

          <div style={{ marginLeft: 24 }}>
            <MenuItem icon={<WotIcon size={16} />} label="WOT Online" onClick={() => focus("about")} />
            <MenuSep />
            <MenuItem icon={<WotIcon size={16} />} label="Weave Our Tapestry" onClick={() => focus("search")} />
            <MenuItem icon={<MenuHometownIcon />} label="Our Hometown" onClick={() => focus("hometown")} />
            <MenuItem icon={<MenuPenIcon />} label="Post a Story" onClick={() => focus(isLoggedIn ? "post" : "login")} />
            <MenuItem icon={<MenuFolderIcon />} label="My Space" onClick={() => focus(isLoggedIn ? "myspace" : "login")} />
            <MenuItem icon={<MenuHumanIcon />} label="Accessibility" onClick={() => focus("accessibility")} />
            <MenuItem icon={<MenuPcIcon />} label={isLoggedIn && username ? username : "My Account"} onClick={() => focus(isLoggedIn ? "account" : "login")} />
            <MenuSep />
            <MenuItem icon={<MenuPowerIcon />} label="Shut Down..." onClick={close} />
          </div>
        </div>
      )}

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: 48, zIndex: 9999,
        background: "#c0c0c0", borderTop: "2px solid #fff",
        display: "flex", alignItems: "center", gap: 2, padding: "2px 4px",
        userSelect: "none",
      }}>
        <button
          type="button"
          onClick={() => setStartOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            height: 38, padding: "4px 8px",
            fontFamily: ff, fontSize: 16, fontWeight: "bold",
            color: "#000", background: "#c0c0c0",
            border: "2px solid",
            borderColor: startOpen ? "#808080 #fff #fff #808080" : "#fff #808080 #808080 #fff",
            cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          <img src={win98Logo} alt="" style={{ width: 28, height: 28, objectFit: "contain", imageRendering: "pixelated" }} />
          <b>Start</b>
        </button>

        <div style={{ width: 2, height: 34, borderLeft: "1px solid #808080", borderRight: "1px solid #fff", margin: "0 2px", flexShrink: 0 }} />

        <div style={{ flex: 1, display: "flex", gap: 2, overflow: "hidden", alignItems: "center" }}>
          {windows.map((win) => {
            const isActive = win.id === activeId && !win.isMinimized;
            return (
              <button
                key={win.id}
                type="button"
                title={win.title}
                onClick={() => onFocusWindow(win.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  height: 36, maxWidth: 180, minWidth: 80,
                  padding: "1px 8px",
                  fontFamily: ff, fontSize: 14,
                  color: "#000",
                  background: isActive ? "#b0b0b0" : "#c0c0c0",
                  border: "2px solid",
                  borderColor: isActive ? "#808080 #fff #fff #808080" : "#fff #808080 #808080 #fff",
                  cursor: "pointer", flexShrink: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {win.id === "search" || win.id === "hometown" || win.id === "about"
                  ? <WotIcon size={22} />
                  : <span style={{ fontSize: 18, flexShrink: 0 }}>{win.icon ?? "🗔"}</span>
                }
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{win.title}</span>
              </button>
            );
          })}
        </div>

        <div style={{ width: 2, height: 34, borderLeft: "1px solid #808080", borderRight: "1px solid #fff", margin: "0 2px", flexShrink: 0 }} />

        <Clock />
      </div>
    </>
  );
}