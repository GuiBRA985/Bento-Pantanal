const map = L.map("map").setView([-16.56, -56.71], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
).addTo(map);

// Painel lateral
const panel = document.getElementById("info-panel");
const content = document.getElementById("panel-content");

document.getElementById("close-panel").onclick = () => {
    panel.classList.remove("show");
};

// Ícones
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

// Lista de marcadores
const marcadores = [];

// Cria todos os marcadores
locais.forEach(local => {

    const marker = L.marker(
        [local.lat, local.lng],
        {
            icon: icones[local.tipo]
        }
    ).addTo(map);

    marcadores.push({
        tipo: local.tipo,
        marker: marker
    });

    marker.on("click", () => {

        content.innerHTML = `

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

<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:25px;">

<a href="${local.site || '#'}" target="_blank">
<button>🌐 Site</button>
</a>

<a href="https://wa.me/${local.whatsapp || ''}" target="_blank">
<button>📱 WhatsApp</button>
</a>

<button onclick="adicionarRoteiro('${local.id}')">
➕ Adicionar ao roteiro
</button>

</div>

`;

        panel.classList.add("show");

    });

});

// Filtros inferiores
document.querySelectorAll(".bottom-menu button").forEach(botao => {

    botao.addEventListener("click", () => {

        const tipo = botao.dataset.tipo;

        marcadores.forEach(item => {

            if (tipo === "todos" || item.tipo === tipo) {

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
