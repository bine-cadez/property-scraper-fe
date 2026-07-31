<script setup lang="ts">
import type { PropertyRecord } from '#shared/types/property'

defineProps<{
  property: PropertyRecord
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <section
    class="bottom-sheet absolute right-0 bottom-0 left-0 z-32 h-[min(68dvh,620px)] overflow-hidden rounded-t-[18px] border border-b-0 border-line bg-white shadow-[0_-10px_34px_rgb(23_33_31_/_16%)]"
    role="dialog"
    aria-label="Podrobnosti izbrane nepremičnine"
    aria-modal="false"
  >
    <div
      class="absolute top-[7px] left-1/2 z-2 h-1 w-9 -translate-x-1/2 rounded-full bg-[#c5cfcb]"
      aria-hidden="true"
    />
    <PropertyDetailsDrawer
      :property="property"
      embedded
      @close="$emit('close')"
    />
  </section>
</template>

<style scoped>
.bottom-sheet {
  animation: sheet-in 420ms var(--ease-sheet) both;
}

.bottom-sheet :deep(.details) {
  width: 100%;
  min-width: 0;
  height: 100%;
  border-left: 0;
}

.bottom-sheet :deep(.details-header) {
  padding-top: 7px;
}

.bottom-sheet :deep(.details-scroll) {
  padding-bottom: env(safe-area-inset-bottom);
}

@keyframes sheet-in {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-sheet {
    animation: sheet-fade 160ms ease both;
  }

  @keyframes sheet-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
