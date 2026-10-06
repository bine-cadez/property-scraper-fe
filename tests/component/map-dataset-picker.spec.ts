import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import MapDatasetPicker from "../../app/components/MapDatasetPicker.vue";

describe("MapDatasetPicker", () => {
  it("replaces the active dataset when another option is selected", async () => {
    const wrapper = await mountSuspended(MapDatasetPicker, {
      props: { layers: ["buildings"] },
    });

    expect(wrapper.text()).toContain("Prikaz zemljevida");
    expect(wrapper.text()).toContain("Stavbe");

    await wrapper.get('[aria-haspopup="menu"]').trigger("click");
    const options = wrapper.findAll('[role="menuitemradio"]');
    expect(options).toHaveLength(3);
    expect(options[0]?.attributes("aria-checked")).toBe("true");

    await options[1]?.trigger("click");
    expect(wrapper.emitted("change")?.[0]).toEqual([["parcels"]]);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it("keeps the current dataset selected when it is chosen again", async () => {
    const wrapper = await mountSuspended(MapDatasetPicker, {
      props: { layers: ["buildings"] },
    });

    await wrapper.get('[aria-haspopup="menu"]').trigger("click");
    await wrapper.get('[role="menuitemradio"]').trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it("normalizes an existing multi-layer value on the next selection", async () => {
    const wrapper = await mountSuspended(MapDatasetPicker, {
      props: { layers: ["buildings", "transactions"] },
    });

    await wrapper.get('[aria-haspopup="menu"]').trigger("click");
    const options = wrapper.findAll('[role="menuitemradio"]');
    expect(
      options.filter((option) => option.attributes("aria-checked") === "true"),
    ).toHaveLength(1);

    await options[2]?.trigger("click");
    expect(wrapper.emitted("change")?.[0]).toEqual([["transactions"]]);
  });
});
