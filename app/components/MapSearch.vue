<script setup lang="ts">
import { sl } from '~/locales/sl'
import type { SearchResult } from '#shared/types/property'

const emit = defineEmits<{
  select: [result: SearchResult]
}>()

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const open = ref(false)
const activeIndex = ref(-1)
const inputRef = ref<HTMLInputElement>()
let debounceTimer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

const typeLabels: Record<SearchResult['type'], string> = {
  address: 'Naslov',
  municipality: 'Občina',
  settlement: 'Naselje',
  cadastral_municipality: 'Katastrska občina',
  parcel: 'Parcela',
  building: 'Stavba',
}

watch(query, (value) => {
  clearTimeout(debounceTimer)
  controller?.abort()
  activeIndex.value = -1
  if (value.trim().length < 2) {
    results.value = []
    loading.value = false
    open.value = false
    return
  }

  loading.value = true
  open.value = true
  debounceTimer = setTimeout(async () => {
    controller = new AbortController()
    try {
      const response = await $fetch<{ results: SearchResult[] }>(
        '/api/search',
        {
          query: { q: value.trim() },
          signal: controller.signal,
        },
      )
      results.value = response.results
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        results.value = []
      }
    } finally {
      loading.value = false
    }
  }, 220)
})

function choose(result: SearchResult) {
  query.value = result.primaryLabel
  open.value = false
  emit('select', result)
}

function handleKeydown(event: KeyboardEvent) {
  if (!open.value && event.key === 'ArrowDown') open.value = true
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(
      activeIndex.value + 1,
      results.value.length - 1,
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    const result = results.value[activeIndex.value]
    if (result) choose(result)
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

function clear() {
  query.value = ''
  results.value = []
  inputRef.value?.focus()
}
</script>

<template>
  <div class="search-shell">
    <div class="search-box map-overlay">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="10.8"
          cy="10.8"
          r="6.4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="m16 16 4 4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <label class="sr-only" for="map-search">{{ sl.search.label }}</label>
      <input
        id="map-search"
        ref="inputRef"
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="sl.search.placeholder"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="search-results"
        :aria-expanded="open"
        :aria-activedescendant="
          activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
        "
        @focus="open = query.trim().length >= 2"
        @keydown="handleKeydown"
      />
      <span v-if="loading" class="tiny-spinner" aria-label="Iščemo" />
      <button
        v-else-if="query"
        type="button"
        aria-label="Počisti iskanje"
        @click="clear"
      >
        ×
      </button>
      <kbd>⌘ K</kbd>
    </div>

    <SearchResults
      v-if="open"
      id="search-results"
      :results="results"
      :active-index="activeIndex"
      :loading="loading"
      :type-labels="typeLabels"
      @select="choose"
      @hover="activeIndex = $event"
    />
  </div>
</template>

<style scoped>
.search-shell {
  position: relative;
  width: min(520px, calc(100vw - 32px));
}

.search-box {
  display: grid;
  grid-template-columns: 22px 1fr auto auto;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 16px;
  border-radius: var(--radius-md);
}

svg {
  width: 21px;
  color: var(--color-accent);
}

input {
  min-width: 0;
  height: 50px;
  border: 0;
  outline: 0;
  color: var(--color-ink);
  background: transparent;
  font-size: 15px;
}

input::placeholder {
  color: #7a8783;
}

button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-ink-muted);
  background: transparent;
  font-size: 21px;
}

button:hover {
  background: #f0f4f2;
}

kbd {
  padding: 3px 6px;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  color: var(--color-ink-muted);
  background: #f8faf9;
  font-family: inherit;
  font-size: 10px;
}

.tiny-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid var(--color-accent-soft);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .search-box {
    min-height: 48px;
  }

  input {
    height: 46px;
    font-size: 14px;
  }

  kbd {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tiny-spinner {
    animation: none;
    border-color: var(--color-accent);
  }
}
</style>
