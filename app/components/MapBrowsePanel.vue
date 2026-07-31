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
    class="browse-panel overflow-visible border border-[rgb(218_221_237_/_82%)] bg-white/97 shadow-[0_18px_52px_rgb(38_43_77_/_22%)]"
    :class="{
      embedded,
      'is-expanded': expanded,
    }"
    aria-label="Iskanje in pregled nepremičnin"
  >
    <div
      class="panel-brand flex min-h-[72px] items-center justify-between gap-4 rounded-t-[17px] bg-[radial-gradient(circle_at_88%_0%,rgb(255_255_255_/_14%),transparent_35%),linear-gradient(135deg,#5b52e8,#4940d1)] px-[18px] text-white max-[760px]:min-h-[58px] max-[760px]:rounded-t-[14px] max-[760px]:px-3 [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
    >
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-[9px] text-sm whitespace-nowrap text-white no-underline max-[760px]:text-[13px]"
        aria-label="Prostor na dlani, domov"
      >
        <span
          class="grid size-[35px] place-items-center rounded-[10px] border border-white/42 bg-white/12 max-[760px]:size-[31px]"
          aria-hidden="true"
        >
          <svg class="w-[23px]" viewBox="0 0 28 28" fill="none">
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
        <span class="max-[420px]:hidden"
          ><strong class="font-extrabold">Prostor</strong> na dlani</span
        >
      </NuxtLink>

      <div
        class="market-tabs flex rounded-full bg-white/14 p-[3px]"
        aria-label="Vrsta tržnih podatkov"
      >
        <button
          v-for="tab in marketTabs"
          :key="tab.label"
          type="button"
          class="min-h-[34px] rounded-full bg-transparent px-[13px] text-[11px] font-[750] text-white/78 max-[760px]:min-h-[30px] max-[760px]:px-2.5"
          :class="{ active: marketIsActive(tab.activeLayers) }"
          @click="showMarket(tab.activeLayers)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div
      class="search-region px-4 pt-4 pb-3 max-[760px]:px-[11px] max-[760px]:pt-[11px] max-[760px]:pb-[9px] [@media_(max-height:560px)_and_(max-width:1024px)]:px-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:pt-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:pb-2"
    >
      <MapSearch
        class="w-full [&_.search-box]:min-h-[50px] [&_.search-box]:rounded-[11px] [&_.search-box]:border-0 [&_.search-box]:bg-[#f3f4f8] [&_.search-box]:shadow-none [&_.search-box]:backdrop-blur-none [&_.search-box_svg]:text-[#41475a]"
        @select="$emit('select', $event)"
      />
      <p
        class="mx-[3px] mt-2.5 flex items-center gap-[7px] text-[10px] font-[650] text-[#73798b] max-[760px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
      >
        <span
          class="size-[7px] rounded-full bg-[#14a88b] shadow-[0_0_0_3px_rgb(20_168_139_/_13%)]"
          aria-hidden="true"
        />
        {{ featureCount }} zapisov na prikazanem območju
      </p>
    </div>

    <div
      class="quick-filter-row flex items-center gap-[7px] border-y border-[#e9eaf1] px-[15px] py-[11px] max-[760px]:gap-1.5 max-[760px]:overflow-x-auto max-[760px]:px-2.5 max-[760px]:pt-[9px] max-[760px]:pb-2.5 [@media_(max-height:560px)_and_(max-width:1024px)]:gap-1.5 [@media_(max-height:560px)_and_(max-width:1024px)]:overflow-x-auto [@media_(max-height:560px)_and_(max-width:1024px)]:rounded-b-[14px] [@media_(max-height:560px)_and_(max-width:1024px)]:px-[9px] [@media_(max-height:560px)_and_(max-width:1024px)]:pt-2 [@media_(max-height:560px)_and_(max-width:1024px)]:pb-[9px]"
      aria-label="Hitri filtri"
    >
      <button
        v-for="type in quickTypes"
        :key="type.value"
        type="button"
        class="min-h-[34px] rounded-[9px] border border-[#dfe1eb] bg-white px-2.5 text-[10px] font-bold text-[#4d5363] hover:border-[#aaa6f5] hover:bg-[#f0efff] hover:text-[#4d45d2] max-[760px]:shrink-0 [@media_(max-height:560px)_and_(max-width:1024px)]:min-h-8 [@media_(max-height:560px)_and_(max-width:1024px)]:shrink-0"
        :class="{ active: typeIsActive(type.value) }"
        @click="setPropertyType(type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <div
      class="panel-extras max-[760px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
      :aria-hidden="expanded"
      :inert="expanded"
    >
      <nav
        class="grid grid-cols-2 gap-2 px-[15px] py-3.5 max-[760px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden [&_a:hover]:-translate-y-px [&_a:hover]:border-[#d9d7fb] [&_a:hover]:bg-[#f0efff] [&_a]:flex [&_a]:min-h-[62px] [&_a]:items-center [&_a]:gap-2.5 [&_a]:rounded-[11px] [&_a]:border [&_a]:border-transparent [&_a]:bg-[#f7f7fb] [&_a]:px-2.5 [&_a]:py-[9px] [&_a]:text-[#252a38] [&_a]:no-underline [&_a]:transition-[border-color,background-color,transform] [&_a]:duration-150 motion-reduce:[&_a:hover]:translate-y-0 motion-reduce:[&_a]:transition-colors"
        aria-label="Raziskovanje podatkov"
      >
        <NuxtLink to="/trg-nepremicnin">
          <span
            class="grid size-[33px] shrink-0 place-items-center rounded-[9px] bg-white text-[15px] text-[#554be0] shadow-[0_2px_8px_rgb(60_55_140_/_8%)]"
            aria-hidden="true"
            >↗</span
          >
          <span class="grid gap-[3px]"
            ><strong class="text-[11px]">Pregled trga</strong
            ><small class="text-[9px] text-[#7a8090]"
              >Cene in gibanje</small
            ></span
          >
        </NuxtLink>
        <NuxtLink to="/metodologija">
          <span
            class="grid size-[33px] shrink-0 place-items-center rounded-[9px] bg-white text-[15px] text-[#554be0] shadow-[0_2px_8px_rgb(60_55_140_/_8%)]"
            aria-hidden="true"
            >◎</span
          >
          <span class="grid gap-[3px]"
            ><strong class="text-[11px]">Vrednotenje</strong
            ><small class="text-[9px] text-[#7a8090]"
              >Kako računamo</small
            ></span
          >
        </NuxtLink>
        <NuxtLink to="/viri-podatkov">
          <span
            class="grid size-[33px] shrink-0 place-items-center rounded-[9px] bg-white text-[15px] text-[#554be0] shadow-[0_2px_8px_rgb(60_55_140_/_8%)]"
            aria-hidden="true"
            >▦</span
          >
          <span class="grid gap-[3px]"
            ><strong class="text-[11px]">Viri podatkov</strong
            ><small class="text-[9px] text-[#7a8090]">GURS in ETN</small></span
          >
        </NuxtLink>
        <NuxtLink to="/o-projektu">
          <span
            class="grid size-[33px] shrink-0 place-items-center rounded-[9px] bg-white text-[15px] text-[#554be0] shadow-[0_2px_8px_rgb(60_55_140_/_8%)]"
            aria-hidden="true"
            >⌂</span
          >
          <span class="grid gap-[3px]"
            ><strong class="text-[11px]">O projektu</strong
            ><small class="text-[9px] text-[#7a8090]"
              >Več informacij</small
            ></span
          >
        </NuxtLink>
      </nav>

      <div
        class="flex items-center gap-[9px] px-4 pb-3.5 text-[9px] text-[#8a8fa0] max-[760px]:hidden [@media_(max-height:560px)_and_(max-width:1024px)]:hidden"
      >
        <span
          class="rounded-[5px] border border-[#d5d6e1] px-1.5 py-[3px] text-[8px] font-extrabold tracking-[0.08em] text-[#5a52d9]"
          >DEMO</span
        >
        <p>Podatki so informativni in namenjeni raziskovanju.</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.browse-panel {
  position: absolute;
  z-index: 30;
  top: 14px;
  left: 14px;
  width: 430px;
  border-radius: 18px;
}

.browse-panel.embedded {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  border-radius: 18px;
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

.market-tabs button.active {
  color: #4940d1;
  background: white;
  box-shadow: 0 2px 8px rgb(31 28 105 / 18%);
}

.quick-filter-row > button.active {
  border-color: #aaa6f5;
  color: #4d45d2;
  background: #f0efff;
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
    transition: opacity 160ms ease;
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
}
</style>
