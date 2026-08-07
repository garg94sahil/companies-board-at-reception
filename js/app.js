const CLIENTS_URL = "clients.json";
const RELOAD_INTERVAL_MS = 60 * 60 * 1000; // hourly refresh keeps an unattended kiosk screen healthy
const SHUFFLE_INTERVAL_MS = 25 * 1000; // how long one card order stays on screen before reshuffling
const FADE_MS = 700; // must match the .clients transition duration in style.css

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildCards(container, clients) {
  container.innerHTML = "";
  clients.forEach((client, i) => {
    const card = document.createElement("div");
    card.className = "client-card";
    card.style.setProperty("--i", i);

    // Only show the client name as text when there's no logo to show instead.
    card.innerHTML = client.logo
      ? `<div class="client-card__logo-wrap">
           <img class="client-card__logo" src="${client.logo}" alt="${client.name} logo">
         </div>`
      : `<div class="client-card__logo-wrap">
           <p class="client-card__name-fallback">${client.name}</p>
         </div>`;

    container.appendChild(card);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Warp background: ported from magicui's WarpBackground (React) to vanilla JS.
// Each of the 4 grid walls gets a handful of beams streaking toward the viewer,
// recolored to the Haus+ indigo brand color instead of the original's random hues.
const WARP_BEAM_SIZE = 7; // must match --warp-cell in style.css, as a percentage
const WARP_BEAMS_PER_SIDE = 4;
const WARP_BEAM_DURATION_RANGE = [3, 6]; // seconds
const WARP_BEAM_DELAY_RANGE = [0, 4]; // seconds
const WARP_BEAM_COLOR = "130, 180, 255"; // Haus Indigo, as an rgb() triple

function randomBetween([min, max]) {
  return Math.random() * (max - min) + min;
}

function buildWarpBeams() {
  const cellsPerSide = Math.floor(100 / WARP_BEAM_SIZE);
  const step = cellsPerSide / WARP_BEAMS_PER_SIDE;

  document.querySelectorAll(".warp__wall").forEach((wall) => {
    for (let i = 0; i < WARP_BEAMS_PER_SIDE; i++) {
      const x = Math.floor(i * step) * WARP_BEAM_SIZE;
      const opacity = randomBetween([0.5, 1]);
      const aspectRatio = Math.floor(Math.random() * 10) + 1;

      const beam = document.createElement("div");
      beam.className = "warp__beam";
      beam.style.setProperty("--x", `${x}%`);
      beam.style.setProperty("--width", `${WARP_BEAM_SIZE}%`);
      beam.style.setProperty("--ar", aspectRatio);
      beam.style.setProperty("--duration", `${randomBetween(WARP_BEAM_DURATION_RANGE)}s`);
      beam.style.setProperty("--delay", `${randomBetween(WARP_BEAM_DELAY_RANGE)}s`);
      beam.style.setProperty(
        "--beam-gradient",
        `linear-gradient(rgba(${WARP_BEAM_COLOR}, ${opacity}), transparent)`
      );
      wall.appendChild(beam);
    }
  });
}

async function renderClients() {
  const container = document.getElementById("clients");
  const res = await fetch(CLIENTS_URL, { cache: "no-store" });
  let clients = await res.json();

  buildCards(container, clients);

  setInterval(async () => {
    container.classList.add("is-hidden");
    await sleep(FADE_MS);
    clients = shuffle(clients);
    buildCards(container, clients);
    container.classList.remove("is-hidden");
  }, SHUFFLE_INTERVAL_MS);
}

buildWarpBeams();
renderClients();

setTimeout(() => location.reload(), RELOAD_INTERVAL_MS);
