<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
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
    class="results absolute top-[calc(100%+8px)] right-0 left-0 overflow-hidden rounded-md border border-line/92 bg-white/96 p-1.5 shadow-overlay backdrop-blur-[14px]"
    role="listbox"
    aria-label="Rezultati iskanja"
  >
    <p
      v-if="loading && !results.length"
      class="px-4 py-5 text-center text-[13px] text-ink-muted"
    >
      {{ sl.search.loading }}
    </p>
    <p
      v-else-if="!results.length"
      class="px-4 py-5 text-center text-[13px] text-ink-muted"
    >
      {{ sl.search.noResults }}
    </p>
    <button
      v-for="(result, index) in results"
      :id="`search-result-${index}`"
      :key="result.id"
      type="button"
      role="option"
      :aria-selected="activeIndex === index"
      class="grid min-h-[58px] w-full grid-cols-[34px_1fr_auto] items-center gap-2.5 rounded-sm bg-transparent px-2.5 py-2 text-left text-ink hover:bg-accent-soft"
      :class="{ active: activeIndex === index }"
      @mouseenter="$emit('hover', index)"
      @click="$emit('select', result)"
    >
      <span
        class="grid size-8 place-items-center rounded-[7px] border bg-white font-extrabold"
        :class="{
          'border-[#e1c49d] text-[#a56724]': result.type === 'parcel',
          'border-[#abc4df] text-official': result.type === 'building',
          'border-[#b5cec8] text-accent-strong':
            result.type !== 'parcel' && result.type !== 'building',
        }"
        aria-hidden="true"
      >
        {{
          result.type === 'parcel'
            ? '◇'
            : result.type === 'building'
              ? '▤'
              : '•'
        }}
      </span>
      <span class="grid min-w-0 gap-[3px]">
        <strong class="truncate text-[13px]">{{ result.primaryLabel }}</strong>
        <small class="truncate text-[11px] text-ink-muted">{{
          result.secondaryLabel
        }}</small>
      </span>
      <span class="text-[10px] font-bold text-ink-muted uppercase">{{
        typeLabels[result.type]
      }}</span>
    </button>
  </div>
</template>

<style scoped>
.results button.active {
  background: var(--color-accent-soft);
}
</style>
