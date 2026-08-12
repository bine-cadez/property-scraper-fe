<!--
     _/\_     _/\_
 ___/    \___/    \___
<_o_  human fish (olm) _o_>
-->
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
  <div class="min-h-dvh bg-[#f7f9f8]">
    <AppHeader />
    <main class="mx-auto w-[min(1160px,calc(100%-36px))] pt-6 pb-[90px]">
      <nav
        class="flex min-h-[38px] items-center gap-2 text-[10px] text-ink-muted [&_a]:text-ink-muted"
        aria-label="Drobtinice"
      >
        <NuxtLink to="/">Domov</NuxtLink>
        <span>/</span>
        <NuxtLink to="/zemljevid">Zemljevid</NuxtLink>
        <span>/</span>
        <span aria-current="page">{{ record.address }}</span>
      </nav>

      <header
        class="flex items-end justify-between gap-8 pt-[38px] pb-[34px] max-[800px]:flex-col max-[800px]:items-start"
      >
        <div>
          <span
            class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
          >
            {{
              record.propertyType === 'apartment'
                ? 'Stanovanje'
                : 'Nepremičnina'
            }}
            · {{ record.municipality }}
          </span>
          <h1
            class="mt-[9px] mb-2 text-[clamp(30px,5vw,52px)] leading-[1.05] font-bold tracking-[-0.045em]"
          >
            {{ record.address }}
          </h1>
          <p class="text-[13px] text-ink-muted">
            {{ record.title }} · parcela {{ record.parcel.parcelNumber }} · k.
            o.
            {{ record.parcel.cadastralMunicipalityId }}
            {{ record.parcel.cadastralMunicipalityName }}
          </p>
        </div>
        <NuxtLink
          class="inline-flex min-h-12 items-center gap-2 rounded-sm border border-accent bg-white px-[15px] text-xs font-[750] whitespace-nowrap text-accent-strong no-underline transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:scale-[0.97] motion-reduce:active:scale-100"
          :to="{
            path: '/zemljevid',
            query: {
              c: `${record.coordinates[0]},${record.coordinates[1]}`,
              z: '17',
              l: 'parcels,buildings,transactions,priceM2',
              izbor: record.id,
            },
          }"
        >
          <span aria-hidden="true">⌖</span>
          Pokaži na zemljevidu
        </NuxtLink>
      </header>

      <div
        class="grid grid-cols-[1fr_1.1fr] border border-line bg-white max-[800px]:grid-cols-1"
      >
        <section
          class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-l-4 border-accent p-7 max-[560px]:grid-cols-1 max-[560px]:px-[18px] max-[560px]:py-[22px]"
        >
          <span
            class="col-span-full text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
            >Glavni prikaz vrednosti</span
          >
          <PriceMetric
            v-if="primaryMoney"
            class="col-span-full"
            :value="primaryMoney"
            primary
          />
          <p v-else>Vrednost za ta zapis ni na voljo.</p>
          <div v-if="record.primaryValuation" class="flex items-center gap-3.5">
            <ConfidenceIndicator
              :confidence="record.primaryValuation.confidence"
            />
            <DataFreshness
              :date="record.primaryValuation.valuationDate"
              :quality="record.primaryValuation.source.quality"
            />
          </div>
          <DataSourceBadge
            v-if="primaryMoney"
            class="col-span-full"
            :source="primaryMoney.source"
          />
        </section>
        <dl
          class="grid grid-cols-2 border-l border-line max-[800px]:border-t max-[800px]:border-l-0 [&>div:nth-child(3)]:border-b-0 [&>div:nth-child(4)]:border-b-0 [&>div]:grid [&>div]:min-h-[90px] [&>div]:content-center [&>div]:gap-[5px] [&>div]:border-r [&>div]:border-b [&>div]:border-line [&>div]:p-[18px] max-[560px]:[&>div]:p-[13px] [&_dd]:text-[17px] [&_dd]:font-[750] [&_dt]:text-[10px] [&_dt]:text-ink-muted"
        >
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

      <div
        class="mt-[54px] grid grid-cols-[minmax(0,1fr)_270px] items-start gap-[54px] max-[800px]:grid-cols-1"
      >
        <div class="grid gap-[60px]">
          <section class="grid gap-6" aria-labelledby="value-title">
            <header class="border-b border-line pb-3.5">
              <span
                class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
                >Transparentna primerjava</span
              >
              <h2
                id="value-title"
                class="mt-[5px] text-[25px] font-bold tracking-[-0.025em]"
              >
                Vrednosti in cene
              </h2>
            </header>
            <ValuationSummary :property="record" />
          </section>

          <section class="grid gap-6" aria-labelledby="sales-title">
            <header class="border-b border-line pb-3.5">
              <span
                class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
                >Dejanski trg</span
              >
              <h2
                id="sales-title"
                class="mt-[5px] text-[25px] font-bold tracking-[-0.025em]"
              >
                Primerljive zaključene prodaje
              </h2>
            </header>
            <ComparableSales :transactions="record.transactions" />
          </section>

          <section class="grid gap-6" aria-labelledby="facts-title">
            <header class="border-b border-line pb-3.5">
              <span
                class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
                >Uradna dejstva</span
              >
              <h2
                id="facts-title"
                class="mt-[5px] text-[25px] font-bold tracking-[-0.025em]"
              >
                Parcela in stavba
              </h2>
            </header>
            <div class="grid grid-cols-2 gap-[38px] max-[800px]:grid-cols-1">
              <ParcelFacts :parcel="record.parcel" />
              <BuildingFacts :building="record.building" />
            </div>
          </section>

          <section
            class="border-l-[3px] border-warm bg-warm-soft p-7 text-[13px] leading-[1.65] text-[#5f574b]"
          >
            <h2 class="mt-[5px] text-[25px] font-bold tracking-[-0.025em]">
              Kaj je dobro vedeti o tej nepremičnini
            </h2>
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

        <aside class="sticky top-5 grid gap-4 max-[800px]:static">
          <div class="grid gap-2.5 border border-line bg-white p-[18px]">
            <span
              class="text-[10px] font-extrabold tracking-[0.075em] text-accent-strong uppercase"
              >Podatkovna sled</span
            >
            <h2 class="mt-0.5 mb-2 text-[17px] font-bold">
              Viri tega pregleda
            </h2>
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
            <NuxtLink
              class="mt-[7px] text-[10px] font-[750] text-accent-strong"
              to="/viri-podatkov"
              >Vsi viri in omejitve →</NuxtLink
            >
          </div>
          <div
            class="grid gap-2.5 border border-[#ead4b6] bg-warm-soft p-[18px]"
          >
            <strong class="text-[11px]">Informativni prikaz</strong>
            <p class="text-[10px] leading-[1.55] text-[#6e6252]">
              Uradne vrednosti in tržne ocene niso isto. Oglasi niso prodaje.
              Podatki so lahko zamaknjeni ali nepopolni.
            </p>
            <NuxtLink
              class="mt-[7px] text-[10px] font-[750] text-accent-strong"
              to="/metodologija"
              >Preberite metodologijo</NuxtLink
            >
          </div>
        </aside>
      </div>

      <nav
        class="mt-[70px] grid grid-cols-3 gap-px border border-line bg-line max-[560px]:grid-cols-1 [&_a]:grid [&_a]:min-h-[84px] [&_a]:content-center [&_a]:gap-[5px] [&_a]:bg-white [&_a]:p-4 [&_a]:text-ink [&_a]:no-underline [&_a]:hover:bg-accent-soft [&_span]:text-[9px] [&_span]:font-[750] [&_span]:text-ink-muted [&_span]:uppercase [&_strong]:text-xs"
        aria-label="Sorodne vsebine"
      >
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
