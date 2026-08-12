//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
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

export interface Listing {
  id: string
  title: string
  location: string
  askingPrice: MoneyValue
  pricePerM2: number
  areaM2: number
  publishedAt: string
  sourceName: string
  sourceUrl: string
  coordinates: Position
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
  coordinates: Position
  selectionId?: string
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
