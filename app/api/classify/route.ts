import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function classifyToken(token: { name: string; symbol: string; website?: string | null; tweet_url?: string | null }): string {
  const text = `${token.name} ${token.symbol} ${token.website || ""} ${token.tweet_url || ""}`.toLowerCase();

  if (/agent|assistant|bot|automation|orchestrat/i.test(text)) return "AI Agent";
  if (/trade|swap|yield|liquidity|perps|hedge|farm/i.test(text)) return "DeFi";
  if (/game|gaming|play|nft|market|collect/i.test(text)) return "Gaming";
  if (/creative|design|art|studio|visual|pulp/i.test(text)) return "Creative";
  if (/api|database|sqlite|cloud|host|node|infra|protocol|sdk|plugin/i.test(text)) return "Infra";
  if (/social|chat|app|ceeya|community/i.test(text)) return "Social";

  return "Other";
}

export async function POST(request: Request) {
  try {
    const { tokens } = await request.json();
    if (!Array.isArray(tokens)) {
      return NextResponse.json({ error: "tokens array required" }, { status: 400 });
    }

    const classified = tokens.map((t: Record<string, unknown>) => ({
      address: t.address || "",
      narrative: classifyToken(t as { name: string; symbol: string; website?: string | null; tweet_url?: string | null }),
    }));

    return NextResponse.json({ classified });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Classification failed" },
      { status: 500 }
    );
  }
}
