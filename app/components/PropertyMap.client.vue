<script setup lang="ts">
import type {
  GeoJSONFeature,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  Marker as MapLibreMarker,
} from 'maplibre-gl'
import type {
  MapFilters,
  MapLayerId,
  MapResultItem,
  ListingPriceUnit,
  Position,
} from '#shared/types/property'
import {
  addPropertyMapLayers,
  updatePropertyMapTiles,
} from '~/utils/map/layers'
import {
  buildingResultFromFeature,
  visibleBuildingResults,
} from '~/utils/map/building-results'
import { buildingClusterCollection } from '~/utils/map/building-clusters'
import { formatMeasuredDistance } from '~/utils/map/measurement'
import { HOUSE_LEVEL_ZOOM, HOUSE_MARKER_MIN_ZOOM } from '#shared/utils/map-zoom'

const props = defineProps<{
  center: Position
  zoom: number
  layers: MapLayerId[]
  filters: MapFilters
  selectedId: string | undefined
  measureMode: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  move: [state: { center: Position; zoom: number }]
  loading: [value: boolean]
  resultsLoading: [value: boolean]
  error: [message: string]
  dataError: [message: string]
  count: [value: number]
  results: [value: MapResultItem[]]
  measure: [value: string | undefined]
}>()

const config = useRuntimeConfig()
type ShapeFeature = {
  type: 'Feature'
  id?: string | number
  geometry: GeoJSONFeature['geometry']
  properties: Record<string, unknown>
}
const mapContainer = ref<HTMLDivElement>()
let map: MapLibreMap | undefined
let hovered:
  { source: string; sourceLayer?: string; id: string | number } | undefined
let syncingFromProps = false
let measurePoints: Position[] = []
let selectedParcelFeatures: ShapeFeature[] = []
let parcelBuildingFeatures: ShapeFeature[] = []
let activeBuildingId = ''
let detailController: AbortController | undefined
let propertySummarySignature = ''
let propertyClusterSignature = ''
let createMapMarker: ((element: HTMLElement) => MapLibreMarker) | undefined
type HouseMarkerRecord = {
  marker: MapLibreMarker
  element: HTMLDivElement
  feature: GeoJSONFeature
  signature: string
}
const houseMarkers = new Map<string, HouseMarkerRecord>()

const localStyle = {
  version: 8 as const,
  name: 'Prostor neutral',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#e8eeeb' },
    },
  ],
}

const visibilityByLayer: Record<MapLayerId, string[]> = {
  parcels: [
    'cadastral-fill',
    'cadastral-line',
    'cadastral-label',
    'parcel-fill',
    'parcel-line',
    'parcel-label',
  ],
  buildings: [
    'property-cluster-loader',
    'property-cluster-halo',
    'property-cluster',
    'property-cluster-count',
    'property-summary',
    'property-point',
  ],
  transactions: [
    'sale-cluster-halo',
    'sale-cluster',
    'sale-cluster-count',
    'sale-point-halo',
    'sale-point',
  ],
  listings: [
    'listing-sales-cluster-halo',
    'listing-sales-cluster',
    'listing-sales-cluster-count',
    'listing-sales-summary',
    'listing-sales-point',
    'listing-rentals-cluster-halo',
    'listing-rentals-cluster',
    'listing-rentals-cluster-count',
    'listing-rentals-summary',
    'listing-rentals-point',
  ],
  priceM2: ['sale-price-label'],
  officialValue: [],
}

function updateMeasurement() {
  if (!map?.isStyleLoaded()) return
  const features = [
    ...measurePoints.map((coordinates, index) => ({
      type: 'Feature' as const,
      properties: { index },
      geometry: { type: 'Point' as const, coordinates },
    })),
    ...(measurePoints.length >= 2
      ? [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: measurePoints,
            },
          },
        ]
      : []),
  ]
  ;(map.getSource('measurement') as GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features,
  })
  emit('measure', formatMeasuredDistance(measurePoints))
}

function flattenBasemap() {
  if (!map?.isStyleLoaded()) return
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'fill-extrusion') {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    }
  }
}

function syncLayerVisibility() {
  if (!map) return
  const configured = new Set(props.layers)
  for (const [logicalLayer, mapLayers] of Object.entries(visibilityByLayer)) {
    for (const layerId of mapLayers) {
      if (!map.getLayer(layerId)) continue
      const visible =
        configured.has(logicalLayer as MapLayerId) &&
        (layerId !== 'sale-price-label' || configured.has('transactions'))
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
    }
  }
  syncHouseMarkers()
}

function removeHouseMarkers() {
  for (const record of houseMarkers.values()) record.marker.remove()
  houseMarkers.clear()
}

function compactBuildingValue(value: number | undefined) {
  if (value === undefined) return '—'
  const format = (amount: number, maximumFractionDigits: number) =>
    new Intl.NumberFormat('sl-SI', { maximumFractionDigits }).format(amount)
  if (value >= 1_000_000_000) return `${format(value / 1_000_000_000, 1)} mrd €`
  if (value >= 1_000_000) return `${format(value / 1_000_000, 1)} mio €`
  if (value >= 1_000) return `${format(value / 1_000, 1)} tis €`
  return `${format(value, 0)} €`
}

function houseMarkerTitle(item: MapResultItem) {
  const addressTitle = item.address.split(/\s+/)[0]?.trim()
  if (addressTitle && addressTitle !== `Stavba`) {
    return addressTitle.length > 10
      ? `${addressTitle.slice(0, 9).toLocaleUpperCase('sl-SI')}…`
      : addressTitle.toLocaleUpperCase('sl-SI')
  }
  if (item.areaM2 !== undefined) {
    return `${new Intl.NumberFormat('sl-SI', {
      maximumFractionDigits: 1,
    }).format(item.areaM2)} m²`
  }
  return 'STAVBA'
}

function houseMarkerSignature(item: MapResultItem) {
  return [
    item.address,
    item.areaM2,
    item.officialValue,
    item.constructionYear,
  ].join('|')
}

function updateHouseMarkerElement(
  element: HTMLDivElement,
  item: MapResultItem,
) {
  const card = element.firstElementChild as HTMLDivElement | null
  if (!card) return
  const title = houseMarkerTitle(item)
  const value = compactBuildingValue(item.officialValue)
  card.classList.toggle(
    'property-map__house-marker--sage',
    (item.constructionYear ?? 0) >= 2010,
  )
  element.setAttribute('aria-label', `${item.address}, ${value}`)
  const titleElement = card.querySelector<HTMLElement>(
    '.property-map__house-marker-title',
  )
  const valueElement = card.querySelector<HTMLElement>(
    '.property-map__house-marker-value',
  )
  if (titleElement) titleElement.textContent = title
  if (valueElement) valueElement.textContent = value
}

function createHouseMarkerElement(item: MapResultItem) {
  const element = document.createElement('div')
  element.className = 'property-map__house-marker-anchor'

  const card = document.createElement('div')
  card.className = 'property-map__house-marker'
  const title = document.createElement('span')
  title.className = 'property-map__house-marker-title'
  const value = document.createElement('strong')
  value.className = 'property-map__house-marker-value'
  card.appendChild(title)
  card.appendChild(value)
  element.appendChild(card)
  updateHouseMarkerElement(element, item)
  return element
}

function syncHouseMarkers() {
  if (!map?.isStyleLoaded() || !createMapMarker) return
  if (
    !props.layers.includes('buildings') ||
    map.getZoom() < HOUSE_MARKER_MIN_ZOOM
  ) {
    removeHouseMarkers()
    return
  }

  const bounds = map.getBounds()
  const visibleIds = new Set<string>()
  const markerScale = Math.min(
    1,
    0.78 +
      ((map.getZoom() - HOUSE_MARKER_MIN_ZOOM) / (18 - HOUSE_MARKER_MIN_ZOOM)) *
        0.22,
  )
  for (const feature of map.querySourceFeatures('gurs-properties', {
    sourceLayer: 'properties',
    filter: ['==', ['get', 'feature_type'], 'pin'],
  })) {
    if (feature.geometry.type !== 'Point') continue
    const coordinates = feature.geometry.coordinates as Position
    const [lng, lat] = coordinates
    const longitudeVisible =
      bounds.getWest() <= bounds.getEast()
        ? lng >= bounds.getWest() && lng <= bounds.getEast()
        : lng >= bounds.getWest() || lng <= bounds.getEast()
    if (
      !longitudeVisible ||
      lat < bounds.getSouth() ||
      lat > bounds.getNorth()
    ) {
      continue
    }

    const item = buildingResultFromFeature(feature)
    if (!item || visibleIds.has(item.id)) continue
    visibleIds.add(item.id)
    const signature = houseMarkerSignature(item)
    let record = houseMarkers.get(item.id)
    if (!record) {
      const element = createHouseMarkerElement(item)
      const marker = createMapMarker(element).setLngLat(coordinates).addTo(map)
      updateHouseMarkerElement(element, item)
      record = { marker, element, feature, signature }
      houseMarkers.set(item.id, record)
      element.addEventListener('click', (event) => {
        event.stopPropagation()
        const current = houseMarkers.get(item.id)
        if (!props.measureMode && current) {
          void selectBuildingFeature(current.feature)
        }
      })
    } else {
      record.feature = feature
      record.marker.setLngLat(coordinates)
      if (record.signature !== signature) {
        updateHouseMarkerElement(record.element, item)
        record.signature = signature
      }
    }
    record.element.style.setProperty(
      '--house-marker-scale',
      String(markerScale),
    )
    record.element.style.zIndex = String(Math.round(map.project(coordinates).y))
  }

  for (const [id, record] of houseMarkers) {
    if (visibleIds.has(id)) continue
    record.marker.remove()
    houseMarkers.delete(id)
  }
}

function updateFeatureCount() {
  if (!map?.isStyleLoaded()) return
  if (
    props.layers.includes('buildings') &&
    map.getZoom() >= HOUSE_MARKER_MIN_ZOOM
  ) {
    emit('count', houseMarkers.size)
    return
  }
  const countLayers = (layers: string[]) => {
    const renderedLayers = layers.filter((layerId) => map!.getLayer(layerId))
    if (!renderedLayers.length) return 0
    const seen = new Set<string>()
    return map!
      .queryRenderedFeatures(undefined, { layers: renderedLayers })
      .reduce((total, feature, index) => {
        const id = String(feature.properties?.id ?? feature.id ?? index)
        const key = `${feature.source}:${id}`
        if (seen.has(key)) return total
        seen.add(key)
        return (
          total +
          Number(
            feature.properties?.building_count ??
              feature.properties?.cluster_count ??
              1,
          )
        )
      }, 0)
  }
  if (props.layers.includes('listings')) {
    emit(
      'count',
      countLayers([
        'listing-sales-cluster',
        'listing-sales-summary',
        'listing-sales-point',
        'listing-rentals-cluster',
        'listing-rentals-summary',
        'listing-rentals-point',
      ]),
    )
    return
  }
  emit(
    'count',
    countLayers(['property-cluster', 'property-summary', 'property-point']),
  )
}

/**
 * Mirrors the individual building markers that MapLibre has chosen to render.
 * Cluster cards are intentionally excluded: the sidebar should contain one row
 * for every selectable building currently visible in the map viewport.
 */
function updateVisibleResults() {
  if (!map?.isStyleLoaded()) {
    emit('results', [])
    return
  }

  if (
    props.layers.includes('buildings') &&
    map.getZoom() >= HOUSE_MARKER_MIN_ZOOM
  ) {
    emit(
      'results',
      visibleBuildingResults(
        [...houseMarkers.values()].map((record) => record.feature),
      ),
    )
    return
  }

  if (props.layers.includes('listings')) {
    const listingLayers = [
      'listing-sales-summary',
      'listing-sales-point',
      'listing-rentals-summary',
      'listing-rentals-point',
    ].filter((layerId) => map?.getLayer(layerId))
    const seen = new Set<string>()
    const labels: Record<string, string> = {
      apartment: 'Stanovanje',
      house: 'Hiša',
      land: 'Zemljišče',
      commercial: 'Poslovni prostor',
      garage: 'Garaža',
      other: 'Nepremičnina',
    }
    const results: MapResultItem[] = map
      .queryRenderedFeatures(undefined, { layers: listingLayers })
      .flatMap((feature) => {
        const id = String(feature.properties?.id ?? feature.id ?? '')
        if (!id || seen.has(id)) return []
        seen.add(id)
        const propertyType = String(
          feature.properties?.property_type ?? 'other',
        )
        const askingPrice = Number(feature.properties?.asking_price)
        return [
          {
            id,
            kind: 'listing' as const,
            selectionId: `listing:${id}`,
            address: labels[propertyType] ?? 'Nepremičnina',
            propertyType,
            sourceLabel: String(feature.properties?.source ?? ''),
            ...(Number.isFinite(askingPrice)
              ? { totalPrice: askingPrice }
              : {}),
            priceUnit: String(
              feature.properties?.price_unit ?? 'unknown',
            ) as ListingPriceUnit,
            transactionType:
              feature.source === 'listing-rentals'
                ? ('rent' as const)
                : ('sale' as const),
          },
        ]
      })
    emit('results', results)
    return
  }

  const buildingLayers = ['property-summary'].filter((layerId) =>
    map?.getLayer(layerId),
  )
  if (!buildingLayers.length) {
    emit('results', [])
    return
  }

  emit(
    'results',
    visibleBuildingResults(
      map.queryRenderedFeatures(undefined, { layers: buildingLayers }),
    ),
  )
}

function addDataLayers() {
  if (!map) return
  addPropertyMapLayers(map, props.filters)
  syncLayerVisibility()
}

function featureAddress(properties: Record<string, unknown>) {
  for (const key of ['full_address', 'address', 'label']) {
    const value = properties[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function summaryAddress(address: string) {
  const words = address.split(/\s+/).slice(0, 2)
  const numberIndex = words.findIndex((word) => /\d/.test(word))
  return words.slice(0, numberIndex < 0 ? words.length : numberIndex).join(' ')
}

function syncPropertySummaries() {
  if (!map?.isStyleLoaded()) return
  const source = map.getSource('property-summaries') as
    GeoJSONSource | undefined
  if (!source) return

  const featuresById = new Map<string, ShapeFeature>()
  for (const feature of map.querySourceFeatures('gurs-properties', {
    sourceLayer: 'properties',
    filter: ['==', ['get', 'feature_type'], 'pin'],
  })) {
    if (feature.geometry.type !== 'Point') continue
    const id = String(feature.properties?.id ?? feature.id ?? '')
    if (!id) continue
    const candidate: ShapeFeature = {
      type: 'Feature',
      id,
      geometry: feature.geometry,
      properties: { ...feature.properties, id },
    }
    const existing = featuresById.get(id)
    if (
      !existing ||
      (!featureAddress(existing.properties) &&
        featureAddress(candidate.properties))
    ) {
      featuresById.set(id, candidate)
    }
  }

  const features = [...featuresById.values()]
  const addressed = features.flatMap((feature) => {
    const address = featureAddress(feature.properties)
    return address && feature.geometry.type === 'Point'
      ? [{ address, coordinates: feature.geometry.coordinates as Position }]
      : []
  })
  const summaries = features.map((feature) => {
    if (
      featureAddress(feature.properties) ||
      feature.geometry.type !== 'Point'
    ) {
      const address = featureAddress(feature.properties)
      const title = summaryAddress(address)
      return title
        ? {
            ...feature,
            properties: { ...feature.properties, summary_address: title },
          }
        : feature
    }
    const [lng, lat] = feature.geometry.coordinates as Position
    let nearest: (typeof addressed)[number] | undefined
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const candidate of addressed) {
      const distance =
        (candidate.coordinates[0] - lng) ** 2 +
        (candidate.coordinates[1] - lat) ** 2
      if (distance < nearestDistance) {
        nearest = candidate
        nearestDistance = distance
      }
    }
    const summary = nearest
      ? {
          ...feature,
          properties: {
            ...feature.properties,
            full_address: nearest.address,
            inherited_address: true,
          },
        }
      : feature
    const title = summaryAddress(featureAddress(summary.properties))
    return title
      ? {
          ...summary,
          properties: { ...summary.properties, summary_address: title },
        }
      : summary
  })
  const signature = summaries
    .map(
      (feature) =>
        `${String(feature.id)}:${featureAddress(feature.properties)}`,
    )
    .sort()
    .join('|')
  if (signature === propertySummarySignature) return
  propertySummarySignature = signature
  source.setData({ type: 'FeatureCollection', features: summaries })
}

function syncPropertyClusters() {
  if (!map?.isStyleLoaded()) return
  const source = map.getSource('property-clusters') as GeoJSONSource | undefined
  if (!source) return

  const { collection, signature } = buildingClusterCollection(
    map.querySourceFeatures('gurs-properties', {
      sourceLayer: 'properties',
      filter: ['==', ['get', 'feature_type'], 'cluster'],
    }),
  )
  if (signature === propertyClusterSignature) return
  propertyClusterSignature = signature
  source.setData(collection)
}

function setSelectedShapes() {
  const buildings = parcelBuildingFeatures.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      active:
        String(feature.properties.id ?? feature.id ?? '') === activeBuildingId,
    },
  }))
  ;(
    map?.getSource('selected-parcel-shapes') as GeoJSONSource | undefined
  )?.setData({
    type: 'FeatureCollection',
    features: [...selectedParcelFeatures, ...buildings],
  })
}

function clearSelectedShapes() {
  activeBuildingId = ''
  detailController?.abort()
  detailController = undefined
  selectedParcelFeatures = []
  parcelBuildingFeatures = []
  setSelectedShapes()
}

function rememberBuilding(feature: ShapeFeature) {
  const id = String(feature.properties.id ?? feature.id ?? '')
  parcelBuildingFeatures = [
    ...parcelBuildingFeatures.filter(
      (item) => String(item.properties.id ?? item.id ?? '') !== id,
    ),
    feature,
  ]
}

function visibleBuildingFootprints(ids: Set<string>): ShapeFeature[] {
  if (!map || !ids.size) return []
  const buildingsById = new Map<string, ShapeFeature>()
  for (const feature of map.querySourceFeatures('gurs-properties', {
    sourceLayer: 'properties',
    filter: ['==', ['get', 'feature_type'], 'footprint'],
  })) {
    const id = String(feature.properties?.id ?? feature.id ?? '')
    if (!id || !ids.has(id) || buildingsById.has(id)) continue
    buildingsById.set(id, {
      type: 'Feature',
      id,
      geometry: feature.geometry,
      properties: { ...feature.properties, id, kind: 'building' },
    })
  }
  return [...buildingsById.values()]
}

function fitSelection(features: ShapeFeature[]) {
  if (!map) return
  const positions: Position[] = []
  function collect(value: unknown) {
    if (!Array.isArray(value)) return
    if (
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1]))
    ) {
      positions.push([Number(value[0]), Number(value[1])])
      return
    }
    for (const nested of value) collect(nested)
  }
  for (const feature of features) {
    if ('coordinates' in feature.geometry) collect(feature.geometry.coordinates)
  }
  if (!positions.length) return
  const lngs = positions.map(([lng]) => lng)
  const lats = positions.map(([, lat]) => lat)
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    {
      padding: matchMedia('(max-width: 720px)').matches
        ? 42
        : { top: 70, right: 70, bottom: 70, left: 490 },
      maxZoom: 18,
      duration: 420,
    },
  )
}

async function selectBuildingFeature(
  feature: GeoJSONFeature,
  emitSelection = true,
  fitAfterLoad = true,
) {
  const id = String(feature.properties?.id ?? feature.id ?? '')
  if (!id) return
  if (activeBuildingId && activeBuildingId !== id) {
    selectedParcelFeatures = []
    parcelBuildingFeatures = []
    setSelectedShapes()
  }
  activeBuildingId = id
  detailController?.abort()
  const selectedBuilding: ShapeFeature = {
    type: 'Feature',
    id,
    geometry: feature.geometry,
    properties: { ...feature.properties, id, kind: 'building' },
  }
  rememberBuilding(selectedBuilding)
  setSelectedShapes()
  if (!selectedParcelFeatures.length) fitSelection([selectedBuilding])
  if (emitSelection) emit('select', `building:${id}`)

  const controller = new AbortController()
  detailController = controller
  try {
    const buildingResponse = await fetch(
      `/gurs/buildings/${encodeURIComponent(id)}`,
      {
        signal: controller.signal,
      },
    )
    if (!buildingResponse.ok) return
    const detail = (await buildingResponse.json()) as {
      building?: ShapeFeature
      parcelIds: string[]
    }
    if (activeBuildingId !== id) return
    if (detail.building) rememberBuilding(detail.building)

    const parcelResponses = await Promise.all(
      detail.parcelIds.map((parcelId) =>
        fetch(`/gurs/parcels/${encodeURIComponent(parcelId)}`, {
          signal: controller.signal,
        }),
      ),
    )
    const parcels = await Promise.all(
      parcelResponses
        .filter((response) => response.ok)
        .map((response) => response.json() as Promise<ShapeFeature>),
    )
    const relatedBuildingIds = new Set(
      parcels.flatMap((parcel) => {
        const ids = parcel.properties.buildingIds
        return Array.isArray(ids) ? ids.map(String) : []
      }),
    )
    relatedBuildingIds.add(id)
    if (activeBuildingId !== id) return
    selectedParcelFeatures = parcels
    const buildingsById = new Map<string, ShapeFeature>()
    for (const building of [
      ...visibleBuildingFootprints(relatedBuildingIds),
      ...parcelBuildingFeatures,
    ]) {
      const buildingId = String(building.properties.id ?? building.id ?? '')
      if (buildingId) buildingsById.set(buildingId, building)
    }
    parcelBuildingFeatures = [...buildingsById.values()]
    setSelectedShapes()
    if (fitAfterLoad) {
      fitSelection([...selectedParcelFeatures, ...parcelBuildingFeatures])
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      // A building without a linked parcel is still a valid selection.
    }
  }
}

function hoverFeature(event: MapLayerMouseEvent) {
  if (!map || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (props.measureMode) {
    map.getCanvas().style.cursor = 'crosshair'
    return
  }
  const feature = event.features?.[0]
  if (!feature || feature.id === undefined) return
  if (hovered) map.setFeatureState(hovered, { hover: false })
  const source = feature.source
  const sourceLayer = feature.sourceLayer
  hovered = {
    source,
    ...(sourceLayer ? { sourceLayer } : {}),
    id: feature.id,
  }
  map.setFeatureState(hovered, { hover: true })
  map.getCanvas().style.cursor = 'pointer'
}

function clearHover() {
  if (!map) return
  if (hovered) map.setFeatureState(hovered, { hover: false })
  hovered = undefined
  map.getCanvas().style.cursor = props.measureMode ? 'crosshair' : ''
}

function focusHouseCard(feature: GeoJSONFeature | undefined) {
  if (!map || feature?.geometry.type !== 'Point') return
  map.easeTo({
    center: feature.geometry.coordinates as Position,
    zoom: HOUSE_LEVEL_ZOOM,
    duration: 420,
  })
}

onMounted(async () => {
  await nextTick()
  const container =
    mapContainer.value ??
    document.querySelector<HTMLDivElement>('[data-property-map-container]')
  if (!container) {
    emit('error', 'Vsebnika zemljevida ni mogoče najti.')
    emit('loading', false)
    emit('resultsLoading', false)
    return
  }
  container.dataset.mapState = 'importing'
  try {
    const maplibregl = await import('maplibre-gl')
    createMapMarker = (element) =>
      new maplibregl.Marker({ element, anchor: 'bottom' })
    container.dataset.mapState = 'initializing'
    map = new maplibregl.Map({
      container,
      style: config.public.mapStyleUrl || localStyle,
      center: props.center,
      zoom: props.zoom,
      attributionControl: false,
      minZoom: 6,
      maxZoom: 20,
      pitch: 0,
      bearing: 0,
      dragRotate: false,
      touchPitch: false,
      crossSourceCollisions: false,
    })
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: config.public.mapAttribution,
      }),
    )
    if (matchMedia('(max-width: 720px), (max-height: 560px)').matches) {
      const attribution = container.querySelector<HTMLDetailsElement>(
        '.maplibregl-ctrl-attrib',
      )
      if (attribution) attribution.open = false
    }
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      'top-right',
    )
    map.on('load', () => {
      container.dataset.mapState = 'ready'
      emit('dataError', '')
      map?.resize()
      flattenBasemap()
      try {
        addDataLayers()
      } catch (error) {
        emit(
          'error',
          error instanceof Error
            ? error.message
            : 'Prostorskih slojev ni bilo mogoče naložiti.',
        )
      }
      requestAnimationFrame(() => {
        map?.resize()
        emit('loading', false)
      })
    })
    map.on('movestart', () => {
      emit('resultsLoading', true)
    })
    map.on('idle', () => {
      emit('loading', false)
      emit('resultsLoading', false)
      emit('error', '')
      syncPropertyClusters()
      syncPropertySummaries()
      syncHouseMarkers()
      updateFeatureCount()
      updateVisibleResults()
    })
    map.on('moveend', () => {
      if (!map) return
      syncPropertyClusters()
      syncPropertySummaries()
      syncHouseMarkers()
      updateFeatureCount()
      updateVisibleResults()
      if (!syncingFromProps) {
        const center = map.getCenter()
        emit('move', {
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
        })
      }
      syncingFromProps = false
    })
    map.on('error', (event) => {
      if (!event.error) return
      const sourceId =
        'sourceId' in event && typeof event.sourceId === 'string'
          ? event.sourceId
          : ''
      const isGursDataError =
        sourceId.startsWith('gurs-') ||
        sourceId.startsWith('listing-') ||
        event.error.message.includes('/api/map/tiles/')
      if (isGursDataError) {
        emit('loading', false)
        emit('resultsLoading', false)
        emit(
          'dataError',
          'Podatki GURS trenutno niso dosegljivi. Zemljevid lahko še vedno uporabljate.',
        )
        return
      }
      emit('error', event.error.message)
      emit('resultsLoading', false)
    })

    map.on('mousemove', 'property-point', hoverFeature)
    map.on('mouseleave', 'property-point', clearHover)
    map.on('click', 'property-point', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      if (feature) void selectBuildingFeature(feature)
    })
    map.on('mousemove', 'property-summary', hoverFeature)
    map.on('mouseleave', 'property-summary', clearHover)
    map.on('click', 'property-summary', (event) => {
      if (props.measureMode) return
      focusHouseCard(event.features?.[0])
    })
    map.on('mouseenter', 'property-cluster', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'property-cluster', () => {
      if (map)
        map.getCanvas().style.cursor = props.measureMode ? 'crosshair' : ''
    })
    map.on('click', 'property-cluster', (event) => {
      if (props.measureMode) return
      focusHouseCard(event.features?.[0])
    })
    map.on('mousemove', 'parcel-fill', hoverFeature)
    map.on('mouseleave', 'parcel-fill', clearHover)
    map.on('click', 'parcel-fill', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      const id = feature?.properties?.id ?? feature?.id
      if (id !== undefined) emit('select', `parcel:${String(id)}`)
    })
    map.on('mousemove', 'selected-building-fill', hoverFeature)
    map.on('mouseleave', 'selected-building-fill', clearHover)
    map.on('click', 'selected-building-fill', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      const id = String(feature?.properties?.id ?? feature?.id ?? '')
      if (feature && id && id !== activeBuildingId) {
        void selectBuildingFeature(feature, true, false)
      }
    })

    map.on('mousemove', 'sale-point', hoverFeature)
    map.on('mouseleave', 'sale-point', clearHover)
    map.on('click', 'sale-point', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      const id =
        feature?.properties?.transaction_id ??
        feature?.properties?.id ??
        feature?.properties?.record_id ??
        feature?.id
      if (id !== undefined) emit('select', `transaction:${String(id)}`)
    })

    map.on('click', 'sale-cluster', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      if (!map || feature?.geometry.type !== 'Point') return
      map.easeTo({
        center: feature.geometry.coordinates as Position,
        zoom: Math.min(map.getZoom() + 2, 20),
        duration: 360,
      })
    })
    for (const layer of ['listing-sales', 'listing-rentals']) {
      const summaryLayer = `${layer}-summary`
      const pointLayer = `${layer}-point`
      const clusterLayer = `${layer}-cluster`
      for (const markerLayer of [summaryLayer, pointLayer]) {
        map.on('mousemove', markerLayer, hoverFeature)
        map.on('mouseleave', markerLayer, clearHover)
        map.on('click', markerLayer, (event) => {
          if (props.measureMode) return
          const feature = event.features?.[0]
          const id = feature?.properties?.id ?? feature?.id
          if (id !== undefined) emit('select', `listing:${String(id)}`)
        })
      }
      map.on('mouseenter', clusterLayer, () => {
        if (map) map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', clusterLayer, clearHover)
      map.on('click', clusterLayer, (event) => {
        if (props.measureMode) return
        const feature = event.features?.[0]
        if (!map || feature?.geometry.type !== 'Point') return
        map.easeTo({
          center: feature.geometry.coordinates as Position,
          zoom: Math.min(map.getZoom() + 2, 20),
          duration: 360,
        })
      })
    }
    map.on('click', (event) => {
      if (!props.measureMode) return
      measurePoints =
        measurePoints.length >= 2
          ? [[event.lngLat.lng, event.lngLat.lat]]
          : [...measurePoints, [event.lngLat.lng, event.lngLat.lat]]
      updateMeasurement()
    })
  } catch (error) {
    container.dataset.mapState = 'error'
    emit(
      'error',
      error instanceof Error ? error.message : 'Zemljevida ni mogoče zagnati.',
    )
    emit('loading', false)
    emit('resultsLoading', false)
  }
})

watch(
  () => [props.center[0], props.center[1], props.zoom] as const,
  ([lng, lat, zoom]) => {
    if (!map) return
    const current = map.getCenter()
    if (
      Math.abs(current.lng - lng) > 0.00001 ||
      Math.abs(current.lat - lat) > 0.00001 ||
      Math.abs(map.getZoom() - zoom) > 0.01
    ) {
      syncingFromProps = true
      map.easeTo({ center: [lng, lat], zoom, duration: 280 })
    }
  },
)

watch(
  () => props.selectedId,
  (selectedId) => {
    if (!selectedId?.startsWith('building:')) {
      clearSelectedShapes()
      return
    }
    if (!map?.isStyleLoaded()) return
    const id = selectedId.slice('building:'.length)
    if (id === activeBuildingId) return
    const feature = map
      .querySourceFeatures('gurs-properties', { sourceLayer: 'properties' })
      .find((item) => String(item.properties?.id ?? item.id) === id)
    if (feature) void selectBuildingFeature(feature, false)
  },
)
watch(
  () => props.layers,
  () => {
    clearSelectedShapes()
    syncLayerVisibility()
  },
  { deep: true },
)
watch(
  () => props.filters,
  (filters) => {
    if (!map?.isStyleLoaded()) return
    propertySummarySignature = '__stale__'
    updatePropertyMapTiles(map, filters)
    emit('loading', true)
    emit('resultsLoading', true)
  },
  { deep: true },
)
watch(
  () => props.measureMode,
  (enabled) => {
    measurePoints = []
    updateMeasurement()
    if (map) map.getCanvas().style.cursor = enabled ? 'crosshair' : ''
  },
)

onBeforeUnmount(() => {
  detailController?.abort()
  removeHouseMarkers()
  map?.remove()
})

defineExpose({
  retry: updateFeatureCount,
})
</script>

<template>
  <div
    ref="mapContainer"
    class="property-map"
    data-property-map-container
    aria-label="Interaktivni zemljevid nepremičnin"
  />
</template>

<style scoped>
.property-map {
  position: absolute;
  inset: 0;
  background-color: #e8eeeb;
  background-image:
    linear-gradient(
      30deg,
      rgb(255 255 255 / 34%) 12%,
      transparent 12.5%,
      transparent 87%,
      rgb(255 255 255 / 34%) 87.5%
    ),
    linear-gradient(
      150deg,
      rgb(255 255 255 / 34%) 12%,
      transparent 12.5%,
      transparent 87%,
      rgb(255 255 255 / 34%) 87.5%
    );
  background-size: 48px 84px;
}

.property-map :deep(.maplibregl-ctrl-bottom-right) {
  right: 0;
  bottom: 0;
}

.property-map :deep(.maplibregl-ctrl-group) {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 9px;
  box-shadow: 0 4px 14px rgb(23 33 31 / 10%);
}

.property-map :deep(.maplibregl-ctrl-attrib) {
  color: var(--color-ink-muted);
  font-size: 9px;
}

.property-map :deep(.property-map__house-marker-anchor) {
  --house-marker-scale: 1;

  width: 84px;
  height: 60px;
  pointer-events: none;
}

.property-map :deep(.property-map__house-marker) {
  position: absolute;
  top: 0;
  left: 3px;
  display: flex;
  width: 78px;
  height: 48px;
  margin: 0;
  padding: 8px 6px 7px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font: inherit;
  line-height: 1.02;
  appearance: none;
  cursor: pointer;
  pointer-events: auto;
  background: #315f52;
  border: 1px solid #244d42;
  border-radius: 9px;
  box-shadow: 0 2px 5px rgb(25 61 53 / 22%);
  transform: scale(var(--house-marker-scale));
  transform-origin: 50% 60px;
}

.property-map :deep(.property-map__house-marker::after) {
  position: absolute;
  bottom: -7px;
  left: 50%;
  width: 13px;
  height: 13px;
  content: '';
  background: inherit;
  border-right: 1px solid #244d42;
  border-bottom: 1px solid #244d42;
  transform: translateX(-50%) rotate(45deg);
}

.property-map :deep(.property-map__house-marker--sage) {
  background: #55796d;
  border-color: #315f52;
}

.property-map :deep(.property-map__house-marker-title),
.property-map :deep(.property-map__house-marker-value) {
  position: relative;
  z-index: 1;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-map :deep(.property-map__house-marker-title) {
  color: #dbe9e3;
  font-size: 8px;
  font-weight: 700;
}

.property-map :deep(.property-map__house-marker-value) {
  margin-top: 2px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 720px), (max-height: 560px) and (max-width: 1024px) {
  .property-map :deep(.maplibregl-ctrl-bottom-right) {
    right: 0;
    bottom: 0;
  }
}
</style>
