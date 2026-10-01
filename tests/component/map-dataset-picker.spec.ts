import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import MapDatasetPicker from "../../app/components/MapDatasetPicker.vue";

describe("MapDatasetPicker", () => {
  it("keeps buildings as the primary layer and adds contextual layers", async () => {
    const wrapper = await mountSuspended(MapDatasetPicker, {
      props: { layers: ["buildings"] },
    });

    expect(wrapper.text()).toContain("Prikaz zemljevida");
    expect(wrapper.text()).toContain("Stavbe");

    await wrapper.get('[aria-haspopup="menu"]').trigger("click");
    const options = wrapper.findAll('[role="menuitemcheckbox"]');
    expect(options).toHaveLength(3);
    expect(options[0]?.attributes("aria-checked")).toBe("true");

    await options[1]?.trigger("click");
    expect(wrapper.emitted("change")?.[0]).toEqual([["buildings", "parcels"]]);
  });

  it("does not allow every primary layer to be switched off", async () => {
    const wrapper = await mountSuspended(MapDatasetPicker, {
      props: { layers: ["buildings"] },
    });

    await wrapper.get('[aria-haspopup="menu"]').trigger("click");
    await wrapper.get('[role="menuitemcheckbox"]').trigger("click");

    expect(wrapper.emitted("change")).toBeUndefined();
  });
});
