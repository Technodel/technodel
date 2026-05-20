"use client";

import { useEffect, useMemo, useState } from "react";

type ProviderMap = Record<string, string[]>;

type ApiKeysConfig = {
  imageSearch: ProviderMap;
  textGeneration: ProviderMap;
  scraping: ProviderMap;
};

const EMPTY_CONFIG: ApiKeysConfig = {
  imageSearch: {
    serpapi: [],
    serper: [],
  },
  textGeneration: {
    deepseek: [],
    groq: [],
    openrouter: [],
  },
  scraping: {
    scrapingbee: [],
    scrapedo: [],
    oxylabsUsername: [],
    oxylabsPassword: [],
  },
};

const TAB_STYLES = {
  base: {
    border: "1px solid var(--c-border)",
    borderBottom: "none",
    borderRadius: "10px 10px 0 0",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } as const,
  active: {
    background: "var(--c-surface)",
    color: "var(--c-text)",
  } as const,
  inactive: {
    background: "transparent",
    color: "var(--c-muted)",
  } as const,
};

function toText(val?: string[]) {
  return (val || []).join("\n");
}

function fromText(val: string) {
  return val
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SettingsTabsClient({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<"general" | "api-keys">(initialTab === "general" ? "general" : "api-keys");
  const [config, setConfig] = useState<ApiKeysConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (tab !== "api-keys") return;
    let mounted = true;
    setLoading(true);
    fetch("/api/admin/settings/api-keys")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.config) {
          setConfig({
            imageSearch: { ...EMPTY_CONFIG.imageSearch, ...(data.config.imageSearch || {}) },
            textGeneration: { ...EMPTY_CONFIG.textGeneration, ...(data.config.textGeneration || {}) },
            scraping: { ...EMPTY_CONFIG.scraping, ...(data.config.scraping || {}) },
          });
        }
      })
      .catch(() => {
        if (mounted) setMsg("Could not load API keys.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [tab]);

  const hasAnyKey = useMemo(() => {
    const groups = [config.imageSearch, config.textGeneration, config.scraping];
    return groups.some((g) => Object.values(g).some((arr) => arr.length > 0));
  }, [config]);

  function updateProvider(group: keyof ApiKeysConfig, provider: string, value: string) {
    setConfig((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [provider]: fromText(value),
      },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Save failed.");
      } else {
        setMsg("API keys saved.");
      }
    } catch {
      setMsg("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
        <button
          type="button"
          onClick={() => setTab("api-keys")}
          style={{
            ...TAB_STYLES.base,
            ...(tab === "api-keys" ? TAB_STYLES.active : TAB_STYLES.inactive),
          }}
        >
          API Keys
        </button>
        <button
          type="button"
          onClick={() => setTab("general")}
          style={{
            ...TAB_STYLES.base,
            ...(tab === "general" ? TAB_STYLES.active : TAB_STYLES.inactive),
          }}
        >
          General
        </button>
      </div>

      <div style={{ border: "1px solid var(--c-border)", borderRadius: "0 10px 10px 10px", padding: 20, background: "var(--c-surface)" }}>
        {tab === "general" && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>General Settings</h3>
            <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
              Use the API Keys tab to manage image search and text generation providers with fallback key order.
            </p>
          </div>
        )}

        {tab === "api-keys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Image Search APIs</h3>
              <ProviderField
                label="SerpAPI"
                hint="One key per line. First key is primary, next keys are fallbacks."
                value={toText(config.imageSearch.serpapi)}
                onChange={(val) => updateProvider("imageSearch", "serpapi", val)}
              />
              <ProviderField
                label="Serper"
                value={toText(config.imageSearch.serper)}
                onChange={(val) => updateProvider("imageSearch", "serper", val)}
              />
            </section>

            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Text Generation APIs</h3>
              <ProviderField
                label="DeepSeek"
                value={toText(config.textGeneration.deepseek)}
                onChange={(val) => updateProvider("textGeneration", "deepseek", val)}
              />
              <ProviderField
                label="Groq"
                value={toText(config.textGeneration.groq)}
                onChange={(val) => updateProvider("textGeneration", "groq", val)}
              />
              <ProviderField
                label="OpenRouter"
                value={toText(config.textGeneration.openrouter)}
                onChange={(val) => updateProvider("textGeneration", "openrouter", val)}
              />
            </section>

            <section>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Scraping / Proxies</h3>
              <ProviderField
                label="ScrapingBee"
                value={toText(config.scraping.scrapingbee)}
                onChange={(val) => updateProvider("scraping", "scrapingbee", val)}
              />
              <ProviderField
                label="Scrape.do"
                value={toText(config.scraping.scrapedo)}
                onChange={(val) => updateProvider("scraping", "scrapedo", val)}
              />
              <ProviderField
                label="Oxylabs Username"
                value={toText(config.scraping.oxylabsUsername)}
                onChange={(val) => updateProvider("scraping", "oxylabsUsername", val)}
              />
              <ProviderField
                label="Oxylabs Password"
                value={toText(config.scraping.oxylabsPassword)}
                onChange={(val) => updateProvider("scraping", "oxylabsPassword", val)}
              />
            </section>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || loading}
                onClick={save}
              >
                {saving ? "Saving..." : "Save API Keys"}
              </button>
              <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
                {loading ? "Loading..." : hasAnyKey ? "Primary key is first line. Fallbacks follow." : "No keys stored yet."}
              </span>
            </div>
            {msg && <div style={{ fontSize: 13, color: "var(--c-muted)" }}>{msg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--c-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{hint}</div>}
      <textarea
        className="input"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
        placeholder="One key per line"
      />
    </div>
  );
}
