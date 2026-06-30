const map = L.map("map").setView([-16.56, -56.71], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom:19,
        attribution:"© OpenStreetMap"
    }
).addTo(map);

const panel=document.getElementById("info-panel");

const content=document.getElementById("panel-content");

document.getElementById("close-panel").onclick=()=>{
    panel.classList.remove("show");
};
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

locais.forEach(local=>{

    const marker = L.marker(
    [local.lat, local.lng],
    {
        icon: icones[local.tipo]
    }
).addTo(map);

    marker.on("click",()=>{

        content.innerHTML=`
            <h2>${local.nome}</h2>

            <p><strong>Km:</strong> ${local.km}</p>

            <p>${local.descricao}</p>

            <br>

            <button style="padding:12px 18px;border:none;background:#173A2B;color:white;border-radius:8px;">
                Como chegar
            </button>
        `;

        panel.classList.add("show");

    });

});
