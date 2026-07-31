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
  <section class="grid gap-4">
    <header class="flex items-end justify-between gap-3">
      <div>
        <span class="text-[10px] font-extrabold uppercase text-accent-strong"
          >Primerjava kategorij</span
        >
        <h3 class="mt-0.5 text-base font-bold">Vrednosti niso ista stvar</h3>
      </div>
      <NuxtLink
        class="text-[11px] font-bold text-accent-strong"
        to="/metodologija"
        >Kako računamo?</NuxtLink
      >
    </header>

    <div class="border-t border-line">
      <div
        v-for="value in values"
        :key="value.valueType"
        class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-line py-[15px]"
      >
        <PriceMetric class="col-span-full" :value="value" />
        <DataSourceBadge :source="value.source" />
        <DataFreshness
          :date="value.sourceUpdatedAt"
          :quality="value.source.quality"
        />
      </div>
    </div>

    <div
      v-if="property.primaryValuation"
      class="border border-line bg-[#fafcfb] p-3.5"
    >
      <strong class="text-xs">Glavni dejavniki ocene</strong>
      <ul
        class="my-2.5 grid list-disc gap-1.5 pl-[18px] text-xs text-ink-muted"
      >
        <li
          v-for="factor in property.primaryValuation.explanatoryFactors"
          :key="factor"
        >
          {{ factor }}
        </li>
      </ul>
      <small class="text-[10px] text-ink-muted"
        >Metodologija {{ property.primaryValuation.methodologyVersion }}</small
      >
    </div>
  </section>
</template>
