import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ["buffer"],
        globals: {
          Buffer: true,
        },
      }),
      wasm(),
    ],
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            "stellar-sdk": ["@stellar/stellar-sdk"],
            "design-system": ["@stellar/design-system"],
            debug: [
              "./src/debug/components/PrettyJson",
              "./src/debug/components/RenderArrayType",
              "./src/debug/components/RenderOneOf",
              "./src/debug/components/RenderPrimitivesType",
              "./src/debug/components/RenderTupleType",
            ],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      exclude: ["@stellar/stellar-xdr-json"],
    },
    define: {
      global: "window",
    },
    envPrefix: "PUBLIC_",
    server: {
      proxy: {
        "/friendbot": {
          target: "http://localhost:8000/friendbot",
          changeOrigin: true,
        },
      },
    },
  };
});
