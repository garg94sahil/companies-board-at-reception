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

renderClients();

setTimeout(() => location.reload(), RELOAD_INTERVAL_MS);
