import { describe, expect, it } from 'vitest'
import { siD96TmToWgs84 } from '../../shared/utils/coordinates'

describe('EPSG:3794 coordinate normalization', () => {
  it('normalizes a representative Ljubljana coordinate to WGS84', () => {
    const [longitude, latitude] = siD96TmToWgs84([461425.19, 101141.42])

    expect(longitude).toBeCloseTo(14.5, 1)
    expect(latitude).toBeCloseTo(46.05, 1)
  })
})
