<script setup lang="ts">
useSeoMeta({
  title: 'Metodologija vrednotenja | Prostor na dlani',
  description:
    'Kako ločujemo uradne vrednosti, tržne ocene, prodajne in oglaševane cene.',
})
useHead({ link: [{ rel: 'canonical', href: '/metodologija' }] })
</script>

<template>
  <ContentPage
    eyebrow="Preglednost modelov"
    title="Kaj posamezna vrednost pomeni"
    description="Štiri številke lahko govorijo o isti nepremičnini, vendar ne odgovarjajo na isto vprašanje. Zato jih nikoli ne združujemo pod eno oznako."
  >
    <h2>Uradna posplošena vrednost</h2>
    <p>
      Vrednost iz uradnega sistema množičnega vrednotenja je vezana na model,
      datum in evidentirane lastnosti. Ni isto kot individualna cenitev ali
      pričakovana prodajna cena.
    </p>
    <h2>Izračunana tržna ocena</h2>
    <p>
      Modelna ocena uporablja primerljive zaključene prodaje, lokacijo in
      lastnosti nepremičnine. Ob njej vedno pokažemo datum izračuna, različico
      metodologije, pojasnjevalne dejavnike in stopnjo zanesljivosti.
    </p>
    <h2>Prodajna in oglaševana cena</h2>
    <p>
      Prodajna cena pomeni evidentirano zaključeno transakcijo. Oglaševana cena
      je trenutna zahteva prodajalca in se lahko od končne cene pomembno
      razlikuje.
    </p>
    <h2>Omejitve</h2>
    <p>
      Rezultati so informativni. Ne nadomeščajo strokovne cenitve, pravnega
      pregleda, geodetskega postopka ali investicijskega svetovanja.
    </p>
  </ContentPage>
</template>
