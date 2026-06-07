# NyxScout 🌙

> **Finding alpha in the dark.**
>
> Real-time Bankr token early detection & alpha scoring engine.
> 8 signals. One score. Catch tokens before they moon.

---

## Overview

NyxScout scans every new token on Bankr the moment it deploys. Each token gets scored on 8 legitimacy signals. The higher the score, the stronger the early alpha signal.

### Scoring Signals

| Signal | Weight | What it checks |
|--------|--------|----------------|
| Volume | +25 | Real trading activity |
| Skin in the Game | +20 | Deployer = Fee recipient |
| Website | +15 | Token has a real website |
| Tx / MCap Ratio | +15 | Organic activity vs wash trading |
| Price Action | +15 | Momentum direction |
| Twitter | +10 | Social presence confirmed |
| Freshness | +5 | Ultra-new deployment bonus |
| Repeat Deployer | -10 | Penalty for serial ruggers |

### Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| 🟢 ALPHA | 80+ | Strong legitimacy signals. High confidence. |
| 🔵 BETA | 65+ | Positive signals. Worth watching. |
| 🟡 GAMMA | 50+ | Mixed signals. Proceed with caution. |
| 🟠 DELTA | 35+ | Weak signals. Likely noise. |
| 🔴 SKIP | <35 | Avoid. |

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Scan Engine:** Python 3
- **Database:** JSON file storage

## Quickstart

```bash
cd /Users/rhystalgie/Web3/Project/Deploy/NyxScout

# Development server
npm run dev
# → http://localhost:3000

# Python scanner (run once for data)
python3 run.py

# Watch mode
python3 run.py --watch 300
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Live token feed |
| `/api/scan` | Token scan endpoint |
| `/api/deployer/[address]` | Deployer history |
| `/api/classify` | Narrative classifier |
| `/api/pulse` | AI market summary |

## Features

- 🔍 **Live Token Feed** — Sortable table with 8-signal scoring, auto-refresh
- 👤 **Deployer History** — Click any deployer to see their track record
- 👁️ **Wallet Watch** — Follow deployers, get notified on new deployments
- 🏷️ **Narrative Classifier** — Auto-categorize tokens by type (AI Agent, DeFi, Gaming, etc.)
- ⭐ **Score Tracker** — Monitor score changes on watched tokens
- 🔮 **Market Pulse** — AI-generated daily briefing of Bankr trends

## Brand

- **Name:** NyxScout
- **Tagline:** Finding alpha in the dark.
- **Social:** [@nyxscout](https://x.com/nyxscout)
- **Design:** Void-black · Violet glow · Geist Mono + Inter

## License

MIT
