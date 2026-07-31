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
  <div class="grid gap-1">
    <span
      class="flex items-center gap-[7px] text-[11px] font-bold tracking-[0.02em] text-ink-muted"
    >
      <span
        class="size-2 border-2"
        :class="{
          'rounded-sm border-estimate':
            value.valueType === 'market_estimate' ||
            value.valueType === 'user_entered',
          'rounded-sm border-official': value.valueType === 'official_assessed',
          'rounded-full border-sale': value.valueType === 'transaction',
          'rotate-45 border-listing': value.valueType === 'asking',
        }"
        aria-hidden="true"
      />
      {{ getValueLabel(value.valueType) }}
    </span>
    <strong
      class="font-bold leading-tight tracking-[-0.025em] tabular-nums"
      :class="primary ? 'text-[clamp(28px,4vw,34px)]' : 'text-xl'"
      >{{ formatEur(value.amount) }}</strong
    >
    <span
      v-if="value.amountPerM2"
      class="text-xs font-semibold text-ink-muted"
      >{{ formatPricePerM2(value.amountPerM2) }}</span
    >
  </div>
</template>
