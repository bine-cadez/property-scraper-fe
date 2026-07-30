import { propertyRepository } from '../../repositories/fixture-repositories'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Manjka identifikator.',
    })
  }
  const property = await propertyRepository.findById(id)
  if (!property) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nepremičnina ni najdena.',
    })
  }
  setHeader(
    event,
    'Cache-Control',
    'public, max-age=60, stale-while-revalidate=300',
  )
  return property
})
