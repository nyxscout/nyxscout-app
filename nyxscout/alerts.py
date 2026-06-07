"""
NyxScout Alerts — Pretty terminal output + JSON export.
"""

import json
import os
from datetime import datetime
from .config import OUTPUT_DIR, ALERT_SCORE_THRESHOLD


def print_banner():
    print("""
╔══════════════════════════════════════════════╗
║  🌙  NyxScout — Finding alpha in the dark.  ║
║     Bankr token early detection engine       ║
╚══════════════════════════════════════════════╝
""")


def print_scan_summary(total_tokens: int, fresh_tokens: int, new_tokens: int, alerts: int):
    print(f"  Scanned: {total_tokens} | Fresh: {fresh_tokens} | New: {new_tokens} | Alerts: {alerts}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print()


def print_alert(token: dict, result: dict):
    s = result["score"]
    grade = result["grade"]
    flags = ", ".join(result["flags"])
    
    print(f"  {grade}  {token['name']} (${token['symbol']})  —  Score: {s}/100")
    print(f"     Vol: ${token['vol_24h']:,.0f}  |  MCap: ${token['market_cap_usd']:,.0f}  |  Tx: {token['tx_count_24h']}")
    print(f"     Deployed: {token['deployed_str']}  |  Δ24h: {token['price_change_24h']:.1f}%")
    print(f"     Flags: {flags}")
    
    if token["website"]:
        print(f"     Web: {token['website']}")
    if token["tweet_url"]:
        print(f"     X: {token['tweet_url']}")
    
    ca = token["address"]
    print(f"     CA: {ca[:12]}...{ca[-8:]}" if len(ca) > 20 else f"     CA: {ca}")
    
    dep = token["deployer_username"] or "?"
    fee = token["fee_recipient_username"] or "?"
    print(f"     Deployer: @{dep}  |  Fee: @{fee}")
    print()


def export_alerts_json(alerts: list[dict], path: str):
    """Export alerts to JSON file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    payload = {
        "generated_at": datetime.now().isoformat(),
        "engine": "NyxScout v0.1.0",
        "alert_count": len(alerts),
        "alerts": alerts,
    }
    with open(path, "w") as f:
        json.dump(payload, f, indent=2, default=str)


def export_full_scan(tokens: list[dict], path: str):
    """Export full scan results to JSON."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    payload = {
        "generated_at": datetime.now().isoformat(),
        "engine": "NyxScout v0.1.0",
        "total_tokens": len(tokens),
        "tokens": tokens,
    }
    with open(path, "w") as f:
        json.dump(payload, f, indent=2, default=str)
