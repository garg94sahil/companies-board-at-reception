const CLIENTS_URL = "clients.json";
const RELOAD_INTERVAL_MS = 60 * 60 * 1000; // hourly refresh keeps an unattended kiosk screen healthy

async function renderClients() {
  const container = document.getElementById("clients");
  const res = await fetch(CLIENTS_URL, { cache: "no-store" });
  const clients = await res.json();

  container.innerHTML = "";
  clients.forEach((client, i) => {
    const card = document.createElement("div");
    card.className = "client-card";
    card.style.setProperty("--i", i);

    card.innerHTML = `
      <div class="client-card__logo-wrap">
        <img class="client-card__logo" src="${client.logo}" alt="${client.name} logo">
      </div>
      <p class="client-card__name">${client.name}</p>
    `;
    container.appendChild(card);
  });
}

renderClients();

setTimeout(() => location.reload(), RELOAD_INTERVAL_MS);
