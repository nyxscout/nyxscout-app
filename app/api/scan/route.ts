import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Retry with different strategies for Railway's IP
  async function tryFetch(url: string, attempt = 0): Promise<Response> {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; NyxScout/1.0)",
    };
    if (attempt > 0) headers["Origin"] = "https://bankr.bot";

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok && attempt < 2) {
      // Retry with different params
      const urls = [
        "https://api.bankr.bot/discover?limit=200",
        "https://api.bankr.bot/discover?limit=200&sort=newest",
      ];
      return tryFetch(urls[attempt + 1] || url, attempt + 1);
    }
    return res;
  }

  try {
    const res = await tryFetch("https://api.bankr.bot/discover?limit=200");
    if (!res.ok) throw new Error(`Bankr API returned ${res.status}`);

    const data = await res.json();
    const raw = data.results || [];

    const now = new Date();
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const tokens = raw
      .map((t: Record<string, unknown>) => ({
        name: (t.name as string) || "?",
        symbol: (t.symbol as string) || "?",
        address: (t.tokenAddress as string) || "",
        score: 0,
        grade: "SKIP",
        flags: [] as string[],
        vol_24h: (t.vol24h as number) || 0,
        market_cap_usd: (t.marketCapUsd as number) || 0,
        tx_count_24h: (t.txCount24h as number) || 0,
        price_change_24h: (t.priceChange24h as number) || 0,
        deployed_at: ((t.deployedAt as string) || "").slice(0, 19).replace("T", " "),
        deployer: (t.deployerXUsername as string) || null,
        deployer_address: (t.deployerAddress as string) || null,
        fee_recipient: (t.feeRecipientXUsername as string) || null,
        website: (t.websiteUrl as string) || null,
        tweet_url: (t.tweetUrl as string) || null,
      }))
      .filter((t) => {
        if (!t.deployed_at) return false;
        const d = new Date(t.deployed_at.replace(" ", "T") + "Z");
        return !Number.isNaN(d.getTime()) && d >= cutoff;
      });

    const alerts = tokens.filter((t) => t.vol_24h >= 50000);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      engine: "NyxScout v0.1.0",
      summary: {
        total_scanned: raw.length,
        fresh: tokens.length,
        running: tokens.filter((t) => t.vol_24h >= 10000).length,
        new_tokens: tokens.filter((t) => {
          const d = new Date(t.deployed_at.replace(" ", "T") + "Z");
          return !Number.isNaN(d.getTime()) && (now.getTime() - d.getTime()) < 86400000;
        }).length,
        alerts: alerts.length,
        top_score: 0,
      },
      tokens,
      alerts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}
