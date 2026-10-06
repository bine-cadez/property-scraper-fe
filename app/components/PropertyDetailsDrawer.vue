<script setup lang="ts">
import { ArrowLeft, ChevronDown, Info, Layers3 } from "@lucide/vue";
import type { MoneyValue, PropertyRecord } from "#shared/types/property";
import {
  formatArea,
  formatDate,
  formatEur,
  formatPricePerM2,
} from "#shared/utils/format";

const props = withDefaults(
  defineProps<{
    property: PropertyRecord;
    embedded?: boolean;
  }>(),
  { embedded: false },
);

const emit = defineEmits<{
  close: [];
  compare: [];
}>();

const transaction = computed(() => props.property.transactions[0]);
const unit = computed(() => props.property.units[0]);
const officialValue = computed<MoneyValue | undefined>(
  () =>
    unit.value?.officialValue ??
    props.property.building?.officialValue ??
    props.property.parcel.officialValue,
);
const primaryAmount = computed(
  () =>
    transaction.value?.price.amount ??
    props.property.primaryValuation?.amount ??
    officialValue.value?.amount,
);
const primaryPricePerM2 = computed(
  () =>
    transaction.value?.pricePerM2 ??
    props.property.primaryValuation?.amountPerM2 ??
    officialValue.value?.amountPerM2,
);
const primaryDate = computed(
  () =>
    transaction.value?.transactionDate ??
    props.property.primaryValuation?.valuationDate ??
    officialValue.value?.sourceUpdatedAt,
);
</script>

<template>
  <aside
    class="flex h-full min-h-0 w-full flex-col bg-surface text-ink max-[720px]:min-h-dvh"
    aria-label="Podrobnosti izbrane nepremičnine"
    @keydown.esc="emit('close')"
  >
    <header
      class="flex min-h-[58px] items-center border-b border-[#edf0ed] bg-white px-4 max-[720px]:sticky max-[720px]:top-0 max-[720px]:z-3 [&_a]:min-h-9 [&_a]:items-center [&_a]:gap-2 [&_a]:border-0 [&_a]:bg-transparent [&_a]:text-[11px] [&_a]:font-[650] [&_a]:text-[#294d43] [&_a]:no-underline [&_button]:inline-flex [&_button]:min-h-9 [&_button]:items-center [&_button]:gap-2 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[11px] [&_button]:font-[650] [&_button]:text-[#294d43]"
    >
      <button
        type="button"
        aria-label="Nazaj na rezultate"
        @click="emit('close')"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        <span class="max-[720px]:hidden">Nazaj na rezultate</span>
        <span class="hidden text-[13px] max-[720px]:inline">Podrobnosti</span>
      </button>
      <NuxtLink
        to="/viri-podatkov"
        class="ml-auto hidden max-[720px]:inline-flex"
        aria-label="Podatki in viri"
      >
        <Layers3 class="w-[19px]" :stroke-width="1.7" aria-hidden="true" />
      </NuxtLink>
    </header>

    <div
      class="min-h-0 flex-1 overflow-y-auto p-4 [overscroll-behavior:contain] max-[720px]:overflow-visible max-[720px]:px-3 max-[720px]:pt-4 max-[720px]:pb-[30px]"
    >
      <section>
        <h2
          class="m-0 text-[21px] font-[730] tracking-[-0.03em] max-[720px]:text-xl"
        >
          {{ property.address }}
        </h2>
        <p class="mt-[3px] mb-0 text-[10px] text-[#7a8581]">
          {{ property.settlement }}, {{ property.municipality }}
          <template v-if="unit"> · enota {{ unit.id }}</template>
        </p>
      </section>

      <section
        class="mt-[17px] grid gap-1.5 rounded-[9px] bg-[#f3f6ee] p-[17px] shadow-[0_4px_16px_rgb(29_68_58_/_5%)] max-[720px]:bg-white"
      >
        <span class="text-[9px] font-[650] text-[#77827e] uppercase">{{
          transaction ? "Prodajna cena" : "Vrednost"
        }}</span>
        <strong class="text-[27px] font-[740] tracking-[-0.04em]">{{
          primaryAmount !== undefined ? formatEur(primaryAmount) : "Ni podatka"
        }}</strong>
        <div class="flex items-center gap-[13px] text-[10px] text-[#697570]">
          <b class="font-[650] text-accent">{{
            primaryPricePerM2 !== undefined
              ? formatPricePerM2(primaryPricePerM2)
              : "€/m² ni podatka"
          }}</b>
          <time v-if="primaryDate" :datetime="primaryDate">{{
            formatDate(primaryDate)
          }}</time>
        </div>
        <small
          v-if="transaction"
          class="w-max rounded-full bg-[#fff3d8] px-[7px] py-1 text-[9px] text-[#8a6524]"
          ><Info class="inline size-3" aria-hidden="true" /> V
          preverjanju</small
        >
      </section>

      <dl class="my-2 grid grid-cols-2 gap-2">
        <div class="rounded-[7px] bg-[#f0f4f0] p-[13px]">
          <dt class="text-[9px] text-[#77827e]">Površina</dt>
          <dd class="mt-1 mb-0 text-sm font-bold">
            {{
              transaction
                ? formatArea(transaction.areaM2)
                : formatArea(property.parcel.areaM2)
            }}
          </dd>
        </div>
        <div class="rounded-[7px] bg-[#f0f4f0] p-[13px]">
          <dt class="text-[9px] text-[#77827e]">Uporabna</dt>
          <dd class="mt-1 mb-0 text-sm font-bold">
            {{ unit ? formatArea(unit.usableAreaM2) : "Ni podatka" }}
          </dd>
        </div>
      </dl>

      <section
        class="grid grid-cols-[1fr_auto] gap-x-2.5 gap-y-[5px] rounded-lg bg-[#eef3fa] p-[15px] text-[#556d88]"
      >
        <span class="text-[9px] font-[650] text-[#77827e] uppercase"
          >Ocena GURS</span
        >
        <strong class="col-start-2 row-start-1 row-end-3 self-center text-lg">{{
          officialValue !== undefined
            ? formatEur(officialValue.amount)
            : "Ni podatka"
        }}</strong>
        <p class="col-span-full m-0 text-[9px] leading-[1.4]">
          Posplošena vrednost enote
          <template v-if="officialValue">
            · {{ formatDate(officialValue.sourceUpdatedAt) }}</template
          >
        </p>
        <small class="col-span-full m-0 text-[9px] leading-[1.4]"
          >Modelska ocena, ne prodajna cena.</small
        >
      </section>

      <details
        class="mt-2 overflow-hidden rounded-[7px] border border-[#e1e6e2] bg-white [&_section]:border-t [&_section]:border-[#e8ebe8] [&_section]:p-3.5"
      >
        <summary
          class="flex min-h-[43px] cursor-pointer list-none items-center justify-between px-3 text-[10px] font-[670] [&::-webkit-details-marker]:hidden"
        >
          Prodaje v tej stavbi · {{ property.transactions.length }}
          <ChevronDown class="size-4" aria-hidden="true" />
        </summary>
        <ComparableSales :transactions="property.transactions" />
      </details>

      <details
        class="mt-2 overflow-hidden rounded-[7px] border border-[#e1e6e2] bg-white [&_section]:border-t [&_section]:border-[#e8ebe8] [&_section]:p-3.5"
      >
        <summary
          class="flex min-h-[43px] cursor-pointer list-none items-center justify-between px-3 text-[10px] font-[670] [&::-webkit-details-marker]:hidden"
        >
          Stavba in katastrski podatki
          <ChevronDown class="size-4" aria-hidden="true" />
        </summary>
        <BuildingFacts :building="property.building" />
        <ParcelFacts :parcel="property.parcel" />
      </details>

      <button
        type="button"
        class="mt-2 min-h-11 w-full rounded-[7px] border-0 bg-accent text-[11px] font-bold text-white"
        @click="emit('compare')"
      >
        Dodaj v primerjavo
      </button>

      <section
        class="mt-2.5 hidden gap-[5px] rounded-lg bg-white p-[15px] max-[720px]:grid"
      >
        <strong class="text-[13px]"
          >{{ property.settlement }}, {{ property.municipality }}</strong
        >
        <p class="m-0 text-[9px] text-[#7a8581]">
          {{
            property.propertyType === "apartment"
              ? "Stanovanje"
              : "Nepremičnina"
          }}
          <template v-if="property.building?.constructionYear">
            · stavba iz leta {{ property.building.constructionYear }}
          </template>
        </p>
        <button
          type="button"
          class="my-1.5 mb-0.5 min-h-9 rounded-md border-0 bg-[#f1f4f1] px-2.5 text-left text-[10px] font-[650] text-[#294d43]"
          @click="emit('close')"
        >
          ▧ Poglej na zemljevidu
        </button>
        <small class="m-0 text-[9px] text-[#7a8581]">
          {{ property.parcel.cadastralMunicipalityName }} · parcela
          {{ property.parcel.parcelNumber }}
        </small>
      </section>

      <footer class="px-0.5 pt-[18px] pb-2 text-[9px] text-[#7a8581]">
        <Info class="mr-1 inline size-3" aria-hidden="true" />
        GURS · ETN / KN / EV · podatki v preverjanju
      </footer>
    </div>
  </aside>
</template>
