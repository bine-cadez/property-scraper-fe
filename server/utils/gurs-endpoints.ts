export const GURS_RESOURCES = [
  'addresses',
  'buildings',
  'building-parts',
  'cadastral-municipalities',
  'code-lists',
  'parcels',
  'sources',
  'transactions',
] as const

export type GursResource = (typeof GURS_RESOURCES)[number]

export const GURS_STATISTICS_RESOURCES = [
  'transactions',
  'buildings',
  'building-parts',
  'parcels',
  'addresses',
] as const

export type GursStatisticsResource = (typeof GURS_STATISTICS_RESOURCES)[number]

export const GURS_VALUATION_RESOURCES = [
  'buildings',
  'building-parts',
  'parcels',
] as const

export type GursValuationResource = (typeof GURS_VALUATION_RESOURCES)[number]

export const GURS_TILE_LAYERS = [
  'properties',
  'sales',
  'parcels',
  'cadastral',
] as const

export type GursTileLayer = (typeof GURS_TILE_LAYERS)[number]

function segment(value: string | number): string {
  return encodeURIComponent(String(value))
}

/** Paths published by the Property Scraper OpenAPI document. */
export const gursEndpoints = {
  health: '/health',
  ready: '/ready',
  ingest: '/ingest/gurs',
  search: '/gurs/search',
  resources: {
    list: (resource: GursResource) => `/gurs/${resource}`,
    detail: (resource: GursResource, id: string) =>
      `/gurs/${resource}/${segment(id)}`,
  },
  statistics: {
    all: '/gurs/statistics',
    resource: (resource: GursStatisticsResource) =>
      `/gurs/statistics/${resource}`,
  },
  valuationUnits: (resource: GursValuationResource, id: string) =>
    `/gurs/${resource}/${segment(id)}/valuation-units`,
  tile: (layer: GursTileLayer, z: number, x: number, y: number) =>
    `/map/tiles/${layer}/${z}/${x}/${y}.mvt`,
} as const
