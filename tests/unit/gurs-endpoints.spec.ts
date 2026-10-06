import { describe, expect, it } from 'vitest'
import {
  GURS_RESOURCES,
  GURS_STATISTICS_RESOURCES,
  GURS_TILE_LAYERS,
  GURS_VALUATION_RESOURCES,
  gursEndpoints,
} from '../../server/utils/gurs-endpoints'

describe('Property Scraper OpenAPI endpoints', () => {
  it('covers every documented JSON resource list and detail route', () => {
    expect(GURS_RESOURCES.map(gursEndpoints.resources.list)).toEqual([
      '/gurs/addresses',
      '/gurs/buildings',
      '/gurs/building-parts',
      '/gurs/cadastral-municipalities',
      '/gurs/code-lists',
      '/gurs/parcels',
      '/gurs/sources',
      '/gurs/transactions',
    ])

    expect(
      GURS_RESOURCES.map((resource) =>
        gursEndpoints.resources.detail(resource, 'record/id'),
      ),
    ).toEqual(GURS_RESOURCES.map((resource) => `/gurs/${resource}/record%2Fid`))
  })

  it('covers the documented system, ingestion, statistics, and search routes', () => {
    expect(gursEndpoints.health).toBe('/health')
    expect(gursEndpoints.ready).toBe('/ready')
    expect(gursEndpoints.ingest).toBe('/ingest/gurs')
    expect(gursEndpoints.search).toBe('/gurs/search')
    expect(gursEndpoints.statistics.all).toBe('/gurs/statistics')
    expect(
      GURS_STATISTICS_RESOURCES.map(gursEndpoints.statistics.resource),
    ).toEqual([
      '/gurs/statistics/transactions',
      '/gurs/statistics/buildings',
      '/gurs/statistics/building-parts',
      '/gurs/statistics/parcels',
      '/gurs/statistics/addresses',
    ])
  })

  it('covers valuation-unit and vector-tile route variants', () => {
    expect(
      GURS_VALUATION_RESOURCES.map((resource) =>
        gursEndpoints.valuationUnits(resource, '42'),
      ),
    ).toEqual([
      '/gurs/buildings/42/valuation-units',
      '/gurs/building-parts/42/valuation-units',
      '/gurs/parcels/42/valuation-units',
    ])

    expect(
      GURS_TILE_LAYERS.map((layer) =>
        gursEndpoints.tile(layer, 12, 2200, 1400),
      ),
    ).toEqual([
      '/map/tiles/properties/12/2200/1400.mvt',
      '/map/tiles/sales/12/2200/1400.mvt',
      '/map/tiles/parcels/12/2200/1400.mvt',
      '/map/tiles/cadastral/12/2200/1400.mvt',
    ])
  })
})
