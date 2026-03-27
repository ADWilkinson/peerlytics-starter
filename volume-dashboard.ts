/**
 * volume-dashboard.ts
 *
 * Fetches protocol summary and leaderboard data, then prints a
 * formatted terminal dashboard showing volume, participants, and
 * top makers/takers.
 *
 * Usage:
 *   PEERLYTICS_API_KEY=pk_live_... npx tsx volume-dashboard.ts
 */

import { Peerlytics } from "@peerlytics/sdk";

const client = new Peerlytics({
  apiKey: process.env.PEERLYTICS_API_KEY,
});

function formatUsd(cents: number | string): string {
  const val = Number(cents);
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function truncAddr(addr: string): string {
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function line(w = 60): string {
  return "-".repeat(w);
}

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

async function main(): Promise<void> {
  console.log("Fetching protocol data...\n");

  const [summary, leaderboard] = await Promise.all([
    client.getSummary(),
    client.getLeaderboard({ limit: 5 }),
  ]);

  console.log(line());
  console.log("  PEERLYTICS PROTOCOL DASHBOARD");
  console.log(line());
  console.log();
  console.log("  Protocol Summary");
  console.log(`    Total Volume:       ${formatUsd(summary.totalVolume ?? 0)}`);
  console.log(`    Active Liquidity:   ${formatUsd(summary.activeLiquidity ?? 0)}`);
  console.log(`    Active Deposits:    ${summary.activeDeposits ?? 0}`);
  console.log(`    Unique Makers:      ${summary.uniqueMakers ?? 0}`);
  console.log(`    Unique Takers:      ${summary.uniqueTakers ?? 0}`);
  console.log();

  if (leaderboard.makers && leaderboard.makers.length > 0) {
    console.log(line());
    console.log("  TOP MAKERS (by volume)");
    console.log(line());
    console.log(`  ${pad("Rank", 6)}${pad("Address", 16)}${pad("Volume", 14)}Deposits`);
    console.log(`  ${line(50)}`);

    for (let i = 0; i < leaderboard.makers.length; i++) {
      const m = leaderboard.makers[i];
      console.log(
        `  ${pad(`#${i + 1}`, 6)}${pad(truncAddr(m.address), 16)}${pad(formatUsd(m.totalVolume ?? 0), 14)}${m.depositCount ?? 0}`,
      );
    }
    console.log();
  }

  if (leaderboard.takers && leaderboard.takers.length > 0) {
    console.log(line());
    console.log("  TOP TAKERS (by volume)");
    console.log(line());
    console.log(`  ${pad("Rank", 6)}${pad("Address", 16)}${pad("Volume", 14)}Intents`);
    console.log(`  ${line(50)}`);

    for (let i = 0; i < leaderboard.takers.length; i++) {
      const t = leaderboard.takers[i];
      console.log(
        `  ${pad(`#${i + 1}`, 6)}${pad(truncAddr(t.address), 16)}${pad(formatUsd(t.totalVolume ?? 0), 14)}${t.intentCount ?? 0}`,
      );
    }
    console.log();
  }

  console.log(line());
  console.log(`  Generated at ${new Date().toISOString()}`);
  console.log(line());
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
