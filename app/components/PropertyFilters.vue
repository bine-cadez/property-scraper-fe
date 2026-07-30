<script setup lang="ts">
import type { MapFilters } from '#shared/types/property'

const props = defineProps<{
  filters: MapFilters
}>()

const emit = defineEmits<{
  change: [filters: MapFilters]
}>()

const open = ref(false)
const draft = reactive({
  propertyType: props.filters.propertyTypes[0] ?? '',
  minPrice: props.filters.minPrice?.toString() ?? '',
  maxPrice: props.filters.maxPrice?.toString() ?? '',
  minPriceM2: props.filters.minPricePerM2?.toString() ?? '',
  maxPriceM2: props.filters.maxPricePerM2?.toString() ?? '',
  transactionFrom: props.filters.transactionFrom ?? '',
  minArea: props.filters.minAreaM2?.toString() ?? '',
  minParcelArea: props.filters.minParcelAreaM2?.toString() ?? '',
  year: props.filters.constructionYearFrom?.toString() ?? '',
})

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
  <div class="filter-shell">
    <button
      type="button"
      class="filter-trigger map-overlay focus-ring"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M3 5h14M6 10h8M8.5 15h3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
      Filtri
      <span v-if="Object.keys(filters).length > 1">•</span>
    </button>
    <form v-if="open" class="filter-panel map-overlay" @submit.prevent="apply">
      <div class="filter-heading">
        <strong>Filtriraj prikaz</strong>
        <button type="button" aria-label="Zapri filtre" @click="open = false">
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
      <button class="apply focus-ring" type="submit">Uporabi filtre</button>
    </form>
  </div>
</template>

<style scoped>
.filter-shell {
  position: relative;
}

.filter-trigger {
  display: flex;
  min-width: 104px;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 700;
}

.filter-trigger svg {
  width: 18px;
  color: var(--color-accent);
}

.filter-trigger span {
  color: var(--color-warm);
}

.filter-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  display: grid;
  width: 290px;
  max-height: min(620px, calc(100dvh - 150px));
  gap: 14px;
  overflow-y: auto;
  padding: 16px;
  border-radius: var(--radius-md);
}

.filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-heading strong {
  font-size: 14px;
}

.filter-heading button {
  width: 36px;
  height: 36px;
  border: 0;
  color: var(--color-ink-muted);
  background: transparent;
  font-size: 20px;
}

label,
legend {
  color: var(--color-ink-muted);
  font-size: 11px;
  font-weight: 700;
}

label {
  display: grid;
  gap: 6px;
}

select,
input {
  width: 100%;
  min-height: 42px;
  padding: 0 10px;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  color: var(--color-ink);
  background: white;
  font-size: 12px;
}

fieldset {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0;
  border: 0;
}

legend {
  grid-column: 1 / -1;
  width: 100%;
  margin-bottom: 6px;
}

.apply {
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  color: white;
  background: var(--color-accent);
  font-size: 12px;
  font-weight: 750;
}
</style>
