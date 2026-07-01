// ===========================================
// PANTANAL EXPLORER 1.0
// explorer.js - PARTE 1
// ===========================================

// ---------- MAPA ----------

const map = L.map("map").setView([-16.56, -56.71], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
).addTo(map);

// ---------- DADOS ----------

const locais = [
    ...cidades,
    ...pousadas,
    ...destinos,
    ...pontes
];

const marcadores = [];
const roteiro = [];

// ---------- PAINÉIS ----------

const infoPanel = document.getElementById("info-panel");
const panelContent = document.getElementById("panel-content");

const roteiroPanel = document.getElementById("roteiro-panel");
const roteiroContent = document.getElementById("roteiro-content");

// ---------- BOTÕES ----------

document.getElementById("close-panel").onclick = () => {
    infoPanel.classList.remove("show");
};

document.getElementById("close-roteiro").onclick = () => {
    roteiroPanel.classList.remove("show");
};

document.getElementById("roteiro-btn").onclick = () => {
    atualizarRoteiro();
    roteiroPanel.classList.add("show");
};

// ---------- ÍCONES ----------

const icones = {

    cidade: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25,41],
        iconAnchor: [12,41]
    }),

    hotel: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25,41],
        iconAnchor: [12,41]
    }),

    destino: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25,41],
        iconAnchor: [12,41]
    })

};

// ===========================================
// ATUALIZA PAINEL DO ROTEIRO
// ===========================================

function atualizarRoteiro(){

    if(roteiro.length === 0){

        roteiroContent.innerHTML = `
            <h2>📋 Meu Roteiro</h2>
            <p>Nenhuma parada adicionada.</p>
        `;

        return;

    }

    let html = `
        <h2>📋 Meu Roteiro</h2>
        <ul>
    `;

    roteiro.forEach(item=>{

        html += `
            <li>
                <strong>${item.nome}</strong><br>
                Km ${item.km}
            </li>
        `;

    });

    html += `
        </ul>

        <button id="orcamento-btn">
            Solicitar minha Expedição
        </button>
    `;

    roteiroContent.innerHTML = html;

}

document.getElementById("roteiro-count").textContent = roteiro.length;
