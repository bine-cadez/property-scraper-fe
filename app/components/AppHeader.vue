<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
<script setup lang="ts">
import { sl } from '~/locales/sl'

defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <header
    class="relative z-50 flex h-16 items-center justify-between gap-6 border-b border-line bg-white/96 px-[22px] max-[760px]:h-14 max-[760px]:px-3.5"
  >
    <NuxtLink
      class="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] text-ink no-underline transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:scale-[0.97] motion-reduce:active:scale-100 max-[760px]:text-sm"
      to="/"
      aria-label="Prostor na dlani, domov"
    >
      <span
        class="grid size-[34px] place-items-center rounded-[9px] bg-accent text-white max-[760px]:size-8"
        aria-hidden="true"
      >
        <svg class="w-[22px]" viewBox="0 0 28 28" fill="none">
          <path
            d="M5.5 7.5 14 3l8.5 4.5v10L14 25l-8.5-7.5v-10Z"
            stroke="currentColor"
            stroke-width="2"
          />
          <path
            d="m5.5 7.5 8.5 5 8.5-5M14 12.5V25"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
      </span>
      <span
        ><strong class="font-[750]">{{ sl.brand }}</strong>
        {{ sl.brandSuffix }}</span
      >
    </NuxtLink>

    <nav
      v-if="!compact"
      class="mr-auto flex items-center gap-7 max-[760px]:hidden [&_a.router-link-active]:text-accent-strong [&_a]:text-sm [&_a]:font-semibold [&_a]:text-ink-muted [&_a]:no-underline [&_a]:hover:text-accent-strong"
      aria-label="Glavna navigacija"
    >
      <NuxtLink to="/zemljevid">{{ sl.navigation.map }}</NuxtLink>
      <NuxtLink to="/trg-nepremicnin">{{ sl.navigation.market }}</NuxtLink>
      <NuxtLink to="/metodologija">{{ sl.navigation.methodology }}</NuxtLink>
      <NuxtLink to="/viri-podatkov">{{ sl.navigation.sources }}</NuxtLink>
    </nav>

    <div class="flex items-center gap-3.5">
      <span
        class="rounded-[5px] border border-[#b9cec8] px-[7px] py-1 text-[10px] font-extrabold tracking-[0.08em] text-accent-strong"
        >DEMO</span
      >
      <NuxtLink
        class="text-sm font-semibold text-ink-muted no-underline transition-[background-color,color,border-color,transform] duration-150 ease-out-expo hover:text-accent-strong active:scale-[0.97] motion-reduce:active:scale-100 max-[760px]:hidden"
        to="/o-projektu"
        >O projektu</NuxtLink
      >
    </div>
  </header>
</template>
