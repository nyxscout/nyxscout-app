"""
NyxScout DB — JSON-based persistence for deployer & alert history.
"""

import json, os
from datetime import datetime


class TokenDB:
    def __init__(self, path: str = "./output/db.json"):
        self.path = path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.data = self._load()

    def _load(self) -> dict:
        if os.path.exists(self.path):
            try:
                with open(self.path) as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                pass
        return {"deployers": {}, "seen": {}, "alerted": {}, "alerts": []}

    def _save(self):
        with open(self.path, "w") as f:
            json.dump(self.data, f, indent=2, default=str)

    # Deployer tracking
    def get_deployer_history(self) -> dict[str, int]:
        return dict(self.data.get("deployers", {}))

    def record_deployer(self, address: str):
        if address:
            self.data["deployers"][address] = self.data["deployers"].get(address, 0) + 1
            self._save()

    # Token tracking
    def is_new_token(self, address: str) -> bool:
        return address not in self.data.get("seen", {})

    def mark_seen(self, address: str):
        if address:
            self.data["seen"][address] = datetime.now().isoformat()
            self._save()

    # Alert tracking
    def should_alert(self, address: str, cooldown_hours: int = 6) -> bool:
        last = self.data.get("alerted", {}).get(address)
        if not last:
            return True
        try:
            dt = datetime.fromisoformat(last)
            return (datetime.now() - dt).total_seconds() / 3600 >= cooldown_hours
        except ValueError:
            return True

    def record_alert(self, address: str, name: str, score: int):
        self.data["alerted"][address] = datetime.now().isoformat()
        self.data["alerts"].append({
            "token": name, "address": address, "score": score,
            "timestamp": datetime.now().isoformat(),
        })
        if len(self.data["alerts"]) > 500:
            self.data["alerts"] = self.data["alerts"][-500:]
        self._save()
