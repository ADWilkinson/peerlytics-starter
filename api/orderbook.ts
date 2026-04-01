import {
  fetchOrderbookSnapshot,
  getPeerlyticsApiKey,
  isSupportedRoute,
} from "../server/peerlytics";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const platform = typeof req.query.platform === "string" ? req.query.platform : "";
  const currency = typeof req.query.currency === "string" ? req.query.currency : "";

  if (!getPeerlyticsApiKey()) {
    res.status(500).json({ error: "Missing PEERLYTICS_API_KEY." });
    return;
  }

  if (!isSupportedRoute(platform, currency)) {
    res.status(400).json({ error: "Unsupported route." });
    return;
  }

  try {
    const payload = await fetchOrderbookSnapshot(platform, currency);

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=300");
    res.status(200).json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load orderbook.";
    res.status(502).json({ error: message });
  }
}
