import type { Map, SymbolLayerSpecification } from 'maplibre-gl'

const emptyFeatureCollection = {
  type: 'FeatureCollection' as const,
  features: [],
}

/** Registers the Property Scraper API vector-tile sources and app styling. */
export function addPropertyMapLayers(map: Map) {
  map.addSource('gurs-parcels', {
    type: 'vector',
    tiles: ['/api/map/tiles/parcels/{z}/{x}/{y}.mvt'],
    minzoom: 0,
    maxzoom: 22,
    promoteId: 'id',
  })
  map.addSource('gurs-properties', {
    type: 'vector',
    tiles: ['/api/map/tiles/properties/{z}/{x}/{y}.mvt'],
    minzoom: 0,
    maxzoom: 22,
    promoteId: 'id',
  })
  map.addSource('gurs-sales', {
    type: 'vector',
    tiles: ['/api/map/tiles/sales/{z}/{x}/{y}.mvt'],
    minzoom: 0,
    maxzoom: 22,
    promoteId: 'id',
  })
  map.addSource('measurement', {
    type: 'geojson',
    data: emptyFeatureCollection,
  })

  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#43a796',
        '#f4d6a8',
      ],
      'fill-opacity': 0.18,
    },
  })
  map.addLayer({
    id: 'parcels-line',
    type: 'line',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    paint: {
      'line-color': '#ba772b',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.7, 17, 1.5],
      'line-opacity': 0.78,
    },
  })
  map.addLayer({
    id: 'parcel-official-fill',
    type: 'fill',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    layout: { visibility: 'none' },
    paint: { 'fill-color': '#2865a8', 'fill-opacity': 0.32 },
  })
  map.addLayer({
    id: 'buildings-fill',
    type: 'fill',
    source: 'gurs-properties',
    'source-layer': 'properties',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#087f70',
        '#8ba8a0',
      ],
      'fill-opacity': 0.46,
    },
  })
  map.addLayer({
    id: 'buildings-line',
    type: 'line',
    source: 'gurs-properties',
    'source-layer': 'properties',
    paint: { 'line-color': '#315f56', 'line-width': 1.1 },
  })
  map.addLayer({
    id: 'parcel-selected',
    type: 'line',
    source: 'gurs-parcels',
    'source-layer': 'parcels',
    filter: ['==', ['get', 'id'], '__none__'],
    paint: { 'line-color': '#d87918', 'line-width': 4 },
  })
  map.addLayer({
    id: 'building-selected',
    type: 'line',
    source: 'gurs-properties',
    'source-layer': 'properties',
    filter: ['==', ['get', 'id'], '__none__'],
    paint: { 'line-color': '#f0a44b', 'line-width': 4 },
  })
  map.addLayer({
    id: 'point-clusters',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    filter: ['any', ['has', 'point_count'], ['==', ['get', 'cluster'], true]],
    paint: {
      'circle-color': '#34364a',
      'circle-radius': [
        'step',
        ['coalesce', ['get', 'point_count'], 1],
        19,
        10,
        23,
        30,
        27,
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'gurs-sales',
    'source-layer': 'sales',
    filter: ['any', ['has', 'point_count'], ['==', ['get', 'cluster'], true]],
    layout: {
      'text-field': [
        'to-string',
        ['coalesce', ['get', 'point_count'], ['get', 'count'], 1],
      ],
      'text-size': 11,
      'text-font': ['Open Sans Bold'],
    },
    paint: { 'text-color': '#ffffff' },
  })
  map.addLayer({
    id: 'transaction-points',
    type: 'circle',
    source: 'gurs-sales',
    'source-layer': 'sales',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['!=', ['get', 'cluster'], true],
    ],
    paint: {
      'circle-color': '#5b52e8',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 10],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.92,
    },
  })

  const labelLayout: SymbolLayerSpecification['layout'] = {
    'text-field': [
      'case',
      ['has', 'price_per_m2'],
      [
        'concat',
        [
          'number-format',
          ['get', 'price_per_m2'],
          { locale: 'sl-SI', 'max-fraction-digits': 0 },
        ],
        ' €/m²',
      ],
      ['has', 'pricePerM2'],
      [
        'concat',
        [
          'number-format',
          ['get', 'pricePerM2'],
          { locale: 'sl-SI', 'max-fraction-digits': 0 },
        ],
        ' €/m²',
      ],
      '',
    ],
    'text-size': 10,
    'text-font': ['Open Sans Bold'],
    'text-offset': [0, 1.5],
  }
  map.addLayer({
    id: 'transaction-labels',
    type: 'symbol',
    source: 'gurs-sales',
    'source-layer': 'sales',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['!=', ['get', 'cluster'], true],
    ],
    layout: labelLayout,
    paint: {
      'text-color': '#34364a',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
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
