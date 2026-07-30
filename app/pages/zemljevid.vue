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
const sidebarExpanded = ref(Boolean(initialState.selectedId))
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
let closeTimer: ReturnType<typeof setTimeout> | undefined

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

  if (
    import.meta.client &&
    window.matchMedia('(max-width: 720px)').matches
  ) {
    selectedId.value = undefined
    return
  }

  closeTimer = setTimeout(() => {
    selectedId.value = undefined
  }, 310)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && sidebarExpanded.value) {
    closeSelection()
  }
}

function retryMap() {
  mapError.value = ''
  mapLoading.value = true
  mapKey.value += 1
}

function resetMapView() {
  center.value = [14.5038, 46.0568]
  zoom.value = 14.9
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  propertyController?.abort()
  clearTimeout(urlTimer)
  clearTimeout(closeTimer)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="map-page">
    <main
      class="map-workspace"
      :class="{ 'has-selection': sidebarExpanded }"
    >
      <aside
        class="map-sidebar"
        :class="{ 'is-expanded': sidebarExpanded }"
        aria-label="Raziskovanje nepremičnin"
      >
        <MapBrowsePanel
          embedded
          :selected="Boolean(selectedId)"
          :expanded="sidebarExpanded"
          :filters="filters"
          :layers="layers"
          :feature-count="featureCount"
          @select="selectResult"
          @filters-change="filters = $event"
          @layers-change="layers = $event"
        />

        <div class="sidebar-body">
          <div
            v-if="selectionLoading"
            class="sidebar-loading"
            aria-live="polite"
          >
            <div class="selection-skeleton">
              <span /><span /><span /><span />
            </div>
          </div>
          <div v-else-if="selectionError" class="sidebar-error" role="alert">
            <button
              type="button"
              aria-label="Zapri"
              @click="closeSelection"
            >
              ×
            </button>
            <strong>Podatki niso na voljo</strong>
            <p>{{ selectionError }}</p>
          </div>
          <PropertyDetailsDrawer
            v-else-if="selectedProperty"
            embedded
            :property="selectedProperty"
            @close="closeSelection"
          />
          <EmptySelection v-else class="sidebar-empty" />
        </div>
      </aside>

      <section class="map-stage" aria-label="Raziskovanje nepremičnin">
        <ClientOnly>
          <PropertyMap
            :key="mapKey"
            :center="center"
            :zoom="zoom"
            :layers="layers"
            :filters="filters"
            :selected-id="selectedId"
            @select="openSelection"
            @move="onMapMove"
            @loading="mapLoading = $event"
            @error="mapError = $event"
            @count="featureCount = $event"
          />
          <template #fallback>
            <div class="map-fallback"><MapLoadingState /></div>
          </template>
        </ClientOnly>

        <div class="map-tool-rail">
          <MapLayerControl :layers="layers" @change="layers = $event" />
          <PropertyFilters
            :filters="filters"
            @change="filters = $event"
          />
          <button
            type="button"
            class="rail-button map-overlay"
            title="Ponastavi pogled na Ljubljano"
            aria-label="Ponastavi pogled na Ljubljano"
            @click="resetMapView"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <NuxtLink
            class="rail-button map-overlay"
            to="/"
            title="Začetna stran"
            aria-label="Začetna stran"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m4 11 8-7 8 7v9h-6v-5h-4v5H4v-9Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
          </NuxtLink>
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
          <small>Cena prikazuje vrednost na m²</small>
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
            @click="closeSelection"
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
          @close="closeSelection"
        />
      </section>

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
  --sidebar-width: clamp(390px, 30vw, 460px);
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.map-sidebar {
  --sidebar-head-height: 233px;
  --color-accent: #5b52e8;
  --color-accent-strong: #4940d1;
  --color-accent-soft: #f0efff;
  position: absolute;
  z-index: 32;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100%;
  pointer-events: none;
  isolation: isolate;
}

.map-sidebar::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  border-right: 1px solid #dfe1e9;
  background: white;
  box-shadow: 6px 0 24px rgb(35 38 67 / 8%);
  clip-path: inset(
    14px 0 calc(100% - 430px) 0 round 18px
  );
  content: '';
  opacity: 0;
  transition:
    clip-path 300ms var(--ease-sheet),
    opacity 170ms ease 110ms;
}

.map-sidebar.is-expanded {
  pointer-events: auto;
}

.map-sidebar.is-expanded::before {
  clip-path: inset(0 round 0);
  opacity: 1;
  transition:
    clip-path 340ms cubic-bezier(0.645, 0.045, 0.355, 1),
    opacity 140ms ease;
}

.map-sidebar :deep(.browse-panel) {
  pointer-events: auto;
}

.sidebar-body {
  position: absolute;
  z-index: 1;
  top: var(--sidebar-head-height);
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-12px);
  visibility: hidden;
  transition:
    transform 260ms var(--ease-out-expo),
    opacity 150ms ease,
    visibility 0s linear 260ms;
}

.map-sidebar.is-expanded .sidebar-body {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  visibility: visible;
  transition:
    transform 300ms var(--ease-out-expo) 70ms,
    opacity 180ms ease 70ms,
    visibility 0s;
}

.sidebar-empty {
  margin: auto 0;
}

.sidebar-loading,
.sidebar-error {
  position: relative;
  min-height: 190px;
  background: white;
}

.sidebar-error {
  padding: 34px 22px;
}

.sidebar-error button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 9px;
  color: var(--color-ink-muted);
  background: transparent;
  font-size: 22px;
}

.sidebar-error button:hover {
  background: #f3f4f8;
}

.sidebar-error strong {
  font-size: 15px;
}

.sidebar-error p {
  color: var(--color-ink-muted);
  font-size: 12px;
}

.map-stage {
  position: absolute;
  inset: 0;
  min-width: 0;
  overflow: hidden;
  background: #e8eeeb;
  clip-path: inset(0);
  transition: clip-path 280ms var(--ease-sheet);
}

.map-workspace.has-selection .map-stage {
  clip-path: inset(0 0 0 var(--sidebar-width));
  transition:
    clip-path 300ms cubic-bezier(0.645, 0.045, 0.355, 1);
}

.map-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: #e8eeeb;
}

.map-tool-rail {
  position: absolute;
  z-index: 22;
  top: 14px;
  right: 14px;
  display: flex;
  width: 132px;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.map-tool-rail :deep(.filter-shell) {
  align-self: flex-end;
}

.map-tool-rail :deep(.filter-trigger) {
  color: white;
  background: #5b52e8;
  box-shadow: 0 8px 22px rgb(72 64 209 / 24%);
}

.map-tool-rail :deep(.filter-trigger svg) {
  color: white;
}

.map-tool-rail :deep(.filter-panel) {
  right: 0;
  left: auto;
}

.map-tool-rail :deep(.filter-panel .apply) {
  background: #5b52e8;
}

.rail-button {
  display: grid;
  width: 46px;
  height: 46px;
  align-self: flex-end;
  place-items: center;
  border-radius: 12px;
  color: #5148db;
  text-decoration: none;
}

.rail-button svg {
  width: 21px;
}

.map-status {
  position: absolute;
  z-index: 24;
  top: 14px;
  left: 14px;
}

.map-legend {
  position: absolute;
  z-index: 18;
  bottom: 18px;
  left: 14px;
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  border-radius: 8px;
  transition: transform 280ms var(--ease-sheet);
}

.map-workspace.has-selection .map-legend {
  transform: translateX(var(--sidebar-width));
  transition:
    transform 300ms cubic-bezier(0.645, 0.045, 0.355, 1);
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
  right: 14px;
  bottom: 118px;
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

.selection-loading,
.selection-error {
  display: none;
}

.mobile-sheet {
  display: none;
}

@media (max-width: 720px) {
  .map-workspace {
    --sidebar-width: 0px;
  }

  .map-sidebar {
    position: absolute;
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    min-width: 0;
    height: auto;
    overflow: visible;
    border: 0;
    background: transparent;
    box-shadow: none;
    pointer-events: none;
  }

  .map-sidebar::before {
    display: none;
  }

  .map-sidebar :deep(.browse-panel) {
    pointer-events: auto;
  }

  .sidebar-body {
    display: none;
  }

  .map-workspace.has-selection .map-stage {
    clip-path: inset(0);
  }

  .map-workspace.has-selection .map-legend {
    transform: none;
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

  .map-tool-rail {
    top: 219px;
    right: 10px;
    width: 118px;
  }

  .map-status {
    top: 219px;
    left: 10px;
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
  .map-tool-rail :deep(.layer-control) {
    width: 118px;
  }

  .map-tool-rail :deep(.layer-control.expanded) {
    width: min(246px, calc(100vw - 24px));
    transform: translateX(calc(118px - min(246px, calc(100vw - 24px))));
  }

  .map-tool-rail :deep(.filter-panel) {
    position: fixed;
    z-index: 45;
    top: 219px;
    right: 10px;
    left: 10px;
    width: auto;
    max-height: calc(100dvh - 233px);
  }

  .map-legend span {
    font-size: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .map-sidebar::before,
  .sidebar-body,
  .map-stage,
  .map-legend {
    transform: none;
    transition: opacity 160ms ease;
  }

  .map-workspace.has-selection .map-stage {
    clip-path: inset(0 0 0 var(--sidebar-width));
  }
}

</style>
