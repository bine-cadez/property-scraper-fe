<script setup lang="ts">
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import type { ViewportResponse } from '#shared/types/geojson'
import type { MapFilters, MapLayerId, Position } from '#shared/types/property'
import { filterViewportFeatures } from '~/utils/map/filter-features'
import { addPropertyMapLayers } from '~/utils/map/layers'
import { formatMeasuredDistance } from '~/utils/map/measurement'
import { isAbortError } from '~/utils/request'

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
  error: [message: string]
  count: [value: number]
  measure: [value: string | undefined]
}>()

const config = useRuntimeConfig()
const mapContainer = ref<HTMLDivElement>()
let map: MapLibreMap | undefined
let controller: AbortController | undefined
let fetchTimer: ReturnType<typeof setTimeout> | undefined
let hovered: { source: string; id: string | number } | undefined
let syncingFromProps = false
let viewportData: ViewportResponse | undefined
let measurePoints: Position[] = []

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
  const filtered = filterViewportFeatures(viewportData, props.filters)

  ;(map.getSource('parcels') as GeoJSONSource | undefined)?.setData({
    ...filtered.parcels,
  })
  ;(map.getSource('buildings') as GeoJSONSource | undefined)?.setData({
    ...filtered.buildings,
  })
  ;(map.getSource('market-points') as GeoJSONSource | undefined)?.setData({
    ...filtered.points,
  })
  emit('count', filtered.count)
}

function addDataLayers() {
  if (!map) return
  addPropertyMapLayers(map)
  setSelectionFilters()
  syncLayerVisibility()
  applyMapFilters()
}

async function fetchViewport() {
  if (!map) return
  controller?.abort()
  const requestController = new AbortController()
  controller = requestController
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
      signal: requestController.signal,
    })
    if (controller === requestController) {
      viewportData = data
      emit('error', '')
      applyMapFilters()
    }
  } catch (error) {
    if (!isAbortError(error) && controller === requestController) {
      emit('error', 'Prostorskih podatkov ni bilo mogoče pridobiti.')
    }
  } finally {
    if (controller === requestController) {
      emit('loading', false)
    }
  }
}

function scheduleViewportFetch() {
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(fetchViewport, 280)
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
  hovered = { source, id: feature.id }
  map.setFeatureState(hovered, { hover: true })
  map.getCanvas().style.cursor = 'pointer'
}

function clearHover() {
  if (!map) return
  if (hovered) map.setFeatureState(hovered, { hover: false })
  hovered = undefined
  map.getCanvas().style.cursor = props.measureMode ? 'crosshair' : ''
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
        if (props.measureMode) return
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') emit('select', id)
      })
    }

    for (const layerId of ['transaction-points', 'listing-points']) {
      map.on('mouseenter', layerId, () => {
        if (map)
          map.getCanvas().style.cursor = props.measureMode
            ? 'crosshair'
            : 'pointer'
      })
      map.on('mouseleave', layerId, () => {
        if (map)
          map.getCanvas().style.cursor = props.measureMode ? 'crosshair' : ''
      })
      map.on('click', layerId, (event) => {
        if (props.measureMode) return
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') emit('select', id)
      })
    }

    map.on('click', 'point-clusters', async (event) => {
      if (props.measureMode) return
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
watch(
  () => props.measureMode,
  (enabled) => {
    measurePoints = []
    updateMeasurement()
    if (map) map.getCanvas().style.cursor = enabled ? 'crosshair' : ''
  },
)

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
  right: 72px;
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
    right: 10px;
    bottom: 68px;
  }
}
</style>
