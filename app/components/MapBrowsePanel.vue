<script setup lang="ts">
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
  props.filters.minParcelAreaM2 ? String(props.filters.minParcelAreaM2) : "all",
);
const yearChoice = computed(
  () => props.filters.transactionFrom?.slice(0, 4) ?? "all",
);

function update(partial: Partial<MapFilters>) {
  emit("filtersChange", { ...props.filters, ...partial });
}

function setPrice(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
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

function setType(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  update({
    propertyTypes:
      value === "all" ? [] : [value as MapFilters["propertyTypes"][number]],
  });
}

function setArea(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const next = { ...props.filters };
  if (value === "all") delete next.minParcelAreaM2;
  else next.minParcelAreaM2 = Number(value);
  emit("filtersChange", next);
}

function setYear(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const next = { ...props.filters };
  if (value === "all") delete next.transactionFrom;
  else next.transactionFrom = `${value}-01-01`;
  emit("filtersChange", next);
}

function resetFilters() {
  emit("filtersChange", { propertyTypes: [] });
}

function showSales() {
  emit("layersChange", ["transactions", "priceM2"]);
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
          <svg
            class="w-[19px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.55]"
            viewBox="0 0 24 24"
          >
            <path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2V5Z" />
            <path d="M9 3v16M15 5v16" />
          </svg>
        </span>
        <strong>prostor.</strong>
      </NuxtLink>

      <MapSearch
        class="w-full max-[720px]:col-span-full max-[720px]:mt-3.5 [&_.search-box]:min-h-[50px] [&_.search-box]:rounded-lg [&_.search-box]:border-[#e0e5e1] [&_.search-box]:shadow-none max-[720px]:[&_.search-box]:min-h-[46px] [&_.search-input]:h-12 [&_.search-input]:text-xs [&_kbd]:hidden"
        @select="emit('select', $event)"
      />

      <button
        type="button"
        class="inline-flex min-h-[42px] items-center gap-2 justify-self-end whitespace-nowrap border-0 bg-transparent text-[11px] font-[680] text-[#294d43] max-[720px]:hidden"
        @click="emit('compareOpen')"
      >
        <svg
          class="w-[18px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.7]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m4 7 8-4 8 4-8 4-8-4Z" />
          <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
        </svg>
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
        <span aria-hidden="true">ⓘ</span>
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
      <button
        type="button"
        class="inline-flex min-h-[42px] min-w-[150px] items-center justify-between gap-4 rounded-[7px] border bg-white py-0 pr-9 pl-[13px] text-[11px] font-[630] text-[#294d43] max-[720px]:hidden"
        :class="
          layers.includes('transactions')
            ? 'border-[#829b7f] bg-accent-soft'
            : 'border-[#dfe5e1]'
        "
        @click="showSales"
      >
        Prodajne cene
        <span aria-hidden="true">⌄</span>
      </button>

      <label class="max-[720px]:hidden">
        <span class="sr-only">Vrsta nepremičnine</span>
        <select
          class="min-h-[42px] rounded-[7px] border bg-white py-0 pr-9 pl-[13px] text-[11px] font-[630] text-[#294d43] max-[720px]:w-full"
          :value="typeChoice"
          :class="
            typeChoice !== 'all'
              ? 'border-[#829b7f] bg-accent-soft'
              : 'border-[#dfe5e1]'
          "
          @change="setType"
        >
          <option value="all">Vse nepremičnine</option>
          <option value="apartment">Stanovanja</option>
          <option value="house">Hiše</option>
          <option value="office">Poslovni prostori</option>
          <option value="retail">Trgovski prostori</option>
        </select>
      </label>

      <label class="max-[720px]:min-w-0 max-[720px]:flex-1">
        <span class="sr-only">Cena</span>
        <select
          class="min-h-[42px] rounded-[7px] border bg-white py-0 pr-9 pl-[13px] text-[11px] font-[630] text-[#294d43]"
          :value="priceChoice"
          :class="
            priceChoice !== 'all'
              ? 'border-[#829b7f] bg-accent-soft'
              : 'border-[#dfe5e1]'
          "
          @change="setPrice"
        >
          <option value="all">Prodajne cene</option>
          <option value="under-200">Do 200.000 €</option>
          <option value="200-500">200–500 tisoč €</option>
          <option value="over-500">Nad 500.000 €</option>
        </select>
      </label>

      <label class="max-[720px]:hidden">
        <span class="sr-only">Površina</span>
        <select
          class="min-h-[42px] rounded-[7px] border bg-white py-0 pr-9 pl-[13px] text-[11px] font-[630] text-[#294d43]"
          :value="areaChoice"
          :class="
            areaChoice !== 'all'
              ? 'border-[#829b7f] bg-accent-soft'
              : 'border-[#dfe5e1]'
          "
          @change="setArea"
        >
          <option value="all">Površina</option>
          <option value="100">Vsaj 100 m²</option>
          <option value="300">Vsaj 300 m²</option>
          <option value="500">Vsaj 500 m²</option>
        </select>
      </label>

      <label class="max-[720px]:hidden">
        <span class="sr-only">Leto prodaje</span>
        <select
          class="min-h-[42px] rounded-[7px] border bg-white py-0 pr-9 pl-[13px] text-[11px] font-[630] text-[#294d43]"
          :value="yearChoice"
          :class="
            yearChoice !== 'all'
              ? 'border-[#829b7f] bg-accent-soft'
              : 'border-[#dfe5e1]'
          "
          @change="setYear"
        >
          <option value="all">Vsa leta</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </label>

      <PropertyFilters
        class="[&_button:first-child]:min-w-[100px]"
        :filters="filters"
        :result-count="featureCount"
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
        <svg
          class="mr-1 inline w-4 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M5 21V6l7-3 7 3v15H5Z" />
          <path d="M9 9h2M14 9h1M9 13h2M14 13h1M9 17h2M14 17h1" />
        </svg>
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
        <svg
          class="mr-1 inline w-4 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2V5Z" />
          <path d="M9 3v16M15 5v16" />
        </svg>
        Zemljevid
      </button>
    </div>
  </header>
</template>
