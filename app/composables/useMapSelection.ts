//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { computed, ref } from 'vue'

export function useMapSelection(initialId?: string) {
  const selectedId = ref<string | undefined>(initialId)
  const hasSelection = computed(() => Boolean(selectedId.value))

  function select(id: string) {
    selectedId.value = id
  }

  function clear() {
    selectedId.value = undefined
  }

  return {
    selectedId,
    hasSelection,
    select,
    clear,
  }
}
