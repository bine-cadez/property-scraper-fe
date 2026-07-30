<script setup lang="ts">
import type {
  MapFilters,
  MapLayerId,
  Position,
  PropertyRecord,
  SearchResult,
} from '#shared/types/property'
import { parseMapState, serializeMapState } from '#shared/utils/map-state'

const route = useRoute()
const router = useRouter()

const initialState = parseMapState(
  route.query as Record<string, string | string[] | undefined>,
)
const center = ref<Position>(initialState.center)
const zoom = ref(initialState.zoom)
const layers = ref<MapLayerId[]>(initialState.layers)
const { selectedId } = useMapSelection(initialState.selectedId)
const selectedProperty = ref<PropertyRecord>()
const selectionLoading = ref(false)
const selectionError = ref('')
const mapLoading = ref(true)
const mapError = ref('')
const featureCount = ref(0)
const filters = ref<MapFilters>({ propertyTypes: [] })
const mapKey = ref(0)
let propertyController: AbortController | undefined
let urlTimer: ReturnType<typeof setTimeout> | undefined

useSeoMeta({
  title: 'Zemljevid nepremičnin Slovenije | Prostor na dlani',
  description:
    'Raziščite parcele, stavbe, uradne vrednosti, tržne ocene in primerljive prodaje na preglednem zemljevidu Slovenije.',
  robots: 'noindex, follow',
  ogTitle: 'Zemljevid nepremičnin Slovenije',
  ogDescription:
    'Map-first pregled parcel, stavb, vrednosti in zaključenih prodaj.',
})

useHead({
  link: [{ rel: 'canonical', href: '/zemljevid' }],
})

function updateUrl() {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(() => {
    router.replace({
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
  async (id) => {
    propertyController?.abort()
    selectedProperty.value = undefined
    selectionError.value = ''
    if (!id) return
    selectionLoading.value = true
    propertyController = new AbortController()
    try {
      selectedProperty.value = await $fetch<PropertyRecord>(
        `/api/property/${encodeURIComponent(id)}`,
        { signal: propertyController.signal },
      )
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        selectionError.value =
          'Podrobnosti izbranega zapisa trenutno niso na voljo.'
      }
    } finally {
      selectionLoading.value = false
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
  if (result.selectionId) selectedId.value = result.selectionId
}

function retryMap() {
  mapError.value = ''
  mapLoading.value = true
  mapKey.value += 1
}

onBeforeUnmount(() => {
  propertyController?.abort()
  clearTimeout(urlTimer)
})
</script>

<template>
  <div class="map-page">
    <AppHeader compact />
    <main class="map-workspace">
      <section class="map-stage" aria-label="Raziskovanje nepremičnin">
        <ClientOnly>
          <PropertyMap
            :key="mapKey"
            :center="center"
            :zoom="zoom"
            :layers="layers"
            :filters="filters"
            :selected-id="selectedId"
            @select="selectedId = $event"
            @move="onMapMove"
            @loading="mapLoading = $event"
            @error="mapError = $event"
            @count="featureCount = $event"
          />
          <template #fallback>
            <div class="map-fallback"><MapLoadingState /></div>
          </template>
        </ClientOnly>

        <div class="top-tools">
          <MapSearch @select="selectResult" />
          <div class="secondary-tools">
            <MapLayerControl :layers="layers" @change="layers = $event" />
            <PropertyFilters :filters="filters" @change="filters = $event" />
          </div>
        </div>

        <div v-if="mapLoading && !mapError" class="map-status">
          <MapLoadingState />
        </div>
        <div v-if="mapError" class="map-status">
          <MapErrorState @retry="retryMap" />
        </div>

        <div
          class="map-legend map-overlay"
          aria-label="Legenda cenovnih kategorij"
        >
          <span><i class="sale" /> Zaključene prodaje</span>
          <span><i class="listing" /> Aktivni oglasi</span>
          <small>{{ featureCount }} prikazanih zapisov</small>
        </div>

        <div class="result-list-position">
          <MapResultList @select="selectResult" />
        </div>

        <div
          v-if="selectionLoading"
          class="selection-loading"
          aria-live="polite"
        >
          <div class="selection-skeleton"><span /><span /><span /><span /></div>
        </div>
        <div v-else-if="selectionError" class="selection-error" role="alert">
          <button
            type="button"
            aria-label="Zapri"
            @click="selectedId = undefined"
          >
            ×
          </button>
          <strong>Podatki niso na voljo</strong>
          <p>{{ selectionError }}</p>
        </div>

        <PropertyBottomSheet
          v-if="selectedProperty"
          class="mobile-sheet"
          :property="selectedProperty"
          @close="selectedId = undefined"
        />
      </section>

      <Transition name="drawer">
        <PropertyDetailsDrawer
          v-if="selectedProperty"
          class="desktop-drawer"
          :property="selectedProperty"
          @close="selectedId = undefined"
        />
      </Transition>
      <aside v-if="!selectedId" class="empty-rail">
        <EmptySelection />
        <div class="rail-tip">
          <strong>Namig</strong>
          <p>
            Iščete lahko tudi neposredno po parcelni številki ali katastrski
            občini.
          </p>
        </div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
.map-page {
  display: flex;
  height: 100dvh;
  min-height: 560px;
  flex-direction: column;
  overflow: hidden;
}

.map-workspace {
  display: flex;
  min-height: 0;
  flex: 1;
}

.map-stage {
  position: relative;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  background: #e8eeeb;
}

.map-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #e8eeeb;
}

.top-tools {
  position: absolute;
  z-index: 20;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: start;
  gap: 10px;
}

.secondary-tools {
  display: flex;
  gap: 8px;
}

.map-status {
  position: absolute;
  z-index: 24;
  top: 84px;
  left: 16px;
}

.map-legend {
  position: absolute;
  z-index: 18;
  bottom: 22px;
  left: 16px;
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  border-radius: 8px;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: 650;
}

.map-legend i {
  width: 8px;
  height: 8px;
  border: 2px solid;
  border-radius: 50%;
}

.map-legend .sale {
  border-color: var(--color-sale);
}

.map-legend .listing {
  border-color: var(--color-listing);
  border-radius: 2px;
  transform: rotate(45deg);
}

.map-legend small {
  padding-left: 10px;
  border-left: 1px solid var(--color-line);
  color: var(--color-ink-muted);
  font-size: 9px;
}

.result-list-position {
  position: absolute;
  z-index: 18;
  right: 12px;
  bottom: 94px;
}

.empty-rail {
  display: flex;
  width: 340px;
  min-width: 300px;
  flex-direction: column;
  justify-content: center;
  border-left: 1px solid var(--color-line);
  background: white;
}

.rail-tip {
  margin: 0 26px 28px;
  padding: 14px;
  border-left: 2px solid var(--color-warm);
  background: var(--color-warm-soft);
}

.rail-tip strong {
  font-size: 11px;
}

.rail-tip p {
  margin: 5px 0 0;
  color: var(--color-ink-muted);
  font-size: 11px;
  line-height: 1.45;
}

.selection-loading,
.selection-error {
  display: none;
}

.drawer-enter-active,
.drawer-leave-active {
  transition:
    transform 280ms var(--ease-out-expo),
    opacity 180ms ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.mobile-sheet {
  display: none;
}

@media (max-width: 1180px) {
  .empty-rail {
    display: none;
  }
}

@media (max-width: 920px) {
  .top-tools {
    right: 12px;
    left: 12px;
    display: grid;
  }

  .secondary-tools {
    align-items: start;
  }

  .map-status {
    top: 128px;
    left: 12px;
  }
}

@media (max-width: 720px) {
  .desktop-drawer {
    display: none;
  }

  .mobile-sheet {
    display: block;
  }

  .map-legend {
    right: 70px;
    bottom: 18px;
    left: 12px;
    overflow: hidden;
  }

  .map-legend small {
    display: none;
  }

  .selection-loading,
  .selection-error {
    position: absolute;
    z-index: 32;
    right: 0;
    bottom: 0;
    left: 0;
    display: block;
    min-height: 180px;
    border-radius: 18px 18px 0 0;
    background: white;
    box-shadow: 0 -8px 30px rgb(23 33 31 / 16%);
  }

  .selection-skeleton {
    display: grid;
    gap: 12px;
    padding: 34px 20px;
  }

  .selection-skeleton span {
    height: 12px;
    border-radius: 4px;
    background: #e8eeeb;
  }

  .selection-skeleton span:nth-child(1) {
    width: 40%;
  }

  .selection-skeleton span:nth-child(2) {
    width: 82%;
    height: 22px;
  }

  .selection-skeleton span:nth-child(3) {
    width: 62%;
  }

  .selection-skeleton span:nth-child(4) {
    width: 100%;
    height: 42px;
  }

  .selection-error {
    padding: 34px 20px;
  }

  .selection-error button {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    font-size: 22px;
  }

  .selection-error strong {
    font-size: 16px;
  }

  .selection-error p {
    color: var(--color-ink-muted);
    font-size: 12px;
  }
}

@media (max-width: 520px) {
  .top-tools {
    top: 10px;
  }

  .secondary-tools :deep(.layer-control) {
    width: 118px;
  }

  .secondary-tools :deep(.layer-control.expanded) {
    width: min(246px, calc(100vw - 24px));
  }

  .map-legend span {
    font-size: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active,
  .drawer-leave-active {
    transition: opacity 160ms ease;
  }

  .drawer-enter-from,
  .drawer-leave-to {
    transform: none;
  }
}
</style>
