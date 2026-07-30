import { describe, expect, it } from 'vitest'
import {
  formatArea,
  formatEur,
  formatPricePerM2,
} from '../../shared/utils/format'

describe('Slovenian property formatting', () => {
  it('formats EUR with Slovenian thousands separators', () => {
    expect(formatEur(348000)).toMatch(/348\.000\s*€/)
  })

  it('formats price per square metre without changing category meaning', () => {
    expect(formatPricePerM2(4971)).toMatch(/4\.971\s*€\/m²/)
  })

  it('formats decimal areas with a Slovenian comma', () => {
    expect(formatArea(70.5)).toBe('70,5 m²')
  })
})
