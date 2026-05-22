"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  displayPrice: number;
  category: string;
  brand?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const router = useRouter();
  const pathname = usePathname();
  const apiBase = pathname.startsWith("/new") ? "/new" : "";
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCatalogTotal = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products?limit=1`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const total = typeof data?.total === "number" ? data.total : null;
        if (total !== null && !controller.signal.aborted) setCatalogTotal(total);
      } catch {
        // Keep generic placeholder if the count cannot be loaded.
      }
    };

    fetchCatalogTotal();

    return () => controller.abort();
  }, [apiBase]);

  const search = useCallback((q: string) => {
    setQuery(q);
    setError(false);
    if (timer.current) clearTimeout(timer.current);
    if (abortRef.current) abortRef.current.abort();

    if (q.trim().length < 2) { setResults([]); setOpen(false); setNoResults(false); setLoading(false); return; }

    timer.current = setTimeout(async () => {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(q)}&limit=6`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (!controller.signal.aborted) {
          const r = data.results || [];
          setResults(r);
          setSelectedIdx(-1);
          setOpen(r.length > 0);
          setNoResults(r.length === 0);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
  }, [apiBase]);

  const go = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }, [query, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (selectedIdx >= 0 && results[selectedIdx]) {
        router.push(`/product/${encodeURIComponent(results[selectedIdx].slug)}`);
        setOpen(false);
      } else {
        go();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <input
          className="input"
          style={{ borderRadius: "var(--r-sm) 0 0 var(--r-sm)", borderRight: "none" }}
          placeholder={catalogTotal !== null ? `Search ${catalogTotal.toLocaleString()} products...` : "Search products..."}
          value={query}
          onChange={(e) => search(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          aria-label="Search products"
          autoComplete="off"
        />
        <button
          className="btn btn-primary"
          style={{ borderRadius: "0 var(--r-sm) var(--r-sm) 0", padding: "0 18px", flexShrink: 0 }}
          onClick={go}
          aria-label="Search"
        >
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: "inline-block" }}
            >
              ⌛
            </motion.span>
          ) : (
            <span>🔍</span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {/* Loading skeleton */}
        {loading && query.trim().length >= 2 && !results.length && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)",
              left: 0, right: 0,
              padding: "20px 16px",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              zIndex: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 11, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)",
              left: 0, right: 0,
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              zIndex: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {results.map((r, i) => (
              <Link
                key={r.id}
                href={`/product/${encodeURIComponent(r.slug)}`}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  textDecoration: "none",
                  color: "var(--c-text)",
                  borderBottom: i < results.length - 1 ? "1px solid var(--c-border)" : "none",
                  transition: "background 0.1s",
                  background: i === selectedIdx ? "var(--c-surface2)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--c-surface2)";
                  setSelectedIdx(i);
                }}
                onMouseLeave={(e) => {
                  if (i !== selectedIdx) e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 8,
                  background: "var(--c-surface2)",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.title} width={40} height={40} style={{ objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: 18 }}>📦</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                    {r.title}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{r.category}</span>
                    {r.brand && (
                      <span style={{ fontSize: 10, color: "var(--c-accent)", fontWeight: 600, textTransform: "uppercase" }}>
                        {r.brand}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 }}>
                  ${Math.round(r.displayPrice || 0)}
                </span>
              </Link>
            ))}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 16px", borderTop: "1px solid var(--c-border)",
              }}
            >
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                style={{ fontSize: 13, color: "var(--c-accent)", textDecoration: "none", fontWeight: 500 }}
                onClick={() => setOpen(false)}
              >
                See all results for &quot;{query}&quot; →
              </Link>
              <span style={{ fontSize: 11, color: "var(--c-muted)" }}>
                ↑↓ navigate · ↵ open
              </span>
            </div>
          </motion.div>
        )}

        {/* No results state */}
        {!loading && !error && noResults && query.trim().length >= 2 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)",
              left: 0, right: 0,
              padding: "24px 16px",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              zIndex: 200,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.6 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>
              No results for &quot;{query}&quot;
            </div>
            <div style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 12 }}>
              Try different keywords or browse categories
            </div>
            <Link
              href="/shop"
              style={{ fontSize: 13, color: "var(--c-accent)", textDecoration: "none", fontWeight: 600 }}
              onClick={() => setNoResults(false)}
            >
              Browse all products →
            </Link>
          </motion.div>
        )}

        {/* Error state */}
        {error && query.trim().length >= 2 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)",
              left: 0, right: 0,
              padding: "12px 16px",
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
              borderRadius: "var(--r-md)",
              fontSize: 13, color: "var(--c-muted)",
              zIndex: 200,
            }}
          >
            Search temporarily unavailable. Please try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
