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

// ===========================================
// CRIAÇÃO DOS MARCADORES
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
// ABRIR PAINEL
// ===========================================

function abrirPainel(local){

    let botoes = "";

    if(local.site){

        botoes += `
            <a href="${local.site}" target="_blank">
                <button style="width:100%">
                    🌐 Conhecer a hospedagem
                </button>
            </a>
        `;

    }

    botoes += `
    <a
        href="https://wa.me/5565999999999?text=Olá!%20Quero%20reservar%20uma%20data%20para%20a%20Expedição%20Jaguar%20-%20Porto%20Jofre.%20Vi%20o%20destino%20no%20Pantanal%20Explorer."
        target="_blank">
        <button style="width:100%">
            🐆 Save the date
        </button>
    </a>
`;

    if(local.tipo === "hotel"){

        botoes += `
            <button
                style="width:100%"
                onclick="adicionarAoRoteiro(${local.id})">

                ➕ Adicionar ao roteiro

            </button>
        `;

    }

    panelContent.innerHTML = `

        <img
            src="${local.foto || 'https://placehold.co/900x500?text=Pantanal'}"
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

        ${local.destaque ? `
            <h3>⭐ Destaque</h3>
            <p>${local.destaque}</p>
        ` : ""}

        ${local.tempoIdeal ? `
            <h3>⏱ Permanência recomendada</h3>
            <p>${local.tempoIdeal}</p>
        ` : ""}

        <div
            style="
                display:flex;
                flex-direction:column;
                gap:12px;
                margin-top:25px;
            ">

            ${botoes}

        </div>

    `;

    infoPanel.classList.add("show");

}


// ===========================================
// ADICIONAR AO ROTEIRO
// ===========================================

function adicionarAoRoteiro(id){

    const local = locais.find(item => item.id === id);

    if(!local) return;

    const existe = roteiro.find(item => item.id === id);

    if(existe){

        alert("Essa pousada já está no roteiro.");

        return;

    }

    roteiro.push(local);

    document.getElementById("roteiro-count").textContent = roteiro.length;

    atualizarRoteiro();

    alert(local.nome + " adicionada ao roteiro!");

}

// ===========================================
// FILTROS
// ===========================================

document.querySelectorAll(".bottom-menu button").forEach(botao => {

    botao.addEventListener("click", () => {

        const tipo = botao.dataset.tipo;

        marcadores.forEach(item => {

            if(tipo === "todos"){

                if(!map.hasLayer(item.marker)){
                    item.marker.addTo(map);
                }

                return;

            }

            if(item.tipo === tipo){

                if(!map.hasLayer(item.marker)){
                    item.marker.addTo(map);
                }

            }else{

                if(map.hasLayer(item.marker)){
                    map.removeLayer(item.marker);
                }

            }

        });

    });

});


// ===========================================
// BOTÃO SOLICITAR EXPEDIÇÃO
// ===========================================

document.addEventListener("click",(e)=>{

    if(e.target.id !== "orcamento-btn") return;

    alert(
`Em breve!

A próxima etapa será:

• Dados do viajante

• Número do voo

• Data de chegada

• Objetivo da viagem

• Restrições alimentares

• Idioma

Depois você receberá um roteiro personalizado da Pantanal Selvagem.
`
    );

});


// ===========================================
// AJUSTAR O MAPA PARA TODOS OS PONTOS
// ===========================================

const grupo = L.featureGroup(
    marcadores.map(item => item.marker)
);

if(marcadores.length > 1){

    map.fitBounds(
        grupo.getBounds(),
        {
            padding:[40,40]
        }
    );

}


// ===========================================
// INICIALIZAÇÃO
// ===========================================

document.getElementById("roteiro-count").textContent = roteiro.length;

atualizarRoteiro();
