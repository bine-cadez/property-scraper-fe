<script setup lang="ts">
import type { Building } from '#shared/types/property'
import { formatArea } from '#shared/utils/format'

defineProps<{ building: Building | undefined }>()
</script>

<template>
  <section class="building-facts">
    <header>
      <span>Register nepremičnin</span>
      <h3>Podatki o stavbi</h3>
    </header>
    <dl v-if="building">
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
    <div v-else class="missing">
      Stavba na tej parceli ni evidentirana ali podatek ni na voljo.
    </div>
  </section>
</template>

<style scoped>
.building-facts {
  display: grid;
  gap: 14px;
}

header span {
  color: var(--color-official);
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
  grid-template-columns: 0.8fr 1.2fr;
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

.missing {
  padding: 16px;
  border: 1px dashed var(--color-line);
  color: var(--color-ink-muted);
  font-size: 12px;
}
</style>
