import { gursDetail, gursList } from '../utils/gurs-api'
import {
  buildingFeatureCollection,
  parcelFeatureCollection,
} from '../utils/gurs-parcels'

type Raw = Record<string, unknown>

function object(value: unknown): Raw {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Raw)
    : {}
}

function record(value: unknown): Raw {
  const raw = object(value)
  for (const key of ['data', 'item', 'record', 'result']) {
    const nested = object(raw[key])
    if (Object.keys(nested).length) return nested
  }
  return raw
}

function parcelIds(value: unknown): string[] {
  const building = record(value)
  const relation =
    building.parcelIds ??
    building.parcel_ids ??
    building.parcels ??
    building.parcelId ??
    building.parcel_id
  const values = Array.isArray(relation) ? relation : relation ? [relation] : []
  return values
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item)
      }
      const raw = object(item)
      return String(raw.eidParcela ?? raw.parcelId ?? raw.id ?? '')
    })
    .filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname

  const buildingMatch = pathname.match(/^\/gurs\/buildings\/([^/]+)$/)
  if (buildingMatch?.[1]) {
    const id = decodeURIComponent(buildingMatch[1])
    const payload = await gursDetail(event, 'buildings', id)
    const building = buildingFeatureCollection([payload]).features[0]
    let linkedParcelIds = building?.properties.parcelIds?.length
      ? building.properties.parcelIds
      : parcelIds(payload)
    if (!linkedParcelIds.length) {
      const linkedParcels = await gursList(event, 'parcels', {
        eidStavba: id,
        limit: 100,
      })
      linkedParcelIds = parcelFeatureCollection(linkedParcels).features.map(
        (parcel) => parcel.id,
      )
    }
    return {
      building,
      parcelIds: linkedParcelIds,
    }
  }

  const parcelMatch = pathname.match(/^\/gurs\/parcels\/([^/]+)$/)
  if (parcelMatch?.[1]) {
    const id = decodeURIComponent(parcelMatch[1])
    const payload = await gursDetail(event, 'parcels', id)
    const parcel = parcelFeatureCollection([payload]).features[0]
    if (!parcel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Parcela ni najdena.',
      })
    }
    return parcel
  }
})
