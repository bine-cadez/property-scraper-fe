import type { Position } from '#shared/types/property'

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function calculatePathDistance(points: Position[]): number {
  let distance = 0

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    if (!from || !to) continue

    const latitudeDelta = toRadians(to[1] - from[1])
    const longitudeDelta = toRadians(to[0] - from[0])
    const fromLatitude = toRadians(from[1])
    const toLatitude = toRadians(to[1])
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(fromLatitude) *
        Math.cos(toLatitude) *
        Math.sin(longitudeDelta / 2) ** 2

    distance +=
      2 *
      EARTH_RADIUS_METERS *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  }

  return distance
}

export function formatMeasuredDistance(points: Position[]): string | undefined {
  if (points.length < 2) return undefined

  const distance = calculatePathDistance(points)
  return distance >= 1000
    ? `${(distance / 1000).toLocaleString('sl-SI', {
        maximumFractionDigits: 2,
      })} km`
    : `${Math.round(distance).toLocaleString('sl-SI')} m`
}
