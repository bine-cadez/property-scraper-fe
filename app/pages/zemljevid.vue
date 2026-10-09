<script setup lang="ts">
import {
  ArrowLeft,
  CircleAlert,
  LocateFixed,
  MoreHorizontal,
} from "@lucide/vue";
import type { MapLayerId, MapResultItem } from "#shared/types/property";

const {
  center,
  clearSelection,
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
  selectedListing,
  selectedProperty,
  selectionError,
  selectionLoading,
  selectResult,
  sidebarExpanded,
  toggleMapData,
  toolMessage,
  visibleResults,
  zoom,
} = useMapWorkspace();

const mobileView = ref<"list" | "map">("list");
const resultsLoading = ref(true);
const comparisonItems = ref<MapResultItem[]>([]);
const comparisonOpen = ref(false);
const mapDataError = ref("");

function selectSearchResult(result: Parameters<typeof selectResult>[0]) {
  selectResult(result);
  mobileView.value = "map";
}

function selectVisibleResult(item: MapResultItem) {
  openSelection(item.selectionId);
}

function changeLayers(nextLayers: MapLayerId[]) {
  clearSelection();
  layers.value = nextLayers;
}

function toggleComparison(item: MapResultItem) {
  const index = comparisonItems.value.findIndex(
    (candidate) => candidate.id === item.id,
  );
  if (index >= 0) {
    comparisonItems.value = comparisonItems.value.filter(
      (candidate) => candidate.id !== item.id,
    );
    return;
  }
  if (comparisonItems.value.length >= 2) return;
  comparisonItems.value = [...comparisonItems.value, item];
}

function compareSelectedProperty() {
  if (!selectedProperty.value) return;
  const transaction = selectedProperty.value.transactions[0];
  const unit = selectedProperty.value.units[0];
  const officialValue =
    unit?.officialValue ??
    selectedProperty.value.building?.officialValue ??
    selectedProperty.value.parcel.officialValue;
  const item: MapResultItem = {
    id: transaction?.id ?? selectedProperty.value.id,
    kind: transaction ? "transaction" : "building",
    selectionId: selectedId.value ?? selectedProperty.value.id,
    address: selectedProperty.value.address,
    location: selectedProperty.value.settlement,
    ...(unit ? { unitLabel: `Enota ${unit.id}` } : {}),
    propertyType: selectedProperty.value.propertyType,
    ...(unit?.usableAreaM2 !== undefined
      ? { usableAreaM2: unit.usableAreaM2 }
      : {}),
    ...(unit?.floor !== undefined ? { floor: unit.floor } : {}),
    ...(selectedProperty.value.building?.constructionYear !== undefined
      ? {
          constructionYear: selectedProperty.value.building.constructionYear,
        }
      : {}),
    ...(selectedProperty.value.building?.footprintAreaM2 !== undefined
      ? {
          footprintAreaM2: selectedProperty.value.building.footprintAreaM2,
        }
      : {}),
    ...(selectedProperty.value.building?.unitCount !== undefined
      ? { unitCount: selectedProperty.value.building.unitCount }
      : {}),
    ...(selectedProperty.value.building?.floors !== undefined
      ? { floors: selectedProperty.value.building.floors }
      : {}),
    ...(selectedProperty.value.building?.buildingUse
      ? { buildingUse: selectedProperty.value.building.buildingUse }
      : {}),
    ...(officialValue ? { officialValue: officialValue.amount } : {}),
    status: transaction ? "V preverjanju" : "Ni podatka",
    sourceLabel: transaction?.dataSource.name ?? "GURS",
    ...(transaction
      ? {
          totalPrice: transaction.price.amount,
          pricePerM2: transaction.pricePerM2,
          areaM2: transaction.areaM2,
          transactionDate: transaction.transactionDate,
        }
      : {}),
  };
  toggleComparison(item);
}

useSeoMeta({
  title: "Zemljevid nepremičnin Slovenije | Prostor na dlani",
  description:
    "Raziščite evidentirane prodaje, parcele in stavbe na preglednem zemljevidu Slovenije.",
  robots: "noindex, follow",
  ogTitle: "Zemljevid nepremičnin Slovenije",
  ogDescription:
    "Map-first pregled parcel, stavb in zaključenih prodaj iz GURS in ETN.",
});

useHead({
  link: [{ rel: "canonical", href: "/zemljevid" }],
});
</script>

<template>
  <div
    class="flex h-dvh min-h-[620px] flex-col overflow-hidden bg-surface text-ink max-[720px]:h-auto max-[720px]:min-h-dvh max-[720px]:overflow-visible"
  >
    <MapBrowsePanel
      :filters="filters"
      :layers="layers"
      :feature-count="featureCount"
      :comparison-count="comparisonItems.length"
      :mobile-view="mobileView"
      @select="selectSearchResult"
      @filters-change="filters = $event"
      @layers-change="changeLayers"
      @view-change="mobileView = $event"
      @compare-open="comparisonOpen = true"
    />

    <main
      class="grid min-h-0 flex-1 grid-cols-[400px_minmax(0,1fr)] max-[1100px]:grid-cols-[360px_minmax(0,1fr)] max-[720px]:block max-[720px]:flex-none"
    >
      <aside
        class="relative z-2 min-h-0 min-w-0 overflow-hidden border-r border-[#e2e7e3] bg-surface max-[720px]:min-h-[calc(100dvh-226px)] max-[720px]:overflow-visible max-[720px]:border-r-0"
        :class="mobileView !== 'list' ? 'max-[720px]:hidden' : ''"
      >
        <div v-if="selectionLoading" class="h-full max-[720px]:hidden">
          <PropertyDetailsLoading @close="closeSelection" />
        </div>
        <div
          v-else-if="selectionError"
          class="grid min-h-full content-center gap-3 bg-white p-[30px] max-[720px]:hidden"
          role="alert"
        >
          <button
            type="button"
            class="size-10 border-0 bg-transparent text-xl text-accent"
            aria-label="Nazaj na rezultate"
            @click="closeSelection"
          >
            <ArrowLeft class="size-5" aria-hidden="true" />
          </button>
          <strong>Podatki niso na voljo</strong>
          <p class="m-0 text-xs text-[#74817d]">{{ selectionError }}</p>
        </div>
        <ListingDetailsDrawer
          v-else-if="selectedListing"
          class="max-[720px]:hidden"
          :listing="selectedListing"
          @close="closeSelection"
        />
        <PropertyDetailsDrawer
          v-else-if="selectedProperty"
          embedded
          class="max-[720px]:hidden"
          :property="selectedProperty"
          @close="closeSelection"
          @compare="compareSelectedProperty"
        />
        <ListingMapResultsPanel
          v-else-if="layers.includes('listings')"
          :results="visibleResults"
          :feature-count="featureCount"
          :loading="resultsLoading"
          :selected-id="selectedId"
          @select="selectVisibleResult"
        />
        <MapResultsPanel
          v-else
          :results="visibleResults"
          :feature-count="featureCount"
          :buildings-visible="layers.includes('buildings')"
          :loading="resultsLoading"
          :selected-id="selectedId"
          :comparison-ids="comparisonItems.map((item) => item.id)"
          @select="selectVisibleResult"
          @compare="toggleComparison"
          @open-comparison="comparisonOpen = true"
        />
      </aside>

      <section
        class="relative min-h-0 min-w-0 overflow-hidden bg-[#e8eeeb] max-[720px]:h-[calc(100dvh-226px)] max-[720px]:min-h-[500px]"
        :class="mobileView !== 'map' ? 'max-[720px]:hidden' : ''"
        aria-label="Raziskovanje nepremičnin"
      >
        <ClientOnly>
          <PropertyMap
            :key="mapKey"
            class="absolute inset-0"
            :center="center"
            :zoom="zoom"
            :layers="layers"
            :filters="filters"
            :selected-id="sidebarExpanded ? selectedId : undefined"
            :measure-mode="measureMode"
            @select="openSelection"
            @move="onMapMove"
            @loading="mapLoading = $event"
            @results-loading="resultsLoading = $event"
            @error="mapError = $event"
            @data-error="mapDataError = $event"
            @count="featureCount = $event"
            @results="visibleResults = $event"
            @measure="measuredDistance = $event"
          />
          <template #fallback>
            <div
              class="absolute top-3 left-3 z-25 max-w-[calc(100%_-_24px)] max-[720px]:right-3"
            >
              <MapLoadingState />
            </div>
          </template>
        </ClientOnly>

        <p
          v-if="!mapLoading && !mapError && !mapDataError"
          class="absolute top-[15px] left-3.5 z-20 m-0 hidden rounded-[7px] bg-white px-[13px] py-[11px] text-[10px] text-[#294d43] shadow-[0_3px_12px_rgb(29_68_58_/_9%)] max-[720px]:block"
        >
          {{ visibleResults.length || featureCount }}
          {{ layers.includes("listings") ? "oglasov" : "stavb" }}
          <template v-if="filters.propertyTypes.length">
            · izbrana vrsta</template
          >
          <template v-if="filters.transactionFrom">
            · od {{ filters.transactionFrom.slice(0, 4) }}
          </template>
        </p>

        <div
          v-if="mapLoading && !mapError"
          class="absolute top-3 left-3 z-25 max-w-[calc(100%_-_24px)] max-[720px]:right-3"
        >
          <MapLoadingState />
        </div>
        <div
          v-if="mapError"
          class="absolute top-3 left-3 z-25 max-w-[calc(100%_-_24px)] max-[720px]:right-3"
        >
          <MapErrorState @retry="retryMap" />
        </div>

        <div
          v-if="mapDataError && !mapError"
          class="absolute top-3 left-3 z-25 grid max-w-[360px] grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-[#e6d7ae] bg-[rgb(255_253_245_/_96%)] px-3 py-[11px] text-[#5f5130] shadow-[0_8px_24px_rgb(25_61_53_/_10%)] backdrop-blur-[10px] max-[720px]:right-3 max-[720px]:max-w-none"
          role="status"
        >
          <span
            class="grid size-6 place-items-center rounded-full bg-[#b98a2d] text-xs font-extrabold text-white"
            aria-hidden="true"
            ><CircleAlert class="size-4" aria-hidden="true"
          /></span>
          <p class="m-0 text-[10px] leading-[1.45]">{{ mapDataError }}</p>
          <button
            type="button"
            class="min-h-8 rounded-[5px] border border-[#d8c38e] bg-white px-2.5 text-[9px] font-bold text-inherit"
            @click="retryMap"
          >
            Poskusi znova
          </button>
        </div>

        <button
          type="button"
          class="absolute top-28 right-2.5 z-20 grid size-10 place-items-center rounded-md border border-[#dce2de] bg-white text-accent shadow-[0_3px_12px_rgb(29_68_58_/_9%)]"
          :class="{ 'bg-accent! text-white!': locating }"
          :aria-busy="locating"
          title="Premakni zemljevid na mojo lokacijo"
          @click="locateNearby"
        >
          <LocateFixed
            class="w-[19px]"
            :stroke-width="1.7"
            aria-hidden="true"
          />
        </button>

        <details
          class="absolute right-2.5 bottom-[92px] z-20 max-[720px]:bottom-[72px]"
        >
          <summary
            class="grid size-10 cursor-pointer list-none place-items-center rounded-md border border-[#dce2de] bg-white text-accent shadow-[0_3px_12px_rgb(29_68_58_/_9%)] [&::-webkit-details-marker]:hidden"
            aria-label="Dodatna orodja zemljevida"
          >
            <MoreHorizontal class="size-5" aria-hidden="true" />
          </summary>
          <div
            class="absolute right-0 bottom-12 grid w-[180px] gap-1 rounded-[7px] border border-[#dce2de] bg-white p-1.5 shadow-[0_10px_28px_rgb(29_68_58_/_14%)] [&_button]:min-h-9 [&_button]:rounded-[5px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-left [&_button]:text-[10px] [&_button]:text-[#294d43] [&_button:hover]:bg-accent-soft [&_small]:block [&_small]:text-[8px] [&_small]:text-[#74817d]"
          >
            <button
              type="button"
              :class="{ 'bg-accent-soft!': measureMode }"
              :aria-pressed="measureMode"
              @click="measureMode = !measureMode"
            >
              Izmeri razdaljo
              <small v-if="measuredDistance">{{ measuredDistance }}</small>
            </button>
            <button type="button" @click="toggleMapData">
              {{ layers.length ? "Skrij podatke" : "Pokaži podatke" }}
            </button>
            <button type="button" @click="resetMapView">
              Ponastavi pogled
            </button>
          </div>
        </details>

        <p
          v-if="toolMessage"
          class="absolute right-[60px] bottom-4 z-30 m-0 rounded-md bg-ink px-3 py-[9px] text-[10px] text-white"
          role="status"
        >
          {{ toolMessage }}
        </p>

        <p
          class="absolute bottom-[15px] left-4 z-18 m-0 rounded-md bg-white/92 px-3 py-2.5 text-[9px] text-[#74817d] shadow-[0_3px_12px_rgb(29_68_58_/_8%)] backdrop-blur-[10px] max-[720px]:hidden"
        >
          {{
            layers.includes("listings")
              ? "Aktivni prodajni in najemni oglasi"
              : "Stavbe in ocenjene vrednosti"
          }}
          <span aria-hidden="true">·</span>
          <span v-if="zoom < 12"
            >skupine stavb se razprejo s približevanjem</span
          >
          <span v-else>vidne stavbe na prikazanem območju</span>
        </p>

        <button
          type="button"
          class="absolute right-4 bottom-3.5 left-4 z-21 hidden min-h-[46px] rounded-lg border-0 bg-accent text-[11px] font-bold text-white shadow-[0_8px_24px_rgb(25_61_53_/_22%)] max-[720px]:block"
          @click="mobileView = 'list'"
        >
          Prikaži seznam · {{ visibleResults.length || featureCount }}
        </button>
      </section>
    </main>

    <div
      v-if="
        (selectedProperty ||
          selectedListing ||
          selectionLoading ||
          selectionError) &&
        sidebarExpanded
      "
      class="fixed inset-0 z-70 hidden overflow-y-auto bg-surface max-[720px]:block"
    >
      <div v-if="selectionLoading">
        <PropertyDetailsLoading @close="closeSelection" />
      </div>
      <div
        v-else-if="selectionError"
        class="grid min-h-dvh content-center gap-3 bg-white p-[30px]"
        role="alert"
      >
        <button
          type="button"
          class="size-10 border-0 bg-transparent text-xl text-accent"
          aria-label="Nazaj"
          @click="closeSelection"
        >
          <ArrowLeft class="size-5" aria-hidden="true" />
        </button>
        <strong>Podatki niso na voljo</strong>
        <p class="m-0 text-xs text-[#74817d]">{{ selectionError }}</p>
      </div>
      <ListingDetailsDrawer
        v-else-if="selectedListing"
        :listing="selectedListing"
        @close="closeSelection"
      />
      <PropertyDetailsDrawer
        v-else-if="selectedProperty"
        embedded
        :property="selectedProperty"
        @close="closeSelection"
        @compare="compareSelectedProperty"
      />
    </div>

    <PropertyComparison
      v-if="comparisonOpen"
      :items="comparisonItems"
      @close="comparisonOpen = false"
      @change-selection="comparisonOpen = false"
      @select="
        selectSearchResult($event);
        comparisonOpen = false;
      "
    />
  </div>
</template>
