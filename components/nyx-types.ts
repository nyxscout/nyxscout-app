export type Grade = "ALPHA" | "BETA" | "GAMMA" | "DELTA" | "SKIP";

export type NyxToken = {
  name: string;
  symbol: string;
  address: string;
  score: number;
  grade: Grade;
  flags: string[];
  breakdown?: Record<string, number>;
  vol_24h: number;
  market_cap_usd: number;
  tx_count_24h: number;
  price_change_24h: number;
  deployed_at: string;
  deployer: string | null;
  deployer_address?: string | null;
  fee_recipient: string | null;
  website: string | null;
  tweet_url: string | null;
  // Extended
  narrative?: string;
  tracked?: boolean;
  prev_score?: number;
};

export type DeployerHistoryEntry = {
  address: string;
  name: string;
  symbol: string;
  score: number;
  grade: string;
  vol_24h: number;
  market_cap_usd: number;
  deployed_at: string;
  price_change_24h: number;
};

export type ScanPayload = {
  generated_at: string;
  engine: string;
  summary: {
    total_scanned: number;
    fresh: number;
    running: number;
    new_tokens: number;
    alerts: number;
    top_score: number;
  };
  tokens: NyxToken[];
  alerts: NyxToken[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
};

export function gradeClass(grade: string) {
  return `grade grade-${grade.toLowerCase()}`;
}

export function formatUsd(value: number | null | undefined) {
  const n = Number(value || 0);
  if (!n) return "-";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatAge(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return "-";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function flagClass(flag: string) {
  if (/whale|strong|ultra|first_deploy/i.test(flag)) return "flag flag-good";
  if (/wash|repeat|dump|fee_to/i.test(flag)) return "flag flag-bad";
  if (/low|no_/i.test(flag)) return "flag flag-warn";
  return "flag";
}
