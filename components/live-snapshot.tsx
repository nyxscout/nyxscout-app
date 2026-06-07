"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScanPayload } from "./nyx-types";
import { formatUsd, gradeClass } from "./nyx-types";

export function LiveSnapshot() {
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/scan", { cache: "no-store" });
        if (!response.ok) throw new Error(`Scan failed: ${response.status}`);
        const data = (await response.json()) as ScanPayload;
        if (!cancelled) {
          setPayload(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Scan failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tokens = useMemo(() => (payload?.alerts.length ? payload.alerts : payload?.tokens ?? []).slice(0, 6), [payload]);

  return (
    <aside className="snapshot-panel" aria-label="Live token snapshot">
      <div className="panel-head">
        <div className="panel-title">
          <span className={`status-dot ${error ? "off" : ""}`} />
          Live scan
        </div>
        <div className="panel-meta">
          {payload ? `${payload.summary.running} running` : loading ? "scanning" : "offline"}
        </div>
      </div>
      {tokens.length > 0 ? (
        <div className="token-list">
          {tokens.map((token) => (
            <div className="token-strip" key={token.address || `${token.name}-${token.symbol}`}>
              <div className="token-name">
                <strong>{token.name}</strong>
                <span>${token.symbol}</span>
              </div>
              <span className={gradeClass(token.grade)}>{token.score}</span>
              <span className="metric">{formatUsd(token.vol_24h)}</span>
              <span className="metric">{formatUsd(token.market_cap_usd)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div>
            <strong>{error ? "Scanner offline" : "Scanning Bankr"}</strong>
            <span>{error ? "The live endpoint did not respond yet." : "Fresh tokens will appear here."}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
