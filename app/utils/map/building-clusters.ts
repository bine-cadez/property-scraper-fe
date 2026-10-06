import type { Position } from '#shared/types/property'

type ClusterCandidate = {
  id?: string | number | undefined
  geometry: {
    type: string
    coordinates?: unknown
  }
  properties?: Record<string, unknown> | null | undefined
}

export type BuildingClusterFeature = {
  type: 'Feature'
  id: string
  geometry: {
    type: 'Point'
    coordinates: Position
  }
  properties: {
    cluster_count: number
    feature_type: 'cluster'
  }
}

/**
 * Projects streamed vector-tile clusters into one stable GeoJSON point per
 * location. Tile-edge copies are collapsed without counting buildings twice.
 */
export function buildingClusterCollection(
  candidates: readonly ClusterCandidate[],
) {
  const clusters = new Map<string, BuildingClusterFeature>()

  for (const candidate of candidates) {
    if (
      candidate.geometry.type !== 'Point' ||
      !Array.isArray(candidate.geometry.coordinates)
    ) {
      continue
    }
    const [rawLng, rawLat] = candidate.geometry.coordinates
    const lng = Number(rawLng)
    const lat = Number(rawLat)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue

    const rawCount = Number(candidate.properties?.cluster_count ?? 1)
    const count = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 1
    const coordinateKey = `${lng.toFixed(6)}:${lat.toFixed(6)}`
    const existing = clusters.get(coordinateKey)
    if (existing && existing.properties.cluster_count >= count) continue

    clusters.set(coordinateKey, {
      type: 'Feature',
      id: `building-cluster:${coordinateKey}`,
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        cluster_count: count,
        feature_type: 'cluster',
      },
    })
  }

  const features = [...clusters.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  )
  return {
    collection: {
      type: 'FeatureCollection' as const,
      features,
    },
    signature: features
      .map(
        ({ id, properties }) => `${id}:${properties.cluster_count}`,
      )
      .join('|'),
  }
}
