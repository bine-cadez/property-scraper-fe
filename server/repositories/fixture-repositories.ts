import type {
  BuildingRepository,
  GeocodingRepository,
  ListingRepository,
  ParcelRepository,
  PropertyRepository,
  TransactionRepository,
  ValuationRepository,
} from '../../shared/repositories/contracts'
import type { Position, SearchResult } from '../../shared/types/property'
import {
  buildings,
  listings,
  parcels,
  properties,
  transactions,
} from '../fixtures/property-data'

function inBounds(
  [lng, lat]: Position,
  [west, south, east, north]: [number, number, number, number],
): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north
}

function findPropertyByAnyId(id: string) {
  return (
    properties.find(
      (property) =>
        property.id === id ||
        property.parcel.id === id ||
        property.building?.id === id ||
        property.units.some((unit) => unit.id === id) ||
        property.transactions.some((transaction) => transaction.id === id) ||
        property.listings.some((listing) => listing.id === id),
    ) ?? null
  )
}

export const propertyRepository: PropertyRepository = {
  async findById(id) {
    return findPropertyByAnyId(id)
  },
  async listByBounds(bounds, options) {
    return properties
      .filter((property) => inBounds(property.coordinates, bounds))
      .slice(0, options?.limit ?? 100)
  },
}

export const parcelRepository: ParcelRepository = {
  async findById(id) {
    return parcels.find((parcel) => parcel.id === id) ?? null
  },
  async listByBounds(bounds, options) {
    return parcels
      .filter((parcel) => inBounds(parcel.centroid, bounds))
      .slice(0, options?.limit ?? 100)
  },
}

export const buildingRepository: BuildingRepository = {
  async findById(id) {
    return buildings.find((building) => building.id === id) ?? null
  },
  async listByBounds(bounds, options) {
    return buildings
      .filter((building) => {
        const property = findPropertyByAnyId(building.id)
        return property ? inBounds(property.coordinates, bounds) : false
      })
      .slice(0, options?.limit ?? 100)
  },
}

export const transactionRepository: TransactionRepository = {
  async listByBounds(bounds, options) {
    return transactions
      .filter((transaction) => inBounds(transaction.location, bounds))
      .slice(0, options?.limit ?? 250)
  },
  async listComparables(propertyId, options) {
    return (findPropertyByAnyId(propertyId)?.transactions ?? []).slice(
      0,
      options?.limit ?? 10,
    )
  },
}

export const listingRepository: ListingRepository = {
  async listByBounds(bounds, options) {
    return listings
      .filter((listing) => inBounds(listing.coordinates, bounds))
      .slice(0, options?.limit ?? 100)
  },
  async listNearby(propertyId, options) {
    return (findPropertyByAnyId(propertyId)?.listings ?? []).slice(
      0,
      options?.limit ?? 10,
    )
  },
}

export const valuationRepository: ValuationRepository = {
  async getForProperty(propertyId) {
    return findPropertyByAnyId(propertyId)?.primaryValuation ?? null
  },
}

const administrativeResults: SearchResult[] = [
  {
    id: 'obcina-ljubljana',
    type: 'municipality',
    primaryLabel: 'Mestna občina Ljubljana',
    secondaryLabel: 'Občina · 295.504 prebivalcev',
    coordinates: [14.5058, 46.0569],
  },
  {
    id: 'naselje-ljubljana',
    type: 'settlement',
    primaryLabel: 'Ljubljana',
    secondaryLabel: 'Naselje · Mestna občina Ljubljana',
    coordinates: [14.5058, 46.0569],
  },
  {
    id: 'ko-1727',
    type: 'cadastral_municipality',
    primaryLabel: '1727 Ljubljana mesto',
    secondaryLabel: 'Katastrska občina',
    coordinates: [14.505, 46.0566],
  },
]

export const geocodingRepository: GeocodingRepository = {
  async search(query, options) {
    const normalized = query.trim().toLocaleLowerCase('sl')
    if (!normalized) return []

    const propertyResults: SearchResult[] = properties.flatMap((property) => [
      {
        id: `naslov-${property.id}`,
        type: 'address',
        primaryLabel: property.address,
        secondaryLabel: `${property.title} · ${property.municipality}`,
        coordinates: property.coordinates,
        selectionId: property.id,
      },
      {
        id: property.parcel.id,
        type: 'parcel',
        primaryLabel: `Parcela ${property.parcel.parcelNumber}`,
        secondaryLabel: `k. o. ${property.parcel.cadastralMunicipalityId} ${property.parcel.cadastralMunicipalityName}`,
        coordinates: property.parcel.centroid,
        selectionId: property.parcel.id,
      },
      ...(property.building
        ? [
            {
              id: property.building.id,
              type: 'building' as const,
              primaryLabel: `Stavba ${property.building.id.split('-').at(-1)}`,
              secondaryLabel: property.building.address,
              coordinates: property.coordinates,
              selectionId: property.building.id,
            },
          ]
        : []),
    ])

    return [...propertyResults, ...administrativeResults]
      .filter((result) =>
        `${result.primaryLabel} ${result.secondaryLabel}`
          .toLocaleLowerCase('sl')
          .includes(normalized),
      )
      .slice(0, options?.limit ?? 8)
  },
}
