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

interface UpstreamErrorDetails {
  statusCode: number
  message: string
  url?: string
  response?: unknown
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

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined
}

function upstreamErrorDetails(error: unknown): UpstreamErrorDetails {
  const value = record(error)
  const response = record(value?.response)
  const statusCode = Number(
    value?.statusCode ?? value?.status ?? response?.status ?? 502,
  )
  const responseBody =
    value?.responseData ?? value?.data ?? response?._data ?? undefined
  const url =
    typeof value?.url === 'string'
      ? value.url
      : typeof response?.url === 'string'
        ? response.url
        : undefined

  return {
    statusCode: Number.isFinite(statusCode) ? statusCode : 502,
    message: error instanceof Error ? error.message : String(error),
    ...(url ? { url } : {}),
    ...(responseBody !== undefined ? { response: responseBody } : {}),
  }
}

function upstreamError(error: unknown): never {
  const details = upstreamErrorDetails(error)
  const statusCode =
    details.statusCode === 404 ? 404 : 502

  if (import.meta.dev) {
    console.error('[gurs-api] Upstream request failed', details)
  }

  throw createError({
    statusCode,
    statusMessage:
      details.statusCode === 404
        ? 'Zapis v GURS ni najden.'
        : 'Povezava s Property Scraper API ni uspela.',
    ...(import.meta.dev ? { data: { upstream: details } } : {}),
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
): Promise<Response> {
  const { baseURL, headers } = connection(event)
  const url = new URL(`/map/tiles/${layer}/${z}/${x}/${y}.mvt`, baseURL)

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(12_000),
      })
      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? ''
        let responseData: unknown
        try {
          responseData = contentType.includes('application/json')
            ? await response.json()
            : (await response.text()).slice(0, 4000)
        } catch {
          responseData = undefined
        }
        throw Object.assign(
          new Error(`Tile API returned ${response.status}`),
          {
            statusCode: response.status,
            url: url.toString(),
            responseData,
          },
        )
      }
      return response
    } catch (error) {
      lastError = error
    }
  }
  upstreamError(lastError)
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
