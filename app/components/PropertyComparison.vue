<script setup lang="ts">
import { ArrowLeft, Info, Layers3, Map } from "@lucide/vue";
import type { MapResultItem, SearchResult } from "#shared/types/property";
import {
  formatArea,
  formatDate,
  formatEur,
  formatPricePerM2,
} from "#shared/utils/format";

const props = defineProps<{ items: MapResultItem[] }>();

defineEmits<{
  close: [];
  changeSelection: [];
  select: [result: SearchResult];
}>();

type ComparisonRow = {
  label: string;
  value: (item: MapResultItem) => string;
};

function floorAndYear(item: MapResultItem) {
  const floor = item.floor !== undefined ? String(item.floor) : "Ni podatka";
  const year = item.constructionYear ?? "Ni podatka";
  return `${floor} / ${year}`;
}

const transactionRows: ComparisonRow[] = [
  {
    label: "Prodajna cena",
    value: (item) =>
      item.totalPrice !== undefined ? formatEur(item.totalPrice) : "Ni podatka",
  },
  {
    label: "Cena na m²",
    value: (item) =>
      item.pricePerM2 !== undefined
        ? formatPricePerM2(item.pricePerM2)
        : "Ni podatka",
  },
  {
    label: "Pogodba",
    value: (item) =>
      item.transactionDate ? formatDate(item.transactionDate) : "Ni podatka",
  },
  {
    label: "Površina",
    value: (item) =>
      item.areaM2 !== undefined ? formatArea(item.areaM2) : "Ni podatka",
  },
  {
    label: "Uporabna površina",
    value: (item) =>
      item.usableAreaM2 !== undefined
        ? formatArea(item.usableAreaM2)
        : "Ni podatka",
  },
  { label: "Nadstropje / leto", value: floorAndYear },
  {
    label: "Ocena GURS · 1. 1. 2025",
    value: (item) =>
      item.officialValue !== undefined
        ? formatEur(item.officialValue)
        : "Ni podatka",
  },
  {
    label: "Status posla",
    value: (item) => item.status || "V preverjanju",
  },
  {
    label: "Vir podatkov",
    value: (item) => item.sourceLabel || "GURS · ETN / KN / EV",
  },
];

const buildingRows: ComparisonRow[] = [
  {
    label: "Ocena GURS",
    value: (item) =>
      item.officialValue !== undefined
        ? formatEur(item.officialValue)
        : "Ni podatka",
  },
  {
    label: "Površina stavbe",
    value: (item) =>
      item.areaM2 !== undefined ? formatArea(item.areaM2) : "Ni podatka",
  },
  {
    label: "Tlorisna površina",
    value: (item) =>
      item.footprintAreaM2 !== undefined
        ? formatArea(item.footprintAreaM2)
        : "Ni podatka",
  },
  {
    label: "Leto izgradnje",
    value: (item) => String(item.constructionYear ?? "Ni podatka"),
  },
  {
    label: "Deli stavbe",
    value: (item) => String(item.unitCount ?? "Ni podatka"),
  },
  {
    label: "Etaže",
    value: (item) => String(item.floors ?? "Ni podatka"),
  },
  {
    label: "Namembnost",
    value: (item) => item.buildingUse || "Ni podatka",
  },
  {
    label: "Vir podatkov",
    value: (item) => item.sourceLabel || "GURS · KN / EV",
  },
];

const comparingBuildings = computed(
  () =>
    props.items.length > 0 &&
    props.items.every((item) => item.kind === "building"),
);
const rows = computed(() =>
  comparingBuildings.value ? buildingRows : transactionRows,
);
const mobileRows = computed(() =>
  rows.value.filter(
    (row) =>
      !["Prodajna cena", "Ocena GURS", "Vir podatkov"].includes(row.label),
  ),
);
</script>

<template>
  <section
    class="fixed inset-0 z-80 overflow-y-auto bg-[#f8f9f4] text-ink"
    role="dialog"
    aria-modal="true"
    aria-label="Primerjava nepremičnin"
  >
    <header class="sticky top-0 z-3 border-b border-[#e6e9e6] bg-white">
      <div
        class="mx-auto hidden min-h-[82px] w-[min(1240px,calc(100%-48px))] grid-cols-[150px_minmax(280px,365px)_1fr_auto_auto] items-center gap-[18px] min-[721px]:grid"
      >
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-xl text-ink no-underline"
          aria-label="Prostor, domov"
        >
          <span
            class="grid size-[30px] place-items-center rounded-[7px] bg-accent text-white"
            aria-hidden="true"
          >
            <Map class="w-[19px]" :stroke-width="1.55" />
          </span>
          <strong>prostor.</strong>
        </NuxtLink>
        <MapSearch
          class="w-full [&_.search-box]:min-h-[48px] [&_.search-box]:shadow-none [&_.search-input]:h-[46px] [&_kbd]:hidden"
          @select="$emit('select', $event)"
        />
        <span />
        <button
          type="button"
          class="border-0 bg-transparent text-[11px] font-[680] text-[#294d43]"
          @click="$emit('changeSelection')"
        >
          Primerjava
        </button>
        <NuxtLink
          class="text-[11px] font-[680] text-[#294d43] no-underline"
          to="/viri-podatkov"
          ><Info class="mr-1 inline size-3.5" aria-hidden="true" /> O
          podatkih</NuxtLink
        >
      </div>

      <div
        class="grid min-h-[58px] grid-cols-[1fr_auto_1fr] items-center px-3 min-[721px]:hidden"
      >
        <button
          type="button"
          class="justify-self-start border-0 bg-transparent text-lg text-[#294d43]"
          aria-label="Nazaj na rezultate"
          @click="$emit('close')"
        >
          <ArrowLeft class="size-5" aria-hidden="true" />
        </button>
        <strong class="text-[13px]">Primerjava</strong>
        <NuxtLink
          to="/viri-podatkov"
          class="justify-self-end text-[#294d43] no-underline"
          aria-label="Podatki in viri"
        >
          <Layers3 class="w-[19px]" :stroke-width="1.7" aria-hidden="true" />
        </NuxtLink>
      </div>
    </header>

    <main
      class="mx-auto w-[min(1160px,calc(100%-48px))] py-9 pb-[72px] max-[720px]:w-auto max-[720px]:px-3 max-[720px]:pt-[18px] max-[720px]:pb-[34px]"
    >
      <button
        type="button"
        class="mb-5 hidden border-0 bg-transparent p-0 text-[11px] font-[650] text-[#294d43] min-[721px]:block"
        @click="$emit('close')"
      >
        <ArrowLeft class="mr-1 inline size-4" aria-hidden="true" />
        Nazaj na rezultate
      </button>

      <div
        class="mb-[18px] flex items-end justify-between gap-6 max-[720px]:block max-[720px]:px-0.5"
      >
        <div>
          <h1 class="m-0 text-[28px] tracking-[-0.035em] max-[720px]:text-xl">
            <span class="max-[720px]:hidden">{{
              items.length === 2 ? "Primerjajte dejstva." : "Primerjava"
            }}</span>
            <span class="hidden max-[720px]:inline">{{
              items.length === 2 ? "Dve enoti. En pregled." : "Primerjava"
            }}</span>
          </h1>
          <p
            class="mt-[5px] mb-0 text-xs text-[#75817d] max-[720px]:text-[10px]"
          >
            <span class="max-[720px]:hidden">{{
              items.length === 2
                ? comparingBuildings
                  ? "Dve stavbi, ključni podatki drug ob drugem."
                  : "Dve zabeleženi prodaji, isti pregled podatkov."
                : "Izberite dve enoti za primerjavo."
            }}</span>
            <span class="hidden max-[720px]:inline">{{
              items.length === 2
                ? comparingBuildings
                  ? "Primerjava podatkov o stavbah."
                  : "Primerjava evidentiranih prodaj."
                : "Izberite dve enoti za primerjavo."
            }}</span>
          </p>
        </div>
        <button
          type="button"
          class="min-h-[38px] rounded-md border border-[#dfe5e1] bg-white px-[18px] text-[11px] font-[650] text-[#294d43] max-[720px]:hidden"
          @click="$emit('changeSelection')"
        >
          Spremeni izbor
        </button>
      </div>

      <template v-if="items.length">
        <div
          class="hidden overflow-hidden rounded-[9px] border border-[#e1e6e2] bg-white min-[721px]:grid"
          :style="{
            gridTemplateColumns: `minmax(180px,.72fr) repeat(${items.length}, minmax(220px,1fr))`,
          }"
        >
          <div
            class="grid min-h-[102px] content-center gap-1 border-b border-[#e4e8e5] bg-[#edf4dc] px-4 py-3.5"
          >
            <strong>{{ items.length }} izbrani enoti</strong>
            <span class="text-[10px] text-[#6f7b77]"
              >Podatki drug ob drugem</span
            >
          </div>
          <article
            v-for="item in items"
            :key="item.id"
            class="grid min-h-[102px] min-w-0 content-center gap-1 border-b border-l border-[#e4e8e5] bg-white px-4 py-3.5"
          >
            <strong class="text-[13px]">{{ item.address }}</strong>
            <span class="text-[10px] text-[#7a8581]">{{
              [item.location, item.unitLabel].filter(Boolean).join(" · ") ||
              "Slovenija"
            }}</span>
            <b class="mt-[3px] text-base">{{
              item.kind === "building" && item.officialValue !== undefined
                ? formatEur(item.officialValue)
                : item.totalPrice !== undefined
                  ? formatEur(item.totalPrice)
                  : "Vrednost ni na voljo"
            }}</b>
          </article>

          <template v-for="(row, rowIndex) in rows" :key="row.label">
            <div
              class="min-w-0 border-b border-[#e4e8e5] px-4 py-3.5 text-[11px] text-[#6f7b77]"
              :class="rowIndex % 2 ? 'bg-[#f1f5f1]' : 'bg-white'"
            >
              {{ row.label }}
            </div>
            <div
              v-for="item in items"
              :key="`${row.label}-${item.id}`"
              class="min-w-0 border-b border-l border-[#e4e8e5] px-4 py-3.5 text-[11px] font-[650]"
              :class="rowIndex % 2 ? 'bg-[#f1f5f1]' : 'bg-white'"
            >
              {{ row.value(item) }}
            </div>
          </template>
        </div>

        <div class="min-[721px]:hidden">
          <div class="grid grid-cols-2 gap-1.5">
            <article
              v-for="item in items"
              :key="item.id"
              class="grid min-h-[92px] min-w-0 content-center gap-1 rounded-[7px] bg-white px-3 py-3"
            >
              <strong class="truncate text-xs">{{ item.address }}</strong>
              <span class="truncate text-[9px] text-[#7a8581]">{{
                item.unitLabel || item.location || "Slovenija"
              }}</span>
              <b class="mt-[3px] text-sm">{{
                item.kind === "building" && item.officialValue !== undefined
                  ? formatEur(item.officialValue)
                  : item.totalPrice !== undefined
                    ? formatEur(item.totalPrice)
                    : "Vrednost ni na voljo"
              }}</b>
            </article>
          </div>

          <div
            class="mt-2 overflow-hidden rounded-[8px] border border-[#e1e6e2]"
          >
            <section
              v-for="(row, rowIndex) in mobileRows"
              :key="row.label"
              class="grid grid-cols-2 gap-x-3 px-3 py-3"
              :class="rowIndex % 2 ? 'bg-[#f1f5f1]' : 'bg-white'"
            >
              <h2
                class="col-span-full m-0 mb-2 text-[9px] font-normal text-[#7a8581]"
              >
                {{ row.label }}
              </h2>
              <strong
                v-for="item in items"
                :key="`${row.label}-${item.id}`"
                class="min-w-0 text-[10px]"
                >{{ row.value(item) }}</strong
              >
            </section>
          </div>

          <button
            type="button"
            class="mt-2.5 min-h-11 w-full rounded-[7px] border border-[#dfe5e1] bg-white text-[11px] font-[650] text-[#294d43]"
            @click="$emit('changeSelection')"
          >
            Spremeni izbor
          </button>
        </div>
      </template>

      <div
        v-else
        class="grid min-h-[300px] place-items-center content-center gap-2 rounded-[9px] border border-[#e1e6e2] bg-white text-center text-[#73807b]"
      >
        <strong class="text-[#294d43]">Izbor je prazen.</strong>
        <p class="mb-2.5 text-xs">
          Na seznamu rezultatov označite največ dve prodaji.
        </p>
        <button
          type="button"
          class="min-h-[38px] rounded-md border border-[#dfe5e1] bg-white px-[18px] text-[11px] font-[650] text-[#294d43]"
          @click="$emit('close')"
        >
          Nazaj na rezultate
        </button>
      </div>

      <aside
        class="mt-3.5 flex gap-2.5 rounded-[7px] bg-[#eef3fa] px-[18px] py-[15px] text-[10px] leading-[1.45] text-[#5e7185] max-[720px]:mt-2.5"
      >
        <Info class="mt-px size-4 shrink-0" aria-hidden="true" />
        <div>
          <strong class="text-[#526981]">Dve različni nepremičnini</strong>
          <p class="mt-1 mb-0">
            Ocena GURS je modelska vrednost. Prodaji različnih enot ne
            prikazujeta sprejemne cene iste enote.
          </p>
          <small class="mt-2 block">GURS · ETN / KN / EV</small>
        </div>
      </aside>
    </main>
  </section>
</template>
