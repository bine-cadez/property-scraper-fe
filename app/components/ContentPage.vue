<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="content-page">
    <AppHeader />
    <main>
      <header class="page-heading">
        <span>{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>
      <div class="page-grid">
        <article class="page-content">
          <slot />
        </article>
        <aside>
          <strong>Hiter dostop</strong>
          <NuxtLink to="/zemljevid">Odpri zemljevid</NuxtLink>
          <NuxtLink to="/metodologija">Metodologija</NuxtLink>
          <NuxtLink to="/viri-podatkov">Viri podatkov</NuxtLink>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content-page {
  min-height: 100dvh;
  background: #f7f9f8;
}

main {
  width: min(1040px, calc(100% - 32px));
  margin: 0 auto;
  padding: 64px 0 90px;
}

.page-heading {
  max-width: 760px;
  padding-bottom: 36px;
}

.page-heading span {
  color: var(--color-accent-strong);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 14px;
  font-size: clamp(34px, 6vw, 58px);
  line-height: 1.03;
  letter-spacing: -0.045em;
}

.page-heading p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 17px;
  line-height: 1.65;
}

.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  gap: 54px;
  align-items: start;
  padding-top: 34px;
  border-top: 1px solid var(--color-line);
}

.page-content {
  color: #35413e;
  font-size: 15px;
  line-height: 1.7;
}

.page-content :deep(h2) {
  margin: 36px 0 10px;
  color: var(--color-ink);
  font-size: 24px;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.page-content :deep(h2:first-child) {
  margin-top: 0;
}

.page-content :deep(h3) {
  margin: 24px 0 8px;
  color: var(--color-ink);
  font-size: 17px;
}

.page-content :deep(p) {
  margin: 0 0 16px;
}

.page-content :deep(li) {
  margin: 6px 0;
}

aside {
  display: grid;
  gap: 2px;
  padding: 14px 0;
  border-top: 2px solid var(--color-accent);
}

aside strong {
  margin-bottom: 8px;
  font-size: 11px;
  text-transform: uppercase;
}

aside a {
  padding: 9px 4px;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-ink-muted);
  font-size: 12px;
  font-weight: 650;
  text-decoration: none;
}

aside a:hover {
  color: var(--color-accent-strong);
}

@media (max-width: 700px) {
  main {
    padding-top: 42px;
  }

  .page-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  aside {
    order: -1;
  }
}
</style>
