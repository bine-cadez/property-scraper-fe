<script setup lang="ts">
import {
  BadgeEuro,
  CalendarDays,
  ChevronRight,
  Info,
  KeyRound,
  ListFilter,
  MapPin,
} from '@lucide/vue'
import type { MapResultItem } from '#shared/types/property'
import { formatListingPrice } from '#shared/utils/listings'

defineProps<{
  results: MapResultItem[]
  featureCount: number
  loading: boolean
  selectedId: string | undefined
}>()

defineEmits<{ select: [item: MapResultItem] }>()

function pricePeriodLabel(item: MapResultItem) {
  if (item.transactionType === 'sale' && item.priceUnit === 'day') {
    return 'Preveri obdobje'
  }
  return (
    {
      total: 'Skupna cena',
      month: 'Na mesec',
      week: 'Na teden',
      day: 'Na dan',
      m2: 'Na m²',
      unknown: 'Obdobje ni znano',
    }[item.priceUnit ?? 'unknown'] ?? 'Obdobje ni znano'
  )
}
</script>

<template>
  <section
    class="relative flex h-full min-h-0 flex-col bg-[#f7f8f5] max-[720px]:min-h-full"
    aria-label="Oglasi na prikazanem območju"
    :aria-busy="loading"
  >
    <header
      class="relative shrink-0 overflow-hidden border-b border-[#e3e8e4] bg-white px-5 pt-5 pb-4 max-[720px]:px-4 max-[720px]:pt-[19px]"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p
            class="m-0 mb-1 text-[9px] font-[750] tracking-[0.12em] text-[#71807b] uppercase"
          >
            Prikazano območje
          </p>
          <h1
            class="m-0 truncate text-[19px] font-[750] tracking-[-0.035em] text-ink"
          >
            Oglasi na zemljevidu
          </h1>
          <p class="mt-1.5 mb-0 text-[11px] leading-[1.4] text-[#74817d]">
            <template v-if="loading">
              Posodabljamo oglase na prikazanem območju …
            </template>
            <template v-else-if="results.length">
              {{ results.length }}
              {{ results.length === 1 ? 'viden oglas' : 'vidnih oglasov' }}
            </template>
            <template v-else-if="featureCount">
              {{ featureCount }} oglasov v skupinah
            </template>
            <template v-else>Ni vidnih oglasov</template>
          </p>
        </div>
        <span
          class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#f1eaf7] text-[#7b55a3]"
          aria-hidden="true"
        >
          <span
            v-if="loading"
            class="size-5 animate-spin rounded-full border-2 border-[#dfd0ea] border-t-[#7b55a3] motion-reduce:animate-none motion-reduce:border-[#7b55a3] motion-reduce:opacity-70"
          />
          <MapPin v-else class="size-5" :stroke-width="1.7" />
        </span>
      </div>
      <div
        v-if="loading"
        class="absolute right-0 bottom-0 left-0 h-0.5 overflow-hidden bg-[#eee7f3] motion-reduce:bg-[#bda7ce]"
        aria-hidden="true"
      >
        <span
          class="sidebar-loading-bar block h-full w-[38%] bg-[#7b55a3] motion-reduce:hidden"
        />
      </div>
    </header>

    <div
      v-if="results.length"
      class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 transition-opacity duration-150 ease-out [overscroll-behavior:contain] max-[720px]:overflow-visible max-[720px]:px-2.5 max-[720px]:py-3 motion-reduce:transition-none"
      :class="loading ? 'pointer-events-none opacity-50' : 'opacity-100'"
    >
      <article
        v-for="item in results"
        :key="item.id"
        class="group mb-2.5 overflow-hidden rounded-[12px] border bg-white transition-[border-color,box-shadow,transform] duration-150 motion-reduce:transition-none"
        :class="
          selectedId === item.selectionId
            ? item.transactionType === 'rent'
              ? 'border-[#7187c2] shadow-[0_6px_20px_rgb(62_82_141_/_12%)]'
              : 'border-[#9b7ab8] shadow-[0_6px_20px_rgb(93_61_124_/_12%)]'
            : 'border-[#e0e6e2] hover:-translate-y-px hover:border-[#ad9abb] hover:shadow-[0_6px_20px_rgb(61_36_88_/_9%)] motion-reduce:hover:translate-y-0'
        "
      >
        <button
          type="button"
          class="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-3 border-0 bg-transparent px-3.5 pt-3.5 pb-3 text-left text-ink"
          :aria-label="`Odpri oglas ${item.address}`"
          @click="$emit('select', item)"
        >
          <span
            class="row-span-2 grid size-10 place-items-center rounded-[10px] transition-colors"
            :class="
              item.transactionType === 'rent'
                ? 'bg-[#e8edf8] text-[#526bb0] group-hover:bg-[#dce4f5]'
                : 'bg-[#f1eaf7] text-[#7b55a3] group-hover:bg-[#e9dcf2]'
            "
            aria-hidden="true"
          >
            <KeyRound
              v-if="item.transactionType === 'rent'"
              class="size-[19px]"
              :stroke-width="1.65"
            />
            <BadgeEuro v-else class="size-[19px]" :stroke-width="1.65" />
          </span>
          <span class="min-w-0">
            <strong
              class="block truncate text-[13px] font-[740] tracking-[-0.01em]"
            >
              {{ item.address }}
            </strong>
            <span class="mt-0.5 block truncate text-[10px] text-[#78847f]">
              {{ item.transactionType === 'sale' ? 'Prodaja' : 'Oddaja' }}
              <template v-if="item.sourceLabel">
                · {{ item.sourceLabel }}</template
              >
            </span>
          </span>
          <ChevronRight
            class="mt-1 size-4 text-[#91809d] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            :stroke-width="1.8"
            aria-hidden="true"
          />

          <span
            class="col-start-2 col-end-4 mt-3 flex items-baseline justify-between gap-3"
          >
            <span
              class="text-[9px] font-[650] tracking-[0.04em] text-[#7b8782] uppercase"
            >
              Zahtevana cena
            </span>
            <strong
              class="text-right text-[17px] font-[760] tracking-[-0.035em]"
              :class="
                item.transactionType === 'rent'
                  ? 'text-[#3e528d]'
                  : 'text-[#654184]'
              "
            >
              {{
                formatListingPrice(
                  item.totalPrice ?? null,
                  item.priceUnit ?? 'unknown',
                  item.transactionType,
                )
              }}
            </strong>
          </span>
        </button>

        <div
          class="grid grid-cols-2 border-y border-[#edf0ed] bg-[#fafbf9] text-[#66736e]"
        >
          <span
            class="flex min-w-0 items-center gap-1.5 border-r border-[#edf0ed] px-3 py-2.5 text-[10px]"
          >
            <CalendarDays
              class="size-3.5 shrink-0 text-[#81918b]"
              :stroke-width="1.7"
              aria-hidden="true"
            />
            <span class="truncate">{{ pricePeriodLabel(item) }}</span>
          </span>
          <span
            class="flex min-w-0 items-center gap-1.5 px-3 py-2.5 text-[10px]"
          >
            <MapPin
              class="size-3.5 shrink-0 text-[#81918b]"
              :stroke-width="1.7"
              aria-hidden="true"
            />
            <span class="truncate">Lokacija na zemljevidu</span>
          </span>
        </div>
      </article>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 place-items-center px-8 py-10 text-[#6e7a76] transition-opacity duration-150 ease-out motion-reduce:transition-none"
      :class="loading ? 'opacity-50' : 'opacity-100'"
    >
      <div class="grid place-items-center text-center">
        <span
          class="mb-3 grid size-12 place-items-center rounded-full bg-[#f1ecf4]"
        >
          <ListFilter
            class="size-5 text-[#927da1]"
            :stroke-width="1.65"
            aria-hidden="true"
          />
        </span>
        <strong class="text-[13px] text-[#4a3658]">
          Na tej povečavi ni posameznih oglasov.
        </strong>
        <p class="mt-1.5 mb-0 max-w-[280px] text-[11px] leading-[1.55]">
          Približajte zemljevid, da se skupine razprejo.
        </p>
      </div>
    </div>

    <footer
      class="shrink-0 border-t border-[#e5e9e5] bg-white px-[18px] py-3 text-[9px] leading-[1.5] text-[#7b8682] max-[720px]:px-3.5"
    >
      <span class="block">
        <Info class="mr-1 inline size-3" aria-hidden="true" />
        Samo oglasi z lokacijo ·
        <NuxtLink to="/oglasi" class="font-bold text-[#654184]"
          >vsi oglasi</NuxtLink
        >
      </span>
    </footer>
  </section>
</template>

<style scoped>
@keyframes sidebar-loading {
  from {
    transform: translateX(-110%);
  }
  to {
    transform: translateX(365%);
  }
}

.sidebar-loading-bar {
  animation: sidebar-loading 900ms linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-loading-bar {
    animation: none;
  }
}
</style>
