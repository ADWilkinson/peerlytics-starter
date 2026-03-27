/**
 * x402-agent.ts
 *
 * Demonstrates the x402 pay-per-request flow for accessing the
 * Peerlytics API without an API key. Uses USDC on Base for
 * per-request micropayments via the x402 protocol by Coinbase.
 *
 * This example shows:
 *   1. Making an unauthenticated request and receiving a 402
 *   2. Parsing the payment requirements from the response
 *   3. Where to integrate @x402/evm to build and sign the payment
 *   4. Retrying with the payment header
 *
 * Usage:
 *   npx tsx x402-agent.ts
 *
 * For a full working payment flow, install:
 *   npm install @x402/evm viem
 */

const BASE_URL = "https://peerlytics.xyz";
const ENDPOINT = "/api/v1/analytics/summary";

async function discoverPaymentRequirements(): Promise<void> {
  console.log("Step 1: Request without authentication\n");
  console.log(`  GET ${BASE_URL}${ENDPOINT}\n`);

  const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
    headers: { Accept: "application/json" },
  });

  console.log(`  Status: ${response.status} ${response.statusText}`);

  if (response.status !== 402) {
    console.log("\n  Got a successful response (free tier has remaining quota).");
    console.log("  The 402 flow activates when free quota is exhausted.\n");
    const data = await response.json();
    console.log("  Response preview:", JSON.stringify(data).slice(0, 200), "...\n");
    return;
  }

  // Step 2: Parse the 402 payment requirements
  console.log("\nStep 2: Parse payment requirements\n");

  const paymentRequired = response.headers.get("PAYMENT-REQUIRED");
  const legacyPayment = response.headers.get("X-PAYMENT-REQUIRED");
  const rawRequirements = paymentRequired ?? legacyPayment;

  if (!rawRequirements) {
    console.log("  No payment requirements found in headers.");
    return;
  }

  let requirements: Record<string, unknown>;
  try {
    const decoded = Buffer.from(rawRequirements, "base64").toString("utf-8");
    requirements = JSON.parse(decoded);
  } catch {
    requirements = JSON.parse(rawRequirements);
  }

  console.log("  Payment requirements:");
  console.log(`    Network:    Base (chain ID 8453)`);
  console.log(`    Token:      USDC`);
  console.log(`    Amount:     ${JSON.stringify(requirements.maxAmountRequired ?? requirements.amount)}`);
  console.log(`    Recipient:  ${requirements.payeeAddress ?? requirements.receiver}`);
  console.log();

  // Step 3: Build payment (instructions)
  console.log("Step 3: Build and sign payment\n");
  console.log("  Install the x402 client library:\n");
  console.log("    npm install @x402/evm viem\n");
  console.log("  Then create a signed payment:\n");
  console.log(`    import { PaymentClient } from "@x402/evm";`);
  console.log(`    const payment = await paymentClient.createPayment(requirements);`);
  console.log(`    const header = Buffer.from(JSON.stringify(payment)).toString("base64");`);
  console.log();

  // Step 4: Retry with payment header
  console.log("Step 4: Retry with payment header\n");
  console.log(`    const response = await fetch("${BASE_URL}${ENDPOINT}", {`);
  console.log(`      headers: { "PAYMENT-SIGNATURE": header },`);
  console.log(`    });\n`);
  console.log("  On success, check:");
  console.log("    X-Payment-TxHash: on-chain settlement tx");
  console.log("    PAYMENT-RESPONSE: settlement confirmation\n");
  console.log("  Docs: https://peerlytics.xyz/developers");
  console.log("  x402:  https://github.com/coinbase/x402");
}

discoverPaymentRequirements().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
