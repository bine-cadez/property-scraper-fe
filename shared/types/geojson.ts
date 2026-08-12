//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import type {
  Building,
  Listing,
  Parcel,
  PointGeometry,
  PolygonGeometry,
  Transaction,
} from './property'

export interface GeoJsonFeature<
  G extends PolygonGeometry | PointGeometry,
  P extends Record<string, unknown>,
> {
  type: 'Feature'
  id?: string
  geometry: G
  properties: P
}

export interface GeoJsonFeatureCollection<
  G extends PolygonGeometry | PointGeometry,
  P extends Record<string, unknown>,
> {
  type: 'FeatureCollection'
  features: GeoJsonFeature<G, P>[]
}

export interface MapParcelProperties extends Record<string, unknown> {
  id: string
  kind: 'parcel'
  label: string
  areaM2: number
  officialValue?: number
}

export interface MapBuildingProperties extends Record<string, unknown> {
  id: string
  kind: 'building'
  label: string
  propertyType: string
  constructionYear?: number
}

export interface MapPointProperties extends Record<string, unknown> {
  id: string
  kind: 'transaction' | 'listing'
  label: string
  amount: number
  pricePerM2: number
  areaM2: number
  propertyType: string
  date: string
}

export interface ViewportResponse {
  parcels: GeoJsonFeatureCollection<PolygonGeometry, MapParcelProperties>
  buildings: GeoJsonFeatureCollection<PolygonGeometry, MapBuildingProperties>
  points: GeoJsonFeatureCollection<PointGeometry, MapPointProperties>
  meta: {
    count: number
    limit: number
    generatedAt: string
    source: string
  }
}

export type MapEntity = Parcel | Building | Transaction | Listing
