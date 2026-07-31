import type { Map, SymbolLayerSpecification } from 'maplibre-gl'

const emptyFeatureCollection = {
  type: 'FeatureCollection' as const,
  features: [],
}

/**
 * Registers the application-owned sources and presentation layers.
 * Keeping this declarative setup outside the Vue component makes MapLibre
 * lifecycle code easier to audit and keeps visual layer changes isolated.
 */
export function addPropertyMapLayers(map: Map) {
  map.addSource('parcels', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
  })
  map.addSource('buildings', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
  })
  map.addSource('market-points', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 48,
  })
  map.addSource('measurement', {
    type: 'geojson',
    data: emptyFeatureCollection,
  })

  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#43a796',
        '#f4d6a8',
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.28,
        0.16,
      ],
    },
  })
  map.addLayer({
    id: 'parcels-line',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': '#ba772b',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.7, 17, 1.5],
      'line-opacity': 0.78,
    },
  })
  map.addLayer({
    id: 'parcel-official-fill',
    type: 'fill',
    source: 'parcels',
    filter: ['has', 'officialValue'],
    layout: { visibility: 'none' },
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'officialValue'],
        400000,
        '#d8e8f6',
        550000,
        '#2865a8',
      ],
      'fill-opacity': 0.44,
    },
  })
  map.addLayer({
    id: 'buildings-fill',
    type: 'fill',
    source: 'buildings',
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#087f70',
        '#8ba8a0',
      ],
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.58,
        0.44,
      ],
    },
  })
  map.addLayer({
    id: 'buildings-line',
    type: 'line',
    source: 'buildings',
    paint: {
      'line-color': '#315f56',
      'line-width': 1.1,
    },
  })
  map.addLayer({
    id: 'parcel-selected',
    type: 'line',
    source: 'parcels',
    filter: ['==', ['get', 'id'], '__none__'],
    paint: {
      'line-color': '#d87918',
      'line-width': 4,
      'line-opacity': 1,
    },
  })
  map.addLayer({
    id: 'building-selected',
    type: 'line',
    source: 'buildings',
    filter: ['==', ['get', 'id'], '__none__'],
    paint: {
      'line-color': '#f0a44b',
      'line-width': 4,
    },
  })
  map.addLayer({
    id: 'point-clusters',
    type: 'circle',
    source: 'market-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#34364a',
      'circle-radius': ['step', ['get', 'point_count'], 19, 10, 23, 30, 27],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
      'circle-opacity': 0.94,
    },
  })
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'market-points',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 11,
      'text-font': ['Open Sans Bold'],
    },
    paint: { 'text-color': '#ffffff' },
  })
  map.addLayer({
    id: 'transaction-points',
    type: 'circle',
    source: 'market-points',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'kind'], 'transaction'],
    ],
    paint: {
      'circle-color': '#5b52e8',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 18, 16, 27],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
      'circle-opacity': 0.92,
    },
  })
  map.addLayer({
    id: 'listing-points',
    type: 'circle',
    source: 'market-points',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'kind'], 'listing'],
    ],
    paint: {
      'circle-color': '#0e9fba',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 18, 16, 27],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
      'circle-opacity': 0.92,
    },
  })

  const labelLayout: SymbolLayerSpecification['layout'] = {
    'text-field': [
      'concat',
      '€',
      [
        'number-format',
        ['/', ['get', 'pricePerM2'], 1000],
        {
          locale: 'sl-SI',
          'min-fraction-digits': 1,
          'max-fraction-digits': 1,
        },
      ],
      'k',
    ],
    'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 12],
    'text-font': ['Open Sans Bold'],
    'text-anchor': 'center',
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  }
  const labelPaint: SymbolLayerSpecification['paint'] = {
    'text-color': '#ffffff',
    'text-halo-color': 'rgba(35, 31, 111, 0.25)',
    'text-halo-width': 1,
  }

  map.addLayer({
    id: 'transaction-labels',
    type: 'symbol',
    source: 'market-points',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'kind'], 'transaction'],
    ],
    layout: labelLayout,
    paint: labelPaint,
  })
  map.addLayer({
    id: 'listing-labels',
    type: 'symbol',
    source: 'market-points',
    filter: [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'kind'], 'listing'],
    ],
    layout: labelLayout,
    paint: labelPaint,
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
