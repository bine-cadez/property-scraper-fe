<script setup lang="ts">
import type { MoneyValue, PropertyRecord } from '#shared/types/property'
import { formatArea, formatDate, formatEur } from '#shared/utils/format'

const route = useRoute()
const config = useRuntimeConfig()
const id = computed(() => String(route.params.id))

const { data: property, error } = await useAsyncData(
  () => `property-${id.value}`,
  () => $fetch<PropertyRecord>(`/api/property/${encodeURIComponent(id.value)}`),
)

if (error.value || !property.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Nepremičnina ni najdena.',
  })
}

const record = computed(() => property.value!)
const unit = computed(() => record.value.units[0])
const canonical = computed(
  () =>
    `${String(config.public.siteUrl).replace(/\/$/, '')}/nepremicnina/${record.value.id}`,
)

const primaryMoney = computed<MoneyValue | undefined>(() => {
  const valuation = record.value.primaryValuation
  if (valuation) {
    return {
      amount: valuation.amount,
      valueType: valuation.valueType,
      source: valuation.source,
      sourceUpdatedAt: valuation.valuationDate,
      ...(valuation.amountPerM2 !== undefined
        ? { amountPerM2: valuation.amountPerM2 }
        : {}),
    }
  }
  return unit.value?.officialValue
})

useSeoMeta({
  title: () =>
    `${record.value.address} – podatki in vrednost | Prostor na dlani`,
  description: () =>
    `${record.value.title}: ${unit.value ? formatArea(unit.value.usableAreaM2) : 'podatki o površini'}, parcela ${record.value.parcel.parcelNumber}, vrednosti in primerljive prodaje v ${record.value.municipality}.`,
  ogTitle: () => `${record.value.address} – pregled nepremičnine`,
  ogDescription: () =>
    `Katastrska dejstva, transparentna vrednost in ${record.value.transactions.length} primerljive prodaje.`,
  ogType: 'website',
  ogUrl: canonical,
  robots: 'index, follow',
})

const schema = computed(() => [
  {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: record.value.title,
    url: canonical.value,
    address: {
      '@type': 'PostalAddress',
      streetAddress: record.value.address.split(',')[0],
      addressLocality: record.value.settlement,
      addressRegion: record.value.municipality,
      postalCode: '1000',
      addressCountry: 'SI',
    },
    ...(unit.value
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: unit.value.usableAreaM2,
            unitCode: 'MTK',
          },
          numberOfRooms: unit.value.rooms,
          floorLevel: unit.value.floor,
        }
      : {}),
    geo: {
      '@type': 'GeoCoordinates',
      longitude: record.value.coordinates[0],
      latitude: record.value.coordinates[1],
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Parcelna številka',
        value: record.value.parcel.parcelNumber,
      },
      {
        '@type': 'PropertyValue',
        name: 'Katastrska občina',
        value: `${record.value.parcel.cadastralMunicipalityId} ${record.value.parcel.cadastralMunicipalityName}`,
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Domov',
        item: String(config.public.siteUrl),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Zemljevid',
        item: `${String(config.public.siteUrl).replace(/\/$/, '')}/zemljevid`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: record.value.address,
        item: canonical.value,
      },
    ],
  },
])

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify(schema.value),
    },
  ],
})
</script>

<template>
  <div class="property-page">
    <AppHeader />
    <main>
      <nav class="breadcrumbs" aria-label="Drobtinice">
        <NuxtLink to="/">Domov</NuxtLink>
        <span>/</span>
        <NuxtLink to="/zemljevid">Zemljevid</NuxtLink>
        <span>/</span>
        <span aria-current="page">{{ record.address }}</span>
      </nav>

      <header class="property-heading">
        <div>
          <span class="eyebrow">
            {{
              record.propertyType === 'apartment'
                ? 'Stanovanje'
                : 'Nepremičnina'
            }}
            · {{ record.municipality }}
          </span>
          <h1>{{ record.address }}</h1>
          <p>
            {{ record.title }} · parcela {{ record.parcel.parcelNumber }} · k.
            o.
            {{ record.parcel.cadastralMunicipalityId }}
            {{ record.parcel.cadastralMunicipalityName }}
          </p>
        </div>
        <NuxtLink
          class="map-link focus-ring"
          :to="{
            path: '/zemljevid',
            query: {
              c: `${record.coordinates[0]},${record.coordinates[1]}`,
              z: '17',
              l: 'parcels,buildings,transactions,listings,priceM2',
              izbor: record.id,
            },
          }"
        >
          <span aria-hidden="true">⌖</span>
          Pokaži na zemljevidu
        </NuxtLink>
      </header>

      <div class="summary-grid">
        <section class="value-card">
          <span>Glavni prikaz vrednosti</span>
          <PriceMetric v-if="primaryMoney" :value="primaryMoney" primary />
          <p v-else>Vrednost za ta zapis ni na voljo.</p>
          <div v-if="record.primaryValuation" class="value-meta">
            <ConfidenceIndicator
              :confidence="record.primaryValuation.confidence"
            />
            <DataFreshness
              :date="record.primaryValuation.valuationDate"
              :quality="record.primaryValuation.source.quality"
            />
          </div>
          <DataSourceBadge v-if="primaryMoney" :source="primaryMoney.source" />
        </section>
        <dl class="headline-facts">
          <div>
            <dt>Uporabna površina</dt>
            <dd>{{ unit ? formatArea(unit.usableAreaM2) : 'Ni podatka' }}</dd>
          </div>
          <div>
            <dt>Število sob</dt>
            <dd>{{ unit?.rooms || 'Ni podatka' }}</dd>
          </div>
          <div>
            <dt>Nadstropje</dt>
            <dd>{{ unit?.floor ?? 'Ni podatka' }}</dd>
          </div>
          <div>
            <dt>Leto gradnje</dt>
            <dd>{{ record.building?.constructionYear || 'Ni podatka' }}</dd>
          </div>
        </dl>
      </div>

      <div class="content-grid">
        <div class="main-column">
          <section class="index-section" aria-labelledby="value-title">
            <header>
              <span>Transparentna primerjava</span>
              <h2 id="value-title">Vrednosti in cene</h2>
            </header>
            <ValuationSummary :property="record" />
          </section>

          <section class="index-section" aria-labelledby="sales-title">
            <header>
              <span>Dejanski trg</span>
              <h2 id="sales-title">Primerljive zaključene prodaje</h2>
            </header>
            <ComparableSales :transactions="record.transactions" />
          </section>

          <section class="index-section" aria-labelledby="facts-title">
            <header>
              <span>Uradna dejstva</span>
              <h2 id="facts-title">Parcela in stavba</h2>
            </header>
            <div class="facts-grid">
              <ParcelFacts :parcel="record.parcel" />
              <BuildingFacts :building="record.building" />
            </div>
          </section>

          <section class="explanation">
            <h2>Kaj je dobro vedeti o tej nepremičnini</h2>
            <p>
              Ta stran združuje evidentirane lastnosti parcele in stavbe z
              modelno oceno ter bližnjimi zaključenimi transakcijami. Modelna
              ocena
              <strong>{{
                primaryMoney ? formatEur(primaryMoney.amount) : 'ni na voljo'
              }}</strong>
              ni uradna cenitev in ne pomeni zagotovljene prodajne cene.
            </p>
            <p v-if="record.primaryValuation">
              Izračun z dne
              {{ formatDate(record.primaryValuation.valuationDate) }} temelji na
              metodologiji {{ record.primaryValuation.methodologyVersion }}. Med
              pomembnimi dejavniki so
              {{ record.primaryValuation.explanatoryFactors.join(', ') }}.
            </p>
            <p>
              Pred pravnim poslom preverite stanje v uradnih evidencah,
              zemljiški knjigi in veljavnih prostorskih aktih ter po potrebi
              vključite pooblaščenega strokovnjaka.
            </p>
          </section>
        </div>

        <aside class="side-column">
          <div class="source-card">
            <span>Podatkovna sled</span>
            <h2>Viri tega pregleda</h2>
            <DataSourceBadge :source="record.parcel.dataSource" />
            <DataFreshness
              :date="record.parcel.sourceUpdatedAt"
              :quality="record.parcel.dataSource.quality"
            />
            <template v-if="record.primaryValuation">
              <DataSourceBadge :source="record.primaryValuation.source" />
              <DataFreshness
                :date="record.primaryValuation.valuationDate"
                :quality="record.primaryValuation.source.quality"
              />
            </template>
            <NuxtLink to="/viri-podatkov">Vsi viri in omejitve →</NuxtLink>
          </div>
          <div class="disclaimer">
            <strong>Informativni prikaz</strong>
            <p>
              Uradne vrednosti in tržne ocene niso isto. Oglasi niso prodaje.
              Podatki so lahko zamaknjeni ali nepopolni.
            </p>
            <NuxtLink to="/metodologija">Preberite metodologijo</NuxtLink>
          </div>
        </aside>
      </div>

      <nav class="internal-links" aria-label="Sorodne vsebine">
        <NuxtLink :to="`/parcela/${record.parcel.id}`">
          <span>Parcela</span>
          <strong>{{ record.parcel.parcelNumber }}</strong>
        </NuxtLink>
        <NuxtLink v-if="record.building" :to="`/stavba/${record.building.id}`">
          <span>Stavba</span>
          <strong>{{ record.building.address }}</strong>
        </NuxtLink>
        <NuxtLink to="/naselje/ljubljana">
          <span>Naselje</span>
          <strong>Ljubljana</strong>
        </NuxtLink>
      </nav>
    </main>
  </div>
</template>

<style scoped>
.property-page {
  min-height: 100dvh;
  background: #f7f9f8;
}

main {
  width: min(1160px, calc(100% - 36px));
  margin: 0 auto;
  padding: 24px 0 90px;
}

.breadcrumbs {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  color: var(--color-ink-muted);
  font-size: 10px;
}

.breadcrumbs a {
  color: var(--color-ink-muted);
}

.property-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  padding: 38px 0 34px;
}

.eyebrow,
.index-section > header span,
.value-card > span,
.source-card > span {
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

h1 {
  margin: 9px 0 8px;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.property-heading p {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 13px;
}

.map-link {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: var(--color-accent-strong);
  background: white;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  border: 1px solid var(--color-line);
  background: white;
}

.value-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 16px;
  padding: 28px;
  border-left: 4px solid var(--color-accent);
}

.value-card > span,
.value-card :deep(.price-metric),
.value-card :deep(.source-badge) {
  grid-column: 1 / -1;
}

.value-meta {
  display: flex;
  align-items: center;
  gap: 14px;
}

.headline-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin: 0;
  border-left: 1px solid var(--color-line);
}

.headline-facts div {
  display: grid;
  align-content: center;
  gap: 5px;
  min-height: 90px;
  padding: 18px;
  border-right: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.headline-facts div:nth-child(3),
.headline-facts div:nth-child(4) {
  border-bottom: 0;
}

.headline-facts dt {
  color: var(--color-ink-muted);
  font-size: 10px;
}

.headline-facts dd {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 54px;
  align-items: start;
  margin-top: 54px;
}

.main-column {
  display: grid;
  gap: 60px;
}

.index-section {
  display: grid;
  gap: 24px;
}

.index-section > header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-line);
}

.index-section > header h2,
.explanation h2 {
  margin: 5px 0 0;
  font-size: 25px;
  letter-spacing: -0.025em;
}

.facts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 38px;
}

.explanation {
  padding: 28px;
  border-left: 3px solid var(--color-warm);
  background: var(--color-warm-soft);
}

.explanation p {
  color: #5f574b;
  font-size: 13px;
  line-height: 1.65;
}

.side-column {
  position: sticky;
  top: 20px;
  display: grid;
  gap: 16px;
}

.source-card,
.disclaimer {
  display: grid;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--color-line);
  background: white;
}

.source-card h2 {
  margin: 2px 0 8px;
  font-size: 17px;
}

.source-card a,
.disclaimer a {
  margin-top: 7px;
  color: var(--color-accent-strong);
  font-size: 10px;
  font-weight: 750;
}

.disclaimer {
  border-color: #ead4b6;
  background: var(--color-warm-soft);
}

.disclaimer strong {
  font-size: 11px;
}

.disclaimer p {
  margin: 0;
  color: #6e6252;
  font-size: 10px;
  line-height: 1.55;
}

.internal-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin-top: 70px;
  border: 1px solid var(--color-line);
  background: var(--color-line);
}

.internal-links a {
  display: grid;
  gap: 5px;
  min-height: 84px;
  align-content: center;
  padding: 16px;
  color: var(--color-ink);
  background: white;
  text-decoration: none;
}

.internal-links a:hover {
  background: var(--color-accent-soft);
}

.internal-links span {
  color: var(--color-ink-muted);
  font-size: 9px;
  font-weight: 750;
  text-transform: uppercase;
}

.internal-links strong {
  font-size: 12px;
}

@media (max-width: 800px) {
  .property-heading {
    align-items: start;
    flex-direction: column;
  }

  .summary-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .headline-facts {
    border-top: 1px solid var(--color-line);
    border-left: 0;
  }

  .side-column {
    position: static;
  }

  .facts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .value-card {
    grid-template-columns: 1fr;
    padding: 22px 18px;
  }

  .headline-facts div {
    padding: 13px;
  }

  .internal-links {
    grid-template-columns: 1fr;
  }
}
</style>
