(async function () {
  "use strict";
  const P = window.PantanalGuides;
  const slug = P.currentGuideSlug();
  const loading = document.querySelector("#profile-loading");
  const errorBox = document.querySelector("#profile-error");
  const view = document.querySelector("#profile-view");

  function addImage(container, src, alt) {
    const url = P.safeUrl(src);
    if (!url) return false;
    const image = document.createElement("img");
    image.src = url;
    image.alt = alt;
    container.append(image);
    return true;
  }

  function socialUrl(value, base) {
    if (!value) return "";
    const direct = P.safeUrl(value);
    if (direct) return direct;
    const handle = String(value).replace(/^@/, "").trim();
    return handle ? `${base}${encodeURIComponent(handle)}` : "";
  }

  function addContact(container, label, href, primary = false) {
    if (!href) return false;
    const link = document.createElement("a");
    link.className = `button ${primary ? "button-primary" : "button-outline"}`;
    link.href = href;
    link.textContent = label;
    if (!href.startsWith("mailto:")) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    container.append(link);
    return true;
  }

  function updateMeta(guide, name) {
    const canonical = `${location.origin}${P.guidePath(guide.slug)}`;
    document.title = `${name} | Guia verificado no Pantanal`;
    document.querySelector("#canonical-link")?.setAttribute("href", canonical);
    const description = (guide.bio || `${name}, guia de turismo verificado no Pantanal.`).slice(0, 180);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${name} | Bento Pantanal`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    const image = P.safeUrl(guide.foto_capa || guide.foto_perfil);
    if (image) document.querySelector('meta[property="og:image"]')?.setAttribute("content", image);
  }

  if (!slug) {
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
    return;
  }

  try {
    const { data: guide, error } = await P.db.from("public_guide_profiles").select("*").eq("slug", slug).maybeSingle();
    if (error || !guide) throw error || new Error("Perfil não encontrado");

    const name = P.displayName(guide);
    updateMeta(guide, name);
    document.querySelector("#profile-name").textContent = name;
    document.querySelector("#profile-regions").textContent = P.asArray(guide.regioes).join(" · ") || "Pantanal Mato-Grossense";
    document.querySelector("#profile-bio").textContent = guide.bio || "Profissional local do Pantanal.";

    const profileBadge = document.querySelector("#profile-badge");
    if (guide.vip) {
      profileBadge.textContent = "★ Guia VIP";
      profileBadge.classList.add("vip-badge");
    }

    const avatar = document.querySelector("#profile-avatar");
    if (!addImage(avatar, guide.foto_perfil, `Foto de ${name}`)) avatar.textContent = P.initials(name);
    addImage(document.querySelector("#profile-cover"), guide.foto_capa, `Paisagem de capa de ${name}`);

    const phone = P.normalizePhone(guide.whatsapp);
    const whatsapp = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Olá, ${name}! Encontrei seu perfil na Rede de Guias Bento Pantanal.`)}` : "";
    const topContact = document.querySelector("#profile-whatsapp-top");
    if (whatsapp) topContact.href = whatsapp; else topContact.classList.add("hidden");

    const contacts = document.querySelector("#profile-contacts");
    addContact(contacts, "Falar pelo WhatsApp", whatsapp, true);
    addContact(contacts, "Instagram", socialUrl(guide.instagram, "https://instagram.com/"));
    if (!contacts.children.length) {
      const notice = document.createElement("p");
      notice.textContent = "Os contatos deste guia serão adicionados em breve.";
      contacts.append(notice);
    }

    if (guide.vip) {
      const vipActions = document.querySelector("#profile-vip-actions");
      const personalDomain = document.querySelector("#profile-personal-domain");
      const domain = P.safeUrl(guide.personal_domain || guide.site);
      if (domain) personalDomain.href = domain; else personalDomain.classList.add("hidden");
      const expedition = document.querySelector("#profile-expedition");
      expedition.href = `/?guia=${encodeURIComponent(guide.slug)}#expedicao`;
      expedition.classList.toggle("hidden", !guide.expedition_leader);
      vipActions.classList.remove("hidden");
    }

    document.querySelector("#share-profile").addEventListener("click", async () => {
      const share = { title: `${name} | Bento Pantanal`, text: `Conheça o perfil profissional de ${name}.`, url: `${location.origin}${P.guidePath(guide.slug)}` };
      try {
        if (navigator.share) await navigator.share(share);
        else {
          await navigator.clipboard.writeText(share.url);
          document.querySelector("#share-profile").textContent = "Link copiado ✓";
        }
      } catch (shareError) {
        if (shareError.name !== "AbortError") console.error(shareError);
      }
    });

    loading.classList.add("hidden");
    view.classList.remove("hidden");
  } catch (profileError) {
    console.error(profileError);
    loading.classList.add("hidden");
    errorBox.classList.remove("hidden");
  }
})();
