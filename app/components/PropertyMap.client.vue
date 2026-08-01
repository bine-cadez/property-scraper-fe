<script setup lang="ts">
import type {
  GeoJSONFeature,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import type {
  MapFilters,
  MapLayerId,
  Position,
} from '#shared/types/property'
import { addPropertyMapLayers } from '~/utils/map/layers'
import { formatMeasuredDistance } from '~/utils/map/measurement'

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
const route = useRoute()
const shouldFitInitialBuildings = typeof route.query.c !== 'string'
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
let fittedBuildingSource = false
let selectedParcelFeatures: ShapeFeature[] = []
let parcelBuildingFeatures: ShapeFeature[] = []
let activeBuildingId = ''
let detailController: AbortController | undefined

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
  parcels: [],
  buildings: [
    'house-clusters',
    'house-cluster-count',
    'building-markers',
    'parcel-selected-line',
    'selected-building-fill',
    'selected-building-line',
  ],
  transactions: ['point-clusters', 'cluster-count', 'transaction-points'],
  listings: [],
  priceM2: ['transaction-labels'],
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
      } else if (layerId.startsWith('house-cluster')) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          configured.has('buildings') ? 'visible' : 'none',
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

function updateFeatureCount() {
  if (!map?.isStyleLoaded()) return
  const buildingFeatures = map.queryRenderedFeatures(undefined, {
    layers: ['house-clusters', 'building-markers'],
  })
  const seen = new Set<string>()
  const buildingCount = buildingFeatures.reduce((total, feature, index) => {
    const key = `${feature.layer.id}:${String(
      feature.properties?.cluster_id ??
        feature.id ??
        feature.properties?.id ??
        index,
    )}`
    if (seen.has(key)) return total
    seen.add(key)
    return total + Number(feature.properties?.point_count ?? 1)
  }, 0)
  const transactionFeatures = map.queryRenderedFeatures(undefined, {
    layers: ['transaction-points'],
  })
  const transactionIds = new Set(
    transactionFeatures.map((feature, index) =>
      String(feature.id ?? feature.properties?.id ?? index),
    ),
  )
  emit('count', buildingCount + transactionIds.size)
}

function geometryCenter(
  geometry: GeoJSONFeature['geometry'],
): Position | undefined {
  if (!('coordinates' in geometry)) return undefined
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
  collect(geometry.coordinates)
  if (!positions.length) return undefined
  const lngs = positions.map(([lng]) => lng)
  const lats = positions.map(([, lat]) => lat)
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ]
}

async function addDataLayers() {
  if (!map) return
  const response = await fetch('/gurs/buildings')
  if (!response.ok) throw new Error('Stavb ni bilo mogoče naložiti.')
  const buildings = (await response.json()) as {
    type: 'FeatureCollection'
    features: ShapeFeature[]
  }
  const buildingMarkers = {
    type: 'FeatureCollection' as const,
    features: buildings.features.flatMap((feature) => {
      const center = geometryCenter(feature.geometry)
      if (!center) return []
      return [
        {
          ...feature,
          geometry: {
            type: 'Point' as const,
            coordinates: center,
          },
        },
      ]
    }),
  }
  addPropertyMapLayers(map, buildingMarkers)
  syncLayerVisibility()
  if (shouldFitInitialBuildings) fitFetchedBuildings(buildings.features)
}

function fitFetchedBuildings(sourceFeatures?: ShapeFeature[]) {
  if (!map || fittedBuildingSource) return
  const features = sourceFeatures ?? map.querySourceFeatures('gurs-buildings')
  if (!features.length) return
  fittedBuildingSource = true

  if (
    !sourceFeatures &&
    map.queryRenderedFeatures(undefined, { layers: ['building-markers'] })
      .length
  ) {
    return
  }

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
    { padding: 64, maxZoom: 17, duration: 450 },
  )
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

function rememberBuilding(feature: ShapeFeature) {
  const id = String(feature.properties.id ?? feature.id ?? '')
  parcelBuildingFeatures = [
    ...parcelBuildingFeatures.filter(
      (item) => String(item.properties.id ?? item.id ?? '') !== id,
    ),
    feature,
  ]
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
    const parcelBuildingResponses = await Promise.all(
      detail.parcelIds.map((parcelId) =>
        fetch(`/gurs/buildings?parcelId=${encodeURIComponent(parcelId)}`, {
          signal: controller.signal,
        }),
      ),
    )
    const parcelBuildingCollections = await Promise.all(
      parcelBuildingResponses
        .filter((response) => response.ok)
        .map(
          (response) =>
            response.json() as Promise<{
              type: 'FeatureCollection'
              features: ShapeFeature[]
            }>,
        ),
    )
    if (activeBuildingId !== id) return
    selectedParcelFeatures = parcels
    const buildingsById = new Map<string, ShapeFeature>()
    for (const building of [
      ...parcelBuildingCollections.flatMap((collection) => collection.features),
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
    map.on('load', async () => {
      container.dataset.mapState = 'ready'
      map?.resize()
      flattenBasemap()
      try {
        await addDataLayers()
      } catch (error) {
        emit(
          'error',
          error instanceof Error
            ? error.message
            : 'Stavb ni bilo mogoče naložiti.',
        )
      }
      requestAnimationFrame(() => {
        map?.resize()
        emit('loading', false)
      })
    })
    map.on('idle', () => {
      emit('loading', false)
      emit('error', '')
      updateFeatureCount()
    })
    map.on('sourcedata', (event) => {
      if (event.sourceId === 'gurs-buildings') fitFetchedBuildings()
    })
    map.on('moveend', () => {
      if (!map) return
      updateFeatureCount()
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

    map.on('mousemove', 'building-markers', hoverFeature)
    map.on('mouseleave', 'building-markers', clearHover)
    map.on('click', 'building-markers', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      if (feature) void selectBuildingFeature(feature)
    })
    map.on('mouseenter', 'house-clusters', () => {
      if (map) map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'house-clusters', () => {
      if (map)
        map.getCanvas().style.cursor = props.measureMode ? 'crosshair' : ''
    })
    map.on('click', 'house-clusters', async (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      const clusterId = feature?.properties?.cluster_id
      if (
        !map ||
        typeof clusterId !== 'number' ||
        feature?.geometry.type !== 'Point'
      )
        return
      const source = map.getSource('gurs-buildings') as GeoJSONSource
      const zoom = await source.getClusterExpansionZoom(clusterId)
      map.easeTo({
        center: feature.geometry.coordinates as Position,
        zoom,
        duration: 320,
      })
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

    for (const layerId of ['transaction-points']) {
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
        const feature = event.features?.[0]
        const id =
          feature?.properties?.id ??
          feature?.properties?.transaction_id ??
          feature?.properties?.record_id ??
          feature?.id
        if (id !== undefined) emit('select', `transaction:${String(id)}`)
      })
    }

    map.on('click', 'point-clusters', (event) => {
      if (props.measureMode) return
      const feature = event.features?.[0]
      if (!map || feature?.geometry.type !== 'Point') return
      map.easeTo({
        center: feature.geometry.coordinates as Position,
        zoom: Math.min(map.getZoom() + 2, 20),
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

watch(
  () => props.selectedId,
  (selectedId) => {
    if (!map?.isStyleLoaded()) return
    if (!selectedId?.startsWith('building:')) {
      activeBuildingId = ''
      detailController?.abort()
      selectedParcelFeatures = []
      parcelBuildingFeatures = []
      setSelectedShapes()
      return
    }
    const id = selectedId.slice('building:'.length)
    if (id === activeBuildingId) return
    const feature = map
      .querySourceFeatures('gurs-buildings')
      .find((item) => String(item.properties?.id ?? item.id) === id)
    if (feature) void selectBuildingFeature(feature, false)
  },
)
watch(() => props.layers, syncLayerVisibility, { deep: true })
watch(
  () => props.filters,
  () => updateFeatureCount(),
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

@media (max-width: 720px), (max-height: 560px) and (max-width: 1024px) {
  .property-map :deep(.maplibregl-ctrl-bottom-right) {
    right: 0;
    bottom: 0;
  }
}
</style>
