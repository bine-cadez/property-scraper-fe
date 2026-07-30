<script setup lang="ts">
import type { Parcel } from '#shared/types/property'
import { formatArea, formatEur } from '#shared/utils/format'

defineProps<{ parcel: Parcel }>()
</script>

<template>
  <section class="facts">
    <header>
      <span>Katastrski podatki</span>
      <h3>Parcela {{ parcel.parcelNumber }}</h3>
    </header>
    <dl>
      <div>
        <dt>Katastrska občina</dt>
        <dd>
          {{ parcel.cadastralMunicipalityId }}
          {{ parcel.cadastralMunicipalityName }}
        </dd>
      </div>
      <div>
        <dt>Površina</dt>
        <dd>{{ formatArea(parcel.areaM2) }}</dd>
      </div>
      <div>
        <dt>Dejanska raba</dt>
        <dd>{{ parcel.landUse }}</dd>
      </div>
      <div>
        <dt>Namenska raba</dt>
        <dd>{{ parcel.intendedUse }}</dd>
      </div>
      <div>
        <dt>Prostorski akt</dt>
        <dd>{{ parcel.regulationStatus }}</dd>
      </div>
      <div>
        <dt>Uradna vrednost zemljišča</dt>
        <dd>
          {{
            parcel.officialValue
              ? formatEur(parcel.officialValue.amount)
              : 'Ni na voljo'
          }}
        </dd>
      </div>
    </dl>
    <DataSourceBadge :source="parcel.dataSource" />
    <DataFreshness
      :date="parcel.sourceUpdatedAt"
      :quality="parcel.dataSource.quality"
    />
  </section>
</template>

<style scoped>
.facts {
  display: grid;
  gap: 14px;
}

header span {
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

h3 {
  margin: 3px 0 0;
  font-size: 16px;
}

dl {
  margin: 0;
  border-top: 1px solid var(--color-line);
}

dl div {
  display: grid;
  grid-template-columns: minmax(110px, 0.8fr) 1.2fr;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-line);
}

dt {
  color: var(--color-ink-muted);
  font-size: 11px;
}

dd {
  margin: 0;
  font-size: 12px;
  font-weight: 650;
  text-align: right;
}
</style>
