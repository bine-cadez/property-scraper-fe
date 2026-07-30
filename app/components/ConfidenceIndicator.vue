<script setup lang="ts">
import type { ConfidenceLevel } from '#shared/types/property'

const props = defineProps<{
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
  <span class="confidence" :class="props.confidence">
    <span class="bars" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    {{ labels[confidence] }}
  </span>
</template>

<style scoped>
.confidence {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.bars {
  display: inline-flex;
  align-items: end;
  gap: 2px;
  height: 11px;
}

.bars i {
  width: 3px;
  border-radius: 1px;
  background: #ced7d3;
}

.bars i:nth-child(1) {
  height: 4px;
}
.bars i:nth-child(2) {
  height: 7px;
}
.bars i:nth-child(3) {
  height: 10px;
}

.low .bars i:first-child,
.medium .bars i:nth-child(-n + 2),
.high .bars i {
  background: var(--color-accent);
}

.low {
  color: #9a5b1e;
}

.low .bars i:first-child {
  background: var(--color-warm);
}
</style>
