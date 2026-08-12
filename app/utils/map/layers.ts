//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import type { MapFilters } from '#shared/types/property'
import type {
  ExpressionSpecification,
  Map,
  VectorTileSource,
} from 'maplibre-gl'

const emptyFeatureCollection = {
  type: 'FeatureCollection' as const,
  features: [],
}

function addBuildingMarkerImages(map: Map) {
  const colors = {
    purple: { fill: '#5758d9', stroke: '#4547c2' },
    teal: { fill: '#0b879d', stroke: '#087084' },
  }

  for (const [name, color] of Object.entries(colors)) {
    const houseCanvas = document.createElement('canvas')
    houseCanvas.width = 176
    houseCanvas.height = 152
    const house = houseCanvas.getContext('2d')
    if (!house) continue

    house.scale(2, 2)
    house.shadowColor = 'rgb(31 35 106 / 24%)'
    house.shadowBlur = 2.5
    house.shadowOffsetY = 1.5
    house.beginPath()
    house.moveTo(44, 3)
    house.lineTo(82, 18)
    house.lineTo(76, 18)
    house.lineTo(76, 57)
    house.lineTo(53, 57)
    house.lineTo(44, 73)
    house.lineTo(35, 57)
    house.lineTo(12, 57)
    house.lineTo(12, 18)
    house.lineTo(6, 18)
    house.closePath()
    house.fillStyle = color.fill
    house.fill()
    house.shadowColor = 'transparent'
    house.lineWidth = 1
    house.strokeStyle = color.stroke
    house.stroke()
    map.addImage(
      `building-house-marker-${name}`,
      house.getImageData(0, 0, 176, 152),
      { pixelRatio: 2 },
    )

    const summaryCanvas = document.createElement('canvas')
    summaryCanvas.width = 240
    summaryCanvas.height = 120
    const summary = summaryCanvas.getContext('2d')
    if (!summary) continue
    summary.scale(2, 2)
    summary.shadowColor = 'rgb(31 35 106 / 28%)'
    summary.shadowBlur = 3
    summary.shadowOffsetY = 1.5
    summary.beginPath()
    summary.roundRect(4, 4, 112, 50, 5)
    summary.fillStyle = color.fill
    summary.fill()
    summary.shadowColor = 'transparent'
    summary.lineWidth = 1.5
    summary.strokeStyle = color.stroke
    summary.stroke()
    map.addImage(
      `building-summary-marker-${name}`,
      summary.getImageData(0, 0, 240, 120),
      { pixelRatio: 2 },
    )
  }
}

type PropertyMapLayer = 'properties' | 'sales' | 'parcels' | 'cadastral'
// The tiny offset keeps summary cards visible at exactly z15.5.
const HOUSE_MARKER_MIN_ZOOM = 15.51

const buildingValue: ExpressionSpecification = [
  'coalesce',
  ['get', 'combined_value'],
  ['get', 'combinedValue'],
  ['get', 'total_value'],
  ['get', 'totalValue'],
  ['get', 'official_value'],
  ['get', 'officialValue'],
  ['get', 'estimated_market_value'],
  ['get', 'market_value'],
  ['get', 'value'],
]

const buildingValueLabel: ExpressionSpecification = [
  'case',
  ['==', buildingValue, null],
  '—',
  ['>=', ['to-number', buildingValue, 0], 1_000_000_000],
  [
    'concat',
    [
      'number-format',
      ['/', ['to-number', buildingValue, 0], 1_000_000_000],
      { locale: 'sl-SI', 'max-fraction-digits': 1 },
    ],
    ' mrd €',
  ],
  ['>=', ['to-number', buildingValue, 0], 1_000_000],
  [
    'concat',
    [
      'number-format',
      ['/', ['to-number', buildingValue, 0], 1_000_000],
      { locale: 'sl-SI', 'max-fraction-digits': 1 },
    ],
    ' mio €',
  ],
  ['>=', ['to-number', buildingValue, 0], 1_000],
  [
    'concat',
    [
      'number-format',
      ['/', ['to-number', buildingValue, 0], 1_000],
      { locale: 'sl-SI', 'max-fraction-digits': 0 },
    ],
    ' tis €',
  ],
  [
    'concat',
    [
      'number-format',
      ['to-number', buildingValue, 0],
      { locale: 'sl-SI', 'max-fraction-digits': 0 },
    ],
    ' €',
  ],
]

const buildingAddress: ExpressionSpecification = [
  'to-string',
  [
    'coalesce',
    ['get', 'full_address'],
    ['get', 'address'],
    ['get', 'label'],
    '',
  ],
]

const buildingAddressFirstSpace: ExpressionSpecification = [
  'index-of',
  ' ',
  buildingAddress,
]

const buildingAddressAfterFirstWord: ExpressionSpecification = [
  'slice',
  buildingAddress,
  ['+', buildingAddressFirstSpace, 1],
]

const buildingAddressSecondSpace: ExpressionSpecification = [
  'index-of',
  ' ',
  buildingAddressAfterFirstWord,
]

const buildingAddressFirstTwoWords: ExpressionSpecification = [
  'case',
  [
    'all',
    ['>', buildingAddressFirstSpace, 0],
    ['>', buildingAddressSecondSpace, 0],
  ],
  [
    'slice',
    buildingAddress,
    0,
    ['+', buildingAddressFirstSpace, buildingAddressSecondSpace, 1],
  ],
  buildingAddress,
]

const buildingAddressComma: ExpressionSpecification = [
  'index-of',
  ',',
  buildingAddress,
]

// Slovenian addresses end with `, 1234 Locality`; remove that prefix at low zoom.
const buildingAddressLocality: ExpressionSpecification = [
  'case',
  ['>=', buildingAddressComma, 0],
  ['slice', buildingAddress, ['+', buildingAddressComma, 7]],
  ['!=', buildingAddress, ''],
  buildingAddressFirstTwoWords,
  ['==', ['get', 'feature_type'], 'cluster'],
  ['concat', ['to-string', ['get', 'cluster_count']], ' stavb'],
  '',
]

const buildingAddressFirstWord: ExpressionSpecification = [
  'case',
  ['>', buildingAddressFirstSpace, 0],
  ['slice', buildingAddress, 0, buildingAddressFirstSpace],
  buildingAddress,
]

const buildingArea: ExpressionSpecification = [
  'coalesce',
  ['get', 'usable_area_m2'],
  ['get', 'usableAreaM2'],
  ['get', 'gross_floor_area'],
  ['get', 'grossFloorArea'],
  ['get', 'gross_area_m2'],
  ['get', 'grossAreaM2'],
  ['get', 'area_m2'],
  ['get', 'areaM2'],
  ['get', 'area'],
  ['get', 'footprint_area_m2'],
  ['get', 'footprintAreaM2'],
  ['get', 'footprint_area'],
  ['get', 'footprintArea'],
]

const buildingAreaLabel: ExpressionSpecification = [
  'concat',
  [
    'number-format',
    ['to-number', buildingArea, 0],
    { locale: 'en-US', 'max-fraction-digits': 1 },
  ],
  'm²',
]

const houseMarkerTitle: ExpressionSpecification = [
  'case',
  ['!=', buildingAddressFirstWord, ''],
  [
    'upcase',
    [
      'case',
      ['>', ['length', buildingAddressFirstWord], 10],
      ['concat', ['slice', buildingAddressFirstWord, 0, 9], '…'],
      buildingAddressFirstWord,
    ],
  ],
  ['>', ['to-number', buildingArea, 0], 0],
  buildingAreaLabel,
  '',
]

const houseMarkerText: ExpressionSpecification = [
  'format',
  houseMarkerTitle,
  { 'font-scale': 0.68, 'text-color': 'rgba(255,255,255,0.62)' },
  '\n',
  {},
  ['case', ['==', buildingValue, null], '—', buildingValueLabel],
  { 'font-scale': 0.9, 'text-color': '#ffffff' },
]

const buildingCity: ExpressionSpecification = [
  'coalesce',
  ['get', 'city_name'],
  ['get', 'cityName'],
  ['get', 'city'],
  ['get', 'municipality_name'],
  ['get', 'municipalityName'],
  ['get', 'municipality'],
  ['get', 'settlement'],
  ['get', 'region'],
  buildingAddressLocality,
]

const buildingLocalArea: ExpressionSpecification = [
  'coalesce',
  ['get', 'neighborhood'],
  ['get', 'neighbourhood'],
  ['get', 'district'],
  ['get', 'quarter'],
  ['get', 'subregion'],
  ['get', 'region'],
  ['get', 'settlement'],
  ['get', 'summary_address'],
  buildingAddressFirstTwoWords,
  buildingCity,
]

function buildingSummary(title: ExpressionSpecification) {
  return [
    'format',
    title,
    { 'font-scale': 0.82, 'text-color': 'rgba(255,255,255,0.78)' },
    '\n',
    {},
    buildingValueLabel,
    { 'font-scale': 1.05, 'text-color': '#ffffff' },
  ] satisfies ExpressionSpecification
}

// MapLibre only permits `zoom` as the input of a top-level step/interpolate.
const buildingSummaryText: ExpressionSpecification = [
  'step',
  ['zoom'],
  buildingSummary(buildingCity),
  13.5,
  buildingSummary(buildingLocalArea),
]

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
  map.addSource('property-summaries', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
  })
  addBuildingMarkerImages(map)

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
      // Keep the polygon as a hit target without tinting the map beneath it.
      'fill-opacity': 0,
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

  // Keep property groups as summary cards until individual house markers take over.
  map.addLayer({
    id: 'property-cluster',
    type: 'symbol',
    source: 'gurs-properties',
    'source-layer': 'properties',
    maxzoom: HOUSE_MARKER_MIN_ZOOM,
    filter: ['==', ['get', 'feature_type'], 'cluster'],
    layout: {
      'icon-image': [
        'step',
        ['get', 'cluster_count'],
        'building-summary-marker-teal',
        40,
        'building-summary-marker-purple',
      ],
      'icon-anchor': 'center',
      'icon-allow-overlap': false,
      'icon-padding': 6,
      'text-field': buildingSummaryText,
      'text-size': 14,
      'text-font': ['Open Sans Bold'],
      'text-line-height': 1.12,
      'text-anchor': 'center',
      'text-offset': [0, -0.05],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(52,55,182,0.7)',
      'text-halo-width': 0.25,
    },
  })

  map.addLayer({
    id: 'property-summary',
    type: 'symbol',
    source: 'property-summaries',
    minzoom: 12,
    maxzoom: HOUSE_MARKER_MIN_ZOOM,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    layout: {
      'icon-image': [
        'case',
        ['>=', ['coalesce', ['get', 'construction_year'], 0], 2010],
        'building-summary-marker-teal',
        'building-summary-marker-purple',
      ],
      'icon-anchor': 'center',
      'icon-allow-overlap': false,
      'icon-padding': 6,
      'text-field': buildingSummaryText,
      'text-size': 14,
      'text-font': ['Open Sans Bold'],
      'text-line-height': 1.12,
      'text-anchor': 'center',
      'text-offset': [0, -0.05],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(52,55,182,0.7)',
      'text-halo-width': 0.25,
    },
  })

  map.addLayer({
    id: 'property-point-halo',
    type: 'circle',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: HOUSE_MARKER_MIN_ZOOM,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    paint: {
      'circle-color': 'rgba(91,82,232,0.14)',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        HOUSE_MARKER_MIN_ZOOM,
        12,
        18,
        15,
      ],
      'circle-blur': 0.45,
    },
  })
  map.addLayer({
    id: 'property-point',
    type: 'symbol',
    source: 'gurs-properties',
    'source-layer': 'properties',
    minzoom: HOUSE_MARKER_MIN_ZOOM,
    filter: ['==', ['get', 'feature_type'], 'pin'],
    layout: {
      'icon-image': [
        'case',
        ['>=', ['coalesce', ['get', 'construction_year'], 0], 2010],
        'building-house-marker-teal',
        'building-house-marker-purple',
      ],
      'icon-anchor': 'bottom',
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        HOUSE_MARKER_MIN_ZOOM,
        0.78,
        18,
        1,
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-padding': 4,
      'text-field': houseMarkerText,
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        HOUSE_MARKER_MIN_ZOOM,
        10.5,
        18,
        12,
      ],
      'text-font': ['Open Sans Bold'],
      'text-line-height': 1.02,
      'text-anchor': 'center',
      'text-offset': [0, -3.25],
      'text-optional': true,
    },
    paint: {
      'icon-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        1,
        0.96,
      ],
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(52,55,182,0.72)',
      'text-halo-width': 0.5,
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
        0.68,
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
      'line-width': ['case', ['boolean', ['get', 'active'], false], 3, 1.5],
      'line-opacity': [
        'case',
        ['boolean', ['get', 'active'], false],
        0.96,
        0.45,
      ],
    },
  })

  // Keep house tags above selected parcel/building geometry. These symbol
  // layers are registered earlier because they use the streamed MVT source.
  for (const layerId of [
    'property-point-halo',
    'property-cluster',
    'property-summary',
    'property-point',
  ]) {
    if (map.getLayer(layerId)) map.moveLayer(layerId)
  }

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
