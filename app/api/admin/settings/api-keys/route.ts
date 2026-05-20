import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type ProviderMap = Record<string, string[]>;

type ApiKeysConfig = {
  imageSearch: ProviderMap;
  textGeneration: ProviderMap;
  scraping: ProviderMap;
};

const SETTING_KEY = "admin_api_keys_v1";

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

function sanitizeGroup(raw: unknown): ProviderMap {
  if (!raw || typeof raw !== "object") return {};
  const out: ProviderMap = {};

  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const keys = Array.from(
      new Set(
        v
          .filter((x) => typeof x === "string")
          .map((x) => x.trim())
          .filter(Boolean)
      )
    );
    out[k] = keys;
  }

  return out;
}

function normalizeConfig(raw: unknown): ApiKeysConfig {
  if (!raw || typeof raw !== "object") return EMPTY_CONFIG;

  const conf = raw as Record<string, unknown>;
  return {
    imageSearch: {
      ...EMPTY_CONFIG.imageSearch,
      ...sanitizeGroup(conf.imageSearch),
    },
    textGeneration: {
      ...EMPTY_CONFIG.textGeneration,
      ...sanitizeGroup(conf.textGeneration),
    },
    scraping: {
      ...EMPTY_CONFIG.scraping,
      ...sanitizeGroup(conf.scraping),
    },
  };
}

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    const parsed = setting?.value ? JSON.parse(setting.value) : EMPTY_CONFIG;
    return NextResponse.json({ config: normalizeConfig(parsed) });
  } catch {
    return NextResponse.json({ config: EMPTY_CONFIG });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const config = normalizeConfig(body?.config);

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(config) },
      create: { key: SETTING_KEY, value: JSON.stringify(config) },
    });

    return NextResponse.json({ ok: true, config });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
