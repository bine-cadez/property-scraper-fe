import type {
  ExpressionSpecification,
  GeoJSONSourceSpecification,
  Map,
  SymbolLayerSpecification,
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
    const canvas = document.createElement('canvas')
    canvas.width = 176
    canvas.height = 152
    const context = canvas.getContext('2d')
    if (!context) continue

    context.scale(2, 2)
    context.shadowColor = 'rgb(31 35 106 / 24%)'
    context.shadowBlur = 2.5
    context.shadowOffsetY = 1.5
    context.beginPath()
    context.moveTo(44, 3)
    context.lineTo(82, 18)
    context.lineTo(76, 18)
    context.lineTo(76, 57)
    context.lineTo(53, 57)
    context.lineTo(44, 73)
    context.lineTo(35, 57)
    context.lineTo(12, 57)
    context.lineTo(12, 18)
    context.lineTo(6, 18)
    context.closePath()
    context.fillStyle = color.fill
    context.fill()
    context.shadowColor = 'transparent'
    context.lineWidth = 1
    context.strokeStyle = color.stroke
    context.stroke()
    map.addImage(
      `building-house-marker-${name}`,
      context.getImageData(0, 0, 176, 152),
      { pixelRatio: 2 },
    )

    const summaryCanvas = document.createElement('canvas')
    summaryCanvas.width = 264
    summaryCanvas.height = 164
    const summary = summaryCanvas.getContext('2d')
    if (!summary) continue
    summary.scale(2, 2)
    summary.shadowColor = 'rgb(31 35 106 / 28%)'
    summary.shadowBlur = 5
    summary.shadowOffsetY = 2
    summary.beginPath()
    summary.roundRect(6, 4, 120, 72, 6)
    summary.fillStyle = color.fill
    summary.fill()
    summary.shadowColor = 'transparent'
    summary.lineWidth = 1.5
    summary.strokeStyle = color.stroke
    summary.stroke()
    map.addImage(
      `building-summary-marker-${name}`,
      summary.getImageData(0, 0, 264, 164),
      { pixelRatio: 2 },
    )
  }
}

const clusterIsPurple: ExpressionSpecification = [
  'any',
  ['==', ['get', 'value_count'], 0],
  ['>=', ['/', ['get', 'value_sum'], ['get', 'value_count']], 500_000],
]

const buildingIsPurple: ExpressionSpecification = [
  'any',
  ['<=', ['coalesce', ['get', 'displayValue'], 0], 0],
  ['>=', ['get', 'displayValue'], 500_000],
]

/** Registers the Property Scraper API map sources and app styling. */
export function addPropertyMapLayers(
  map: Map,
  buildings: GeoJSONSourceSpecification['data'] = '/gurs/buildings',
) {
  map.addSource('gurs-buildings', {
    type: 'geojson',
    data: buildings,
    promoteId: 'id',
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 58,
    clusterProperties: {
      value_sum: ['+', ['coalesce', ['get', 'displayValue'], 0]],
      value_count: [
        '+',
        ['case', ['>', ['coalesce', ['get', 'displayValue'], 0], 0], 1, 0],
      ],
      area_sum: ['+', ['coalesce', ['get', 'displayAreaM2'], 0]],
      area_count: [
        '+',
        ['case', ['>', ['coalesce', ['get', 'displayAreaM2'], 0], 0], 1, 0],
      ],
    },
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
  map.addSource('selected-parcel-shapes', {
    type: 'geojson',
    data: emptyFeatureCollection,
    promoteId: 'id',
  })

  map.addLayer({
    id: 'parcel-selected-line',
    type: 'line',
    source: 'selected-parcel-shapes',
    filter: ['==', ['get', 'kind'], 'parcel'],
    paint: {
      'line-color': '#4f52d5',
      'line-width': 4,
      'line-opacity': 0.95,
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
        0.55,
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
        0.95,
        0.45,
      ],
    },
  })
  addBuildingMarkerImages(map)
  map.addLayer({
    id: 'house-clusters',
    type: 'symbol',
    source: 'gurs-buildings',
    filter: ['has', 'point_count'],
    layout: {
      'icon-image': [
        'case',
        clusterIsPurple,
        'building-summary-marker-purple',
        'building-summary-marker-teal',
      ],
      'icon-anchor': 'center',
      'icon-allow-overlap': false,
      'icon-padding': 8,
      'text-field': [
        'format',
        ['concat', ['get', 'point_count_abbreviated'], ' stavb'],
        {
          'font-scale': 0.72,
          'text-color': 'rgba(255, 255, 255, 0.72)',
        },
        '\n',
        {},
        [
          'case',
          ['>', ['get', 'area_sum'], 0],
          [
            'concat',
            [
              'number-format',
              ['get', 'area_sum'],
              { locale: 'sl-SI', 'max-fraction-digits': 0 },
            ],
            ' m²',
          ],
          '— m²',
        ],
        { 'font-scale': 1.08, 'text-color': '#ffffff' },
      ],
      'text-size': 17,
      'text-font': ['Noto Sans Regular'],
      'text-allow-overlap': false,
      'text-anchor': 'center',
      'text-offset': [0, -0.08],
      'text-line-height': 1.2,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': [
        'case',
        clusterIsPurple,
        '#4547c2',
        '#087084',
      ],
      'text-halo-width': 0.25,
    },
  })
  map.addLayer({
    id: 'building-markers',
    type: 'symbol',
    source: 'gurs-buildings',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': [
        'case',
        buildingIsPurple,
        'building-house-marker-purple',
        'building-house-marker-teal',
      ],
      'icon-anchor': 'bottom',
      'icon-size': 1,
      'icon-allow-overlap': false,
      'text-field': [
        'format',
        [
          'case',
          ['>', ['coalesce', ['get', 'displayAreaM2'], 0], 0],
          [
            'concat',
            [
              'number-format',
              ['get', 'displayAreaM2'],
              { locale: 'sl-SI', 'max-fraction-digits': 0 },
            ],
            ' m²',
          ],
          '— m²',
        ],
        {
          'font-scale': 0.7,
          'text-color': 'rgba(255, 255, 255, 0.66)',
        },
        '\n',
        {},
        [
          'case',
          ['>', ['coalesce', ['get', 'displayValue'], 0], 0],
          ['get', 'displayValueLabel'],
          '0 €',
        ],
        { 'font-scale': 1.04, 'text-color': 'rgba(255, 255, 255, 0.96)' },
      ],
      'text-anchor': 'center',
      'text-offset': [0, -3.05],
      'text-size': 14,
      'text-line-height': 1.15,
      'text-font': ['Noto Sans Regular'],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': [
        'case',
        buildingIsPurple,
        '#4547c2',
        '#087084',
      ],
      'text-halo-width': 0,
    },
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
