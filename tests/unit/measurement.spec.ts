//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { describe, expect, it } from 'vitest'
import {
  calculatePathDistance,
  formatMeasuredDistance,
} from '../../app/utils/map/measurement'

describe('map measurement', () => {
  it('adds the distance of each segment in a path', () => {
    const distance = calculatePathDistance([
      [14.5, 46.05],
      [14.51, 46.05],
      [14.52, 46.05],
    ])

    expect(distance).toBeGreaterThan(1_500)
    expect(distance).toBeLessThan(1_600)
  })

  it('formats only complete measurements', () => {
    expect(formatMeasuredDistance([[14.5, 46.05]])).toBeUndefined()
    expect(
      formatMeasuredDistance([
        [14.5, 46.05],
        [14.501, 46.05],
      ]),
    ).toMatch(/m$/)
  })
})
