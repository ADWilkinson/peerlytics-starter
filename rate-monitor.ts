/**
 * rate-monitor.ts
 *
 * Monitors P2P exchange rates for a given fiat currency and alerts
 * when the best available rate crosses a threshold.
 *
 * Usage:
 *   PEERLYTICS_API_KEY=pk_live_... npx tsx rate-monitor.ts
 *
 * Environment:
 *   PEERLYTICS_API_KEY  - Your Peerlytics API key (optional for free tier)
 *   CURRENCY            - Fiat currency to monitor (default: GBP)
 *   THRESHOLD           - Alert when best rate is below this (default: 1.02)
 *   POLL_SECONDS        - Polling interval in seconds (default: 60)
 */

import { Peerlytics } from "@peerlytics/sdk";

const CURRENCY = process.env.CURRENCY ?? "GBP";
const THRESHOLD = Number(process.env.THRESHOLD ?? "1.02");
const POLL_SECONDS = Number(process.env.POLL_SECONDS ?? "60");

const client = new Peerlytics({
  apiKey: process.env.PEERLYTICS_API_KEY,
});

function formatRate(rate: number): string {
  return rate.toFixed(4);
}

function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

async function checkRates(): Promise<void> {
  const summary = await client.getMarketSummary({ currency: CURRENCY });
  const { markets } = summary;

  if (!markets || markets.length === 0) {
    console.log(`[${timestamp()}] No market data for ${CURRENCY}`);
    return;
  }

  // Find the best (lowest) rate across all platforms
  let bestRate = Infinity;
  let bestPlatform = "";

  for (const entry of markets) {
    const rate = entry.median ?? entry.suggestedRate;
    if (rate !== null && rate > 0 && rate < bestRate) {
      bestRate = rate;
      bestPlatform = entry.platform;
    }
  }

  if (bestRate === Infinity) {
    console.log(`[${timestamp()}] No active rates for ${CURRENCY}`);
    return;
  }

  const status = bestRate <= THRESHOLD ? "ALERT" : "OK";
  const indicator = bestRate <= THRESHOLD ? ">>>" : "   ";

  console.log(
    `[${timestamp()}] ${indicator} ${CURRENCY} best rate: ${formatRate(bestRate)} ` +
      `on ${bestPlatform} | threshold: ${formatRate(THRESHOLD)} | ${status}`,
  );
}

async function main(): Promise<void> {
  console.log(`Rate monitor started`);
  console.log(`  Currency:  ${CURRENCY}`);
  console.log(`  Threshold: ${formatRate(THRESHOLD)}`);
  console.log(`  Interval:  ${POLL_SECONDS}s`);
  console.log(`  API key:   ${process.env.PEERLYTICS_API_KEY ? "configured" : "not set (free tier)"}`);
  console.log();

  await checkRates();

  setInterval(async () => {
    try {
      await checkRates();
    } catch (err) {
      console.error(`[${timestamp()}] Error:`, err instanceof Error ? err.message : err);
    }
  }, POLL_SECONDS * 1000);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
