import { useState, useCallback, useEffect } from "react";
import { Window } from "./Window";
import { SearchPanel } from "./SearchPanel";
import { TaskBar } from "./TaskBar";
import { WotIcon } from "./WotIcon";
import { LoginWindow } from "./LoginWindow";
import type { TaskWindow } from "./TaskBar";
import type { SessionUser } from "./LoginWindow";
import "./App.css";

const API_BASE = "https://weave-our-tapestry.onrender.com";
const ff = "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif";

type Story = {
  id: number;
  title: string;
  culture?: string | null;
  country?: string | null;
  year?: number | null;
  category?: string | null;
  text: string;
  views: number;
  author_name?: string | null;
};

type StoryWin = {
  windowId: string;
  story: Story;
  isMinimized: boolean;
  initialX: number;
  initialY: number;
};

function formatViews(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

let winCounter = 0;
function nextWinId() { return `story-${++winCounter}`; }

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem("wot_session");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch { return null; }
}

function useWin(id: string, setZOrder: React.Dispatch<React.SetStateAction<string[]>>, bringToFront: (id: string) => void) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const openWin = useCallback(() => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        setMinimized(false);
        setZOrder((prev) => [...prev.filter((w) => w !== id), id]);
        return true;
      }
      return wasOpen;
    });
    setMinimized((wasMin) => {
      if (wasMin) {
        bringToFront(id);
        return false;
      }
      bringToFront(id);
      return wasMin;
    });
  }, [id, setZOrder, bringToFront]);

  const closeWin = useCallback(() => {
    setOpen(false);
    setMinimized(false);
    setZOrder((prev) => prev.filter((w) => w !== id));
  }, [id, setZOrder]);

  const minimizeWin = useCallback(() => setMinimized(true), []);

  return { open, minimized, openWin, closeWin, minimizeWin };
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
      <span style={{ fontFamily: ff, fontSize: 11, textAlign: "center", lineHeight: 1.2, wordBreak: "break-word" }}>{label}</span>
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

const ABOUT_TEXT = (
  <>
    <p>Welcome to Weave Our Tapestry (WOT)</p>

    <p>
      Weave Our Tapestry is a platform where users can share stories, myths,
      legends, and epics connected to different cultures, while also exploring
      and learning about traditions from around the world.
    </p>

    <p><strong>Developers:</strong>
      - Paul Nguyen<br />
      - Dolpin Tran<br />
      - Derrick Nguyen<br />
      - Titus Wang
    </p>

    <p>
      WOT is{" "}
      <a href="https://github.com/PaullyScripter/weave-our-tapestry" target="_blank" rel="noopener noreferrer">
        open source
      </a>!
    </p>

    <p>Version 1.0 — © 2026 WOT Online Inc.</p>
  </>
);

function AboutContent() {
  return (
    <div style={{ fontFamily: ff, fontSize: 11, height: "100%", display: "flex", flexDirection: "column", background: "white" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #1084d0)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <WotIcon size={44} />
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", fontStyle: "italic", color: "#ffcc00", letterSpacing: 2 }}>WOT Online</div>
          <div style={{ color: "#aaddff", fontSize: 11 }}>Weave Our Tapestry</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 14, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#222" }}>
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
          {([["Screen Name", user.username], ["Email", user.email], ["User ID", String(user.userId)]] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 90, fontWeight: "bold" }}>{label}:</span>
              <span style={{ flex: 1, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "2px 6px", background: "#f0f0f0" }}>{value}</span>
            </div>
          ))}
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
      .then(async (r) => { const buf = await r.arrayBuffer(); return JSON.parse(new TextDecoder("utf-8").decode(buf)) as Story[]; })
      .then((data) => { setTopStories([...data].sort((a, b) => b.views - a.views).slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: ff, fontSize: 11, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #4040c0)", color: "white", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: "bold" }}>🏠</span>
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
            <div style={{ width: 24, height: 24, flexShrink: 0, background: ["#c04000", "#808080", "#a06030"][i], color: "white", fontWeight: "bold", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #000" }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: "#000080", fontSize: 12, marginBottom: 2 }}>{story.title}</div>
              <div style={{ color: "#555", fontSize: 10, marginBottom: 2 }}>Culture: <span style={{ color: "#0000cc", textDecoration: "underline" }}>{story.culture}</span></div>
              <div style={{ color: "#555", fontSize: 10, marginBottom: 4 }}>Author: <span style={{ color: "#0000cc", textDecoration: "underline" }}>{story.author_name}</span></div>
              <div style={{ fontSize: 11, color: "#333", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{story.text}</div>
              <div style={{ marginTop: 4, fontSize: 10, color: "#666", display: "flex", gap: 6 }}>
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => loadSession());
  const [storyWindows, setStoryWindows] = useState<StoryWin[]>([]);
  const [zOrder, setZOrder] = useState<string[]>([]);

  const bringToFront = useCallback((id: string) => {
    setZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((w) => w !== id), id]);
  }, []);

  const zIndexOf = (id: string) => { const i = zOrder.indexOf(id); return i === -1 ? 10 : 10 + i; };
  const activeId = zOrder[zOrder.length - 1];

  const search = useWin("search", setZOrder, bringToFront);
  const hometown = useWin("hometown", setZOrder, bringToFront);
  const login = useWin("login", setZOrder, bringToFront);
  const account = useWin("account", setZOrder, bringToFront);
  const about = useWin("about", setZOrder, bringToFront);

  const winMap: Record<string, { open: boolean; minimized: boolean; openWin: () => void; closeWin: () => void; minimizeWin: () => void }> = { search, hometown, login, account, about };

  const [pendingAccountOpen, setPendingAccountOpen] = useState(false);

  useEffect(() => {
    if (pendingAccountOpen && currentUser) {
      account.openWin();
      setPendingAccountOpen(false);
    }
  }, [pendingAccountOpen, currentUser]);

  function handleLoginSuccess(user: SessionUser) {
    setCurrentUser(user);
    login.closeWin();
    setPendingAccountOpen(true);
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
    if (winMap[id]) {
      winMap[id].openWin();
    } else {
      setStoryWindows((prev) => prev.map((w) => w.windowId === id ? { ...w, isMinimized: false } : w));
      bringToFront(id);
    }
  }

  function handleOpenStory(story: Story) {
    const windowId = nextWinId();
    const idx = storyWindows.length;
    setStoryWindows((prev) => [...prev, { windowId, story, isMinimized: false, initialX: 180 + idx * 30, initialY: 120 + idx * 30 }]);
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
    ...(login.open ? [{ id: "login", title: "My Account", icon: "🖥️", isMinimized: login.minimized }] : []),
    ...(account.open ? [{ id: "account", title: currentUser?.username ?? "My Account", icon: "🖥️", isMinimized: account.minimized }] : []),
    ...(about.open ? [{ id: "about", title: "WOT Online", icon: "📋", isMinimized: about.minimized }] : []),
    ...(search.open ? [{ id: "search", title: "Weave Our Tapestry", icon: "📖", isMinimized: search.minimized }] : []),
    ...(hometown.open ? [{ id: "hometown", title: "Our Hometown", icon: "🏠", isMinimized: hometown.minimized }] : []),
    ...storyWindows.map((sw) => ({ id: sw.windowId, title: sw.story.title, icon: "📜", isMinimized: sw.isMinimized })),
  ];

  const cx = Math.floor(window.innerWidth / 2);
  const cy = Math.floor(window.innerHeight / 2);

  return (
    <div style={{ width: "100vw", height: "100vh", paddingBottom: 48, boxSizing: "border-box", position: "relative" }}>

      <div style={{ position: "absolute", top: 20, left: 20, display: "flex", flexDirection: "column", gap: 12, zIndex: 1 }}>
        <DesktopIcon label={currentUser ? currentUser.username : "My Account"} onClick={handleAccountOpen} renderIcon={() => <PcIcon />} />
        <DesktopIcon label="WOT" onClick={search.openWin} renderIcon={() => <WotIcon size={36} />} />
        <DesktopIcon label={"Our\nHometown"} onClick={hometown.openWin} renderIcon={() => <HometownIcon />} />
      </div>

      {login.open && (
        <Window title="My Account" initialX={cx - 175} initialY={cy - 220} initialWidth={350} initialHeight={420}
          onClose={login.closeWin} onMinimize={login.minimizeWin} isMinimized={login.minimized}
          zIndex={zIndexOf("login")} onFocus={() => bringToFront("login")}
        >
          <LoginWindow onLoginSuccess={handleLoginSuccess} />
        </Window>
      )}

      {account.open && currentUser && (
        <Window key={`account-${currentUser.username}`} title={currentUser.username} initialX={cx - 175} initialY={cy - 150} initialWidth={340} initialHeight={260}
          onClose={account.closeWin} onMinimize={account.minimizeWin} isMinimized={account.minimized}
          zIndex={zIndexOf("account")} onFocus={() => bringToFront("account")}
        >
          <AccountContent user={currentUser} onLogout={handleLogout} />
        </Window>
      )}

      {about.open && (
        <Window title="WOT Online" initialX={cx - 240} initialY={cy - 210} initialWidth={480} initialHeight={420}
          onClose={about.closeWin} onMinimize={about.minimizeWin} isMinimized={about.minimized}
          zIndex={zIndexOf("about")} onFocus={() => bringToFront("about")}
        >
          <AboutContent />
        </Window>
      )}

      {search.open && (
        <Window title="Weave Our Tapestry" initialX={40} initialY={50} initialWidth={900} initialHeight={500}
          onClose={search.closeWin} onMinimize={search.minimizeWin} isMinimized={search.minimized}
          zIndex={zIndexOf("search")} onFocus={() => bringToFront("search")}
        >
          <SearchPanel onOpenStory={handleOpenStory} />
        </Window>
      )}

      {hometown.open && (
        <Window title="Our Hometown" initialX={120} initialY={80} initialWidth={520} initialHeight={420}
          onClose={hometown.closeWin} onMinimize={hometown.minimizeWin} isMinimized={hometown.minimized}
          zIndex={zIndexOf("hometown")} onFocus={() => bringToFront("hometown")}
        >
          <HometownContent />
        </Window>
      )}

      {storyWindows.map(({ windowId, story, isMinimized, initialX, initialY }) => (
        <Window key={windowId} title={story.title} initialX={initialX} initialY={initialY} initialWidth={660} initialHeight={480}
          onClose={() => closeStory(windowId)} onMinimize={() => minimizeStory(windowId)} isMinimized={isMinimized}
          zIndex={zIndexOf(windowId)} onFocus={() => bringToFront(windowId)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontFamily: ff, fontSize: 13, fontWeight: "bold" }}>{story.title}</h2>
              <div style={{ fontFamily: ff, fontSize: 11, color: "#444" }}>
                Culture: <span style={{ textDecoration: "underline" }}>{story.culture}</span>
              </div>
              <div style={{ fontFamily: ff, fontSize: 11, color: "#444" }}>
                Author: <span style={{ textDecoration: "underline" }}>{story.author_name}</span>
              </div>
            </div>
            <div style={{ fontFamily: ff, fontSize: 11, color: "#333", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{formatViews(story.views)}</span><span>👁</span>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #c0c0c0", margin: "8px 0 10px 0" }} />
          <div style={{ fontFamily: ff, fontSize: 11, lineHeight: 1.6, color: "#111", whiteSpace: "pre-wrap" }}>
            {story.text}
          </div>
        </Window>
      ))}

      <TaskBar windows={taskWindows} activeId={activeId} onFocusWindow={handleTaskbarFocus} isLoggedIn={!!currentUser} username={currentUser?.username} />
    </div>
  );
}