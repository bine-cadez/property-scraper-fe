import { describe, expect, it } from 'vitest'
import { buildingClusterCollection } from '../../app/utils/map/building-clusters'

describe('building cluster projection', () => {
  it('deduplicates tile-edge copies without counting buildings twice', () => {
    const { collection } = buildingClusterCollection([
      {
        id: 1,
        geometry: { type: 'Point', coordinates: [14.5, 46.05] },
        properties: { cluster_count: 12 },
      },
      {
        id: 2,
        geometry: { type: 'Point', coordinates: [14.5, 46.05] },
        properties: { cluster_count: 12 },
      },
      {
        id: 3,
        geometry: { type: 'Point', coordinates: [14.51, 46.06] },
        properties: { cluster_count: 7 },
      },
    ])

    expect(collection.features).toHaveLength(2)
    expect(
      collection.features.map(({ properties }) => properties.cluster_count),
    ).toEqual([12, 7])
  })

  it('ignores non-point data and normalizes invalid counts', () => {
    const { collection } = buildingClusterCollection([
      {
        geometry: { type: 'LineString', coordinates: [] },
        properties: { cluster_count: 9 },
      },
      {
        geometry: { type: 'Point', coordinates: [14.5, 46.05] },
        properties: { cluster_count: 'invalid' },
      },
    ])

    expect(collection.features).toHaveLength(1)
    expect(collection.features[0]?.properties.cluster_count).toBe(1)
  })
})
