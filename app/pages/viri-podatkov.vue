<script setup lang="ts">
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
    description="MVP uporablja realistične sintetične podatke. Arhitektura je pripravljena za uradne storitve, vendar ne posnema ali strga spletnega vmesnika Javni vpogled."
  >
    <h2>Načrtovani uradni viri</h2>
    <ul>
      <li>
        GURS WFS in OGC API Features za podatke po omejenem prostorskem območju.
      </li>
      <li>
        Uradni WMS ali WMTS za rastrske sloje, kjer so pogoji uporabe ustrezni.
      </li>
      <li>Slovenski kataster nepremičnin za parcele, stavbe in dele stavb.</li>
      <li>
        ETN za zaključene transakcije v obsegu, ki ga dovoljujejo pravila
        objave.
      </li>
    </ul>
    <h2>Oglasi</h2>
    <p>
      Oglase bo mogoče priključiti le iz virov z jasno dovoljenimi pogoji
      ponovne uporabe. Oglaševana cena je vedno označena ločeno od prodajne
      cene.
    </p>
    <h2>Zasebnost</h2>
    <p>
      Platforma ne prikazuje zaščitenih osebnih podatkov ali lastništva fizičnih
      oseb. Vsak prihodnji lastniški podatek zahteva ločen pravni in zasebnostni
      pregled.
    </p>
  </ContentPage>
</template>
