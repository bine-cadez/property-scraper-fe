import { describe, expect, it } from 'vitest'
import {
  BUILDING_VALUE_PROPERTY_KEYS,
  propertyMapTileUrls,
} from '../../app/utils/map/layers'

describe('property map vector tile URLs', () => {
  it('uses the backend z/x/y MVT contract for every spatial layer', () => {
    const origin = window.location.origin
    expect(propertyMapTileUrls({ propertyTypes: [] })).toEqual({
      'gurs-properties': `${origin}/api/map/tiles/properties/{z}/{x}/{y}.mvt?v=4`,
      'gurs-sales': `${origin}/api/map/tiles/sales/{z}/{x}/{y}.mvt?v=4`,
      'gurs-parcels': `${origin}/api/map/tiles/parcels/{z}/{x}/{y}.mvt?v=4`,
      'gurs-cadastral': `${origin}/api/map/tiles/cadastral/{z}/{x}/{y}.mvt?v=4`,
    })
  })

  it('does not send undocumented filter query parameters', () => {
    const urls = propertyMapTileUrls({
      propertyTypes: ['house'],
      minPrice: 100_000,
      maxPrice: 450_000,
      minPricePerM2: 2_000,
      minAreaM2: 70,
      minParcelAreaM2: 350,
      constructionYearFrom: 1990,
      transactionFrom: '2024-01-01',
    })

    expect(Object.values(urls)).toEqual([
      `${window.location.origin}/api/map/tiles/properties/{z}/{x}/{y}.mvt?v=4`,
      `${window.location.origin}/api/map/tiles/sales/{z}/{x}/{y}.mvt?v=4`,
      `${window.location.origin}/api/map/tiles/parcels/{z}/{x}/{y}.mvt?v=4`,
      `${window.location.origin}/api/map/tiles/cadastral/{z}/{x}/{y}.mvt?v=4`,
    ])
  })

  it('reads the summed building valuation field published by the tile API', () => {
    expect(BUILDING_VALUE_PROPERTY_KEYS).toContain('modelled_value')
    expect(BUILDING_VALUE_PROPERTY_KEYS.indexOf('combined_modelled_value')).toBe(
      0,
    )
  })
})
