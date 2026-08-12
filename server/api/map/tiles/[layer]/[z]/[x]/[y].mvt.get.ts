//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { gursTile, type GursTileLayer } from '../../../../../../utils/gurs-api'

const layers = new Set<GursTileLayer>([
  'properties',
  'sales',
  'parcels',
  'cadastral',
])

const filtersByLayer: Record<GursTileLayer, Set<string>> = {
  properties: new Set([
    'koId',
    'buildingTypeCode',
    'constructionYearMin',
    'constructionYearMax',
  ]),
  sales: new Set([
    'itemKind',
    'transactionId',
    'propertyType',
    'landType',
    'priceMin',
    'priceMax',
    'contractDateMin',
    'contractDateMax',
  ]),
  parcels: new Set(['koId', 'areaMin', 'areaMax']),
  cadastral: new Set(['koId']),
}

export default defineEventHandler(async (event) => {
  const layer = getRouterParam(event, 'layer') as GursTileLayer
  const z = Number(getRouterParam(event, 'z'))
  const x = Number(getRouterParam(event, 'x'))
  const rawY =
    getRouterParam(event, 'y.mvt') || getRouterParam(event, 'y') || ''
  const y = Number(rawY.replace(/\.mvt$/, ''))

  if (
    !layers.has(layer) ||
    !Number.isInteger(z) ||
    z < 0 ||
    z > 22 ||
    !Number.isInteger(x) ||
    x < 0 ||
    x >= 2 ** z ||
    !Number.isInteger(y) ||
    y < 0 ||
    y >= 2 ** z
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Neveljaven MVT tile.',
    })
  }

  const allowedFilters = filtersByLayer[layer]
  const query = Object.fromEntries(
    Object.entries(getQuery(event)).flatMap(([key, value]) =>
      allowedFilters.has(key) && typeof value === 'string'
        ? [[key, value]]
        : [],
    ),
  )
  const tile = await gursTile(event, layer, z, x, y, query)
  return new Response(tile.body, {
    headers: {
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
})
