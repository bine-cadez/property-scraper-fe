<script setup lang="ts">
import { ChevronRight, Info, ListFilter, MapPin, Ruler } from "@lucide/vue";
import type { MapResultItem } from "#shared/types/property";
import { formatArea } from "#shared/utils/format";
import { formatListingPrice } from "#shared/utils/listings";

defineProps<{
  results: MapResultItem[];
  featureCount: number;
  loading: boolean;
  selectedId: string | undefined;
}>();

defineEmits<{ select: [item: MapResultItem] }>();
</script>

<template>
  <section
    class="flex h-full min-h-0 flex-col bg-[#f7f8f5]"
    aria-label="Oglasi na prikazanem območju"
    :aria-busy="loading"
  >
    <header class="border-b border-[#e3e8e4] bg-white px-5 pt-5 pb-4">
      <p
        class="m-0 mb-1 text-[9px] font-[750] tracking-[0.12em] text-[#7b55a3] uppercase"
      >
        Aktivni oglasi
      </p>
      <h1 class="m-0 text-[19px] font-[750] tracking-[-0.035em]">
        Ponudba na zemljevidu
      </h1>
      <p class="mt-1.5 mb-0 text-[11px] text-[#74817d]">
        {{
          loading
            ? "Posodabljamo prikaz …"
            : `${results.length || featureCount} oglasov na prikazanem območju`
        }}
      </p>
    </header>

    <div
      v-if="results.length"
      class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5"
    >
      <button
        v-for="item in results"
        :key="item.id"
        type="button"
        class="mb-2.5 grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border bg-white p-3.5 text-left text-ink"
        :class="
          selectedId === item.selectionId
            ? 'border-[#7b55a3]'
            : 'border-[#e0e6e2]'
        "
        @click="$emit('select', item)"
      >
        <span
          class="grid size-10 place-items-center rounded-[10px] bg-[#f1eaf7] text-[#7b55a3]"
          aria-hidden="true"
        >
          <MapPin class="size-[19px]" />
        </span>
        <span class="min-w-0">
          <strong class="block truncate text-[13px]">{{ item.address }}</strong>
          <span class="mt-0.5 block truncate text-[10px] text-[#78847f]">
            {{ item.transactionType === "sale" ? "Prodaja" : "Oddaja" }}
            <template v-if="item.sourceLabel">
              · {{ item.sourceLabel }}</template
            >
          </span>
          <strong class="mt-2 block text-[15px] text-[#654184]">
            {{
              formatListingPrice(
                item.totalPrice ?? null,
                item.priceUnit ?? "unknown",
                item.transactionType,
              )
            }}
          </strong>
          <span
            v-if="item.areaM2 !== undefined"
            class="mt-1 flex items-center gap-1 text-[9px] text-[#78847f]"
          >
            <Ruler class="size-3" /> {{ formatArea(item.areaM2) }}
          </span>
        </span>
        <ChevronRight class="size-4 text-[#91809d]" aria-hidden="true" />
      </button>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 place-items-center px-8 py-10 text-center text-[#6e7a76]"
    >
      <div>
        <ListFilter class="mx-auto mb-3 size-6" aria-hidden="true" />
        <strong class="text-[13px]"
          >Na tej povečavi ni posameznih oglasov.</strong
        >
        <p class="mt-1.5 text-[11px]">
          Približajte zemljevid, da se skupine razprejo.
        </p>
      </div>
    </div>

    <footer
      class="border-t border-[#e5e9e5] bg-white px-[18px] py-3 text-[9px] text-[#7b8682]"
    >
      <Info class="mr-1 inline size-3" /> Samo oglasi z lokacijo.
      <NuxtLink to="/oglasi" class="font-bold text-[#654184]"
        >Vsi oglasi</NuxtLink
      >
    </footer>
  </section>
</template>
