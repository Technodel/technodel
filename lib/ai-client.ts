import { prisma } from "@/lib/prisma";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type ProviderDef = {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  envKey?: string;
};

type ProviderAttempt = {
  name: string;
  endpoint: string;
  model: string;
  key: string;
  extraHeaders?: Record<string, string>;
};

const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/chat/completions",
    model: "deepseek-chat",
    envKey: "DEEPSEEK_API_KEY",
  },
  {
    id: "groq",
    name: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    envKey: "GROQ_API_KEY",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "openrouter/auto",
    envKey: "OPENROUTER_API_KEY",
  },
  {
    id: "mistral",
    name: "Mistral",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    envKey: "MISTRAL_API_KEY",
  },
  {
    id: "together",
    name: "Together",
    endpoint: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    envKey: "TOGETHER_API_KEY",
  },
  {
    id: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
  },
];

const DEFAULT_PROVIDER_ORDER = PROVIDER_DEFS.map((p) => p.id);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function parseJsonSafely<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type AdminApiKeysConfig = {
  textGeneration?: Record<string, unknown>;
};

async function getStoredSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["admin_api_keys_v1", "ai_keys", "ai_provider_order"] } },
    select: { key: true, value: true },
  });

  const map = new Map<string, string>();
  for (const row of rows) map.set(row.key, row.value);
  return map;
}

function buildProviderOrder(savedOrder: string[]): ProviderDef[] {
  if (!savedOrder.length) return PROVIDER_DEFS;

  const valid = savedOrder.filter((id) => DEFAULT_PROVIDER_ORDER.includes(id));
  if (!valid.length) return PROVIDER_DEFS;

  const ordered = [
    ...valid.map((id) => PROVIDER_DEFS.find((p) => p.id === id)).filter((p): p is ProviderDef => Boolean(p)),
    ...PROVIDER_DEFS.filter((p) => !valid.includes(p.id)),
  ];

  return ordered;
}

async function getProviderAttempts(): Promise<ProviderAttempt[]> {
  let settings: Map<string, string>;
  try {
    settings = await getStoredSettings();
  } catch {
    settings = new Map<string, string>();
  }

  const adminConfig = parseJsonSafely<AdminApiKeysConfig>(settings.get("admin_api_keys_v1"), {});
  const adminText = adminConfig.textGeneration && typeof adminConfig.textGeneration === "object"
    ? (adminConfig.textGeneration as Record<string, unknown>)
    : {};

  const legacyAiKeys = parseJsonSafely<Record<string, string>>(settings.get("ai_keys"), {});
  const legacyOrder = parseJsonSafely<string[]>(settings.get("ai_provider_order"), []);
  const providers = buildProviderOrder(legacyOrder);

  const attempts: ProviderAttempt[] = [];

  for (const provider of providers) {
    const adminKeys = asStringArray(adminText[provider.id]);
    const legacyKey = typeof legacyAiKeys[provider.id] === "string" ? legacyAiKeys[provider.id].trim() : "";
    const envKey = provider.envKey ? (process.env[provider.envKey] || "").trim() : "";
    const keys = uniqueStrings([...adminKeys, legacyKey, envKey]);

    for (const key of keys) {
      attempts.push({
        name: provider.name,
        endpoint: provider.endpoint,
        model: provider.model,
        key,
        extraHeaders:
          provider.id === "openrouter"
            ? {
                "HTTP-Referer": "https://technodel.net/new",
                "X-Title": "Technodel AI Search",
              }
            : undefined,
      });
    }
  }

  return attempts;
}

export async function aiChat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; timeoutMs?: number; json?: boolean } = {}
): Promise<string | null> {
  const providers = await getProviderAttempts();
  if (providers.length === 0) return null;

  const { maxTokens = 500, timeoutMs = 8000, json = false } = opts;

  for (const provider of providers) {
    try {
      const body: Record<string, unknown> = {
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      };
      if (json) body.response_format = { type: "json_object" };

      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.key}`,
          "Content-Type": "application/json",
          ...(provider.extraHeaders || {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        console.warn(`[ai-client] ${provider.name} HTTP ${res.status} - trying next`);
        continue;
      }

      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log(`[ai-client] Used ${provider.name}`);
        return text;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[ai-client] ${provider.name} failed: ${message} - trying next`);
    }
  }

  console.error("[ai-client] All providers exhausted");
  return null;
}

export function parseAiJson<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
