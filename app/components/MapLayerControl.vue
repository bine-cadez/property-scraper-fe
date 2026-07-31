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
    class="layer-control overflow-hidden rounded-md border border-line/92 bg-white/96 shadow-overlay backdrop-blur-[14px] transition-[width] duration-[240ms] ease-out-expo motion-reduce:transition-opacity"
    :class="expanded ? 'expanded w-[246px]' : 'w-[132px]'"
    aria-label="Sloji zemljevida"
  >
    <button
      class="grid min-h-12 w-full grid-cols-[22px_1fr_auto] items-center gap-[9px] bg-transparent px-3 text-left text-[13px] font-bold text-ink transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:scale-[0.97] motion-reduce:active:scale-100"
      type="button"
      :aria-expanded="expanded"
      aria-controls="layer-options"
      @click="expanded = !expanded"
    >
      <span
        class="grid w-[18px] grid-cols-2 gap-0.5 [&_i]:aspect-square [&_i]:rounded-[1px] [&_i]:border-[1.5px] [&_i]:border-accent"
        aria-hidden="true"
        ><i /><i /><i /><i
      /></span>
      <span>Sloji</span>
      <small
        class="grid size-[21px] place-items-center rounded-full bg-accent-soft text-[10px] text-accent-strong"
        >{{ layers.length }}</small
      >
    </button>
    <div
      v-if="expanded"
      id="layer-options"
      class="border-t border-line px-2.5 pt-[3px] pb-3"
    >
      <label
        v-for="option in options"
        :key="option.id"
        class="grid min-h-[37px] grid-cols-[18px_12px_1fr] items-center gap-[9px] text-xs text-ink"
      >
        <input
          class="size-4 accent-accent"
          type="checkbox"
          :checked="layers.includes(option.id)"
          @change="toggle(option.id)"
        />
        <span
          class="size-[9px] rounded-sm border-2"
          :style="{ borderColor: option.swatch }"
          aria-hidden="true"
        />
        <span>{{ option.label }}</span>
      </label>
      <div
        class="mt-2 grid grid-cols-2 gap-[7px] border-t border-line pt-[11px]"
      >
        <strong class="col-span-full text-[10px] text-ink-muted uppercase"
          >Podlaga</strong
        >
        <button
          type="button"
          class="min-h-[34px] rounded-[6px] border border-accent bg-accent-soft text-[10px] text-accent-strong"
        >
          Svetla karta
        </button>
        <button
          class="min-h-[34px] rounded-[6px] border border-line bg-white text-[10px] text-ink-muted"
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
