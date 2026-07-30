import type {
  Building,
  Listing,
  Parcel,
  PropertyRecord,
  PropertyUnit,
  SearchResult,
  Transaction,
  Valuation,
} from '../types/property'

export interface QueryOptions {
  signal?: AbortSignal
  limit?: number
}

export interface PropertyRepository {
  findById(id: string): Promise<PropertyRecord | null>
  listByBounds(
    bounds: [number, number, number, number],
    options?: QueryOptions,
  ): Promise<PropertyRecord[]>
}

export interface ParcelRepository {
  findById(id: string): Promise<Parcel | null>
  listByBounds(
    bounds: [number, number, number, number],
    options?: QueryOptions,
  ): Promise<Parcel[]>
}

export interface BuildingRepository {
  findById(id: string): Promise<Building | null>
  listByBounds(
    bounds: [number, number, number, number],
    options?: QueryOptions,
  ): Promise<Building[]>
}

export interface TransactionRepository {
  listByBounds(
    bounds: [number, number, number, number],
    options?: QueryOptions,
  ): Promise<Transaction[]>
  listComparables(
    propertyId: string,
    options?: QueryOptions,
  ): Promise<Transaction[]>
}

export interface ListingRepository {
  listByBounds(
    bounds: [number, number, number, number],
    options?: QueryOptions,
  ): Promise<Listing[]>
  listNearby(propertyId: string, options?: QueryOptions): Promise<Listing[]>
}

export interface ValuationRepository {
  getForProperty(propertyId: string): Promise<Valuation | null>
}

export interface GeocodingRepository {
  search(query: string, options?: QueryOptions): Promise<SearchResult[]>
}

export interface PropertyUnitRepository {
  listByBuilding(buildingId: string): Promise<PropertyUnit[]>
}
