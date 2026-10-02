<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";

defineEmits<{
  close: [];
}>();
</script>

<template>
  <aside
    class="flex h-full min-h-full w-full flex-col bg-surface text-ink max-[720px]:min-h-dvh"
    aria-label="Nalaganje podrobnosti nepremičnine"
    aria-busy="true"
  >
    <header
      class="flex min-h-[58px] shrink-0 items-center border-b border-[#edf0ed] bg-white px-4 max-[720px]:sticky max-[720px]:top-0 max-[720px]:z-3"
    >
      <button
        type="button"
        class="inline-flex min-h-9 items-center gap-2 border-0 bg-transparent text-[11px] font-[650] text-[#294d43]"
        aria-label="Nazaj na rezultate"
        @click="$emit('close')"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        <span class="max-[720px]:hidden">Nazaj na rezultate</span>
        <span class="hidden text-[13px] max-[720px]:inline">Podrobnosti</span>
      </button>

      <div
        class="ml-auto flex items-center gap-2 text-[10px] font-[650] text-[#697772]"
        role="status"
        aria-live="polite"
      >
        <span
          class="size-3.5 animate-spin rounded-full border-2 border-[#dbe5d6] border-t-accent motion-reduce:animate-none motion-reduce:border-accent motion-reduce:opacity-70"
          aria-hidden="true"
        />
        Nalagamo podatke …
      </div>
    </header>

    <div
      class="min-h-0 flex-1 overflow-hidden p-4 max-[720px]:px-3 max-[720px]:pt-4"
      aria-hidden="true"
    >
      <div class="grid animate-pulse gap-4 motion-reduce:animate-none">
        <section class="grid gap-2.5 py-0.5">
          <span class="h-6 w-[72%] rounded-md bg-[#e3e9e5]" />
          <span class="h-2.5 w-[45%] rounded-full bg-[#edf0ed]" />
        </section>

        <section class="grid gap-3 rounded-[9px] bg-[#f1f5ed] p-[17px]">
          <span class="h-2.5 w-[28%] rounded-full bg-[#dfe7dc]" />
          <span class="h-8 w-[58%] rounded-md bg-[#dbe4d8]" />
          <span class="h-2.5 w-[44%] rounded-full bg-[#dfe7dc]" />
        </section>

        <section class="grid grid-cols-2 gap-2">
          <span class="h-[68px] rounded-[7px] bg-[#e9eeea]" />
          <span class="h-[68px] rounded-[7px] bg-[#e9eeea]" />
        </section>

        <section
          v-for="index in 2"
          :key="index"
          class="grid gap-3 border-t border-[#e7ebe8] pt-4"
        >
          <span class="h-3 w-[34%] rounded-full bg-[#e2e8e4]" />
          <span class="h-2.5 w-full rounded-full bg-[#edf0ed]" />
          <span class="h-2.5 w-[82%] rounded-full bg-[#edf0ed]" />
        </section>
      </div>
    </div>
  </aside>
</template>
