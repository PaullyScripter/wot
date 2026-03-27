import { useEffect, useMemo, useState } from "react";

type Story = {
  id: number;
  title: string;
  culture: string;
  text: string;
  views: number;
};

type SearchPanelProps = {
  onOpenStory: (story: Story) => void;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://weave-our-tapestry.onrender.com";

function formatViews(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n);
}

export function SearchPanel({ onOpenStory }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStories() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/api/stories`);
        if (!response.ok) {
          throw new Error(`Failed to load stories: ${response.status}`);
        }

        const data: Story[] = await response.json();
        setStories(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load stories.");
      } finally {
        setLoading(false);
      }
    }

    loadStories();
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return stories.filter((story) =>
      [story.title, story.culture, story.text]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, stories]);

  async function handleReadStory(storyId: number) {
    try {
      setError("");

      const response = await fetch(`${API_BASE}/api/stories/${storyId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch story: ${response.status}`);
      }

      const story: Story = await response.json();
      onOpenStory(story);

      await fetch(`${API_BASE}/api/stories/${storyId}/views`, {
        method: "POST",
      });

      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId ? { ...s, views: s.views + 1 } : s
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to open story.");
    }
  }

  return (
    <div>
      {/* Search bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stories..."
      />

      {loading && (
        <div style={{ fontFamily: "'Courier Prime', monospace", padding: "8px 0", color: "#444" }}>
          Loading stories...
        </div>
      )}
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      {/* Results */}
      {!loading && !error && results.map((r) => (
        <div
          key={r.id}
          style={{
            border: "1px solid #aaa",
            marginBottom: 10,
            background: "#e8e8e8",
            display: "flex",
            gap: 0,
            boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          {/* Left column — meta */}
          <div style={{
            minWidth: 210,
            maxWidth: 240,
            padding: "10px 14px",
            borderRight: "2px solid #999",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}>
            <span style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontSize: 20,
              fontWeight: 700,
              textDecoration: "underline",
              display: "block",
              marginBottom: 4,
              lineHeight: 1.2,
            }}>
              {r.title}
            </span>

            <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 13, color: "#222" }}>
              Culture: <span style={{ textDecoration: "underline", cursor: "pointer" }}>{r.culture}</span>
            </div>

            <div style={{
              marginTop: 10,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 13,
              color: "#555",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>{formatViews(r.views)}</span>
              <span title="Views">👁</span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReadStory(r.id);
                }}
                style={{ marginLeft: "auto" }}
              >
                Read Story
              </button>
            </div>
          </div>

          {/* Right column — excerpt */}
          <div style={{
            flex: 1,
            padding: "10px 14px",
            fontFamily: "'IM Fell English', Georgia, serif",
            fontSize: 14,
            lineHeight: 1.65,
            color: "#111",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 8,
            WebkitBoxOrient: "vertical",
          } as React.CSSProperties}>
            {r.text}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {!loading && !error && query.trim() && results.length === 0 && (
        <div style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 13,
          color: "#555",
          padding: "10px 0",
        }}>
          No stories found for "{query}".
        </div>
      )}
    </div>
  );
}