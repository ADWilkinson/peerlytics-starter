/**
 * webhook-receiver.ts
 *
 * Minimal HTTPS receiver for USDCtoFiat outbound webhooks. Verifies the
 * HMAC-SHA256 signature, rejects replay attempts outside a 5-minute window,
 * and prints each event.
 *
 * USDCtoFiat events. The dispatcher delivers these today:
 *   deposit.created
 *   deposit.filled
 *   deposit.partially_filled
 *   deposit.closed
 *   otc.taken
 *
 * Registerable but reserved (the registry accepts them; the dispatcher does
 * not currently fan them out):
 *   otc.enabled
 *   otc.disabled
 *
 * Each POST includes:
 *   X-Usdctofiat-Signature   t=<unix>,v1=<hex>
 *   X-Usdctofiat-Event       one of the events above
 *   X-Usdctofiat-Delivery-Id uuid, useful for dedup logs
 *
 * Usage:
 *   WEBHOOK_SECRET=whsec_… PORT=8787 npx tsx usdctofiat/webhook-receiver.ts
 *
 * Register the public URL (e.g. via ngrok) at:
 *   https://usdctofiat.xyz/developers  →  Webhooks
 *
 * Required:
 *   WEBHOOK_SECRET    The secret returned once on register. Store it.
 *
 * Optional:
 *   PORT              Listen port (default: 8787)
 *   TOLERANCE_SECONDS Max age for the signature timestamp (default: 300)
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.WEBHOOK_SECRET;
if (!SECRET) {
  console.error("Set WEBHOOK_SECRET env var (the value returned once on webhook register)");
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 8787);
const TOLERANCE_SECONDS = Number(process.env.TOLERANCE_SECONDS ?? 300);

const fmt = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

interface SignatureParts {
  timestamp: number;
  digestHex: string;
}

function parseSignatureHeader(header: string | undefined): SignatureParts | null {
  if (!header) return null;
  const parts = header.split(",").map((s) => s.trim());
  let timestamp: number | null = null;
  let digestHex: string | null = null;
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    if (k === "t") {
      const n = Number(v);
      if (Number.isFinite(n)) timestamp = n;
    } else if (k === "v1") {
      digestHex = v;
    }
  }
  if (timestamp == null || !digestHex) return null;
  return { timestamp, digestHex };
}

function verifySignature(rawBody: string, header: string | undefined, secret: string): string | null {
  const parts = parseSignatureHeader(header);
  if (!parts) return "missing_signature";

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parts.timestamp) > TOLERANCE_SECONDS) {
    return "stale_timestamp";
  }

  const expectedHex = createHmac("sha256", secret)
    .update(`${parts.timestamp}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(parts.digestHex, "hex");
  const b = Buffer.from(expectedHex, "hex");
  if (a.length !== b.length) return "bad_signature";
  if (!timingSafeEqual(a, b)) return "bad_signature";

  return null;
}

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function headerString(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function reply(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    reply(res, 405, { error: "method_not_allowed" });
    return;
  }

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    reply(res, 413, { error: error instanceof Error ? error.message : "payload_error" });
    return;
  }

  const err = verifySignature(rawBody, headerString(req, "X-Usdctofiat-Signature"), SECRET!);
  if (err) {
    console.log(`${fmt.red("✗")} rejected: ${err}`);
    reply(res, 400, { error: err });
    return;
  }

  const event = headerString(req, "X-Usdctofiat-Event") ?? "unknown";
  const deliveryId = headerString(req, "X-Usdctofiat-Delivery-Id") ?? "";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    reply(res, 400, { error: "invalid_json" });
    return;
  }

  console.log(
    `${fmt.green("✓")} ${fmt.bold(event)} ${fmt.dim(deliveryId)} ${fmt.cyan(
      new Date().toISOString(),
    )}`,
  );
  console.log(fmt.dim("  " + JSON.stringify(payload.data ?? payload, null, 2).split("\n").join("\n  ")));

  // Integrators filter on attribution here. Example:
  //   const txHash = payload.data?.deposit?.txHash;
  //   if (!txHash || !(await matchesMyIntegrator(txHash))) return reply(res, 200, { ok: true });

  reply(res, 200, { ok: true, received: event, deliveryId });
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error(fmt.red("handler error:"), error);
    reply(res, 500, { error: "internal" });
  });
});

server.listen(PORT, () => {
  console.log();
  console.log(fmt.bold("  USDCtoFiat webhook receiver"));
  console.log(fmt.dim(`  Listening on http://localhost:${PORT}`));
  console.log(fmt.dim(`  Secret length: ${SECRET!.length} chars`));
  console.log(fmt.dim(`  Tolerance:     ${TOLERANCE_SECONDS}s`));
  console.log();
  console.log("  Next steps:");
  console.log("    1. Expose this port publicly (ngrok http " + PORT + ", cloudflared, etc.)");
  console.log("    2. Register the public URL at https://usdctofiat.xyz/developers");
  console.log("    3. Pick events: deposit.filled, deposit.closed, otc.taken, etc.");
  console.log("    4. Save the secret returned on register — use it as WEBHOOK_SECRET");
  console.log();
});
