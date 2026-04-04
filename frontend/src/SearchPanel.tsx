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
        if (!response.ok) throw new Error(`Failed to load stories: ${response.status}`);
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
      if (!response.ok) throw new Error(`Failed to fetch story: ${response.status}`);
      const story: Story = await response.json();
      onOpenStory(story);
      await fetch(`${API_BASE}/api/stories/${storyId}/views`, { method: "POST" });
      setStories((prev) =>
        prev.map((s) => s.id === storyId ? { ...s, views: (s.views ?? 0) + 1 } : s)
      );
    } catch (err) {
      console.error(err);
      setError("Failed to open story.");
    }
  }

  return (
    <div className="sp-root">
      <input
        className="sp-search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, author, country, culture, category, year..."
      />

      {loading && <div className="sp-status-text">Loading stories...</div>}
      {error && <div className="sp-status-text sp-error">{error}</div>}

      {!loading && !error && results.map((r) => (
        <div key={r.id} className="sp-card">
          <div className="sp-card-meta">
            <span className="sp-card-title">{r.title}</span>
            {r.author_name && <div className="sp-card-detail">By: <span className="sp-card-detail-val">{r.author_name}</span></div>}
            {r.country    && <div className="sp-card-detail">Country: <span className="sp-card-detail-val">{r.country}</span></div>}
            {r.culture    && <div className="sp-card-detail">Culture: <span className="sp-card-detail-val">{r.culture}</span></div>}
            {r.category   && <div className="sp-card-detail">Category: <span className="sp-card-detail-val">{r.category}</span></div>}
            {r.year       && <div className="sp-card-detail">Year: <span className="sp-card-detail-val">{r.year}</span></div>}
            {r.created_at && <div className="sp-card-date">{formatDate(r.created_at)}</div>}
            <div className="sp-card-stats">
              <span>{formatViews(r.views)} views</span>
              <span>{r.like_count ?? 0} likes</span>
              <button
                type="button"
                className="sp-read-btn"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleReadStory(r.id); }}
              >
                Read
              </button>
            </div>
          </div>
          <div className="sp-card-preview">{r.text}</div>
        </div>
      ))}

      {!loading && !error && query.trim() && results.length === 0 && (
        <div className="sp-status-text">No stories found for "{query}".</div>
      )}
    </div>
  );
}