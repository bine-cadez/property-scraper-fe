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
  <section class="property-summary">
    <div class="identity">
      <span class="eyebrow">
        {{
          property.propertyType === 'apartment' ? 'Stanovanje' : 'Nepremičnina'
        }}
        · ID {{ property.units[0]?.id || property.id }}
      </span>
      <h2>{{ property.address }}</h2>
      <p>
        Parcela {{ property.parcel.parcelNumber }} · k. o.
        {{ property.parcel.cadastralMunicipalityId }}
        {{ property.parcel.cadastralMunicipalityName }}
      </p>
    </div>

    <div v-if="primaryValue" class="primary-value">
      <PriceMetric :value="primaryValue" primary />
      <ConfidenceIndicator
        v-if="property.primaryValuation"
        :confidence="property.primaryValuation.confidence"
      />
      <DataFreshness
        :date="primaryValue.sourceUpdatedAt"
        :quality="primaryValue.source.quality"
      />
    </div>
    <div v-else class="unavailable-value">
      <strong>Vrednost ni na voljo</strong>
      <p>Za ta zapis ni dovolj preverljivih podatkov.</p>
    </div>

    <dl class="quick-facts">
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

<style scoped>
.property-summary {
  display: grid;
  gap: 22px;
}

.identity {
  display: grid;
  gap: 5px;
}

.eyebrow {
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.identity p,
.unavailable-value p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 1.45;
}

.primary-value {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px 12px;
  padding: 18px;
  border-left: 3px solid var(--color-accent);
  background: #f5faf8;
}

.primary-value :deep(.price-metric) {
  grid-column: 1 / -1;
}

.unavailable-value {
  padding: 17px;
  border-left: 3px solid #9aa4a1;
  background: #f5f7f6;
}

.unavailable-value strong {
  font-size: 16px;
}

.quick-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.quick-facts div {
  display: grid;
  gap: 4px;
  padding: 14px 8px;
  border-right: 1px solid var(--color-line);
}

.quick-facts div:last-child {
  border-right: 0;
}

dt {
  color: var(--color-ink-muted);
  font-size: 10px;
}

dd {
  margin: 0;
  font-size: 13px;
  font-weight: 750;
}
</style>
