<script setup lang="ts">
import type { MoneyValue } from '#shared/types/property'
import { formatEur, formatPricePerM2 } from '#shared/utils/format'
import { getValueLabel } from '#shared/utils/value-labels'

defineProps<{
  value: MoneyValue
  primary?: boolean
}>()
</script>

<template>
  <div class="price-metric" :class="[value.valueType, { primary }]">
    <span class="category">
      <span class="category-mark" aria-hidden="true" />
      {{ getValueLabel(value.valueType) }}
    </span>
    <strong>{{ formatEur(value.amount) }}</strong>
    <span v-if="value.amountPerM2" class="per-m2">{{
      formatPricePerM2(value.amountPerM2)
    }}</span>
  </div>
</template>

<style scoped>
.price-metric {
  display: grid;
  gap: 4px;
}

.category {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ink-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.category-mark {
  width: 8px;
  height: 8px;
  border: 2px solid var(--color-estimate);
  border-radius: 2px;
}

.official_assessed .category-mark {
  border-color: var(--color-official);
}

.transaction .category-mark {
  border-color: var(--color-sale);
  border-radius: 50%;
}

.asking .category-mark {
  border-color: var(--color-listing);
  transform: rotate(45deg);
}

strong {
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}

.primary strong {
  font-size: clamp(28px, 4vw, 34px);
}

.per-m2 {
  color: var(--color-ink-muted);
  font-size: 12px;
  font-weight: 600;
}
</style>
