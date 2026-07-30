const eurFormatter = new Intl.NumberFormat('sl-SI', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  useGrouping: 'always',
})

const numberFormatter = new Intl.NumberFormat('sl-SI', {
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('sl-SI', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatEur(value: number): string {
  return eurFormatter.format(value)
}

export function formatPricePerM2(value: number): string {
  return `${eurFormatter.format(value)}/m²`
}

export function formatArea(value: number): string {
  return `${numberFormatter.format(value)} m²`
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}
