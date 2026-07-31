<script setup lang="ts">
import type { Building } from '#shared/types/property'
import { formatArea } from '#shared/utils/format'

defineProps<{ building: Building | undefined }>()
</script>

<template>
  <section class="grid gap-3.5">
    <header>
      <span class="text-[10px] font-extrabold uppercase text-official"
        >Register nepremičnin</span
      >
      <h3 class="mt-0.5 text-base font-bold">Podatki o stavbi</h3>
    </header>
    <dl
      v-if="building"
      class="border-t border-line [&>div]:grid [&>div]:grid-cols-[0.8fr_1.2fr] [&>div]:gap-3 [&>div]:border-b [&>div]:border-line [&>div]:py-[11px] [&_dd]:m-0 [&_dd]:text-right [&_dd]:text-xs [&_dd]:font-[650] [&_dt]:text-[11px] [&_dt]:text-ink-muted"
    >
      <div>
        <dt>Naslov</dt>
        <dd>{{ building.address }}</dd>
      </div>
      <div>
        <dt>Raba</dt>
        <dd>{{ building.buildingUse }}</dd>
      </div>
      <div>
        <dt>Tloris / bruto</dt>
        <dd>
          {{ formatArea(building.footprintAreaM2) }} /
          {{ formatArea(building.grossAreaM2) }}
        </dd>
      </div>
      <div>
        <dt>Leto gradnje</dt>
        <dd>{{ building.constructionYear || 'Ni podatka' }}</dd>
      </div>
      <div>
        <dt>Leto prenove</dt>
        <dd>{{ building.renovationYear || 'Ni podatka' }}</dd>
      </div>
      <div>
        <dt>Etaže / deli</dt>
        <dd>{{ building.floors }} / {{ building.unitCount }}</dd>
      </div>
      <div>
        <dt>Energijski razred</dt>
        <dd>{{ building.energyRating || 'Ni na voljo' }}</dd>
      </div>
    </dl>
    <div
      v-else
      class="border border-dashed border-line p-4 text-xs text-ink-muted"
    >
      Stavba na tej parceli ni evidentirana ali podatek ni na voljo.
    </div>
  </section>
</template>
