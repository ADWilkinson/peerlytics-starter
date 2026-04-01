import { defineConfig } from "vite";
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

function peerlyticsOrderbookProxy() {
  return {
    name: "peerlytics-orderbook-proxy",
    configureServer(server: {
      middlewares: {
        use: (
          handler: (
            req: { url?: string },
            res: {
              statusCode: number;
              setHeader: (name: string, value: string) => void;
              end: (body: string) => void;
            },
            next: () => void,
          ) => void | Promise<void>,
        ) => void;
      };
    }) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/orderbook")) {
          next();
          return;
        }

        if (!getPeerlyticsApiKey()) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing PEERLYTICS_API_KEY." }));
          return;
        }

        const url = new URL(req.url, "http://127.0.0.1");
        const platform = url.searchParams.get("platform") ?? "";
        const currency = url.searchParams.get("currency") ?? "";

        if (!isSupportedRoute(platform, currency)) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Unsupported route." }));
          return;
        }

        try {
          const payload = await fetchOrderbookSnapshot(platform, currency);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to load orderbook.";

          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}
