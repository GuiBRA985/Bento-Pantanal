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

locais.forEach(local=>{

    const marker=L.marker([local.lat,local.lng]).addTo(map);

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
