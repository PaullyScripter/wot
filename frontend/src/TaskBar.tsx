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
            <MenuItem icon={<span style={{ fontSize: 15 }}>🔍</span>} label="Weave Our Tapestry" onClick={() => focus("search")} />
            <MenuItem icon={<span style={{ fontSize: 15 }}>🏠</span>} label="Our Hometown" onClick={() => focus("hometown")} />
            <MenuItem icon={<span style={{ fontSize: 15 }}>✍️</span>} label="Post a Story" onClick={() => focus(isLoggedIn ? "post" : "login")} />
            <MenuItem icon={<span style={{ fontSize: 15 }}>🖥️</span>} label={isLoggedIn && username ? username : "My Account"} onClick={() => focus(isLoggedIn ? "account" : "login")} />
            <MenuSep />
            <MenuItem icon={<span style={{ fontSize: 15 }}>🔌</span>} label="Shut Down..." onClick={close} />
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