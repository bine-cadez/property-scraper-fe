import type {
  MapFilters,
  MapLayerId,
  Position,
  PropertyRecord,
  SearchResult,
} from '#shared/types/property'
import {
  DEFAULT_MAP_STATE,
  parseMapState,
  serializeMapState,
} from '#shared/utils/map-state'
import { isAbortError } from '~/utils/request'

const DEFAULT_VISIBLE_LAYERS: MapLayerId[] = ['buildings']

export function useMapWorkspace() {
  const route = useRoute()
  const router = useRouter()
  const initialState = parseMapState(
    route.query as Record<string, string | string[] | undefined>,
  )

  const center = ref<Position>([...initialState.center])
  const zoom = ref(initialState.zoom)
  const layers = ref<MapLayerId[]>([...initialState.layers])
  const { selectedId } = useMapSelection(initialState.selectedId)
  const sidebarExpanded = ref(Boolean(initialState.selectedId))
  const selectedProperty = ref<PropertyRecord>()
  const selectionLoading = ref(false)
  const selectionError = ref('')
  const mapLoading = ref(true)
  const mapError = ref('')
  const featureCount = ref(0)
  const filters = ref<MapFilters>({ propertyTypes: [] })
  const measureMode = ref(false)
  const measuredDistance = ref<string>()
  const locating = ref(false)
  const toolMessage = ref('')
  const mapKey = ref(0)

  let propertyController: AbortController | undefined
  let urlTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let toolMessageTimer: ReturnType<typeof setTimeout> | undefined
  let visibleLayersBeforeHide: MapLayerId[] = []

  function updateUrl() {
    clearTimeout(urlTimer)
    urlTimer = setTimeout(() => {
      void router.replace({
        query: serializeMapState({
          center: center.value,
          zoom: zoom.value,
          layers: layers.value,
          ...(selectedId.value ? { selectedId: selectedId.value } : {}),
        }),
      })
    }, 180)
  }

  watch([center, zoom, layers, selectedId], updateUrl, { deep: true })

  watch(
    selectedId,
    (id) => {
      if (id) {
        clearTimeout(closeTimer)
        sidebarExpanded.value = true
      } else {
        sidebarExpanded.value = false
      }
    },
    { immediate: true },
  )

  watch(
    selectedId,
    async (id) => {
      propertyController?.abort()
      propertyController = undefined
      selectedProperty.value = undefined
      selectionError.value = ''
      if (!id) {
        selectionLoading.value = false
        return
      }

      selectionLoading.value = true
      const controller = new AbortController()
      propertyController = controller

      try {
        selectedProperty.value = await $fetch<PropertyRecord>(
          `/api/property/${encodeURIComponent(id)}`,
          { signal: controller.signal },
        )
      } catch (error) {
        if (!isAbortError(error)) {
          selectionError.value =
            'Podrobnosti izbranega zapisa trenutno niso na voljo.'
        }
      } finally {
        if (propertyController === controller) {
          selectionLoading.value = false
        }
      }
    },
    { immediate: true },
  )

  function onMapMove(state: { center: Position; zoom: number }) {
    center.value = state.center
    zoom.value = state.zoom
  }

  function selectResult(result: SearchResult) {
    center.value = result.coordinates
    zoom.value =
      result.type === 'municipality'
        ? 11.5
        : result.type === 'settlement'
          ? 13
          : 17
    if (result.selectionId) openSelection(result.selectionId)
  }

  function openSelection(id: string) {
    clearTimeout(closeTimer)
    selectedId.value = id
    sidebarExpanded.value = true
  }

  function closeSelection() {
    sidebarExpanded.value = false
    clearTimeout(closeTimer)

    if (import.meta.client && window.matchMedia('(max-width: 720px)').matches) {
      selectedId.value = undefined
      return
    }

    closeTimer = setTimeout(() => {
      selectedId.value = undefined
    }, 310)
  }

  function retryMap() {
    mapError.value = ''
    mapLoading.value = true
    mapKey.value += 1
  }

  function resetMapView() {
    center.value = [...DEFAULT_MAP_STATE.center]
    zoom.value = DEFAULT_MAP_STATE.zoom
  }

  function showToolMessage(message: string) {
    toolMessage.value = message
    clearTimeout(toolMessageTimer)
    toolMessageTimer = setTimeout(() => {
      toolMessage.value = ''
    }, 3200)
  }

  function locateNearby() {
    if (!import.meta.client || !navigator.geolocation) {
      showToolMessage('Določanje lokacije v tem brskalniku ni na voljo.')
      return
    }

    locating.value = true
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        center.value = [coords.longitude, coords.latitude]
        zoom.value = 16
        locating.value = false
        showToolMessage('Zemljevid je premaknjen na vašo lokacijo.')
      },
      () => {
        locating.value = false
        showToolMessage('Lokacije ni bilo mogoče določiti.')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  }

  function toggleMapData() {
    if (layers.value.length) {
      visibleLayersBeforeHide = [...layers.value]
      layers.value = []
      measureMode.value = false
      showToolMessage('Podatkovni sloji so skriti.')
      return
    }

    layers.value = visibleLayersBeforeHide.length
      ? [...visibleLayersBeforeHide]
      : [...DEFAULT_VISIBLE_LAYERS]
    showToolMessage('Podatkovni sloji so znova prikazani.')
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && sidebarExpanded.value) closeSelection()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))

  onBeforeUnmount(() => {
    propertyController?.abort()
    clearTimeout(urlTimer)
    clearTimeout(closeTimer)
    clearTimeout(toolMessageTimer)
    window.removeEventListener('keydown', onKeydown)
  })

  return {
    center,
    closeSelection,
    featureCount,
    filters,
    layers,
    locateNearby,
    locating,
    mapError,
    mapKey,
    mapLoading,
    measuredDistance,
    measureMode,
    onMapMove,
    openSelection,
    resetMapView,
    retryMap,
    selectedId,
    selectedProperty,
    selectionError,
    selectionLoading,
    selectResult,
    sidebarExpanded,
    toggleMapData,
    toolMessage,
    zoom,
  }
}
