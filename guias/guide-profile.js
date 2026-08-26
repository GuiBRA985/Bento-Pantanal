(() => {
  const { client, escapeHtml, normalizeWhatsapp, safeImageUrl, safeUrl } = window.PantanalBento;
  const root = document.querySelector("#profile-root");
  const slug = new URLSearchParams(location.search).get("slug") || location.pathname.split("/").filter(Boolean).at(-1);

  const values = (value) => Array.isArray(value) ? value : [];
  const initials = (name = "Guia") => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const tags = (items) => values(items).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("");

  const socialUrl = (value, network) => {
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return safeUrl(value);
    const handle = value.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
    return safeUrl(`https://${network}.com/${handle}`);
  };

  const setMeta = (name, content, property = false) => {
    if (!content) return;
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(property ? "property" : "name", name);
      document.head.append(tag);
    }
    tag.content = content;
  };

  const contactButton = (href, label, className = "") => href
    ? `<a class="button ${className}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : "";

  async function loadProfile() {
    if (!slug || ["perfil", "guias"].includes(slug)) {
      root.innerHTML = '<main class="account-shell"><div class="empty-state">Guia não informado. <a href="/guias/">Voltar à lista</a>.</div></main>';
      return;
    }

    const { data: guide, error } = await client.from("public_guide_profiles").select("*").eq("slug", slug).maybeSingle();
    if (error || !guide) {
      root.innerHTML = '<main class="account-shell"><div class="empty-state"><strong>Guia não encontrado.</strong><br>O perfil pode estar aguardando verificação ou indisponível. <a href="/guias/">Ver guias aprovados</a>.</div></main>';
      return;
    }

    const { data: gallery } = await client.from("guide_gallery").select("image_url,caption,position").eq("guide_id", guide.id).order("position");
    const displayName = guide.nome_profissional || guide.nome;
    const description = (guide.bio || `Conheça ${displayName}, guia profissional no Pantanal.`).slice(0, 180);
    document.title = `${displayName} | Guia verificado — Bento Pantanal`;
    setMeta("description", description);
    setMeta("og:title", `${displayName} | Bento Pantanal`, true);
    setMeta("og:description", description, true);
    setMeta("og:url", location.href, true);
    setMeta("og:image", safeImageUrl(guide.foto_capa) || safeImageUrl(guide.foto_perfil), true);

    const whatsapp = normalizeWhatsapp(guide.whatsapp);
    const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá, ${displayName}! Encontrei seu perfil na Rede de Guias Bento Pantanal e gostaria de conversar sobre uma experiência.`)}` : "";
    const instagram = socialUrl(guide.instagram, "instagram");
    const facebook = socialUrl(guide.facebook, "facebook");
    const website = safeUrl(guide.site);
    const email = guide.email ? `mailto:${encodeURIComponent(guide.email)}` : "";
    const profileImage = safeImageUrl(guide.foto_perfil);
    const coverImage = safeImageUrl(guide.foto_capa);
    const avatar = profileImage
      ? `<img class="profile-avatar" src="${escapeHtml(profileImage)}" alt="Foto de ${escapeHtml(displayName)}">`
      : `<div class="profile-avatar profile-avatar-placeholder">${escapeHtml(initials(displayName))}</div>`;
    const cover = coverImage
      ? `<img class="profile-cover" src="${escapeHtml(coverImage)}" alt="Pantanal fotografado por ${escapeHtml(displayName)}">`
      : '<div class="profile-cover" role="img" aria-label="Paisagem do Pantanal"></div>';

    root.innerHTML = `
      <header class="profile-hero">
        <nav class="site-nav" aria-label="Navegação principal">
          <a class="brand" href="/">BENTO PANTANAL</a>
          <a class="nav-link" href="/guias/">Todos os guias</a>
        </nav>
        ${cover}
      </header>
      <section class="profile-identity">
        ${avatar}
        <div class="profile-heading">
          <span class="eyebrow" style="color:#637068">Guia profissional do Pantanal</span>
          <h1 class="profile-name">${escapeHtml(displayName)}</h1>
          ${guide.nome_profissional && guide.nome_profissional !== guide.nome ? `<p class="profile-subtitle">${escapeHtml(guide.nome)}</p>` : ""}
          <div class="verified-stack">
            <span class="verified-badge">✓ Guia de Turismo Verificado</span>
            <span class="verified-badge">✓ Cadastur verificado</span>
          </div>
        </div>
      </section>
      <main class="profile-layout">
        <div class="profile-main">
          <section class="surface"><h2>Sobre</h2><p>${escapeHtml(guide.bio || "Guia profissional com atuação no Pantanal.")}</p></section>
          <section class="surface"><h2>Idiomas</h2><div class="tag-list">${tags(guide.idiomas)}</div></section>
          <section class="surface"><h2>Especialidades</h2><div class="tag-list">${tags(guide.especialidades)}</div></section>
          <section class="surface"><h2>Região de atuação</h2><div class="tag-list">${tags(guide.regioes)}</div></section>
          ${guide.meu_pantanal ? `<section class="surface"><h2>Meu Pantanal</h2><p>${escapeHtml(guide.meu_pantanal)}</p></section>` : ""}
          <section class="surface">
            <h2>Galeria</h2>
            ${gallery?.length ? `<div class="gallery-grid">${gallery.map((item) => safeImageUrl(item.image_url) ? `<figure class="gallery-item"><img src="${escapeHtml(safeImageUrl(item.image_url))}" alt="${escapeHtml(item.caption || `Experiência com ${displayName}`)}" loading="lazy">${item.caption ? `<figcaption>${escapeHtml(item.caption)}</figcaption>` : ""}</figure>` : "").join("")}</div>` : '<p>Este guia ainda não adicionou fotos à galeria.</p>'}
          </section>
        </div>
        <aside class="surface profile-contact" aria-label="Contato com o guia">
          <h2>Fale diretamente</h2>
          <p>Combine disponibilidade, roteiro e valores com o profissional.</p>
          ${contactButton(whatsappUrl, "Falar com o guia")}
          ${contactButton(instagram, "Instagram")}
          ${contactButton(facebook, "Facebook")}
          ${contactButton(email, "E-mail")}
          ${contactButton(website, "Site")}
          <button class="button button-outline" id="share-profile" type="button">Compartilhar perfil</button>
        </aside>
      </main>
      <footer class="site-footer">Bento Pantanal — Guias locais, experiências autênticas.</footer>`;

    document.querySelector("#share-profile").addEventListener("click", async () => {
      const shareData = { title: document.title, text: description, url: location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (error) { if (error.name !== "AbortError") console.error(error); }
      } else {
        await navigator.clipboard.writeText(location.href);
        document.querySelector("#share-profile").textContent = "Link copiado";
      }
    });
  }

  loadProfile();
})();

