//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
import proj4 from 'proj4'
import type { Position } from '../types/property'

export const SI_D96_TM =
  '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=500000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs'
export const WGS84 = 'EPSG:4326'

proj4.defs('EPSG:3794', SI_D96_TM)

export function siD96TmToWgs84(position: Position): Position {
  const [longitude, latitude] = proj4('EPSG:3794', WGS84, position)
  if (longitude === undefined || latitude === undefined) {
    throw new Error('Pretvorba koordinat ni uspela.')
  }
  return [longitude, latitude]
}

export function normalizePolygonFromSiD96Tm(rings: Position[][]): Position[][] {
  return rings.map((ring) => ring.map(siD96TmToWgs84))
}
