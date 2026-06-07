"""
Bankr API Client — fetches token data from Bankr discover endpoint.
"""

import json
import subprocess
import sys
from datetime import datetime, timezone
from .config import BANKR_DISCOVER_URL, BANKR_PAGE_SIZE, BANKR_MAX_PAGES


class BankrClient:
    """Minimal Bankr API client via curl + json."""

    def __init__(self):
        self.requests = 0

    def _fetch(self, url: str) -> dict:
        self.requests += 1
        try:
            r = subprocess.run(
                ["curl", "-s", "--max-time", "20", url],
                capture_output=True, text=True, timeout=25,
            )
            raw = r.stdout
            # Try strict=False first
            try:
                return json.loads(raw, strict=False)
            except json.JSONDecodeError:
                pass
            # Try truncating at last valid position
            for cutoff in range(len(raw) - 1, len(raw) // 2, -500):
                try:
                    return json.loads(raw[:cutoff] + ']}', strict=False)
                except json.JSONDecodeError:
                    continue
            # Last resort: use python -c for robust parsing
            proc = subprocess.run(
                ["python3", "-c",
                 "import sys,json; d=json.load(sys.stdin, strict=False); "
                 "print(json.dumps(d))"],
                input=raw, capture_output=True, text=True, timeout=10,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                return json.loads(proc.stdout)
            raise Exception(f"Parse failed after recovery attempts")
        except Exception as e:
            print(f"  [!] API error: {e}", file=sys.stderr)
            return {"results": []}

    def fetch_all_tokens(self, max_pages: int = BANKR_MAX_PAGES) -> list[dict]:
        all_tokens = []
        cursor = None
        for page in range(max_pages):
            url = BANKR_DISCOVER_URL + f"?limit={BANKR_PAGE_SIZE}"
            if cursor:
                url += f"&cursor={cursor}"
            data = self._fetch(url)
            tokens = data.get("results", [])
            all_tokens.extend(tokens)
            if not tokens or not data.get("nextCursor"):
                break
            cursor = data["nextCursor"]
        print(f"  [api] {len(all_tokens)} tokens in {page+1} pages ({self.requests} reqs)")
        return all_tokens

    @staticmethod
    def normalize(token: dict) -> dict:
        d = (token.get("deployedAt") or "")[:19]
        deployed = None
        if d:
            try:
                deployed = datetime.fromisoformat(d.replace("Z", "+00:00"))
            except ValueError:
                pass
        return {
            "name": token.get("name") or "?",
            "symbol": token.get("symbol") or "?",
            "address": token.get("tokenAddress") or "",
            "deployed_at": deployed,
            "deployed_str": d.replace("T", " "),
            "market_cap_usd": token.get("marketCapUsd") or 0,
            "vol_24h": token.get("vol24h") or 0,
            "tx_count_24h": token.get("txCount24h") or 0,
            "price_change_24h": token.get("priceChange24h") or 0,
            "website": token.get("websiteUrl") or None,
            "tweet_url": token.get("tweetUrl") or None,
            "image_url": token.get("imageUri") or None,
            "deployer_username": token.get("deployerXUsername") or None,
            "fee_recipient_username": token.get("feeRecipientXUsername") or None,
            "deployer_address": token.get("deployerAddress") or None,
            "fee_recipient_address": token.get("feeRecipientAddress") or None,
        }
