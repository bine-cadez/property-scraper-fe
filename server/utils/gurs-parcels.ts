type Raw = Record<string, unknown>

export interface ParcelGeometry {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: unknown[]
}

interface ParcelFeature {
  type: 'Feature'
  id: string
  geometry: ParcelGeometry
  properties: Raw & {
    id: string
    kind: 'parcel'
    label: string
    areaM2: number
    buildingIds: string[]
  }
}

interface BuildingFeature {
  type: 'Feature'
  id: string
  geometry: ParcelGeometry
  properties: Raw & {
    id: string
    kind: 'building'
    label: string
    markerLabel: string
    parcelIds: string[]
    displayValue: number
    displayValueLabel: string
    displayAreaM2: number
    displayRegion: string
  }
}

export interface ParcelFeatureCollection {
  type: 'FeatureCollection'
  features: ParcelFeature[]
}

export interface BuildingFeatureCollection {
  type: 'FeatureCollection'
  features: BuildingFeature[]
}

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

function items(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload.map(record)
  const raw = object(payload)
  for (const key of ['items', 'data', 'records', 'results']) {
    if (Array.isArray(raw[key])) return raw[key].map(record)
  }
  return []
}

function geometry(value: unknown): ParcelGeometry | undefined {
  const raw = object(value)
  if (
    (raw.type === 'Polygon' || raw.type === 'MultiPolygon') &&
    Array.isArray(raw.coordinates)
  ) {
    return raw as unknown as ParcelGeometry
  }
}

function relatedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item)
      }
      const raw = object(item)
      return String(raw.eidStavba ?? raw.buildingId ?? raw.id ?? '')
    })
    .filter(Boolean)
}

function relatedParcelIds(value: unknown): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : []
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

function numericValue(value: unknown): number | undefined {
  const candidate = object(value).amount ?? value
  const parsed =
    typeof candidate === 'string'
      ? Number(candidate.replace(/\s/g, '').replace(',', '.'))
      : Number(candidate)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function firstNumber(raw: Raw, keys: string[]): number {
  for (const key of keys) {
    const value = numericValue(raw[key])
    if (value !== undefined) return value
  }
  return 0
}

function firstText(raw: Raw, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function compactEuro(value: number): string {
  if (!value) return ''
  const divisor = value >= 1_000_000 ? 1_000_000 : value >= 1_000 ? 1_000 : 1
  const suffix =
    divisor === 1_000_000 ? ' mio €' : divisor === 1_000 ? ' tis. €' : ' €'
  return `${new Intl.NumberFormat('sl-SI', {
    maximumFractionDigits: divisor === 1 ? 0 : 1,
  }).format(value / divisor)}${suffix}`
}

export function parcelFeatureCollection(
  payload: unknown,
): ParcelFeatureCollection {
  const features = items(payload).flatMap((parcel): ParcelFeature[] => {
    const parcelGeometry = geometry(parcel.geometry)
    const parcelId = String(
      parcel.eidParcela ?? parcel.id ?? parcel.recordId ?? '',
    )
    if (!parcelGeometry || !parcelId) return []

    const parcelNumber = String(parcel.parcelNumber ?? parcelId)
    const area = Number(parcel.area ?? parcel.areaM2 ?? 0)
    const buildingIds = relatedIds(
      parcel.buildingIds ?? parcel.building_ids ?? parcel.buildings,
    )
    const { geometry: _geometry, ...properties } = parcel
    return [
      {
        type: 'Feature',
        id: parcelId,
        geometry: parcelGeometry,
        properties: {
          ...properties,
          id: parcelId,
          kind: 'parcel',
          label: `Parcela ${parcelNumber}`,
          areaM2: Number.isFinite(area) ? area : 0,
          buildingIds,
        },
      },
    ]
  })

  return { type: 'FeatureCollection', features }
}

export function buildingFeatureCollection(
  payload: unknown,
): BuildingFeatureCollection {
  const features = items(payload).flatMap((building): BuildingFeature[] => {
    const buildingGeometry = geometry(
      building.footprintGeometry ??
        building.footprint_geometry ??
        building.geometry ??
        building.geom,
    )
    const buildingId = String(
      building.eidStavba ??
        building.buildingId ??
        building.id ??
        building.recordId ??
        '',
    )
    if (!buildingGeometry || !buildingId) return []

    const parcelIds = relatedParcelIds(
      building.parcelIds ??
        building.parcel_ids ??
        building.parcels ??
        building.parcelId ??
        building.parcel_id,
    )
    const address = String(
      building.address ?? building.fullAddress ?? building.addressLabel ?? '',
    )
    const markerLabel = String(
      building.buildingNumber ??
        building.building_number ??
        building.number ??
        '',
    )
    const displayValue = firstNumber(building, [
      'officialValue',
      'official_value',
      'estimatedMarketValue',
      'estimated_market_value',
      'marketValue',
      'market_value',
      'valuation',
      'value',
      'price',
    ])
    const displayAreaM2 = firstNumber(building, [
      'usableAreaM2',
      'usable_area_m2',
      'grossFloorArea',
      'gross_floor_area',
      'grossAreaM2',
      'areaM2',
      'area',
      'footprintAreaM2',
      'footprintArea',
      'footprint_area',
    ])
    const displayRegion = firstText(building, [
      'settlement',
      'municipality',
      'municipalityName',
      'municipality_name',
      'region',
    ])
    const {
      geometry: _geometry,
      geom: _geom,
      footprintGeometry: _footprintGeometry,
      footprint_geometry: _footprint_geometry,
      ...properties
    } = building
    return [
      {
        type: 'Feature',
        id: buildingId,
        geometry: buildingGeometry,
        properties: {
          ...properties,
          id: buildingId,
          kind: 'building',
          label: address || `Stavba ${buildingId}`,
          markerLabel: markerLabel || '⌂',
          parcelIds,
          displayValue,
          displayValueLabel: compactEuro(displayValue),
          displayAreaM2,
          displayRegion,
        },
      },
    ]
  })

  return { type: 'FeatureCollection', features }
}
