import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@canvasjs/react-charts", "@canvasjs/charts"],
  },
  build: {
    // esbuild is 10-20x faster than default Terser minifier
    minify: "esbuild",
    target: "es2015",
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    proxy: {
      '/api/assets': {
        target: 'https://vendor-internal-testing.ierada.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Referer: 'https://vendor-internal-testing.ierada.com/'
        }
      }
    }
  },
});
