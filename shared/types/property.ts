export type Position = [number, number]

export interface PolygonGeometry {
  type: 'Polygon'
  coordinates: Position[][]
}

export interface PointGeometry {
  type: 'Point'
  coordinates: Position
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unavailable'
export type DataQuality = 'current' | 'stale' | 'partial' | 'unavailable'
export type ValueType =
  | 'official_assessed'
  | 'market_estimate'
  | 'transaction'
  | 'asking'
  | 'user_entered'

export interface DataSource {
  id: string
  name: string
  url?: string
  license?: string
  quality: DataQuality
}

export interface MoneyValue {
  amount: number
  amountPerM2?: number
  valueType: ValueType
  source: DataSource
  sourceUpdatedAt: string
}

export interface Valuation {
  amount: number
  amountPerM2?: number
  valueType: ValueType
  confidence: ConfidenceLevel
  valuationDate: string
  methodologyVersion: string
  explanatoryFactors: string[]
  comparableTransactionIds: string[]
  source: DataSource
}

export interface Parcel {
  id: string
  cadastralMunicipalityId: string
  cadastralMunicipalityName: string
  parcelNumber: string
  geometry: PolygonGeometry
  centroid: Position
  areaM2: number
  landUse: string
  intendedUse: string
  regulationStatus: string
  buildingIds: string[]
  officialValue?: MoneyValue
  dataSource: DataSource
  sourceUpdatedAt: string
}

export interface Building {
  id: string
  parcelIds: string[]
  address: string
  geometry: PolygonGeometry
  footprintAreaM2: number
  grossAreaM2: number
  constructionYear?: number
  renovationYear?: number
  floors: number
  unitCount: number
  buildingUse: string
  energyRating?: string
  officialValue?: MoneyValue
  dataSource: DataSource
  sourceUpdatedAt: string
}

export interface PropertyUnit {
  id: string
  buildingId: string
  type: 'apartment' | 'house' | 'office' | 'retail' | 'other'
  floor?: number
  usableAreaM2: number
  rooms?: number
  officialValue?: MoneyValue
  estimatedMarketValue?: Valuation
}

export interface Transaction {
  id: string
  propertyType: PropertyUnit['type']
  location: Position
  transactionDate: string
  price: MoneyValue
  pricePerM2: number
  areaM2: number
  distanceFromSelectedProperty?: number
  dataSource: DataSource
  sourceUpdatedAt: string
}

export type ListingTransactionType = 'sale' | 'rent'
export type ListingPropertyType =
  'house' | 'apartment' | 'land' | 'commercial' | 'garage' | 'other'
export type ListingPriceUnit =
  'total' | 'month' | 'week' | 'day' | 'm2' | 'unknown'
export type ListingLocationAccuracy = 'exact' | 'approximate' | 'unknown'

/** Asking-price advertisement returned by the Property Scraper API. */
export interface Listing {
  id: string
  source: string
  sourceListingId: string
  url: string
  transactionType: ListingTransactionType
  propertyType: ListingPropertyType
  title: string
  description: string
  locationText: string
  address: string | null
  price: number | null
  currency: string
  priceUnit: ListingPriceUnit
  areaM2: number | null
  landAreaM2: number | null
  rooms: number | null
  latitude: number | null
  longitude: number | null
  locationAccuracy: ListingLocationAccuracy
  images: string[]
  contentFingerprint: string
  duplicateOf: string | null
  firstSeenAt: string
  lastSeenAt: string
  scrapedAt: string
  updatedAt: string
  active: boolean
}

export interface ListingSource {
  key: string
  name: string
  homepage: string
  priority: number
  enabled: boolean
  note: string | null
}

export interface ListingListResponse {
  items: Listing[]
  page: {
    hasMore: boolean
    nextCursor: string | null
  }
}

export interface ListingSourcesResponse {
  items: ListingSource[]
}

export interface PropertyRecord {
  id: string
  slug: string
  title: string
  address: string
  municipality: string
  settlement: string
  propertyType: PropertyUnit['type']
  coordinates: Position
  parcel: Parcel
  building?: Building
  units: PropertyUnit[]
  primaryValuation?: Valuation
  transactions: Transaction[]
  listings: Listing[]
}

export type SearchResultType =
  | 'address'
  | 'municipality'
  | 'settlement'
  | 'cadastral_municipality'
  | 'parcel'
  | 'building'

export interface SearchResult {
  id: string
  type: SearchResultType
  primaryLabel: string
  secondaryLabel: string
  coordinates?: Position
  selectionId?: string
}

/**
 * A lightweight record projected from the map's already-rendered vector
 * features. It powers the V2 results list without introducing a second data
 * source or changing the server-side clustering contract.
 */
export interface MapResultItem {
  id: string
  kind?: 'building' | 'transaction' | 'listing'
  selectionId: string
  address: string
  location?: string
  unitLabel?: string
  propertyType?: string
  totalPrice?: number
  pricePerM2?: number
  areaM2?: number
  usableAreaM2?: number
  floor?: number
  constructionYear?: number
  officialValue?: number
  footprintAreaM2?: number
  unitCount?: number
  floors?: number
  buildingUse?: string
  status?: string
  sourceLabel?: string
  transactionDate?: string
  priceUnit?: ListingPriceUnit
  transactionType?: ListingTransactionType
}

export interface MapFilters {
  propertyTypes: PropertyUnit['type'][]
  minPrice?: number
  maxPrice?: number
  minPricePerM2?: number
  maxPricePerM2?: number
  transactionFrom?: string
  minAreaM2?: number
  minParcelAreaM2?: number
  constructionYearFrom?: number
}

export type MapLayerId =
  | 'parcels'
  | 'buildings'
  | 'transactions'
  | 'listings'
  | 'priceM2'
  | 'officialValue'

export interface MapState {
  center: Position
  zoom: number
  layers: MapLayerId[]
  selectedId?: string
}
