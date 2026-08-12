<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
interface DataOverview {
  sources: Record<string, unknown>[]
  statistics: Record<string, unknown>
  health: Record<string, unknown>
  readiness: Record<string, unknown>
}

const { data: overview } = await useAsyncData('gurs-data-overview', () =>
  $fetch<DataOverview>('/api/data-overview'),
)

const sourceLabel = (source: Record<string, unknown>) =>
  String(
    source.name ??
      source.datasetName ??
      source.dataset_name ??
      source.dataset ??
      source.id ??
      'GURS podatkovni vir',
  )

const sourceDate = (source: Record<string, unknown>) =>
  String(
    source.referenceDate ??
      source.reference_date ??
      source.retrievedAt ??
      source.retrieved_at ??
      '',
  )

const statistics = computed(() =>
  Object.entries(overview.value?.statistics ?? {}).filter(
    ([, value]) => typeof value === 'number',
  ),
)

useSeoMeta({
  title: 'Viri podatkov | Prostor na dlani',
  description:
    'Izvor, svežina in omejitve prostorskih in nepremičninskih podatkov.',
})
useHead({ link: [{ rel: 'canonical', href: '/viri-podatkov' }] })
</script>

<template>
  <ContentPage
    eyebrow="Sledljivost podatkov"
    title="Viri in omejitve"
    description="Podatki so pridobljeni prek Property Scraper API iz uradnih zbirk Geodetske uprave Republike Slovenije."
  >
    <h2>Trenutni uradni viri</h2>
    <ul v-if="overview?.sources.length">
      <li v-for="source in overview.sources" :key="String(source.id)">
        <strong>{{ sourceLabel(source) }}</strong>
        <span v-if="sourceDate(source)">
          · referenčni datum {{ sourceDate(source) }}</span
        >
      </li>
    </ul>
    <p v-else>
      Seznam virov trenutno ni dosegljiv. Posamezni zapisi še vedno jasno
      označujejo GURS kot izvor podatkov.
    </p>
    <h2>Pokritost podatkov</h2>
    <dl v-if="statistics.length">
      <div v-for="[label, value] in statistics" :key="label">
        <dt>{{ label }}</dt>
        <dd>{{ Number(value).toLocaleString('sl-SI') }}</dd>
      </div>
    </dl>
    <p v-else>Statistika pokritosti trenutno ni na voljo.</p>
    <h2>Oglasi</h2>
    <p>
      Property Scraper API trenutno zagotavlja uradne evidence in zaključene
      transakcije. Aktivni oglasi niso del tega podatkovnega vira; če bodo
      dodani, bodo vedno prikazani ločeno od doseženih prodajnih cen.
    </p>
    <h2>Zasebnost</h2>
    <p>
      Platforma ne prikazuje zaščitenih osebnih podatkov ali lastništva fizičnih
      oseb. Vsak prihodnji lastniški podatek zahteva ločen pravni in zasebnostni
      pregled.
    </p>
  </ContentPage>
</template>
