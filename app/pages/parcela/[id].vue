<script setup lang="ts">
import type { PropertyRecord } from '#shared/types/property'

const route = useRoute()
const { data, error } = await useAsyncData(
  `parcel-${String(route.params.id)}`,
  () =>
    $fetch<PropertyRecord>(
      `/api/property/${encodeURIComponent(String(route.params.id))}`,
    ),
)
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Parcela ni najdena.' })
}
useSeoMeta({
  title: () => `Parcela ${data.value!.parcel.parcelNumber} | Prostor na dlani`,
  description: () =>
    `Katastrski podatki za parcelo ${data.value!.parcel.parcelNumber}, k. o. ${data.value!.parcel.cadastralMunicipalityName}.`,
})
useHead({
  link: [{ rel: 'canonical', href: `/parcela/${String(route.params.id)}` }],
})
</script>

<template>
  <ContentPage
    v-if="data"
    eyebrow="Katastrski pregled"
    :title="`Parcela ${data.parcel.parcelNumber}`"
    :description="`k. o. ${data.parcel.cadastralMunicipalityId} ${data.parcel.cadastralMunicipalityName}`"
  >
    <ParcelFacts :parcel="data.parcel" />
    <h2>Povezana nepremičnina</h2>
    <p>{{ data.address }} je evidentirana na tej parceli.</p>
    <NuxtLink :to="`/nepremicnina/${data.id}`"
      >Odpri celoten pregled nepremičnine →</NuxtLink
    >
  </ContentPage>
</template>
