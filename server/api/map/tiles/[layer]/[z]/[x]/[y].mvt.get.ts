import { gursTile, type GursTileLayer } from '../../../../../../utils/gurs-api'

const layers = new Set<GursTileLayer>([
  'properties',
  'sales',
  'parcels',
  'cadastral',
])

export default defineEventHandler(async (event) => {
  const layer = getRouterParam(event, 'layer') as GursTileLayer
  const z = Number(getRouterParam(event, 'z'))
  const x = Number(getRouterParam(event, 'x'))
  const rawY = getRouterParam(event, 'y') || ''
  const y = Number(rawY.replace(/\.mvt$/, ''))

  if (
    !layers.has(layer) ||
    !Number.isInteger(z) ||
    z < 0 ||
    z > 22 ||
    !Number.isInteger(x) ||
    x < 0 ||
    !Number.isInteger(y) ||
    y < 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Neveljaven MVT tile.',
    })
  }

  const tile = await gursTile(event, layer, z, x, y)
  setHeader(event, 'Content-Type', 'application/vnd.mapbox-vector-tile')
  setHeader(
    event,
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=3600',
  )
  return new Uint8Array(tile)
})
