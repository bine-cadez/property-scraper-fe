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
  <section class="sales">
    <header>
      <div>
        <span>ETN · zaključene transakcije</span>
        <h3>Primerljive prodaje v bližini</h3>
      </div>
      <strong>{{ transactions.length }}</strong>
    </header>
    <div v-if="transactions.length" class="sale-list">
      <article v-for="transaction in transactions" :key="transaction.id">
        <div class="sale-main">
          <strong>{{ formatEur(transaction.price.amount) }}</strong>
          <span>{{ formatPricePerM2(transaction.pricePerM2) }}</span>
        </div>
        <div class="sale-meta">
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
    <p v-else class="empty">
      V izbranem obdobju ni primerljivih zaključenih prodaj.
    </p>
  </section>
</template>

<style scoped>
.sales {
  display: grid;
  gap: 14px;
}

header {
  display: flex;
  align-items: end;
  justify-content: space-between;
}

header span {
  color: var(--color-sale);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

h3 {
  margin: 4px 0 0;
  font-size: 16px;
}

header > strong {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: var(--color-sale);
  background: var(--color-warm-soft);
  font-size: 11px;
}

.sale-list {
  border-top: 1px solid var(--color-line);
}

article {
  display: grid;
  gap: 7px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-line);
}

.sale-main,
.sale-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.sale-main strong {
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.sale-main span {
  color: var(--color-sale);
  font-size: 12px;
  font-weight: 750;
}

.sale-meta {
  color: var(--color-ink-muted);
  font-size: 11px;
}

.empty {
  padding: 20px;
  border: 1px dashed var(--color-line);
  color: var(--color-ink-muted);
  font-size: 12px;
  text-align: center;
}
</style>
