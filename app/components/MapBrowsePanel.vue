<script setup lang="ts">
import { Building2, Info, Layers3, Map } from "@lucide/vue";
import type {
  MapFilters,
  MapLayerId,
  SearchResult,
} from "#shared/types/property";

const props = defineProps<{
  filters: MapFilters;
  layers: MapLayerId[];
  featureCount: number;
  comparisonCount: number;
  mobileView: "list" | "map";
}>();

const emit = defineEmits<{
  select: [result: SearchResult];
  filtersChange: [filters: MapFilters];
  layersChange: [layers: MapLayerId[]];
  viewChange: [view: "list" | "map"];
  compareOpen: [];
}>();

const propertyTypeOptions = [
  { value: "all", label: "Vse vrste stavb" },
  { value: "apartment", label: "Stanovanjske stavbe" },
  { value: "house", label: "Hiše" },
  { value: "office", label: "Poslovne stavbe" },
  { value: "retail", label: "Trgovske stavbe" },
];
const listingsMode = computed(() => props.layers.includes("listings"));
const priceOptions = [
  { value: "all", label: "Vse vrednosti" },
  { value: "under-200", label: "Do 200.000 €" },
  { value: "200-500", label: "200–500 tisoč €" },
  { value: "over-500", label: "Nad 500.000 €" },
];
const areaOptions = [
  { value: "all", label: "Vse površine" },
  { value: "100", label: "Vsaj 100 m²" },
  { value: "300", label: "Vsaj 300 m²" },
  { value: "500", label: "Vsaj 500 m²" },
];
const yearOptions = [
  { value: "all", label: "Vsa leta" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
];

const hasFilters = computed(
  () =>
    props.filters.propertyTypes.length > 0 ||
    Object.entries(props.filters).some(
      ([key, value]) => key !== "propertyTypes" && value !== undefined,
    ),
);

const priceChoice = computed(() => {
  if (
    props.filters.maxPrice === 200_000 &&
    props.filters.minPrice === undefined
  )
    return "under-200";
  if (props.filters.minPrice === 200_000 && props.filters.maxPrice === 500_000)
    return "200-500";
  if (
    props.filters.minPrice === 500_000 &&
    props.filters.maxPrice === undefined
  )
    return "over-500";
  return "all";
});

const typeChoice = computed(() => props.filters.propertyTypes[0] ?? "all");
const areaChoice = computed(() =>
  props.filters.minAreaM2 ? String(props.filters.minAreaM2) : "all",
);
const yearChoice = computed(
  () => props.filters.constructionYearFrom?.toString() ?? "all",
);

function update(partial: Partial<MapFilters>) {
  emit("filtersChange", { ...props.filters, ...partial });
}

function setPrice(value: string) {
  const next = { ...props.filters };
  delete next.minPrice;
  delete next.maxPrice;
  if (value === "under-200") next.maxPrice = 200_000;
  if (value === "200-500") {
    next.minPrice = 200_000;
    next.maxPrice = 500_000;
  }
  if (value === "over-500") next.minPrice = 500_000;
  emit("filtersChange", next);
}

function setType(value: string) {
  update({
    propertyTypes:
      value === "all" ? [] : [value as MapFilters["propertyTypes"][number]],
  });
}

function setArea(value: string) {
  const next = { ...props.filters };
  if (value === "all") delete next.minAreaM2;
  else next.minAreaM2 = Number(value);
  emit("filtersChange", next);
}

function setYear(value: string) {
  const next = { ...props.filters };
  if (value === "all") delete next.constructionYearFrom;
  else next.constructionYearFrom = Number(value);
  emit("filtersChange", next);
}

function resetFilters() {
  emit("filtersChange", { propertyTypes: [] });
}
</script>

<template>
  <header
    class="relative z-40 border-b border-[#e5e9e5] bg-white text-ink max-[720px]:sticky max-[720px]:top-0"
    aria-label="Iskanje in filtri nepremičnin"
  >
    <div
      class="grid min-h-[82px] grid-cols-[150px_minmax(280px,365px)_1fr_auto_auto] items-center gap-[18px] px-7 max-[960px]:grid-cols-[136px_minmax(240px,1fr)_auto_auto] max-[720px]:min-h-0 max-[720px]:grid-cols-[1fr_auto] max-[720px]:gap-x-2.5 max-[720px]:gap-y-0 max-[720px]:px-3 max-[720px]:pt-3.5 max-[720px]:pb-2"
    >
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-xl text-ink no-underline"
        aria-label="Prostor, domov"
      >
        <span
          class="grid size-[30px] place-items-center rounded-[7px] bg-accent text-white"
          aria-hidden="true"
        >
          <Map class="w-[19px]" :stroke-width="1.55" />
        </span>
        <strong>prostor.</strong>
      </NuxtLink>

      <MapSearch
        class="w-full max-[720px]:col-span-full max-[720px]:mt-3.5 [&_.search-box]:min-h-[50px] [&_.search-box]:rounded-lg [&_.search-box]:border-[#e0e5e1] [&_.search-box]:shadow-none [&_.search-box:focus-within]:border-accent [&_.search-box:focus-within]:shadow-[0_0_0_3px_rgb(49_95_82_/_12%)] max-[720px]:[&_.search-box]:min-h-[46px] [&_.search-input]:h-12 [&_.search-input]:text-xs [&_kbd]:hidden"
        @select="emit('select', $event)"
      />

      <button
        type="button"
        class="inline-flex min-h-[42px] items-center gap-2 justify-self-end whitespace-nowrap border-0 bg-transparent text-[11px] font-[680] text-[#294d43] max-[720px]:hidden"
        @click="emit('compareOpen')"
      >
        <Layers3 class="w-[18px]" :stroke-width="1.7" aria-hidden="true" />
        <span>Primerjava</span>
        <b
          v-if="comparisonCount"
          class="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#eaf2d4] text-[9px]"
          >{{ comparisonCount }}</b
        >
      </button>

      <NuxtLink
        class="inline-flex min-h-[42px] items-center gap-2 justify-self-end whitespace-nowrap text-[11px] font-[680] text-[#294d43] no-underline max-[960px]:hidden"
        to="/viri-podatkov"
      >
        <Info class="size-4" aria-hidden="true" />
        <span>O podatkih</span>
      </NuxtLink>

      <MapLayerControl
        class="hidden max-[720px]:col-start-2 max-[720px]:row-start-1 max-[720px]:block max-[720px]:size-[42px] max-[720px]:self-center max-[720px]:justify-self-end max-[720px]:border-0 max-[720px]:shadow-none max-[720px]:[&_.layer-icon]:grid max-[720px]:[&_.layer-label]:sr-only max-[720px]:[&_.layer-trigger]:size-[42px]"
        :layers="layers"
        @change="emit('layersChange', $event)"
      />
    </div>

    <div
      class="flex min-h-[68px] items-center gap-2.5 px-7 max-[720px]:min-h-14 max-[720px]:gap-2 max-[720px]:px-3 max-[720px]:pb-2"
    >
      <MapDatasetPicker
        :layers="layers"
        @change="emit('layersChange', $event)"
      />

      <BaseSelect
        class="min-w-[170px] max-[720px]:hidden"
        :model-value="typeChoice"
        :options="propertyTypeOptions"
        :label="listingsMode ? 'Vrsta oglasa' : 'Vrsta stavbe'"
        :eyebrow="listingsMode ? 'Vrsta oglasa' : 'Vrsta stavbe'"
        trigger-class="min-h-[48px]"
        :active="typeChoice !== 'all'"
        @change="setType"
      />

      <BaseSelect
        class="min-w-[166px] max-[720px]:min-w-0 max-[720px]:flex-1"
        :model-value="priceChoice"
        :options="priceOptions"
        :label="listingsMode ? 'Zahtevana cena' : 'Ocenjena vrednost'"
        :eyebrow="listingsMode ? 'Zahtevana cena' : 'Ocenjena vrednost'"
        trigger-class="min-h-[48px]"
        :active="priceChoice !== 'all'"
        @change="setPrice"
      />

      <BaseSelect
        class="min-w-[132px] max-[720px]:hidden"
        :model-value="areaChoice"
        :options="areaOptions"
        :label="listingsMode ? 'Površina oglasa' : 'Površina stavbe'"
        :eyebrow="listingsMode ? 'Površina oglasa' : 'Površina stavbe'"
        trigger-class="min-h-[48px]"
        :active="areaChoice !== 'all'"
        @change="setArea"
      />

      <BaseSelect
        v-if="!listingsMode"
        class="min-w-[142px] max-[720px]:hidden"
        :model-value="yearChoice"
        :options="yearOptions"
        label="Leto izgradnje"
        eyebrow="Leto izgradnje"
        trigger-class="min-h-[48px]"
        :active="yearChoice !== 'all'"
        @change="setYear"
      />

      <PropertyFilters
        class="[&_button:first-child]:min-w-[112px]"
        :filters="filters"
        :result-count="featureCount"
        :listings="listingsMode"
        @change="emit('filtersChange', $event)"
      />

      <button
        v-if="hasFilters"
        type="button"
        class="ml-auto min-h-[38px] border-0 bg-transparent text-[10px] font-[650] text-[#466057] max-[720px]:hidden"
        @click="resetFilters"
      >
        Počisti filtre
      </button>
    </div>

    <div
      class="mx-3 mb-2.5 hidden grid-cols-2 gap-[3px] rounded-[7px] bg-[#f1f3f1] p-[3px] max-[720px]:grid"
      aria-label="Način prikaza"
    >
      <button
        type="button"
        class="min-h-[38px] rounded-md border-0 bg-transparent text-[11px] font-[670] text-[#496057]"
        :class="{
          'bg-white! text-ink! shadow-[0_1px_5px_rgb(29_68_58_/_8%)]':
            mobileView === 'list',
        }"
        :aria-pressed="mobileView === 'list'"
        @click="emit('viewChange', 'list')"
      >
        <Building2
          class="mr-1 inline w-4"
          :stroke-width="1.6"
          aria-hidden="true"
        />
        Seznam
      </button>
      <button
        type="button"
        class="min-h-[38px] rounded-md border-0 bg-transparent text-[11px] font-[670] text-[#496057]"
        :class="{
          'bg-white! text-ink! shadow-[0_1px_5px_rgb(29_68_58_/_8%)]':
            mobileView === 'map',
        }"
        :aria-pressed="mobileView === 'map'"
        @click="emit('viewChange', 'map')"
      >
        <Map class="mr-1 inline w-4" :stroke-width="1.6" aria-hidden="true" />
        Zemljevid
      </button>
    </div>
  </header>
</template>
