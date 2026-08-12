<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="min-h-dvh bg-[#f7f9f8]">
    <AppHeader />
    <main
      class="mx-auto w-[min(1040px,calc(100%-32px))] pt-16 pb-[90px] max-[700px]:pt-[42px]"
    >
      <header class="max-w-[760px] pb-9">
        <span
          class="text-[11px] font-extrabold tracking-[0.08em] text-accent-strong uppercase"
          >{{ eyebrow }}</span
        >
        <h1
          class="my-2.5 mb-3.5 text-[clamp(34px,6vw,58px)] leading-[1.03] font-bold tracking-[-0.045em]"
        >
          {{ title }}
        </h1>
        <p class="text-[17px] leading-[1.65] text-ink-muted">
          {{ description }}
        </p>
      </header>
      <div
        class="grid grid-cols-[minmax(0,1fr)_230px] items-start gap-[54px] border-t border-line pt-[34px] max-[700px]:grid-cols-1 max-[700px]:gap-[30px]"
      >
        <article
          class="text-[15px] leading-[1.7] text-[#35413e] [&_h2:first-child]:mt-0 [&_h2]:mt-9 [&_h2]:mb-2.5 [&_h2]:text-2xl [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:text-ink [&_li]:my-1.5 [&_p]:mb-4"
        >
          <slot />
        </article>
        <aside
          class="grid gap-0.5 border-t-2 border-accent py-3.5 max-[700px]:-order-1 [&_a]:border-b [&_a]:border-line [&_a]:px-1 [&_a]:py-[9px] [&_a]:text-xs [&_a]:font-[650] [&_a]:text-ink-muted [&_a]:no-underline [&_a]:hover:text-accent-strong"
        >
          <strong class="mb-2 text-[11px] uppercase">Hiter dostop</strong>
          <NuxtLink to="/zemljevid">Odpri zemljevid</NuxtLink>
          <NuxtLink to="/metodologija">Metodologija</NuxtLink>
          <NuxtLink to="/viri-podatkov">Viri podatkov</NuxtLink>
        </aside>
      </div>
    </main>
  </div>
</template>
