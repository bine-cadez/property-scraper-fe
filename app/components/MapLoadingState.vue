<template>
  <div class="map-state" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true" />
    <div>
      <strong>Nalagamo prostorske podatke</strong>
      <p>Pripravljamo parcele, stavbe in primerljive prodaje …</p>
    </div>
  </div>
</template>

<style scoped>
.map-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--elevation-overlay);
}

.spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-accent-soft);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

strong {
  font-size: 13px;
}

p {
  margin: 2px 0 0;
  color: var(--color-ink-muted);
  font-size: 11px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-color: var(--color-accent);
    opacity: 0.75;
  }
}
</style>
