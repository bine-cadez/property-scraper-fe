<script setup lang="ts">
useSeoMeta({
  title: 'Prostor na dlani | Podatki o slovenskih nepremičninah',
  description:
    'Pregleden dostop do parcel, stavb, vrednosti in primerljivih prodaj slovenskih nepremičnin.',
  ogTitle: 'Prostor na dlani',
  ogDescription:
    'Mirnejši in razumljivejši način raziskovanja slovenskih nepremičnin.',
  ogType: 'website',
})

useHead({
  link: [{ rel: 'canonical', href: '/' }],
})
</script>

<template>
  <div class="home">
    <AppHeader />
    <main>
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Slovenska nepremičninska inteligenca</span>
          <h1>Prostor razumete,<br />preden se odločite.</h1>
          <p>
            Parcele, stavbe, uradne vrednosti, tržne ocene in dejanske prodaje v
            enem jasnem prostorskem pogledu.
          </p>
          <div class="hero-actions">
            <NuxtLink class="primary-action focus-ring" to="/zemljevid">
              Odpri zemljevid <span aria-hidden="true">→</span>
            </NuxtLink>
            <NuxtLink class="text-action" to="/metodologija"
              >Kako delujejo ocene?</NuxtLink
            >
          </div>
          <ul aria-label="Ključne lastnosti">
            <li>
              <i aria-hidden="true" /> Kategorije cen so vedno jasno ločene
            </li>
            <li>
              <i aria-hidden="true" /> Vir, datum in zanesljivost ob vsakem
              podatku
            </li>
            <li>
              <i aria-hidden="true" /> Brez podatkov o lastništvu fizičnih oseb
            </li>
          </ul>
        </div>

        <NuxtLink
          class="map-preview"
          to="/zemljevid"
          aria-label="Odpri interaktivni zemljevid"
        >
          <div class="preview-bar">
            <span class="preview-search"
              >⌕ &nbsp; Trubarjeva cesta 47, Ljubljana</span
            >
            <span class="preview-chip">Parcele</span>
          </div>
          <div class="preview-map">
            <span class="road road-a" />
            <span class="road road-b" />
            <span class="parcel parcel-a" />
            <span class="parcel parcel-b" />
            <span class="parcel parcel-c" />
            <span class="building building-a" />
            <span class="building building-b" />
            <span class="price price-a">4.700 €/m²</span>
            <span class="price price-b">5.187 €/m²</span>
            <div class="preview-panel">
              <small>IZRAČUNANA TRŽNA OCENA</small>
              <strong>348.000 €</strong>
              <span>4.971 €/m² · visoka zanesljivost</span>
            </div>
          </div>
          <span class="preview-caption"
            >Interaktivni pregled Ljubljane · vzorčni podatki</span
          >
        </NuxtLink>
      </section>

      <section class="principles" aria-labelledby="principles-title">
        <header>
          <span>Od podatka do odločitve</span>
          <h2 id="principles-title">Manj ugibanja. Več konteksta.</h2>
        </header>
        <div class="principle-grid">
          <article>
            <span>01</span>
            <h3>Najprej prostor</h3>
            <p>
              Raziskujte okolico in meje zemljišč, ne le vrstic v nepregledni
              tabeli.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Vrednosti z razlago</h3>
            <p>
              Uradne ocene, modelne ocene, oglasi in prodaje ostanejo ločene
              kategorije.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Preverljivi viri</h3>
            <p>
              Vsak podatek pove, od kod prihaja, kako svež je in koliko mu lahko
              zaupate.
            </p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100dvh;
  background: #f9fbfa;
}

.hero {
  display: grid;
  width: min(1240px, calc(100% - 44px));
  min-height: 670px;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 70px;
  align-items: center;
  margin: 0 auto;
  padding: 64px 0;
}

.eyebrow,
.principles header > span {
  color: var(--color-accent-strong);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 16px 0 20px;
  font-size: clamp(42px, 5.4vw, 70px);
  font-weight: 720;
  line-height: 1.01;
  letter-spacing: -0.055em;
}

.hero-copy > p {
  max-width: 540px;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 17px;
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  margin: 30px 0;
}

.primary-action {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  gap: 26px;
  padding: 0 18px;
  border-radius: 8px;
  color: white;
  background: var(--color-accent);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.primary-action:hover {
  background: var(--color-accent-strong);
}

.text-action {
  color: var(--color-accent-strong);
  font-size: 13px;
  font-weight: 700;
}

.hero-copy ul {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  color: var(--color-ink-muted);
  font-size: 11px;
  list-style: none;
}

.hero-copy li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-copy li i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}

.map-preview {
  display: block;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  color: var(--color-ink);
  background: white;
  box-shadow: 0 24px 60px rgb(23 33 31 / 12%);
  text-decoration: none;
}

.preview-bar {
  display: flex;
  height: 58px;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid var(--color-line);
}

.preview-search {
  display: flex;
  height: 38px;
  flex: 1;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  color: var(--color-ink-muted);
  font-size: 11px;
}

.preview-chip {
  padding: 8px 10px;
  border: 1px solid #a9d0c6;
  border-radius: 7px;
  color: var(--color-accent-strong);
  background: var(--color-accent-soft);
  font-size: 10px;
  font-weight: 700;
}

.preview-map {
  position: relative;
  height: 440px;
  overflow: hidden;
  background:
    linear-gradient(
      28deg,
      transparent 48%,
      rgb(255 255 255 / 58%) 49%,
      rgb(255 255 255 / 58%) 53%,
      transparent 54%
    ),
    #dce7e2;
}

.road {
  position: absolute;
  height: 34px;
  background: #f6f8f7;
  box-shadow: inset 0 0 0 1px #d2dcd8;
  transform: rotate(-18deg);
}

.road-a {
  top: 150px;
  left: -50px;
  width: 800px;
}

.road-b {
  top: 40px;
  left: 270px;
  width: 500px;
  transform: rotate(72deg);
}

.parcel {
  position: absolute;
  border: 2px solid #cf8c3b;
  background: rgb(244 214 168 / 34%);
  transform: skewY(-9deg);
}

.parcel-a {
  top: 80px;
  left: 70px;
  width: 190px;
  height: 120px;
}

.parcel-b {
  top: 203px;
  left: 230px;
  width: 210px;
  height: 140px;
}

.parcel-c {
  top: 42px;
  right: 54px;
  width: 170px;
  height: 128px;
}

.building {
  position: absolute;
  border: 2px solid #3e6b61;
  background: #91ada5;
  transform: skewY(-9deg);
}

.building-a {
  top: 115px;
  left: 117px;
  width: 92px;
  height: 55px;
}

.building-b {
  top: 235px;
  left: 286px;
  width: 104px;
  height: 64px;
}

.price {
  position: absolute;
  z-index: 2;
  padding: 6px 8px;
  border: 2px solid white;
  border-radius: 6px;
  color: white;
  background: var(--color-sale);
  box-shadow: 0 3px 10px rgb(23 33 31 / 18%);
  font-size: 9px;
  font-weight: 800;
}

.price-a {
  top: 91px;
  left: 216px;
}

.price-b {
  top: 211px;
  left: 403px;
  background: var(--color-listing);
}

.preview-panel {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: grid;
  width: 220px;
  gap: 4px;
  padding: 16px;
  border-left: 3px solid var(--color-accent);
  background: white;
  box-shadow: var(--elevation-overlay);
}

.preview-panel small {
  color: var(--color-accent-strong);
  font-size: 8px;
  font-weight: 800;
}

.preview-panel strong {
  font-size: 24px;
}

.preview-panel span {
  color: var(--color-ink-muted);
  font-size: 9px;
}

.preview-caption {
  display: block;
  padding: 10px 14px;
  color: var(--color-ink-muted);
  font-size: 9px;
  text-align: right;
}

.principles {
  padding: 80px max(22px, calc((100vw - 1240px) / 2));
  color: white;
  background: #17211f;
}

.principles header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 30px;
  border-bottom: 1px solid #3b4744;
}

.principles header > span {
  color: #85c7b7;
}

.principles h2 {
  margin: 0;
  font-size: clamp(28px, 4vw, 44px);
  letter-spacing: -0.035em;
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.principle-grid article {
  padding: 34px 30px 20px 0;
  border-right: 1px solid #3b4744;
}

.principle-grid article + article {
  padding-left: 30px;
}

.principle-grid article:last-child {
  border-right: 0;
}

.principle-grid span {
  color: #85c7b7;
  font-size: 10px;
  font-weight: 800;
}

.principle-grid h3 {
  margin: 28px 0 10px;
  font-size: 18px;
}

.principle-grid p {
  margin: 0;
  color: #aebbb7;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .map-preview {
    max-width: 720px;
  }
}

@media (max-width: 620px) {
  .hero {
    width: min(100% - 28px, 1240px);
    padding-top: 44px;
  }

  h1 {
    font-size: 42px;
  }

  .hero-actions {
    align-items: start;
    flex-direction: column;
  }

  .preview-map {
    height: 330px;
  }

  .principles header {
    align-items: start;
    flex-direction: column;
  }

  .principle-grid {
    grid-template-columns: 1fr;
  }

  .principle-grid article,
  .principle-grid article + article {
    padding: 25px 0;
    border-right: 0;
    border-bottom: 1px solid #3b4744;
  }
}
</style>
