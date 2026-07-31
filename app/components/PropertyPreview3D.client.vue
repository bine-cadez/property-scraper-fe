<script setup lang="ts">
import type { Map as MapLibreMap } from "maplibre-gl";
import type { PropertyRecord } from "#shared/types/property";

const props = defineProps<{
  property: PropertyRecord;
}>();

const config = useRuntimeConfig();
const mapContainer = ref<HTMLDivElement>();
const ready = ref(false);
const loadFailed = ref(false);
const isAnimating = ref(false);
let map: MapLibreMap | undefined;
let reducedMotionQuery: MediaQueryList | undefined;
let reducedMotion = false;
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let loadTimer: ReturnType<typeof setTimeout> | undefined;
let finishOrbit: (() => void) | undefined;
let resizeObserver: ResizeObserver | undefined;
let initializing = false;

function updateReducedMotion(event: MediaQueryListEvent) {
  reducedMotion = event.matches;
}

function addSelectedBuilding() {
  if (!map || !props.property.building) return;
  const building = props.property.building;
  const height = Math.max(9, building.floors * 3.2);

  map.addSource("selected-building", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: building.geometry,
      properties: { id: building.id },
    },
  });
  map.addLayer({
    id: "selected-building-3d",
    type: "fill-extrusion",
    source: "selected-building",
    paint: {
      "fill-extrusion-base": 0,
      "fill-extrusion-color": "#5b52e8",
      "fill-extrusion-height": height,
      "fill-extrusion-opacity": 0.88,
      "fill-extrusion-vertical-gradient": true,
    },
  });
}

function finishAnimation() {
  isAnimating.value = false;
  finishOrbit = undefined;
}

function orbitBuilding() {
  if (!map || !ready.value) return;

  clearTimeout(feedbackTimer);
  if (finishOrbit) {
    map.off("moveend", finishOrbit);
    finishOrbit = undefined;
  }
  map.stop();
  isAnimating.value = true;

  if (reducedMotion) {
    map.jumpTo({ bearing: map.getBearing() + 28 });
    feedbackTimer = setTimeout(finishAnimation, 240);
    return;
  }

  finishOrbit = finishAnimation;
  map.once("moveend", finishOrbit);
  map.easeTo({
    bearing: map.getBearing() + 68,
    pitch: 58,
    duration: 1100,
    easing: (progress) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2,
  });
}

async function initializeMap() {
  const container = mapContainer.value;
  if (map || initializing || !container) return;
  const bounds = container.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  initializing = true;
  loadTimer = setTimeout(() => {
    if (!ready.value) loadFailed.value = true;
  }, 12000);

  try {
    const maplibregl = await import("maplibre-gl");
    map = new maplibregl.Map({
      container,
      style:
        config.public.map3dStyleUrl ||
        "https://tiles.openfreemap.org/styles/liberty",
      center: props.property.coordinates,
      zoom: 17.15,
      pitch: 58,
      bearing: -28,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );
    const attribution = container.querySelector<HTMLDetailsElement>(
      ".maplibregl-ctrl-attrib",
    );
    if (attribution) attribution.open = false;
    map.on("load", () => {
      addSelectedBuilding();
      ready.value = true;
      loadFailed.value = false;
      clearTimeout(loadTimer);
      map?.resize();
      requestAnimationFrame(() => {
        const compactAttribution = container.querySelector<HTMLDetailsElement>(
          ".maplibregl-ctrl-attrib",
        );
        if (compactAttribution) compactAttribution.open = false;
      });
    });
  } catch {
    clearTimeout(loadTimer);
    loadFailed.value = true;
  } finally {
    initializing = false;
  }
}

onMounted(async () => {
  await nextTick();
  if (!mapContainer.value) return;

  reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener("change", updateReducedMotion);
  resizeObserver = new ResizeObserver((entries) => {
    const visible = entries.some(
      (entry) => entry.contentRect.width && entry.contentRect.height,
    );
    if (!visible) return;
    if (map) map.resize();
    else void initializeMap();
  });
  resizeObserver.observe(mapContainer.value);
  await initializeMap();
});

onBeforeUnmount(() => {
  clearTimeout(feedbackTimer);
  clearTimeout(loadTimer);
  if (finishOrbit) map?.off("moveend", finishOrbit);
  resizeObserver?.disconnect();
  reducedMotionQuery?.removeEventListener("change", updateReducedMotion);
  map?.remove();
  map = undefined;
});
</script>

<template>
  <section class="grid gap-2.5" aria-labelledby="preview-3d-title">
    <div class="flex items-end justify-between gap-4">
      <div>
        <span
          class="text-[9px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
          >Prostorski pogled</span
        >
        <h3 id="preview-3d-title" class="mt-0.5 text-sm font-bold">
          3D pogled stavbe
        </h3>
      </div>
      <p
        id="preview-3d-help"
        class="max-w-[150px] text-right text-[10px] leading-[1.35] text-ink-muted"
      >
        Kliknite zemljevid za kratek obhod.
      </p>
    </div>

    <div
      class="preview-frame relative isolate h-[168px] overflow-hidden rounded-md border border-line bg-[#e7ece9]"
    >
      <div
        ref="mapContainer"
        class="absolute inset-0 opacity-0 transition-opacity duration-220 motion-reduce:duration-160"
        :class="{ 'opacity-100': ready }"
        aria-hidden="true"
      />
      <div
        v-if="!ready && !loadFailed"
        class="absolute inset-0 z-2 grid place-items-center bg-[#eef2f0] text-[11px] text-ink-muted"
        role="status"
      >
        Pripravljamo 3D pogled …
      </div>
      <div
        v-else-if="loadFailed"
        class="absolute inset-0 z-2 grid place-items-center bg-[#eef2f0] text-[11px] text-ink-muted"
      >
        3D pogled trenutno ni na voljo.
      </div>
      <button
        v-else
        type="button"
        class="group absolute inset-0 z-1 flex cursor-pointer items-end bg-[linear-gradient(to_top,rgb(19_30_28_/_36%),transparent_56%)] p-3 text-accent-strong focus-visible:-outline-offset-4 focus-visible:outline-accent"
        aria-describedby="preview-3d-help"
        :aria-label="
          isAnimating
            ? '3D pogled se vrti okoli stavbe'
            : 'Zavrti 3D pogled okoli stavbe'
        "
        @click="orbitBuilding"
      >
        <span
          class="inline-flex min-h-[34px] items-center gap-[7px] rounded-full border border-white/72 bg-white/92 px-[11px] text-[10px] font-extrabold shadow-[0_4px_14px_rgb(20_30_28_/_16%)] transition-transform duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-active:scale-[0.97] motion-reduce:transition-none motion-reduce:group-active:scale-100"
        >
          <svg class="size-4" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M15.4 7.2A6 6 0 1 0 16 11"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.7"
            />
            <path
              d="m13.1 4.8 2.8 2.5-3.5 1"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
            />
          </svg>
          {{ isAnimating ? "Obhod v teku" : "Zavrti pogled" }}
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.preview-frame :deep(.maplibregl-ctrl-bottom-right) {
  z-index: 3;
}

.preview-frame :deep(.maplibregl-ctrl-attrib) {
  font-size: 8px;
}
</style>
