import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "ScrapHappens Circular Marketplace",
        short_name: "ScrapHappens",
        description: "Circular economy marketplace for materials, DIY inspiration, and sustainability impact tracking.",
        theme_color: "#1e8e5a",
        background_color: "#f4fbf7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages-cache",
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              url.pathname.startsWith("/api/materials"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "marketplace-api-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 30
              }
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              url.pathname.startsWith("/api/diy"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "diy-api-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 30
              }
            }
          },
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              (
                url.pathname.startsWith("/api/achievements") ||
                url.pathname.startsWith("/api/reputation") ||
                url.pathname.startsWith("/api/orders/my-orders")
              ),
            handler: "NetworkFirst",
            options: {
              cacheName: "dashboard-api-cache",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 15
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: ({ request }) => ["script", "style", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "asset-cache"
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".glb"),
            handler: "CacheFirst",
            options: {
              cacheName: "glb-cache",
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 14
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  assetsInclude: ["**/*.glb"],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
    }
  }
});
