<script setup lang="ts">
import { ExternalLink, MapPin, Ruler } from "@lucide/vue";
import type {
  ListingListResponse,
  ListingPropertyType,
  ListingSourcesResponse,
} from "#shared/types/property";
import { formatArea, formatDate } from "#shared/utils/format";
import { formatListingPrice, isListingStale } from "#shared/utils/listings";

const kind = ref<"sales" | "rentals">("sales");
const propertyType = ref<ListingPropertyType | "">("");
const source = ref("");
const priceMax = ref("");
const areaMin = ref("");
const requestFetch = useRequestFetch();

const query = computed(() => ({
  dedupe: "true",
  limit: "50",
  ...(propertyType.value ? { propertyType: propertyType.value } : {}),
  ...(source.value ? { source: source.value } : {}),
  ...(priceMax.value
    ? {
        priceMax: priceMax.value,
        priceUnit: kind.value === "sales" ? "total" : "month",
      }
    : {}),
  ...(areaMin.value ? { areaMin: areaMin.value } : {}),
}));

const { data, pending, error } = await useAsyncData(
  "listing-catalogue",
  () =>
    requestFetch<ListingListResponse>(`/api/listings/${kind.value}`, {
      query: query.value,
    }),
  { watch: [kind, propertyType, source, priceMax, areaMin] },
);
const { data: sources } = await useFetch<ListingSourcesResponse>(
  "/api/listings/sources",
);

const items = ref(data.value?.items ?? []);
const nextCursor = ref(data.value?.page.nextCursor ?? null);
const hasMore = ref(data.value?.page.hasMore ?? false);
const loadingMore = ref(false);

watch(data, (value) => {
  items.value = value?.items ?? [];
  nextCursor.value = value?.page.nextCursor ?? null;
  hasMore.value = value?.page.hasMore ?? false;
});

async function loadMore() {
  if (!hasMore.value || !nextCursor.value || loadingMore.value) return;
  loadingMore.value = true;
  try {
    const page = await $fetch<ListingListResponse>(
      `/api/listings/${kind.value}`,
      {
        query: { ...query.value, cursor: nextCursor.value },
      },
    );
    items.value.push(...page.items);
    nextCursor.value = page.page.nextCursor;
    hasMore.value = page.page.hasMore;
  } finally {
    loadingMore.value = false;
  }
}

function sourceName(key: string) {
  return sources.value?.items.find((item) => item.key === key)?.name ?? key;
}

function hideBrokenImage(event: Event) {
  (event.currentTarget as HTMLImageElement).hidden = true;
}

const propertyTypes: { value: ListingPropertyType | ""; label: string }[] = [
  { value: "", label: "Vse vrste" },
  { value: "apartment", label: "Stanovanje" },
  { value: "house", label: "Hiša" },
  { value: "land", label: "Zemljišče" },
  { value: "commercial", label: "Poslovni prostor" },
  { value: "garage", label: "Garaža" },
  { value: "other", label: "Drugo" },
];

useSeoMeta({
  title: "Nepremičninski oglasi | Prostor na dlani",
  description:
    "Aktivni oglasi za prodajo in oddajo nepremičnin v Sloveniji z zahtevano ceno, površino in datumom zadnje potrditve.",
});
useHead({ link: [{ rel: "canonical", href: "/oglasi" }] });
</script>

<template>
  <div class="min-h-dvh bg-[#f7f9f8]">
    <AppHeader />
    <main class="mx-auto w-[min(1180px,calc(100%-32px))] pt-12 pb-24">
      <header class="max-w-[760px]">
        <p
          class="m-0 text-[10px] font-extrabold tracking-[0.09em] text-[#7b55a3] uppercase"
        >
          Trenutna ponudba
        </p>
        <h1
          class="mt-2 mb-3 text-[clamp(34px,6vw,58px)] leading-[1.03] font-bold tracking-[-0.045em]"
        >
          Nepremičninski oglasi
        </h1>
        <p class="text-[15px] leading-[1.65] text-ink-muted">
          Zahtevane cene iz javnih oglasov. To niso dosežene prodajne cene; pri
          vsakem oglasu pokažemo tudi, kdaj je bil nazadnje potrjen.
        </p>
      </header>

      <section
        class="mt-8 grid gap-3 rounded-xl border border-line bg-white p-4"
        aria-label="Filtri oglasov"
      >
        <div class="grid grid-cols-2 gap-1 rounded-lg bg-[#f1f3f1] p-1">
          <button
            v-for="option in [
              { id: 'sales', label: 'Prodaja' },
              { id: 'rentals', label: 'Oddaja' },
            ] as const"
            :key="option.id"
            type="button"
            class="min-h-11 rounded-md border-0 text-[12px] font-bold"
            :class="
              kind === option.id
                ? 'bg-white text-[#654184] shadow-sm'
                : 'bg-transparent text-[#65716d]'
            "
            @click="kind = option.id"
          >
            {{ option.label }}
          </button>
        </div>
        <div
          class="grid grid-cols-4 gap-3 max-[760px]:grid-cols-2 max-[480px]:grid-cols-1 [&_input]:min-h-11 [&_input]:rounded-md [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-3 [&_select]:min-h-11 [&_select]:rounded-md [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:px-3"
        >
          <label
            class="grid gap-1 text-[9px] font-bold text-ink-muted uppercase"
            >Vrsta
            <select v-model="propertyType">
              <option
                v-for="option in propertyTypes"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
          <label
            class="grid gap-1 text-[9px] font-bold text-ink-muted uppercase"
            >Vir
            <select v-model="source">
              <option value="">Vsi viri</option>
              <option
                v-for="item in sources?.items.filter((entry) => entry.enabled)"
                :key="item.key"
                :value="item.key"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
          <label
            class="grid gap-1 text-[9px] font-bold text-ink-muted uppercase"
            >Najvišja cena
            <input
              v-model="priceMax"
              type="number"
              min="0"
              step="100"
              :placeholder="kind === 'sales' ? 'EUR skupaj' : 'EUR / mesec'"
            />
          </label>
          <label
            class="grid gap-1 text-[9px] font-bold text-ink-muted uppercase"
            >Najmanjša površina
            <input
              v-model="areaMin"
              type="number"
              min="0"
              step="1"
              placeholder="m²"
            />
          </label>
        </div>
        <p
          v-if="kind === 'rentals' && priceMax"
          class="m-0 text-[10px] text-[#8a6524]"
        >
          Filter cene prikazuje oglase s ceno na mesec; oglasi brez znanega
          obdobja so izločeni.
        </p>
      </section>

      <p
        v-if="error"
        class="mt-8 rounded-lg border border-[#e6d7ae] bg-[#fffdf5] p-4 text-sm text-[#5f5130]"
        role="alert"
      >
        Oglasov trenutno ni mogoče naložiti.
      </p>
      <div
        v-else-if="pending && !items.length"
        class="mt-8 grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1"
        aria-label="Nalaganje oglasov"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="h-[330px] animate-pulse rounded-xl bg-[#e8ece9] motion-reduce:animate-none"
        />
      </div>
      <section
        v-else
        class="mt-8 grid grid-cols-3 gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1"
        aria-live="polite"
      >
        <article
          v-for="listing in items"
          :key="listing.id"
          class="overflow-hidden rounded-xl border border-line bg-white shadow-[0_5px_18px_rgb(29_68_58_/_5%)]"
        >
          <div class="relative aspect-[16/10] bg-[#e8ece9]">
            <img
              v-if="listing.images[0]"
              :src="listing.images[0]"
              :alt="listing.title"
              class="h-full w-full object-cover"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="hideBrokenImage"
            />
            <span
              class="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold text-[#654184]"
              >{{ sourceName(listing.source) }}</span
            >
            <span
              v-if="isListingStale(listing.lastSeenAt)"
              class="absolute right-3 bottom-3 rounded-full bg-[#fff3d8] px-2 py-1 text-[8px] font-bold text-[#8a6524]"
              >Starejši podatek</span
            >
          </div>
          <div class="p-4">
            <p
              class="m-0 text-[9px] font-bold tracking-[0.07em] text-[#7b55a3] uppercase"
            >
              {{ listing.transactionType === "sale" ? "Prodaja" : "Oddaja" }}
            </p>
            <h2
              class="mt-1.5 mb-1 line-clamp-2 min-h-[42px] text-[17px] leading-tight"
            >
              {{ listing.title }}
            </h2>
            <p
              class="m-0 flex items-center gap-1 truncate text-[10px] text-ink-muted"
            >
              <MapPin class="size-3.5 shrink-0" />
              {{ listing.locationText || "Lokacija ni objavljena" }}
            </p>
            <strong class="mt-4 block text-[20px] tracking-[-0.03em]">{{
              formatListingPrice(
                listing.price,
                listing.priceUnit,
                listing.transactionType,
              )
            }}</strong>
            <div class="mt-3 flex gap-4 text-[10px] text-ink-muted">
              <span
                v-if="listing.areaM2 !== null"
                class="flex items-center gap-1"
                ><Ruler class="size-3.5" />{{
                  formatArea(listing.areaM2)
                }}</span
              >
              <span v-if="listing.rooms !== null">{{ listing.rooms }} sob</span>
            </div>
            <p class="mt-3 mb-0 text-[9px] text-[#7b8782]">
              Nazadnje potrjeno {{ formatDate(listing.lastSeenAt) }}
            </p>
            <div
              class="mt-4 flex items-center justify-between border-t border-[#edf0ed] pt-3"
            >
              <NuxtLink
                :to="`/oglas/${encodeURIComponent(listing.id)}`"
                class="text-[11px] font-bold text-[#654184]"
                >Podrobnosti</NuxtLink
              >
              <a
                :href="listing.url"
                target="_blank"
                rel="noopener nofollow"
                class="inline-flex items-center gap-1 text-[10px] text-ink-muted"
                >Izvirnik <ExternalLink class="size-3"
              /></a>
            </div>
          </div>
        </article>
      </section>

      <div v-if="hasMore" class="mt-9 text-center">
        <button
          type="button"
          class="min-h-12 rounded-lg border border-[#7b55a3] bg-white px-7 text-[12px] font-bold text-[#654184]"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? "Nalaganje …" : "Prikaži več oglasov" }}
        </button>
      </div>
      <p
        v-else-if="items.length"
        class="mt-8 text-center text-[10px] text-ink-muted"
      >
        Prikazani so vsi oglasi, ki ustrezajo filtrom.
      </p>
    </main>
  </div>
</template>
