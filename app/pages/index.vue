<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
useSeoMeta({
  title: 'Prostor na dlani | Podatki o slovenskih nepremičninah',
  description:
    'Pregleden dostop do parcel, stavb, vrednosti in primerljivih prodaj slovenskih nepremičnin.',
  ogTitle: 'Prostor na dlani',
  ogDescription:
    'Mirnejši in razumljivejši način raziskovanja slovenskih nepremičnin.',
  ogType: 'website',
})

useHead({
  link: [{ rel: 'canonical', href: '/' }],
})
</script>

<template>
  <div class="min-h-dvh bg-[#f9fbfa]">
    <AppHeader />
    <main>
      <section
        class="mx-auto grid min-h-[670px] w-[min(1240px,calc(100%-44px))] grid-cols-[0.8fr_1.2fr] items-center gap-[70px] py-16 max-[900px]:grid-cols-1 max-[900px]:gap-12 max-[620px]:w-[min(100%-28px,1240px)] max-[620px]:pt-11"
      >
        <div>
          <span
            class="text-[11px] font-extrabold tracking-[0.09em] text-accent-strong uppercase"
            >Slovenska nepremičninska inteligenca</span
          >
          <h1
            class="my-4 mb-5 text-[clamp(42px,5.4vw,70px)] leading-[1.01] font-[720] tracking-[-0.055em] max-[620px]:text-[42px]"
          >
            Prostor razumete,<br />preden se odločite.
          </h1>
          <p class="max-w-[540px] text-[17px] leading-[1.65] text-ink-muted">
            Parcele, stavbe, uradne vrednosti, tržne ocene in dejanske prodaje v
            enem jasnem prostorskem pogledu.
          </p>
          <div
            class="my-[30px] flex items-center gap-[22px] max-[620px]:flex-col max-[620px]:items-start"
          >
            <NuxtLink
              class="inline-flex min-h-[50px] items-center gap-[26px] rounded-sm bg-accent px-[18px] text-[13px] font-[750] text-white no-underline transition-[background-color,color,border-color,transform] duration-150 ease-out-expo hover:bg-accent-strong active:scale-[0.97] motion-reduce:active:scale-100"
              to="/zemljevid"
            >
              Odpri zemljevid <span aria-hidden="true">→</span>
            </NuxtLink>
            <NuxtLink
              class="text-[13px] font-bold text-accent-strong"
              to="/metodologija"
              >Kako delujejo ocene?</NuxtLink
            >
          </div>
          <ul
            class="grid list-none gap-[9px] p-0 text-[11px] text-ink-muted [&_li]:flex [&_li]:items-center [&_li]:gap-2"
            aria-label="Ključne lastnosti"
          >
            <li>
              <i class="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Kategorije cen so vedno jasno ločene
            </li>
            <li>
              <i class="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Vir, datum in zanesljivost ob vsakem podatku
            </li>
            <li>
              <i class="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Brez podatkov o lastništvu fizičnih oseb
            </li>
          </ul>
        </div>

        <NuxtLink
          class="block overflow-hidden rounded-[14px] border border-line bg-white text-ink no-underline shadow-[0_24px_60px_rgb(23_33_31_/_12%)] max-[900px]:max-w-[720px]"
          to="/zemljevid"
          aria-label="Odpri interaktivni zemljevid"
        >
          <div
            class="flex h-[58px] items-center gap-2.5 border-b border-line px-3.5"
          >
            <span
              class="flex h-[38px] flex-1 items-center rounded-[7px] border border-line px-3 text-[11px] text-ink-muted"
              >⌕ &nbsp; Trubarjeva cesta 47, Ljubljana</span
            >
            <span
              class="rounded-[7px] border border-[#a9d0c6] bg-accent-soft px-2.5 py-2 text-[10px] font-bold text-accent-strong"
              >Parcele</span
            >
          </div>
          <div
            class="relative h-[440px] overflow-hidden bg-[#dce7e2] bg-[linear-gradient(28deg,transparent_48%,rgb(255_255_255_/_58%)_49%,rgb(255_255_255_/_58%)_53%,transparent_54%)] max-[620px]:h-[330px]"
          >
            <span
              class="absolute top-[150px] left-[-50px] h-[34px] w-[800px] -rotate-[18deg] bg-[#f6f8f7] shadow-[inset_0_0_0_1px_#d2dcd8]"
            />
            <span
              class="absolute top-10 left-[270px] h-[34px] w-[500px] rotate-[72deg] bg-[#f6f8f7] shadow-[inset_0_0_0_1px_#d2dcd8]"
            />
            <span
              class="absolute top-20 left-[70px] h-[120px] w-[190px] skew-y-[-9deg] border-2 border-[#cf8c3b] bg-[rgb(244_214_168_/_34%)]"
            />
            <span
              class="absolute top-[203px] left-[230px] h-[140px] w-[210px] skew-y-[-9deg] border-2 border-[#cf8c3b] bg-[rgb(244_214_168_/_34%)]"
            />
            <span
              class="absolute top-[42px] right-[54px] h-32 w-[170px] skew-y-[-9deg] border-2 border-[#cf8c3b] bg-[rgb(244_214_168_/_34%)]"
            />
            <span
              class="absolute top-[115px] left-[117px] h-[55px] w-[92px] skew-y-[-9deg] border-2 border-[#3e6b61] bg-[#91ada5]"
            />
            <span
              class="absolute top-[235px] left-[286px] h-16 w-[104px] skew-y-[-9deg] border-2 border-[#3e6b61] bg-[#91ada5]"
            />
            <span
              class="absolute top-[91px] left-[216px] z-2 rounded-[6px] border-2 border-white bg-sale px-2 py-1.5 text-[9px] font-extrabold text-white shadow-[0_3px_10px_rgb(23_33_31_/_18%)]"
              >4.700 €/m²</span
            >
            <span
              class="absolute top-[211px] left-[403px] z-2 rounded-[6px] border-2 border-white bg-listing px-2 py-1.5 text-[9px] font-extrabold text-white shadow-[0_3px_10px_rgb(23_33_31_/_18%)]"
              >5.187 €/m²</span
            >
            <div
              class="absolute right-3.5 bottom-3.5 grid w-[220px] gap-1 border-l-[3px] border-accent bg-white p-4 shadow-overlay"
            >
              <small class="text-[8px] font-extrabold text-accent-strong"
                >IZRAČUNANA TRŽNA OCENA</small
              >
              <strong class="text-2xl">348.000 €</strong>
              <span class="text-[9px] text-ink-muted"
                >4.971 €/m² · visoka zanesljivost</span
              >
            </div>
          </div>
          <span class="block px-3.5 py-2.5 text-right text-[9px] text-ink-muted"
            >Interaktivni pregled Ljubljane · vzorčni podatki</span
          >
        </NuxtLink>
      </section>

      <section
        class="bg-[#17211f] px-[max(22px,calc((100vw-1240px)/2))] py-20 text-white"
        aria-labelledby="principles-title"
      >
        <header
          class="flex items-end justify-between gap-5 border-b border-[#3b4744] pb-[30px] max-[620px]:flex-col max-[620px]:items-start"
        >
          <span
            class="text-[11px] font-extrabold tracking-[0.09em] text-[#85c7b7] uppercase"
            >Od podatka do odločitve</span
          >
          <h2
            id="principles-title"
            class="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.035em]"
          >
            Manj ugibanja. Več konteksta.
          </h2>
        </header>
        <div
          class="grid grid-cols-3 max-[620px]:grid-cols-1 [&>article+article]:pl-[30px] [&>article:last-child]:border-r-0 [&>article]:border-r [&>article]:border-[#3b4744] [&>article]:pt-[34px] [&>article]:pr-[30px] [&>article]:pb-5 max-[620px]:[&>article+article]:pl-0 max-[620px]:[&>article]:border-r-0 max-[620px]:[&>article]:border-b max-[620px]:[&>article]:py-[25px]"
        >
          <article>
            <span class="text-[10px] font-extrabold text-[#85c7b7]">01</span>
            <h3 class="mt-7 mb-2.5 text-lg font-bold">Najprej prostor</h3>
            <p class="text-[13px] leading-relaxed text-[#aebbb7]">
              Raziskujte okolico in meje zemljišč, ne le vrstic v nepregledni
              tabeli.
            </p>
          </article>
          <article>
            <span class="text-[10px] font-extrabold text-[#85c7b7]">02</span>
            <h3 class="mt-7 mb-2.5 text-lg font-bold">Vrednosti z razlago</h3>
            <p class="text-[13px] leading-relaxed text-[#aebbb7]">
              Uradne ocene, modelne ocene, oglasi in prodaje ostanejo ločene
              kategorije.
            </p>
          </article>
          <article>
            <span class="text-[10px] font-extrabold text-[#85c7b7]">03</span>
            <h3 class="mt-7 mb-2.5 text-lg font-bold">Preverljivi viri</h3>
            <p class="text-[13px] leading-relaxed text-[#aebbb7]">
              Vsak podatek pove, od kod prihaja, kako svež je in koliko mu lahko
              zaupate.
            </p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
