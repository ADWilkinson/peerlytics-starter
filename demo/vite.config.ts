import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  fetchOrderbookSnapshot,
  getPeerlyticsApiKey,
  isSupportedRoute,
} from "./server/peerlytics";

export default defineConfig({
  plugins: [react(), peerlyticsOrderbookProxy()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (
            id.includes("node_modules/@usdctofiat/offramp") ||
            id.includes("node_modules/viem")
          ) {
            return "wallet";
          }
          return undefined;
        },
      },
    },
  },
});

function peerlyticsOrderbookProxy(): Plugin {
  return {
    name: "peerlytics-orderbook-proxy",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/orderbook")) {
          next();
          return;
        }

        if (!getPeerlyticsApiKey()) {
          sendJson(res, 500, { error: "Missing PEERLYTICS_API_KEY." });
          return;
        }

        const url = new URL(req.url, "http://127.0.0.1");
        const platform = url.searchParams.get("platform") ?? "";
        const currency = url.searchParams.get("currency") ?? "";

        if (!isSupportedRoute(platform, currency)) {
          sendJson(res, 400, { error: "Unsupported route." });
          return;
        }

        try {
          const payload = await fetchOrderbookSnapshot(platform, currency);
          sendJson(res, 200, payload);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to load orderbook.";
          sendJson(res, 502, { error: message });
        }
      });
    },
  };
}

type JsonResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
};

function sendJson(res: JsonResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
