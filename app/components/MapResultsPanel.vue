<script setup lang="ts">
import { ArrowRight, Info, ListFilter } from "@lucide/vue";
import type { MapFilters, MapResultItem } from "#shared/types/property";
import {
  formatArea,
  formatDate,
  formatEur,
  formatPricePerM2,
} from "#shared/utils/format";

const props = defineProps<{
  results: MapResultItem[];
  featureCount: number;
  filters: MapFilters;
  selectedId: string | undefined;
  comparisonIds: string[];
}>();

const emit = defineEmits<{
  select: [item: MapResultItem];
  compare: [item: MapResultItem];
  openComparison: [];
}>();

function isCompared(item: MapResultItem) {
  return props.comparisonIds.includes(item.id);
}

function resultTypeLabel(type: string) {
  const labels: Record<string, string> = {
    apartment: "stanovanje",
    house: "hiša",
    office: "poslovni prostor",
    retail: "trgovski prostor",
  };
  return labels[type] ?? type;
}

const headingLocation = computed(() => {
  const locations = props.results
    .map((item) => item.location?.trim())
    .filter((value): value is string => Boolean(value));
  if (!locations.length) return "";
  const counts = new Map<string, number>();
  for (const location of locations) {
    counts.set(location, (counts.get(location) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
});

const propertyTypeLabel = computed(() => {
  const type = props.filters.propertyTypes[0];
  return type === "apartment"
    ? "stanovanja"
    : type === "house"
      ? "hiše"
      : type
        ? "izbrana vrsta"
        : "evidentirane prodaje";
});
</script>

<template>
  <section
    class="relative flex min-h-0 flex-col bg-surface max-[720px]:min-h-full"
    aria-label="Prodaje na prikazanem območju"
  >
    <header
      class="px-5 pt-6 pb-3.5 max-[720px]:px-4 max-[720px]:pt-[19px] max-[720px]:pb-3"
    >
      <h1 class="m-0 text-[17px] font-[720] tracking-[-0.02em] text-ink">
        {{
          headingLocation
            ? `Prodaje v ${headingLocation}`
            : "Prodaje na zemljevidu"
        }}
      </h1>
      <p class="mt-1 mb-0 text-[11px] text-[#74817d]">
        {{ results.length || featureCount }}
        {{ results.length === 1 ? "prikazan posel" : "prikazanih poslov" }}
        <span aria-hidden="true"> · </span>{{ propertyTypeLabel }}
        <template v-if="filters.transactionFrom">
          <span aria-hidden="true"> · </span
          >{{ filters.transactionFrom.slice(0, 4) }}
        </template>
      </p>
    </header>

    <div
      v-if="results.length"
      class="min-h-0 flex-1 overflow-y-auto px-3.5 pb-[18px] [overscroll-behavior:contain] max-[720px]:overflow-visible max-[720px]:px-2.5 max-[720px]:pb-3"
    >
      <article
        v-for="item in results"
        :key="item.id"
        class="mb-2 overflow-hidden rounded-[9px] border bg-white transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none"
        :class="
          selectedId === item.selectionId
            ? 'border-[#9ab2a9] shadow-[0_4px_16px_rgb(29_68_58_/_7%)]'
            : 'border-[#e1e6e2] hover:border-[#9ab2a9] hover:shadow-[0_4px_16px_rgb(29_68_58_/_7%)]'
        "
      >
        <button
          type="button"
          class="relative grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-[3px] border-0 bg-transparent pt-3.5 pr-[38px] pb-[9px] pl-3.5 text-left text-ink"
          :aria-label="`Odpri ${item.address}`"
          @click="emit('select', item)"
        >
          <span class="truncate text-[13px] font-bold">{{ item.address }}</span>
          <span class="col-start-1 truncate text-[10px] text-[#7b8682]">
            {{ item.location || "Slovenija" }}
            <template v-if="item.propertyType">
              · {{ resultTypeLabel(item.propertyType) }}</template
            >
            <template v-if="item.areaM2 !== undefined">
              · {{ formatArea(item.areaM2) }}
            </template>
          </span>
          <strong
            class="col-start-1 mt-[3px] text-[17px] font-[730] tracking-[-0.025em]"
            >{{
              item.totalPrice !== undefined
                ? formatEur(item.totalPrice)
                : "Cena ni podatka"
            }}</strong
          >
          <span
            class="col-start-2 row-start-2 row-end-4 self-end whitespace-nowrap text-[10px] text-[#7b8682]"
          >
            {{
              item.transactionDate
                ? formatDate(item.transactionDate)
                : "Datum ni podatka"
            }}
          </span>
          <span
            class="absolute top-3.5 right-3.5 text-xl leading-none"
            aria-hidden="true"
            >›</span
          >
        </button>

        <div
          class="flex min-h-[34px] items-center justify-between gap-3 px-3.5 pb-2.5 text-[10px] text-[#67746f]"
        >
          <label
            class="inline-flex cursor-pointer items-center gap-[7px] font-[650] text-[#294d43]"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="isCompared(item)"
              :disabled="!isCompared(item) && comparisonIds.length >= 2"
              class="m-0 size-[17px] accent-[#2d6254]"
              @change="emit('compare', item)"
            />
            <span>Primerjaj</span>
          </label>
          <span>{{
            item.pricePerM2 !== undefined
              ? formatPricePerM2(item.pricePerM2)
              : "€/m² ni podatka"
          }}</span>
        </div>
      </article>
    </div>

    <div
      v-else
      class="m-auto grid place-items-center px-7 text-center text-[#6e7a76]"
    >
      <ListFilter
        class="mb-3 w-[34px] text-[#9aaa9f]"
        :stroke-width="1.7"
        aria-hidden="true"
      />
      <strong class="text-[13px] text-[#294d43]"
        >Na tej povečavi ni posameznih prodaj.</strong
      >
      <p class="mt-1.5 mb-0 max-w-[270px] text-[11px] leading-normal">
        Približajte zemljevid, da se skupine razprejo v posamezne zapise.
      </p>
    </div>

    <footer
      class="grid min-h-10 gap-1 px-[18px] pb-3 text-[9px] text-[#7b8682] max-[720px]:px-3.5"
    >
      <span
        ><Info class="mr-1 inline size-3" aria-hidden="true" /> Vzorec GURS ·
        evidentirane prodaje · podatki v preverjanju</span
      >
      <span>Prikazane so prodaje, ki so trenutno vidne na zemljevidu.</span>
    </footer>

    <div
      v-if="comparisonIds.length"
      class="absolute right-3.5 bottom-3.5 left-3.5 flex min-h-[54px] items-center justify-between gap-3 rounded-lg bg-ink py-2 pr-[9px] pl-4 text-white shadow-[0_12px_30px_rgb(25_61_53_/_22%)] max-[720px]:sticky max-[720px]:z-4 max-[720px]:bottom-2.5 max-[720px]:mt-auto"
      role="status"
    >
      <span class="text-[11px]">
        <strong>{{ comparisonIds.length }}</strong>
        {{ comparisonIds.length === 1 ? "izbrana enota" : "izbrani enoti" }}
      </span>
      <button
        type="button"
        class="min-h-9 rounded-md border-0 bg-[#eaf2d4] px-[13px] text-[11px] font-[720] text-ink"
        @click="emit('openComparison')"
      >
        Primerjaj
        <ArrowRight class="ml-1 inline size-4" aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
