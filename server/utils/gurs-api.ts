import type { H3Event } from 'h3'

export type GursResource =
  | 'addresses'
  | 'buildings'
  | 'building-parts'
  | 'cadastral-municipalities'
  | 'code-lists'
  | 'parcels'
  | 'sources'
  | 'transactions'

export type GursTileLayer = 'properties' | 'sales' | 'parcels' | 'cadastral'

interface GursRequestOptions {
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

function connection(event: H3Event) {
  const config = useRuntimeConfig(event)
  const baseURL = String(config.gursApiBaseUrl || '').replace(/\/$/, '')
  const apiKey = String(config.gursApiKey || '')

  if (!baseURL) {
    throw createError({
      statusCode: 503,
      statusMessage: 'GURS API naslov ni nastavljen.',
    })
  }

  return {
    baseURL,
    headers: apiKey ? { 'x-api-key': apiKey } : {},
  }
}

function upstreamError(error: unknown): never {
  const statusCode =
    typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode) || 502
      : 502
  throw createError({
    statusCode: statusCode === 404 ? 404 : 502,
    statusMessage:
      statusCode === 404
        ? 'Zapis v GURS ni najden.'
        : 'Povezava s Property Scraper API ni uspela.',
    cause: error,
  })
}

export async function gursGet<T = unknown>(
  event: H3Event,
  path: string,
  options: GursRequestOptions = {},
): Promise<T> {
  const { baseURL, headers } = connection(event)
  try {
    return (await $fetch(path, {
      baseURL,
      headers,
      ...(options.query ? { query: options.query } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      retry: 1,
      timeout: 12_000,
    })) as T
  } catch (error) {
    upstreamError(error)
  }
}

export function gursList(
  event: H3Event,
  resource: GursResource,
  query?: GursRequestOptions['query'],
) {
  return gursGet(event, `/gurs/${resource}`, query ? { query } : {})
}

export function gursDetail(event: H3Event, resource: GursResource, id: string) {
  return gursGet(event, `/gurs/${resource}/${encodeURIComponent(id)}`)
}

export function gursValuationUnits(
  event: H3Event,
  resource: 'buildings' | 'building-parts' | 'parcels',
  id: string,
) {
  return gursGet(
    event,
    `/gurs/${resource}/${encodeURIComponent(id)}/valuation-units`,
  )
}

export async function gursTile(
  event: H3Event,
  layer: GursTileLayer,
  z: number,
  x: number,
  y: number,
): Promise<ArrayBuffer> {
  const { baseURL, headers } = connection(event)
  try {
    return (await $fetch(`/map/tiles/${layer}/${z}/${x}/${y}.mvt`, {
      baseURL,
      headers,
      responseType: 'arrayBuffer',
      retry: 1,
      timeout: 12_000,
    })) as ArrayBuffer
  } catch (error) {
    upstreamError(error)
  }
}

export const gursOperations = {
  health: (event: H3Event) => gursGet(event, '/health'),
  ready: (event: H3Event) => gursGet(event, '/ready'),
  ingest: (event: H3Event, sampleSize: number, transactionYear?: number) => {
    const { baseURL, headers } = connection(event)
    return $fetch('/ingest/gurs', {
      method: 'POST',
      baseURL,
      headers,
      body: { sampleSize, ...(transactionYear ? { transactionYear } : {}) },
    })
  },
  statistics: (event: H3Event, resource?: string) =>
    gursGet(event, `/gurs/statistics${resource ? `/${resource}` : ''}`),
  search: (event: H3Event, q: string, limit = 8) =>
    gursGet(event, '/gurs/search', { query: { q, limit } }),
}
