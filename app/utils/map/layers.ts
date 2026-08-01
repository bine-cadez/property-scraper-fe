import type { MapFilters } from '#shared/types/property'
import type { Map, VectorTileSource } from 'maplibre-gl'

const emptyFeatureCollection = {
  type: 'FeatureCollection' as const,
  features: [],
}

type PropertyMapLayer = 'properties' | 'sales' | 'parcels' | 'cadastral'
export type PropertyMapSourceId =
  'gurs-properties' | 'gurs-sales' | 'gurs-parcels' | 'gurs-cadastral'

function tileUrl(
  layer: PropertyMapLayer,
  query: Record<string, string | number | undefined> = {},
) {
  // Bust browser/MapLibre caches when the tile transport contract changes.
  const parameters = new URLSearchParams({ v: '3' })
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') parameters.set(key, String(value))
  }
  const path = `/api/map/tiles/${layer}/{z}/{x}/{y}.mvt?${parameters.toString()}`
  // MapLibre requires an absolute URL here. Concatenation intentionally keeps
  // the template braces intact (URL() percent-encodes them).
  return import.meta.client ? `${window.location.origin}${path}` : path
}

/**
 * Converts the UI filters supported by the backend into MVT query parameters.
 * Unsupported presentation-only filters are intentionally not sent upstream.
 */
export function propertyMapTileUrls(filters: MapFilters) {
  return {
    'gurs-properties': tileUrl('properties', {
      constructionYearMin: filters.constructionYearFrom,
    }),
    'gurs-sales': tileUrl('sales', {
      priceMin: filters.minPrice,
      priceMax: filters.maxPrice,
      contractDateMin: filters.transactionFrom,
    }),
    'gurs-parcels': tileUrl('parcels', {
      areaMin: filters.minParcelAreaM2,
    }),
    'gurs-cadastral': tileUrl('cadastral'),
  } satisfies Record<PropertyMapSourceId, string>
}

function addVectorSource(
  map: Map,
  id: PropertyMapSourceId,
  url: string,
  minzoom: number,
) {
  map.addSource(id, {
    type: 'vector',
    tiles: [url],
    minzoom,
    maxzoom: 22,
    promoteId: 'id',
  })
}

/** Registers viewport-limited Property Scraper MVT sources and map styling. */
export function addPropertyMapLayers(map: Map, filters: MapFilters) {
  const urls = propertyMapTileUrls(filters)
  addVectorSource(map, 'gurs-cadastral', urls['gurs-cadastral'], 8)
  addVectorSource(map, 'gurs-parcels', urls['gurs-parcels'], 15)
  addVectorSource(map, 'gurs-properties', urls['gurs-properties'], 0)
  addVectorSource(map, 'gurs-sales', urls['gurs-sales'], 0)
  map.addSource('measurement', {
    type: 'geojson',
    data: emptyFeatureCollection,
  })
  map.addSource('selected-parcel-shapes', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
  })

  // Cadastral context appears first and stays intentionally quiet beneath data.
  map.addLayer({
    id: 'cadastral-fill',
    type: 'fill',
    source: 'gurs-cadastral',
    'source-layer': 'cadastral',
    minzoom: 8,
    paint: {
      'fill-color': '#5b52e8',
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        0.025,
        13,
        0.055,
      ],
    },
  })
  map.addLayer({
    id: 'cadastral-line',
    type: 'line',
    source: 'gurs-cadastral',
    'source-layer': 'cadastral',
    minzoom: 8,
    paint: {
      'line-color': '#6a63d8',
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.7, 14, 1.5],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.38, 14, 0.62],
      'line-dasharray': [2, 1.5],
    },
  })
  map.addLayer({
    id: 'cadastral-label',
    type: 'symbol',
    source: 'gurs-cadastral',
    'source-layer': 'cadastral',
    minzoom: 9,
    maxzoom: 14.5,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 9, 9, 13, 11],
      'text-font': ['Open Sans Bold'],
      'text-letter-spacing': 0.08,
      'text-transform': 'uppercase',
      'text-max-width': 12,
    },
    paint: {
      'text-color': '#565284',
      'text-halo-color': 'rgba(255,255,255,0.88)',
      'text-halo-width': 1.5,
      'text-opacity': 0.78,
    },
  })

  // Parcel polygons stream in at z15, exactly where the API starts serving them.
  map.addLayer({
    id: 'parcel-fill',
    type: 'fill',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    minzoom: 15,
    paint: {
      'fill-color': '#f0a44b',
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.2,
        ['interpolate', ['linear'], ['zoom'], 15, 0.055, 19, 0.11],
      ],
    },
  })
  map.addLayer({
    id: 'parcel-line',
    type: 'line',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    minzoom: 15,
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#c16d19',
        '#dc8e34',
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        2.2,
        ['interpolate', ['linear'], ['zoom'], 15, 0.8, 19, 1.45],
      ],
      'line-opacity': 0.86,
    },
  })
  map.addLayer({
    id: 'parcel-label',
    type: 'symbol',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    minzoom: 17,
    layout: {
      'text-field': [
        'format',
        ['get', 'parcel_number'],
        { 'font-scale': 1 },
        '\n',
        {},
        [
          'case',
          ['has', 'area'],
          [
            'concat',
            ['number-format', ['get', 'area'], { 'max-fraction-digits': 0 }],
            ' m²',
          ],
          '',
        ],
        { 'font-scale': 0.82 },
      ],
      'text-size': 10,
      'text-font': ['Open Sans Bold'],
      'text-line-height': 1.05,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#8b551f',
      'text-halo-color': 'rgba(255,255,255,0.92)',
      'text-halo-width': 1.7,
    },
  })

  // At z16 the same property source adds true building footprints.
  map.addLayer({
    id: 'property-footprint-fill',
    type: 'fill',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: 16,
    filter: ['==', ['get', 'feature_type'], 'footprint'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#4238c6',
        '#655ce1',
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.48,
        0.22,
      ],
    },
  })
  map.addLayer({
    id: 'property-footprint-line',
    type: 'line',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: 16,
    filter: ['==', ['get', 'feature_type'], 'footprint'],
    paint: {
      'line-color': '#4a42c5',
      'line-width': ['interpolate', ['linear'], ['zoom'], 16, 1, 20, 2],
      'line-opacity': 0.86,
    },
  })

  // Property clusters are calculated by PostGIS, not in the browser.
  map.addLayer({
    id: 'property-cluster-halo',
    type: 'circle',
    source: 'gurs-properties',
    'source-layer': 'properties',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    paint: {
      'circle-color': 'rgba(91,82,232,0.13)',
      'circle-radius': ['step', ['get', 'cluster_count'], 23, 25, 29, 100, 34],
      'circle-blur': 0.45,
    },
  })
  map.addLayer({
    id: 'property-cluster',
    type: 'circle',
    source: 'gurs-properties',
    'source-layer': 'properties',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    paint: {
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'cluster_count'],
        1,
        '#178d87',
        40,
        '#5b52e8',
        250,
        '#3f36ba',
      ],
      'circle-radius': ['step', ['get', 'cluster_count'], 17, 25, 21, 100, 25],
      'circle-stroke-color': 'rgba(255,255,255,0.95)',
      'circle-stroke-width': 2.5,
    },
  })
  map.addLayer({
    id: 'property-cluster-count',
    type: 'symbol',
    source: 'gurs-properties',
    'source-layer': 'properties',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    layout: {
      'text-field': [
        'format',
        ['number-format', ['get', 'cluster_count'], { locale: 'sl-SI' }],
        { 'font-scale': 1.04 },
        '\n',
        {},
        'stavb',
        { 'font-scale': 0.58 },
      ],
      'text-size': 12,
      'text-font': ['Open Sans Bold'],
      'text-line-height': 0.92,
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  map.addLayer({
    id: 'property-point-halo',
    type: 'circle',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    paint: {
      'circle-color': 'rgba(91,82,232,0.14)',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 9, 18, 15],
      'circle-blur': 0.45,
    },
  })
  map.addLayer({
    id: 'property-point',
    type: 'circle',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    paint: {
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#3f36ba',
        [
          'step',
          ['coalesce', ['get', 'construction_year'], 0],
          '#7f8896',
          1900,
          '#b77936',
          1970,
          '#6259dc',
          2010,
          '#0d8b80',
        ],
      ],
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        ['interpolate', ['linear'], ['zoom'], 12, 7, 18, 11],
        ['interpolate', ['linear'], ['zoom'], 12, 5, 18, 8],
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.2,
      'circle-opacity': 0.96,
    },
  })
  map.addLayer({
    id: 'property-address-label',
    type: 'symbol',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: 15,
    filter: [
      'all',
      ['==', ['get', 'feature_type'], 'pin'],
      ['has', 'full_address'],
    ],
    layout: {
      'text-field': ['get', 'full_address'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 18, 11.5],
      'text-font': ['Open Sans Bold'],
      'text-offset': [0, 1.45],
      'text-anchor': 'top',
      'text-max-width': 16,
      'text-optional': true,
      'text-padding': 5,
    },
    paint: {
      'text-color': '#2f3152',
      'text-halo-color': 'rgba(255,255,255,0.94)',
      'text-halo-width': 1.8,
    },
  })

  // Sales use a warm contrasting palette and server-side clusters.
  map.addLayer({
    id: 'sale-cluster-halo',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    paint: {
      'circle-color': 'rgba(224,135,53,0.15)',
      'circle-radius': ['step', ['get', 'cluster_count'], 21, 20, 26, 100, 31],
      'circle-blur': 0.42,
    },
  })
  map.addLayer({
    id: 'sale-cluster',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    paint: {
      'circle-color': '#d77d2a',
      'circle-radius': ['step', ['get', 'cluster_count'], 15, 20, 19, 100, 23],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5,
    },
  })
  map.addLayer({
    id: 'sale-cluster-count',
    type: 'symbol',
    source: 'gurs-sales',
    'source-layer': 'sales',
    maxzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    layout: {
      'text-field': ['to-string', ['get', 'cluster_count']],
      'text-size': 11,
      'text-font': ['Open Sans Bold'],
    },
    paint: { 'text-color': '#ffffff' },
  })
  map.addLayer({
    id: 'sale-point-halo',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    minzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    paint: {
      'circle-color': 'rgba(224,135,53,0.18)',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 8, 18, 13],
      'circle-blur': 0.42,
    },
  })
  map.addLayer({
    id: 'sale-point',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    minzoom: 12,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    paint: {
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#b65d13',
        '#df8735',
      ],
      'circle-radius': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        ['interpolate', ['linear'], ['zoom'], 12, 6.5, 18, 9],
        ['interpolate', ['linear'], ['zoom'], 12, 4.5, 18, 7],
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.96,
    },
  })
  map.addLayer({
    id: 'sale-price-label',
    type: 'symbol',
    source: 'gurs-sales',
    'source-layer': 'sales',
    minzoom: 14,
    filter: [
      'all',
      ['==', ['get', 'feature_type'], 'pin'],
      ['has', 'total_price'],
    ],
    layout: {
      'text-field': [
        'concat',
        [
          'number-format',
          ['get', 'total_price'],
          { locale: 'sl-SI', 'max-fraction-digits': 0 },
        ],
        ' €',
      ],
      'text-size': 10.5,
      'text-font': ['Open Sans Bold'],
      'text-offset': [0, -1.35],
      'text-anchor': 'bottom',
      'text-padding': 8,
      'text-optional': true,
    },
    paint: {
      'text-color': '#8d4914',
      'text-halo-color': 'rgba(255,255,255,0.96)',
      'text-halo-width': 2.1,
    },
  })

  // Selection geometry is fetched only for the active record and sits on top.
  map.addLayer({
    id: 'parcel-selected-line',
    type: 'line',
    source: 'selected-parcel-shapes',
    filter: ['==', ['get', 'kind'], 'parcel'],
    paint: {
      'line-color': '#4138c4',
      'line-width': 4,
      'line-opacity': 0.96,
    },
  })
  map.addLayer({
    id: 'selected-building-fill',
    type: 'fill',
    source: 'selected-parcel-shapes',
    filter: ['==', ['get', 'kind'], 'building'],
    paint: {
      'fill-color': '#7773df',
      'fill-opacity': [
        'case',
        ['boolean', ['get', 'active'], false],
        0.56,
        0.2,
      ],
    },
  })
  map.addLayer({
    id: 'selected-building-line',
    type: 'line',
    source: 'selected-parcel-shapes',
    filter: ['==', ['get', 'kind'], 'building'],
    paint: {
      'line-color': '#3437b6',
      'line-width': 3,
      'line-opacity': [
        'case',
        ['boolean', ['get', 'active'], false],
        0.96,
        0.45,
      ],
    },
  })
  map.addLayer({
    id: 'measurement-line',
    type: 'line',
    source: 'measurement',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color': '#5b52e8',
      'line-width': 3,
      'line-dasharray': [1.5, 1.5],
    },
  })
  map.addLayer({
    id: 'measurement-points',
    type: 'circle',
    source: 'measurement',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': '#5b52e8',
      'circle-radius': 6,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })
}

/** Refreshes vector source URLs so supported filters execute in PostGIS. */
export function updatePropertyMapTiles(map: Map, filters: MapFilters) {
  const urls = propertyMapTileUrls(filters)
  for (const sourceId of Object.keys(urls) as PropertyMapSourceId[]) {
    ;(map.getSource(sourceId) as VectorTileSource | undefined)?.setTiles([
      urls[sourceId],
    ])
  }
}
