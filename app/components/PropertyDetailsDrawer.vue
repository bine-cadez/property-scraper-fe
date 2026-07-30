<script setup lang="ts">
import type { PropertyRecord } from '#shared/types/property'
import {
  formatArea,
  formatDate,
  formatEur,
  formatPricePerM2,
} from '#shared/utils/format'

const props = withDefaults(
  defineProps<{
    property: PropertyRecord
    embedded?: boolean
  }>(),
  { embedded: false },
)

const emit = defineEmits<{
  close: []
}>()

type TabId = 'overview' | 'value' | 'sales' | 'facts' | 'area'

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Pregled' },
  { id: 'value', label: 'Vrednost' },
  { id: 'sales', label: 'Prodaje' },
  { id: 'facts', label: 'Podatki' },
  { id: 'area', label: 'Okolica' },
]

const activeTab = ref<TabId>('overview')

async function shareCurrentUrl() {
  if (!import.meta.client) return
  if (navigator.share) {
    await navigator.share({
      title: props.property.address,
      url: window.location.href,
    })
    return
  }
  await navigator.clipboard?.writeText(window.location.href)
}

watch(
  () => props.property.id,
  () => {
    activeTab.value = 'overview'
  },
)

function onTabKeydown(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
  if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = tabs.length - 1
  const tab = tabs[next]
  if (tab) activeTab.value = tab.id
}
</script>

<template>
  <aside
    class="details"
    :class="{ embedded }"
    aria-label="Podrobnosti izbrane nepremičnine"
    @keydown.esc="$emit('close')"
  >
    <div class="details-header">
      <span class="selection-status"
        ><i aria-hidden="true" /> Izbrano na zemljevidu</span
      >
      <div>
        <button
          class="icon-button focus-ring"
          type="button"
          aria-label="Deli povezavo"
          @click="shareCurrentUrl"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="5" cy="10" r="2" fill="none" stroke="currentColor" />
            <circle cx="15" cy="5" r="2" fill="none" stroke="currentColor" />
            <circle cx="15" cy="15" r="2" fill="none" stroke="currentColor" />
            <path d="m7 9 6-3M7 11l6 3" stroke="currentColor" />
          </svg>
        </button>
        <button
          class="icon-button focus-ring"
          type="button"
          aria-label="Zapri podrobnosti"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Podrobnosti">
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="activeTab = tab.id"
        @keydown="onTabKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="details-scroll">
      <div
        v-if="activeTab === 'overview'"
        id="panel-overview"
        role="tabpanel"
        aria-labelledby="tab-overview"
        class="panel-content"
      >
        <PropertySummary :property="property" />
        <div class="overview-divider" />
        <ValuationSummary :property="property" />
        <NuxtLink
          class="detail-link focus-ring"
          :to="`/nepremicnina/${property.id}`"
        >
          Odpri celoten pregled nepremičnine
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>

      <div
        v-else-if="activeTab === 'value'"
        id="panel-value"
        role="tabpanel"
        aria-labelledby="tab-value"
        class="panel-content"
      >
        <ValuationSummary :property="property" />
      </div>

      <div
        v-else-if="activeTab === 'sales'"
        id="panel-sales"
        role="tabpanel"
        aria-labelledby="tab-sales"
        class="panel-content"
      >
        <ComparableSales :transactions="property.transactions" />
      </div>

      <div
        v-else-if="activeTab === 'facts'"
        id="panel-facts"
        role="tabpanel"
        aria-labelledby="tab-facts"
        class="panel-content"
      >
        <ParcelFacts :parcel="property.parcel" />
        <div class="overview-divider" />
        <BuildingFacts :building="property.building" />
      </div>

      <div
        v-else
        id="panel-area"
        role="tabpanel"
        aria-labelledby="tab-area"
        class="panel-content"
      >
        <section class="area-intro">
          <span>Okolica in ponudba</span>
          <h3>{{ property.settlement }}, {{ property.municipality }}</h3>
          <p>
            Prikazani oglasi so ločeni od zaključenih prodaj. Oglaševana cena ne
            pomeni, da je bila nepremičnina po tej ceni prodana.
          </p>
        </section>
        <div v-if="property.listings.length" class="listing-list">
          <article v-for="listing in property.listings" :key="listing.id">
            <span class="asking-label">Oglaševana cena</span>
            <h4>{{ listing.title }}</h4>
            <strong>{{ formatEur(listing.askingPrice.amount) }}</strong>
            <p>
              {{ formatArea(listing.areaM2) }} ·
              {{ formatPricePerM2(listing.pricePerM2) }}
            </p>
            <small
              >Objavljeno {{ formatDate(listing.publishedAt) }} ·
              {{ listing.sourceName }}</small
            >
          </article>
        </div>
        <p v-else class="empty-list">
          V bližini ni preverjenih aktivnih oglasov.
        </p>
      </div>

      <footer class="disclaimer">
        <strong>Pomembno o podatkih</strong>
        <p>
          Ocene so informativne in se lahko razlikujejo od dosegljive tržne
          cene. Uradna vrednost, tržna ocena, oglaševana cena in zaključena
          prodajna cena niso enakovredne kategorije. Podatki so lahko zamaknjeni
          ali nepopolni in ne nadomeščajo pravnega, geodetskega, cenilskega ali
          investicijskega svetovanja.
        </p>
        <NuxtLink to="/viri-podatkov">Viri in omejitve podatkov</NuxtLink>
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.details {
  display: flex;
  width: 420px;
  min-width: 380px;
  height: 100%;
  flex-direction: column;
  border-left: 1px solid var(--color-line);
  background: white;
}

.details.embedded {
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 0;
  flex: 1;
  border-left: 0;
}

.details-header {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid var(--color-line);
}

.selection-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ink-muted);
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
}

.selection-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warm);
}

.details-header > div {
  display: flex;
}

.icon-button {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: var(--color-ink-muted);
  background: transparent;
  font-size: 22px;
}

.icon-button:hover {
  background: #f3f6f5;
}

.icon-button svg {
  width: 18px;
}

.tabs {
  display: flex;
  min-height: 46px;
  padding: 0 10px;
  border-bottom: 1px solid var(--color-line);
  overflow-x: auto;
}

.tabs button {
  position: relative;
  flex: 1;
  min-width: fit-content;
  padding: 0 9px;
  border: 0;
  color: var(--color-ink-muted);
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.tabs button[aria-selected='true'] {
  color: var(--color-accent-strong);
}

.tabs button[aria-selected='true']::after {
  position: absolute;
  right: 7px;
  bottom: 0;
  left: 7px;
  height: 2px;
  background: var(--color-accent);
  content: '';
}

.details-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.panel-content {
  display: grid;
  gap: 22px;
  padding: 22px 22px 26px;
}

.overview-divider {
  height: 1px;
  margin: 2px -22px;
  background: var(--color-line);
}

.detail-link {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: var(--color-accent-strong);
  background: white;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
}

.detail-link:hover {
  background: var(--color-accent-soft);
}

.area-intro > span,
.asking-label {
  color: var(--color-listing);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.area-intro h3 {
  margin: 4px 0 7px;
  font-size: 17px;
}

.area-intro p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 1.55;
}

.listing-list {
  border-top: 1px solid var(--color-line);
}

.listing-list article {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px 10px;
  padding: 15px 0;
  border-bottom: 1px solid var(--color-line);
}

.listing-list h4 {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 13px;
}

.listing-list article > strong {
  font-size: 16px;
}

.listing-list p {
  margin: 0;
  color: var(--color-listing);
  font-size: 11px;
  font-weight: 700;
}

.listing-list small {
  grid-column: 1 / -1;
  color: var(--color-ink-muted);
  font-size: 10px;
}

.empty-list {
  padding: 20px;
  border: 1px dashed var(--color-line);
  color: var(--color-ink-muted);
  text-align: center;
}

.disclaimer {
  margin-top: 10px;
  padding: 18px 22px 28px;
  border-top: 1px solid var(--color-line);
  color: var(--color-ink-muted);
  background: #f8faf9;
}

.disclaimer strong {
  color: var(--color-ink);
  font-size: 11px;
}

.disclaimer p {
  margin: 7px 0 9px;
  font-size: 10px;
  line-height: 1.55;
}

.disclaimer a {
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 750;
}

@media (max-width: 1100px) {
  .details:not(.embedded) {
    width: 390px;
    min-width: 360px;
  }
}
</style>
