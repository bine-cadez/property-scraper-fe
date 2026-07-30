import type {
  Building,
  DataSource,
  Listing,
  MoneyValue,
  Parcel,
  PropertyRecord,
  PropertyUnit,
  Transaction,
  Valuation,
} from '../../shared/types/property'

export const GURS_SOURCE: DataSource = {
  id: 'gurs-demo',
  name: 'GURS – vzorčni katastrski podatki',
  url: 'https://www.e-prostor.gov.si/',
  license: 'V MVP so prikazani sintetični podatki.',
  quality: 'current',
}

export const ETN_SOURCE: DataSource = {
  id: 'etn-demo',
  name: 'ETN – vzorčne transakcije',
  url: 'https://www.e-prostor.gov.si/podrocja/trg-in-vrednosti-nepremicnin/',
  license: 'V MVP so prikazane sintetične transakcije.',
  quality: 'partial',
}

export const MODEL_SOURCE: DataSource = {
  id: 'model-v1-demo',
  name: 'Model Prostor v1 – demonstracijski izračun',
  quality: 'current',
}

export const LISTING_SOURCE: DataSource = {
  id: 'listing-demo',
  name: 'Licencirani oglasi – vzorčni vir',
  quality: 'stale',
}

const ring = (
  west: number,
  south: number,
  east: number,
  north: number,
): [number, number][][] => [
  [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ],
]

function money(
  amount: number,
  type: MoneyValue['valueType'],
  source: DataSource,
  updated: string,
  amountPerM2?: number,
): MoneyValue {
  return {
    amount,
    valueType: type,
    source,
    sourceUpdatedAt: updated,
    ...(amountPerM2 !== undefined ? { amountPerM2 } : {}),
  }
}

function parcel(
  id: string,
  number: string,
  bounds: [number, number, number, number],
  area: number,
  buildingIds: string[],
  officialAmount?: number,
): Parcel {
  const [west, south, east, north] = bounds
  return {
    id,
    cadastralMunicipalityId: '1727',
    cadastralMunicipalityName: 'Ljubljana mesto',
    parcelNumber: number,
    geometry: { type: 'Polygon', coordinates: ring(west, south, east, north) },
    centroid: [(west + east) / 2, (south + north) / 2],
    areaM2: area,
    landUse: 'Pozidano zemljišče',
    intendedUse: 'Osrednja območja centralnih dejavnosti',
    regulationStatus: 'OPN MOL – veljaven izvedbeni prostorski akt',
    buildingIds,
    ...(officialAmount !== undefined
      ? {
          officialValue: money(
            officialAmount,
            'official_assessed',
            GURS_SOURCE,
            '2026-01-01',
          ),
        }
      : {}),
    dataSource: GURS_SOURCE,
    sourceUpdatedAt: '2026-06-18',
  }
}

function building(
  id: string,
  parcelId: string,
  address: string,
  bounds: [number, number, number, number],
  facts: {
    footprint: number
    gross: number
    year?: number
    renovation?: number
    floors: number
    units: number
    use: string
    energy?: string
    official?: number
  },
): Building {
  return {
    id,
    parcelIds: [parcelId],
    address,
    geometry: { type: 'Polygon', coordinates: ring(...bounds) },
    footprintAreaM2: facts.footprint,
    grossAreaM2: facts.gross,
    ...(facts.year !== undefined ? { constructionYear: facts.year } : {}),
    ...(facts.renovation !== undefined
      ? { renovationYear: facts.renovation }
      : {}),
    floors: facts.floors,
    unitCount: facts.units,
    buildingUse: facts.use,
    ...(facts.energy ? { energyRating: facts.energy } : {}),
    ...(facts.official !== undefined
      ? {
          officialValue: money(
            facts.official,
            'official_assessed',
            GURS_SOURCE,
            '2026-01-01',
          ),
        }
      : {}),
    dataSource: GURS_SOURCE,
    sourceUpdatedAt: facts.year ? '2026-06-18' : '2024-03-15',
  }
}

const parcelA = parcel(
  'parcela-1727-1492-7',
  '1492/7',
  [14.50315, 46.05596, 14.50405, 46.05655],
  618,
  ['stavba-1727-884'],
  486000,
)
const buildingA = building(
  'stavba-1727-884',
  parcelA.id,
  'Trubarjeva cesta 47, 1000 Ljubljana',
  [14.50336, 46.05608, 14.50383, 46.0564],
  {
    footprint: 244,
    gross: 1218,
    year: 1908,
    renovation: 2019,
    floors: 5,
    units: 14,
    use: 'Večstanovanjska stavba',
    energy: 'C',
    official: 3120000,
  },
)

const parcelB = parcel(
  'parcela-1727-1493-2',
  '1493/2',
  [14.50413, 46.05587, 14.50503, 46.05648],
  702,
  ['stavba-1727-901'],
  532000,
)
const buildingB = building(
  'stavba-1727-901',
  parcelB.id,
  'Resljeva cesta 18, 1000 Ljubljana',
  [14.50435, 46.05602, 14.50481, 46.05634],
  {
    footprint: 268,
    gross: 1472,
    year: 1936,
    renovation: 2012,
    floors: 5,
    units: 18,
    use: 'Stanovanjsko-poslovna stavba',
    energy: 'D',
    official: 3460000,
  },
)

const parcelC = parcel(
  'parcela-1727-1501-11',
  '1501/11',
  [14.50223, 46.05665, 14.50308, 46.05728],
  645,
  ['stavba-1727-922'],
)
const buildingC = building(
  'stavba-1727-922',
  parcelC.id,
  'Ilirska ulica 8, 1000 Ljubljana',
  [14.50243, 46.05681, 14.50291, 46.05713],
  {
    footprint: 251,
    gross: 1040,
    floors: 4,
    units: 10,
    use: 'Večstanovanjska stavba',
  },
)

const valuationA: Valuation = {
  amount: 348000,
  amountPerM2: 4971,
  valueType: 'market_estimate',
  confidence: 'high',
  valuationDate: '2026-07-12',
  methodologyVersion: 'Prostor AVM 1.3',
  explanatoryFactors: [
    'mikrolokacija v središču Ljubljane',
    'prenova stavbe leta 2019',
    'nadpovprečna svetlost in nadstropje',
  ],
  comparableTransactionIds: [
    'transakcija-101',
    'transakcija-102',
    'transakcija-103',
  ],
  source: MODEL_SOURCE,
}

const unitsA: PropertyUnit[] = [
  {
    id: 'enota-1727-884-12',
    buildingId: buildingA.id,
    type: 'apartment',
    floor: 3,
    usableAreaM2: 70,
    rooms: 3,
    officialValue: money(
      276000,
      'official_assessed',
      GURS_SOURCE,
      '2026-01-01',
      3943,
    ),
    estimatedMarketValue: valuationA,
  },
]

const unitsB: PropertyUnit[] = [
  {
    id: 'enota-1727-901-6',
    buildingId: buildingB.id,
    type: 'apartment',
    floor: 2,
    usableAreaM2: 54.8,
    rooms: 2,
    officialValue: money(
      198000,
      'official_assessed',
      GURS_SOURCE,
      '2026-01-01',
      3613,
    ),
    estimatedMarketValue: {
      amount: 263000,
      amountPerM2: 4799,
      valueType: 'market_estimate',
      confidence: 'medium',
      valuationDate: '2026-07-12',
      methodologyVersion: 'Prostor AVM 1.3',
      explanatoryFactors: [
        'dobra dostopnost',
        'manj primerljivih prenovljenih stanovanj',
      ],
      comparableTransactionIds: ['transakcija-102', 'transakcija-104'],
      source: MODEL_SOURCE,
    },
  },
]

const unitsC: PropertyUnit[] = [
  {
    id: 'enota-1727-922-3',
    buildingId: buildingC.id,
    type: 'apartment',
    floor: 1,
    usableAreaM2: 83.4,
    rooms: 3,
    estimatedMarketValue: {
      amount: 336000,
      amountPerM2: 4029,
      valueType: 'market_estimate',
      confidence: 'low',
      valuationDate: '2026-07-12',
      methodologyVersion: 'Prostor AVM 1.3',
      explanatoryFactors: [
        'manjkajoče leto gradnje',
        'zastareli katastrski atributi',
      ],
      comparableTransactionIds: ['transakcija-103'],
      source: MODEL_SOURCE,
    },
  },
]

const transactionSeed = [
  ['transakcija-101', 14.5037, 46.0568, '2026-04-18', 329000, 4700, 70],
  ['transakcija-102', 14.5053, 46.0562, '2026-03-02', 258000, 4778, 54],
  ['transakcija-103', 14.5022, 46.0555, '2025-12-11', 361000, 4513, 80],
  ['transakcija-104', 14.5061, 46.0571, '2025-11-22', 218000, 4360, 50],
  ['transakcija-105', 14.5012, 46.0577, '2025-09-09', 405000, 4500, 90],
  ['transakcija-106', 14.5045, 46.058, '2025-08-14', 287000, 4630, 62],
  ['transakcija-107', 14.5009, 46.0564, '2025-07-30', 191000, 4244, 45],
  ['transakcija-108', 14.5066, 46.0556, '2025-06-19', 312000, 4588, 68],
] as const

export const transactions: Transaction[] = transactionSeed.map(
  ([id, lng, lat, date, price, priceM2, area], index) => ({
    id,
    propertyType: 'apartment',
    location: [lng, lat],
    transactionDate: date,
    price: money(price, 'transaction', ETN_SOURCE, '2026-06-30', priceM2),
    pricePerM2: priceM2,
    areaM2: area,
    distanceFromSelectedProperty: 90 + index * 65,
    dataSource: ETN_SOURCE,
    sourceUpdatedAt: '2026-06-30',
  }),
)

export const listings: Listing[] = [
  {
    id: 'oglas-201',
    title: 'Svetlo 3-sobno stanovanje v centru',
    location: 'Tabor, Ljubljana',
    askingPrice: money(389000, 'asking', LISTING_SOURCE, '2026-07-20', 5187),
    pricePerM2: 5187,
    areaM2: 75,
    publishedAt: '2026-07-20',
    sourceName: 'Vzorčni licencirani vir',
    sourceUrl: '/viri-podatkov',
    coordinates: [14.5048, 46.0574],
  },
  {
    id: 'oglas-202',
    title: 'Prenovljeno mestno stanovanje',
    location: 'Center, Ljubljana',
    askingPrice: money(279000, 'asking', LISTING_SOURCE, '2026-07-13', 5365),
    pricePerM2: 5365,
    areaM2: 52,
    publishedAt: '2026-07-13',
    sourceName: 'Vzorčni licencirani vir',
    sourceUrl: '/viri-podatkov',
    coordinates: [14.5017, 46.0561],
  },
  {
    id: 'oglas-203',
    title: 'Mirno 2-sobno stanovanje',
    location: 'Poljane, Ljubljana',
    askingPrice: money(245000, 'asking', LISTING_SOURCE, '2026-06-04', 4804),
    pricePerM2: 4804,
    areaM2: 51,
    publishedAt: '2026-06-04',
    sourceName: 'Vzorčni licencirani vir',
    sourceUrl: '/viri-podatkov',
    coordinates: [14.5067, 46.0567],
  },
]

export const properties: PropertyRecord[] = [
  {
    id: 'lj-center-trubarjeva-47-12',
    slug: 'trubarjeva-cesta-47-ljubljana',
    title: '3-sobno stanovanje na Trubarjevi',
    address: buildingA.address,
    municipality: 'Ljubljana',
    settlement: 'Ljubljana',
    propertyType: 'apartment',
    coordinates: parcelA.centroid,
    parcel: parcelA,
    building: buildingA,
    units: unitsA,
    primaryValuation: valuationA,
    transactions: transactions.slice(0, 4),
    listings: listings.slice(0, 2),
  },
  {
    id: 'lj-center-resljeva-18-6',
    slug: 'resljeva-cesta-18-ljubljana',
    title: '2-sobno stanovanje na Resljevi',
    address: buildingB.address,
    municipality: 'Ljubljana',
    settlement: 'Ljubljana',
    propertyType: 'apartment',
    coordinates: parcelB.centroid,
    parcel: parcelB,
    building: buildingB,
    units: unitsB,
    primaryValuation: unitsB[0]!.estimatedMarketValue!,
    transactions: transactions.slice(1, 5),
    listings: listings.slice(1),
  },
  {
    id: 'lj-center-ilirska-8-3',
    slug: 'ilirska-ulica-8-ljubljana',
    title: 'Stanovanje na Ilirski',
    address: buildingC.address,
    municipality: 'Ljubljana',
    settlement: 'Ljubljana',
    propertyType: 'apartment',
    coordinates: parcelC.centroid,
    parcel: parcelC,
    building: buildingC,
    units: unitsC,
    primaryValuation: unitsC[0]!.estimatedMarketValue!,
    transactions: transactions.slice(2, 6),
    listings: listings.slice(0, 1),
  },
]

export const parcels = [parcelA, parcelB, parcelC]
export const buildings = [buildingA, buildingB, buildingC]
