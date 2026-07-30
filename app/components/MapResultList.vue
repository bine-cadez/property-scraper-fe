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
    class="result-list map-overlay"
    :class="{ expanded }"
    aria-label="Besedilni seznam rezultatov na zemljevidu"
  >
    <button
      class="result-trigger"
      type="button"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span aria-hidden="true">☷</span>
      <strong>Rezultati na karti</strong>
      <small>{{ results.length }}</small>
    </button>
    <div v-if="expanded" class="result-items">
      <button
        v-for="result in results"
        :key="result.id"
        type="button"
        @click="$emit('select', result)"
      >
        <strong>{{ result.primaryLabel }}</strong>
        <span>{{ result.secondaryLabel }}</span>
      </button>
      <p v-if="!results.length">
        Na trenutnem območju ni besedilnih rezultatov.
      </p>
    </div>
  </section>
</template>

<style scoped>
.result-list {
  width: 210px;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.result-trigger {
  display: grid;
  width: 100%;
  min-height: 46px;
  grid-template-columns: 20px 1fr auto;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border: 0;
  color: var(--color-ink);
  background: transparent;
  text-align: left;
}

.result-trigger > span {
  color: var(--color-accent);
}

.result-trigger strong {
  font-size: 11px;
}

.result-trigger small {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
  font-size: 9px;
}

.result-items {
  padding: 4px 7px 7px;
  border-top: 1px solid var(--color-line);
}

.result-items button {
  display: grid;
  width: 100%;
  gap: 3px;
  min-height: 53px;
  padding: 8px;
  border: 0;
  border-radius: 7px;
  color: var(--color-ink);
  background: transparent;
  text-align: left;
}

.result-items button:hover {
  background: var(--color-accent-soft);
}

.result-items strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-items span,
.result-items p {
  overflow: hidden;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px), (max-height: 560px) and (max-width: 1024px) {
  .result-list {
    display: none;
  }
}
</style>
