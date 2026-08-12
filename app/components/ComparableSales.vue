<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
import type { Transaction } from '#shared/types/property'
import {
  formatArea,
  formatDate,
  formatEur,
  formatPricePerM2,
} from '#shared/utils/format'

defineProps<{
  transactions: Transaction[]
}>()
</script>

<template>
  <section class="grid gap-3.5">
    <header class="flex items-end justify-between">
      <div>
        <span class="text-[10px] font-extrabold uppercase text-sale"
          >ETN · zaključene transakcije</span
        >
        <h3 class="mt-1 text-base font-bold">Primerljive prodaje v bližini</h3>
      </div>
      <strong
        class="grid size-7 place-items-center rounded-full bg-warm-soft text-[11px] text-sale"
        >{{ transactions.length }}</strong
      >
    </header>
    <div v-if="transactions.length" class="border-t border-line">
      <article
        v-for="transaction in transactions"
        :key="transaction.id"
        class="grid gap-[7px] border-b border-line py-3.5"
      >
        <div class="flex justify-between gap-2.5">
          <strong class="text-[15px] tabular-nums">{{
            formatEur(transaction.price.amount)
          }}</strong>
          <span class="text-xs font-[750] text-sale">{{
            formatPricePerM2(transaction.pricePerM2)
          }}</span>
        </div>
        <div class="flex justify-between gap-2.5 text-[11px] text-ink-muted">
          <span
            >{{ formatArea(transaction.areaM2) }} ·
            {{ formatDate(transaction.transactionDate) }}</span
          >
          <span v-if="transaction.distanceFromSelectedProperty">
            {{ transaction.distanceFromSelectedProperty }} m stran
          </span>
        </div>
        <DataSourceBadge :source="transaction.dataSource" />
      </article>
    </div>
    <p
      v-else
      class="border border-dashed border-line p-5 text-center text-xs text-ink-muted"
    >
      V izbranem obdobju ni primerljivih zaključenih prodaj.
    </p>
  </section>
</template>
