<script setup lang="ts">
import { Check, ChevronDown } from "@lucide/vue";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SelectOption[];
    label: string;
    eyebrow?: string;
    active?: boolean;
    triggerClass?: string;
  }>(),
  {
    eyebrow: "",
    active: false,
    triggerClass: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const open = ref(false);
const activeIndex = ref(0);
const listboxId = `select-${useId()}`;

const selectedIndex = computed(() => {
  const index = props.options.findIndex(
    (option) => option.value === props.modelValue,
  );
  return index >= 0 ? index : 0;
});
const selectedOption = computed(
  () => props.options[selectedIndex.value] ?? props.options[0],
);

function firstEnabledIndex() {
  return Math.max(
    0,
    props.options.findIndex((option) => !option.disabled),
  );
}

function lastEnabledIndex() {
  for (let index = props.options.length - 1; index >= 0; index -= 1) {
    if (!props.options[index]?.disabled) return index;
  }
  return 0;
}

function moveActive(direction: 1 | -1) {
  if (!props.options.length) return;
  let next = activeIndex.value;
  do {
    next = (next + direction + props.options.length) % props.options.length;
  } while (props.options[next]?.disabled && next !== activeIndex.value);
  activeIndex.value = next;
}

function openMenu() {
  activeIndex.value = selectedIndex.value;
  open.value = true;
}

function closeMenu({ restoreFocus = false } = {}) {
  open.value = false;
  if (restoreFocus) nextTick(() => trigger.value?.focus());
}

function selectOption(option: SelectOption) {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
  closeMenu({ restoreFocus: true });
}

function handleKeydown(event: KeyboardEvent) {
  if (
    ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (!open.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) openMenu();
    return;
  }

  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") activeIndex.value = firstEnabledIndex();
  else if (event.key === "End") activeIndex.value = lastEnabledIndex();
  else if (event.key === "Enter" || event.key === " ") {
    const option = props.options[activeIndex.value];
    if (option) selectOption(option);
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeMenu({ restoreFocus: true });
  } else if (event.key === "Tab") {
    closeMenu();
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) closeMenu();
}

onMounted(() => document.addEventListener("pointerdown", handlePointerDown));
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", handlePointerDown),
);
</script>

<template>
  <div ref="root" class="relative min-w-0">
    <button
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-label="label"
      :aria-expanded="open"
      :aria-controls="listboxId"
      :aria-activedescendant="open ? `${listboxId}-${activeIndex}` : undefined"
      class="flex min-h-[42px] w-full items-center justify-between gap-3 rounded-[7px] border bg-white py-0 pr-3 pl-[13px] text-left text-[11px] font-[630] text-[#294d43] transition-colors"
      :class="[
        active ? 'border-[#829b7f] bg-accent-soft' : 'border-[#dfe5e1]',
        triggerClass,
      ]"
      @click="open ? closeMenu() : openMenu()"
      @keydown="handleKeydown"
    >
      <span class="min-w-0">
        <small
          v-if="eyebrow"
          class="mb-0.5 block truncate text-[8px] leading-none font-[650] tracking-[0.06em] text-[#7b8782] uppercase"
          >{{ eyebrow }}</small
        >
        <span class="block truncate">{{ selectedOption?.label }}</span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
      />
    </button>

    <ul
      v-if="open"
      :id="listboxId"
      role="listbox"
      :aria-label="label"
      class="absolute top-[calc(100%+6px)] left-0 z-90 m-0 max-h-64 min-w-full list-none overflow-y-auto rounded-[9px] border border-[#dfe5e1] bg-white p-1.5 shadow-[0_14px_38px_rgb(25_61_53_/_16%)]"
    >
      <li
        v-for="(option, index) in options"
        :id="`${listboxId}-${index}`"
        :key="option.value"
        role="option"
        :aria-selected="option.value === modelValue"
        :aria-disabled="option.disabled || undefined"
        class="flex min-h-9 cursor-pointer items-center justify-between gap-4 whitespace-nowrap rounded-md px-2.5 py-2 text-[11px] text-[#294d43] outline-none"
        :class="[
          activeIndex === index ? 'bg-[#f1f5ef]' : '',
          option.disabled ? 'cursor-not-allowed opacity-45' : '',
        ]"
        @mouseenter="activeIndex = index"
        @mousedown.prevent
        @click="selectOption(option)"
      >
        <span>{{ option.label }}</span>
        <Check
          v-if="option.value === modelValue"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
      </li>
    </ul>
  </div>
</template>
