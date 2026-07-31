<script setup lang="ts">
import type { ConfidenceLevel } from '#shared/types/property'

defineProps<{
  confidence: ConfidenceLevel
}>()

const labels: Record<ConfidenceLevel, string> = {
  high: 'Visoka zanesljivost',
  medium: 'Srednja zanesljivost',
  low: 'Nizka zanesljivost',
  unavailable: 'Zanesljivost ni določena',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-[7px] text-[11px]"
    :class="confidence === 'low' ? 'text-[#9a5b1e]' : 'text-ink-muted'"
  >
    <span class="inline-flex h-[11px] items-end gap-0.5" aria-hidden="true">
      <i
        class="h-1 w-[3px] rounded-[1px]"
        :class="
          confidence === 'low'
            ? 'bg-warm'
            : confidence === 'unavailable'
              ? 'bg-[#ced7d3]'
              : 'bg-accent'
        "
      />
      <i
        class="h-[7px] w-[3px] rounded-[1px]"
        :class="
          confidence === 'medium' || confidence === 'high'
            ? 'bg-accent'
            : 'bg-[#ced7d3]'
        "
      />
      <i
        class="h-2.5 w-[3px] rounded-[1px]"
        :class="confidence === 'high' ? 'bg-accent' : 'bg-[#ced7d3]'"
      />
    </span>
    {{ labels[confidence] }}
  </span>
</template>
