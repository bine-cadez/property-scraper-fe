//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { describe, expect, it } from 'vitest'
import { getValueLabel, VALUE_LABELS } from '../../shared/utils/value-labels'

describe('value category labels', () => {
  it('keeps official, estimate, transaction and asking values distinct', () => {
    const protectedTypes = [
      'official_assessed',
      'market_estimate',
      'transaction',
      'asking',
    ] as const
    const labels = protectedTypes.map((type) => getValueLabel(type))

    expect(new Set(labels).size).toBe(protectedTypes.length)
    expect(VALUE_LABELS.asking).toContain('Oglaševana')
    expect(VALUE_LABELS.transaction).toContain('prodajna')
    expect(VALUE_LABELS.official_assessed).toContain('Uradna')
    expect(VALUE_LABELS.market_estimate).toContain('tržna ocena')
  })
})
