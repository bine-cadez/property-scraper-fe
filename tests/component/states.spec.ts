//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import EmptySelection from '../../app/components/EmptySelection.vue'
import MapErrorState from '../../app/components/MapErrorState.vue'
import MapLoadingState from '../../app/components/MapLoadingState.vue'

describe('map states', () => {
  it('renders a descriptive loading state', async () => {
    const wrapper = await mountSuspended(MapLoadingState)
    expect(wrapper.text()).toContain('Nalagamo prostorske podatke')
  })

  it('renders and retries the error state', async () => {
    const wrapper = await mountSuspended(MapErrorState)
    expect(wrapper.text()).toContain('Zemljevida ni bilo mogoče naložiti')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders a textual empty-selection alternative', async () => {
    const wrapper = await mountSuspended(EmptySelection)
    expect(wrapper.text()).toContain('Izberite prostor na zemljevidu')
  })
})
