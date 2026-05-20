/**
 * lib/seo-enricher.ts — AI-powered SEO text enhancement
 * Uses provider fallbacks from env + Settings DB
 */

import axios from "axios";
import { prisma } from "@/lib/prisma";

export type EnrichType =
  | "title"
  | "shortDescription"
  | "description"
  | "seoTitle"
  | "seoDescription"
  | "seoKeywords";

const PROMPTS: Record<EnrichType, (text: string, ctx: string) => string> = {
  title: (text, ctx) =>
    `You are an SEO expert. Rewrite this product title to be more SEO-friendly, clear, and compelling. Keep it under 70 characters. Return ONLY the rewritten title, nothing else.\n\nOriginal title: "${text}"\nContext: ${ctx}`,

  shortDescription: (text, ctx) =>
    `You are an SEO copywriter. Rewrite this product short description to be engaging and SEO-optimized (under 160 characters). Highlight key benefits. Return ONLY the text.\n\nOriginal: "${text}"\nContext: ${ctx}`,

  description: (text, ctx) =>
    `You are an SEO copywriter. Enhance this product description to be more SEO-friendly and persuasive. Keep key facts, add relevant keywords naturally. Return ONLY the improved HTML text.\n\nOriginal: "${text}"\nContext: ${ctx}`,

  seoTitle: (text, ctx) =>
    `Write an SEO meta title for this product. Under 60 characters, include the main keyword. Return ONLY the title.\n\nProduct: "${text}"\nContext: ${ctx}`,

  seoDescription: (text, ctx) =>
    `Write an SEO meta description for this product. Under 155 characters, compelling and keyword-rich. Return ONLY the description.\n\nProduct: "${text}"\nContext: ${ctx}`,

  seoKeywords: (text, ctx) =>
    `Generate 10 relevant SEO keywords for this product, comma-separated. Focus on buyer intent keywords. Return ONLY the comma-separated keywords.\n\nProduct: "${text}"\nContext: ${ctx}`,
};

async function getGeminiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "gemini_api_key" } });
    return setting?.value || null;
  } catch {
    return null;
  }
}

type ProviderKeys = {
  deepseek: string[];
  groq: string[];
  openrouter: string[];
};

async function getTextProviderKeys(): Promise<ProviderKeys> {
  const empty: ProviderKeys = { deepseek: [], groq: [], openrouter: [] };
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "admin_api_keys_v1" } });
    if (!setting?.value) return empty;
    const parsed = JSON.parse(setting.value);
    const text = parsed?.textGeneration || {};
    const asList = (v: unknown): string[] =>
      Array.isArray(v)
        ? v.filter((x) => typeof x === "string").map((x: string) => x.trim()).filter(Boolean)
        : [];

    return {
      deepseek: asList(text.deepseek),
      groq: asList(text.groq),
      openrouter: asList(text.openrouter),
    };
  } catch {
    return empty;
  }
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object" && "text" in (c as Record<string, unknown>)) {
          const val = (c as Record<string, unknown>).text;
          return typeof val === "string" ? val : "";
        }
        return "";
      })
      .join(" ")
      .trim();
    return text;
  }
  return "";
}

async function callGemini(prompt: string, apiKey: string): Promise<string | null> {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    },
    { timeout: 20000 }
  );

  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function callOpenAICompat(args: {
  url: string;
  key: string;
  model: string;
  prompt: string;
  extraHeaders?: Record<string, string>;
}): Promise<string | null> {
  const res = await axios.post(
    args.url,
    {
      model: args.model,
      messages: [
        { role: "system", content: "You are an SEO assistant. Return only the requested final text." },
        { role: "user", content: args.prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    },
    {
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${args.key}`,
        "Content-Type": "application/json",
        ...(args.extraHeaders || {}),
      },
    }
  );

  const content = res.data?.choices?.[0]?.message?.content;
  const text = extractMessageText(content);
  return text || null;
}

export async function enrichText(
  type: EnrichType,
  text: string,
  context?: string
): Promise<{ enhanced: string; error?: string }> {
  if (!text?.trim()) return { enhanced: text, error: "Empty input" };

  const prompt = PROMPTS[type](text.slice(0, 2000), context?.slice(0, 500) || "");
  const errors: string[] = [];

  const geminiKey = await getGeminiKey();
  if (geminiKey) {
    try {
      const enhanced = await callGemini(prompt, geminiKey);
      if (enhanced) return { enhanced };
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  const providers = await getTextProviderKeys();

  for (const key of providers.deepseek) {
    try {
      const enhanced = await callOpenAICompat({
        url: "https://api.deepseek.com/chat/completions",
        key,
        model: "deepseek-chat",
        prompt,
      });
      if (enhanced) return { enhanced };
    } catch (err: unknown) {
      errors.push(`DeepSeek: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  for (const key of providers.groq) {
    try {
      const enhanced = await callOpenAICompat({
        url: "https://api.groq.com/openai/v1/chat/completions",
        key,
        model: "llama-3.1-8b-instant",
        prompt,
      });
      if (enhanced) return { enhanced };
    } catch (err: unknown) {
      errors.push(`Groq: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  for (const key of providers.openrouter) {
    try {
      const enhanced = await callOpenAICompat({
        url: "https://openrouter.ai/api/v1/chat/completions",
        key,
        model: "openrouter/auto",
        prompt,
        extraHeaders: {
          "HTTP-Referer": "http://localhost:4040",
          "X-Title": "Technodel SEO Enricher",
        },
      });
      if (enhanced) return { enhanced };
    } catch (err: unknown) {
      errors.push(`OpenRouter: ${err instanceof Error ? err.message : "request failed"}`);
    }
  }

  if (!geminiKey && !providers.deepseek.length && !providers.groq.length && !providers.openrouter.length) {
    return {
      enhanced: text,
      error: "No text-generation API keys configured. Add keys in Admin > Settings > API Keys.",
    };
  }

  return { enhanced: text, error: errors[0] || "All providers failed." };
}
