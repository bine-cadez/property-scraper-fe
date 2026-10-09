<script setup lang="ts">
import { ExternalLink, MapPin } from "@lucide/vue";
import type { Listing, ListingSourcesResponse } from "#shared/types/property";
import { formatArea, formatDate, formatPricePerM2 } from "#shared/utils/format";
import {
  formatListingPrice,
  isListingStale,
  listingKindFromId,
  listingPricePerM2,
} from "#shared/utils/listings";

const route = useRoute();
const config = useRuntimeConfig();
const id = computed(() => String(route.params.id));
const kind = computed(() => listingKindFromId(id.value));
if (!kind.value)
  throw createError({
    statusCode: 400,
    statusMessage: "Neveljaven identifikator oglasa.",
  });

const requestFetch = useRequestFetch();
const [{ data: listing, error }, { data: sources }] = await Promise.all([
  useAsyncData(`listing-${id.value}`, () =>
    requestFetch<Listing>(
      `/api/listings/${kind.value}/${encodeURIComponent(id.value)}`,
    ),
  ),
  useFetch<ListingSourcesResponse>("/api/listings/sources"),
]);
if (error.value || !listing.value)
  throw createError({ statusCode: 404, statusMessage: "Oglas ni najden." });

const record = computed(() => listing.value!);
const source = computed(() =>
  sources.value?.items.find((item) => item.key === record.value.source),
);
const pricePerM2 = computed(() => listingPricePerM2(record.value));
const canonical = computed(
  () =>
    `${String(config.public.siteUrl).replace(/\/$/, "")}/oglas/${encodeURIComponent(record.value.id)}`,
);

function hideBrokenImage(event: Event) {
  (event.currentTarget as HTMLImageElement).hidden = true;
}

useSeoMeta({
  title: () =>
    `${record.value.title} – ${formatListingPrice(record.value.price, record.value.priceUnit, record.value.transactionType)} | Prostor na dlani`,
  description: () =>
    `${record.value.transactionType === "sale" ? "Prodajni" : "Najemni"} oglas za ${record.value.title} v ${record.value.locationText}. Nazadnje potrjeno ${formatDate(record.value.lastSeenAt)}.`,
  robots: "index, follow",
});
useHead({ link: [{ rel: "canonical", href: canonical }] });
</script>

<template>
  <div class="min-h-dvh bg-[#f7f9f8]">
    <AppHeader />
    <main class="mx-auto w-[min(1120px,calc(100%-32px))] pt-6 pb-24">
      <nav class="flex min-h-9 items-center gap-2 text-[10px] text-ink-muted">
        <NuxtLink to="/oglasi">Oglasi</NuxtLink><span>/</span
        ><span aria-current="page">{{ record.title }}</span>
      </nav>

      <div
        class="mt-8 grid grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] gap-8 max-[800px]:grid-cols-1"
      >
        <div>
          <div
            v-if="record.images.length"
            class="grid grid-cols-2 gap-2 overflow-hidden rounded-xl max-[560px]:grid-cols-1"
          >
            <img
              v-for="(image, index) in record.images.slice(0, 4)"
              :key="image"
              :src="image"
              :alt="`${record.title} – fotografija ${index + 1}`"
              class="aspect-[4/3] h-full w-full object-cover first:row-span-2"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="hideBrokenImage"
            />
          </div>
          <div
            v-else
            class="grid aspect-[16/8] place-items-center rounded-xl bg-[#e8ece9] text-sm text-ink-muted"
          >
            Fotografije niso na voljo
          </div>

          <section class="mt-8">
            <p
              class="m-0 text-[10px] font-extrabold tracking-[0.08em] text-[#7b55a3] uppercase"
            >
              {{ record.transactionType === "sale" ? "Prodaja" : "Oddaja" }} ·
              {{ source?.name ?? record.source }}
            </p>
            <h1
              class="mt-2 mb-2 text-[clamp(30px,5vw,50px)] leading-[1.05] font-bold tracking-[-0.045em]"
            >
              {{ record.title }}
            </h1>
            <p class="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin class="size-4" />{{
                record.locationText ||
                record.address ||
                "Lokacija ni objavljena"
              }}
            </p>
          </section>

          <section
            v-if="record.description"
            class="mt-10 border-t border-line pt-7"
          >
            <h2 class="text-xl">Opis oglasa</h2>
            <p
              class="whitespace-pre-line text-[14px] leading-[1.75] text-[#45524e]"
            >
              {{ record.description }}
            </p>
          </section>
        </div>

        <aside
          class="sticky top-5 self-start rounded-xl border border-line bg-white p-6 shadow-[0_8px_28px_rgb(29_68_58_/_7%)] max-[800px]:static"
        >
          <span
            class="text-[9px] font-bold tracking-[0.08em] text-ink-muted uppercase"
            >Zahtevana cena</span
          >
          <strong class="mt-1 block text-[28px] tracking-[-0.04em]">{{
            formatListingPrice(
              record.price,
              record.priceUnit,
              record.transactionType,
            )
          }}</strong>
          <span
            v-if="pricePerM2 !== undefined"
            class="mt-1 block text-[11px] font-semibold text-[#654184]"
            >{{ formatPricePerM2(pricePerM2) }}</span
          >

          <dl
            class="my-6 grid grid-cols-2 gap-2 [&>div]:rounded-lg [&>div]:bg-[#f3f5f2] [&>div]:p-3 [&_dd]:mt-1 [&_dd]:mb-0 [&_dd]:font-bold [&_dt]:text-[9px] [&_dt]:text-ink-muted"
          >
            <div>
              <dt>Površina</dt>
              <dd>
                {{
                  record.areaM2 !== null
                    ? formatArea(record.areaM2)
                    : "Ni podatka"
                }}
              </dd>
            </div>
            <div>
              <dt>Sobe</dt>
              <dd>{{ record.rooms ?? "Ni podatka" }}</dd>
            </div>
            <div>
              <dt>Zemljišče</dt>
              <dd>
                {{
                  record.landAreaM2 !== null
                    ? formatArea(record.landAreaM2)
                    : "Ni podatka"
                }}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ record.active ? "Aktiven" : "Umaknjen" }}</dd>
            </div>
          </dl>

          <p
            class="rounded-lg bg-[#fffaf0] p-3 text-[10px] leading-[1.55] text-[#6c5a34]"
          >
            Nazadnje potrjeno {{ formatDate(record.lastSeenAt) }}.<template
              v-if="isListingStale(record.lastSeenAt)"
            >
              Oglas je starejši od 24 ur in morda ni več aktualen.</template
            >
          </p>
          <p
            v-if="record.locationAccuracy === 'approximate'"
            class="text-[10px] text-ink-muted"
          >
            Lokacija na zemljevidu je približna, ne naslov konkretne stavbe.
          </p>

          <a
            :href="record.url"
            target="_blank"
            rel="noopener nofollow"
            class="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#7b55a3] px-4 text-[12px] font-bold text-white no-underline"
            >Odpri izvirni oglas <ExternalLink class="size-4"
          /></a>
          <NuxtLink
            v-if="record.longitude !== null && record.latitude !== null"
            :to="{
              path: '/zemljevid',
              query: {
                c: `${record.longitude},${record.latitude}`,
                z: '15',
                l: 'listings',
                izbor: `listing:${record.id}`,
              },
            }"
            class="mt-2 inline-flex min-h-11 w-full items-center justify-center text-[11px] font-bold text-[#654184]"
            >Pokaži na zemljevidu</NuxtLink
          >
        </aside>
      </div>
    </main>
  </div>
</template>
