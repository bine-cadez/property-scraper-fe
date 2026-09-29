<script setup lang="ts">
import type { MapFilters, PropertyUnit } from "#shared/types/property";

const props = defineProps<{
  filters: MapFilters;
  resultCount?: number;
}>();

const emit = defineEmits<{
  change: [filters: MapFilters];
}>();

const open = ref(false);

function createDraft(filters: MapFilters) {
  return {
    propertyType: filters.propertyTypes[0] ?? "",
    minPrice: filters.minPrice?.toString() ?? "",
    maxPrice: filters.maxPrice?.toString() ?? "",
    minParcelArea: filters.minParcelAreaM2?.toString() ?? "",
    maxArea: "",
    year: filters.transactionFrom?.slice(0, 4) ?? "",
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
    ...(draft.minParcelArea
      ? { minParcelAreaM2: Number(draft.minParcelArea) }
      : {}),
    ...(draft.year ? { transactionFrom: `${draft.year}-01-01` } : {}),
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
      class="relative inline-flex min-h-[42px] items-center gap-2 rounded-[7px] border border-transparent bg-[#f1f3f1] px-[13px] text-[11px] font-[680] text-[#294d43] [&_svg]:w-[17px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-width:1.7]"
      :aria-expanded="open"
      @click="open = true"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 5h14M6 10h8M8.5 15h3" />
      </svg>
      <span>Filtri</span>
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
            ×
          </button>
        </div>

        <header
          class="hidden max-[720px]:sticky max-[720px]:top-0 max-[720px]:z-2 max-[720px]:-mx-4 max-[720px]:mb-2 max-[720px]:grid max-[720px]:min-h-[58px] max-[720px]:grid-cols-[1fr_auto_1fr] max-[720px]:items-center max-[720px]:border-b max-[720px]:border-[#e9ece9] max-[720px]:bg-white max-[720px]:px-4 max-[720px]:[&_a]:justify-self-end max-[720px]:[&_a]:text-[#294d43] max-[720px]:[&_a]:no-underline max-[720px]:[&_button]:border-0 max-[720px]:[&_button]:bg-transparent max-[720px]:[&_button]:text-[#294d43]"
        >
          <button type="button" aria-label="Nazaj" @click="open = false">
            ←
          </button>
          <strong>Filtri</strong>
          <NuxtLink to="/viri-podatkov" aria-label="Podatki in viri">
            <svg
              class="w-[19px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.7]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m4 7 8-4 8 4-8 4-8-4Z" />
              <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
            </svg>
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

        <label class="grid gap-1.5">
          <span class="text-[9px] text-[#7a8581]">Vrsta nepremičnine</span>
          <select
            v-model="draft.propertyType"
            class="min-h-[46px] w-full rounded-[7px] border border-[#829b7f] bg-accent-soft px-3 text-xs font-[650] text-[#294d43]"
          >
            <option value="">Vse nepremičnine</option>
            <option value="apartment">Stanovanja</option>
            <option value="house">Hiše</option>
            <option value="office">Poslovni prostori</option>
            <option value="retail">Trgovski prostori</option>
            <option value="other">Drugo</option>
          </select>
        </label>

        <div
          class="grid grid-cols-2 gap-3.5 max-[720px]:gap-x-[9px] max-[720px]:gap-y-3"
        >
          <label class="grid gap-1.5">
            <span class="text-[9px] text-[#7a8581]">Cena od</span>
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
            <span class="text-[9px] text-[#7a8581]">Cena do</span>
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

        <label class="grid gap-1.5">
          <span class="text-[9px] text-[#7a8581]">Leto prodaje</span>
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
          <span aria-hidden="true">ⓘ</span>
          Prikazujemo evidentirane prodaje. Status posla je naveden pri
          podatkih.
        </aside>

        <div
          v-if="activeFilterCount"
          class="hidden max-[720px]:grid max-[720px]:gap-1 max-[720px]:rounded-[7px] max-[720px]:bg-[#f3f5f2] max-[720px]:p-[13px] max-[720px]:text-[9px] max-[720px]:text-[#7a8581]"
        >
          <strong class="text-[10px] text-[#294d43]"
            >{{ activeFilterCount }} aktivna filtra</strong
          >
          <span>
            {{ draft.propertyType ? "Vrsta nepremičnine" : "Prodajne cene" }}
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
            Pokaži {{ resultCount ?? "" }} posle
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
