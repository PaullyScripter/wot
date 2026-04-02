import { useEffect, useMemo, useState } from "react";

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

type SearchPanelProps = {
  onOpenStory: (story: Story) => void;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://weave-our-tapestry.onrender.com";

function formatViews(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k+`;
  return String(n ?? 0);
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
        setStories(Array.isArray(data) ? data : []);
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
      [
        story.title ?? "",
        story.culture ?? "",
        story.country ?? "",
        story.category ?? "",
        story.text ?? "",
        story.author_name ?? "",
        String(story.year ?? ""),
      ]
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
          s.id === storyId ? { ...s, views: (s.views ?? 0) + 1 } : s
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to open story.");
    }
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, author, country, culture, category, year..."
      />

      {loading && (
        <div
          style={{
            fontFamily: "'Courier Prime', monospace",
            padding: "8px 0",
            color: "#444",
          }}
        >
          Loading stories...
        </div>
      )}

      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      {!loading &&
        !error &&
        results.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #aaa",
              marginBottom: 10,
              background: "#e8e8e8",
              display: "flex",
              gap: 0,
              boxShadow:
                "inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 0 1px 3px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                minWidth: 210,
                maxWidth: 240,
                padding: "10px 14px",
                borderRight: "2px solid #999",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  textDecoration: "underline",
                  display: "block",
                  marginBottom: 4,
                  lineHeight: 1.2,
                }}
              >
                {r.title}
              </span>

              {r.author_name && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: "#222" }}>
                  Uploader: <span style={{ textDecoration: "underline" }}>{r.author_name}</span>
                </div>
              )}
              {r.country && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: "#222" }}>
                  Country: <span style={{ textDecoration: "underline" }}>{r.country}</span>
                </div>
              )}
              {r.culture && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: "#222" }}>
                  Culture: <span style={{ textDecoration: "underline" }}>{r.culture}</span>
                </div>
              )}
              {r.category && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: "#222" }}>
                  Category: <span style={{ textDecoration: "underline" }}>{r.category}</span>
                </div>
              )}
              {r.year && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: "#222" }}>
                  Year: <span style={{ textDecoration: "underline" }}>{r.year}</span>
                </div>
              )}
              {r.created_at && (
                <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: "#666" }}>
                  🗓 {formatDate(r.created_at)}
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 12,
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>👁 {formatViews(r.views)}</span>
                <span>❤️ {r.like_count ?? 0}</span>
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
                  Read
                </button>
              </div>
            </div>

            <div
              style={{
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
              }}
            >
              {r.text}
            </div>
          </div>
        ))}

      {!loading && !error && query.trim() && results.length === 0 && (
        <div
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 13,
            color: "#555",
            padding: "10px 0",
          }}
        >
          No stories found for "{query}".
        </div>
      )}
    </div>
  );
}