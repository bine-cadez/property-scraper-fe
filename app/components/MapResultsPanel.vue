<script setup lang="ts">
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  DoorOpen,
  Info,
  ListFilter,
  Ruler,
} from "@lucide/vue";
import type { MapResultItem } from "#shared/types/property";
import { formatArea, formatEur } from "#shared/utils/format";

const props = defineProps<{
  results: MapResultItem[];
  featureCount: number;
  buildingsVisible: boolean;
  loading: boolean;
  selectedId: string | undefined;
  comparisonIds: string[];
}>();

const emit = defineEmits<{
  select: [item: MapResultItem];
  compare: [item: MapResultItem];
  openComparison: [];
}>();

function isCompared(item: MapResultItem) {
  return props.comparisonIds.includes(item.id);
}

function unitLabel(count: number) {
  if (count === 1) return "1 del";
  if (count === 2) return "2 dela";
  if (count === 3 || count === 4) return `${count} deli`;
  return `${count} delov`;
}

const headingLocation = computed(() => {
  const locations = props.results
    .map((item) => item.location?.trim())
    .filter((value): value is string => Boolean(value));
  if (!locations.length) return "";
  const counts = new Map<string, number>();
  for (const location of locations) {
    counts.set(location, (counts.get(location) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
});

const visibleCount = computed(() => props.results.length || props.featureCount);
</script>

<template>
  <section
    class="relative flex h-full min-h-0 flex-col bg-[#f7f8f5] max-[720px]:min-h-full"
    aria-label="Stavbe na prikazanem območju"
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
            {{
              !buildingsVisible
                ? "Stavbe so skrite"
                : headingLocation
                  ? `Stavbe · ${headingLocation}`
                  : "Stavbe na zemljevidu"
            }}
          </h1>
          <p class="mt-1.5 mb-0 text-[11px] leading-[1.4] text-[#74817d]">
            <template v-if="loading">
              Posodabljamo stavbe na prikazanem območju …
            </template>
            <template v-else-if="!buildingsVisible">
              Vključite sloj Stavbe v prikazu zemljevida
            </template>
            <template v-else-if="results.length">
              {{ visibleCount }}
              {{ visibleCount === 1 ? "vidna stavba" : "vidnih stavb" }}
              <span aria-hidden="true"> · </span>razvrščeno po naslovu
            </template>
            <template v-else-if="featureCount">
              {{ featureCount }} stavb v skupinah
            </template>
            <template v-else>Ni vidnih stavb</template>
          </p>
        </div>
        <span
          class="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#edf5d6] text-accent"
          aria-hidden="true"
        >
          <span
            v-if="loading"
            class="size-5 animate-spin rounded-full border-2 border-[#cbdab9] border-t-accent motion-reduce:animate-none motion-reduce:border-accent motion-reduce:opacity-70"
          />
          <Building2 v-else class="size-5" :stroke-width="1.7" />
        </span>
      </div>
      <div
        v-if="loading"
        class="absolute right-0 bottom-0 left-0 h-0.5 overflow-hidden bg-[#e4ebdf] motion-reduce:bg-[#9eb69b]"
        aria-hidden="true"
      >
        <span
          class="sidebar-loading-bar block h-full w-[38%] bg-accent motion-reduce:hidden"
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
            ? 'border-[#7e9f94] shadow-[0_6px_20px_rgb(29_68_58_/_10%)]'
            : 'border-[#e0e6e2] hover:-translate-y-px hover:border-[#9ab2a9] hover:shadow-[0_6px_20px_rgb(29_68_58_/_8%)] motion-reduce:hover:translate-y-0'
        "
      >
        <button
          type="button"
          class="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-start gap-x-3 border-0 bg-transparent px-3.5 pt-3.5 pb-3 text-left text-ink"
          :aria-label="`Odpri stavbo ${item.address}`"
          @click="emit('select', item)"
        >
          <span
            class="row-span-2 grid size-10 place-items-center rounded-[10px] bg-[#f0f3ef] text-[#315f52] transition-colors group-hover:bg-[#eaf2d4]"
            aria-hidden="true"
          >
            <Building2 class="size-[19px]" :stroke-width="1.65" />
          </span>
          <span class="min-w-0">
            <strong
              class="block truncate text-[13px] font-[740] tracking-[-0.01em]"
            >
              {{ item.address }}
            </strong>
            <span class="mt-0.5 block truncate text-[10px] text-[#78847f]">
              {{
                [item.location, item.buildingUse].filter(Boolean).join(" · ") ||
                "Stavba"
              }}
            </span>
          </span>
          <ChevronRight
            class="mt-1 size-4 text-[#91a09a] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            :stroke-width="1.8"
            aria-hidden="true"
          />

          <span
            class="col-start-2 col-end-4 mt-3 flex items-baseline justify-between gap-3"
          >
            <span
              class="text-[9px] font-[650] tracking-[0.04em] text-[#7b8782] uppercase"
            >
              Ocenjena vrednost
            </span>
            <strong class="text-[17px] font-[760] tracking-[-0.035em] text-ink">
              {{
                item.officialValue !== undefined
                  ? formatEur(item.officialValue)
                  : "Ni podatka"
              }}
            </strong>
          </span>
        </button>

        <div
          class="grid grid-cols-3 border-y border-[#edf0ed] bg-[#fafbf9] text-[#66736e]"
        >
          <span
            class="flex min-w-0 items-center gap-1.5 border-r border-[#edf0ed] px-3 py-2.5 text-[10px]"
          >
            <Ruler
              class="size-3.5 shrink-0 text-[#81918b]"
              :stroke-width="1.7"
              aria-hidden="true"
            />
            <span class="truncate">{{
              item.areaM2 !== undefined ? formatArea(item.areaM2) : "Površina —"
            }}</span>
          </span>
          <span
            class="flex min-w-0 items-center gap-1.5 border-r border-[#edf0ed] px-3 py-2.5 text-[10px]"
          >
            <CalendarDays
              class="size-3.5 shrink-0 text-[#81918b]"
              :stroke-width="1.7"
              aria-hidden="true"
            />
            <span class="truncate">{{
              item.constructionYear ?? "Leto —"
            }}</span>
          </span>
          <span
            class="flex min-w-0 items-center gap-1.5 px-3 py-2.5 text-[10px]"
          >
            <DoorOpen
              class="size-3.5 shrink-0 text-[#81918b]"
              :stroke-width="1.7"
              aria-hidden="true"
            />
            <span class="truncate">{{
              item.unitCount !== undefined
                ? unitLabel(item.unitCount)
                : "Deli —"
            }}</span>
          </span>
        </div>

        <label
          class="flex min-h-[38px] cursor-pointer items-center gap-2 px-3.5 text-[10px] font-[650] text-[#36594f]"
          @click.stop
        >
          <input
            type="checkbox"
            :checked="isCompared(item)"
            :disabled="!isCompared(item) && comparisonIds.length >= 2"
            class="m-0 size-4 accent-[#2d6254]"
            @change="emit('compare', item)"
          />
          <span>Dodaj v primerjavo</span>
        </label>
      </article>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 place-items-center px-8 py-10 text-[#6e7a76] transition-opacity duration-150 ease-out motion-reduce:transition-none"
      :class="loading ? 'opacity-50' : 'opacity-100'"
    >
      <div class="grid place-items-center text-center">
        <span
          class="mb-3 grid size-12 place-items-center rounded-full bg-[#edf1ec]"
        >
          <ListFilter
            class="size-5 text-[#879a92]"
            :stroke-width="1.65"
            aria-hidden="true"
          />
        </span>
        <strong class="text-[13px] text-[#294d43]">
          {{
            buildingsVisible
              ? "Na tej povečavi ni posameznih stavb."
              : "Sloj stavb je izklopljen."
          }}
        </strong>
        <p class="mt-1.5 mb-0 max-w-[280px] text-[11px] leading-[1.55]">
          {{
            buildingsVisible
              ? "Približajte zemljevid, da se skupine razprejo. Seznam se samodejno uskladi z vidnimi stavbami."
              : "V možnosti Prikaz zemljevida znova vključite Stavbe, da se prikaže seznam."
          }}
        </p>
      </div>
    </div>

    <footer
      class="shrink-0 border-t border-[#e5e9e5] bg-white px-[18px] py-3 text-[9px] leading-[1.5] text-[#7b8682] max-[720px]:px-3.5"
    >
      <span class="block">
        <Info class="mr-1 inline size-3" aria-hidden="true" />
        Vir: GURS · seznam se posodobi ob premiku zemljevida
      </span>
    </footer>

    <div
      v-if="comparisonIds.length"
      class="absolute right-3.5 bottom-[54px] left-3.5 flex min-h-[54px] items-center justify-between gap-3 rounded-lg bg-ink py-2 pr-[9px] pl-4 text-white shadow-[0_12px_30px_rgb(25_61_53_/_22%)] max-[720px]:sticky max-[720px]:z-4 max-[720px]:bottom-2.5 max-[720px]:mt-auto"
      role="status"
    >
      <span class="text-[11px]">
        <strong>{{ comparisonIds.length }}</strong>
        {{ comparisonIds.length === 1 ? "izbrana stavba" : "izbrani stavbi" }}
      </span>
      <button
        type="button"
        class="min-h-9 rounded-md border-0 bg-[#eaf2d4] px-[13px] text-[11px] font-[720] text-ink"
        @click="emit('openComparison')"
      >
        Primerjaj
        <ArrowRight class="ml-1 inline size-4" aria-hidden="true" />
      </button>
    </div>
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
