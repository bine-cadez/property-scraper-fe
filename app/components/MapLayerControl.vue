<script setup lang="ts">
import type { MapLayerId } from '#shared/types/property'

const props = defineProps<{
  layers: MapLayerId[]
}>()

const emit = defineEmits<{
  change: [layers: MapLayerId[]]
}>()

const expanded = ref(false)

const options: { id: MapLayerId; label: string; swatch: string }[] = [
  { id: 'parcels', label: 'Parcele', swatch: '#e9a14a' },
  { id: 'buildings', label: 'Stavbe', swatch: '#087f70' },
  { id: 'transactions', label: 'Prodaje', swatch: '#b55d18' },
  { id: 'listings', label: 'Oglasi', swatch: '#7b55a3' },
  { id: 'priceM2', label: 'Cena na m²', swatch: '#d0832d' },
  { id: 'officialValue', label: 'Uradne vrednosti', swatch: '#2865a8' },
]

function toggle(id: MapLayerId) {
  const next = props.layers.includes(id)
    ? props.layers.filter((layer) => layer !== id)
    : [...props.layers, id]
  emit('change', next)
}
</script>

<template>
  <section
    class="layer-control map-overlay"
    :class="{ expanded }"
    aria-label="Sloji zemljevida"
  >
    <button
      class="control-trigger focus-ring"
      type="button"
      :aria-expanded="expanded"
      aria-controls="layer-options"
      @click="expanded = !expanded"
    >
      <span class="grid-icon" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>Sloji</span>
      <small>{{ layers.length }}</small>
    </button>
    <div v-if="expanded" id="layer-options" class="options">
      <label v-for="option in options" :key="option.id">
        <input
          type="checkbox"
          :checked="layers.includes(option.id)"
          @change="toggle(option.id)"
        />
        <span
          class="swatch"
          :style="{ '--swatch': option.swatch }"
          aria-hidden="true"
        />
        <span>{{ option.label }}</span>
      </label>
      <div class="basemap">
        <strong>Podlaga</strong>
        <button type="button" class="active">Svetla karta</button>
        <button
          type="button"
          disabled
          title="Na voljo po priklopu uradnega vira"
        >
          Ortofoto
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.layer-control {
  width: 132px;
  overflow: hidden;
  border-radius: var(--radius-md);
  transition: width 240ms var(--ease-out-expo);
}

.layer-control.expanded {
  width: 246px;
}

.control-trigger {
  display: grid;
  width: 100%;
  min-height: 48px;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 0;
  color: var(--color-ink);
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.control-trigger small {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
  font-size: 10px;
}

.grid-icon {
  display: grid;
  width: 18px;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.grid-icon i {
  aspect-ratio: 1;
  border: 1.5px solid var(--color-accent);
  border-radius: 1px;
}

.options {
  padding: 3px 10px 12px;
  border-top: 1px solid var(--color-line);
}

label {
  display: grid;
  min-height: 37px;
  grid-template-columns: 18px 12px 1fr;
  align-items: center;
  gap: 9px;
  color: var(--color-ink);
  font-size: 12px;
}

input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
}

.swatch {
  width: 9px;
  height: 9px;
  border: 2px solid var(--swatch);
  border-radius: 2px;
}

.basemap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-top: 8px;
  padding-top: 11px;
  border-top: 1px solid var(--color-line);
}

.basemap strong {
  grid-column: 1 / -1;
  color: var(--color-ink-muted);
  font-size: 10px;
  text-transform: uppercase;
}

.basemap button {
  min-height: 34px;
  border: 1px solid var(--color-line);
  border-radius: 6px;
  color: var(--color-ink-muted);
  background: white;
  font-size: 10px;
}

.basemap button.active {
  border-color: var(--color-accent);
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
}

@media (prefers-reduced-motion: reduce) {
  .layer-control {
    transition: opacity 150ms ease;
  }
}
</style>
