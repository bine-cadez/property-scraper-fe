//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.public.siteUrl).replace(/\/$/, '')
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /zemljevid?

Sitemap: ${base}/sitemap.xml
`
})
