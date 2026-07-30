<script setup lang="ts">
import type { MoneyValue, PropertyRecord } from '#shared/types/property'

const props = defineProps<{
  property: PropertyRecord
}>()

const values = computed<MoneyValue[]>(() => {
  const result: MoneyValue[] = []
  const unit = props.property.units[0]
  if (unit?.officialValue) result.push(unit.officialValue)
  if (props.property.primaryValuation) {
    const valuation = props.property.primaryValuation
    result.push({
      amount: valuation.amount,
      valueType: valuation.valueType,
      source: valuation.source,
      sourceUpdatedAt: valuation.valuationDate,
      ...(valuation.amountPerM2 !== undefined
        ? { amountPerM2: valuation.amountPerM2 }
        : {}),
    })
  }
  const transaction = props.property.transactions[0]
  if (transaction) result.push(transaction.price)
  const listing = props.property.listings[0]
  if (listing) result.push(listing.askingPrice)
  return result
})
</script>

<template>
  <section class="valuation-summary">
    <header>
      <div>
        <span class="section-kicker">Primerjava kategorij</span>
        <h3>Vrednosti niso ista stvar</h3>
      </div>
      <NuxtLink to="/metodologija">Kako računamo?</NuxtLink>
    </header>

    <div class="value-list">
      <div v-for="value in values" :key="value.valueType" class="value-row">
        <PriceMetric :value="value" />
        <DataSourceBadge :source="value.source" />
        <DataFreshness
          :date="value.sourceUpdatedAt"
          :quality="value.source.quality"
        />
      </div>
    </div>

    <div v-if="property.primaryValuation" class="factors">
      <strong>Glavni dejavniki ocene</strong>
      <ul>
        <li
          v-for="factor in property.primaryValuation.explanatoryFactors"
          :key="factor"
        >
          {{ factor }}
        </li>
      </ul>
      <small
        >Metodologija {{ property.primaryValuation.methodologyVersion }}</small
      >
    </div>
  </section>
</template>

<style scoped>
.valuation-summary {
  display: grid;
  gap: 16px;
}

header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

h3 {
  margin: 3px 0 0;
  font-size: 16px;
}

header a {
  color: var(--color-accent-strong);
  font-size: 11px;
  font-weight: 700;
}

.value-list {
  border-top: 1px solid var(--color-line);
}

.value-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-line);
}

.value-row :deep(.price-metric) {
  grid-column: 1 / -1;
}

.factors {
  padding: 14px;
  border: 1px solid var(--color-line);
  background: #fafcfb;
}

.factors strong {
  font-size: 12px;
}

ul {
  display: grid;
  gap: 6px;
  margin: 10px 0;
  padding-left: 18px;
  color: var(--color-ink-muted);
  font-size: 12px;
}

small {
  color: var(--color-ink-muted);
  font-size: 10px;
}
</style>
