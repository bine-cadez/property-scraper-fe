<script setup lang="ts">
import type {
  MapFilters,
  MapLayerId,
  SearchResult,
} from '#shared/types/property'

const props = withDefaults(
  defineProps<{
    filters: MapFilters
    layers: MapLayerId[]
    featureCount: number
    embedded?: boolean
    selected?: boolean
    expanded?: boolean
  }>(),
  {
    embedded: false,
    selected: false,
    expanded: false,
  },
)

const emit = defineEmits<{
  select: [result: SearchResult]
  filtersChange: [filters: MapFilters]
  layersChange: [layers: MapLayerId[]]
}>()

const marketTabs: {
  label: string
  activeLayers: MapLayerId[]
}[] = [
  {
    label: 'Vse',
    activeLayers: ['transactions', 'listings', 'priceM2'],
  },
  { label: 'Prodaje', activeLayers: ['transactions', 'priceM2'] },
  { label: 'Oglasi', activeLayers: ['listings', 'priceM2'] },
]

const quickTypes: {
  label: string
  value: MapFilters['propertyTypes'][number] | 'all'
}[] = [
  { label: 'Vse', value: 'all' },
  { label: 'Stanovanja', value: 'apartment' },
  { label: 'Hiše', value: 'house' },
  { label: 'Poslovno', value: 'office' },
]

function showMarket(activeLayers: MapLayerId[]) {
  const structuralLayers = props.layers.filter((layer) =>
    ['parcels', 'buildings', 'officialValue'].includes(layer),
  )
  emit('layersChange', [...new Set([...structuralLayers, ...activeLayers])])
}

function setPropertyType(
  propertyType: MapFilters['propertyTypes'][number] | 'all',
) {
  emit('filtersChange', {
    ...props.filters,
    propertyTypes: propertyType === 'all' ? [] : [propertyType],
  })
}

function typeIsActive(
  propertyType: MapFilters['propertyTypes'][number] | 'all',
) {
  return propertyType === 'all'
    ? props.filters.propertyTypes.length === 0
    : props.filters.propertyTypes.includes(propertyType)
}

function marketIsActive(activeLayers: MapLayerId[]) {
  const visibleMarketLayers = props.layers.filter((layer) =>
    ['transactions', 'listings', 'priceM2'].includes(layer),
  )
  return (
    visibleMarketLayers.length === activeLayers.length &&
    activeLayers.every((layer) => visibleMarketLayers.includes(layer))
  )
}
</script>

<template>
  <aside
    class="browse-panel"
    :class="{
      embedded,
      'has-selection': selected,
      'is-expanded': expanded,
    }"
    aria-label="Iskanje in pregled nepremičnin"
  >
    <div class="panel-brand">
      <NuxtLink to="/" class="panel-home" aria-label="Prostor na dlani, domov">
        <span class="panel-mark" aria-hidden="true">
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
        <span><strong>Prostor</strong> na dlani</span>
      </NuxtLink>

      <div class="market-tabs" aria-label="Vrsta tržnih podatkov">
        <button
          v-for="tab in marketTabs"
          :key="tab.label"
          type="button"
          :class="{ active: marketIsActive(tab.activeLayers) }"
          @click="showMarket(tab.activeLayers)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="search-region">
      <MapSearch @select="$emit('select', $event)" />
      <p>
        <span class="live-dot" aria-hidden="true" />
        {{ featureCount }} zapisov na prikazanem območju
      </p>
    </div>

    <div class="quick-filter-row" aria-label="Hitri filtri">
      <button
        v-for="type in quickTypes"
        :key="type.value"
        type="button"
        :class="{ active: typeIsActive(type.value) }"
        @click="setPropertyType(type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <div
      class="panel-extras"
      :aria-hidden="expanded"
      :inert="expanded"
    >
      <nav class="panel-nav" aria-label="Raziskovanje podatkov">
        <NuxtLink to="/trg-nepremicnin">
          <span class="nav-icon" aria-hidden="true">↗</span>
          <span><strong>Pregled trga</strong><small>Cene in gibanje</small></span>
        </NuxtLink>
        <NuxtLink to="/metodologija">
          <span class="nav-icon" aria-hidden="true">◎</span>
          <span><strong>Vrednotenje</strong><small>Kako računamo</small></span>
        </NuxtLink>
        <NuxtLink to="/viri-podatkov">
          <span class="nav-icon" aria-hidden="true">▦</span>
          <span><strong>Viri podatkov</strong><small>GURS in ETN</small></span>
        </NuxtLink>
        <NuxtLink to="/o-projektu">
          <span class="nav-icon" aria-hidden="true">⌂</span>
          <span><strong>O projektu</strong><small>Več informacij</small></span>
        </NuxtLink>
      </nav>

      <div class="panel-footer">
        <span>DEMO</span>
        <p>Podatki so informativni in namenjeni raziskovanju.</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.browse-panel {
  --panel-brand: #5b52e8;
  --panel-brand-dark: #4940d1;
  position: absolute;
  z-index: 30;
  top: 14px;
  left: 14px;
  width: 430px;
  overflow: visible;
  border: 1px solid rgb(218 221 237 / 82%);
  border-radius: 18px;
  background: rgb(255 255 255 / 97%);
  box-shadow: 0 18px 52px rgb(38 43 77 / 22%);
}

.browse-panel.embedded {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  border: 1px solid rgb(218 221 237 / 82%);
  border-radius: 18px;
  box-shadow: 0 18px 52px rgb(38 43 77 / 22%);
  transform: translate(14px, 14px);
  transition: transform 300ms var(--ease-sheet);
}

.browse-panel.embedded:not(.is-expanded) {
  border-bottom-color: transparent;
  border-radius: 18px 18px 0 0;
}

.browse-panel.embedded .panel-brand {
  border-radius: 17px 17px 0 0;
}

.browse-panel.embedded.is-expanded {
  border: 0;
  border-bottom: 1px solid #e1e3ed;
  border-radius: 0;
  box-shadow: none;
  transform: translate(0, 0);
  transition:
    transform 340ms cubic-bezier(0.645, 0.045, 0.355, 1);
}

.browse-panel.embedded.is-expanded .panel-brand {
  border-radius: 0;
}

.panel-extras {
  position: absolute;
  top: 100%;
  right: -1px;
  left: -1px;
  overflow: hidden;
  border: 1px solid rgb(218 221 237 / 82%);
  border-top: 0;
  border-radius: 0 0 18px 18px;
  background: rgb(255 255 255 / 97%);
  box-shadow: 0 22px 38px -25px rgb(38 43 77 / 34%);
  clip-path: inset(0 round 0 0 18px 18px);
  opacity: 1;
  transform: translateY(0);
  transition:
    clip-path 320ms cubic-bezier(0.645, 0.045, 0.355, 1),
    opacity 220ms ease 30ms,
    transform 320ms cubic-bezier(0.645, 0.045, 0.355, 1);
}

.browse-panel.is-expanded .panel-extras {
  clip-path: inset(0 0 100% 0 round 0 0 18px 18px);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
  transition:
    clip-path 240ms var(--ease-out-expo),
    opacity 120ms ease,
    transform 240ms var(--ease-out-expo);
}

.panel-brand {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-radius: 17px 17px 0 0;
  color: white;
  background:
    radial-gradient(circle at 88% 0%, rgb(255 255 255 / 14%), transparent 35%),
    linear-gradient(135deg, var(--panel-brand), var(--panel-brand-dark));
}

.panel-home {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: white;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
}

.panel-home strong {
  font-weight: 800;
}

.panel-mark {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 10px;
  background: rgb(255 255 255 / 12%);
}

.panel-mark svg {
  width: 23px;
}

.market-tabs {
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: rgb(255 255 255 / 14%);
}

.market-tabs button {
  min-height: 34px;
  padding: 0 13px;
  border: 0;
  border-radius: 999px;
  color: rgb(255 255 255 / 78%);
  background: transparent;
  font-size: 11px;
  font-weight: 750;
}

.market-tabs button.active {
  color: var(--panel-brand-dark);
  background: white;
  box-shadow: 0 2px 8px rgb(31 28 105 / 18%);
}

.search-region {
  padding: 16px 16px 12px;
}

.search-region :deep(.search-shell) {
  width: 100%;
}

.search-region :deep(.search-box) {
  min-height: 50px;
  border: 0;
  border-radius: 11px;
  background: #f3f4f8;
  box-shadow: none;
  backdrop-filter: none;
}

.search-region :deep(.search-box svg) {
  color: #41475a;
}

.search-region p {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 10px 3px 0;
  color: #73798b;
  font-size: 10px;
  font-weight: 650;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #14a88b;
  box-shadow: 0 0 0 3px rgb(20 168 139 / 13%);
}

.quick-filter-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 15px;
  border-top: 1px solid #e9eaf1;
  border-bottom: 1px solid #e9eaf1;
}

.quick-filter-row > button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #dfe1eb;
  border-radius: 9px;
  color: #4d5363;
  background: white;
  font-size: 10px;
  font-weight: 700;
}

.quick-filter-row > button:hover,
.quick-filter-row > button.active {
  border-color: #aaa6f5;
  color: #4d45d2;
  background: #f0efff;
}

.panel-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 14px 15px;
}

.panel-nav a {
  display: flex;
  min-height: 62px;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  color: #252a38;
  background: #f7f7fb;
  text-decoration: none;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.panel-nav a:hover {
  border-color: #d9d7fb;
  background: #f0efff;
  transform: translateY(-1px);
}

.nav-icon {
  display: grid;
  width: 33px;
  height: 33px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 9px;
  color: #554be0;
  background: white;
  box-shadow: 0 2px 8px rgb(60 55 140 / 8%);
  font-size: 15px;
}

.panel-nav a > span:last-child {
  display: grid;
  gap: 3px;
}

.panel-nav strong {
  font-size: 11px;
}

.panel-nav small {
  color: #7a8090;
  font-size: 9px;
}

.panel-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 16px 14px;
  color: #8a8fa0;
  font-size: 9px;
}

.panel-footer span {
  padding: 3px 6px;
  border: 1px solid #d5d6e1;
  border-radius: 5px;
  color: #5a52d9;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.panel-footer p {
  margin: 0;
}

@media (max-width: 760px) {
  .browse-panel {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    border-radius: 15px;
  }

  .browse-panel.embedded {
    position: static;
    width: 100%;
    border: 1px solid rgb(218 221 237 / 82%);
    border-radius: 15px;
    box-shadow: 0 18px 52px rgb(38 43 77 / 22%);
    transform: none;
  }

  .panel-extras {
    display: none;
  }

  .browse-panel.embedded .panel-brand {
    border-radius: 14px 14px 0 0;
  }

  .browse-panel.embedded.is-expanded {
    border: 1px solid rgb(218 221 237 / 82%);
    border-radius: 15px;
    box-shadow: 0 12px 36px rgb(38 43 77 / 18%);
  }

  .browse-panel.embedded.is-expanded .panel-brand {
    border-radius: 14px;
  }

  .browse-panel.is-expanded .search-region,
  .browse-panel.is-expanded .quick-filter-row {
    display: none;
  }

  .panel-brand {
    min-height: 58px;
    padding: 0 12px;
    border-radius: 14px 14px 0 0;
  }

  .panel-home {
    font-size: 13px;
  }

  .panel-mark {
    width: 31px;
    height: 31px;
  }

  .market-tabs button {
    min-height: 30px;
    padding: 0 10px;
  }

  .search-region {
    padding: 11px 11px 9px;
  }

  .search-region p,
  .panel-nav,
  .panel-footer {
    display: none;
  }

  .quick-filter-row {
    gap: 6px;
    overflow-x: auto;
    padding: 9px 10px 10px;
  }

  .quick-filter-row > button {
    flex: 0 0 auto;
  }

}

@media (max-width: 420px) {
  .panel-home > span:last-child {
    display: none;
  }
}

@media (max-height: 560px) and (max-width: 1024px) {
  .browse-panel,
  .browse-panel.embedded {
    position: static;
    width: 100%;
    border: 1px solid rgb(218 221 237 / 82%);
    border-radius: 15px;
    box-shadow: 0 14px 40px rgb(38 43 77 / 20%);
    transform: none;
  }

  .panel-brand,
  .panel-extras,
  .search-region p,
  .panel-nav,
  .panel-footer {
    display: none;
  }

  .search-region {
    padding: 10px 10px 8px;
  }

  .quick-filter-row {
    gap: 6px;
    overflow-x: auto;
    padding: 8px 9px 9px;
    border-radius: 0 0 14px 14px;
  }

  .quick-filter-row > button {
    min-height: 32px;
    flex: 0 0 auto;
  }

  .browse-panel.is-expanded {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .browse-panel.embedded {
    transition: opacity 160ms ease;
  }

  .panel-extras,
  .browse-panel.is-expanded .panel-extras {
    clip-path: inset(0);
    transform: none;
    transition: opacity 160ms ease;
  }

  .panel-nav a {
    transition:
      border-color 150ms ease,
      background-color 150ms ease;
  }

  .panel-nav a:hover {
    transform: none;
  }
}
</style>
