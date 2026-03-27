import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path"; // 1. ADD THIS IMPORT

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true, // Keep this enabled to debug the PWA in your local browser
        type: 'module'
      },
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
        navigateFallbackDenylist: [/^\/api\//],
        // The rest of your runtimeCaching logic remains the same...
        runtimeCaching: [
          {
            // Auth, checkout, mutations — always network only; never cached by SW
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly"
          },
          // ... (keep all the runtimeCaching blocks you already have)
        ]
      }
    })
  ],
  assetsInclude: ["**/*.glb"],
  // 2. ADD THIS RESOLVE BLOCK
  resolve: {
    alias: {
      // This forces the app to use the local 'three' package, 
      // preventing the "Multiple instances" warning.
      'three': path.resolve(__dirname, './node_modules/three'),
    },
  },
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