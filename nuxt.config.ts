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
      mapStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
      mapAttribution: 'Vzorčni nepremičninski podatki © Prostor na dlani',
      siteUrl: 'http://localhost:3000',
    },
  },
  routeRules: {
    '/': { redirect: '/zemljevid' },
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
