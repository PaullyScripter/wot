import { useState, useCallback, useEffect } from "react";
import { Window } from "./Window";
import { SearchPanel } from "./SearchPanel";
import { TaskBar } from "./TaskBar";
import { WotIcon } from "./WotIcon";
import type { TaskWindow } from "./TaskBar";
import "./App.css";



type Story = {
  id: number;
  title: string;
  culture: string;
  text: string;
  views: number;
};

type WinState = {
  windowId: string;
  isMinimized: boolean;
};

type StoryWinState = WinState & { story: Story; initialX: number; initialY: number };



const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function formatViews(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

let windowCounter = 0;
function nextWindowId() { return `story-${++windowCounter}`; }
const CASCADE_OFFSET = 30;



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
        color: "white",
        textShadow: "1px 1px 1px #000",
      }}
    >
      <div style={{ filter: selected ? "brightness(0.75)" : "none" }}>{renderIcon()}</div>
      <span style={{
        fontFamily: "'MS Sans Serif', Tahoma, Arial, sans-serif",
        fontSize: 11, textAlign: "center", lineHeight: 1.2, wordBreak: "break-word",
      }}>
        {label}
      </span>
    </div>
  );
}



function HometownContent() {
  const [topStories, setTopStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://weave-our-tapestry.onrender.com/api/stories")
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
    <div style={{ fontFamily: "'MS Sans Serif', Tahoma, Arial, sans-serif", fontSize: 11, height: "100%", display: "flex", flexDirection: "column" }}>

      
      <div style={{
        background: "linear-gradient(to right, #000080, #4040c0)",
        color: "white", padding: "8px 12px",
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 20, fontStyle: "italic", fontWeight: "bold" }}>🏠</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Our Hometown</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>The most-read stories in our community</div>
        </div>
      </div>

      
      <div style={{ flex: 1, overflow: "auto", background: "white", padding: 0 }}>
        {loading && (
          <div style={{ padding: 16, color: "#666", fontStyle: "italic" }}>Loading stories...</div>
        )}
        {!loading && topStories.length === 0 && (
          <div style={{ padding: 16, color: "#666", fontStyle: "italic" }}>No stories found.</div>
        )}
        {!loading && topStories.map((story, i) => (
          <div key={story.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px",
            borderBottom: "1px solid #e0e0e0",
            background: i === 0 ? "#fffbf0" : "white",
          }}>
            
            <div style={{
              width: 24, height: 24, flexShrink: 0,
              background: i === 0 ? "#c04000" : i === 1 ? "#808080" : "#a06030",
              color: "white", fontWeight: "bold", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #000",
            }}>
              {i + 1}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: "#000080", fontSize: 12, marginBottom: 2 }}>
                {story.title}
              </div>
              <div style={{ color: "#555", fontSize: 10, marginBottom: 4 }}>
                Culture: <span style={{ color: "#0000cc", textDecoration: "underline" }}>{story.culture}</span>
              </div>
              <div style={{
                fontSize: 11, color: "#333", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } as React.CSSProperties}>
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

      
      <div style={{
        background: "#c0c0c0", padding: "2px 6px",
        borderTop: "1px solid #808080", fontSize: 11, color: "#000",
        display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
        height: 20,
      }}>
        <div style={{ border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "0 4px", flex: 1 }}>
          {topStories.length} stories shown · sorted by views
        </div>
      </div>
    </div>
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

export default function App() {

  const [searchWin, setSearchWin] = useState<WinState>({ windowId: "search", isMinimized: false });
  const [searchOpen, setSearchOpen] = useState(false);

  const [hometownWin, setHometownWin] = useState<WinState>({ windowId: "hometown", isMinimized: false });
  const [hometownOpen, setHometownOpen] = useState(false);

  const [storyWindows, setStoryWindows] = useState<StoryWinState[]>([]);
  const [zOrder, setZOrder] = useState<string[]>([]);

  const bringToFront = useCallback((id: string) => {
    setZOrder((prev) =>
      prev[prev.length - 1] === id ? prev : [...prev.filter((w) => w !== id), id]
    );
  }, []);

  const zIndexOf = (id: string) => {
    const idx = zOrder.indexOf(id);
    return idx === -1 ? 10 : 10 + idx;
  };

  const activeId = zOrder[zOrder.length - 1];


  function openSearch() {
    if (!searchOpen) {
      setSearchOpen(true);
      setSearchWin({ windowId: "search", isMinimized: false });
      setZOrder((prev) => [...prev.filter((w) => w !== "search"), "search"]);
    } else if (searchWin.isMinimized) {
      setSearchWin((w) => ({ ...w, isMinimized: false }));
      bringToFront("search");
    } else {
      bringToFront("search");
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setZOrder((prev) => prev.filter((id) => id !== "search"));
  }

  function minimizeSearch() {
    setSearchWin((w) => ({ ...w, isMinimized: true }));
  }


  function openHometown() {
    if (!hometownOpen) {
      setHometownOpen(true);
      setHometownWin({ windowId: "hometown", isMinimized: false });
      setZOrder((prev) => [...prev.filter((w) => w !== "hometown"), "hometown"]);
    } else if (hometownWin.isMinimized) {
      setHometownWin((w) => ({ ...w, isMinimized: false }));
      bringToFront("hometown");
    } else {
      bringToFront("hometown");
    }
  }

  function closeHometown() {
    setHometownOpen(false);
    setZOrder((prev) => prev.filter((id) => id !== "hometown"));
  }

  function minimizeHometown() {
    setHometownWin((w) => ({ ...w, isMinimized: true }));
  }


  function handleOpenStory(story: Story) {
    const windowId = nextWindowId();
    const cascadeIndex = storyWindows.length;
    setStoryWindows((prev) => [...prev, {
      windowId, story, isMinimized: false,
      initialX: 180 + cascadeIndex * CASCADE_OFFSET,
      initialY: 120 + cascadeIndex * CASCADE_OFFSET,
    }]);
    setZOrder((prev) => [...prev, windowId]);
  }

  function closeStory(windowId: string) {
    setStoryWindows((prev) => prev.filter((w) => w.windowId !== windowId));
    setZOrder((prev) => prev.filter((id) => id !== windowId));
  }

  function minimizeStory(windowId: string) {
    setStoryWindows((prev) => prev.map((w) => w.windowId === windowId ? { ...w, isMinimized: true } : w));
  }


  function handleTaskbarFocus(id: string) {
    if (id === "search") {
      if (searchWin.isMinimized) {
        setSearchWin((w) => ({ ...w, isMinimized: false }));
      }
      bringToFront("search");
    } else if (id === "hometown") {
      if (hometownWin.isMinimized) {
        setHometownWin((w) => ({ ...w, isMinimized: false }));
      }
      bringToFront("hometown");
    } else {
      setStoryWindows((prev) => prev.map((w) => w.windowId === id ? { ...w, isMinimized: false } : w));
      bringToFront(id);
    }
  }


  const taskWindows: TaskWindow[] = [
    ...(searchOpen ? [{ id: "search", title: "Weave Our Tapestry", icon: "📖", isMinimized: searchWin.isMinimized }] : []),
    ...(hometownOpen ? [{ id: "hometown", title: "Our Hometown", icon: "🏠", isMinimized: hometownWin.isMinimized }] : []),
    ...storyWindows.map((sw) => ({ id: sw.windowId, title: sw.story.title, icon: "📜", isMinimized: sw.isMinimized })),
  ];




  return (
    <div style={{ width: "100vw", height: "100vh", paddingBottom: 48, boxSizing: "border-box", position: "relative" }}>

      
      <div style={{ position: "absolute", top: 20, left: 20, display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
        <DesktopIcon
          label="WOT"
          onClick={openSearch}
          renderIcon={() => <WotIcon size={36} />}
        />
        <DesktopIcon
          label={"Our\nHometown"}
          onClick={openHometown}
          renderIcon={() => <HometownIcon />}
        />
      </div>

      
      {searchOpen && (
        <Window
          title="Weave Our Tapestry"
          initialX={40} initialY={50}
          initialWidth={900} initialHeight={500}
          onClose={closeSearch}
          onMinimize={minimizeSearch}
          isMinimized={searchWin.isMinimized}
          zIndex={zIndexOf("search")}
          onFocus={() => bringToFront("search")}
        >
          <SearchPanel onOpenStory={handleOpenStory} />
        </Window>
      )}

      
      {hometownOpen && (
        <Window
          title="Our Hometown"
          initialX={120} initialY={80}
          initialWidth={520} initialHeight={420}
          onClose={closeHometown}
          onMinimize={minimizeHometown}
          isMinimized={hometownWin.isMinimized}
          zIndex={zIndexOf("hometown")}
          onFocus={() => bringToFront("hometown")}
        >
          <HometownContent />
        </Window>
      )}

      
      {storyWindows.map(({ windowId, story, isMinimized, initialX, initialY }) => (
        <Window
          key={windowId}
          title={story.title}
          initialX={initialX} initialY={initialY}
          initialWidth={660} initialHeight={480}
          onClose={() => closeStory(windowId)}
          onMinimize={() => minimizeStory(windowId)}
          isMinimized={isMinimized}
          zIndex={zIndexOf(windowId)}
          onFocus={() => bringToFront(windowId)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontFamily: "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif", fontSize: 13, fontWeight: 'bold', lineHeight: 1.2 }}>
                {story.title}
              </h2>
              <div style={{ fontFamily: "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif", fontSize: 11, color: "#444" }}>
                Culture: <span style={{ textDecoration: "underline", cursor: "pointer" }}>{story.culture}</span>
              </div>
            </div>
            <div style={{ fontFamily: "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif", fontSize: 11, color: "#333", display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
              <span>{formatViews(story.views)}</span><span>👁</span>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "2px solid #888", margin: "10px 0 14px 0" }} />
          <div style={{ fontFamily: "'MS Sans Serif', Tahoma, Geneva, Arial, sans-serif", fontSize: 11, lineHeight: 1.6, color: "#111", whiteSpace: "pre-wrap" }}>
            {story.text}
          </div>
        </Window>
      ))}

      <TaskBar
        windows={taskWindows}
        activeId={activeId}
        onFocusWindow={handleTaskbarFocus}
      />
    </div>
  );
}