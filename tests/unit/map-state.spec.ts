import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAP_STATE,
  parseMapState,
  serializeMapState,
} from '../../shared/utils/map-state'

describe('shareable map state', () => {
  it('round-trips center, zoom, layers and selection', () => {
    const serialized = serializeMapState({
      center: [14.50361, 46.05623],
      zoom: 17.25,
      layers: ['parcels', 'transactions'],
      selectedId: 'parcela-1727-1492-7',
    })

    expect(parseMapState(serialized)).toEqual({
      center: [14.50361, 46.05623],
      zoom: 17.25,
      layers: ['parcels', 'transactions'],
      selectedId: 'parcela-1727-1492-7',
    })
  })

  it('rejects invalid coordinates and unknown layers', () => {
    const parsed = parseMapState({
      c: '999,999',
      z: '200',
      l: 'parcels,secret',
    })
    expect(parsed.center).toEqual(DEFAULT_MAP_STATE.center)
    expect(parsed.zoom).toBe(DEFAULT_MAP_STATE.zoom)
    expect(parsed.layers).toEqual(['parcels'])
  })
})
