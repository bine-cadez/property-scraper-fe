import { dataOverview } from '../repositories/gurs-repository'

export default defineEventHandler(async (event) => {
  setHeader(
    event,
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=300',
  )
  return dataOverview(event)
})
