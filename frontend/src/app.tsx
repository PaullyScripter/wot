import { useState, useCallback, useEffect, useRef } from "react";
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
  like_count?: number | null;
  author_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

const GRID_COL = 90;   // px per grid column
const GRID_ROW = 90;   // px per grid row
const GRID_OFFSET_X = 16;
const GRID_OFFSET_Y = 16;

type IconId = "account" | "post" | "myspace" | "wot" | "hometown";

const DEFAULT_POSITIONS: Record<IconId, { col: number; row: number }> = {
  account:  { col: 0, row: 0 },
  post:     { col: 1, row: 0 },
  myspace:  { col: 1, row: 1 },
  wot:      { col: 0, row: 1 },
  hometown: { col: 0, row: 2 },
};

function snapToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.max(0, Math.round((x - GRID_OFFSET_X) / GRID_COL)),
    row: Math.max(0, Math.round((y - GRID_OFFSET_Y) / GRID_ROW)),
  };
}

function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_OFFSET_X + col * GRID_COL,
    y: GRID_OFFSET_Y + row * GRID_ROW,
  };
}

function DraggableIcon({
  id, label, onClick, renderIcon, position, onDrop, allPositions,
}: {
  id: IconId;
  label: string;
  onClick: () => void;
  renderIcon: () => React.ReactNode;
  position: { col: number; row: number };
  onDrop: (id: IconId, col: number, row: number) => void;
  allPositions: Record<IconId, { col: number; row: number }>;
}) {
  const [selected, setSelected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ mouseX: number; mouseY: number; iconX: number; iconY: number } | null>(null);
  const didDrag = useRef(false);

  const { x, y } = gridToPixel(position.col, position.row);

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    setSelected(true);
    didDrag.current = false;
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, iconX: x, iconY: y };

    function onMove(ev: MouseEvent) {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mouseX;
      const dy = ev.clientY - dragStart.current.mouseY;
      if (!dragging && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      didDrag.current = true;
      setDragging(true);
      setDragPos({ x: dragStart.current.iconX + dx, y: dragStart.current.iconY + dy });
    }

    function onUp(ev: MouseEvent) {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (didDrag.current && dragStart.current) {
        const dx = ev.clientX - dragStart.current.mouseX;
        const dy = ev.clientY - dragStart.current.mouseY;
        const newX = dragStart.current.iconX + dx;
        const newY = dragStart.current.iconY + dy;
        const snapped = snapToGrid(newX, newY);
        // Check if another icon occupies that cell; if so, swap
        const occupant = (Object.entries(allPositions) as [IconId, { col: number; row: number }][])
          .find(([oid, p]) => oid !== id && p.col === snapped.col && p.row === snapped.row);
        if (occupant) {
          onDrop(occupant[0], position.col, position.row);
        }
        onDrop(id, snapped.col, snapped.row);
      }
      setDragging(false);
      setDragPos(null);
      dragStart.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const currentX = dragging && dragPos ? dragPos.x : x;
  const currentY = dragging && dragPos ? dragPos.y : y;

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseUp={() => { if (!didDrag.current) setSelected(s => !s); }}
      onDoubleClick={() => { if (!didDrag.current) { setSelected(false); onClick(); } }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onBlur={() => setSelected(false)}
      style={{
        position: "absolute",
        left: currentX,
        top: currentY,
        width: 80,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "4px", cursor: dragging ? "grabbing" : "default",
        userSelect: "none",
        background: selected ? "rgba(0,0,128,0.4)" : "transparent",
        border: `1px solid ${selected ? "rgba(255,255,255,0.5)" : "transparent"}`,
        color: "white", textShadow: "1px 1px 1px #000",
        zIndex: dragging ? 500 : 1,
        opacity: dragging ? 0.85 : 1,
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
      .then((data) => { setTopStories([...data].sort((a, b) => b.views - a.views).slice(0, 5)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const medals = ["1", "2", "3", "4", "5"];

  return (
    <div style={{ fontFamily: ff, fontSize: 11, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #4040c0)", color: "white", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>🏠</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Our Hometown</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>Top 5 most-read stories in our community</div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "white" }}>
        {loading && <div style={{ padding: 16, color: "#666", fontStyle: "italic" }}>Loading stories...</div>}
        {!loading && topStories.length === 0 && <div style={{ padding: 16, color: "#666" }}>No stories found.</div>}
        {!loading && topStories.map((story, i) => (
          <div key={story.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderBottom: "1px solid #e0e0e0", background: i === 0 ? "#fffbf0" : "white" }}>
            <div style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{medals[i]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: "bold", color: "#000080", fontSize: 12, marginBottom: 3 }}>{story.title}</div>

              {/* Metadata row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", color: "#555", fontSize: 10, marginBottom: 4 }}>
                {story.author_name && <span> {story.author_name}</span>}
                {story.country    && <span> {story.country}</span>}
                {story.culture    && <span> {story.culture}</span>}
                {story.category   && <span> {story.category}</span>}
                {story.year       && <span> {story.year}</span>}
              </div>

              <div style={{ fontSize: 11, color: "#333", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{story.text}</div>

              {/* Stats row */}
              <div style={{ marginTop: 5, fontSize: 10, color: "#666", display: "flex", gap: 10, alignItems: "center" }}>
                <span>{formatViews(story.views)} views</span>
                <span>{story.like_count ?? 0} likes</span>
                {story.created_at && <span>{formatDate(story.created_at)}</span>}
                {i === 0 && <span style={{ color: "#c04000", fontWeight: "bold", marginLeft: "auto" }}>🔥 Most Read</span>}
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

// ── Ad Popup ────────────────────────────────────────────────────────────────

const AD_GRADIENTS = [
  "linear-gradient(180deg, #8b0000 0%, #ff6600 50%, #ffd700 100%)",
  "linear-gradient(180deg, #00008b 0%, #0080ff 50%, #00e5ff 100%)",
  "linear-gradient(180deg, #1a0033 0%, #7b00d4 50%, #ff00cc 100%)",
  "linear-gradient(180deg, #003300 0%, #00aa44 50%, #ccff00 100%)",
  "linear-gradient(180deg, #4a0000 0%, #cc2200 40%, #ff9900 70%, #ffee00 100%)",
  "linear-gradient(180deg, #000033 0%, #003399 40%, #0099ff 70%, #00ffcc 100%)",
];

type AdData = {
  type: "most_viewed" | "random";
  story: Story;
  gradient: string;
};

function AdPopup({ ad, onClose, zIndex, onFocus }: { ad: AdData; onClose: () => void; zIndex: number; onFocus: () => void }) {
  const isBig = ad.type === "most_viewed";
  const titleFont = "'IM Fell English', 'Times New Roman', Georgia, serif";

  return (
    <Window
      title="Daily News"
      initialX={Math.floor(window.innerWidth * 0.65)}
      initialY={60}
      initialWidth={220}
      initialHeight={isBig ? 480 : 400}
      onClose={onClose}
      zIndex={zIndex}
      onFocus={onFocus}
    >
      <div style={{
        background: ad.gradient,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: "20px 16px",
        textAlign: "center",
        boxSizing: "border-box",
      }}>
        {isBig ? (
          <>
            <div style={{ fontFamily: titleFont, fontSize: 22, fontWeight: "bold", fontStyle: "italic", color: "#fff", textShadow: "2px 2px 4px rgba(0,0,0,0.7)", lineHeight: 1.2 }}>
              Today's HOTTEST POST!!!!
            </div>
            <div style={{ fontFamily: titleFont, fontSize: 17, fontStyle: "italic", color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.6)", lineHeight: 1.3 }}>
              Most viewed<br />
              <span style={{ fontSize: 19, fontWeight: "bold", textDecoration: "underline" }}>
                {ad.story.title}
              </span>
            </div>
            {ad.story.culture && (
              <div style={{ fontFamily: titleFont, fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.85)", textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
                Culture: {ad.story.culture}
              </div>
            )}
            <div style={{ fontFamily: titleFont, fontSize: 16, fontStyle: "italic", color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.6)" }}>
              👁 {formatViews(ad.story.views)} views
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: titleFont, fontSize: 18, fontWeight: "bold", fontStyle: "italic", color: "#fff", textShadow: "2px 2px 4px rgba(0,0,0,0.7)", lineHeight: 1.2 }}>
              Discover a Story!
            </div>
            <div style={{ fontFamily: titleFont, fontSize: 17, fontStyle: "italic", color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.6)", lineHeight: 1.3 }}>
              <span style={{ fontSize: 19, fontWeight: "bold", textDecoration: "underline" }}>
                {ad.story.title}
              </span>
            </div>
            {ad.story.culture && (
              <div style={{ fontFamily: titleFont, fontSize: 13, fontStyle: "italic", color: "rgba(255,255,255,0.85)", textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
                {ad.story.culture}
              </div>
            )}
            {ad.story.author_name && (
              <div style={{ fontFamily: titleFont, fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.75)" }}>
                uploaded by {ad.story.author_name}
              </div>
            )}
          </>
        )}

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.4)", width: "80%", paddingTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontFamily: titleFont, fontSize: 18, fontStyle: "italic", fontWeight: "bold", color: "#fff", textShadow: "1px 1px 3px rgba(0,0,0,0.6)", lineHeight: 1.3 }}>
            Want to be featured like this?
          </div>
          <div style={{ fontFamily: titleFont, fontSize: 14, fontStyle: "italic", color: "rgba(255,255,255,0.9)", textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
            share a story now!
          </div>
        </div>
      </div>
    </Window>
  );
}

// ── Splash Screen ────────────────────────────────────────────────────────────
const BOOT_LINES = [
  { text: "WOT BIOS v1.0  Copyright (C) 2026 WOT Online Inc.", delay: 0 },
  { text: "", delay: 80 },
  { text: "CPU: WOT-686 @ 133MHz", delay: 150 },
  { text: "Memory Test: 16384K OK", delay: 300 },
  { text: "", delay: 420 },
  { text: "Detecting Primary Master... ST31276A", delay: 550 },
  { text: "Detecting Primary Slave ... None", delay: 720 },
  { text: "", delay: 850 },
  { text: "WOT Online Network Adapter... found", delay: 980 },
  { text: "Loading story database........... OK", delay: 1150 },
  { text: "Initializing culture engine....... OK", delay: 1320 },
  { text: "", delay: 1450 },
  { text: "Starting WOT Online v1.0", delay: 1580 },
  { text: "", delay: 1700 },
  { text: "██████████████████████  100%", delay: 1850 },
  { text: "", delay: 2050 },
  { text: "Welcome to Weave Our Tapestry.", delay: 2200 },
  { text: "Connecting cultures, one story at a time.", delay: 2400 },
];

const READY_DELAY = 2700;

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);

  function dismiss() {
    if (!ready) return;
    setFading(true);
    setTimeout(onDone, 500);
  }

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach(({ text, delay }) => {
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, text]);
      }, delay));
    });

    timers.push(setTimeout(() => setReady(true), READY_DELAY));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const onKey = () => dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 999999,
        background: "#000",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start",
        padding: "10vh 8vw",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "clamp(11px, 1.4vw, 15px)",
        color: "#aaa",
        cursor: ready ? "pointer" : "default",
        transition: fading ? "opacity 0.5s ease" : "none",
        opacity: fading ? 0 : 1,
        userSelect: "none",
        isolation: "isolate",
      }}
    >
      {/* Blue BIOS top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: "#0000aa", color: "#fff",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "clamp(11px, 1.3vw, 14px)",
        padding: "4px 12px",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>WOT BIOS Setup Utility</span>
        <span>{ready ? "Click or press any key to continue" : "Loading..."}</span>
      </div>

      <div style={{ marginTop: 32, width: "100%", maxWidth: 680 }}>
        {visibleLines.map((line, i) => (
          <div key={i} style={{
            lineHeight: "1.7",
            color: line.startsWith("██") ? "#00aa00"
              : line.startsWith("Welcome") || line.startsWith("Connecting") ? "#ffcc00"
              : line.startsWith("Starting") ? "#ffffff"
              : "#aaaaaa",
            fontWeight: line.startsWith("Starting") || line.startsWith("Welcome") ? "bold" : "normal",
            whiteSpace: "pre",
          }}>
            {line || "\u00a0"}
          </div>
        ))}

        {ready && (
          <div style={{ marginTop: 24, color: "#00ff00", fontWeight: "bold", animation: "none" }}>
            Your computer is ready. Click or press any key to continue to WOT.
          </div>
        )}

        {!ready && <Cursor />}
      </div>
    </div>
  );
}

function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: "#aaa" }}>{on ? "█" : " "}</span>;
}



const CATEGORIES = ["Myth", "Legend", "Epic", "Folktale", "Fable", "Fairy Tale", "Historical", "Religious", "Other"];

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Congo (DRC)",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar",
  "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan",
  "Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

type PostedStory = Story & { id: number };

function PostStoryContent({ user, onViewPosted }: { user: SessionUser; onViewPosted: (story: PostedStory) => void }) {
  const [title, setTitle] = useState("");
  const [culture, setCulture] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [posted, setPosted] = useState<PostedStory | null>(null);

  function resetForm() {
    setTitle(""); setCulture(""); setCountry(""); setYear(""); setCategory(""); setText("");
    setError(""); setPosted(null);
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    if (!country.trim()) { setError("Country is required."); return; }
    if (!category) { setError("Category is required."); return; }
    if (!text.trim()) { setError("Story text is required."); return; }
    if (year && (isNaN(Number(year)) || Number(year) < 0)) { setError("Year must be a valid number."); return; }

    setLoading(true);
    try {
      const body = {
        user_id: user.userId,
        title: title.trim(),
        culture: culture.trim() || null,
        country: country.trim(),
        year: year ? Number(year) : null,
        category: category,
        text: text,
      };
      const res = await fetch(`${API_BASE}/api/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      const data: PostedStory = await res.json();
      setPosted(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post story.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: ff, fontSize: 11, padding: "2px 4px",
    border: "1px solid", borderColor: "#808080 #fff #fff #808080",
    background: "white", outline: "none", width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { width: 68, flexShrink: 0, fontFamily: ff, fontSize: 11 };
  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 };

  if (posted) {
    return (
      <div style={{ fontFamily: ff, fontSize: 11, padding: 16, display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>✅</div>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "#000080" }}>Your story has been posted!</div>
        <div style={{ color: "#333", fontSize: 11 }}>
          <span style={{ fontStyle: "italic" }}>"{posted.title}"</span> is now live.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={resetForm}
            style={{ fontFamily: ff, fontSize: 11, background: "#c0c0c0", border: "2px solid", borderColor: "#fff #808080 #808080 #fff", padding: "4px 12px", cursor: "pointer" }}
          >
            ✏️ Write another
          </button>
          <button
            type="button"
            onClick={() => onViewPosted(posted)}
            style={{ fontFamily: ff, fontSize: 11, background: "#c0c0c0", border: "2px solid", borderColor: "#fff #808080 #808080 #fff", padding: "4px 12px", cursor: "pointer" }}
          >
            📖 See my post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: ff, fontSize: 11, padding: 12, height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(to right, #000080, #4040c0)", color: "white", padding: "6px 10px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, margin: "-12px -12px 10px -12px" }}>
        <span style={{ fontSize: 18 }}>✍️</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>Post a Story</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>Signed in as {user.username}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 2 }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Title <span style={{ color: "red" }}>*</span></span>
          <input style={inputStyle} type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="the story's title" />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Country <span style={{ color: "red" }}>*</span></span>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">-- select country --</option>
            {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Culture</span>
          <input style={inputStyle} type="text" value={culture} onChange={e => setCulture(e.target.value)} placeholder="the story's culture (optional)" />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ ...labelStyle }}>Category <span style={{ color: "red" }}>*</span></span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="">-- select --</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: ff, fontSize: 11, flexShrink: 0 }}>Year</span>
            <input style={{ ...inputStyle, width: 70 }} type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="optional" />
          </div>
        </div>

        <div style={{ marginBottom: 4, fontFamily: ff, fontSize: 11 }}>
          Story Text <span style={{ color: "red" }}>*</span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="the story itself"
          style={{
            ...inputStyle,
            height: 160,
            resize: "vertical",
            lineHeight: 1.5,
            fontFamily: ff,
            fontSize: 11,
            padding: "4px 6px",
          }}
        />

        {error && (
          <div style={{ fontFamily: ff, fontSize: 11, color: "#cc0000", background: "#ffeeee", border: "1px solid #cc0000", padding: "3px 8px", marginTop: 4 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #808080", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            fontFamily: ff, fontSize: 11, background: "#c0c0c0",
            border: "2px solid", borderColor: "#fff #808080 #808080 #fff",
            padding: "4px 24px", cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1, fontWeight: "bold",
          }}
        >
          {loading ? "Posting..." : "📨 Post Story"}
        </button>
      </div>
    </div>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} xmlns="http://www.w3.org/2000/svg">
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

// ── My Space ─────────────────────────────────────────────────────────────────

function FolderExplorerIcon() {
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} xmlns="http://www.w3.org/2000/svg">
      {/* Back folder */}
      <rect x="2" y="10" width="22" height="16" rx="1" fill="#c8a020" stroke="#886800" strokeWidth="1" />
      {/* Folder tab */}
      <rect x="2" y="7" width="8" height="4" rx="1" fill="#c8a020" stroke="#886800" strokeWidth="1" />
      {/* Front folder */}
      <rect x="6" y="13" width="26" height="16" rx="1" fill="#f5c842" stroke="#b8920a" strokeWidth="1" />
      {/* Paper lines */}
      <line x1="10" y1="18" x2="28" y2="18" stroke="#b8920a" strokeWidth="1" />
      <line x1="10" y1="21" x2="28" y2="21" stroke="#b8920a" strokeWidth="1" />
      <line x1="10" y1="24" x2="22" y2="24" stroke="#b8920a" strokeWidth="1" />
    </svg>
  );
}

function MySpaceContent({ user, onOpenStory }: { user: SessionUser; onOpenStory: (story: Story) => void }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/stories`);
        if (!res.ok) throw new Error("Failed to load");
        const all: Story[] = await res.json();
        const mine = all.filter(s => (s as Story & { user_id?: number }).user_id === user.userId
          || (s.author_name && s.author_name === user.username));
        setStories(mine);
      } catch {
        setError("Failed to load stories.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Group by country
  const byCountry = stories.reduce<Record<string, Story[]>>((acc, s) => {
    const key = s.country?.trim() || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const countries = Object.keys(byCountry).sort();
  const displayedStories = selectedCountry ? (byCountry[selectedCountry] ?? []) : stories;

  const thStyle: React.CSSProperties = {
    fontFamily: ff, fontSize: 11, fontWeight: "bold", padding: "2px 8px",
    background: "#c0c0c0", borderRight: "1px solid #808080",
    borderBottom: "2px solid #808080", textAlign: "left", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    fontFamily: ff, fontSize: 11, padding: "2px 8px",
    borderBottom: "1px solid #d0d0d0", borderRight: "1px solid #d0d0d0",
    whiteSpace: "nowrap", overflow: "hidden", maxWidth: 180, textOverflow: "ellipsis",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#c0c0c0", fontFamily: ff, fontSize: 11 }}>
      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", borderBottom: "1px solid #808080" }}>

        {/* Left tree panel */}
        <div style={{
          width: 200, flexShrink: 0, borderRight: "2px solid #808080",
          background: "white", overflow: "auto", padding: "4px 0",
        }}>
          {/* Header */}
          <div style={{ padding: "3px 6px", background: "#c0c0c0", borderBottom: "1px solid #808080", fontWeight: "bold", fontSize: 11 }}>
            Stories
          </div>

          {loading && <div style={{ padding: 8, color: "#666", fontStyle: "italic" }}>Loading...</div>}
          {error && <div style={{ padding: 8, color: "red" }}>{error}</div>}

          {!loading && !error && (
            <div style={{ padding: "4px 0" }}>
              {/* Root node = username */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", cursor: "pointer", background: selectedCountry === null ? "#000080" : "transparent", color: selectedCountry === null ? "white" : "black" }}
                onClick={() => { setSelectedCountry(null); setSelectedStory(null); }}
              >
                <span style={{ fontSize: 14 }}>📁</span>
                <span style={{ fontWeight: "bold" }}>{user.username}</span>
              </div>

              {/* Country folders */}
              {countries.map(country => (
                <div key={country}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px 2px 16px", cursor: "pointer", background: selectedCountry === country ? "#000080" : "transparent", color: selectedCountry === country ? "white" : "black" }}
                    onClick={() => { setSelectedCountry(country); setSelectedStory(null); }}
                  >
                    <span style={{ fontSize: 12 }}>{selectedCountry === country ? "📂" : "📁"}</span>
                    <span>{country}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7 }}>({byCountry[country].length})</span>
                  </div>

                  {/* Story items under expanded country */}
                  {selectedCountry === country && byCountry[country].map(s => (
                    <div
                      key={s.id}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px 2px 28px", cursor: "pointer", background: selectedStory?.id === s.id ? "#000080" : "transparent", color: selectedStory?.id === s.id ? "white" : "black" }}
                      onClick={() => setSelectedStory(s)}
                      onDoubleClick={() => onOpenStory(s)}
                    >
                      <span style={{ fontSize: 11 }}>📄</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{s.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right file list panel */}
        <div style={{ flex: 1, background: "white", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Country</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Year</th>
                <th style={thStyle}>Views</th>
                <th style={thStyle}>Likes</th>
                <th style={{ ...thStyle, borderRight: "none" }}>Posted</th>
              </tr>
            </thead>
            <tbody>
              {!loading && displayedStories.map(s => (
                <tr
                  key={s.id}
                  style={{ background: selectedStory?.id === s.id ? "#000080" : "transparent", color: selectedStory?.id === s.id ? "white" : "black", cursor: "pointer" }}
                  onClick={() => setSelectedStory(s)}
                  onDoubleClick={() => onOpenStory(s)}
                >
                  <td style={tdStyle}><span style={{ fontSize: 11, marginRight: 4 }}>📄</span>{s.title}</td>
                  <td style={tdStyle}>{s.country || "—"}</td>
                  <td style={tdStyle}>{s.category || "—"}</td>
                  <td style={tdStyle}>{s.year || "—"}</td>
                  <td style={tdStyle}>{formatViews(s.views)}</td>
                  <td style={tdStyle}>{s.like_count ?? 0}</td>
                  <td style={{ ...tdStyle, borderRight: "none" }}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
              {!loading && displayedStories.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, color: "#666", fontStyle: "italic", padding: "12px 8px" }}>
                    No stories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", height: 20, flexShrink: 0 }}>
        <div style={{ flex: 1, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "1px 6px", fontSize: 11, fontFamily: ff }}>
          {loading ? "Loading..." : `${stories.length} post(s) · ${stories.reduce((s, x) => s + (x.like_count ?? 0), 0)} likes · ${countries.length} countr${countries.length !== 1 ? "ies" : "y"}`}
        </div>
        <div style={{ width: 160, border: "1px solid", borderColor: "#808080 #fff #fff #808080", padding: "1px 6px", fontSize: 11, fontFamily: ff }}>
          {selectedStory ? selectedStory.title : ""}
        </div>
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => loadSession());
  const [storyWindows, setStoryWindows] = useState<StoryWin[]>([]);
  const [zOrder, setZOrder] = useState<string[]>([]);
  const [ad, setAd] = useState<AdData | null>(null);
  const [adKey, setAdKey] = useState(0);
  const adVisibleRef = useRef(false);

  const bringToFront = useCallback((id: string) => {
    setZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((w) => w !== id), id]);
  }, []);

  // Ad popup: fires every 5–10 minutes
  useEffect(() => {
    async function showAd() {
      // Don't stack ads — skip if one is already open
      if (adVisibleRef.current) return;
      try {
        const res = await fetch(`${API_BASE}/api/stories`);
        if (!res.ok) return;
        const stories: Story[] = await res.json();
        if (!stories.length) return;

        const gradient = AD_GRADIENTS[Math.floor(Math.random() * AD_GRADIENTS.length)];
        const useMostViewed = Math.random() < 0.5;

        let story: Story;
        if (useMostViewed) {
          story = stories.reduce((best, s) => s.views > best.views ? s : best, stories[0]);
        } else {
          story = stories[Math.floor(Math.random() * stories.length)];
        }

        setAd({ type: useMostViewed ? "most_viewed" : "random", story, gradient });
        setAdKey((k) => k + 1);
        adVisibleRef.current = true;
        setZOrder((prev) => [...prev.filter((w) => w !== "ad"), "ad"]);
      } catch { /* silent */ }
    }

    // First ad after a short delay so the page feels settled
    const initialDelay = 8000;
    const firstTimer = setTimeout(() => {
      showAd();
      // Then repeat every 5–10 minutes
      function scheduleNext() {
        const ms = (5 + Math.random() * 5) * 60 * 1000;
        setTimeout(() => { showAd(); scheduleNext(); }, ms);
      }
      scheduleNext();
    }, initialDelay);

    return () => clearTimeout(firstTimer);
  }, []);

  const zIndexOf = (id: string) => { const i = zOrder.indexOf(id); return i === -1 ? 10 : 10 + i; };
  const activeId = zOrder[zOrder.length - 1];

  const search = useWin("search", setZOrder, bringToFront);
  const hometown = useWin("hometown", setZOrder, bringToFront);
  const login = useWin("login", setZOrder, bringToFront);
  const account = useWin("account", setZOrder, bringToFront);
  const about = useWin("about", setZOrder, bringToFront);
  const post = useWin("post", setZOrder, bringToFront);
  const myspace = useWin("myspace", setZOrder, bringToFront);

  const winMap: Record<string, { open: boolean; minimized: boolean; openWin: () => void; closeWin: () => void; minimizeWin: () => void }> = { search, hometown, login, account, about, post, myspace };

  const [showSplash, setShowSplash] = useState(() => {
    if (sessionStorage.getItem("wot_booted")) return false;
    sessionStorage.setItem("wot_booted", "1");
    return true;
  });
  const [pendingAccountOpen, setPendingAccountOpen] = useState(false);

  const [iconPositions, setIconPositions] = useState<Record<IconId, { col: number; row: number }>>({ ...DEFAULT_POSITIONS });

  function handleIconDrop(id: IconId, col: number, row: number) {
    setIconPositions(prev => ({ ...prev, [id]: { col, row } }));
  }

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

  function handlePostOpen() {
    if (currentUser) post.openWin();
    else login.openWin();
  }

  function handleMySpaceOpen() {
    if (currentUser) myspace.openWin();
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
    ...(post.open ? [{ id: "post", title: "Post a Story", icon: "✍️", isMinimized: post.minimized }] : []),
    ...(myspace.open ? [{ id: "myspace", title: `My Space - ${currentUser?.username ?? ""}`, icon: "📁", isMinimized: myspace.minimized }] : []),
    ...(about.open ? [{ id: "about", title: "WOT Online", icon: "📋", isMinimized: about.minimized }] : []),
    ...(search.open ? [{ id: "search", title: "Weave Our Tapestry", icon: "📖", isMinimized: search.minimized }] : []),
    ...(hometown.open ? [{ id: "hometown", title: "Our Hometown", icon: "🏠", isMinimized: hometown.minimized }] : []),
    ...storyWindows.map((sw) => ({ id: sw.windowId, title: sw.story.title, icon: "📜", isMinimized: sw.isMinimized })),
  ];

  const cx = Math.floor(window.innerWidth / 2);
  const cy = Math.floor(window.innerHeight / 2);

  return (
    <div style={{ width: "100vw", height: "100vh", paddingBottom: 48, boxSizing: "border-box", position: "relative" }}>

      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <DraggableIcon id="account" label={currentUser ? currentUser.username : "My Account"} onClick={handleAccountOpen} renderIcon={() => <PcIcon />} position={iconPositions.account} onDrop={handleIconDrop} allPositions={iconPositions} />
      <DraggableIcon id="post"    label="Post a Story" onClick={handlePostOpen}    renderIcon={() => <PenIcon />}            position={iconPositions.post}    onDrop={handleIconDrop} allPositions={iconPositions} />
      <DraggableIcon id="myspace" label="My Space"     onClick={handleMySpaceOpen} renderIcon={() => <FolderExplorerIcon />} position={iconPositions.myspace} onDrop={handleIconDrop} allPositions={iconPositions} />
      <DraggableIcon id="wot"     label="WOT"          onClick={search.openWin}    renderIcon={() => <WotIcon size={36} />}  position={iconPositions.wot}     onDrop={handleIconDrop} allPositions={iconPositions} />
      <DraggableIcon id="hometown" label={"Our Hometown"} onClick={hometown.openWin} renderIcon={() => <HometownIcon />}    position={iconPositions.hometown} onDrop={handleIconDrop} allPositions={iconPositions} />

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
        <Window key={windowId} title={story.title} initialX={initialX} initialY={initialY} initialWidth={680} initialHeight={520}
          onClose={() => closeStory(windowId)} onMinimize={() => minimizeStory(windowId)} isMinimized={isMinimized}
          zIndex={zIndexOf(windowId)} onFocus={() => bringToFront(windowId)}
        >
          <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: ff, fontSize: 11 }}>
            {/* Title header */}
            <div style={{ background: "linear-gradient(to right, #000080, #4040c0)", color: "white", padding: "8px 12px", flexShrink: 0, marginBottom: 0 }}>
              <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 2 }}>{story.title}</div>
              <div style={{ fontSize: 10, opacity: 0.85 }}>uploaded by {story.author_name || "Unknown"}</div>
            </div>

            {/* Metadata strip */}
            <div style={{ background: "#e8e8e8", borderBottom: "1px solid #c0c0c0", padding: "5px 12px", display: "flex", flexWrap: "wrap", gap: "10px 20px", flexShrink: 0 }}>
              {story.country   && <span><b>Country:</b> {story.country}</span>}
              {story.culture   && <span><b>Culture:</b> {story.culture}</span>}
              {story.category  && <span><b>Category:</b> {story.category}</span>}
              {story.year      && <span><b>Year:</b> {story.year}</span>}
              <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                <span>View(s): {formatViews(story.views)}</span>
                <span>Like(s): {story.like_count ?? 0}</span>
              </span>
            </div>

            {/* Dates */}
            <div style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd", padding: "3px 12px", display: "flex", gap: 20, fontSize: 10, color: "#666", flexShrink: 0 }}>
              <span>Posted: {formatDate(story.created_at)}</span>
              {story.updated_at && story.updated_at !== story.created_at && <span>Updated: {formatDate(story.updated_at)}</span>}
            </div>

            {/* Story text */}
            <div style={{ flex: 1, overflow: "auto", padding: "12px", lineHeight: 1.7, color: "#111", whiteSpace: "pre-wrap", fontSize: 11 }}>
              {story.text}
            </div>
          </div>
        </Window>
      ))}

      {post.open && currentUser && (
        <Window title="Post a Story" initialX={cx - 220} initialY={cy - 260} initialWidth={440} initialHeight={520}
          onClose={post.closeWin} onMinimize={post.minimizeWin} isMinimized={post.minimized}
          zIndex={zIndexOf("post")} onFocus={() => bringToFront("post")}
        >
          <PostStoryContent
            user={currentUser}
            onViewPosted={(story) => {
              handleOpenStory(story);
              post.closeWin();
            }}
          />
        </Window>
      )}

      {myspace.open && currentUser && (
        <Window
          title={`My Space - ${currentUser.username}`}
          initialX={cx - 320} initialY={cy - 250} initialWidth={640} initialHeight={480}
          onClose={myspace.closeWin} onMinimize={myspace.minimizeWin} isMinimized={myspace.minimized}
          zIndex={zIndexOf("myspace")} onFocus={() => bringToFront("myspace")}
        >
          <MySpaceContent user={currentUser} onOpenStory={handleOpenStory} />
        </Window>
      )}

      {ad && (
        <AdPopup
          key={adKey}
          ad={ad}
          onClose={() => { adVisibleRef.current = false; setAd(null); setZOrder((prev) => prev.filter((w) => w !== "ad")); }}
          zIndex={zIndexOf("ad")}
          onFocus={() => bringToFront("ad")}
        />
      )}

      <TaskBar windows={taskWindows} activeId={activeId} onFocusWindow={handleTaskbarFocus} isLoggedIn={!!currentUser} username={currentUser?.username} />
    </div>
  );
}