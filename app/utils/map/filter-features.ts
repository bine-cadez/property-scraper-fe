import type { ViewportResponse } from '#shared/types/geojson'
import type { MapFilters } from '#shared/types/property'

export interface FilteredViewport {
  parcels: ViewportResponse['parcels']
  buildings: ViewportResponse['buildings']
  points: ViewportResponse['points']
  count: number
}

export function filterViewportFeatures(
  data: ViewportResponse,
  filters: MapFilters,
): FilteredViewport {
  const typeMatches = (propertyType: unknown) =>
    !filters.propertyTypes.length ||
    (typeof propertyType === 'string' &&
      filters.propertyTypes.includes(
        propertyType as (typeof filters.propertyTypes)[number],
      ))

  const parcels = data.parcels.features.filter(
    (feature) =>
      filters.minParcelAreaM2 === undefined ||
      feature.properties.areaM2 >= filters.minParcelAreaM2,
  )
  const buildings = data.buildings.features.filter(
    (feature) =>
      typeMatches(feature.properties.propertyType) &&
      (filters.constructionYearFrom === undefined ||
        (feature.properties.constructionYear !== undefined &&
          feature.properties.constructionYear >= filters.constructionYearFrom)),
  )
  const points = data.points.features.filter((feature) => {
    const value = feature.properties
    return (
      typeMatches(value.propertyType) &&
      (filters.minPrice === undefined || value.amount >= filters.minPrice) &&
      (filters.maxPrice === undefined || value.amount <= filters.maxPrice) &&
      (filters.minPricePerM2 === undefined ||
        value.pricePerM2 >= filters.minPricePerM2) &&
      (filters.maxPricePerM2 === undefined ||
        value.pricePerM2 <= filters.maxPricePerM2) &&
      (filters.minAreaM2 === undefined || value.areaM2 >= filters.minAreaM2) &&
      (value.kind !== 'transaction' ||
        filters.transactionFrom === undefined ||
        value.date >= filters.transactionFrom)
    )
  })

  return {
    parcels: { ...data.parcels, features: parcels },
    buildings: { ...data.buildings, features: buildings },
    points: { ...data.points, features: points },
    count: parcels.length + buildings.length + points.length,
  }
}
