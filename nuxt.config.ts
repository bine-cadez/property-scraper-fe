import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-30',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', 'maplibre-gl/dist/maplibre-gl.css'],
  modules: ['@nuxt/eslint', 'nitro-cloudflare-dev'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
    // The long-running Vite checker can retain stale Nitro route unions and
    // hit TypeScript's recursion limit. `pnpm typecheck` remains authoritative.
    typeCheck: false,
  },
  runtimeConfig: {
    gursApiBaseUrl: 'http://localhost:3001',
    gursApiKey: '',
    mapProviderToken: '',
    public: {
      mapStyleUrl: 'https://tiles.openfreemap.org/styles/bright',
      map3dStyleUrl: 'https://tiles.openfreemap.org/styles/bright',
      mapAttribution: 'Podatki GURS © Prostor na dlani',
      siteUrl: 'http://localhost:3000',
    },
  },
  routeRules: {
    '/': { redirect: '/zemljevid' },
    '/metodologija': { prerender: true },
    '/viri-podatkov': { ssr: true },
    '/o-projektu': { prerender: true },
    '/zemljevid': { ssr: true },
    '/nepremicnina/**': { ssr: true },
    '/parcela/**': { ssr: true },
    '/stavba/**': { ssr: true },
  },
  nitro: {
    prerender: {
      routes: ['/robots.txt', '/sitemap.xml'],
    },

    preset: 'cloudflare_module',

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
});
