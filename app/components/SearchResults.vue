<script setup lang="ts">
import { Building2, Map, X } from "@lucide/vue";
import type { SearchResult } from "#shared/types/property";
import { sl } from "~/locales/sl";

const props = withDefaults(
  defineProps<{
    results: SearchResult[];
    activeIndex: number;
    loading: boolean;
    mobile?: boolean;
  }>(),
  { mobile: false },
);

defineEmits<{
  select: [result: SearchResult];
  hover: [index: number];
  close: [];
}>();

const indexedResults = computed(() =>
  props.results.map((result, index) => ({ result, index })),
);
const addressResults = computed(() =>
  indexedResults.value.filter(({ result }) =>
    ["address", "building", "parcel"].includes(result.type),
  ),
);
const placeResults = computed(() =>
  indexedResults.value.filter(({ result }) =>
    ["municipality", "settlement", "cadastral_municipality"].includes(
      result.type,
    ),
  ),
);
</script>

<template>
  <div
    class="results overflow-hidden bg-white"
    :class="
      mobile
        ? 'relative'
        : 'absolute top-[calc(100%+8px)] right-0 left-0 rounded-md border border-line/92 p-3 shadow-overlay'
    "
    role="listbox"
    aria-label="Rezultati iskanja"
  >
    <p
      v-if="loading && !results.length"
      class="px-4 py-5 text-center text-[13px] text-ink-muted"
    >
      {{ sl.search.loading }}
    </p>
    <div
      v-else-if="!results.length && mobile"
      class="mt-5 rounded-lg bg-[#f2f5ef] p-4 text-[#52635d]"
    >
      <strong class="text-sm text-[#294d43]">Začnite z lokacijo</strong>
      <p class="mt-2 mb-0 text-[11px] leading-[1.5]">
        Poiščite naslov, kraj ali katastrsko parcelo. Nato zožite rezultate s
        filtri.
      </p>
    </div>
    <p
      v-else-if="!results.length"
      class="px-4 py-5 text-center text-[13px] text-ink-muted"
    >
      {{ sl.search.noResults }}
    </p>
    <template v-else>
      <section v-if="addressResults.length">
        <h3
          class="m-0 px-2.5 pt-1 pb-2 text-[9px] font-medium text-[#7a8581] uppercase"
        >
          Naslovi
        </h3>
        <button
          v-for="{ result, index } in addressResults"
          :id="`search-result-${index}`"
          :key="result.id"
          type="button"
          role="option"
          :aria-selected="activeIndex === index"
          class="grid min-h-[64px] w-full grid-cols-[28px_1fr] items-center gap-2 rounded-sm border-0 bg-transparent px-2.5 py-2 text-left text-ink hover:bg-accent-soft"
          :class="activeIndex === index ? 'bg-accent-soft' : ''"
          @mouseenter="$emit('hover', index)"
          @click="$emit('select', result)"
        >
          <span class="text-accent" aria-hidden="true">
            <Building2 class="w-[18px]" :stroke-width="1.7" />
          </span>
          <span class="grid min-w-0 gap-[3px]">
            <strong class="truncate text-[13px]">{{
              result.primaryLabel
            }}</strong>
            <small class="truncate text-[11px] text-ink-muted">{{
              result.secondaryLabel
            }}</small>
          </span>
        </button>
      </section>

      <section
        v-if="placeResults.length"
        class="mt-1 border-t border-[#e7ebe8] pt-3"
      >
        <h3
          class="m-0 px-2.5 pb-2 text-[9px] font-medium text-[#7a8581] uppercase"
        >
          Kraji
        </h3>
        <button
          v-for="{ result, index } in placeResults"
          :id="`search-result-${index}`"
          :key="result.id"
          type="button"
          role="option"
          :aria-selected="activeIndex === index"
          class="grid min-h-[64px] w-full grid-cols-[28px_1fr] items-center gap-2 rounded-sm border-0 bg-transparent px-2.5 py-2 text-left text-ink hover:bg-accent-soft"
          :class="activeIndex === index ? 'bg-accent-soft' : ''"
          @mouseenter="$emit('hover', index)"
          @click="$emit('select', result)"
        >
          <span class="text-accent" aria-hidden="true">
            <Map class="w-[18px]" :stroke-width="1.7" />
          </span>
          <span class="grid min-w-0 gap-[3px]">
            <strong class="truncate text-[13px]">{{
              result.primaryLabel
            }}</strong>
            <small class="truncate text-[11px] text-ink-muted">{{
              result.secondaryLabel
            }}</small>
          </span>
        </button>
      </section>

      <div
        v-if="mobile"
        class="mt-4 rounded-lg bg-[#f2f5ef] p-4 text-[#52635d]"
      >
        <strong class="text-sm text-[#294d43]">Začnite z lokacijo</strong>
        <p class="mt-2 mb-0 text-[11px] leading-[1.5]">
          Poiščite naslov, kraj ali katastrsko parcelo. Nato zožite rezultate s
          filtri.
        </p>
      </div>
      <button
        v-else
        type="button"
        class="mt-2 min-h-9 w-full border-0 border-t border-[#e7ebe8] bg-transparent pt-2 text-left text-[11px] font-[650] text-[#294d43]"
        @click="$emit('close')"
      >
        <X class="mr-1 inline size-4" aria-hidden="true" />
        Zapri iskanje
      </button>
    </template>
  </div>
</template>
