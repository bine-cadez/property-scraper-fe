import { describe, expect, it } from 'vitest'
import { aggregateValuationRecords } from '../../server/repositories/gurs-repository'

describe('GURS property valuation aggregation', () => {
  it('sums every modelled valuation attached to a building', () => {
    expect(
      aggregateValuationRecords([
        {
          eidDelStavbe: 'part-1',
          modelledValue: 787_000,
          sourceKey: 'valuation-source',
        },
        { eidDelStavbe: 'part-2', modelledValue: 420_000 },
        { eidDelStavbe: 'part-3', modelledValue: 193_700 },
      ]),
    ).toMatchObject({
      eidDelStavbe: 'part-1',
      modelledValue: 1_400_700,
      sourceKey: 'valuation-source',
    })
  })

  it('ignores records without a numeric valuation', () => {
    expect(
      aggregateValuationRecords([
        { eidDelStavbe: 'part-1', modelledValue: 125_000 },
        { eidDelStavbe: 'part-2', modelledValue: null },
      ]),
    ).toMatchObject({ modelledValue: 125_000 })
  })
})
