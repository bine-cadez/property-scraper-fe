<script setup lang="ts">
const {
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
  toggleOfficialValues,
  toolMessage,
  zoom,
} = useMapWorkspace()

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
            :measure-mode="measureMode"
            @select="openSelection"
            @move="onMapMove"
            @loading="mapLoading = $event"
            @error="mapError = $event"
            @count="featureCount = $event"
            @measure="measuredDistance = $event"
          />
          <template #fallback>
            <div class="absolute inset-0 grid place-items-center bg-[#e8eeeb]">
              <MapLoadingState />
            </div>
          </template>
        </ClientOnly>

        <nav
          class="map-tool-rail"
          :class="{
            'max-[720px]:invisible max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
              sidebarExpanded,
          }"
          aria-label="Orodja zemljevida"
        >
          <NuxtLink
            class="tool-button tool-profile"
            to="/o-projektu"
            title="O projektu"
            aria-label="O projektu"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle
                cx="24"
                cy="17"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              />
              <path
                d="M10 41v-3c0-6.1 4.9-11 11-11h6c6.1 0 11 4.9 11 11v3"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </NuxtLink>

          <div class="rail-actions">
            <MapLayerControl :layers="layers" @change="layers = $event" />
            <PropertyFilters :filters="filters" @change="filters = $event" />
            <button
              type="button"
              class="tool-button"
              :class="{ active: locating }"
              :aria-busy="locating"
              title="Premakni zemljevid na mojo lokacijo"
              @click="locateNearby"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="6"
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
              <span class="tool-label">{{
                locating ? 'Iščem lokacijo' : 'V bližini'
              }}</span>
            </button>
            <button
              type="button"
              class="tool-button"
              :class="{ active: measureMode }"
              :aria-pressed="measureMode"
              title="Izmeri razdaljo med dvema točkama"
              @click="measureMode = !measureMode"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m5 16 11-11 3 3L8 19H5v-3Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linejoin="round"
                />
                <path
                  d="m12.5 8.5 3 3M9.5 11.5l1.5 1.5M15.5 5.5l3 3"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
              </svg>
              <span class="tool-label">Razdalja</span>
              <small v-if="measuredDistance">{{ measuredDistance }}</small>
            </button>
            <button
              type="button"
              class="tool-button tool-policy"
              :class="{ active: layers.includes('officialValue') }"
              :aria-pressed="layers.includes('officialValue')"
              title="Prikaži uradne vrednosti"
              @click="toggleOfficialValues"
            >
              <i v-if="!layers.includes('officialValue')" aria-hidden="true" />
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 3h7l4 4v14H7V3Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linejoin="round"
                />
                <path
                  d="M14 3v5h4M10 12h5M10 16h5"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
              <span class="tool-label">Uradne vrednosti</span>
            </button>
            <button
              type="button"
              class="tool-button"
              :class="{ active: layers.length === 0 }"
              :aria-pressed="layers.length === 0"
              title="Skrij ali prikaži podatkovne sloje"
              @click="toggleMapData"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  v-if="layers.length"
                  d="M3 12s3.3-5 9-5 9 5 9 5-3.3 5-9 5-9-5-9-5Z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <circle
                  v-if="layers.length"
                  cx="12"
                  cy="12"
                  r="2.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <path
                  v-if="!layers.length"
                  d="M3 4.5 20.5 20M9.7 7.3A8 8 0 0 1 12 7c5.7 0 9 5 9 5a14 14 0 0 1-2.2 2.6M6.2 8.7C4.1 10.1 3 12 3 12s3.3 5 9 5c1 0 1.9-.2 2.7-.4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
              <span class="tool-label">{{
                layers.length ? 'Skrij sloje' : 'Pokaži sloje'
              }}</span>
            </button>
            <button
              type="button"
              class="tool-button tool-reset"
              title="Ponastavi pogled na Ljubljano"
              aria-label="Ponastavi pogled na Ljubljano"
              @click="resetMapView"
            >
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M7 6.5 16 3l9 3.5v17L16 21l-9 3.5v-18Z" />
                <path
                  d="M16 3v18"
                  fill="none"
                  stroke="white"
                  stroke-width="1.8"
                  stroke-opacity=".72"
                />
              </svg>
            </button>
          </div>
        </nav>

        <p
          v-if="toolMessage"
          class="tool-message"
          role="status"
          aria-live="polite"
        >
          {{ toolMessage }}
        </p>

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
            'max-[720px]:invisible max-[720px]:pointer-events-none max-[720px]:opacity-0 [@media_(max-height:560px)_and_(max-width:1024px)]:invisible [@media_(max-height:560px)_and_(max-width:1024px)]:pointer-events-none [@media_(max-height:560px)_and_(max-width:1024px)]:opacity-0':
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

        <div class="absolute right-[84px] bottom-[118px] z-18">
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

.map-tool-rail {
  position: absolute;
  z-index: 22;
  top: 16px;
  right: 16px;
  display: flex;
  width: 48px;
  flex-direction: column;
  align-items: flex-end;
  transition:
    opacity 160ms ease,
    visibility 160ms ease;
}

.rail-actions {
  display: flex;
  width: 48px;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.tool-button {
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #e1e3ea;
  border-radius: 10px;
  color: #4f5360;
  background: rgb(255 255 255 / 95%);
  box-shadow: 0 4px 14px rgb(42 45 67 / 10%);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.12;
  text-align: center;
  text-decoration: none;
  backdrop-filter: blur(12px);
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms var(--ease-out-expo);
}

.tool-button:hover {
  color: #4c43d0;
  background: white;
}

.tool-button:active {
  transform: scale(0.97);
}

.tool-button.active {
  border-color: #6259dc;
  color: white;
  background: #5b52c8;
  box-shadow: 0 4px 14px rgb(72 64 209 / 20%);
}

.tool-button small {
  position: absolute;
  top: 50%;
  right: calc(100% + 8px);
  width: max-content;
  max-width: 90px;
  overflow: hidden;
  border: 1px solid #e1e3ea;
  border-radius: 6px;
  color: #4f5360;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 3px 10px rgb(42 45 67 / 10%);
  padding: 4px 6px;
  font-size: 9px;
  font-weight: 750;
  text-overflow: ellipsis;
  transform: translateY(-50%);
  white-space: nowrap;
}

.tool-button > svg:not(.tool-profile svg) {
  width: 21px;
}

.tool-label,
.map-tool-rail :deep(.filter-label),
.map-tool-rail :deep(.layer-label) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.map-tool-rail :deep(.layer-icon) {
  display: grid;
  width: 20px;
}

.tool-profile svg {
  width: 30px;
}

.tool-policy i {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border: 2px solid white;
  border-radius: 999px;
  background: #e94b52;
}

.tool-reset {
  color: #5b52e8;
}

.tool-reset svg {
  width: 26px;
  filter: drop-shadow(0 2px 2px rgb(72 64 209 / 14%));
  fill: currentColor;
}

.map-tool-rail :deep(.filter-shell) {
  align-self: flex-end;
}

.map-tool-rail :deep(.filter-panel) {
  position: fixed;
  top: 16px;
  right: 84px;
  left: auto;
  max-height: calc(100dvh - 48px);
}

.map-tool-rail :deep(.filter-panel .apply) {
  background: #5b52e8;
}

.tool-message {
  position: absolute;
  z-index: 24;
  top: 16px;
  right: 84px;
  max-width: 270px;
  margin: 0;
  border: 1px solid rgb(218 221 237 / 82%);
  border-radius: 9px;
  color: #3f4350;
  background: rgb(255 255 255 / 97%);
  box-shadow: 0 8px 24px rgb(42 45 67 / 14%);
  padding: 11px 13px;
  font-size: 11px;
  font-weight: 650;
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

  .map-tool-rail {
    top: var(--mobile-toolbar-top);
    right: 10px;
    bottom: auto;
    left: 10px;
    width: auto;
  }

  .tool-profile {
    display: none;
  }

  .rail-actions {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    margin-top: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .rail-actions::-webkit-scrollbar {
    display: none;
  }

  .tool-button {
    width: 48px;
    height: 44px;
    flex: 0 0 48px;
    border-radius: 8px;
    font-size: 11px;
  }

  .tool-reset svg {
    width: 32px;
  }

  .map-tool-rail :deep(.layer-control),
  .map-tool-rail :deep(.filter-shell) {
    width: 48px;
    flex: 0 0 48px;
  }

  .map-tool-rail :deep(.filter-trigger) {
    width: 48px;
    height: 44px;
    min-width: 0;
    padding: 0 10px;
    font-size: 11px;
  }

  .map-tool-rail :deep(.layer-trigger) {
    height: 44px;
    font-size: 11px;
  }

  .map-tool-rail :deep(.layer-control.expanded) {
    position: fixed;
    z-index: 45;
    top: var(--mobile-toolbar-top);
    right: 10px;
    left: 10px;
    width: auto;
    max-height: calc(100dvh - var(--mobile-toolbar-top) - 10px);
    overflow-y: auto;
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

  .tool-message {
    top: var(--mobile-content-top);
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .tool-button small {
    display: none;
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

  .map-tool-rail {
    top: var(--mobile-toolbar-top);
    right: 10px;
    bottom: auto;
    left: auto;
    width: min(360px, calc(100vw - 20px));
  }

  .tool-profile {
    display: none;
  }

  .rail-actions {
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    margin-top: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .rail-actions::-webkit-scrollbar {
    display: none;
  }

  .tool-button {
    width: 48px;
    height: 44px;
    flex: 0 0 48px;
    font-size: 11px;
  }

  .map-tool-rail :deep(.filter-trigger) {
    width: 48px;
    height: 44px;
    min-width: 0;
    padding: 0 10px;
    font-size: 11px;
  }

  .map-tool-rail :deep(.layer-trigger) {
    height: 44px;
    font-size: 11px;
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
