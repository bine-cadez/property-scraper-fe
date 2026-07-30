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
    typeCheck: true,
  },
  runtimeConfig: {
    mapProviderToken: '',
    public: {
      mapStyleUrl: '',
      mapAttribution:
        'Kartografski prikaz © Prostor na dlani · vzorčni podatki',
      siteUrl: 'http://localhost:3000',
    },
  },
  routeRules: {
    '/': { prerender: true },
    '/metodologija': { prerender: true },
    '/viri-podatkov': { prerender: true },
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
