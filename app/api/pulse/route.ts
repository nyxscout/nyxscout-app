import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LLM_API_KEY = "tp-sub2v2fq4hdo59ah7zg4mp2y9o6eguwze7ia3v9p91etczn2tp-s78dbg8alj7trdkh8xfa9bbmknl55ypvbneclcnjvouk750f";
const LLM_BASE = "https://api.together.xyz/v1/chat/completions";
const LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";

function buildPrompt(tokens: Record<string, unknown>[]): string {
  const narratives: Record<string, { count: number; vol: number; tokens: string[] }> = {};
  let topToken = { name: "", vol: 0, change: 0, narrative: "" };

  for (const t of tokens) {
    const n = (t.narrative as string) || "Other";
    if (!narratives[n]) narratives[n] = { count: 0, vol: 0, tokens: [] };
    narratives[n].count++;
    narratives[n].vol += (t.vol_24h as number) || 0;
    narratives[n].tokens.push(`${t.name} ($${(t.vol_24h as number)?.toLocaleString() || "0"} vol, ${(t.price_change_24h as number)?.toFixed(1) || "0"}%)`);

    if ((t.vol_24h as number) > topToken.vol) {
      topToken = { name: t.name as string, vol: t.vol_24h as number, change: t.price_change_24h as number, narrative: n };
    }
  }

  const sorted = Object.entries(narratives).sort((a, b) => b[1].vol - a[1].vol);
  const breakdown = sorted.map(([name, data]) => `${name} ${data.count}`).join(" · ");

  const categoryLines = sorted.map(([name, data]) => {
    const avgChange = data.tokens.length > 0 ? tokens.filter((t) => (t.narrative as string) === name).reduce((s, t) => s + ((t.price_change_24h as number) || 0), 0) / data.tokens.length : 0;
    return `${name}: ${data.count} tokens, $${(data.vol / 1000)?.toFixed(0) || "0"}K combined vol, avg ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%`;
  }).join(". ");

  return `Analyze Bankr token market data. Write ONE concise paragraph (2-3 sentences) about what's trending, which narrative is hottest, and the most notable token.

Top token: ${topToken.name} ($${topToken.vol?.toLocaleString() || "0"}, ${topToken.change >= 0 ? "+" : ""}${topToken.change?.toFixed(1) || "0"}%)
Narrative breakdown: ${categoryLines}.

Total tokens analyzed: ${tokens.length}.`;
}

async function callLLM(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(LLM_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: "You are a crypto market analyst. Be specific, data-driven, and concise. No fluff, no disclaimers." },
          { role: "user", content: prompt },
        ],
        max_tokens: 250,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function generateFallback(tokens: Record<string, unknown>[]): string {
  const narratives: Record<string, { count: number; vol: number }> = {};
  let topToken = { name: "", vol: 0, change: 0 };
  let topNarrative = "";

  for (const t of tokens) {
    const n = (t.narrative as string) || "Other";
    if (!narratives[n]) narratives[n] = { count: 0, vol: 0 };
    narratives[n].count++;
    narratives[n].vol += (t.vol_24h as number) || 0;
    if ((t.vol_24h as number) > topToken.vol) {
      topToken = { name: t.name as string, vol: t.vol_24h as number, change: t.price_change_24h as number };
    }
  }

  const sorted = Object.entries(narratives).sort((a, b) => b[1].vol - a[1].vol);
  topNarrative = sorted[0]?.[0] || "Other";

  const freshest = tokens.filter((t) => {
    const d = t.deployed_at as string;
    if (!d) return false;
    const diff = Date.now() - new Date(d.replace(" ", "T") + "Z").getTime();
    return diff < 4 * 60 * 60 * 1000;
  }).sort((a, b) => ((b.vol_24h as number) || 0) - ((a.vol_24h as number) || 0));

  let summary = `${topNarrative} narratives lead Bankr today with ${sorted[0][1].count} tokens. `;
  if (topToken.name) summary += `${topToken.name} tops volume at $${(topToken.vol / 1000).toFixed(0)}K${topToken.change >= 0 ? " (+" : " ("}${topToken.change?.toFixed(1) || "0"}%). `;
  if (freshest.length > 0) summary += `Fresh signal: ${freshest[0].name} deployed ${Math.floor((Date.now() - new Date((freshest[0].deployed_at as string).replace(" ", "T") + "Z").getTime()) / 60000)}m ago.`;

  return summary;
}

export async function POST(request: Request) {
  try {
    const { tokens } = await request.json();
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ summary: "No tokens to analyze.", breakdown: "", generated_at: new Date().toISOString() });
    }

    const prompt = buildPrompt(tokens);

    let summary = await callLLM(prompt);
    let source: string;
    if (summary) {
      source = "ai";
    } else {
      summary = generateFallback(tokens);
      source = "data";
    }

    // Build breakdown
    const narratives: Record<string, number> = {};
    for (const t of tokens) {
      const n = (t.narrative as string) || "Other";
      narratives[n] = (narratives[n] || 0) + 1;
    }
    const breakdown = Object.entries(narratives)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${name} ${count}`)
      .join(" · ");

    return NextResponse.json({
      summary,
      breakdown,
      source,
      generated_at: new Date().toISOString(),
      token_count: tokens.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pulse failed", summary: "Market analysis unavailable.", breakdown: "" },
      { status: 500 }
    );
  }
}
