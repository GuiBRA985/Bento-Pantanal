// ===========================================
// PANTANAL EXPLORER 1.0
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


// ---------- DADOS ----------

const roteiro = [];

const marcadores = [];

const locais = [

    ...cidades,

    ...pousadas,

    ...destinos,

    ...pontes

];

// ---------- ÍCONES ----------

const icones = {

    cidade: L.icon({

        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",

        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

        iconSize: [25, 41],

        iconAnchor: [12, 41]

    }),

    hotel: L.icon({

        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

        iconSize: [25, 41],

        iconAnchor: [12, 41]

    }),

    destino: L.icon({

        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

        iconSize: [25, 41],

        iconAnchor: [12, 41]

    })

};


// ===========================================
// FUNÇÕES
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

        <p><strong>Paradas escolhidas:</strong></p>

        <ul>

    `;

    roteiro.forEach(item=>{

        html += `<li>${item.nome}</li>`;

    });

    html += `

        </ul>

        <br>

        <button id="orcamento-btn">

        Solicitar minha Expedição

        </button>

    `;

    roteiroContent.innerHTML = html;

}

// ===========================================
// MARCADORES
// ===========================================

locais.forEach(local => {

    const marker = L.marker(
        [local.lat, local.lng],
        {
            icon: icones[local.tipo]
        }
    ).addTo(map);

    marcadores.push({
        tipo: local.tipo,
        marker: marker,
        local: local
    });

    marker.on("click", () => {

        abrirPainel(local);

    });

});


// ===========================================
// ABRIR PAINEL DA POUSADA
// ===========================================

function abrirPainel(local){

    panelContent.innerHTML = `

    <img
        src="${local.foto || 'https://placehold.co/800x450'}"
        style="
            width:100%;
            height:220px;
            object-fit:cover;
            border-radius:12px;
            margin-bottom:20px;
        ">

    <h2>${local.nome}</h2>

    <p><strong>Km ${local.km}</strong></p>

    <p>${local.descricao}</p>

    <div style="display:flex;flex-direction:column;gap:12px;margin-top:25px;">

        <a
            href="${local.site || '#'}"
            target="_blank">

            <button style="width:100%">
                🌐 Conhecer a hospedagem
            </button>

        </a>

        <button
            style="width:100%"
            onclick="adicionarAoRoteiro('${local.id}')">

            ➕ Adicionar ao roteiro

        </button>

    </div>

    `;

    infoPanel.classList.add("show");

}


// ===========================================
// ADICIONAR AO ROTEIRO
// ===========================================

function adicionarAoRoteiro(id){

    const local = locais.find(item => item.id == id);

    if(!local) return;

    const existe = roteiro.find(item => item.id == id);

    if(existe){

        alert("Esta parada já foi adicionada.");

        return;

    }

    roteiro.push(local);

    document.getElementById("roteiro-count").textContent = roteiro.length;

    alert(local.nome + " adicionada ao roteiro!");

}


// ===========================================
// FILTROS
// ===========================================

document.querySelectorAll(".bottom-menu button").forEach(botao => {

    botao.addEventListener("click", () => {

        const tipo = botao.dataset.tipo;

        marcadores.forEach(item => {

            if (tipo === "todos") {

                if (!map.hasLayer(item.marker)) {
                    item.marker.addTo(map);
                }

                return;

            }

            if (item.tipo === tipo) {

                if (!map.hasLayer(item.marker)) {
                    item.marker.addTo(map);
                }

            } else {

                if (map.hasLayer(item.marker)) {
                    map.removeLayer(item.marker);
                }

            }

        });

    });

});


// ===========================================
// BOTÃO SOLICITAR EXPEDIÇÃO
// ===========================================

document.addEventListener("click", function(e){

    if(e.target.id !== "orcamento-btn") return;

    alert(
`Pantanal Explorer

Na próxima versão será aberta a página:

Solicitar minha Expedição

com:

• dados pessoais
• voo
• idioma
• objetivo da viagem
• restrições alimentares

`
    );

});


// ===========================================
// INICIALIZAÇÃO
// ===========================================

document.getElementById("roteiro-count").textContent = roteiro.length;
