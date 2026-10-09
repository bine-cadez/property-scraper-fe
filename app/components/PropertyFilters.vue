<script setup lang="ts">
import { ArrowLeft, Info, Layers3, SlidersHorizontal, X } from "@lucide/vue";
import type { MapFilters, PropertyUnit } from "#shared/types/property";

const props = defineProps<{
  filters: MapFilters;
  resultCount?: number;
  listings?: boolean;
}>();

const emit = defineEmits<{
  change: [filters: MapFilters];
}>();

const open = ref(false);
const propertyTypeOptions = [
  { value: "", label: "Vse nepremičnine" },
  { value: "apartment", label: "Stanovanja" },
  { value: "house", label: "Hiše" },
  { value: "office", label: "Poslovni prostori" },
  { value: "retail", label: "Trgovski prostori" },
  { value: "other", label: "Drugo" },
];

function createDraft(filters: MapFilters) {
  return {
    propertyType: filters.propertyTypes[0] ?? "",
    minPrice: filters.minPrice?.toString() ?? "",
    maxPrice: filters.maxPrice?.toString() ?? "",
    minParcelArea: filters.minAreaM2?.toString() ?? "",
    maxArea: "",
    year: filters.constructionYearFrom?.toString() ?? "",
  };
}

const draft = reactive(createDraft(props.filters));
const activeFilterCount = computed(
  () =>
    props.filters.propertyTypes.length +
    Object.entries(props.filters).filter(
      ([key, value]) => key !== "propertyTypes" && value !== undefined,
    ).length,
);

watch(
  () => props.filters,
  (filters) => Object.assign(draft, createDraft(filters)),
  { deep: true },
);

function apply() {
  emit("change", {
    propertyTypes: draft.propertyType
      ? [draft.propertyType as PropertyUnit["type"]]
      : [],
    ...(draft.minPrice ? { minPrice: Number(draft.minPrice) } : {}),
    ...(draft.maxPrice ? { maxPrice: Number(draft.maxPrice) } : {}),
    ...(draft.minParcelArea ? { minAreaM2: Number(draft.minParcelArea) } : {}),
    ...(!props.listings && draft.year
      ? { constructionYearFrom: Number(draft.year) }
      : {}),
  });
  open.value = false;
}

function reset() {
  Object.assign(draft, createDraft({ propertyTypes: [] }));
  emit("change", { propertyTypes: [] });
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="relative inline-flex min-h-[48px] items-center gap-2.5 rounded-[8px] border border-[#e3e7e4] bg-[#f1f3f1] px-3.5 text-left text-[#294d43] [&_svg]:w-[17px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-width:1.7]"
      :aria-expanded="open"
      @click="open = true"
    >
      <SlidersHorizontal aria-hidden="true" />
      <span>
        <small
          class="mb-0.5 block text-[8px] leading-none font-[650] tracking-[0.06em] text-[#71807b] uppercase"
          >Dodatno</small
        >
        <strong class="block text-[11px] font-[700]">Filtri</strong>
      </span>
      <b
        v-if="activeFilterCount"
        class="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e5ebdf] text-[9px]"
        >{{ activeFilterCount }}</b
      >
    </button>

    <div
      v-if="open"
      class="fixed inset-0 z-100 grid place-items-center bg-[rgb(25_61_53_/_22%)] p-6 max-[720px]:block max-[720px]:overflow-y-auto max-[720px]:bg-surface max-[720px]:p-0"
      @click.self="open = false"
    >
      <form
        class="grid w-[min(590px,calc(100vw-32px))] gap-4 rounded-[10px] bg-white p-6 shadow-[0_26px_70px_rgb(25_61_53_/_18%)] max-[720px]:min-h-dvh max-[720px]:w-full max-[720px]:content-start max-[720px]:rounded-none max-[720px]:bg-surface max-[720px]:px-4 max-[720px]:pt-0 max-[720px]:pb-7 max-[720px]:shadow-none"
        @submit.prevent="apply"
      >
        <div
          class="flex min-h-10 items-center justify-between border-b border-[#e9ece9] pb-3 max-[720px]:hidden"
        >
          <strong class="text-[15px]">Filtri</strong>
          <button
            type="button"
            class="grid size-8 place-items-center border-0 bg-transparent text-xl text-[#53645e]"
            aria-label="Zapri filtre"
            @click="open = false"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>

        <header
          class="hidden max-[720px]:sticky max-[720px]:top-0 max-[720px]:z-2 max-[720px]:-mx-4 max-[720px]:mb-2 max-[720px]:grid max-[720px]:min-h-[58px] max-[720px]:grid-cols-[1fr_auto_1fr] max-[720px]:items-center max-[720px]:border-b max-[720px]:border-[#e9ece9] max-[720px]:bg-white max-[720px]:px-4 max-[720px]:[&_a]:justify-self-end max-[720px]:[&_a]:text-[#294d43] max-[720px]:[&_a]:no-underline max-[720px]:[&_button]:border-0 max-[720px]:[&_button]:bg-transparent max-[720px]:[&_button]:text-[#294d43]"
        >
          <button type="button" aria-label="Nazaj" @click="open = false">
            <ArrowLeft class="size-5" aria-hidden="true" />
          </button>
          <strong>Filtri</strong>
          <NuxtLink to="/viri-podatkov" aria-label="Podatki in viri">
            <Layers3 class="w-[19px]" :stroke-width="1.7" aria-hidden="true" />
          </NuxtLink>
        </header>

        <div class="flex items-start justify-between gap-5">
          <div>
            <h2
              class="m-0 text-xl tracking-[-0.025em] text-ink max-[720px]:text-[19px]"
            >
              Zožite iskanje
            </h2>
            <p class="mt-[5px] mb-0 text-[10px] text-[#7a8581]">
              Spremembe se uporabijo ob potrditvi.
            </p>
          </div>
        </div>

        <div class="grid gap-1.5">
          <span class="text-[9px] text-[#7a8581]">Vrsta nepremičnine</span>
          <BaseSelect
            v-model="draft.propertyType"
            :options="propertyTypeOptions"
            label="Vrsta nepremičnine"
            active
            trigger-class="min-h-[46px] text-xs font-[650]"
          />
        </div>

        <div
          class="grid grid-cols-2 gap-3.5 max-[720px]:gap-x-[9px] max-[720px]:gap-y-3"
        >
          <label class="grid gap-1.5">
            <span class="text-[9px] text-[#7a8581]">{{
              listings ? "Zahtevana cena od" : "Ocenjena vrednost od"
            }}</span>
            <input
              v-model="draft.minPrice"
              class="min-h-[46px] w-full rounded-[7px] border border-[#dfe5e1] bg-white px-3 text-xs text-[#294d43]"
              type="number"
              min="0"
              inputmode="numeric"
              placeholder="Brez omejitve"
            />
          </label>
          <label class="grid gap-1.5">
            <span class="text-[9px] text-[#7a8581]">{{
              listings ? "Zahtevana cena do" : "Ocenjena vrednost do"
            }}</span>
            <input
              v-model="draft.maxPrice"
              class="min-h-[46px] w-full rounded-[7px] border border-[#dfe5e1] bg-white px-3 text-xs text-[#294d43]"
              type="number"
              min="0"
              inputmode="numeric"
              placeholder="Brez omejitve"
            />
          </label>
          <label class="grid gap-1.5">
            <span class="text-[9px] text-[#7a8581]">Površina od</span>
            <input
              v-model="draft.minParcelArea"
              class="min-h-[46px] w-full rounded-[7px] border border-[#dfe5e1] bg-white px-3 text-xs text-[#294d43]"
              type="number"
              min="0"
              inputmode="numeric"
              placeholder="Min. m²"
            />
          </label>
          <label class="grid gap-1.5">
            <span class="text-[9px] text-[#7a8581]">Površina do</span>
            <input
              v-model="draft.maxArea"
              class="min-h-[46px] w-full cursor-not-allowed rounded-[7px] border border-[#dfe5e1] bg-white px-3 text-xs text-[#294d43] opacity-55"
              type="number"
              min="0"
              inputmode="numeric"
              placeholder="Maks. m²"
              disabled
              title="Na voljo po podpori v podatkovnem viru"
            />
          </label>
        </div>

        <label v-if="!listings" class="grid gap-1.5">
          <span class="text-[9px] text-[#7a8581]">Leto izgradnje</span>
          <input
            v-model="draft.year"
            class="min-h-[46px] w-full rounded-[7px] border border-[#dfe5e1] bg-white px-3 text-xs text-[#294d43]"
            type="number"
            min="1900"
            max="2030"
            inputmode="numeric"
            placeholder="Vsa leta"
          />
        </label>

        <aside
          class="flex gap-[9px] rounded-[7px] bg-[#f2f4f1] p-[13px] text-[10px] leading-[1.45] text-[#73807b]"
        >
          <Info class="mt-px size-4 shrink-0" aria-hidden="true" />
          {{
            listings
              ? "Prikazujemo aktivne oglase z znano lokacijo. Prodajne cene so skupne, najemnine pa mesečne."
              : "Prikazujemo stavbe na trenutnem območju zemljevida in razpoložljive podatke GURS."
          }}
        </aside>

        <div
          v-if="activeFilterCount"
          class="hidden max-[720px]:grid max-[720px]:gap-1 max-[720px]:rounded-[7px] max-[720px]:bg-[#f3f5f2] max-[720px]:p-[13px] max-[720px]:text-[9px] max-[720px]:text-[#7a8581]"
        >
          <strong class="text-[10px] text-[#294d43]"
            >{{ activeFilterCount }} aktivna filtra</strong
          >
          <span>
            {{
              draft.propertyType ? "Vrsta nepremičnine" : "Ocenjena vrednost"
            }}
            <template v-if="draft.year"> · {{ draft.year }}</template>
          </span>
        </div>

        <div
          class="grid grid-cols-[1fr_2fr] gap-[9px] max-[720px]:flex max-[720px]:flex-col-reverse"
        >
          <button
            type="button"
            class="min-h-11 rounded-[7px] border border-[#e0e5e1] bg-white text-[11px] font-[680] text-[#294d43] max-[720px]:w-full"
            @click="reset"
          >
            Počisti vse
          </button>
          <button
            type="submit"
            class="min-h-11 rounded-[7px] border border-accent bg-accent text-[11px] font-[680] text-white max-[720px]:w-full"
          >
            Pokaži {{ resultCount ?? "" }} {{ listings ? "oglasov" : "stavb" }}
          </button>
        </div>

        <p
          v-if="activeFilterCount"
          class="m-0 text-[9px] text-[#7a8581] max-[720px]:hidden"
        >
          {{ activeFilterCount }} aktivna filtra ·
          {{
            draft.propertyType === "apartment" ? "Stanovanja" : "Izbrani filtri"
          }}
          <template v-if="draft.year"> · {{ draft.year }}</template>
        </p>
      </form>
    </div>
  </div>
</template>
