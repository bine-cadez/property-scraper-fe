//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { describe, expect, it } from 'vitest'
import {
  buildingFeatureCollection,
  parcelFeatureCollection,
} from '../../server/utils/gurs-parcels'

describe('GURS parcel GeoJSON conversion', () => {
  it('converts the items response into selectable map features', () => {
    const result = parcelFeatureCollection({
      items: [
        {
          eidParcela: '100100000199053973',
          koId: 2,
          parcelNumber: '13/4',
          area: 1208,
          buildingIds: ['building-42'],
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [16.2533, 46.7168],
                [16.2537, 46.7168],
                [16.2533, 46.7168],
              ],
            ],
          },
        },
      ],
    })

    expect(result.features).toHaveLength(1)
    expect(result.features[0]).toMatchObject({
      id: '100100000199053973',
      properties: {
        id: '100100000199053973',
        kind: 'parcel',
        label: 'Parcela 13/4',
        areaM2: 1208,
        buildingIds: ['building-42'],
        koId: 2,
      },
    })
    expect(result.features[0]?.properties).not.toHaveProperty('geometry')
  })

  it('drops records without an id or polygon geometry', () => {
    expect(
      parcelFeatureCollection({ items: [{ eidParcela: '1' }, {}] }).features,
    ).toEqual([])
  })

  it('converts related building footprints for the selected overlay', () => {
    const result = buildingFeatureCollection({
      items: [
        {
          eidStavba: 'building-42',
          buildingNumber: 29,
          address: 'Dunajska cesta 42, Ljubljana',
          municipality: 'Ljubljana',
          grossFloorArea: 184.4,
          officialValue: { amount: 425000 },
          parcels: [{ eidParcela: 'parcel-7' }],
          footprintGeometry: {
            type: 'Polygon',
            coordinates: [
              [
                [14.5, 46.05],
                [14.5001, 46.05],
                [14.5, 46.05],
              ],
            ],
          },
        },
      ],
    })

    expect(result.features[0]).toMatchObject({
      id: 'building-42',
      properties: {
        id: 'building-42',
        kind: 'building',
        markerLabel: '29',
        parcelIds: ['parcel-7'],
        label: 'Dunajska cesta 42, Ljubljana',
        displayValue: 425000,
        displayValueLabel: '425 tis. €',
        displayAreaM2: 184.4,
        displayRegion: 'Ljubljana',
      },
    })
  })
})
