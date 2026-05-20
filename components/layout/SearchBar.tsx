"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  displayPrice: number;
  category: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const go = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <input
          className="input"
          style={{ borderRadius: "var(--r-sm) 0 0 var(--r-sm)", borderRight: "none" }}
          placeholder="Search products, brands..."
          value={query}
          onChange={(e) => search(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <button
          className="btn btn-primary"
          style={{ borderRadius: "0 var(--r-sm) var(--r-sm) 0", padding: "0 18px", flexShrink: 0 }}
          onClick={go}
        >
          {loading ? "⏳" : "🔍"}
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0, right: 0,
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            zIndex: 200,
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          {results.map((r) => (
            <a
              key={r.id}
              href={`/product/${r.slug}`}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                textDecoration: "none",
                color: "var(--c-text)",
                borderBottom: "1px solid var(--c-border)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-surface2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {r.imageUrl && (
                <img src={r.imageUrl} alt={r.title} style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 6, background: "var(--c-surface2)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{r.category}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 }}>${r.displayPrice.toFixed(2)}</span>
            </a>
          ))}
          <a
            href={`/search?q=${encodeURIComponent(query)}`}
            style={{ display: "block", padding: "10px 16px", fontSize: 13, color: "var(--c-accent)", textDecoration: "none", fontWeight: 500, textAlign: "center" }}
          >
            See all results for &quot;{query}&quot; →
          </a>
        </div>
      )}
    </div>
  );
}
