"use client";

import { useEffect, useState } from "react";

type PulseData = {
  summary: string;
  breakdown: string;
  source: string;
  generated_at: string;
  token_count: number;
};

export function MarketPulse({ tokens }: { tokens: { address: string; name: string; symbol: string; vol_24h: number; price_change_24h: number; deployed_at: string; narrative?: string }[] }) {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokens.length) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: tokens.map((t) => ({ name: t.name, symbol: t.symbol, vol_24h: t.vol_24h, price_change_24h: t.price_change_24h, deployed_at: t.deployed_at, narrative: t.narrative })) }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error("Pulse failed");
        const d = await res.json();
        if (!cancelled) { setData(d); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Pulse unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tokens.length]);

  if (loading && !data) {
    return (
      <div className="market-pulse loading">
        <span className="pulse-icon">🔮</span>
        <div className="pulse-body">
          <div className="pulse-title">Market Pulse</div>
          <div className="pulse-text">Analyzing market trends from {tokens.length} tokens...</div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="market-pulse error">
        <span className="pulse-icon">📊</span>
        <div className="pulse-body">
          <div className="pulse-title">Market Pulse</div>
          <div className="pulse-text pulse-fallback">Data-driven summary from {tokens.length} tokens.</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="market-pulse">
      <div className="pulse-icon">
        {data.source === "ai" ? "🔮" : "📊"}
        {data.source === "ai" && <span className="pulse-spark" />}
      </div>
      <div className="pulse-body">
        <div className="pulse-title">
          Market Pulse
          {data.source === "data" && <span className="pulse-badge">fallback</span>}
        </div>
        <div className="pulse-text">{data.summary}</div>
        <div className="pulse-meta">
          <span className="pulse-breakdown">{data.breakdown}</span>
          <span className="pulse-ts">
            {data.generated_at ? new Date(data.generated_at).toLocaleTimeString() : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
