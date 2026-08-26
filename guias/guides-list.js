(() => {
  const { client, escapeHtml, safeImageUrl } = window.PantanalBento;
  const grid = document.querySelector("#guide-grid");
  const count = document.querySelector("#results-count");
  const filters = document.querySelector("#guide-filters");
  let guides = [];

  const values = (value) => Array.isArray(value) ? value : [];
  const text = (guide) => [
    guide.nome,
    guide.nome_profissional,
    ...values(guide.idiomas),
    ...values(guide.regioes),
    ...values(guide.especialidades),
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");

  const renderTags = (items, limit = 3) => values(items)
    .slice(0, limit)
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");

  const initials = (name = "Guia") => name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const card = (guide) => {
    const displayName = guide.nome_profissional || guide.nome || "Guia do Pantanal";
    const profileImage = safeImageUrl(guide.foto_perfil);
    const image = profileImage
      ? `<img class="guide-photo" src="${escapeHtml(profileImage)}" alt="Foto de ${escapeHtml(displayName)}" loading="lazy">`
      : `<div class="guide-photo guide-photo-placeholder" aria-hidden="true">${escapeHtml(initials(displayName))}</div>`;
    const verified = guide.cadastur_verificado || /verific|valid/i.test(guide.cadastur_status || "");

    return `
      <article class="guide-card">
        ${image}
        <div class="guide-card-body">
          ${verified ? '<span class="verified-badge">✓ Guia verificado</span>' : ""}
          <h3>${escapeHtml(displayName)}</h3>
          <p>${escapeHtml(values(guide.regioes)[0] || "Pantanal Norte")}</p>
          <div class="tag-list">
            ${renderTags(guide.idiomas, 2)}
            ${renderTags(guide.especialidades, 2)}
          </div>
          <a class="button button-small" href="/guias/perfil/?slug=${encodeURIComponent(guide.slug)}">Ver perfil</a>
        </div>
      </article>`;
  };

  const applyFilters = () => {
    const form = new FormData(filters);
    const search = String(form.get("search") || "").trim().toLocaleLowerCase("pt-BR");
    const language = String(form.get("language") || "");
    const region = String(form.get("region") || "");
    const specialty = String(form.get("specialty") || "");

    const filtered = guides.filter((guide) => (
      (!search || text(guide).includes(search))
      && (!language || values(guide.idiomas).includes(language))
      && (!region || values(guide.regioes).includes(region))
      && (!specialty || values(guide.especialidades).includes(specialty))
    ));

    count.textContent = `${filtered.length} ${filtered.length === 1 ? "guia encontrado" : "guias encontrados"}`;
    grid.innerHTML = filtered.length
      ? filtered.map(card).join("")
      : '<div class="empty-state"><strong>Nenhum guia encontrado.</strong><br>Ajuste os filtros para ampliar a busca.</div>';
  };

  async function loadGuides() {
    let response = await client
      .from("public_guide_profiles")
      .select("*")
      .order("nome", { ascending: true });

    if (response.error) {
      response = await client
        .from("guides")
        .select("id,slug,nome,nome_profissional,bio,idiomas,especialidades,regioes,foto_perfil,cadastur_status,cadastur_verificado,status")
        .in("status", ["approved", "publicado"])
        .order("nome", { ascending: true });
    }

    if (response.error) {
      console.error(response.error);
      grid.innerHTML = '<div class="empty-state"><strong>Não foi possível carregar os guias.</strong><br>Tente novamente em alguns instantes.</div>';
      count.textContent = "Indisponível";
      return;
    }

    guides = response.data || [];
    applyFilters();
  }

  filters.addEventListener("input", applyFilters);
  filters.addEventListener("change", applyFilters);
  loadGuides();
})();

