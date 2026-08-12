<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
import type { MoneyValue, PropertyRecord } from '#shared/types/property'

const props = defineProps<{
  property: PropertyRecord
}>()

const primaryValue = computed<MoneyValue | null>(() => {
  const valuation = props.property.primaryValuation
  if (valuation) {
    return {
      amount: valuation.amount,
      valueType: valuation.valueType,
      source: valuation.source,
      sourceUpdatedAt: valuation.valuationDate,
      ...(valuation.amountPerM2 !== undefined
        ? { amountPerM2: valuation.amountPerM2 }
        : {}),
    }
  }
  return (
    props.property.units[0]?.officialValue ??
    props.property.building?.officialValue ??
    props.property.parcel.officialValue ??
    null
  )
})
</script>

<template>
  <section class="grid gap-[22px]">
    <div class="grid gap-[5px]">
      <span
        class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
      >
        {{
          property.propertyType === 'apartment' ? 'Stanovanje' : 'Nepremičnina'
        }}
        · ID {{ property.units[0]?.id || property.id }}
      </span>
      <h2 class="text-xl leading-tight font-bold tracking-[-0.02em]">
        {{ property.address }}
      </h2>
      <p class="text-xs leading-[1.45] text-ink-muted">
        Parcela {{ property.parcel.parcelNumber }} · k. o.
        {{ property.parcel.cadastralMunicipalityId }}
        {{ property.parcel.cadastralMunicipalityName }}
      </p>
    </div>

    <div
      v-if="primaryValue"
      class="grid grid-cols-[1fr_auto] gap-x-3 gap-y-[7px] border-l-[3px] border-accent bg-[#f5faf8] p-[18px]"
    >
      <PriceMetric class="col-span-full" :value="primaryValue" primary />
      <ConfidenceIndicator
        v-if="property.primaryValuation"
        :confidence="property.primaryValuation.confidence"
      />
      <DataFreshness
        :date="primaryValue.sourceUpdatedAt"
        :quality="primaryValue.source.quality"
      />
    </div>
    <div v-else class="border-l-[3px] border-[#9aa4a1] bg-[#f5f7f6] p-[17px]">
      <strong class="text-base">Vrednost ni na voljo</strong>
      <p class="text-xs leading-[1.45] text-ink-muted">
        Za ta zapis ni dovolj preverljivih podatkov.
      </p>
    </div>

    <dl
      class="grid grid-cols-3 border-y border-line [&>div:last-child]:border-r-0 [&>div]:grid [&>div]:gap-1 [&>div]:border-r [&>div]:border-line [&>div]:px-2 [&>div]:py-3.5 [&_dd]:m-0 [&_dd]:text-[13px] [&_dd]:font-[750] [&_dt]:text-[10px] [&_dt]:text-ink-muted"
    >
      <div>
        <dt>Uporabna površina</dt>
        <dd>
          {{
            property.units[0]
              ? formatArea(property.units[0].usableAreaM2)
              : 'Ni podatka'
          }}
        </dd>
      </div>
      <div>
        <dt>Prostori</dt>
        <dd>
          {{
            property.units[0]?.rooms
              ? `${property.units[0].rooms}-sobno`
              : 'Ni podatka'
          }}
        </dd>
      </div>
      <div>
        <dt>Leto gradnje</dt>
        <dd>{{ property.building?.constructionYear || 'Ni podatka' }}</dd>
      </div>
    </dl>
  </section>
</template>
