import Link from "next/link";
import { HeroScene } from "@/components/hero-scene";
import { LiveSnapshot } from "@/components/live-snapshot";
import { ShaderBackdrop } from "@/components/shader-backdrop";

const signals = [
  ["Volume", "+25", "Confirms a token is attracting real flow, not just deploy noise."],
  ["Skin in game", "+20", "Checks whether deployer and fee recipient incentives line up."],
  ["Surface area", "+25", "Website and social presence compress first-pass verification."],
  ["Activity ratio", "+15", "Compares transaction count against market cap to catch organic motion."],
  ["Momentum", "+15", "Rewards directional buying pressure while penalizing heavy dumps."],
  ["Freshness", "+5", "Prioritizes deployments where the discovery window is still open."],
];

export default function Home() {
  return (
    <main className="site-shell premium-landing">
      <header className="nav landing-nav">
        <Link href="/" className="brand" aria-label="NyxScout home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/nyxscout-logo-mark.png" alt="" width="28" height="28" />
          Nyx<span>Scout</span>
        </Link>
        <Link href="/dashboard" className="button button-ghost">
          Open app
        </Link>
      </header>

      <section className="premium-hero premium-hero-v2">
        <ShaderBackdrop />
        <HeroScene />
        <div className="hero-vignette" />
        <div className="premium-hero-copy">
          <p className="hero-kicker">Live Bankr signal engine</p>
          <h1>See the token field before it gets loud.</h1>
          <p>
            NyxScout turns fresh Bankr deployments into a ranked signal field:
            score, volume, market cap, age, deployer context, and links ready
            for the first pass.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button button-primary">
              Open dashboard
            </Link>
            <a href="#signal-model" className="button button-ghost">
              Inspect model
            </a>
          </div>
        </div>
        <div className="hero-telemetry hero-telemetry-v2">
          <LiveSnapshot />
        </div>
      </section>

      <section className="instrument-section" id="signal-model">
        <div className="instrument-heading">
          <span>Signal model</span>
          <h2>A calmer way to read new deploys.</h2>
          <p>
            The landing page now mirrors the product itself: a live scanner,
            a scored signal field, and only enough narrative to explain why the
            dashboard deserves trader attention.
          </p>
        </div>
        <div className="signal-matrix">
          {signals.map(([name, weight, description]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <span>{weight}</span>
              </div>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="precision-band">
        <div className="precision-copy">
          <h2>Rank the first pass, then move.</h2>
          <p>
            Each scan turns raw Bankr deployment data into ranked candidates
            with score, flags, volume, market cap, token age, deployer context,
            and links ready for immediate review.
          </p>
        </div>
        <div className="precision-steps" aria-label="NyxScout workflow">
          <article>
            <span>01</span>
            <strong>Detect</strong>
            <p>Fetch fresh deployments from the Bankr discover feed.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Score</strong>
            <p>Apply the 8-signal model with deployer history in D1.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Surface</strong>
            <p>Promote high-score tokens into the live dashboard.</p>
          </article>
        </div>
      </section>

      <section className="brand-cover-band" aria-label="NyxScout brand visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/nyxscout-cover.png"
          alt="NyxScout nocturnal token signal landscape"
          width="1672"
          height="941"
        />
        <div>
          <span>NyxScout</span>
          <strong>Find the signal while the field is still dark.</strong>
        </div>
      </section>

      {/* Roadmap */}
      <section className="roadmap-band" id="roadmap">
        <div className="roadmap-heading">
          <span>Roadmap</span>
          <h2>Built in the open.</h2>
          <p>Three phases from live dashboard to fully autonomous alpha execution.</p>
        </div>
        <div className="roadmap-timeline">
          <div className="roadmap-track">
            <div className="roadmap-dot active" />
            <div className="roadmap-dot" />
            <div className="roadmap-dot" />
          </div>
          <div className="roadmap-cards">
            <article className="roadmap-card live">
              <div className="roadmap-label">
                <span className="roadmap-badge live">Live</span>
                <time>June 2026</time>
              </div>
              <h3>Dashboard + Alpha Engine</h3>
              <p>Live token feed with 8-signal scoring, deployer history, wallet watch, narrative classification, and market pulse analysis.</p>
            </article>
            <article className="roadmap-card">
              <div className="roadmap-label">
                <span className="roadmap-badge next">July</span>
                <time>July 2026</time>
              </div>
              <h3>Telegram Alpha Alerts</h3>
              <p>Threshold-based token notifications pushed to Telegram. Score drops, fresh alpha deployments, whale volume spikes — real-time alerts wherever you trade.</p>
            </article>
            <article className="roadmap-card">
              <div className="roadmap-label">
                <span className="roadmap-badge soon">August</span>
                <time>August 2026</time>
              </div>
              <h3>Auto-Buy Bot</h3>
              <p>Configurable on-chain snipe bot. Set score, volume, and narrative thresholds. Bot executes buy trades automatically — hands-free alpha capturing.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div>
          <Link href="/" className="brand" aria-label="NyxScout home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/nyxscout-logo-mark.png" alt="" width="28" height="28" />
            Nyx<span>Scout</span>
          </Link>
          <p>Live Bankr token scoring for early alpha hunters.</p>
        </div>
        <nav aria-label="Landing footer links">
          <Link href="/dashboard">Dashboard</Link>
          <a href="https://github.com/nyxscout/nyxscout-app" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://x.com/crystellenica" target="_blank" rel="noreferrer">
            X
          </a>
        </nav>
      </footer>
    </main>
  );
}
