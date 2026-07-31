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
    class="details flex h-full w-[420px] min-w-[380px] flex-col border-l border-line bg-white max-[1100px]:w-[390px] max-[1100px]:min-w-[360px]"
    :class="{ embedded }"
    aria-label="Podrobnosti izbrane nepremičnine"
    @keydown.esc="$emit('close')"
  >
    <div
      class="details-header flex min-h-[52px] items-center justify-between border-b border-line pr-3.5 pl-[18px]"
      :class="{ 'pt-[7px]': embedded }"
    >
      <span
        class="inline-flex items-center gap-[7px] text-[10px] font-[750] text-ink-muted uppercase"
        ><i class="size-[7px] rounded-full bg-warm" aria-hidden="true" />
        Izbrano na zemljevidu</span
      >
      <div class="flex">
        <button
          class="inline-grid size-[42px] place-items-center rounded-sm bg-transparent text-[22px] text-ink-muted transition-[background-color,color,border-color,transform] duration-150 ease-out-expo hover:bg-[#f3f6f5] active:scale-[0.97] motion-reduce:active:scale-100"
          type="button"
          aria-label="Deli povezavo"
          @click="shareCurrentUrl"
        >
          <svg class="w-[18px]" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="5" cy="10" r="2" fill="none" stroke="currentColor" />
            <circle cx="15" cy="5" r="2" fill="none" stroke="currentColor" />
            <circle cx="15" cy="15" r="2" fill="none" stroke="currentColor" />
            <path d="m7 9 6-3M7 11l6 3" stroke="currentColor" />
          </svg>
        </button>
        <button
          class="inline-grid size-[42px] place-items-center rounded-sm bg-transparent text-[22px] text-ink-muted transition-[background-color,color,border-color,transform] duration-150 ease-out-expo hover:bg-[#f3f6f5] active:scale-[0.97] motion-reduce:active:scale-100"
          type="button"
          aria-label="Zapri podrobnosti"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
    </div>

    <div
      class="flex min-h-[46px] overflow-x-auto border-b border-line px-2.5"
      role="tablist"
      aria-label="Podrobnosti"
    >
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
        class="relative min-w-fit flex-1 bg-transparent px-[9px] text-[11px] font-bold whitespace-nowrap text-ink-muted after:absolute after:right-[7px] after:bottom-0 after:left-[7px] after:h-0.5 after:bg-transparent after:content-[''] aria-selected:text-accent-strong aria-selected:after:bg-accent"
        @click="activeTab = tab.id"
        @keydown="onTabKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      class="details-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
      :class="{ 'pb-[env(safe-area-inset-bottom)]': embedded }"
    >
      <div
        v-if="activeTab === 'overview'"
        id="panel-overview"
        role="tabpanel"
        aria-labelledby="tab-overview"
        class="grid gap-[22px] px-[22px] pt-[22px] pb-[26px]"
      >
        <PropertySummary :property="property" />
        <PropertyPreview3D
          v-if="property.building"
          :key="property.id"
          :property="property"
        />
        <div class="mx-[-22px] my-0.5 h-px bg-line" />
        <ValuationSummary :property="property" />
        <NuxtLink
          class="flex min-h-[46px] items-center justify-between rounded-sm border border-accent bg-white px-3.5 text-xs font-[750] text-accent-strong no-underline transition-[background-color,color,border-color,transform] duration-150 ease-out-expo hover:bg-accent-soft active:scale-[0.97] motion-reduce:active:scale-100"
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
        class="grid gap-[22px] px-[22px] pt-[22px] pb-[26px]"
      >
        <ValuationSummary :property="property" />
      </div>

      <div
        v-else-if="activeTab === 'sales'"
        id="panel-sales"
        role="tabpanel"
        aria-labelledby="tab-sales"
        class="grid gap-[22px] px-[22px] pt-[22px] pb-[26px]"
      >
        <ComparableSales :transactions="property.transactions" />
      </div>

      <div
        v-else-if="activeTab === 'facts'"
        id="panel-facts"
        role="tabpanel"
        aria-labelledby="tab-facts"
        class="grid gap-[22px] px-[22px] pt-[22px] pb-[26px]"
      >
        <ParcelFacts :parcel="property.parcel" />
        <div class="mx-[-22px] my-0.5 h-px bg-line" />
        <BuildingFacts :building="property.building" />
      </div>

      <div
        v-else
        id="panel-area"
        role="tabpanel"
        aria-labelledby="tab-area"
        class="grid gap-[22px] px-[22px] pt-[22px] pb-[26px]"
      >
        <section>
          <span class="text-[10px] font-extrabold text-listing uppercase"
            >Okolica in ponudba</span
          >
          <h3 class="mt-1 mb-[7px] text-[17px] font-bold">
            {{ property.settlement }}, {{ property.municipality }}
          </h3>
          <p class="text-xs leading-[1.55] text-ink-muted">
            Prikazani oglasi so ločeni od zaključenih prodaj. Oglaševana cena ne
            pomeni, da je bila nepremičnina po tej ceni prodana.
          </p>
        </section>
        <div v-if="property.listings.length" class="border-t border-line">
          <article
            v-for="listing in property.listings"
            :key="listing.id"
            class="grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-[5px] border-b border-line py-[15px]"
          >
            <span
              class="col-span-full text-[10px] font-extrabold text-listing uppercase"
              >Oglaševana cena</span
            >
            <h4 class="col-span-full text-[13px] font-bold">
              {{ listing.title }}
            </h4>
            <strong class="text-base">{{
              formatEur(listing.askingPrice.amount)
            }}</strong>
            <p class="text-[11px] font-bold text-listing">
              {{ formatArea(listing.areaM2) }} ·
              {{ formatPricePerM2(listing.pricePerM2) }}
            </p>
            <small class="col-span-full text-[10px] text-ink-muted"
              >Objavljeno {{ formatDate(listing.publishedAt) }} ·
              {{ listing.sourceName }}</small
            >
          </article>
        </div>
        <p
          v-else
          class="border border-dashed border-line p-5 text-center text-ink-muted"
        >
          V bližini ni preverjenih aktivnih oglasov.
        </p>
      </div>

      <footer
        class="mt-2.5 border-t border-line bg-[#f8faf9] px-[22px] pt-[18px] pb-7 text-ink-muted"
      >
        <strong class="text-[11px] text-ink">Pomembno o podatkih</strong>
        <p class="mt-[7px] mb-[9px] text-[10px] leading-[1.55]">
          Ocene so informativne in se lahko razlikujejo od dosegljive tržne
          cene. Uradna vrednost, tržna ocena, oglaševana cena in zaključena
          prodajna cena niso enakovredne kategorije. Podatki so lahko zamaknjeni
          ali nepopolni in ne nadomeščajo pravnega, geodetskega, cenilskega ali
          investicijskega svetovanja.
        </p>
        <NuxtLink
          class="text-[10px] font-[750] text-accent-strong"
          to="/viri-podatkov"
          >Viri in omejitve podatkov</NuxtLink
        >
      </footer>
    </div>
  </aside>
</template>

<style scoped>
.details.embedded {
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 0;
  flex: 1;
  border-left: 0;
}
</style>
