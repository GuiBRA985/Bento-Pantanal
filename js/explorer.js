// ===========================================
// PANTANAL EXPLORER 2.0
// Montagem da Expedição Jaguar: 10 dias / 9 noites
// ===========================================

const map = L.map("map").setView([-16.56, -56.71], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
).addTo(map);

const locais = [
    ...cidades,
    ...pousadas,
    ...destinos,
    ...pontes
];

const PORTO_JOFRE_ID = 4;
const MAX_POUSADAS = 2;
const DIAS_POR_PARADA = 3;

const modoMontagem = new URLSearchParams(window.location.search).get("montar") === "1";
const portoJofre = destinos.find(item => item.id === PORTO_JOFRE_ID);

const marcadores = [];
const roteiro = portoJofre
    ? [{ ...portoJofre, fixo: true, dias: DIAS_POR_PARADA }]
    : [];

const infoPanel = document.getElementById("info-panel");
const panelContent = document.getElementById("panel-content");
const roteiroPanel = document.getElementById("roteiro-panel");
const roteiroContent = document.getElementById("roteiro-content");

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
    }),

    portoJofre: L.divIcon({
        className: "porto-jofre-marker",
        html: `
            <div style="
                min-width:82px;
                padding:8px 10px;
                border-radius:18px;
                background:#8b1e1e;
                color:#fff;
                border:3px solid #fff;
                box-shadow:0 4px 12px rgba(0,0,0,.35);
                text-align:center;
                font-weight:800;
                line-height:1.05;
                white-space:nowrap;
            ">
                🐆 Porto Jofre<br>
                <span style="font-size:12px;">3 noites · fixo</span>
            </div>
        `,
        iconSize: [110, 48],
        iconAnchor: [55, 24]
    })
};

function pousadasEscolhidas() {
    return roteiro.filter(item => item.tipo === "hotel");
}

function atualizarContador() {
    const escolhidas = pousadasEscolhidas().length;
    document.getElementById("roteiro-count").textContent = `${escolhidas}/${MAX_POUSADAS}`;
}

function escaparHtml(valor = "") {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function atualizarRoteiro() {
    const escolhidas = pousadasEscolhidas();
    const completo = escolhidas.length === MAX_POUSADAS;

    let html = `
        <h2>🐆 Minha Expedição</h2>

        <div style="
            padding:14px;
            margin:12px 0 18px;
            border-radius:12px;
            background:rgba(23,58,43,.12);
        ">
            <strong>10 dias / 9 noites</strong><br>
            Porto Jofre já está incluído. Escolha mais
            <strong>${MAX_POUSADAS - escolhidas.length}</strong>
            ${MAX_POUSADAS - escolhidas.length === 1 ? "pousada" : "pousadas"}.
        </div>

        <ol style="padding-left:22px;">
    `;

    roteiro.forEach(item => {
        html += `
            <li style="margin-bottom:14px;">
                <strong>${escaparHtml(item.nome)}</strong><br>
                <span>${item.dias || DIAS_POR_PARADA} noites</span>
                ${item.fixo
                    ? `<div style="font-size:12px;opacity:.75;">Parada fixa para observação da onça-pintada.</div>`
                    : `<button
                        onclick="removerDoRoteiro(${item.id})"
                        style="margin-top:6px;"
                      >Remover</button>`
                }
            </li>
        `;
    });

    html += `</ol>`;

    if (!completo) {
        html += `
            <p style="margin-top:18px;">
                Toque nos marcadores verdes do mapa para conhecer e escolher as pousadas.
            </p>
        `;
    } else {
        html += `
            <div style="
                padding:14px;
                margin-top:18px;
                border-radius:12px;
                background:rgba(35,120,70,.16);
            ">
                ✅ Expedição completa: 3 noites em cada parada.
            </div>

            <button id="orcamento-btn" style="width:100%;margin-top:16px;">
                Solicitar minha Expedição
            </button>
        `;
    }

    roteiroContent.innerHTML = html;
    atualizarContador();
}

locais.forEach(local => {
    const ehPortoJofre = local.id === PORTO_JOFRE_ID && local.tipo === "destino";

    const marker = L.marker(
        [local.lat, local.lng],
        {
            icon: ehPortoJofre ? icones.portoJofre : icones[local.tipo]
        }
    ).addTo(map);

    marcadores.push({
        tipo: local.tipo,
        marker,
        local
    });

    marker.on("click", () => {
        abrirPainel(local);
    });
});

function abrirPainel(local) {
    const escolhido = roteiro.some(item => item.id === local.id);
    const limiteAtingido = pousadasEscolhidas().length >= MAX_POUSADAS;

    let botoes = "";

    if (local.site) {
        botoes += `
            <a href="${local.site}" target="_blank" rel="noopener noreferrer">
                <button style="width:100%">
                    🌐 Conhecer a hospedagem
                </button>
            </a>
        `;
    }

    if (local.tipo === "hotel") {
        if (escolhido) {
            botoes += `
                <button
                    style="width:100%"
                    onclick="removerDoRoteiro(${local.id})">
                    ✓ Pousada escolhida — remover
                </button>
            `;
        } else if (limiteAtingido) {
            botoes += `
                <button style="width:100%" disabled>
                    Duas pousadas já escolhidas
                </button>
            `;
        } else {
            botoes += `
                <button
                    style="width:100%"
                    onclick="adicionarAoRoteiro(${local.id})">
                    ➕ Escolher esta pousada por 3 noites
                </button>
            `;
        }
    }

    if (local.id === PORTO_JOFRE_ID) {
        botoes += `
            <button style="width:100%" disabled>
                🐆 Porto Jofre já incluído — 3 noites
            </button>
        `;
    }

    panelContent.innerHTML = `
        <img
            src="${local.foto || "https://placehold.co/900x500?text=Pantanal"}"
            alt="${escaparHtml(local.nome)}"
            style="
                width:100%;
                height:220px;
                object-fit:cover;
                border-radius:12px;
                margin-bottom:20px;
            ">

        <h2>${escaparHtml(local.nome)}</h2>

        <p><strong>Km ${local.km}</strong></p>

        <p>${escaparHtml(local.descricao)}</p>

        ${local.destaque ? `
            <h3>⭐ Destaque</h3>
            <p>${escaparHtml(local.destaque)}</p>
        ` : ""}

        <h3>⏱ Permanência no pacote</h3>
        <p>
            ${local.tipo === "hotel" || local.id === PORTO_JOFRE_ID
                ? "3 noites"
                : escaparHtml(local.tempoIdeal || "Consulta livre")
            }
        </p>

        <div style="
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

function adicionarAoRoteiro(id) {
    const local = pousadas.find(item => item.id === id);

    if (!local) {
        alert("Pousada não encontrada.");
        return;
    }

    if (roteiro.some(item => item.id === id)) {
        alert("Essa pousada já está na expedição.");
        return;
    }

    if (pousadasEscolhidas().length >= MAX_POUSADAS) {
        alert("Você já escolheu as duas pousadas do pacote.");
        return;
    }

    roteiro.splice(roteiro.length - 1, 0, {
        ...local,
        dias: DIAS_POR_PARADA,
        fixo: false
    });

    atualizarRoteiro();
    abrirPainel(local);

    if (pousadasEscolhidas().length === MAX_POUSADAS) {
        infoPanel.classList.remove("show");
        roteiroPanel.classList.add("show");
    } else {
        alert(`${local.nome} escolhida. Agora selecione mais uma pousada.`);
    }
}

function removerDoRoteiro(id) {
    const indice = roteiro.findIndex(item => item.id === id && !item.fixo);

    if (indice === -1) {
        return;
    }

    roteiro.splice(indice, 1);
    atualizarRoteiro();
    infoPanel.classList.remove("show");
}

document.querySelectorAll(".bottom-menu button").forEach(botao => {
    botao.addEventListener("click", () => {
        const tipo = botao.dataset.tipo;

        marcadores.forEach(item => {
            if (tipo === "todos" || item.tipo === tipo) {
                if (!map.hasLayer(item.marker)) {
                    item.marker.addTo(map);
                }
            } else if (map.hasLayer(item.marker)) {
                map.removeLayer(item.marker);
            }
        });
    });
});

document.addEventListener("click", event => {
    if (event.target.id !== "orcamento-btn") {
        return;
    }

    const escolhidas = pousadasEscolhidas();

    if (escolhidas.length !== MAX_POUSADAS) {
        alert("Escolha duas pousadas para completar a expedição.");
        return;
    }

    const resumo = [
        ...escolhidas.map((item, indice) => `${indice + 1}. ${item.nome} — 3 noites`),
        `3. Porto Jofre — 3 noites`
    ].join("\n");

    alert(
`Sua Expedição Jaguar está montada:

${resumo}

Total: 10 dias / 9 noites.

Na próxima etapa serão solicitados os dados do viajante, data de chegada e número de pessoas.`
    );
});

const grupo = L.featureGroup(
    marcadores.map(item => item.marker)
);

if (marcadores.length > 1) {
    map.fitBounds(
        grupo.getBounds(),
        {
            padding: [40, 40]
        }
    );
}

atualizarRoteiro();

if (modoMontagem) {
    setTimeout(() => {
        roteiroPanel.classList.add("show");

        if (portoJofre) {
            map.setView([portoJofre.lat, portoJofre.lng], 10);
        }
    }, 350);
}
