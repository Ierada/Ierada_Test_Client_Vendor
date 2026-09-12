/**
 * Chrome-safe vendor preview.
 *
 * Chrome ERR_EMPTY_RESPONSE happens when Node's keepAliveTimeout (5s) is
 * shorter than Chrome's socket pool (~60s): Chrome reuses a connection Node
 * already closed and gets zero bytes. curl still succeeds because it does not
 * reuse that way.
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ports = (process.env.PORT || "43124,38473")
  .split(",")
  .map((p) => Number(p.trim()))
  .filter((p) => Number.isFinite(p) && p > 0);

const vite = await createServer({
  root,
  configFile: path.join(root, "vite.config.js"),
  appType: "spa",
  server: {
    middlewareMode: true,
    hmr: false,
  },
});

const handle = (req, res) => {
  vite.middlewares(req, res, () => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
  });
};

const listen = (port, host, ipv6Only) =>
  new Promise((resolve, reject) => {
    const server = http.createServer({ keepAlive: true, keepAliveInitialDelay: 0 }, handle);
    // Must exceed Chrome's ~60s idle reuse window.
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;
    server.requestTimeout = 0;
    server.timeout = 0;
    server.once("error", reject);
    server.listen({ port, host, ipv6Only }, () => {
      const shown = host === "::1" ? "[::1]" : "127.0.0.1";
      console.log(`Vendor preview http://${shown}:${port}/product/add`);
      resolve(server);
    });
  });

for (const port of ports) {
  await listen(port, "0.0.0.0", false);
  await listen(port, "::1", true);
}
