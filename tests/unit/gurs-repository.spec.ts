import { describe, expect, it } from 'vitest';
import {
  aggregateValuationRecords,
  positionFromGursRecord,
} from '../../server/repositories/gurs-repository';

describe('GURS record coordinates', () => {
  it('normalizes address centroids from D96/TM to WGS84', () => {
    const position = positionFromGursRecord({
      centroidE: '461589',
      centroidN: '102970',
    });

    expect(position?.[0]).toBeCloseTo(14.5, 2);
    expect(position?.[1]).toBeCloseTo(46.07, 2);
  });

  it('preserves coordinates that are already WGS84', () => {
    expect(
      positionFromGursRecord({ geometry: { coordinates: [14.5, 46.05] } }),
    ).toEqual([14.5, 46.05]);
  });

  it('does not invent a shared location for records without coordinates', () => {
    expect(positionFromGursRecord({ id: 'address-1' })).toBeUndefined();
  });
});

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
    });
  });

  it('ignores records without a numeric valuation', () => {
    expect(
      aggregateValuationRecords([
        { eidDelStavbe: 'part-1', modelledValue: 125_000 },
        { eidDelStavbe: 'part-2', modelledValue: null },
      ]),
    ).toMatchObject({ modelledValue: 125_000 });
  });
});
