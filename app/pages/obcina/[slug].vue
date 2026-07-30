<script setup lang="ts">
const route = useRoute()
const name = computed(() =>
  String(route.params.slug)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
)
useSeoMeta({
  title: () => `${name.value} – nepremičninski pregled | Prostor na dlani`,
  description: () => `Pregled nepremičnin in trga za občino ${name.value}.`,
  robots: 'noindex, follow',
})
</script>

<template>
  <ContentPage
    eyebrow="Občinski pregled v pripravi"
    :title="name"
    description="MVP še ne objavlja agregatov brez dovolj popolnih in preverjenih podatkov. Območje lahko že raziščete na zemljevidu."
  >
    <h2>Načrtovan pregled</h2>
    <p>
      Stran bo vsebovala preverjene kazalnike prodaj, ponudbe, tipov stavb in
      gibanja cen.
    </p>
  </ContentPage>
</template>
