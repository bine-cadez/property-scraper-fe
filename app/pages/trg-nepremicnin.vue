<script setup lang="ts">
useSeoMeta({
  title: 'Trg nepremičnin | Prostor na dlani',
  description:
    'Metodološko jasen pregled zaključenih prodaj in oglaševanih cen.',
})
useHead({ link: [{ rel: 'canonical', href: '/trg-nepremicnin' }] })
</script>

<template>
  <ContentPage
    eyebrow="Tržni pregled"
    title="Prodaje in ponudba brez zamenjav"
    description="Na tej strani bo agregiran pregled trga. MVP trenutno demonstrira primerljive transakcije in oglase na zemljevidu ter podrobni strani."
  >
    <h2>Zaključene transakcije</h2>
    <p>
      Podatki o dejanskih prodajah bodo prikazani po obdobju, vrsti nepremičnine
      in območju, skupaj s ceno na kvadratni meter in datumom vira.
    </p>
    <h2>Trenutna ponudba</h2>
    <p>
      Oglasi so ločen signal trga. Njihove zahtevane cene niso uporabljene kot
      dokaz zaključene prodaje in bodo vedno jasno označene.
    </p>
  </ContentPage>
</template>
