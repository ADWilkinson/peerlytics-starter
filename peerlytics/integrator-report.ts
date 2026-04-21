/**
 * integrator-report.ts
 *
 * Pulls an ERC-8021 integrator's aggregated activity from Peerlytics: volume,
 * unique makers, top markets, recent deposits. Attribution is resolved from
 * onchain calldata, so any deposit your SDK tags with your code will appear.
 *
 * Uses `client.getIntegrator(code, { windowDays })` from @peerlytics/sdk.
 *
 * Usage:
 *   CODE=usdctofiat npx tsx peerlytics/integrator-report.ts
 *
 * Optional env:
 *   WINDOW_DAYS         Lookback in days (default 90, max 365)
 *   PEERLYTICS_API_KEY  If set, uses API-key auth and consumes credits.
 *                        Omit for anonymous (rate-limited, free).
 *   PEERLYTICS_BASE_URL Default https://peerlytics.xyz
 */

import { Peerlytics, NotFoundError, PeerlyticsError } from "@peerlytics/sdk";

const code = process.env.CODE;
if (!code) {
  console.error("Set CODE (integrator slug, e.g. usdctofiat, peer-extension, pns-pay)");
  process.exit(1);
}

const windowDays = Number(process.env.WINDOW_DAYS ?? 90);
const apiKey = process.env.PEERLYTICS_API_KEY;
const baseUrl = process.env.PEERLYTICS_BASE_URL ?? "https://peerlytics.xyz";

const fmt = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};

function usdc(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

async function main(): Promise<void> {
  const client = new Peerlytics({ apiKey, baseUrl });

  const data = await client.getIntegrator(code!, { windowDays });
  const { integrator, summary } = data;

  console.log();
  console.log(fmt.bold(`  ${integrator.label}`));
  console.log(fmt.dim(`  code: ${integrator.code} · market: ${integrator.market}`));
  if (integrator.url) console.log(fmt.dim(`  url:  ${integrator.url}`));
  console.log();
  console.log(`  volume:        ${fmt.green(usdc(summary.volumeUsd))}`);
  console.log(`  liquidity:     ${usdc(summary.liquidityUsd)}`);
  console.log(`  deposits:      ${summary.deposits.toLocaleString()}`);
  console.log(`  unique makers: ${summary.uniqueMakers.toLocaleString()}`);
  console.log(`  unique takers: ${summary.uniqueTakers.toLocaleString()}`);
  console.log(
    `  intents:       ${fmt.green(String(summary.fulfilledIntents))} fulfilled ${fmt.dim("·")} ${summary.signaledIntents} signaled ${fmt.dim("·")} ${summary.prunedIntents} pruned`,
  );
  console.log(
    fmt.dim(
      `  window:        last ${summary.windowDays}d · resolved ${summary.resolvedDeposits} deposits + ${summary.resolvedIntents} intents`,
    ),
  );
  console.log();

  if (data.topMakers.length) {
    console.log(fmt.bold("  Top makers"));
    for (const maker of data.topMakers.slice(0, 5)) {
      const short = `${maker.address.slice(0, 6)}…${maker.address.slice(-4)}`;
      console.log(
        `  ${fmt.cyan(short)}  ${usdc(maker.volumeUsd).padStart(10)}  ${maker.deposits} deposits`,
      );
    }
    console.log();
  }

  if (data.topMarkets.length) {
    console.log(fmt.bold("  Top markets"));
    for (const market of data.topMarkets.slice(0, 5)) {
      console.log(
        `  ${market.platformLabel.padEnd(12)} ${market.currencyLabel.padEnd(6)} ${usdc(market.volumeUsd).padStart(10)}  ${market.fulfilledIntents} fills`,
      );
    }
    console.log();
  }

  if (data.recentDeposits.length) {
    console.log(fmt.bold("  Recent deposits"));
    for (const dep of data.recentDeposits.slice(0, 5)) {
      const short = `${dep.maker.slice(0, 6)}…${dep.maker.slice(-4)}`;
      console.log(
        `  #${dep.depositId.padEnd(6)} ${short}  ${usdc(dep.volumeUsd).padStart(10)}  ${fmt.dim(dep.createdAt?.slice(0, 10) ?? "?")}`,
      );
    }
    console.log();
  }

  console.log(fmt.dim(`  View live → ${baseUrl}/explorer/integrator/${integrator.code}`));
  console.log();
}

main().catch((err) => {
  if (err instanceof NotFoundError) {
    console.error(`Unknown integrator code: ${code}`);
    console.error(fmt.dim(`  See ${baseUrl}/explorer/integrator for the registered list.`));
    process.exit(1);
  }
  if (err instanceof PeerlyticsError) {
    console.error(`Peerlytics ${err.status} ${err.code}: ${err.message}`);
    process.exit(1);
  }
  console.error("Request failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

export {};
