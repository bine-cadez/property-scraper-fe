import type { H3Event } from 'h3'
import { $fetch as ofetch } from 'ofetch'
import {
  gursEndpoints,
  type GursResource,
  type GursStatisticsResource,
  type GursTileLayer,
  type GursValuationResource,
} from './gurs-endpoints'

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
    return (await ofetch(path, {
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
  return gursGet(
    event,
    gursEndpoints.resources.list(resource),
    query ? { query } : {},
  )
}

export function gursDetail(event: H3Event, resource: GursResource, id: string) {
  return gursGet(event, gursEndpoints.resources.detail(resource, id))
}

export function gursValuationUnits(
  event: H3Event,
  resource: GursValuationResource,
  id: string,
) {
  return gursGet(event, gursEndpoints.valuationUnits(resource, id))
}

export async function gursTile(
  event: H3Event,
  layer: GursTileLayer,
  z: number,
  x: number,
  y: number,
): Promise<Response> {
  const { baseURL, headers } = connection(event)
  const url = new URL(gursEndpoints.tile(layer, z, x, y), baseURL)

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
  health: (event: H3Event) => gursGet(event, gursEndpoints.health),
  ready: (event: H3Event) => gursGet(event, gursEndpoints.ready),
  ingest: (event: H3Event, sampleSize: number, transactionYear?: number) => {
    const { baseURL, headers } = connection(event)
    return ofetch(gursEndpoints.ingest, {
      method: 'POST',
      baseURL,
      headers,
      body: { sampleSize, ...(transactionYear ? { transactionYear } : {}) },
      timeout: 12_000,
    })
  },
  statistics: (event: H3Event, resource?: GursStatisticsResource) =>
    gursGet(
      event,
      resource
        ? gursEndpoints.statistics.resource(resource)
        : gursEndpoints.statistics.all,
    ),
  search: (event: H3Event, q: string, limit = 8) =>
    gursGet(event, gursEndpoints.search, { query: { q, limit } }),
  sources: {
    list: (event: H3Event) => gursList(event, 'sources'),
    detail: (event: H3Event, id: string) => gursDetail(event, 'sources', id),
  },
  cadastralMunicipalities: {
    list: (event: H3Event) => gursList(event, 'cadastral-municipalities'),
    detail: (event: H3Event, id: string) =>
      gursDetail(event, 'cadastral-municipalities', id),
  },
  addresses: {
    list: (event: H3Event) => gursList(event, 'addresses'),
    detail: (event: H3Event, id: string) => gursDetail(event, 'addresses', id),
  },
  parcels: {
    list: (event: H3Event, query?: GursRequestOptions['query']) =>
      gursList(event, 'parcels', query),
    detail: (event: H3Event, id: string) => gursDetail(event, 'parcels', id),
    valuationUnits: (event: H3Event, id: string) =>
      gursValuationUnits(event, 'parcels', id),
  },
  buildings: {
    list: (event: H3Event, query?: GursRequestOptions['query']) =>
      gursList(event, 'buildings', query),
    detail: (event: H3Event, id: string) => gursDetail(event, 'buildings', id),
    valuationUnits: (event: H3Event, id: string) =>
      gursValuationUnits(event, 'buildings', id),
  },
  buildingParts: {
    list: (event: H3Event, query?: GursRequestOptions['query']) =>
      gursList(event, 'building-parts', query),
    detail: (event: H3Event, id: string) =>
      gursDetail(event, 'building-parts', id),
    valuationUnits: (event: H3Event, id: string) =>
      gursValuationUnits(event, 'building-parts', id),
  },
  transactions: {
    list: (event: H3Event, query?: GursRequestOptions['query']) =>
      gursList(event, 'transactions', query),
    detail: (event: H3Event, id: string) =>
      gursDetail(event, 'transactions', id),
  },
  codeLists: {
    list: (event: H3Event) => gursList(event, 'code-lists'),
    detail: (event: H3Event, id: string) => gursDetail(event, 'code-lists', id),
  },
}
