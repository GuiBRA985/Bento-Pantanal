const map = L.map("map").setView([-16.56, -56.71], 9);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
).addTo(map);

locais.forEach(local => {

    L.marker([local.lat, local.lng])

        .addTo(map)

        .bindPopup(`
            <strong>${local.nome}</strong><br>
            Km ${local.km}<br><br>
            ${local.descricao}
        `);

});
