import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function chromeKeepAlive() {
  const apply = (httpServer) => {
    if (!httpServer) return;
    // Chrome reuses sockets for ~60s; Node's default 5s keep-alive
    // closes first and Chrome then shows ERR_EMPTY_RESPONSE.
    httpServer.keepAliveTimeout = 65_000;
    httpServer.headersTimeout = 66_000;
    httpServer.requestTimeout = 0;
    httpServer.timeout = 0;
  };
  const hook = (server) => {
    const run = () => apply(server.httpServer);
    run();
    server.httpServer?.once("listening", run);
  };
  return {
    name: "chrome-keepalive",
    configureServer: hook,
    configurePreviewServer: hook,
  };
}

const apiProxy = {
  "/api/assets": {
    target: "https://vendor-internal-testing.ierada.com",
    changeOrigin: true,
    secure: false,
    headers: {
      Referer: "https://vendor-internal-testing.ierada.com/",
    },
  },
  // Same-origin /api so Chrome on another machine does not call 127.0.0.1:3001.
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
    secure: false,
  },
};

export default defineConfig({
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("/api/"),
  },
  plugins: [
    react(),
    {
      name: "strip-vite-client",
      transformIndexHtml(html) {
        return html.replace(
          /<script type="module" src="\/@vite\/client"><\/script>\s*/g,
          "",
        );
      },
    },
    chromeKeepAlive(),
  ],
  optimizeDeps: {
    include: ["@canvasjs/react-charts", "@canvasjs/charts"],
  },
  build: {
    minify: "esbuild",
    target: "es2015",
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    host: "0.0.0.0",
    port: 43124,
    strictPort: true,
    hmr: false,
    allowedHosts: true,
    proxy: apiProxy,
  },
  preview: {
    host: "0.0.0.0",
    port: 38473,
    strictPort: true,
    allowedHosts: true,
    proxy: apiProxy,
  },
});
