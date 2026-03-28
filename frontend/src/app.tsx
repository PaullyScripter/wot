import { useState, useCallback, useEffect } from "react";
import { Window } from "./Window";
import { SearchPanel } from "./SearchPanel";
import { TaskBar } from "./TaskBar";
import { WotIcon } from "./WotIcon";
import { LoginWindow } from "./LoginWindow";
import type { TaskWindow } from "./TaskBar";
import type { SessionUser } from "./LoginWindow";
import "./App.css";

type Story = {
  id: number;
  title: string;
  culture: string;
  text: string;
  views: number;
};

type WinState = { windowId: string; isMinimized: boolean };
type StoryWinState = WinState & { story: Story; initialX: number; initialY: number };

const API_BASE = "https://weave-our-tapestry.onrender.com";
const ff = "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif";

function formatViews(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

let windowCounter = 0;
function nextWindowId() { return `story-${++windowCounter}`; }
const CASCADE_OFFSET = 30;

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem("wot_session");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch { return null; }
}

function DesktopIcon({ label, onClick, renderIcon }: { label: string; onClick: () => void; renderIcon: () => React.ReactNode }) {
  const [selected, setSelected] = useState(false);
  return (
    <div
      onMouseDown={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      onDoubleClick={() => { setSelected(false); onClick(); }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "4px", width: 72, cursor: "default", userSelect: "none",
        background: selected ? "rgba(0,0,128,0.4)" : "transparent",
        border: `1px solid ${selected ? "rgba(255,255,255,0.5)" : "transparent"}`,
        color: "white", textShadow: "1px 1px 1px #000",
      }}
    >
      <div style={{ filter: selected ? "brightness(0.75)" : "none" }}>{renderIcon()}</div>
      <span style={{ fontFamily: ff, fontSize: 11, textAlign: "center", lineHeight: 1.2, wordBreak: "break-word" }}>
        {label}
      </span>
    </div>
  );
}

function PcIcon() {
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="28" height="20" rx="2" fill="#c0c0c0" stroke="#808080" strokeWidth="1"/>
      <rect x="6" y="6" width="24" height="16" fill="#000080"/>
      <rect x="14" y="24" width="8" height="3" fill="#808080"/>
      <rect x="10" y="27" width="16" height="2" fill="#808080"/>
      <circle cx="26" cy="22" r="1" fill="#00cc00"/>
    </svg>
  );
}

function HometownIcon() {
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="16" width="20" height="14" fill="#c08060" stroke="#808080" strokeWidth="1"/>
      <polygon points="4,18 18,6 32,18" fill="#c04000" stroke="#808080" strokeWidth="1"/>
      <rect x="14" y="22" width="8" height="8" fill="#000080"/>
      <rect x="10" y="19" width="6" height="6" fill="#ffff99" stroke="#808080" strokeWidth="0.5"/>
    </svg>
  );
}

const ABOUT_TEXT = `Welcome to Weave Our Tapestry (WOT) — a community platform for sharing and discovering stories, myths, legends, and folklore from cultures around the world.

WOT was built to celebrate the richness of human storytelling across generations and geographies. Whether it's a Vietnamese legend, a Greek myth, or a Mexican folktale — every culture has a tapestry worth weaving.

Features:
• Search and read stories from cultures worldwide
• View trending stories in Our Hometown
• Share your own cultural stories
• Connect with other storytellers

Version 1.0 — © 2026 WOT Online Inc.`;

function AboutContent() {
  return (
    <div style={{ fontFamily: ff, fontSize: 11, height: "100%", display: "flex", flexDirection: "column", background: "white" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #1084d0)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <WotIcon size={48} />
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", fontStyle: "italic", color: "#ffcc00", letterSpacing: 2 }}>WOT Online</div>
          <div style={{ color: "#aaddff", fontSize: 11 }}>Weave Our Tapestry</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, overflow: "auto", whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#222" }}>
        {ABOUT_TEXT}
      </div>
    </div>
  );
}

function AccountContent({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  return (
    <div style={{ fontFamily: ff, fontSize: 11, padding: 16, background: "#c0c0c0", height: "100%", boxSizing: "border-box" }}>
      <div style={{ background: "white", border: "2px solid", borderColor: "#808080 #fff #fff #808080", padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: "bold", color: "#000080", fontSize: 12, marginBottom: 8, borderBottom: "1px solid #c0c0c0", paddingBottom: 4 }}>
          Account Information
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 90, fontWeight: "bold" }}>Screen Name:</span>
            <span style={{ flex: 1, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "2px 6px", background: "#f0f0f0" }}>{user.username}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 90, fontWeight: "bold" }}>Email:</span>
            <span style={{ flex: 1, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "2px 6px", background: "#f0f0f0" }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 90, fontWeight: "bold" }}>User ID:</span>
            <span style={{ flex: 1, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "2px 6px", background: "#f0f0f0" }}>{user.userId}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onLogout} style={{ fontFamily: ff, fontSize: 11, background: "#c0c0c0", border: "2px solid", borderColor: "#fff #808080 #808080 #fff", padding: "3px 20px", cursor: "pointer" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function HometownContent() {
  const [topStories, setTopStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stories`)
      .then(async (r) => {
        const buffer = await r.arrayBuffer();
        const text = new TextDecoder("utf-8").decode(buffer);
        return JSON.parse(text) as Story[];
      })
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.views - a.views).slice(0, 3);
        setTopStories(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: ff, fontSize: 11, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #4040c0)", color: "white", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontStyle: "italic", fontWeight: "bold" }}>🏠</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Our Hometown</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>The most-read stories in our community</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "white" }}>
        {loading && <div style={{ padding: 16, color: "#666", fontStyle: "italic" }}>Loading stories...</div>}
        {!loading && topStories.length === 0 && <div style={{ padding: 16, color: "#666" }}>No stories found.</div>}
        {!loading && topStories.map((story, i) => (
          <div key={story.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderBottom: "1px solid #e0e0e0", background: i === 0 ? "#fffbf0" : "white" }}>
            <div style={{ width: 24, height: 24, flexShrink: 0, background: i === 0 ? "#c04000" : i === 1 ? "#808080" : "#a06030", color: "white", fontWeight: "bold", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #000" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: "#000080", fontSize: 12, marginBottom: 2 }}>{story.title}</div>
              <div style={{ color: "#555", fontSize: 10, marginBottom: 4 }}>
                Culture: <span style={{ color: "#0000cc", textDecoration: "underline" }}>{story.culture}</span>
              </div>
              <div style={{ fontSize: 11, color: "#333", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                {story.text}
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: "#666", display: "flex", alignItems: "center", gap: 6 }}>
                <span>👁 {formatViews(story.views)} views</span>
                {i === 0 && <span style={{ color: "#c04000", fontWeight: "bold" }}>🔥 Most Read</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#c0c0c0", padding: "2px 6px", borderTop: "1px solid #808080", fontSize: 11, display: "flex", alignItems: "center", height: 20, flexShrink: 0 }}>
        <div style={{ border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "0 4px", flex: 1 }}>
          {topStories.length} stories shown · sorted by views
        </div>
      </div>
    </div>
  );
}

function useWin(id: string, setZOrder: React.Dispatch<React.SetStateAction<string[]>>, bringToFront: (id: string) => void) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<WinState>({ windowId: id, isMinimized: false });

  function openWin() {
    if (!open) {
      setOpen(true);
      setState({ windowId: id, isMinimized: false });
      setZOrder((prev) => [...prev.filter((w) => w !== id), id]);
    } else if (state.isMinimized) {
      setState((s) => ({ ...s, isMinimized: false }));
      bringToFront(id);
    } else {
      bringToFront(id);
    }
  }
  function closeWin() {
    setOpen(false);
    setZOrder((prev) => prev.filter((w) => w !== id));
  }
  function minimizeWin() { setState((s) => ({ ...s, isMinimized: true })); }
  function restoreWin() { setState((s) => ({ ...s, isMinimized: false })); bringToFront(id); }

  return { open, state, openWin, closeWin, minimizeWin, restoreWin };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => loadSession());
  const [storyWindows, setStoryWindows] = useState<StoryWinState[]>([]);
  const [zOrder, setZOrder] = useState<string[]>([]);

  const bringToFront = useCallback((id: string) => {
    setZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((w) => w !== id), id]);
  }, []);

  const zIndexOf = (id: string) => { const idx = zOrder.indexOf(id); return idx === -1 ? 10 : 10 + idx; };
  const activeId = zOrder[zOrder.length - 1];

  const search = useWin("search", setZOrder, bringToFront);
  const hometown = useWin("hometown", setZOrder, bringToFront);
  const login = useWin("login", setZOrder, bringToFront);
  const account = useWin("account", setZOrder, bringToFront);
  const about = useWin("about", setZOrder, bringToFront);

  function handleLoginSuccess(user: SessionUser) {
    setCurrentUser(user);
    login.closeWin();
  }

  function handleLogout() {
    localStorage.removeItem("wot_session");
    setCurrentUser(null);
    account.closeWin();
  }

  function handleAccountOpen() {
    if (currentUser) account.openWin();
    else login.openWin();
  }

  function handleTaskbarFocus(id: string) {
    if (id === "search") { if (search.state.isMinimized) search.restoreWin(); else bringToFront("search"); }
    else if (id === "hometown") { if (hometown.state.isMinimized) hometown.restoreWin(); else bringToFront("hometown"); }
    else if (id === "login") { if (login.state.isMinimized) login.restoreWin(); else bringToFront("login"); }
    else if (id === "account") { if (account.state.isMinimized) account.restoreWin(); else bringToFront("account"); }
    else if (id === "about") { if (about.state.isMinimized) about.restoreWin(); else bringToFront("about"); }
    else {
      setStoryWindows((prev) => prev.map((w) => w.windowId === id ? { ...w, isMinimized: false } : w));
      bringToFront(id);
    }
  }

  function handleOpenStory(story: Story) {
    const windowId = nextWindowId();
    const cascadeIndex = storyWindows.length;
    setStoryWindows((prev) => [...prev, { windowId, story, isMinimized: false, initialX: 180 + cascadeIndex * CASCADE_OFFSET, initialY: 120 + cascadeIndex * CASCADE_OFFSET }]);
    setZOrder((prev) => [...prev, windowId]);
  }

  function closeStory(windowId: string) {
    setStoryWindows((prev) => prev.filter((w) => w.windowId !== windowId));
    setZOrder((prev) => prev.filter((id) => id !== windowId));
  }

  function minimizeStory(windowId: string) {
    setStoryWindows((prev) => prev.map((w) => w.windowId === windowId ? { ...w, isMinimized: true } : w));
  }

  const taskWindows: TaskWindow[] = [
    ...(login.open ? [{ id: "login", title: "My Account", icon: "🖥️", isMinimized: login.state.isMinimized }] : []),
    ...(account.open ? [{ id: "account", title: "My Account", icon: "🖥️", isMinimized: account.state.isMinimized }] : []),
    ...(about.open ? [{ id: "about", title: "WOT Online", icon: "📋", isMinimized: about.state.isMinimized }] : []),
    ...(search.open ? [{ id: "search", title: "Weave Our Tapestry", icon: "📖", isMinimized: search.state.isMinimized }] : []),
    ...(hometown.open ? [{ id: "hometown", title: "Our Hometown", icon: "🏠", isMinimized: hometown.state.isMinimized }] : []),
    ...storyWindows.map((sw) => ({ id: sw.windowId, title: sw.story.title, icon: "📜", isMinimized: sw.isMinimized })),
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", paddingBottom: 48, boxSizing: "border-box", position: "relative" }}>

      <div style={{ position: "absolute", top: 20, left: 20, display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
        <DesktopIcon label="My Account" onClick={handleAccountOpen} renderIcon={() => <PcIcon />} />
        <DesktopIcon label="WOT" onClick={search.openWin} renderIcon={() => <WotIcon size={36} />} />
        <DesktopIcon label={"Our\nHometown"} onClick={hometown.openWin} renderIcon={() => <HometownIcon />} />
      </div>

      {currentUser && (
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1, fontFamily: ff, fontSize: 11, color: "#fff", textShadow: "1px 1px 1px #000", display: "flex", alignItems: "center", gap: 6 }}>
          <WotIcon size={14} />
          Signed in as <strong>{currentUser.username}</strong>
        </div>
      )}

      {login.open && (
        <Window title="My Account"
          initialX={Math.max(0, Math.floor(window.innerWidth / 2) - 175)}
          initialY={Math.max(0, Math.floor(window.innerHeight / 2) - 220)}
          initialWidth={350} initialHeight={420}
          onClose={login.closeWin} onMinimize={login.minimizeWin}
          isMinimized={login.state.isMinimized}
          zIndex={zIndexOf("login")} onFocus={() => bringToFront("login")}
        >
          <LoginWindow onLoginSuccess={handleLoginSuccess} />
        </Window>
      )}

      {account.open && currentUser && (
        <Window title="My Account"
          initialX={Math.max(0, Math.floor(window.innerWidth / 2) - 175)}
          initialY={Math.max(0, Math.floor(window.innerHeight / 2) - 150)}
          initialWidth={340} initialHeight={260}
          onClose={account.closeWin} onMinimize={account.minimizeWin}
          isMinimized={account.state.isMinimized}
          zIndex={zIndexOf("account")} onFocus={() => bringToFront("account")}
        >
          <AccountContent user={currentUser} onLogout={handleLogout} />
        </Window>
      )}

      {about.open && (
        <Window title="WOT Online"
          initialX={Math.max(0, Math.floor(window.innerWidth / 2) - 220)}
          initialY={Math.max(0, Math.floor(window.innerHeight / 2) - 200)}
          initialWidth={440} initialHeight={400}
          onClose={about.closeWin} onMinimize={about.minimizeWin}
          isMinimized={about.state.isMinimized}
          zIndex={zIndexOf("about")} onFocus={() => bringToFront("about")}
        >
          <AboutContent />
        </Window>
      )}

      {search.open && (
        <Window title="Weave Our Tapestry"
          initialX={40} initialY={50} initialWidth={900} initialHeight={500}
          onClose={search.closeWin} onMinimize={search.minimizeWin}
          isMinimized={search.state.isMinimized}
          zIndex={zIndexOf("search")} onFocus={() => bringToFront("search")}
        >
          <SearchPanel onOpenStory={handleOpenStory} />
        </Window>
      )}

      {hometown.open && (
        <Window title="Our Hometown"
          initialX={120} initialY={80} initialWidth={520} initialHeight={420}
          onClose={hometown.closeWin} onMinimize={hometown.minimizeWin}
          isMinimized={hometown.state.isMinimized}
          zIndex={zIndexOf("hometown")} onFocus={() => bringToFront("hometown")}
        >
          <HometownContent />
        </Window>
      )}

      {storyWindows.map(({ windowId, story, isMinimized, initialX, initialY }) => (
        <Window key={windowId} title={story.title}
          initialX={initialX} initialY={initialY} initialWidth={660} initialHeight={480}
          onClose={() => closeStory(windowId)} onMinimize={() => minimizeStory(windowId)}
          isMinimized={isMinimized}
          zIndex={zIndexOf(windowId)} onFocus={() => bringToFront(windowId)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontFamily: ff, fontSize: 13, fontWeight: "bold", lineHeight: 1.2 }}>{story.title}</h2>
              <div style={{ fontFamily: ff, fontSize: 11, color: "#444" }}>
                Culture: <span style={{ textDecoration: "underline", cursor: "pointer" }}>{story.culture}</span>
              </div>
            </div>
            <div style={{ fontFamily: ff, fontSize: 11, color: "#333", display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
              <span>{formatViews(story.views)}</span><span>👁</span>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #c0c0c0", margin: "8px 0 10px 0" }} />
          <div style={{ fontFamily: ff, fontSize: 11, lineHeight: 1.6, color: "#111", whiteSpace: "pre-wrap" }}>
            {story.text}
          </div>
        </Window>
      ))}

      <TaskBar windows={taskWindows} activeId={activeId} onFocusWindow={handleTaskbarFocus} isLoggedIn={!!currentUser} />
    </div>
  );
}