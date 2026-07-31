<script setup lang="ts">
defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="grid max-w-[420px] grid-cols-[28px_1fr_auto] items-center gap-2.5 rounded-md border border-[#e6b5b5] bg-[#fffafa] p-3.5 shadow-overlay"
    role="alert"
  >
    <span
      class="grid size-[26px] place-items-center rounded-full bg-danger font-extrabold text-white"
      aria-hidden="true"
      >!</span
    >
    <div>
      <strong class="text-[13px]">Zemljevida ni bilo mogoče naložiti</strong>
      <p class="mt-0.5 text-[11px] text-ink-muted">
        Preverite povezavo ali poskusite znova.
      </p>
    </div>
    <button
      class="min-h-10 rounded-sm border border-[#d18a8a] bg-white px-3 text-xs font-bold text-danger"
      type="button"
      @click="$emit('retry')"
    >
      Poskusi znova
    </button>
  </div>
</template>
