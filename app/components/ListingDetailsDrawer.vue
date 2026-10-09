<script setup lang="ts">
import { ArrowLeft, ExternalLink, Info, MapPin, Ruler } from "@lucide/vue";
import type { Listing } from "#shared/types/property";
import { formatArea, formatDate, formatPricePerM2 } from "#shared/utils/format";
import {
  formatListingPrice,
  isListingStale,
  listingPricePerM2,
} from "#shared/utils/listings";

const props = defineProps<{ listing: Listing }>();
defineEmits<{ close: [] }>();

const pricePerM2 = computed(() => listingPricePerM2(props.listing));
const stale = computed(() => isListingStale(props.listing.lastSeenAt));

function hideBrokenImage(event: Event) {
  (event.currentTarget as HTMLImageElement).hidden = true;
}
</script>

<template>
  <aside
    class="flex h-full min-h-0 w-full flex-col bg-surface text-ink max-[720px]:min-h-dvh"
    aria-label="Podrobnosti izbranega oglasa"
    @keydown.esc="$emit('close')"
  >
    <header
      class="flex min-h-[58px] items-center border-b border-[#edf0ed] bg-white px-4"
    >
      <button
        type="button"
        class="inline-flex min-h-9 items-center gap-2 border-0 bg-transparent text-[11px] font-[650] text-[#294d43]"
        aria-label="Nazaj na rezultate"
        @click="$emit('close')"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        Nazaj na rezultate
      </button>
      <span
        class="ml-auto rounded-full bg-[#f1eaf7] px-2.5 py-1 text-[9px] font-bold text-[#654184]"
      >
        {{ listing.transactionType === "sale" ? "Prodaja" : "Oddaja" }}
      </span>
    </header>

    <div
      class="min-h-0 flex-1 overflow-y-auto p-4 [overscroll-behavior:contain] max-[720px]:overflow-visible"
    >
      <img
        v-if="listing.images[0]"
        :src="listing.images[0]"
        :alt="listing.title"
        class="mb-4 aspect-[16/10] w-full rounded-[10px] object-cover"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="hideBrokenImage"
      />
      <p
        class="m-0 text-[9px] font-bold tracking-[0.08em] text-[#7b55a3] uppercase"
      >
        {{ listing.source }}
      </p>
      <h2
        class="mt-1.5 mb-1 text-[21px] leading-tight font-[730] tracking-[-0.03em]"
      >
        {{ listing.title }}
      </h2>
      <p class="mt-0 flex items-center gap-1 text-[10px] text-[#7a8581]">
        <MapPin class="size-3.5" aria-hidden="true" />
        {{
          listing.locationText || listing.address || "Lokacija ni objavljena"
        }}
      </p>

      <section class="mt-4 grid gap-1.5 rounded-[9px] bg-[#f3eef7] p-[17px]">
        <span class="text-[9px] font-[650] text-[#786686] uppercase"
          >Zahtevana cena</span
        >
        <strong class="text-[25px] font-[740] tracking-[-0.04em]">
          {{
            formatListingPrice(
              listing.price,
              listing.priceUnit,
              listing.transactionType,
            )
          }}
        </strong>
        <span
          v-if="pricePerM2 !== undefined"
          class="text-[10px] font-semibold text-[#654184]"
        >
          {{ formatPricePerM2(pricePerM2) }}
        </span>
      </section>

      <dl class="my-2 grid grid-cols-2 gap-2">
        <div class="rounded-[7px] bg-[#f0f4f0] p-[13px]">
          <dt class="flex items-center gap-1 text-[9px] text-[#77827e]">
            <Ruler class="size-3" /> Površina
          </dt>
          <dd class="mt-1 mb-0 text-sm font-bold">
            {{
              listing.areaM2 !== null
                ? formatArea(listing.areaM2)
                : "Ni podatka"
            }}
          </dd>
        </div>
        <div class="rounded-[7px] bg-[#f0f4f0] p-[13px]">
          <dt class="text-[9px] text-[#77827e]">Sobe</dt>
          <dd class="mt-1 mb-0 text-sm font-bold">
            {{ listing.rooms ?? "Ni podatka" }}
          </dd>
        </div>
      </dl>

      <p
        v-if="listing.description"
        class="my-4 whitespace-pre-line text-[11px] leading-[1.65] text-[#52605b]"
      >
        {{ listing.description }}
      </p>

      <div
        class="rounded-lg border border-[#e1e6e2] bg-white p-3.5 text-[10px] leading-[1.55] text-[#697570]"
      >
        <p class="m-0">
          <strong>Nazadnje potrjeno:</strong>
          {{ formatDate(listing.lastSeenAt) }}
        </p>
        <p v-if="stale" class="mt-1.5 mb-0 text-[#8a6524]">
          Ta oglas ni bil potrjen več kot 24 ur in morda ni več aktualen.
        </p>
        <p
          v-if="listing.locationAccuracy === 'approximate'"
          class="mt-1.5 mb-0"
        >
          Lokacija na zemljevidu je približna.
        </p>
      </div>

      <a
        :href="listing.url"
        target="_blank"
        rel="noopener nofollow"
        class="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] bg-[#7b55a3] px-4 text-[11px] font-bold text-white no-underline"
      >
        Odpri izvirni oglas <ExternalLink class="size-4" aria-hidden="true" />
      </a>
      <NuxtLink
        :to="`/oglas/${encodeURIComponent(listing.id)}`"
        class="mt-2 inline-flex min-h-10 w-full items-center justify-center text-[10px] font-semibold text-[#654184]"
      >
        Celotna stran oglasa
      </NuxtLink>

      <footer class="px-0.5 pt-[18px] pb-2 text-[9px] text-[#7a8581]">
        <Info class="mr-1 inline size-3" aria-hidden="true" />
        Zahtevana cena iz oglasa ni dosežena prodajna cena.
      </footer>
    </div>
  </aside>
</template>
