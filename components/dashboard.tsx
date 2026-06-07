"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeployerHistoryEntry, NyxToken, ScanPayload } from "./nyx-types";
import { flagClass, formatAge, formatUsd, gradeClass } from "./nyx-types";
import { MarketPulse } from "./market-pulse";

type SortKey = "score" | "volume" | "mcap" | "age";
type Narrative = "All" | "AI Agent" | "DeFi" | "Gaming" | "Creative" | "Infra" | "Social" | "Other";

const NARRATIVES: Narrative[] = ["All", "AI Agent", "DeFi", "Gaming", "Creative", "Infra", "Social", "Other"];

const headers: { key: SortKey | "token" | "signals" | "track"; label: string; className?: string }[] = [
  { key: "track", label: "", className: "col-track" },
  { key: "token", label: "Token" },
  { key: "score", label: "Score", className: "col-score" },
  { key: "volume", label: "Volume", className: "col-volume" },
  { key: "mcap", label: "Mcap", className: "col-mcap" },
  { key: "age", label: "Age", className: "col-age" },
  { key: "signals", label: "Signals" },
];

const STORAGE_WATCH = "nyx_watch";
const STORAGE_TRACKED = "nyx_tracked";

function loadFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveToStorage(key: string, data: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function Dashboard() {
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "deployer">("info");
  const [deployerHistory, setDeployerHistory] = useState<Record<string, DeployerHistoryEntry[]>>({});
  const [deployerLoading, setDeployerLoading] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<Narrative>("All");
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [tracked, setTracked] = useState<string[]>(loadFromStorage(STORAGE_TRACKED));
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const [watchWallets, setWatchWallets] = useState<string[]>(loadFromStorage(STORAGE_WATCH));
  const [watchPanel, setWatchPanel] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // 1. Fetch scan data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/scan", { cache: "no-store" });
        if (!response.ok) throw new Error(`Scan failed: ${response.status}`);
        const data = (await response.json()) as ScanPayload;
        if (!cancelled) {
          // Track score changes
          const now = Date.now();
          const newScores: Record<string, number> = {};
          for (const t of data.tokens) {
            newScores[t.address] = t.score;
          }
          setPrevScores((prev) => {
            // Only keep tracked tokens' prev scores
            const kept: Record<string, number> = {};
            for (const addr of tracked) {
              if (prev[addr] !== undefined) kept[addr] = prev[addr];
              if (newScores[addr] !== undefined) kept[addr] = newScores[addr];
            }
            return kept;
          });

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
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  // 1b. Classify narratives
  useEffect(() => {
    if (!payload?.tokens?.length) return;
    (async () => {
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokens: payload.tokens.map((t) => ({ address: t.address, name: t.name, symbol: t.symbol, website: t.website, tweet_url: t.tweet_url })) }),
        });
        const data = await res.json();
        if (data.classified) {
          const map: Record<string, string> = {};
          for (const c of data.classified) map[c.address] = c.narrative;
          setNarratives(map);
        }
      } catch {}
    })();
  }, [payload?.tokens?.length]);

  // 2. Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { setExpanded(null); setDetailTab("info"); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "/" && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // 3. Filter + sort
  const tokens = useMemo(() => {
    const source = payload?.tokens ?? [];
    const q = query.trim().toLowerCase();
    let filtered = q
      ? source.filter((token) => `${token.name} ${token.symbol} ${token.address}`.toLowerCase().includes(q))
      : source;

    if (narrative !== "All") {
      filtered = filtered.filter((t) => narratives[t.address] === narrative);
    }

    const direction = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      return (av - bv) * direction;
    });
  }, [payload, query, sortDir, sortKey, narrative, narratives]);

  const stats = payload?.summary;

  // 4. Deployer History fetcher
  const loadDeployerHistory = useCallback(async (address: string) => {
    if (deployerHistory[address] || !address || address === "undefined") return;
    setDeployerLoading(address);
    try {
      const res = await fetch(`/api/deployer/${address}`, { cache: "no-store" });
      const data = await res.json();
      if (data.tokens) {
        setDeployerHistory((prev) => ({ ...prev, [address]: data.tokens }));
      }
    } catch {} finally {
      setDeployerLoading(null);
    }
  }, [deployerHistory]);

  // 5. Score tracker
  const trackedCount = useMemo(() => tracked.length, [tracked]);
  const scoreDrops = useMemo(() => {
    const drops: { token: NyxToken; from: number; to: number }[] = [];
    for (const addr of tracked) {
      const token = payload?.tokens?.find((t) => t.address === addr);
      const prev = prevScores[addr];
      if (token && prev !== undefined && prev > 0 && token.score < prev - 15) {
        drops.push({ token, from: prev, to: token.score });
      }
    }
    return drops;
  }, [tracked, payload?.tokens, prevScores]);

  // 6. Wallet watch
  const followedWallets = useMemo(() => {
    return watchWallets.map((addr) => {
      const token = payload?.tokens?.find((t) => t.deployer_address === addr || t.deployer === addr);
      return { address: addr, username: token?.deployer || addr.slice(0, 10) };
    }).filter(Boolean);
  }, [watchWallets, payload?.tokens]);

  function toggleWatch(addr: string) {
    setWatchWallets((prev) => {
      const next = prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr];
      saveToStorage(STORAGE_WATCH, next);
      return next;
    });
  }

  function toggleTrack(addr: string) {
    setTracked((prev) => {
      const next = prev.includes(addr) ? prev.filter((a) => a !== addr) : [...prev, addr];
      saveToStorage(STORAGE_TRACKED, next);
      return next;
    });
  }

  function updateSort(key: SortKey | "token" | "signals" | "track") {
    if (key === "token" || key === "signals" || key === "track") return;
    if (sortKey === key) setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <Link href="/" className="brand">🌙 Nyx<span>Scout</span></Link>
        <div className="search-box">
          <input ref={searchRef} type="search" value={query} onChange={(e) => { setQuery(e.target.value); setExpanded(null); }} placeholder="Filter tokens..." aria-label="Filter tokens" />
        </div>
        <div className="topbar-actions">
          <span className={`status-dot ${error ? "off" : ""}`} />
          <span>{error ? "offline" : loading ? "scanning" : "live"}</span>
        </div>
      </header>

      <nav className="stats-ribbon" aria-label="Scan statistics">
        <Stat value={stats?.total_scanned} label="Scanned" />
        <Stat value={stats?.fresh} label="Fresh" />
        <Stat value={stats?.running} label="Running" />
        <Stat value={stats?.alerts} label="Alerts" />
        <Stat value={stats?.top_score} label="Top score" />
        <Stat value={trackedCount || undefined} label="Tracked" />
        {scoreDrops.length > 0 && <Stat value={scoreDrops.length} label="⚠ Score drops" />}
        <Stat value={payload ? new Date(payload.generated_at).toLocaleTimeString() : undefined} label="Last scan" />
      </nav>

      {/* Narrative Chips */}
      <div className="narrative-chips">
        {NARRATIVES.map((n) => (
          <button
            key={n}
            className={`chip ${narrative === n ? "active" : ""}`}
            onClick={() => { setNarrative(n); setExpanded(null); }}
          >
            {n === "All" ? "All" : n}
            {n !== "All" && payload?.tokens ? ` (${payload.tokens.filter((t) => narratives[t.address] === n).length})` : ""}
          </button>
        ))}
      </div>

      <MarketPulse tokens={tokens.map((t) => ({ ...t, narrative: narratives[t.address] }))} />

      {/* Main area: table + watch panel */}
      <div className="table-area">
        <section className="table-wrap">
          {loading ? (
            <div className="empty-state"><div><strong>Scanning Bankr</strong><span>The token feed is warming up.</span></div></div>
          ) : error ? (
            <div className="empty-state"><div><strong>Scanner offline</strong><span>{error}</span></div></div>
          ) : tokens.length === 0 ? (
            <div className="empty-state"><div><strong>No matching tokens</strong><span>Try a different filter or search term.</span></div></div>
          ) : (
            <table className="token-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header.key} className={`${header.className ?? ""} ${sortKey === header.key ? "active" : ""}`}
                      onClick={() => updateSort(header.key)}>{header.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tokens.slice(0, 80).map((token) => (
                  <TokenRows
                    key={token.address || `${token.name}-${token.symbol}`}
                    token={token}
                    expanded={expanded === token.address}
                    detailTab={detailTab}
                    narrative={narratives[token.address]}
                    tracked={tracked.includes(token.address)}
                    watched={watchWallets.includes(token.deployer_address || "")}
                    onToggle={() => {
                      if (expanded === token.address) { setExpanded(null); setDetailTab("info"); }
                      else { setExpanded(token.address); setDetailTab("info"); }
                    }}
                    onTrack={() => toggleTrack(token.address)}
                    onWatch={() => { if (token.deployer_address) toggleWatch(token.deployer_address); }}
                    onDeployerClick={() => {
                      setDetailTab("deployer");
                      if (token.deployer_address) loadDeployerHistory(token.deployer_address);
                    }}
                    onInfoClick={() => setDetailTab("info")}
                    deployerHistory={token.deployer_address ? deployerHistory[token.deployer_address] : undefined}
                    deployerLoading={deployerLoading === token.deployer_address}
                  />
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Wallet Watch Panel */}
        {watchPanel && (
          <aside className="watch-panel">
            <div className="watch-head">
              <strong>Wallet Watch</strong>
              <button className="watch-close" onClick={() => setWatchPanel(false)}>×</button>
            </div>
            {followedWallets.length === 0 ? (
              <div className="watch-empty">Click + on any deployer to follow them.</div>
            ) : (
              <div className="watch-list">
                {followedWallets.map((w) => (
                  <div className="watch-item" key={w.address}>
                    <span className="watch-user">@{w.username}</span>
                    {payload?.tokens?.filter((t) => t.deployer_address === w.address).map((t) => (
                      <div className="watch-token" key={t.address}>
                        <span>{t.name}</span>
                        <span className={gradeClass(t.grade)}>{t.score}</span>
                        <span className="metric">{formatUsd(t.vol_24h)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <footer className="dashboard-footer">
        <div className="footer-hints">
          <kbd>/</kbd> Search &nbsp; <kbd>⌘K</kbd> Focus &nbsp; <kbd>Esc</kbd> Close &nbsp;
          <button className="footer-btn" onClick={() => setWatchPanel((p) => !p)}>
            {watchPanel ? "Hide Watch" : "Show Watch"}
          </button>
        </div>
        <div className="footer-links">
          <a href="https://github.com/nyxscout" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
            GitHub
          </a>
          <span className="footer-divider" />
          <a href="https://x.com/nyxscout" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @nyxscout
          </a>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string | number | undefined; label: string }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value ?? "-"}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function TokenRows({
  token, expanded, detailTab, narrative, tracked, watched,
  onToggle, onTrack, onWatch, onDeployerClick, onInfoClick, deployerHistory, deployerLoading,
}: {
  token: NyxToken;
  expanded: boolean;
  detailTab: "info" | "deployer";
  narrative?: string;
  tracked: boolean;
  watched: boolean;
  onToggle: () => void;
  onTrack: () => void;
  onWatch: () => void;
  onDeployerClick: () => void;
  onInfoClick: () => void;
  deployerHistory?: DeployerHistoryEntry[];
  deployerLoading?: boolean;
}) {
  return (
    <>
      <tr className={`token-row ${expanded ? "expanded" : ""}`} onClick={onToggle} tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); } }}>
        <td className="col-track">
          <button className={`track-star ${tracked ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onTrack(); }}
            title={tracked ? "Stop tracking" : "Start tracking"}>{tracked ? "★" : "☆"}</button>
        </td>
        <td>
          <div className="token-name">
            <strong>{token.name}</strong>
            <span>${token.symbol}</span>
          </div>
        </td>
        <td className="col-score">
          <span className={gradeClass(token.grade)}>{token.score}</span>
        </td>
        <td className="col-volume metric">{formatUsd(token.vol_24h)}</td>
        <td className="col-mcap metric">{formatUsd(token.market_cap_usd)}</td>
        <td className="col-age metric">{formatAge(token.deployed_at)}</td>
        <td>
          <div className="flag-list">
            {narrative && <span className="flag flag-info">{narrative}</span>}
            {token.flags.slice(0, 3).map((flag) => (
              <span className={flagClass(flag)} key={flag}>{flag}</span>
            ))}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="detail-row">
          <td colSpan={7}>
            <div className="detail-tabs">
              <button className={`detail-tab ${detailTab === "info" ? "active" : ""}`}
                onClick={onInfoClick}>Token Info</button>
              <button className={`detail-tab ${detailTab === "deployer" ? "active" : ""}`}
                onClick={onDeployerClick}>Deployer History</button>
              {token.deployer_address && (
                <button className={`watch-btn ${watched ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onWatch(); }}>
                  {watched ? "✓ Watching" : "+ Follow"}
                </button>
              )}
            </div>

            {detailTab === "info" ? (
              <div className="detail-grid">
                <Detail label="Contract" value={token.address || "-"} />
                <Detail label="Deployer" value={token.deployer ? `@${token.deployer} (click Deployer tab)` : "-"} />
                <Detail label="Fee recipient" value={token.fee_recipient ? `@${token.fee_recipient}` : "-"} />
                <Detail label="Transactions" value={token.tx_count_24h.toLocaleString()} />
                <Detail label="24h change" value={`${token.price_change_24h >= 0 ? "+" : ""}${token.price_change_24h.toFixed(1)}%`} />
                <DetailLink label="Website" href={token.website} />
                <DetailLink label="X / Twitter" href={token.tweet_url} />
                <Detail label="Grade" value={token.grade} />
              </div>
            ) : (
              <div className="deployer-history">
                {deployerLoading ? (
                  <div className="dh-loading">Loading deployer history...</div>
                ) : deployerHistory && deployerHistory.length > 0 ? (
                  <div className="dh-list">
                    {deployerHistory.map((dh) => (
                      <div className="dh-item" key={dh.address}>
                        <div className="dh-name">{dh.name} <span>${dh.symbol}</span></div>
                        <div className="dh-stats">
                          <span className={gradeClass(dh.grade)}>{dh.score}</span>
                          <span className="metric">{formatUsd(dh.vol_24h)}</span>
                          <span className="metric">{formatAge(dh.deployed_at)}</span>
                          <span className={dh.price_change_24h >= 0 ? "dh-up" : "dh-down"}>{dh.price_change_24h >= 0 ? "+" : ""}{dh.price_change_24h.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dh-empty">No prior tokens from this deployer.</div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetailLink({ label, href }: { label: string; href: string | null }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      {href ? <a href={href} target="_blank" rel="noreferrer">Open link</a> : <strong>-</strong>}
    </div>
  );
}

function getSortValue(token: NyxToken, key: SortKey) {
  if (key === "score") return token.score || 0;
  if (key === "volume") return token.vol_24h || 0;
  if (key === "mcap") return token.market_cap_usd || 0;
  const date = new Date(token.deployed_at.includes("T") ? token.deployed_at : `${token.deployed_at.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
