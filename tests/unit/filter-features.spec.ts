import { describe, expect, it } from 'vitest'
import type { ViewportResponse } from '../../shared/types/geojson'
import { filterViewportFeatures } from '../../app/utils/map/filter-features'

const viewport = {
  parcels: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {
          id: 'parcel-small',
          kind: 'parcel',
          label: 'Small',
          areaM2: 200,
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {
          id: 'parcel-large',
          kind: 'parcel',
          label: 'Large',
          areaM2: 800,
        },
      },
    ],
  },
  buildings: { type: 'FeatureCollection', features: [] },
  points: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [14.5, 46.05] },
        properties: {
          id: 'older-sale',
          kind: 'transaction',
          label: 'Older sale',
          amount: 250_000,
          pricePerM2: 3_000,
          areaM2: 80,
          propertyType: 'apartment',
          date: '2024-01-01',
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [14.51, 46.05] },
        properties: {
          id: 'newer-sale',
          kind: 'transaction',
          label: 'Newer sale',
          amount: 350_000,
          pricePerM2: 4_000,
          areaM2: 90,
          propertyType: 'house',
          date: '2026-01-01',
        },
      },
    ],
  },
  meta: {
    count: 4,
    limit: 500,
    generatedAt: '2026-01-01',
    source: 'test',
  },
} satisfies ViewportResponse

describe('viewport feature filtering', () => {
  it('applies structural and market filters without mutating the response', () => {
    const result = filterViewportFeatures(viewport, {
      propertyTypes: ['house'],
      minParcelAreaM2: 500,
      transactionFrom: '2025-01-01',
    })

    expect(
      result.parcels.features.map(({ properties }) => properties.id),
    ).toEqual(['parcel-large'])
    expect(
      result.points.features.map(({ properties }) => properties.id),
    ).toEqual(['newer-sale'])
    expect(result.count).toBe(2)
    expect(viewport.parcels.features).toHaveLength(2)
  })
})
