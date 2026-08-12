<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
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
  <span class="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
    <span
      class="size-1.5 rounded-full"
      :class="{
        'bg-accent': !quality || quality === 'current',
        'bg-warm': quality === 'stale' || quality === 'partial',
        'bg-[#9aa4a1]': quality === 'unavailable',
      }"
      aria-hidden="true"
    />
    {{ quality ? labels[quality] : 'Posodobljeno' }} · {{ formatDate(date) }}
  </span>
</template>
