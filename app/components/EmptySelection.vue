<template>
  <section class="empty-selection">
    <div class="diagram" aria-hidden="true">
      <span class="plot plot-a" />
      <span class="plot plot-b" />
      <span class="building" />
      <span class="pin">•</span>
    </div>
    <h2>Izberite prostor na zemljevidu</h2>
    <p>
      Kliknite parcelo, stavbo ali cenovno oznako. Pomembni rezultati so
      dostopni tudi v seznamu.
    </p>
  </section>
</template>

<style scoped>
.empty-selection {
  padding: 44px 28px;
  text-align: center;
}

.diagram {
  position: relative;
  width: 128px;
  height: 96px;
  margin: 0 auto 24px;
}

.plot {
  position: absolute;
  border: 1.5px solid #9dc8bd;
  background: #edf7f4;
  transform: skewY(-10deg);
}

.plot-a {
  inset: 24px 48px 10px 6px;
}

.plot-b {
  inset: 10px 4px 18px 66px;
}

.building {
  position: absolute;
  top: 29px;
  left: 45px;
  width: 42px;
  height: 34px;
  border: 2px solid var(--color-ink-muted);
  background: white;
  transform: skewY(-10deg);
}

.pin {
  position: absolute;
  top: 7px;
  left: 73px;
  display: grid;
  width: 26px;
  height: 34px;
  place-items: center;
  border-radius: 50% 50% 50% 0;
  color: white;
  background: var(--color-warm);
  transform: rotate(-45deg);
}

.pin::first-letter {
  transform: rotate(45deg);
}

h2 {
  margin: 0;
  font-size: 17px;
}

p {
  max-width: 290px;
  margin: 9px auto 0;
  color: var(--color-ink-muted);
  font-size: 13px;
  line-height: 1.55;
}
</style>
