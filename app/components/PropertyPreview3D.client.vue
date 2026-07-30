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
        const compactAttribution =
          container.querySelector<HTMLDetailsElement>(
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
  <section class="preview-section" aria-labelledby="preview-3d-title">
    <div class="preview-heading">
      <div>
        <span>Prostorski pogled</span>
        <h3 id="preview-3d-title">3D pogled stavbe</h3>
      </div>
      <p id="preview-3d-help">Kliknite zemljevid za kratek obhod.</p>
    </div>

    <div
      class="preview-frame"
      :class="{ 'is-ready': ready, 'is-animating': isAnimating }"
    >
      <div ref="mapContainer" class="preview-map" aria-hidden="true" />
      <div v-if="!ready && !loadFailed" class="preview-state" role="status">
        Pripravljamo 3D pogled …
      </div>
      <div v-else-if="loadFailed" class="preview-state">
        3D pogled trenutno ni na voljo.
      </div>
      <button
        v-else
        type="button"
        class="preview-button focus-ring"
        aria-describedby="preview-3d-help"
        :aria-label="
          isAnimating
            ? '3D pogled se vrti okoli stavbe'
            : 'Zavrti 3D pogled okoli stavbe'
        "
        @click="orbitBuilding"
      >
        <span class="preview-cta">
          <svg viewBox="0 0 20 20" aria-hidden="true">
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
.preview-section {
  display: grid;
  gap: 10px;
}

.preview-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.preview-heading span {
  color: var(--color-accent-strong);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

.preview-heading h3 {
  margin: 3px 0 0;
  font-size: 14px;
}

.preview-heading p {
  max-width: 150px;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 10px;
  line-height: 1.35;
  text-align: right;
}

.preview-frame {
  position: relative;
  height: 168px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 12px;
  background: #e7ece9;
  isolation: isolate;
}

.preview-map {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 220ms ease;
}

.preview-frame.is-ready .preview-map {
  opacity: 1;
}

.preview-state {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-ink-muted);
  background: #eef2f0;
  font-size: 11px;
}

.preview-button {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: end;
  padding: 12px;
  border: 0;
  color: var(--color-accent-strong);
  background: linear-gradient(to top, rgb(19 30 28 / 36%), transparent 56%);
  cursor: pointer;
}

.preview-button:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: -4px;
}

.preview-cta {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  border: 1px solid rgb(255 255 255 / 72%);
  border-radius: 999px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 4px 14px rgb(20 30 28 / 16%);
  font-size: 10px;
  font-weight: 800;
  transition: transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.preview-cta svg {
  width: 16px;
  height: 16px;
}

.preview-button:active .preview-cta {
  transform: scale(0.97);
}

.preview-frame :deep(.maplibregl-ctrl-bottom-right) {
  z-index: 3;
}

.preview-frame :deep(.maplibregl-ctrl-attrib) {
  font-size: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .preview-map {
    transition: opacity 160ms ease;
  }

  .preview-cta {
    transition: none;
  }

  .preview-button:active .preview-cta {
    transform: none;
  }
}
</style>
