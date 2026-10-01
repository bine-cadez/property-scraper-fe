import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import BaseSelect from "../../app/components/BaseSelect.vue";

const options = [
  { value: "all", label: "Vse nepremičnine" },
  { value: "house", label: "Hiše" },
  { value: "office", label: "Poslovni prostori" },
];

describe("BaseSelect", () => {
  it("opens a custom listbox and selects an option", async () => {
    const wrapper = await mountSuspended(BaseSelect, {
      props: {
        modelValue: "all",
        options,
        label: "Vrsta nepremičnine",
      },
    });

    const trigger = wrapper.get('[role="combobox"]');
    expect(wrapper.find("select").exists()).toBe(false);
    expect(trigger.attributes("aria-expanded")).toBe("false");

    await trigger.trigger("click");

    expect(trigger.attributes("aria-expanded")).toBe("true");
    expect(wrapper.get('[role="listbox"]').isVisible()).toBe(true);

    await wrapper.get('[role="option"]:nth-child(2)').trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["house"]);
    expect(wrapper.emitted("change")?.[0]).toEqual(["house"]);
    expect(trigger.attributes("aria-expanded")).toBe("false");
  });

  it("supports Arrow keys and Enter from the trigger", async () => {
    const wrapper = await mountSuspended(BaseSelect, {
      props: {
        modelValue: "all",
        options,
        label: "Vrsta nepremičnine",
      },
    });
    const trigger = wrapper.get('[role="combobox"]');

    await trigger.trigger("keydown", { key: "ArrowDown" });
    await trigger.trigger("keydown", { key: "ArrowDown" });
    await trigger.trigger("keydown", { key: "Enter" });

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["house"]);
  });
});
