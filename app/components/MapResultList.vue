<script setup lang="ts">
import type { SearchResult } from '#shared/types/property'

defineEmits<{
  select: [result: SearchResult]
}>()

const expanded = ref(false)
const results = ref<SearchResult[]>([])

onMounted(async () => {
  try {
    const response = await $fetch<{ results: SearchResult[] }>('/api/search', {
      query: { q: 'Ljubljana' },
    })
    results.value = response.results
      .filter((result) => result.selectionId)
      .slice(0, 3)
  } catch {
    results.value = []
  }
})
</script>

<template>
  <section
    class="w-[210px] overflow-hidden rounded-md border border-line/92 bg-white/96 shadow-overlay backdrop-blur-[14px] max-[720px]:hidden max-[1024px]:max-h-[560px]:hidden"
    aria-label="Besedilni seznam rezultatov na zemljevidu"
  >
    <button
      class="grid min-h-[46px] w-full grid-cols-[20px_1fr_auto] items-center gap-[7px] bg-transparent px-3 text-left text-ink"
      type="button"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="text-accent" aria-hidden="true">☷</span>
      <strong class="text-[11px]">Rezultati na karti</strong>
      <small
        class="grid size-5 place-items-center rounded-full bg-accent-soft text-[9px] text-accent-strong"
        >{{ results.length }}</small
      >
    </button>
    <div v-if="expanded" class="border-t border-line px-[7px] pt-1 pb-[7px]">
      <button
        v-for="result in results"
        :key="result.id"
        class="grid min-h-[53px] w-full gap-[3px] rounded-[7px] bg-transparent p-2 text-left text-ink hover:bg-accent-soft"
        type="button"
        @click="$emit('select', result)"
      >
        <strong class="truncate text-[11px]">{{ result.primaryLabel }}</strong>
        <span class="truncate text-[9px] text-ink-muted">{{
          result.secondaryLabel
        }}</span>
      </button>
      <p v-if="!results.length" class="truncate text-[9px] text-ink-muted">
        Na trenutnem območju ni besedilnih rezultatov.
      </p>
    </div>
  </section>
</template>
