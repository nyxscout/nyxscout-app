"""
NyxScout Core — Main scan engine.
Orchestrates: API fetch → filter → score → alert → export
"""

import sys
from datetime import datetime, timezone, timedelta

from .api import BankrClient
from .scorer import score_token
from .alerts import (
    print_banner, print_scan_summary, print_alert,
    export_alerts_json, export_full_scan,
)
from .db import TokenDB
from .config import (
    OUTPUT_DIR, MONITOR_WINDOW_HOURS, ALERT_SCORE_THRESHOLD, VOLUME_THRESHOLD_USD,
)

client = BankrClient()


def run_scan(verbose: bool = True) -> dict:
    """Execute a full scan cycle. Returns summary dict."""
    
    if verbose:
        print_banner()
    
    # 1. Fetch tokens from Bankr
    raw_tokens = client.fetch_all_tokens()
    tokens = [client.normalize(t) for t in raw_tokens]
    
    # 2. Filter: only tokens within monitor window (default 48h)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=MONITOR_WINDOW_HOURS)
    fresh = [
        t for t in tokens 
        if t["deployed_at"] and t["deployed_at"].replace(tzinfo=timezone.utc) >= cutoff
    ]
    
    # 3. Filter: must have at least some volume to be "running"
    running = [t for t in fresh if t["vol_24h"] >= VOLUME_THRESHOLD_USD]
    
    if verbose:
        print(f"  [filter] {len(tokens)} total → {len(fresh)} fresh (≤{MONITOR_WINDOW_HOURS}h) → {len(running)} running (≥${VOLUME_THRESHOLD_USD:,} vol)")
    
    # 4. Load DB for deployer history
    db = TokenDB(f"{OUTPUT_DIR}/db.json")
    deployer_history = db.get_deployer_history()
    
    # 5. Score tokens & build results
    new_tokens_count = 0
    results = []
    
    for token in running:
        is_new = db.is_new_token(token["address"])
        if is_new:
            new_tokens_count += 1
        
        # Score
        result = score_token(token, deployer_history)
        token["nyx_score"] = result["score"]
        token["nyx_grade"] = result["grade"]
        token["nyx_flags"] = result["flags"]
        token["nyx_breakdown"] = result["breakdown"]
        
        results.append({
            "token": token,
            "result": result,
            "is_new": is_new,
        })
        
        # Track deployer
        db.record_deployer(token["deployer_address"])
        db.mark_seen(token["address"])
    
    # 6. Sort by score descending
    results.sort(key=lambda r: r["result"]["score"], reverse=True)
    
    # 7. Generate alerts
    alerts = [r for r in results if r["result"]["score"] >= ALERT_SCORE_THRESHOLD]
    
    if verbose:
        print_scan_summary(len(tokens), len(fresh), new_tokens_count, len(alerts))
    
    if verbose and alerts:
        print("  ═══ ALERTS ═══\n")
        for r in alerts:
            if db.should_alert(r["token"]["address"]):
                print_alert(r["token"], r["result"])
                db.record_alert(
                    r["token"]["address"],
                    r["token"]["name"],
                    r["result"]["score"],
                )
    
    if verbose and not alerts:
        print("  🌙 No alpha detected in this scan. Nyx watches on.\n")
    
    # 8. Export
    alert_data = []
    for r in alerts:
        t = r["token"]
        alert_data.append({
            "name": t["name"],
            "symbol": t["symbol"],
            "address": t["address"],
            "score": r["result"]["score"],
            "grade": r["result"]["grade"],
            "flags": r["result"]["flags"],
            "breakdown": r["result"]["breakdown"],
            "vol_24h": t["vol_24h"],
            "market_cap_usd": t["market_cap_usd"],
            "tx_count_24h": t["tx_count_24h"],
            "price_change_24h": t["price_change_24h"],
            "deployed_at": t["deployed_str"],
            "deployer": t["deployer_username"],
            "fee_recipient": t["fee_recipient_username"],
            "website": t["website"],
            "tweet_url": t["tweet_url"],
        })
    
    export_alerts_json(alert_data, f"{OUTPUT_DIR}/alerts.json")
    
    # Export all running tokens
    all_data = []
    for r in results:
        t = r["token"]
        all_data.append({
            "name": t["name"],
            "symbol": t["symbol"],
            "address": t["address"],
            "score": r["result"]["score"],
            "grade": r["result"]["grade"],
            "flags": r["result"]["flags"],
            "vol_24h": t["vol_24h"],
            "market_cap_usd": t["market_cap_usd"],
            "tx_count_24h": t["tx_count_24h"],
            "price_change_24h": t["price_change_24h"],
            "deployed_at": t["deployed_str"],
            "deployer": t["deployer_username"],
            "fee_recipient": t["fee_recipient_username"],
            "website": t["website"],
            "tweet_url": t["tweet_url"],
        })
    export_full_scan(all_data, f"{OUTPUT_DIR}/tokens.json")
    
    if verbose:
        print(f"  📁 Output saved to {OUTPUT_DIR}/")
        print(f"     alerts.json  — {len(alert_data)} high-score tokens")
        print(f"     tokens.json  — {len(all_data)} running tokens")
        print()
    
    return {
        "total_scanned": len(tokens),
        "fresh": len(fresh),
        "running": len(running),
        "new_tokens": new_tokens_count,
        "alerts": len(alerts),
        "top_score": alerts[0]["result"]["score"] if alerts else 0,
    }


if __name__ == "__main__":
    run_scan()
