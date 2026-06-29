const map = L.map('map').setView([-16.560, -56.710], 9);

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19,
attribution:'© OpenStreetMap'
}
).addTo(map);

L.marker([-16.560,-56.710])
.addTo(map)
.bindPopup("<b>Poconé</b><br>Início da Transpantaneira.");

L.marker([-16.370,-56.930])
.addTo(map)
.bindPopup("<b>Porto Jofre</b>");
