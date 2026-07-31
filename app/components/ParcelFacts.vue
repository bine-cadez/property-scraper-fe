<script setup lang="ts">
import type { Parcel } from '#shared/types/property'
import { formatArea, formatEur } from '#shared/utils/format'

defineProps<{ parcel: Parcel }>()
</script>

<template>
  <section class="grid gap-3.5">
    <header>
      <span class="text-[10px] font-extrabold uppercase text-accent-strong"
        >Katastrski podatki</span
      >
      <h3 class="mt-0.5 text-base font-bold">
        Parcela {{ parcel.parcelNumber }}
      </h3>
    </header>
    <dl
      class="border-t border-line [&>div]:grid [&>div]:grid-cols-[minmax(110px,0.8fr)_1.2fr] [&>div]:gap-3 [&>div]:border-b [&>div]:border-line [&>div]:py-[11px] [&_dd]:m-0 [&_dd]:text-right [&_dd]:text-xs [&_dd]:font-[650] [&_dt]:text-[11px] [&_dt]:text-ink-muted"
    >
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
