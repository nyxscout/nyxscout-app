import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache: we already fetched 500+ tokens in /api/scan
// For deployer history, we fetch the Bankr discover endpoint and filter by deployer
let tokenCache: { address: string; deployerAddress: string; name: string; symbol: string; score: number; grade: string; vol_24h: number; market_cap_usd: number; deployed_at: string; price_change_24h: number }[] = [];
let cacheTime = 0;

async function getTokenCache() {
  if (Date.now() - cacheTime < 120_000 && tokenCache.length > 0) return tokenCache;

  const all: typeof tokenCache = [];
  let cursor: string | null = null;

  for (let page = 0; page < 5; page++) {
    const url = `https://api.bankr.bot/discover?limit=100&sort=newest${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    const results = data.results || [];
    for (const t of results) {
      all.push({
        address: t.tokenAddress || "",
        deployerAddress: t.deployerAddress || "",
        name: t.name || "?",
        symbol: t.symbol || "?",
        score: 0,
        grade: "SKIP",
        vol_24h: t.vol24h || 0,
        market_cap_usd: t.marketCapUsd || 0,
        deployed_at: (t.deployedAt || "").slice(0, 19).replace("T", " "),
        price_change_24h: t.priceChange24h || 0,
      });
    }
    if (!data.nextCursor || !results.length) break;
    cursor = data.nextCursor;
  }

  tokenCache = all;
  cacheTime = Date.now();
  return all;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!address || address === "undefined") {
    return NextResponse.json({ tokens: [] });
  }

  try {
    const cache = await getTokenCache();
    const tokens = cache.filter((t) => t.deployerAddress.toLowerCase() === address.toLowerCase());
    return NextResponse.json({ tokens, count: tokens.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed", tokens: [] },
      { status: 500 }
    );
  }
}
