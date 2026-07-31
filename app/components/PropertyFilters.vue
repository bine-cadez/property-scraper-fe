<script setup lang="ts">
import type { MapFilters } from '#shared/types/property'

const props = defineProps<{
  filters: MapFilters
}>()

const emit = defineEmits<{
  change: [filters: MapFilters]
}>()

const open = ref(false)

function createDraft(filters: MapFilters) {
  return {
    propertyType: filters.propertyTypes[0] ?? '',
    minPrice: filters.minPrice?.toString() ?? '',
    maxPrice: filters.maxPrice?.toString() ?? '',
    minPriceM2: filters.minPricePerM2?.toString() ?? '',
    maxPriceM2: filters.maxPricePerM2?.toString() ?? '',
    transactionFrom: filters.transactionFrom ?? '',
    minArea: filters.minAreaM2?.toString() ?? '',
    minParcelArea: filters.minParcelAreaM2?.toString() ?? '',
    year: filters.constructionYearFrom?.toString() ?? '',
  }
}

const draft = reactive(createDraft(props.filters))
const activeFilterCount = computed(
  () =>
    props.filters.propertyTypes.length +
    Object.entries(props.filters).filter(
      ([key, value]) => key !== 'propertyTypes' && value !== undefined,
    ).length,
)

watch(
  () => props.filters,
  (filters) => Object.assign(draft, createDraft(filters)),
  { deep: true },
)

function apply() {
  emit('change', {
    propertyTypes: draft.propertyType
      ? [draft.propertyType as MapFilters['propertyTypes'][number]]
      : [],
    ...(draft.minPrice ? { minPrice: Number(draft.minPrice) } : {}),
    ...(draft.maxPrice ? { maxPrice: Number(draft.maxPrice) } : {}),
    ...(draft.minPriceM2 ? { minPricePerM2: Number(draft.minPriceM2) } : {}),
    ...(draft.maxPriceM2 ? { maxPricePerM2: Number(draft.maxPriceM2) } : {}),
    ...(draft.transactionFrom
      ? { transactionFrom: draft.transactionFrom }
      : {}),
    ...(draft.minArea ? { minAreaM2: Number(draft.minArea) } : {}),
    ...(draft.minParcelArea
      ? { minParcelAreaM2: Number(draft.minParcelArea) }
      : {}),
    ...(draft.year ? { constructionYearFrom: Number(draft.year) } : {}),
  })
  open.value = false
}
</script>

<template>
  <div class="filter-shell relative">
    <button
      type="button"
      class="filter-trigger relative flex size-12 items-center justify-center gap-2 rounded-[10px] border border-[#6259dc] bg-[#5b52c8] px-1 text-[12px] font-[750] text-white shadow-[0_4px_14px_rgb(72_64_209_/_20%)] backdrop-blur-[12px] transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:scale-[0.97] motion-reduce:active:scale-100"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg class="w-5 text-current" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M3 5h14M6 10h8M8.5 15h3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
      <span class="filter-label">Filtri</span>
      <span
        v-if="activeFilterCount > 0"
        class="absolute top-1.5 right-2 text-[#ffc267]"
        :aria-label="`${activeFilterCount} aktivnih filtrov`"
        >•</span
      >
    </button>
    <form
      v-if="open"
      class="filter-panel absolute top-[calc(100%+8px)] left-0 grid max-h-[min(620px,calc(100dvh-150px))] w-[290px] gap-3.5 overflow-y-auto rounded-md border border-line/92 bg-white/96 p-4 shadow-overlay backdrop-blur-[14px] [&_fieldset]:grid [&_fieldset]:grid-cols-2 [&_fieldset]:gap-2 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-[7px] [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-2.5 [&_input]:text-xs [&_input]:text-ink [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[11px] [&_label]:font-bold [&_label]:text-ink-muted [&_legend]:col-span-full [&_legend]:mb-1.5 [&_legend]:w-full [&_legend]:text-[11px] [&_legend]:font-bold [&_legend]:text-ink-muted [&_select]:min-h-[42px] [&_select]:w-full [&_select]:rounded-[7px] [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:px-2.5 [&_select]:text-xs [&_select]:text-ink"
      @submit.prevent="apply"
    >
      <div class="flex items-center justify-between">
        <strong class="text-sm">Filtriraj prikaz</strong>
        <button
          class="size-9 bg-transparent text-xl text-ink-muted"
          type="button"
          aria-label="Zapri filtre"
          @click="open = false"
        >
          ×
        </button>
      </div>
      <label>
        Vrsta nepremičnine
        <select v-model="draft.propertyType">
          <option value="">Vse vrste</option>
          <option value="apartment">Stanovanje</option>
          <option value="house">Hiša</option>
          <option value="office">Poslovni prostor</option>
        </select>
      </label>
      <fieldset>
        <legend>Cena</legend>
        <input
          v-model="draft.minPrice"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Od €"
          aria-label="Najnižja cena"
        />
        <input
          v-model="draft.maxPrice"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Do €"
          aria-label="Najvišja cena"
        />
      </fieldset>
      <fieldset>
        <legend>Cena na m²</legend>
        <input
          v-model="draft.minPriceM2"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Od €/m²"
          aria-label="Najnižja cena na kvadratni meter"
        />
        <input
          v-model="draft.maxPriceM2"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Do €/m²"
          aria-label="Najvišja cena na kvadratni meter"
        />
      </fieldset>
      <fieldset>
        <legend>Površina in leto</legend>
        <input
          v-model="draft.minArea"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Najmanj m²"
          aria-label="Najmanjša površina"
        />
        <input
          v-model="draft.year"
          type="number"
          min="1800"
          max="2030"
          inputmode="numeric"
          placeholder="Zgrajeno po"
          aria-label="Najzgodnejše leto gradnje"
        />
      </fieldset>
      <fieldset>
        <legend>Parcela in transakcije</legend>
        <input
          v-model="draft.minParcelArea"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Parcela od m²"
          aria-label="Najmanjša površina parcele"
        />
        <input
          v-model="draft.transactionFrom"
          type="date"
          aria-label="Transakcije od datuma"
        />
      </fieldset>
      <button
        class="apply min-h-11 rounded-[7px] bg-accent text-xs font-[750] text-white transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:scale-[0.97] motion-reduce:active:scale-100"
        type="submit"
      >
        Uporabi filtre
      </button>
    </form>
  </div>
</template>
