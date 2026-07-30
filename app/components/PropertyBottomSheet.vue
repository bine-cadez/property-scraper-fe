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
    class="bottom-sheet"
    role="dialog"
    aria-label="Podrobnosti izbrane nepremičnine"
    aria-modal="false"
  >
    <div class="sheet-handle" aria-hidden="true" />
    <PropertyDetailsDrawer
      :property="property"
      embedded
      @close="$emit('close')"
    />
  </section>
</template>

<style scoped>
.bottom-sheet {
  position: absolute;
  z-index: 32;
  right: 0;
  bottom: 0;
  left: 0;
  height: min(68dvh, 620px);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
  background: white;
  box-shadow: 0 -10px 34px rgb(23 33 31 / 16%);
  animation: sheet-in 420ms var(--ease-sheet) both;
}

.sheet-handle {
  position: absolute;
  z-index: 2;
  top: 7px;
  left: 50%;
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #c5cfcb;
  transform: translateX(-50%);
}

.bottom-sheet :deep(.details) {
  width: 100%;
  min-width: 0;
  border-left: 0;
}

.bottom-sheet :deep(.details-header) {
  padding-top: 7px;
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
