(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const grid = document.querySelector("#guides-grid");
  const loading = document.querySelector("#guides-loading");
  const count = document.querySelector("#guide-count");
  const search = document.querySelector("#search");
  const language = document.querySelector("#language-filter");
  const region = document.querySelector("#region-filter");
  const specialty = document.querySelector("#specialty-filter");
  let guides = [];

  const VIP_GUIDES = [
    {
      id: "vip-tchaco-pantaneiro",
      slug: "tchaco-pantaneiro",
      nome: "Tchaco Pantaneiro",
      nome_profissional: "Tchaco Pantaneiro",
      bio: "Página profissional exclusiva na Rede de Guias Bento Pantanal.",
      foto_perfil: "",
      foto_capa: "",
      regioes: [],
      idiomas: [],
      especialidades: [],
      cadastur_verificado: true,
      isVip: true,
      externalUrl: "https://www.pantanalwild4you.com.br/"
    },
    {
      id: "vip-jhimy",
      slug: "jhimy",
      nome: "Jhimy",
      nome_profissional: "Jhimy",
      bio: "Página profissional exclusiva na Rede de Guias Bento Pantanal.",
      foto_perfil: "",
      foto_capa: "",
      regioes: [],
      idiomas: [],
      especialidades: [],
      cadastur_verificado: true,
      isVip: true,
      externalUrl: "https://www.pantanaltourexpress.com.br/"
    }
  ];

  function optionValues(field) {
    return [...new Set(guides.flatMap((guide) => P.asArray(guide[field])))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function fillSelect(select, values) {
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function chipList(values, max = 3, gold = false) {
    return P.asArray(values).slice(0, max).map((value) => `<span class="chip${gold ? " chip-gold" : ""}">${P.escapeHTML(value)}</span>`).join("");
  }

  function guideCard(guide) {
    const name = P.displayName(guide);
    const cover = P.safeUrl(guide.foto_capa);
    const photo = P.safeUrl(guide.foto_perfil);
    const regions = P.asArray(guide.regioes);
    const profileUrl = guide.isVip ? P.safeUrl(guide.externalUrl) : P.guidePath(guide.slug);
    const target = guide.isVip ? ' target="_blank" rel="noopener"' : "";
    return `
      <article class="guide-card">
        <div class="guide-card-cover">${cover ? `<img src="${P.escapeHTML(cover)}" alt="" loading="lazy">` : ""}</div>
        <div class="guide-card-body">
          <div class="avatar">${photo ? `<img src="${P.escapeHTML(photo)}" alt="Foto de ${P.escapeHTML(name)}" loading="lazy">` : P.escapeHTML(P.initials(name))}</div>
          <span class="verified-badge${guide.isVip ? " vip-badge" : ""}">${guide.isVip ? "★ Guia VIP" : "✓ Guia verificado"}</span>
          <h3>${P.escapeHTML(name)}</h3>
          <div class="guide-region">${guide.isVip ? "Página profissional exclusiva" : `⌖ ${P.escapeHTML(regions.slice(0, 2).join(" · ") || "Pantanal")}`}</div>
          <div class="chips">${guide.isVip && !P.asArray(guide.idiomas).length ? '<span class="chip chip-gold">Perfil exclusivo</span>' : chipList(guide.idiomas, 3, true)}</div>
          <div class="chips" style="margin-top:8px">${chipList(guide.especialidades, 3)}</div>
          <div class="guide-card-footer">
            <small>${guide.isVip ? "Página VIP ★" : "Cadastur verificado ✓"}</small>
            <a class="button button-small" href="${P.escapeHTML(profileUrl)}"${target} aria-label="Ver perfil de ${P.escapeHTML(name)}">Ver perfil</a>
          </div>
        </div>
      </article>`;
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = guides.filter((guide) => {
      const searchable = [P.displayName(guide), guide.nome, guide.bio, ...P.asArray(guide.idiomas), ...P.asArray(guide.regioes), ...P.asArray(guide.especialidades)].join(" ").toLocaleLowerCase("pt-BR");
      return (!query || searchable.includes(query))
        && (!language.value || P.asArray(guide.idiomas).includes(language.value))
        && (!region.value || P.asArray(guide.regioes).includes(region.value))
        && (!specialty.value || P.asArray(guide.especialidades).includes(specialty.value));
    });

    count.textContent = `${filtered.length} ${filtered.length === 1 ? "profissional encontrado" : "profissionais encontrados"}`;
    grid.innerHTML = filtered.length
      ? filtered.map(guideCard).join("")
      : '<div class="empty-state" style="grid-column:1/-1"><strong>Nenhum guia corresponde aos filtros.</strong>Tente retirar um filtro ou buscar por outra palavra.</div>';
  }

  [language, region, specialty].forEach((element) => element.addEventListener("change", applyFilters));
  search.addEventListener("input", P.debounce(applyFilters));

  try {
    const { data, error } = await P.db.from("public_guide_profiles").select("*").order("nome", { ascending: true });
    if (error) throw error;
    const vipNames = new Set(["tchaco pantaneiro", "chaco pantaneiro", "jhimy", "jhymi"]);
    const regularGuides = (data || []).filter((guide) => !vipNames.has(P.displayName(guide).trim().toLocaleLowerCase("pt-BR")));
    guides = [...VIP_GUIDES, ...regularGuides];
    fillSelect(language, optionValues("idiomas"));
    fillSelect(region, optionValues("regioes"));
    fillSelect(specialty, optionValues("especialidades"));
    applyFilters();
  } catch (error) {
    console.error(error);
    count.textContent = "Não foi possível carregar os profissionais agora.";
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><strong>A rede está temporariamente indisponível.</strong>Tente novamente em alguns instantes.</div>';
  } finally {
    loading.classList.add("hidden");
  }
})();
