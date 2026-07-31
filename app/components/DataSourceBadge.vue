<script setup lang="ts">
import type { DataSource } from '#shared/types/property'

defineProps<{
  source: DataSource
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-[5px] text-[11px] leading-[1.35] text-ink-muted"
  >
    <svg
      class="w-3.5 shrink-0 text-accent"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M8 1.5 13 4v4.2c0 3-2 5.2-5 6.3-3-1.1-5-3.3-5-6.3V4l5-2.5Z"
        fill="none"
        stroke="currentColor"
      />
      <path
        d="m5.8 8 1.4 1.4 3-3"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
      />
    </svg>
    {{ source.name }}
  </span>
</template>
