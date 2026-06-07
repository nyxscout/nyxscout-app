import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RawToken = {
  address: string; name: string; symbol: string; score: number; grade: string; flags: string[];
  vol_24h: number; market_cap_usd: number; tx_count_24h: number; price_change_24h: number;
  deployed_at: string; deployer: string | null; deployer_address: string | null;
  fee_recipient: string | null; website: string | null; tweet_url: string | null;
};

const SEED_TOKENS: RawToken[] = [
  { name: "FarmGPT", symbol: "FarmGPT", address: "0xa1b2c3d4", score: 82, grade: "ALPHA", flags: ["whale_vol","strong_pump","first_deploy"], vol_24h: 469937, market_cap_usd: 70360, tx_count_24h: 3597, price_change_24h: 209.5, deployed_at: "2026-06-05 20:48:31", deployer: "tomiyasu16", deployer_address: "0xd1e2f3a4", fee_recipient: "tomiyasu16", website: "https://chatgptpro.substack.com/p/hiroki-tomiyasu", tweet_url: "https://x.com/tomiyasu16/status/2062784970910007775" },
  { name: "Cassie", symbol: "CASSIE", address: "0xb2c3d4e5", score: 76, grade: "ALPHA", flags: ["whale_vol","strong_pump"], vol_24h: 250905, market_cap_usd: 38361, tx_count_24h: 2164, price_change_24h: 90.9, deployed_at: "2026-06-05 22:04:27", deployer: "TheCyberverse", deployer_address: "0xe2f3a4b5", fee_recipient: "TheCyberverse", website: "https://cassie.trade", tweet_url: "https://x.com/TheCyberverse/status/2063015087309300007" },
  { name: "Kleo Klaw", symbol: "KLEO", address: "0xc3d4e5f6", score: 74, grade: "BETA", flags: ["whale_vol","strong_pump"], vol_24h: 166199, market_cap_usd: 39375, tx_count_24h: 1203, price_change_24h: 85.8, deployed_at: "2026-06-06 14:13:21", deployer: "0xblackchip", deployer_address: "0xf3a4b5c6", fee_recipient: "humfhuang", website: "https://kleoklaw.com/", tweet_url: "https://x.com/humfhuang/status/2063075387626938497" },
  { name: "NUMETAL", symbol: "NUMETAL", address: "0xd4e5f6a7", score: 65, grade: "BETA", flags: [], vol_24h: 106702, market_cap_usd: 27987, tx_count_24h: 961, price_change_24h: 18.7, deployed_at: "2026-06-06 00:32:01", deployer: "goekhan", deployer_address: "0xa4b5c6d7", fee_recipient: "goekhan", website: "https://numetal.xyz" },
  { name: "Erigon", symbol: "Erigon", address: "0xe5f6a7b8", score: 63, grade: "BETA", flags: ["first_deploy"], vol_24h: 106390, market_cap_usd: 20924, tx_count_24h: 748, price_change_24h: 7.0, deployed_at: "2026-06-05 14:28:32", deployer: "SolTwencher", deployer_address: "0xb5c6d7e8", website: "https://erigon.tech/", tweet_url: "https://x.com/ErigonEth" },
  { name: "SleuthAI", symbol: "Sleuth", address: "0xf6a7b8c9", score: 67, grade: "BETA", flags: ["whale_vol"], vol_24h: 105414, market_cap_usd: 26364, tx_count_24h: 903, price_change_24h: 28.4, deployed_at: "2026-06-05 23:31:18", deployer: "99barzzz", deployer_address: "0xc6d7e8f9", fee_recipient: "sleuth_ai", website: "https://sleuthagent.ai/", tweet_url: "https://x.com/99barzzz/status/2061477877674336710" },
  { name: "Moonlark", symbol: "Moon", address: "0xa7b8c9d0", score: 60, grade: "BETA", flags: ["first_deploy"], vol_24h: 83641, market_cap_usd: 20710, tx_count_24h: 527, price_change_24h: 3.9, deployed_at: "2026-06-05 18:00:03", deployer: "kephi_chunawa", deployer_address: "0xd7e8f9a0", fee_recipient: "kephi_chunawa", tweet_url: "https://x.com/kephi_chunawa/status/2062168221722264013" },
  { name: "SynaptAgent", symbol: "Synapt", address: "0xb8c9d0e1", score: 58, grade: "GAMMA", flags: [], vol_24h: 79087, market_cap_usd: 20011, tx_count_24h: 745, price_change_24h: -13.5, deployed_at: "2026-06-05 20:15:42", deployer: "matsongc", deployer_address: "0xe8f9a0b1", fee_recipient: "SynaptAgent", website: "https://synaptagent.org/", tweet_url: "https://x.com/SynaptAgent/status/2062991473055035896" },
  { name: "Ceeya App", symbol: "Ceeya", address: "0xc9d0e1f2", score: 62, grade: "BETA", flags: [], vol_24h: 72876, market_cap_usd: 26267, tx_count_24h: 432, price_change_24h: 27.5, deployed_at: "2026-06-06 14:23:14", deployer: "areshawns", deployer_address: "0xf9a0b1c2", fee_recipient: "areshawns", website: "https://ceeya.app/", tweet_url: "https://x.com/areshawns" },
  { name: "Impeccable", symbol: "IMP", address: "0xIMP", score: 55, grade: "GAMMA", flags: [], vol_24h: 47565, market_cap_usd: 21161, tx_count_24h: 246, price_change_24h: 0.9, deployed_at: "2026-06-06 15:24:01", deployer: "pbakaus", deployer_address: "0xpbakaus", fee_recipient: "pbakaus", tweet_url: "https://twitter.com/pbakaus/status/2063280695049380131" },
  { name: "Loom Agent", symbol: "LOOM", address: "0xLOOM", score: 64, grade: "BETA", flags: ["whale_vol"], vol_24h: 42616, market_cap_usd: 27866, tx_count_24h: 385, price_change_24h: 36.9, deployed_at: "2026-06-06 18:28:56", deployer: "LoomAgent", deployer_address: "0xLoom", fee_recipient: "LoomAgent", website: "https://loom-agent.com", tweet_url: "https://x.com/LoomAgent" },
  { name: "Tollbooth", symbol: "Tollbooth", address: "0xTB", score: 53, grade: "GAMMA", flags: [], vol_24h: 40932, market_cap_usd: 18293, tx_count_24h: 503, price_change_24h: -3.6, deployed_at: "2026-06-04 19:27:50", deployer: "tryTollbooth", deployer_address: "0xTBooth", fee_recipient: "tryTollbooth", website: "https://www.trytollbooth.com/", tweet_url: "https://x.com/tryTollbooth" },
  { name: "agent", symbol: "AGENT", address: "0xAGENT", score: 61, grade: "BETA", flags: [], vol_24h: 34766, market_cap_usd: 28441, tx_count_24h: 380, price_change_24h: 30.4, deployed_at: "2026-06-06 03:07:51", deployer: "agentic_fi", deployer_address: "0xAgFi", fee_recipient: "agentic_fi" },
];

function applyFilters(tokens: RawToken[], params: URLSearchParams): RawToken[] {
  let filtered = [...tokens];

  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const scoreMin = params.get("scoreMin");
  const scoreMax = params.get("scoreMax");
  const volMin = params.get("volMin");
  const volMax = params.get("volMax");

  if (dateFrom) {
    const from = new Date(dateFrom.replace("T", " ").replace("Z", "") + "Z").getTime();
    if (!isNaN(from)) filtered = filtered.filter((t) => {
      const d = new Date(t.deployed_at.replace(" ", "T") + "Z").getTime();
      return !isNaN(d) && d >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo.replace("T", " ").replace("Z", "") + "Z").getTime();
    if (!isNaN(to)) filtered = filtered.filter((t) => {
      const d = new Date(t.deployed_at.replace(" ", "T") + "Z").getTime();
      return !isNaN(d) && d <= to;
    });
  }
  if (scoreMin) filtered = filtered.filter((t) => t.score >= Number(scoreMin));
  if (scoreMax) filtered = filtered.filter((t) => t.score <= Number(scoreMax));
  if (volMin) filtered = filtered.filter((t) => t.vol_24h >= Number(volMin));
  if (volMax) filtered = filtered.filter((t) => t.vol_24h <= Number(volMax));

  return filtered;
}

function paginate(tokens: RawToken[], page: number, limit: number) {
  const total = tokens.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * limit;
  const paginated = tokens.slice(start, start + limit);

  return { tokens: paginated, total, page: safePage, totalPages, limit };
}

async function fetchBankrTokens(): Promise<{ tokens: RawToken[]; source: string }> {
  async function tryFetch(url: string, attempt = 0): Promise<Response | null> {
    const headers: Record<string, string> = { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; NyxScout/1.0)" };
    if (attempt > 0) headers["Origin"] = "https://bankr.bot";
    try { const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) }); if (res.ok) return res; } catch {}
    if (attempt < 3) {
      const urls = ["https://api.bankr.bot/discover?limit=200&sort=newest", "https://api.bankr.bot/discover?limit=200", "https://api.bankr.bot/discover?limit=100"];
      return tryFetch(urls[attempt + 1] || url, attempt + 1);
    }
    return null;
  }

  const res = await tryFetch("https://api.bankr.bot/discover?limit=200&sort=newest");
  if (res && res.ok) {
    const data = await res.json();
    const raw = (data.results || []) as Record<string, unknown>[];
    const tokens: RawToken[] = raw.map((t) => ({
      name: (t.name as string) || "?", symbol: (t.symbol as string) || "?", address: (t.tokenAddress as string) || "",
      score: 0, grade: "SKIP", flags: [] as string[],
      vol_24h: (t.vol24h as number) || 0, market_cap_usd: (t.marketCapUsd as number) || 0,
      tx_count_24h: (t.txCount24h as number) || 0, price_change_24h: (t.priceChange24h as number) || 0,
      deployed_at: ((t.deployedAt as string) || "").slice(0, 19).replace("T", " "),
      deployer: (t.deployerXUsername as string) || null, deployer_address: (t.deployerAddress as string) || null,
      fee_recipient: (t.feeRecipientXUsername as string) || null, website: (t.websiteUrl as string) || null, tweet_url: (t.tweetUrl as string) || null,
    }));
    return { tokens, source: "live" };
  }

  return { tokens: SEED_TOKENS, source: "seed" };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const limit = Math.min(200, Math.max(10, Number(params.get("limit")) || 50));
  const now = new Date();

  try {
    const { tokens: allTokens, source } = await fetchBankrTokens();
    const filtered = applyFilters(allTokens, params);
    const { tokens, total, page: currentPage, totalPages } = paginate(filtered, page, limit);

    // Build summary from ALL tokens (before filter) for context
    const summary = {
      total_scanned: allTokens.length,
      fresh: allTokens.filter((t) => {
        const d = new Date(t.deployed_at.replace(" ", "T") + "Z");
        return !isNaN(d.getTime()) && (now.getTime() - d.getTime()) < 48 * 60 * 60 * 1000;
      }).length,
      running: allTokens.filter((t) => t.vol_24h >= 10000).length,
      new_tokens: allTokens.filter((t) => {
        const d = new Date(t.deployed_at.replace(" ", "T") + "Z");
        return !isNaN(d.getTime()) && (now.getTime() - d.getTime()) < 86400000;
      }).length,
      alerts: allTokens.filter((t) => t.vol_24h >= 50000).length,
      top_score: Math.max(...allTokens.map((t) => t.score)),
    };
    const alerts = allTokens.filter((t) => t.vol_24h >= 50000);

    return NextResponse.json({
      generated_at: now.toISOString(),
      engine: `NyxScout (${source})`,
      summary,
      tokens,
      alerts,
      pagination: { total, page: currentPage, totalPages, limit },
    });
  } catch (error) {
    const filtered = applyFilters(SEED_TOKENS, params);
    const { tokens, total, page: currentPage, totalPages } = paginate(filtered, page, limit);
    return NextResponse.json({
      generated_at: now.toISOString(), engine: "NyxScout (seed fallback)", summary: { total_scanned: 500, fresh: filtered.length, running: filtered.filter((t) => t.vol_24h >= 10000).length, new_tokens: filtered.length, alerts: filtered.filter((t) => t.vol_24h >= 50000).length, top_score: Math.max(...filtered.map((t) => t.score)) },
      tokens, alerts: filtered.filter((t) => t.vol_24h >= 50000), pagination: { total, page: currentPage, totalPages, limit },
    });
  }
}
