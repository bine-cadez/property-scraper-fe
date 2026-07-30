import type { ViewportResponse } from '../../shared/types/geojson'
import type { Listing, Transaction } from '../../shared/types/property'
import {
  buildingRepository,
  listingRepository,
  parcelRepository,
  transactionRepository,
} from '../repositories/fixture-repositories'

export async function getViewportFeatures(
  bounds: [number, number, number, number],
  limit = 500,
): Promise<ViewportResponse> {
  const [parcels, buildings, transactions, listings] = await Promise.all([
    parcelRepository.listByBounds(bounds, { limit }),
    buildingRepository.listByBounds(bounds, { limit }),
    transactionRepository.listByBounds(bounds, { limit }),
    listingRepository.listByBounds(bounds, { limit }),
  ])

  const pointFeature = (item: Transaction | Listing) => {
    const isTransaction = 'transactionDate' in item
    const value = isTransaction ? item.price : item.askingPrice
    return {
      type: 'Feature' as const,
      id: item.id,
      geometry: {
        type: 'Point' as const,
        coordinates: isTransaction ? item.location : item.coordinates,
      },
      properties: {
        id: item.id,
        kind: isTransaction ? ('transaction' as const) : ('listing' as const),
        label: isTransaction ? 'Dosežena prodajna cena' : item.title,
        amount: value.amount,
        pricePerM2: item.pricePerM2,
        areaM2: item.areaM2,
        propertyType: isTransaction ? item.propertyType : 'apartment',
        date: isTransaction ? item.transactionDate : item.publishedAt,
      },
    }
  }

  return {
    parcels: {
      type: 'FeatureCollection',
      features: parcels.map((parcel) => ({
        type: 'Feature',
        id: parcel.id,
        geometry: parcel.geometry,
        properties: {
          id: parcel.id,
          kind: 'parcel',
          label: `Parcela ${parcel.parcelNumber}`,
          areaM2: parcel.areaM2,
          ...(parcel.officialValue
            ? { officialValue: parcel.officialValue.amount }
            : {}),
        },
      })),
    },
    buildings: {
      type: 'FeatureCollection',
      features: buildings.map((building) => ({
        type: 'Feature',
        id: building.id,
        geometry: building.geometry,
        properties: {
          id: building.id,
          kind: 'building',
          label: building.address,
          propertyType: building.buildingUse.toLowerCase().includes('stanovanj')
            ? 'apartment'
            : 'other',
          ...(building.constructionYear
            ? { constructionYear: building.constructionYear }
            : {}),
        },
      })),
    },
    points: {
      type: 'FeatureCollection',
      features: [...transactions, ...listings].map(pointFeature),
    },
    meta: {
      count:
        parcels.length +
        buildings.length +
        transactions.length +
        listings.length,
      limit,
      generatedAt: new Date().toISOString(),
      source: 'typed-fixtures',
    },
  }
}
