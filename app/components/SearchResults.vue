<script setup lang="ts">
import type { SearchResult } from '#shared/types/property'
import { sl } from '~/locales/sl'

defineProps<{
  results: SearchResult[]
  activeIndex: number
  loading: boolean
  typeLabels: Record<SearchResult['type'], string>
}>()

defineEmits<{
  select: [result: SearchResult]
  hover: [index: number]
}>()
</script>

<template>
  <div
    class="results map-overlay"
    role="listbox"
    aria-label="Rezultati iskanja"
  >
    <p v-if="loading && !results.length" class="message">
      {{ sl.search.loading }}
    </p>
    <p v-else-if="!results.length" class="message">{{ sl.search.noResults }}</p>
    <button
      v-for="(result, index) in results"
      :id="`search-result-${index}`"
      :key="result.id"
      type="button"
      role="option"
      :aria-selected="activeIndex === index"
      :class="{ active: activeIndex === index }"
      @mouseenter="$emit('hover', index)"
      @click="$emit('select', result)"
    >
      <span class="result-icon" :class="result.type" aria-hidden="true">
        {{
          result.type === 'parcel'
            ? '◇'
            : result.type === 'building'
              ? '▤'
              : '•'
        }}
      </span>
      <span class="labels">
        <strong>{{ result.primaryLabel }}</strong>
        <small>{{ result.secondaryLabel }}</small>
      </span>
      <span class="type">{{ typeLabels[result.type] }}</span>
    </button>
  </div>
</template>

<style scoped>
.results {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  overflow: hidden;
  padding: 6px;
  border-radius: var(--radius-md);
}

button {
  display: grid;
  width: 100%;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  color: var(--color-ink);
  background: transparent;
  text-align: left;
}

button:hover,
button.active {
  background: var(--color-accent-soft);
}

.result-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #b5cec8;
  border-radius: 7px;
  color: var(--color-accent-strong);
  background: white;
  font-weight: 800;
}

.result-icon.parcel {
  color: #a56724;
  border-color: #e1c49d;
}

.result-icon.building {
  color: var(--color-official);
  border-color: #abc4df;
}

.labels {
  display: grid;
  gap: 3px;
  min-width: 0;
}

strong,
small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

strong {
  font-size: 13px;
}

small {
  color: var(--color-ink-muted);
  font-size: 11px;
}

.type {
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.message {
  margin: 0;
  padding: 20px 16px;
  color: var(--color-ink-muted);
  font-size: 13px;
  text-align: center;
}
</style>
