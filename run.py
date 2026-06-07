#!/usr/bin/env python3
"""
NyxScout 🌙 — Finding alpha in the dark.
Bankr token early detection engine.

Usage:
    python3 run.py              # Single scan
    python3 run.py --watch 300  # Scan every 300 seconds
    python3 run.py --serve      # Start API server for dashboard
"""

import sys
import time
from nyxscout.core import run_scan


def main():
    args = sys.argv[1:]

    if "--watch" in args:
        try:
            idx = args.index("--watch")
            interval = int(args[idx + 1]) if idx + 1 < len(args) else 300
        except (ValueError, IndexError):
            interval = 300

        print(f"🌙 NyxScout watching... (every {interval}s)")
        print("   Press Ctrl+C to stop.\n")

        try:
            while True:
                run_scan(verbose=True)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n🌙 Nyx rests. Until next night.")
    else:
        run_scan(verbose=True)


if __name__ == "__main__":
    main()
