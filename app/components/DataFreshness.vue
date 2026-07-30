<script setup lang="ts">
import type { DataQuality } from '#shared/types/property'
import { formatDate } from '#shared/utils/format'

defineProps<{
  date: string
  quality?: DataQuality
}>()

const labels: Record<DataQuality, string> = {
  current: 'Sveži podatki',
  stale: 'Podatki so lahko zastareli',
  partial: 'Delni podatki',
  unavailable: 'Datum ni na voljo',
}
</script>

<template>
  <span class="freshness" :class="quality || 'current'">
    <span class="dot" aria-hidden="true" />
    {{ quality ? labels[quality] : 'Posodobljeno' }} · {{ formatDate(date) }}
  </span>
</template>

<style scoped>
.freshness {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}

.stale .dot,
.partial .dot {
  background: var(--color-warm);
}

.unavailable .dot {
  background: #9aa4a1;
}
</style>
