import { describe, expect, it } from 'vitest'
import { useMapSelection } from '../../app/composables/useMapSelection'

describe('selected feature state', () => {
  it('selects, replaces and clears a feature deterministically', () => {
    const selection = useMapSelection('parcela-a')
    expect(selection.hasSelection.value).toBe(true)

    selection.select('stavba-b')
    expect(selection.selectedId.value).toBe('stavba-b')

    selection.clear()
    expect(selection.selectedId.value).toBeUndefined()
    expect(selection.hasSelection.value).toBe(false)
  })
})
