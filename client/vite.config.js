import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // keep SW active in dev so you can test it (turn off if you prefer)
      devOptions: { enabled: true },
      injectRegister: 'auto',
      registerType: 'autoUpdate',

      // Workbox settings to prevent API caching / SPA fallback on APIs
      workbox: {
        // never cache API responses — always hit network
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
        // don't let the ngrok param affect cache matching
        ignoreURLParametersMatching: [/^ngrok_skip_browser_warning$/],
        // SPA fallback for navigations, but NOT for /api/*
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },

      manifest: {
        id: '/',
        name: 'The Church Studio',
        short_name: 'Church Studio',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen', 'minimal-ui'],
        background_color: '#000000',
        theme_color: '#658D1B',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  // host:true so LAN devices & ngrok can reach Vite dev server if needed
  server: { host: true },
})
