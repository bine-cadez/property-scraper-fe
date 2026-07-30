<script setup lang="ts">
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import type { ViewportResponse } from '#shared/types/geojson'
import type { MapFilters, MapLayerId, Position } from '#shared/types/property'

const props = defineProps<{
  center: Position
  zoom: number
  layers: MapLayerId[]
  filters: MapFilters
  selectedId: string | undefined
}>()

const emit = defineEmits<{
  select: [id: string]
  move: [state: { center: Position; zoom: number }]
  loading: [value: boolean]
  error: [message: string]
  count: [value: number]
}>()

const config = useRuntimeConfig()
const mapContainer = ref<HTMLDivElement>()
let map: MapLibreMap | undefined
let controller: AbortController | undefined
let fetchTimer: ReturnType<typeof setTimeout> | undefined
let hovered: { source: string; id: string | number } | undefined
let syncingFromProps = false
let viewportData: ViewportResponse | undefined

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
  parcels: ['parcels-fill', 'parcels-line', 'parcel-selected'],
  buildings: ['buildings-fill', 'buildings-line', 'building-selected'],
  transactions: ['point-clusters', 'cluster-count', 'transaction-points'],
  listings: ['point-clusters', 'cluster-count', 'listing-points'],
  priceM2: ['transaction-labels', 'listing-labels'],
  officialValue: ['parcel-official-fill'],
}

function emptyCollection() {
  return { type: 'FeatureCollection' as const, features: [] }
}

function flattenBasemap() {
  if (!map?.isStyleLoaded()) return
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'fill-extrusion') {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
    }
  }
}

function setSelectionFilters() {
  if (!map?.isStyleLoaded()) return
  const id = props.selectedId ?? '__none__'
  for (const layerId of ['parcel-selected', 'building-selected']) {
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, ['==', ['get', 'id'], id])
    }
  }
}

function syncLayerVisibility() {
  if (!map?.isStyleLoaded()) return
  const configured = new Set(props.layers)
  for (const [logicalLayer, mapLayers] of Object.entries(visibilityByLayer)) {
    for (const layerId of mapLayers) {
      if (!map.getLayer(layerId)) continue
      if (layerId.endsWith('-labels')) {
        const kindVisible = layerId.startsWith('transaction')
          ? configured.has('transactions')
          : configured.has('listings')
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has('priceM2') && kindVisible ? 'visible' : 'none',
        )
      } else if (layerId.includes('transaction')) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has('transactions') ? 'visible' : 'none',
        )
      } else if (layerId.includes('listing')) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has('listings') ? 'visible' : 'none',
        )
      } else if (layerId.includes('cluster')) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has('transactions') || configured.has('listings')
            ? 'visible'
            : 'none',
        )
      } else {
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has(logicalLayer as MapLayerId) ? 'visible' : 'none',
        )
      }
    }
  }
}

function applyMapFilters() {
  if (!map?.isStyleLoaded() || !viewportData) return
  const active = props.filters
  const typeMatches = (propertyType: unknown) =>
    !active.propertyTypes.length ||
    (typeof propertyType === 'string' &&
      active.propertyTypes.includes(
        propertyType as (typeof active.propertyTypes)[number],
      ))

  const parcelFeatures = viewportData.parcels.features.filter(
    (feature) =>
      active.minParcelAreaM2 === undefined ||
      feature.properties.areaM2 >= active.minParcelAreaM2,
  )
  const buildingFeatures = viewportData.buildings.features.filter(
    (feature) =>
      typeMatches(feature.properties.propertyType) &&
      (active.constructionYearFrom === undefined ||
        (feature.properties.constructionYear !== undefined &&
          feature.properties.constructionYear >= active.constructionYearFrom)),
  )
  const pointFeatures = viewportData.points.features.filter((feature) => {
    const value = feature.properties
    return (
      typeMatches(value.propertyType) &&
      (active.minPrice === undefined || value.amount >= active.minPrice) &&
      (active.maxPrice === undefined || value.amount <= active.maxPrice) &&
      (active.minPricePerM2 === undefined ||
        value.pricePerM2 >= active.minPricePerM2) &&
      (active.maxPricePerM2 === undefined ||
        value.pricePerM2 <= active.maxPricePerM2) &&
      (active.minAreaM2 === undefined || value.areaM2 >= active.minAreaM2) &&
      (value.kind !== 'transaction' ||
        active.transactionFrom === undefined ||
        value.date >= active.transactionFrom)
    )
  })

  ;(map.getSource('parcels') as GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features: parcelFeatures,
  })
  ;(map.getSource('buildings') as GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features: buildingFeatures,
  })
  ;(map.getSource('market-points') as GeoJSONSource | undefined)?.setData({
    type: 'FeatureCollection',
    features: pointFeatures,
  })
  emit(
    'count',
    parcelFeatures.length + buildingFeatures.length + pointFeatures.length,
  )
}

function addDataLayers() {
  if (!map) return
  map.addSource('parcels', {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
  })
  map.addSource('buildings', {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
  })
  map.addSource('market-points', {
    type: 'geojson',
    data: emptyCollection(),
    promoteId: 'id',
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 48,
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

  setSelectionFilters()
  syncLayerVisibility()
  applyMapFilters()
}

async function fetchViewport() {
  if (!map) return
  controller?.abort()
  controller = new AbortController()
  const bounds = map.getBounds()
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ]
    .map((value) => value.toFixed(6))
    .join(',')
  emit('loading', true)
  try {
    const data = await $fetch<ViewportResponse>('/api/map/features', {
      query: { bbox, limit: 500 },
      signal: controller.signal,
    })
    viewportData = data
    applyMapFilters()
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      emit('error', 'Prostorskih podatkov ni bilo mogoče pridobiti.')
    }
  } finally {
    emit('loading', false)
  }
}

function scheduleViewportFetch() {
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(fetchViewport, 280)
}

function hoverFeature(event: MapLayerMouseEvent) {
  if (!map || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const feature = event.features?.[0]
  if (!feature || feature.id === undefined) return
  if (hovered) map.setFeatureState(hovered, { hover: false })
  const source = feature.source
  hovered = { source, id: feature.id }
  map.setFeatureState(hovered, { hover: true })
  map.getCanvas().style.cursor = 'pointer'
}

function clearHover() {
  if (!map) return
  if (hovered) map.setFeatureState(hovered, { hover: false })
  hovered = undefined
  map.getCanvas().style.cursor = ''
}

onMounted(async () => {
  await nextTick()
  const container =
    mapContainer.value ??
    document.querySelector<HTMLDivElement>('[data-property-map-container]')
  if (!container) {
    emit('error', 'Vsebnika zemljevida ni mogoče najti.')
    emit('loading', false)
    return
  }
  container.dataset.mapState = 'importing'
  try {
    const maplibregl = await import('maplibre-gl')
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
      'bottom-right',
    )
    map.on('load', () => {
      container.dataset.mapState = 'ready'
      map?.resize()
      flattenBasemap()
      addDataLayers()
      requestAnimationFrame(() => {
        map?.resize()
        fetchViewport()
      })
    })
    map.on('moveend', () => {
      if (!map) return
      scheduleViewportFetch()
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
      if (event.error) emit('error', event.error.message)
    })

    for (const layerId of ['parcels-fill', 'buildings-fill']) {
      map.on('mousemove', layerId, hoverFeature)
      map.on('mouseleave', layerId, clearHover)
      map.on('click', layerId, (event) => {
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') emit('select', id)
      })
    }

    for (const layerId of ['transaction-points', 'listing-points']) {
      map.on('mouseenter', layerId, () => {
        if (map) map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', layerId, () => {
        if (map) map.getCanvas().style.cursor = ''
      })
      map.on('click', layerId, (event) => {
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') emit('select', id)
      })
    }

    map.on('click', 'point-clusters', async (event) => {
      const feature = event.features?.[0]
      const clusterId = feature?.properties?.cluster_id
      if (
        !map ||
        typeof clusterId !== 'number' ||
        feature?.geometry.type !== 'Point'
      )
        return
      const source = map.getSource('market-points') as GeoJSONSource
      const zoom = await source.getClusterExpansionZoom(clusterId)
      map.easeTo({
        center: feature.geometry.coordinates as Position,
        zoom,
        duration: 320,
      })
    })
  } catch (error) {
    container.dataset.mapState = 'error'
    emit(
      'error',
      error instanceof Error ? error.message : 'Zemljevida ni mogoče zagnati.',
    )
    emit('loading', false)
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

watch(() => props.selectedId, setSelectionFilters)
watch(() => props.layers, syncLayerVisibility, { deep: true })
watch(() => props.filters, applyMapFilters, { deep: true })

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(fetchTimer)
  map?.remove()
})

defineExpose({
  retry: fetchViewport,
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
  right: 10px;
  bottom: 18px;
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

@media (max-width: 720px), (max-height: 560px) and (max-width: 1024px) {
  .property-map :deep(.maplibregl-ctrl-bottom-right) {
    bottom: 68px;
  }
}
</style>
