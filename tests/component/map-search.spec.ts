import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import MapSearch from '../../app/components/MapSearch.vue'

describe('MapSearch keyboard interaction', () => {
  it('selects the highlighted result with ArrowDown and Enter', async () => {
    const wrapper = await mountSuspended(MapSearch)
    const setupState = (
      wrapper.vm.$ as unknown as { setupState: Record<string, unknown> }
    ).setupState
    setupState.results = [
      {
        id: 'p-1',
        type: 'parcel',
        primaryLabel: 'Parcela 1492/7',
        secondaryLabel: 'k. o. 1727 Ljubljana mesto',
        coordinates: [14.5, 46.05],
        selectionId: 'p-1',
      },
    ]
    setupState.open = true
    await nextTick()
    const input = wrapper.get('input')

    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({
      id: 'p-1',
      type: 'parcel',
    })
  })
})
