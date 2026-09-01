(async function () {
  "use strict";
  const P = window.PantanalGuides;
  P.renderOptions();
  const session = await P.requireSession();
  if (!session) return;

  const form = document.querySelector("#guide-dashboard-form");
  const loading = document.querySelector("#dashboard-loading");
  const area = document.querySelector("#dashboard-area");
  const galleryManager = document.querySelector("#gallery-manager");
  let guide = null;
  let gallery = [];

  function field(name) { return form.elements.namedItem(name); }

  function dateLabel(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  function showStatus() {
    document.querySelector("#dashboard-status").innerHTML = P.statusPill(guide.status);
    const copy = {
      pending: "Seu perfil está oculto enquanto o Cadastur e os dados são conferidos.",
      approved: "Seu perfil está publicado na Rede de Guias.",
      rejected: "O cadastro precisa de correções. Entre em contato com a administração.",
      suspended: "O perfil está temporariamente fora da lista pública."
    };
    document.querySelector("#dashboard-status-copy").textContent = copy[guide.status] || copy.pending;
    document.querySelector("#dashboard-cadastur").textContent = guide.cadastur_numero || "Não informado";
    document.querySelector("#dashboard-updated").textContent = dateLabel(guide.updated_at || guide.created_at);
    const preview = document.querySelector("#dashboard-preview");
    preview.classList.toggle("hidden", guide.status !== "approved");
    if (guide.status === "approved") preview.href = P.guidePath(guide.slug);
  }

  function populate() {
    ["nome", "nome_profissional", "cadastur_numero", "whatsapp", "bio", "instagram", "facebook", "email", "site"].forEach((name) => {
      const input = field(name);
      if (input) input.value = guide[name] || "";
    });
    P.setCheckedValues(form, "languages", guide.idiomas);
    P.setCheckedValues(form, "regions", guide.regioes);
    P.setCheckedValues(form, "specialties", guide.especialidades);
    showStatus();
  }

  function renderGallery() {
    galleryManager.innerHTML = gallery.length ? gallery.map((item) => {
      const image = P.safeUrl(item.image_url);
      return image ? `<figure><img src="${P.escapeHTML(image)}" alt="${P.escapeHTML(item.caption || "Foto da galeria")}" loading="lazy"><button type="button" data-remove-gallery="${P.escapeHTML(item.id)}">Remover</button></figure>` : "";
    }).join("") : '<p style="grid-column:1/-1;color:var(--muted)">Nenhuma foto adicionada ainda.</p>';
  }

  async function loadGallery() {
    const { data, error } = await P.db.from("guide_gallery").select("*").eq("guide_id", guide.id).order("position").order("created_at");
    if (error) throw error;
    gallery = data || [];
    renderGallery();
  }

  try {
    const { data, error } = await P.db.from("guides").select("*").eq("user_id", session.user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      location.replace("/guias/cadastro/");
      return;
    }
    guide = data;
    populate();
    await loadGallery();
    loading.classList.add("hidden");
    area.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    loading.textContent = "Não foi possível carregar seu perfil. Atualize a página ou tente mais tarde.";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const save = document.querySelector("#dashboard-save");
    const languages = P.checkedValues(form, "languages");
    const regions = P.checkedValues(form, "regions");
    if (!languages.length || !regions.length) return P.setMessage("#dashboard-message", "Escolha ao menos um idioma e uma região.", "error");
    save.disabled = true;
    P.setMessage("#dashboard-message", "Salvando alterações...");
    try {
      const payload = {
        nome: field("nome").value.trim(),
        nome_profissional: field("nome_profissional").value.trim() || null,
        cadastur_numero: field("cadastur_numero").value.trim(),
        whatsapp: P.normalizePhone(field("whatsapp").value),
        bio: field("bio").value.trim(),
        instagram: field("instagram").value.trim() || null,
        facebook: field("facebook").value.trim() || null,
        email: field("email").value.trim() || session.user.email,
        site: field("site").value.trim() || null,
        idiomas: languages,
        regioes: regions,
        especialidades: P.checkedValues(form, "specialties")
      };
      const profileFile = document.querySelector("#profile-image").files[0];
      const coverFile = document.querySelector("#cover-image").files[0];
      if (profileFile) payload.foto_perfil = (await P.uploadImage(profileFile, session.user.id, "perfil")).url;
      if (coverFile) payload.foto_capa = (await P.uploadImage(coverFile, session.user.id, "capa")).url;

      const { data: updated, error } = await P.db.from("guides").update(payload).eq("id", guide.id).select("*").single();
      if (error) throw error;
      guide = updated;
      showStatus();
      form.reset();
      P.renderOptions(form);
      populate();
      P.setMessage("#dashboard-message", guide.status === "pending" ? "Alterações salvas. O perfil aguarda verificação." : "Alterações salvas com sucesso.", "success");
    } catch (error) {
      console.error(error);
      P.setMessage("#dashboard-message", error.message || "Não foi possível salvar.", "error");
    } finally {
      save.disabled = false;
    }
  });

  document.querySelector("#gallery-upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#gallery-upload");
    const files = [...document.querySelector("#gallery-files").files];
    if (!files.length) return;
    if (files.length > 8) return P.setMessage("#gallery-message", "Envie no máximo 8 fotos por vez.", "error");
    button.disabled = true;
    P.setMessage("#gallery-message", "Enviando fotografias...");
    try {
      const caption = document.querySelector("#gallery-caption").value.trim() || null;
      const rows = [];
      let position = gallery.length ? Math.max(...gallery.map((item) => Number(item.position) || 0)) + 1 : 0;
      for (const file of files) {
        const uploaded = await P.uploadImage(file, session.user.id, "galeria");
        rows.push({ guide_id: String(guide.id), image_url: uploaded.url, storage_path: uploaded.path, caption, position: position++ });
      }
      const { error } = await P.db.from("guide_gallery").insert(rows);
      if (error) throw error;
      event.target.reset();
      await loadGallery();
      P.setMessage("#gallery-message", "Galeria atualizada.", "success");
    } catch (error) {
      console.error(error);
      P.setMessage("#gallery-message", error.message || "Não foi possível enviar as fotos.", "error");
    } finally {
      button.disabled = false;
    }
  });

  galleryManager.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-remove-gallery]");
    if (!button) return;
    const item = gallery.find((entry) => String(entry.id) === button.dataset.removeGallery);
    if (!item || !confirm("Remover esta foto da galeria?")) return;
    button.disabled = true;
    try {
      const { error } = await P.db.from("guide_gallery").delete().eq("id", item.id);
      if (error) throw error;
      if (item.storage_path) await P.db.storage.from("guide-media").remove([item.storage_path]);
      await loadGallery();
    } catch (error) {
      P.setMessage("#gallery-message", error.message || "Não foi possível remover a foto.", "error");
      button.disabled = false;
    }
  });

  document.querySelector("#dashboard-signout").addEventListener("click", async () => {
    await P.db.auth.signOut();
    location.replace("/guias/login/");
  });
})();
