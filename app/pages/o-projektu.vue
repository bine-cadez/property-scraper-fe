<script setup lang="ts">
useSeoMeta({
  title: 'O projektu | Prostor na dlani',
  description:
    'Zakaj gradimo razumljivejši prostorski pregled slovenskih nepremičnin.',
})
useHead({ link: [{ rel: 'canonical', href: '/o-projektu' }] })
</script>

<template>
  <ContentPage
    eyebrow="Prvi produkcijski MVP"
    title="Razumljivejši pogled na prostor"
    description="Prostor na dlani je izviren slovenski koncept za hitro raziskovanje nepremičninskih in katastrskih dejstev."
  >
    <h2>Naš cilj</h2>
    <p>
      Ljudem želimo pomagati razumeti, kaj podatki o nepremičnini res pomenijo.
      Zemljevid je izhodišče, podrobnosti pa razkrivamo postopno in vedno s
      kontekstom vira.
    </p>
    <h2>Kaj MVP ni</h2>
    <p>
      To ni uradna evidenca, cenilsko poročilo ali pravna dokumentacija.
      Trenutni zapisi so sintetični in namenjeni preverjanju produkta ter
      integracijske arhitekture.
    </p>
  </ContentPage>
</template>
