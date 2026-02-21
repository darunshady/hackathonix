import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["vite.svg"],
      manifest: {
        name: "NanoBiz – Invoice Manager",
        short_name: "NanoBiz",
        description: "Offline-first invoice & customer management for micro-entrepreneurs",
        theme_color: "#229799",
        background_color: "#f9fafb",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Cache all navigations so the app shell loads offline
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
