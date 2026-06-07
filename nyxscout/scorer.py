"""
NyxScout Scorer — Alpha scoring algorithm.

Signals:
  1. Website?      (+15) — legitimacy
  2. Twitter?      (+10) — social proof
  3. Deployer=Fee? (+20) — skin in the game
  4. Repeat deploy?(-10) — rug risk
  5. Volume spike  (+25) — real interest
  6. Tx/MCap ratio (+15) — organic activity
  7. Price action  (+15) — momentum
  8. Freshness     (+3-5) — ultra-fresh bonus
"""

from datetime import datetime, timezone, timedelta
from .config import SCORE_WEIGHTS, VOLUME_THRESHOLD_USD, FRESHNESS_HOURS


def score_token(token: dict, deployer_history: dict[str, int]) -> dict:
    b = {}
    flags = []
    total = 0

    # 1. Website
    if token["website"]:
        b["website"] = SCORE_WEIGHTS["has_website"]
        total += SCORE_WEIGHTS["has_website"]
    else:
        b["website"] = 0
        flags.append("no_website")

    # 2. Twitter
    if token["tweet_url"]:
        b["twitter"] = SCORE_WEIGHTS["has_twitter"]
        total += SCORE_WEIGHTS["has_twitter"]
    else:
        b["twitter"] = 0
        flags.append("no_twitter")

    # 3. Deployer == Fee Recipient
    dep = token["deployer_username"]
    fee = token["fee_recipient_username"]
    if dep and fee and dep == fee:
        b["skin_in_game"] = SCORE_WEIGHTS["deployer_is_fee_recipient"]
        total += SCORE_WEIGHTS["deployer_is_fee_recipient"]
    else:
        b["skin_in_game"] = 0
        if dep and fee and dep != fee:
            flags.append("fee_to_other")

    # 4. Repeat deployer (penalty)
    prev = deployer_history.get(token["deployer_address"] or "", 0)
    if prev >= 3:
        b["repeat_deployer"] = SCORE_WEIGHTS["deployer_has_history"]
        total += SCORE_WEIGHTS["deployer_has_history"]
        flags.append(f"repeat({prev})")
    elif prev > 0:
        p = SCORE_WEIGHTS["deployer_has_history"] // 2
        b["repeat_deployer"] = p
        total += p
    else:
        b["repeat_deployer"] = 0
        flags.append("first_deploy")

    # 5. Volume
    vol = token["vol_24h"]
    if vol >= VOLUME_THRESHOLD_USD * 10:
        b["volume"] = SCORE_WEIGHTS["high_volume_signal"]
        total += SCORE_WEIGHTS["high_volume_signal"]
        flags.append("whale_vol")
    elif vol >= VOLUME_THRESHOLD_USD:
        b["volume"] = int(SCORE_WEIGHTS["high_volume_signal"] * 0.6)
        total += b["volume"]
        flags.append("good_vol")
    else:
        b["volume"] = 0
        flags.append("low_vol")

    # 6. Tx/MCap ratio
    tx = token["tx_count_24h"]
    mcap = token["market_cap_usd"]
    if mcap > 0 and tx > 0:
        r = tx / mcap
        if 0.001 <= r <= 0.05:
            b["tx_ratio"] = SCORE_WEIGHTS["high_tx_ratio"]
            total += SCORE_WEIGHTS["high_tx_ratio"]
        elif r > 0.05:
            b["tx_ratio"] = SCORE_WEIGHTS["high_tx_ratio"] // 2
            total += b["tx_ratio"]
            flags.append("wash_risk")
        else:
            b["tx_ratio"] = 0
    else:
        b["tx_ratio"] = 0

    # 7. Price action
    ch = token["price_change_24h"]
    if ch > 20:
        b["momentum"] = SCORE_WEIGHTS["positive_price_action"]
        total += SCORE_WEIGHTS["positive_price_action"]
        flags.append("strong_pump")
    elif ch > 0:
        b["momentum"] = SCORE_WEIGHTS["positive_price_action"] // 2
        total += b["momentum"]
    elif ch < -30:
        b["momentum"] = -SCORE_WEIGHTS["positive_price_action"] // 2
        total += b["momentum"]
        flags.append("dumping")
    else:
        b["momentum"] = 0

    # 8. Freshness bonus
    if token["deployed_at"]:
        dep_dt = token["deployed_at"].replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - dep_dt
        if age <= timedelta(hours=1):
            total += 5; b["freshness"] = 5; flags.append("ultra_fresh")
        elif age <= timedelta(hours=FRESHNESS_HOURS):
            total += 3; b["freshness"] = 3; flags.append("fresh")
        else:
            b["freshness"] = 0
    else:
        b["freshness"] = 0

    score = max(0, min(100, total))
    return {
        "score": score, "breakdown": b, "flags": flags,
        "grade": _grade(score),
    }

def _grade(s: int) -> str:
    if s >= 80: return "🟢 ALPHA"
    elif s >= 65: return "🔵 BETA"
    elif s >= 50: return "🟡 GAMMA"
    elif s >= 35: return "🟠 DELTA"
    return "🔴 SKIP"
