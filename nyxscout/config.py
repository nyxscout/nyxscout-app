"""
NyxScout Configuration
"""

# Bankr API
BANKR_API_BASE = "https://api.bankr.bot"
BANKR_DISCOVER_URL = f"{BANKR_API_BASE}/discover"
BANKR_PAGE_SIZE = 100
BANKR_MAX_PAGES = 5

# Scoring weights (sum ≈ 100)
SCORE_WEIGHTS = {
    "has_website": 15,
    "has_twitter": 10,
    "deployer_is_fee_recipient": 20,
    "deployer_has_history": -10,
    "high_volume_signal": 25,
    "high_tx_ratio": 15,
    "positive_price_action": 15,
}

# Thresholds
VOLUME_THRESHOLD_USD = 10_000
TX_RATIO_THRESHOLD = 0.01
ALERT_SCORE_THRESHOLD = 60
FRESHNESS_HOURS = 2
MONITOR_WINDOW_HOURS = 48

# Output
OUTPUT_DIR = "./output"
