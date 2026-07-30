<script setup lang="ts">
import type { PropertyRecord } from '#shared/types/property'

const route = useRoute()
const { data, error } = await useAsyncData(
  `building-${String(route.params.id)}`,
  () =>
    $fetch<PropertyRecord>(
      `/api/property/${encodeURIComponent(String(route.params.id))}`,
    ),
)
if (error.value || !data.value?.building) {
  throw createError({ statusCode: 404, statusMessage: 'Stavba ni najdena.' })
}
useSeoMeta({
  title: () =>
    `${data.value!.building!.address} – podatki o stavbi | Prostor na dlani`,
  description: () =>
    `Evidentirani podatki o stavbi na naslovu ${data.value!.building!.address}.`,
})
useHead({
  link: [{ rel: 'canonical', href: `/stavba/${String(route.params.id)}` }],
})
</script>

<template>
  <ContentPage
    v-if="data?.building"
    eyebrow="Register nepremičnin"
    :title="data.building.address"
    :description="`${data.building.buildingUse} · ${data.building.unitCount} delov stavbe`"
  >
    <BuildingFacts :building="data.building" />
    <h2>Povezana nepremičnina</h2>
    <NuxtLink :to="`/nepremicnina/${data.id}`"
      >Odpri celoten pregled nepremičnine →</NuxtLink
    >
  </ContentPage>
</template>
