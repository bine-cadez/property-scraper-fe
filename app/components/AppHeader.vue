<script setup lang="ts">
import { sl } from '~/locales/sl'

defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <header class="app-header">
    <NuxtLink
      class="brand focus-ring"
      to="/"
      aria-label="Prostor na dlani, domov"
    >
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" fill="none">
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
        ><strong>{{ sl.brand }}</strong> {{ sl.brandSuffix }}</span
      >
    </NuxtLink>

    <nav v-if="!compact" aria-label="Glavna navigacija">
      <NuxtLink to="/zemljevid">{{ sl.navigation.map }}</NuxtLink>
      <NuxtLink to="/trg-nepremicnin">{{ sl.navigation.market }}</NuxtLink>
      <NuxtLink to="/metodologija">{{ sl.navigation.methodology }}</NuxtLink>
      <NuxtLink to="/viri-podatkov">{{ sl.navigation.sources }}</NuxtLink>
    </nav>

    <div class="header-actions">
      <span class="demo-label">DEMO</span>
      <NuxtLink class="about-link focus-ring" to="/o-projektu"
        >O projektu</NuxtLink
      >
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 50;
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 22px;
  border-bottom: 1px solid var(--color-line);
  background: rgb(255 255 255 / 96%);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-ink);
  font-size: 15px;
  text-decoration: none;
  white-space: nowrap;
}

.brand strong {
  font-weight: 750;
}

.brand-mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  color: white;
  background: var(--color-accent);
}

.brand-mark svg {
  width: 22px;
}

nav {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-right: auto;
}

nav a,
.about-link {
  color: var(--color-ink-muted);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

nav a:hover,
nav a.router-link-active,
.about-link:hover {
  color: var(--color-accent-strong);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.demo-label {
  padding: 4px 7px;
  border: 1px solid #b9cec8;
  border-radius: 5px;
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

@media (max-width: 760px) {
  .app-header {
    height: 56px;
    padding: 0 14px;
  }

  nav,
  .about-link {
    display: none;
  }

  .brand {
    font-size: 14px;
  }

  .brand-mark {
    width: 32px;
    height: 32px;
  }
}
</style>
