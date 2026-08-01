import { findProperty } from '../../repositories/gurs-repository'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Manjka identifikator.',
    })
  }
  const property = await findProperty(event, id)
  setHeader(
    event,
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=300',
  )
  return property
})
