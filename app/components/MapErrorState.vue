<script setup lang="ts">
defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="error-state" role="alert">
    <span aria-hidden="true">!</span>
    <div>
      <strong>Zemljevida ni bilo mogoče naložiti</strong>
      <p>Preverite povezavo ali poskusite znova.</p>
    </div>
    <button type="button" @click="$emit('retry')">Poskusi znova</button>
  </div>
</template>

<style scoped>
.error-state {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 14px;
  border: 1px solid #e6b5b5;
  border-radius: var(--radius-md);
  background: #fffafa;
  box-shadow: var(--elevation-overlay);
}

.error-state > span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: var(--color-danger);
  font-weight: 800;
}

strong {
  font-size: 13px;
}

p {
  margin: 2px 0 0;
  color: var(--color-ink-muted);
  font-size: 11px;
}

button {
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #d18a8a;
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  background: white;
  font-size: 12px;
  font-weight: 700;
}
</style>
