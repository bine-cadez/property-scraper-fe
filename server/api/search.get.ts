import { geocodingRepository } from '../repositories/fixture-repositories'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const value = typeof query.q === 'string' ? query.q.trim() : ''
  if (value.length < 2) return { results: [] }
  if (value.length > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Iskalni niz je predolg.',
    })
  }
  return { results: await geocodingRepository.search(value, { limit: 8 }) }
})
