<script setup lang="ts">
import { ChevronDown, Layers3 } from "@lucide/vue";
import type { MapLayerId } from "#shared/types/property";

const props = defineProps<{
  layers: MapLayerId[];
}>();

const emit = defineEmits<{
  change: [layers: MapLayerId[]];
}>();

const root = ref<HTMLElement>();
const open = ref(false);

const options: {
  id: Extract<MapLayerId, "buildings" | "parcels" | "transactions">;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    id: "buildings",
    label: "Stavbe",
    description: "Glavni prikaz in seznam stavb",
    swatch: "#5758d9",
  },
  {
    id: "parcels",
    label: "Parcele",
    description: "Katastrske meje in oznake parcel",
    swatch: "#dc8e34",
  },
  {
    id: "transactions",
    label: "Prodaje",
    description: "Evidentirane nepremičninske prodaje",
    swatch: "#315f52",
  },
];

const selectedOption = computed(
  () =>
    options.find((option) => props.layers.includes(option.id)) ?? options[0],
);

const summary = computed(() => selectedOption.value?.label ?? "Izberite sloj");

function select(id: (typeof options)[number]["id"]) {
  open.value = false;
  if (selectedOption.value?.id === id && props.layers.length === 1) return;
  emit("change", [id]);
}

function handlePointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handlePointerDown);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div ref="root" class="relative min-w-[174px] max-[720px]:hidden">
    <button
      type="button"
      class="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-[8px] border border-[#829b7f] bg-[#f6faeb] px-3.5 text-left text-[#294d43]"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2.5">
        <Layers3
          class="size-[18px] shrink-0"
          :stroke-width="1.7"
          aria-hidden="true"
        />
        <span class="min-w-0">
          <small
            class="mb-0.5 block text-[8px] leading-none font-[650] tracking-[0.06em] text-[#71807b] uppercase"
            >Prikaz zemljevida</small
          >
          <strong class="block truncate text-[11px] font-[700]">{{
            summary
          }}</strong>
        </span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="open"
      role="menu"
      aria-label="Prikaz zemljevida"
      class="absolute top-[calc(100%+7px)] left-0 z-90 w-[286px] rounded-[10px] border border-[#dce3df] bg-white p-1.5 shadow-[0_16px_42px_rgb(25_61_53_/_18%)]"
    >
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        role="menuitemradio"
        :aria-checked="selectedOption?.id === option.id"
        class="grid min-h-[54px] w-full grid-cols-[12px_minmax(0,1fr)_18px] items-center gap-3 rounded-[7px] border-0 bg-transparent px-3 text-left text-[#294d43] hover:bg-[#f2f6ef]"
        @click="select(option.id)"
      >
        <span
          class="size-2.5 rounded-[3px]"
          :style="{ backgroundColor: option.swatch }"
          aria-hidden="true"
        />
        <span class="min-w-0">
          <strong class="block text-[11px] font-[700]">{{
            option.label
          }}</strong>
          <small class="mt-0.5 block text-[9px] leading-[1.35] text-[#78847f]">
            {{ option.description }}
          </small>
        </span>
        <span
          class="grid size-[18px] place-items-center rounded-full border"
          :class="
            selectedOption?.id === option.id
              ? 'border-accent bg-accent text-white'
              : 'border-[#cfd8d3] bg-white'
          "
          aria-hidden="true"
        >
          <span
            v-if="selectedOption?.id === option.id"
            class="size-1.5 rounded-full bg-white"
          />
        </span>
      </button>
      <p
        class="m-1.5 mt-2 border-t border-[#edf0ed] px-1.5 pt-2.5 text-[9px] leading-[1.4] text-[#7b8782]"
      >
        Izberite en glavni prikaz zemljevida. Hkrati je lahko aktiven samo en.
      </p>
    </div>
  </div>
</template>
