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

  if (import.meta.client && window.matchMedia('(max-width: 720px)').matches) {
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
  <div
    class="flex h-dvh min-h-[560px] flex-col overflow-hidden max-[720px]:min-h-0 [@media_(max-height:560px)_and_(max-width:1024px)]:min-h-0"
  >
    <main
      class="map-workspace relative min-h-0 flex-1 overflow-hidden [--sidebar-width:clamp(390px,30vw,460px)] max-[720px]:[--mobile-content-top:261px] max-[720px]:[--mobile-toolbar-top:205px] max-[720px]:[--sidebar-width:0px] [@media_(max-height:560px)_and_(max-width:1024px)]:[--mobile-content-top:202px] [@media_(max-height:560px)_and_(max-width:1024px)]:[--mobile-toolbar-top:146px] [@media_(max-height:560px)_and_(max-width:1024px)]:[--sidebar-width:0px]"
      :class="{ 'has-selection': sidebarExpanded }"
    >
      <aside
        class="map-sidebar pointer-events-none absolute top-0 left-0 z-32 isolate h-full w-[var(--sidebar-width)] [--color-accent-soft:#f0efff] [--color-accent-strong:#4940d1] [--color-accent:#5b52e8] [--sidebar-head-height:233px] max-[720px]:inset-x-2.5 max-[720px]:top-2.5 max-[720px]:h-auto max-[720px]:w-auto max-[720px]:min-w-0 max-[720px]:overflow-visible [@media_(max-height:560px)_and_(max-width:1024px)]:top-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:right-auto [@media_(max-height:560px)_and_(max-width:1024px)]:left-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:h-auto [@media_(max-height:560px)_and_(max-width:1024px)]:w-[min(520px,calc(100vw-20px))] [@media_(max-height:560px)_and_(max-width:1024px)]:min-w-0 [@media_(max-height:560px)_and_(max-width:1024px)]:overflow-visible"
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

        <div
          class="sidebar-body absolute right-0 bottom-0 left-0 z-1 flex min-h-0 flex-col overflow-hidden max-[720px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
        >
          <div
            v-if="selectionLoading"
            class="relative min-h-[190px] bg-white"
            aria-live="polite"
          >
            <div
              class="grid gap-3 px-5 py-[34px] [&>span:nth-child(1)]:w-2/5 [&>span:nth-child(2)]:h-[22px] [&>span:nth-child(2)]:w-[82%] [&>span:nth-child(3)]:w-[62%] [&>span:nth-child(4)]:h-[42px] [&>span:nth-child(4)]:w-full [&>span]:h-3 [&>span]:rounded [&>span]:bg-[#e8eeeb]"
            >
              <span /><span /><span /><span />
            </div>
          </div>
          <div
            v-else-if="selectionError"
            class="relative min-h-[190px] bg-white px-[22px] py-[34px]"
            role="alert"
          >
            <button
              class="absolute top-2.5 right-2.5 size-[38px] rounded-[9px] bg-transparent text-[22px] text-ink-muted hover:bg-[#f3f4f8]"
              type="button"
              aria-label="Zapri"
              @click="closeSelection"
            >
              ×
            </button>
            <strong class="text-[15px]">Podatki niso na voljo</strong>
            <p class="text-xs text-ink-muted">{{ selectionError }}</p>
          </div>
          <PropertyDetailsDrawer
            v-else-if="selectedProperty"
            embedded
            :property="selectedProperty"
            @close="closeSelection"
          />
          <EmptySelection v-else class="my-auto" />
        </div>
      </aside>

      <section
        class="map-stage absolute inset-0 min-w-0 overflow-hidden bg-[#e8eeeb]"
        aria-label="Raziskovanje nepremičnin"
      >
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
            <div class="absolute inset-0 grid place-items-center bg-[#e8eeeb]">
              <MapLoadingState />
            </div>
          </template>
        </ClientOnly>

        <div
          class="map-tool-rail absolute top-3.5 right-3.5 z-22 flex w-[132px] flex-col items-stretch gap-2 max-[720px]:inset-x-2.5 max-[720px]:top-[var(--mobile-toolbar-top)] max-[720px]:grid max-[720px]:w-auto max-[720px]:grid-cols-[minmax(96px,1fr)_minmax(82px,0.85fr)_42px_42px] max-[720px]:items-start max-[720px]:gap-1.5 [@media_(max-height:560px)_and_(max-width:1024px)]:top-[var(--mobile-toolbar-top)] [@media_(max-height:560px)_and_(max-width:1024px)]:right-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:left-auto [@media_(max-height:560px)_and_(max-width:1024px)]:grid [@media_(max-height:560px)_and_(max-width:1024px)]:w-[min(360px,calc(100vw-20px))] [@media_(max-height:560px)_and_(max-width:1024px)]:grid-cols-[minmax(96px,1fr)_minmax(82px,0.85fr)_42px_42px] [@media_(max-height:560px)_and_(max-width:1024px)]:items-start [@media_(max-height:560px)_and_(max-width:1024px)]:gap-1.5"
          :class="{
            'max-[720px]:invisible max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
              sidebarExpanded,
          }"
        >
          <MapLayerControl :layers="layers" @change="layers = $event" />
          <PropertyFilters :filters="filters" @change="filters = $event" />
          <button
            type="button"
            class="grid size-[46px] self-end place-items-center rounded-md border border-line/92 bg-white/96 text-[#5148db] shadow-overlay backdrop-blur-[14px] max-[720px]:h-12 max-[720px]:w-[42px] [@media_(max-height:560px)_and_(max-width:1024px)]:h-12 [@media_(max-height:560px)_and_(max-width:1024px)]:w-[42px] [&_svg]:w-[21px]"
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
            class="grid size-[46px] self-end place-items-center rounded-md border border-line/92 bg-white/96 text-[#5148db] no-underline shadow-overlay backdrop-blur-[14px] max-[720px]:h-12 max-[720px]:w-[42px] [@media_(max-height:560px)_and_(max-width:1024px)]:h-12 [@media_(max-height:560px)_and_(max-width:1024px)]:w-[42px] [&_svg]:w-[21px]"
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

        <div
          v-if="mapLoading && !mapError"
          class="absolute top-3.5 left-3.5 z-24 max-[720px]:top-[var(--mobile-content-top)] max-[720px]:left-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:top-[var(--mobile-content-top)] [@media_(max-height:560px)_and_(max-width:1024px)]:left-2.5"
          :class="{
            'max-[720px]:invisible max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
              sidebarExpanded,
          }"
        >
          <MapLoadingState />
        </div>
        <div
          v-if="mapError"
          class="absolute top-3.5 left-3.5 z-24 max-[720px]:top-[var(--mobile-content-top)] max-[720px]:left-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:top-[var(--mobile-content-top)] [@media_(max-height:560px)_and_(max-width:1024px)]:left-2.5"
          :class="{
            'max-[720px]:invisible max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
              sidebarExpanded,
          }"
        >
          <MapErrorState @retry="retryMap" />
        </div>

        <div
          class="map-legend absolute bottom-[18px] left-3.5 z-18 flex min-h-[38px] items-center gap-3.5 rounded-sm border border-line/92 bg-white/96 px-3 shadow-overlay backdrop-blur-[14px] max-[720px]:right-[70px] max-[720px]:left-3 max-[720px]:overflow-hidden [@media_(max-height:560px)_and_(max-width:1024px)]:right-auto [@media_(max-height:560px)_and_(max-width:1024px)]:bottom-3 [@media_(max-height:560px)_and_(max-width:1024px)]:left-3 [@media_(max-height:560px)_and_(max-width:1024px)]:w-max [@media_(max-height:560px)_and_(max-width:1024px)]:max-w-[calc(100vw-82px)] [@media_(max-height:560px)_and_(max-width:1024px)]:overflow-hidden [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&>span]:text-[10px] [&>span]:font-[650] [&>span]:text-ink-muted max-[520px]:[&>span]:text-[9px]"
          :class="{
            'translate-x-[var(--sidebar-width)] max-[720px]:invisible max-[720px]:translate-x-0 max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:translate-x-0 [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
              sidebarExpanded,
          }"
          aria-label="Legenda cenovnih kategorij"
        >
          <span
            ><i class="size-2 rounded-full border-2 border-sale" /> Zaključene
            prodaje</span
          >
          <span
            ><i class="size-2 rotate-45 rounded-sm border-2 border-listing" />
            Aktivni oglasi</span
          >
          <small
            class="border-l border-line pl-2.5 text-[9px] text-ink-muted max-[720px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
            >Cena prikazuje vrednost na m²</small
          >
        </div>

        <div class="absolute right-3.5 bottom-[118px] z-18">
          <MapResultList @select="selectResult" />
        </div>

        <div
          v-if="selectionLoading"
          class="absolute right-0 bottom-0 left-0 z-32 hidden min-h-[180px] rounded-t-[18px] bg-white shadow-[0_-8px_30px_rgb(23_33_31_/_16%)] max-[720px]:block [@media_(max-height:560px)_and_(max-width:1024px)]:block"
          aria-live="polite"
        >
          <div
            class="grid gap-3 px-5 py-[34px] [&>span:nth-child(1)]:w-2/5 [&>span:nth-child(2)]:h-[22px] [&>span:nth-child(2)]:w-[82%] [&>span:nth-child(3)]:w-[62%] [&>span:nth-child(4)]:h-[42px] [&>span:nth-child(4)]:w-full [&>span]:h-3 [&>span]:rounded [&>span]:bg-[#e8eeeb]"
          >
            <span /><span /><span /><span />
          </div>
        </div>
        <div
          v-else-if="selectionError"
          class="absolute right-0 bottom-0 left-0 z-32 hidden min-h-[180px] rounded-t-[18px] bg-white px-5 py-[34px] shadow-[0_-8px_30px_rgb(23_33_31_/_16%)] max-[720px]:block [@media_(max-height:560px)_and_(max-width:1024px)]:block"
          role="alert"
        >
          <button
            class="absolute top-3 right-3 size-11 bg-transparent text-[22px]"
            type="button"
            aria-label="Zapri"
            @click="closeSelection"
          >
            ×
          </button>
          <strong class="text-base">Podatki niso na voljo</strong>
          <p class="text-xs text-ink-muted">{{ selectionError }}</p>
        </div>

        <PropertyBottomSheet
          v-if="selectedProperty"
          class="hidden max-[720px]:block [@media_(max-height:560px)_and_(max-width:1024px)]:block"
          :property="selectedProperty"
          @close="closeSelection"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.map-sidebar::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  border-right: 1px solid #dfe1e9;
  background: white;
  box-shadow: 6px 0 24px rgb(35 38 67 / 8%);
  clip-path: inset(14px 0 calc(100% - 430px) 0 round 18px);
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
  top: var(--sidebar-head-height);
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

.map-stage {
  clip-path: inset(0);
  transition: clip-path 280ms var(--ease-sheet);
}

.map-workspace.has-selection .map-stage {
  clip-path: inset(0 0 0 var(--sidebar-width));
  transition: clip-path 300ms cubic-bezier(0.645, 0.045, 0.355, 1);
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

.map-legend {
  transition: transform 280ms var(--ease-sheet);
}

.map-workspace.has-selection .map-legend {
  transform: translateX(var(--sidebar-width));
  transition: transform 300ms cubic-bezier(0.645, 0.045, 0.355, 1);
}

@media (max-width: 720px) {
  .map-sidebar::before {
    display: none;
  }

  .map-workspace.has-selection .map-stage {
    clip-path: inset(0);
  }

  .map-workspace.has-selection :deep(.maplibregl-ctrl-bottom-right) {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .map-tool-rail :deep(.layer-control) {
    width: 100%;
  }

  .map-tool-rail :deep(.filter-shell) {
    width: 100%;
  }

  .map-tool-rail :deep(.filter-trigger) {
    width: 100%;
    min-width: 0;
    padding: 0 10px;
  }
}

@media (max-width: 520px) {
  .map-tool-rail :deep(.layer-control.expanded) {
    position: fixed;
    z-index: 45;
    top: var(--mobile-toolbar-top);
    right: 10px;
    left: 10px;
    width: auto;
    max-height: calc(100dvh - var(--mobile-toolbar-top) - 10px);
    overflow-y: auto;
    transform: none;
  }

  .map-tool-rail :deep(.filter-panel) {
    position: fixed;
    z-index: 45;
    top: var(--mobile-content-top);
    right: 10px;
    left: 10px;
    width: auto;
    max-height: calc(100dvh - var(--mobile-content-top) - 10px);
  }
}

@media (max-height: 560px) and (max-width: 1024px) {
  .map-sidebar::before,
  .sidebar-body {
    display: none;
  }

  .map-workspace.has-selection .map-stage {
    clip-path: inset(0);
  }

  .map-workspace.has-selection :deep(.maplibregl-ctrl-bottom-right) {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .map-tool-rail :deep(.layer-control),
  .map-tool-rail :deep(.filter-shell) {
    width: 100%;
  }

  .map-tool-rail :deep(.filter-trigger) {
    width: 100%;
    min-width: 0;
    padding: 0 10px;
  }

  .map-tool-rail :deep(.layer-control.expanded) {
    position: fixed;
    z-index: 45;
    top: var(--mobile-toolbar-top);
    right: 10px;
    left: auto;
    width: min(360px, calc(100vw - 20px));
    max-height: calc(100dvh - var(--mobile-toolbar-top) - 10px);
    overflow-y: auto;
  }

  .map-tool-rail :deep(.filter-panel) {
    position: fixed;
    z-index: 45;
    top: var(--mobile-content-top);
    right: 10px;
    left: auto;
    width: min(360px, calc(100vw - 20px));
    max-height: calc(100dvh - var(--mobile-content-top) - 10px);
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
