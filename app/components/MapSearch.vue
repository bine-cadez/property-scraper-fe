<script setup lang="ts">
import { sl } from '~/locales/sl'
import type { SearchResult } from '#shared/types/property'
import { isAbortError } from '~/utils/request'

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
    const requestController = new AbortController()
    controller = requestController
    try {
      const response = await $fetch<{ results: SearchResult[] }>(
        '/api/search',
        {
          query: { q: value.trim() },
          signal: requestController.signal,
        },
      )
      if (controller === requestController) {
        results.value = response.results
      }
    } catch (error) {
      if (!isAbortError(error) && controller === requestController) {
        results.value = []
      }
    } finally {
      if (controller === requestController) {
        loading.value = false
      }
    }
  }, 220)
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  controller?.abort()
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
  <div class="search-shell relative w-[min(520px,calc(100vw-32px))]">
    <div
      class="search-box grid min-h-[52px] grid-cols-[22px_1fr_auto_auto] items-center gap-2.5 rounded-md border border-line/92 bg-white/96 pr-3 pl-4 shadow-overlay backdrop-blur-[14px] max-[640px]:min-h-12"
    >
      <svg class="w-[21px] text-accent" viewBox="0 0 24 24" aria-hidden="true">
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
        class="search-input h-[50px] min-w-0 border-0 bg-transparent text-[15px] text-ink outline-0 placeholder:text-[#7a8783] max-[640px]:h-[46px] max-[640px]:text-sm"
        @focus="open = query.trim().length >= 2"
        @keydown="handleKeydown"
      />
      <span
        v-if="loading"
        class="size-[15px] animate-spin rounded-full border-2 border-accent-soft border-t-accent motion-reduce:animate-none motion-reduce:border-accent"
        aria-label="Iščemo"
      />
      <button
        v-else-if="query"
        class="grid size-9 place-items-center rounded-full bg-transparent text-[21px] text-ink-muted hover:bg-[#f0f4f2]"
        type="button"
        aria-label="Počisti iskanje"
        @click="clear"
      >
        ×
      </button>
      <kbd
        class="rounded border border-line bg-[#f8faf9] px-1.5 py-[3px] font-sans text-[10px] text-ink-muted max-[640px]:hidden"
        >⌘ K</kbd
      >
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
.search-input:focus-visible {
  outline: 0;
}

.search-input::-webkit-search-cancel-button,
.search-input::-webkit-search-decoration {
  display: none;
  appearance: none;
}

.search-box:focus-within {
  outline: 3px solid rgb(8 127 112 / 32%);
  outline-offset: 2px;
}
</style>
