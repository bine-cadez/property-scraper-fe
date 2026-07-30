<script setup lang="ts">
const route = useRoute()
const name = computed(() =>
  String(route.params.slug)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
)
useSeoMeta({
  title: () => `${name.value} – nepremičnine | Prostor na dlani`,
  description: () => `Prostorski pregled naselja ${name.value}.`,
  robots: 'noindex, follow',
})
</script>

<template>
  <ContentPage
    eyebrow="Pregled naselja v pripravi"
    :title="name"
    description="Objavili bomo le strani z dovolj vsebine in kakovostnimi podatki. MVP usmerja na raziskovanje območja z zemljevidom."
  >
    <h2>Raziskovanje prostora</h2>
    <p>
      Na zemljevidu so že na voljo vzorčne parcele, stavbe, transakcije in
      oglasi.
    </p>
  </ContentPage>
</template>
