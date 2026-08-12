//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import type { MapLayerId, MapState, Position } from '../types/property'

export const DEFAULT_MAP_STATE: MapState = {
  center: [14.5038, 46.0568],
  zoom: 14.9,
  layers: ['buildings'],
}

const validLayers = new Set<MapLayerId>([
  'parcels',
  'buildings',
  'transactions',
  'listings',
  'priceM2',
  'officialValue',
])

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function serializeMapState(state: MapState): Record<string, string> {
  const query: Record<string, string> = {
    c: `${state.center[0].toFixed(5)},${state.center[1].toFixed(5)}`,
    z: state.zoom.toFixed(2),
    l: state.layers.join(','),
  }
  if (state.selectedId) query.izbor = state.selectedId
  return query
}

export function parseMapState(
  query: Record<string, string | string[] | undefined>,
): MapState {
  const centerParts = typeof query.c === 'string' ? query.c.split(',') : []
  const lng = finiteNumber(centerParts[0])
  const lat = finiteNumber(centerParts[1])
  const zoom = finiteNumber(query.z)
  const requestedLayers =
    typeof query.l === 'string'
      ? query.l
          .split(',')
          .filter((layer): layer is MapLayerId =>
            validLayers.has(layer as MapLayerId),
          )
      : DEFAULT_MAP_STATE.layers
  const center: Position =
    lng !== null &&
    lat !== null &&
    lng >= 13 &&
    lng <= 17 &&
    lat >= 45 &&
    lat <= 47
      ? [lng, lat]
      : DEFAULT_MAP_STATE.center

  return {
    center,
    zoom:
      zoom !== null && zoom >= 6 && zoom <= 20 ? zoom : DEFAULT_MAP_STATE.zoom,
    layers: requestedLayers.length ? requestedLayers : DEFAULT_MAP_STATE.layers,
    ...(typeof query.izbor === 'string' && query.izbor
      ? { selectedId: query.izbor }
      : {}),
  }
}
