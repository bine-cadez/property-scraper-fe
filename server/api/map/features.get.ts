import { getViewportFeatures } from '../../utils/map-features'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const raw =
    typeof query.bbox === 'string' ? query.bbox.split(',').map(Number) : []
  const fallback: [number, number, number, number] = [
    14.48, 46.04, 14.53, 46.08,
  ]
  const bounds: [number, number, number, number] =
    raw.length === 4 && raw.every(Number.isFinite)
      ? [raw[0]!, raw[1]!, raw[2]!, raw[3]!]
      : fallback
  const limit = Math.min(Math.max(Number(query.limit) || 500, 1), 1000)

  setHeader(
    event,
    'Cache-Control',
    'public, max-age=30, stale-while-revalidate=120',
  )
  return getViewportFeatures(bounds, limit)
})
