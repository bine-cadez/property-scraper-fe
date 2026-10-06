<script setup lang="ts">
import { BadgeCheck } from "@lucide/vue";
import type { DataSource } from "#shared/types/property";

defineProps<{
  source: DataSource;
}>();
</script>

<template>
  <span
    class="inline-flex items-center gap-[5px] text-[11px] leading-[1.35] text-ink-muted"
  >
    <BadgeCheck
      class="w-3.5 shrink-0 text-accent"
      :stroke-width="1.7"
      aria-hidden="true"
    />
    {{ source.name }}
  </span>
</template>
