//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import type { ValueType } from '../types/property'

export const VALUE_LABELS: Record<ValueType, string> = {
  official_assessed: 'Uradna posplošena vrednost',
  market_estimate: 'Izračunana tržna ocena',
  transaction: 'Dosežena prodajna cena',
  asking: 'Oglaševana cena',
  user_entered: 'Vrednost, ki jo je vnesel uporabnik',
}

export const VALUE_SHORT_LABELS: Record<ValueType, string> = {
  official_assessed: 'Uradna vrednost',
  market_estimate: 'Tržna ocena',
  transaction: 'Prodajna cena',
  asking: 'Oglaševana cena',
  user_entered: 'Vnesena vrednost',
}

export function getValueLabel(type: ValueType, short = false): string {
  return (short ? VALUE_SHORT_LABELS : VALUE_LABELS)[type]
}
