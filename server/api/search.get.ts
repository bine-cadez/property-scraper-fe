//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import { searchProperties } from '../repositories/gurs-repository'

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
  return { results: await searchProperties(event, value, 8) }
})
